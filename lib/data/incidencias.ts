import type { Pool } from "mysql2/promise"
import { ClientError } from "@/lib/client-error"
import type { Incidencia, EstadoIncidencia, SeveridadIncidencia, IncidenciaWithEmpresa } from "@/lib/types"
import type { EmpresaId } from "@/lib/db"
import { getPool, getEmpresaIdsForDataLayer, getEmpresaIdsToSearch } from "@/lib/db"
import { parseId } from "./ids"
import { getDefaultUsuarioId } from "./usuarios"
import { timed, withTimeout, getEmpresaQueryTimeoutMs } from "./timing"
import { getCachedIf, cacheKeyForEmpresas } from "./cache"

type IncidenciaRow = {
  id: number
  equipo_id: number | null
  sucursal_id: number
  reportado_por_id: number | null
  fecha_reporte: string
  descripcion: string
  severidad_id: number | null
  estado_id: number
  notas: string | null
  created_at: unknown
  reportado_nombre: string | null
  severidad_nombre: string | null
  estado_nombre: string | null
}

function mapIncidenciaRow(row: IncidenciaRow): Incidencia {
  return {
    id: String(row.id),
    equipo_id: row.equipo_id != null ? String(row.equipo_id) : null,
    sucursal_id: String(row.sucursal_id),
    quien_reporta: row.reportado_nombre ?? (row.reportado_por_id != null ? String(row.reportado_por_id) : null),
    fecha_reporte: row.fecha_reporte != null ? (typeof row.fecha_reporte === "string" ? row.fecha_reporte : String(row.fecha_reporte)) : "",
    descripcion: row.descripcion,
    severidad: (row.severidad_nombre as SeveridadIncidencia) ?? null,
    estado: (row.estado_nombre as EstadoIncidencia) ?? "Reportada",
    notas: row.notas ?? null,
    created_at: row.created_at != null ? String(row.created_at) : "",
  }
}

const INCIDENCIA_SELECT = `
  SELECT i.id, i.equipo_id, i.sucursal_id, i.reportado_por_id, i.fecha_reporte, i.descripcion,
         i.severidad_id, i.estado_id, i.notas, i.created_at,
         NULLIF(TRIM(u.nombre), '') AS reportado_nombre,
         sev.nombre AS severidad_nombre,
         est.nombre AS estado_nombre
  FROM incidencias i
  LEFT JOIN usuarios u ON u.id = i.reportado_por_id
  LEFT JOIN cat_severidades sev ON sev.id = i.severidad_id
  LEFT JOIN cat_estados_incidencia est ON est.id = i.estado_id
`

async function queryIncidencias(pool: Pool, where: string, params: unknown[] = []): Promise<Incidencia[]> {
  const [rows] = await pool.query<IncidenciaRow[]>(
    `${INCIDENCIA_SELECT} ${where} ORDER BY i.fecha_reporte DESC, i.id DESC`,
    params
  )
  return (Array.isArray(rows) ? rows : []).map(mapIncidenciaRow)
}

export async function getIncidencias(pool: Pool): Promise<Incidencia[]> {
  return queryIncidencias(pool, "")
}

export async function getIncidenciasByEquipoId(pool: Pool, equipoId: string): Promise<Incidencia[]> {
  return queryIncidencias(pool, "WHERE i.equipo_id = ?", [equipoId])
}

export async function getIncidenciasBySucursalId(pool: Pool, sucursalId: string): Promise<Incidencia[]> {
  return queryIncidencias(pool, "WHERE i.sucursal_id = ?", [sucursalId])
}

export async function getIncidenciaById(pool: Pool, incidenciaId: string): Promise<Incidencia | null> {
  const list = await queryIncidencias(pool, "WHERE i.id = ?", [incidenciaId])
  return list[0] ?? null
}

export async function crearIncidencia(
  pool: Pool,
  data: {
    sucursal_id: string
    equipo_id: string | null
    /** Si no se pasa, se asigna el usuario por defecto (quien registra). */
    reportado_por_id?: number | null
    fecha_reporte: string
    descripcion: string
    severidad: Incidencia["severidad"]
    estado: Incidencia["estado"]
    notas: string | null
  }
): Promise<Incidencia> {
  const reportadoPorId =
    data.reportado_por_id != null ? data.reportado_por_id : await getDefaultUsuarioId(pool)
  const [estadoRows] = await pool.query<{ id: number }[]>(
    "SELECT id FROM cat_estados_incidencia WHERE nombre = ?",
    [data.estado]
  )
  const estadoId = Array.isArray(estadoRows) && estadoRows[0] ? estadoRows[0].id : null
  if (estadoId == null) throw new ClientError("Estado de incidencia no encontrado")
  let severidadId: number | null = null
  if (data.severidad) {
    const [sevRows] = await pool.query<{ id: number }[]>("SELECT id FROM cat_severidades WHERE nombre = ?", [data.severidad])
    severidadId = Array.isArray(sevRows) && sevRows[0] ? sevRows[0].id : null
  }
  const [result] = await pool.query<{ insertId: number }>(
    `INSERT INTO incidencias (equipo_id, sucursal_id, reportado_por_id, fecha_reporte, descripcion, severidad_id, estado_id, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.equipo_id || null,
      data.sucursal_id,
      reportadoPorId,
      data.fecha_reporte,
      data.descripcion,
      severidadId,
      estadoId,
      data.notas ?? null,
    ]
  )
  const insertId = (result as unknown as { insertId: number }).insertId
  const inc = await getIncidenciaById(pool, String(insertId))
  if (!inc) throw new Error("No se pudo leer la incidencia creada")
  return inc
}

export type { IncidenciaWithEmpresa } from "@/lib/types"

/** Lista incidencias de todas las bases (sin cache). En paralelo por empresa; timeout por empresa; si hubo timeout no se cachea. */
async function getIncidenciasAllBasesUncached(ids: EmpresaId[]): Promise<{
  data: IncidenciaWithEmpresa[]
  shouldCache: boolean
}> {
  const timeoutMs = getEmpresaQueryTimeoutMs()
  let hadTimeout = false
  const arrays = await Promise.all(
    ids.map((empresaId) =>
      timed(
        `getIncidenciasAllBases(${empresaId})`,
        () =>
          withTimeout(
            timeoutMs,
            `getIncidencias(${empresaId})`,
            async () => {
              const pool = await getPool(empresaId)
              const list = await getIncidencias(pool)
              return list.map((inc) => ({
                ...inc,
                id: `${empresaId}-${inc.id}`,
                empresa_id: empresaId,
              }))
            },
            [],
            () => {
              hadTimeout = true
            }
          )
      )
    )
  )
  return { data: arrays.flat(), shouldCache: !hadTimeout }
}

/** Lista incidencias de todas las bases. Cache 60 s cuando todas las empresas respondieron; paralelo + timeout por empresa. */
export async function getIncidenciasAllBases(): Promise<IncidenciaWithEmpresa[]> {
  const ids = await getEmpresaIdsForDataLayer()
  return getCachedIf(cacheKeyForEmpresas("incidenciasAllBases", ids), () => getIncidenciasAllBasesUncached(ids))
}

/** Busca una incidencia por id (compuesto o numérico en todas las bases). */
export async function findIncidenciaInAllBases(
  id: string
): Promise<{ incidencia: Incidencia; pool: Pool; empresaId: EmpresaId } | null> {
  const { empresaId: onlyEmpresa, numericId } = parseId(id, "recurso")
  const idsToTry = await getEmpresaIdsToSearch(onlyEmpresa)
  for (const empresaId of idsToTry) {
    const pool = await getPool(empresaId)
    const inc = await getIncidenciaById(pool, numericId)
    if (inc) return { incidencia: inc, pool, empresaId }
  }
  return null
}
