import type { Pool } from "mysql2/promise"
import type { Incidencia, EstadoIncidencia, SeveridadIncidencia, IncidenciaWithEmpresa } from "@/lib/types"
import type { EmpresaId } from "@/lib/db"
import { getPool, getConfiguredEmpresaIds, EMPRESA_IDS } from "@/lib/db"
import { getNombreUsuarioById, getDefaultUsuarioId } from "./usuarios"
import { timed, withTimeout, getEmpresaQueryTimeoutMs } from "./timing"
import { getCachedIf } from "./cache"

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
  reportado_nombre?: string
}

async function resolveIncidenciaRow(pool: Pool, row: IncidenciaRow): Promise<Incidencia> {
  const nombre =
    row.reportado_por_id != null
      ? await getNombreUsuarioById(pool, row.reportado_por_id)
      : null
  const severidadNombre = row.severidad_id
    ? await getCatalogoNombreById(pool, "cat_severidades", row.severidad_id)
    : null
  const estadoNombre = await getCatalogoNombreById(pool, "cat_estados_incidencia", row.estado_id)
  return {
    id: String(row.id),
    equipo_id: row.equipo_id != null ? String(row.equipo_id) : null,
    sucursal_id: String(row.sucursal_id),
    quien_reporta: nombre ?? (row.reportado_por_id != null ? String(row.reportado_por_id) : null),
    fecha_reporte: row.fecha_reporte != null ? (typeof row.fecha_reporte === "string" ? row.fecha_reporte : String(row.fecha_reporte)) : "",
    descripcion: row.descripcion,
    severidad: (severidadNombre as SeveridadIncidencia) ?? null,
    estado: (estadoNombre as EstadoIncidencia) ?? "Reportada",
    notas: row.notas ?? null,
    created_at: row.created_at != null ? String(row.created_at) : "",
  }
}

async function getCatalogoNombreById(
  pool: Pool,
  tabla: string,
  id: number
): Promise<string | null> {
  const [rows] = await pool.query<{ nombre: string }[]>(`SELECT nombre FROM ${tabla} WHERE id = ?`, [id])
  const arr = Array.isArray(rows) ? rows : []
  return arr[0]?.nombre ?? null
}

const INCIDENCIA_SELECT = `
  SELECT i.id, i.equipo_id, i.sucursal_id, i.reportado_por_id, i.fecha_reporte, i.descripcion,
         i.severidad_id, i.estado_id, i.notas, i.created_at
  FROM incidencias i
`

export async function getIncidencias(pool: Pool): Promise<Incidencia[]> {
  const [rows] = await pool.query<IncidenciaRow[]>(
    `${INCIDENCIA_SELECT} ORDER BY i.fecha_reporte DESC, i.id DESC`
  )
  const arr = Array.isArray(rows) ? rows : []
  return Promise.all(arr.map((r) => resolveIncidenciaRow(pool, r)))
}

export async function getIncidenciasByEquipoId(pool: Pool, equipoId: string): Promise<Incidencia[]> {
  const [rows] = await pool.query<IncidenciaRow[]>(
    `${INCIDENCIA_SELECT} WHERE i.equipo_id = ? ORDER BY i.fecha_reporte DESC, i.id DESC`,
    [equipoId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return Promise.all(arr.map((r) => resolveIncidenciaRow(pool, r)))
}

export async function getIncidenciasBySucursalId(pool: Pool, sucursalId: string): Promise<Incidencia[]> {
  const [rows] = await pool.query<IncidenciaRow[]>(
    `${INCIDENCIA_SELECT} WHERE i.sucursal_id = ? ORDER BY i.fecha_reporte DESC, i.id DESC`,
    [sucursalId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return Promise.all(arr.map((r) => resolveIncidenciaRow(pool, r)))
}

export async function getIncidenciaById(pool: Pool, incidenciaId: string): Promise<Incidencia | null> {
  const [rows] = await pool.query<IncidenciaRow[]>(`${INCIDENCIA_SELECT} WHERE i.id = ?`, [incidenciaId])
  const arr = Array.isArray(rows) ? rows : []
  const row = arr[0]
  return row ? resolveIncidenciaRow(pool, row) : null
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
  if (estadoId == null) throw new Error("Estado de incidencia no encontrado")
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
async function getIncidenciasAllBasesUncached(): Promise<{
  data: IncidenciaWithEmpresa[]
  shouldCache: boolean
}> {
  const ids = getConfiguredEmpresaIds()
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
  return getCachedIf("incidenciasAllBases", getIncidenciasAllBasesUncached)
}

/** Parsea id compuesto (emp-1-42) o numérico. */
function parseIncidenciaId(id: string): { empresaId?: EmpresaId; numericId: string } {
  const lastDash = id.lastIndexOf("-")
  if (lastDash > 0 && id.startsWith("emp-")) {
    const empresaId = id.slice(0, lastDash) as EmpresaId
    const numericId = id.slice(lastDash + 1)
    if (EMPRESA_IDS.includes(empresaId) && numericId) return { empresaId, numericId }
  }
  return { numericId: id }
}

/** Busca una incidencia por id (compuesto o numérico en todas las bases). */
export async function findIncidenciaInAllBases(
  id: string
): Promise<{ incidencia: Incidencia; pool: Pool; empresaId: EmpresaId } | null> {
  const { empresaId: onlyEmpresa, numericId } = parseIncidenciaId(id)
  const idsToTry = onlyEmpresa ? [onlyEmpresa] : getConfiguredEmpresaIds()
  for (const empresaId of idsToTry) {
    const pool = await getPool(empresaId)
    const inc = await getIncidenciaById(pool, numericId)
    if (inc) return { incidencia: inc, pool, empresaId }
  }
  return null
}
