import type { Pool } from "mysql2/promise"
import type { Mantenimiento, MantenimientoWithEmpresa } from "@/lib/types"
import type { EmpresaId } from "@/lib/db"
import { getPool, getEmpresaIdsForDataLayer, EMPRESA_IDS, clearPool } from "@/lib/db"
import { getNombreUsuarioById } from "./usuarios"
import { timed, withTimeout, getEmpresaQueryTimeoutMs } from "./timing"
import { getCachedIf } from "./cache"

type MantenimientoRow = {
  id: number
  equipo_id: number
  incidencia_id: number | null
  tipo_id: number
  realizado_por: string | null
  tecnico_id: number | null
  fecha_mantenimiento: string
  descripcion: string
  piezas_cambiadas: string | null
  tiempo_fuera_servicio: number | null
  costo: number | null
  estado_id: number
  notas: string | null
  created_at: unknown
  updated_at: unknown
}

const schemaCapabilitiesCache = new WeakMap<Pool, { realizadoPorColumn: boolean }>()

async function getSchemaCapabilities(pool: Pool): Promise<{ realizadoPorColumn: boolean }> {
  const cached = schemaCapabilitiesCache.get(pool)
  if (cached) return cached

  try {
    const [rows] = await pool.query<{ cnt: number }[]>(
      "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mantenimientos' AND COLUMN_NAME = 'realizado_por'"
    )
    const arr = Array.isArray(rows) ? rows : []
    const caps = { realizadoPorColumn: Number(arr[0]?.cnt ?? 0) > 0 }
    schemaCapabilitiesCache.set(pool, caps)
    return caps
  } catch {
    const fallback = { realizadoPorColumn: false }
    schemaCapabilitiesCache.set(pool, fallback)
    return fallback
  }
}

async function getCatalogoNombreById(pool: Pool, tabla: string, id: number): Promise<string | null> {
  const [rows] = await pool.query<{ nombre: string }[]>(`SELECT nombre FROM ${tabla} WHERE id = ?`, [id])
  const arr = Array.isArray(rows) ? rows : []
  return arr[0]?.nombre ?? null
}

async function resolveMantenimientoRow(pool: Pool, row: MantenimientoRow): Promise<Mantenimiento> {
  const tecnicoNombre =
    row.tecnico_id != null ? await getNombreUsuarioById(pool, row.tecnico_id) : null
  const tipoNombre = await getCatalogoNombreById(pool, "cat_tipos_mantenimiento", row.tipo_id)
  const estadoNombre = await getCatalogoNombreById(pool, "cat_estados_mantenimiento", row.estado_id)
  const realizadoPor =
    row.realizado_por === "Externo" || row.realizado_por === "Interno"
      ? row.realizado_por
      : "Interno"
  return {
    id: String(row.id),
    equipo_id: String(row.equipo_id),
    incidencia_id: row.incidencia_id != null ? String(row.incidencia_id) : null,
    tipo: (tipoNombre as Mantenimiento["tipo"]) ?? "Correctivo",
    realizado_por: realizadoPor,
    tecnico_responsable: tecnicoNombre ?? (row.tecnico_id != null ? String(row.tecnico_id) : null),
    fecha_mantenimiento: row.fecha_mantenimiento != null ? (typeof row.fecha_mantenimiento === "string" ? row.fecha_mantenimiento : String(row.fecha_mantenimiento)) : "",
    descripcion: row.descripcion,
    piezas_cambiadas: row.piezas_cambiadas ?? null,
    tiempo_fuera_servicio: row.tiempo_fuera_servicio != null ? Number(row.tiempo_fuera_servicio) : null,
    costo: row.costo != null ? Number(row.costo) : null,
    estado: (estadoNombre as Mantenimiento["estado"]) ?? "Pendiente",
    notas: row.notas ?? null,
    created_at: row.created_at != null ? String(row.created_at) : "",
    updated_at: row.updated_at != null ? String(row.updated_at) : "",
  }
}

async function buildMantenimientoSelect(pool: Pool): Promise<string> {
  const caps = await getSchemaCapabilities(pool)
  const realizadoPorSql = caps.realizadoPorColumn ? "m.realizado_por" : "'Interno'"
  return `
    SELECT m.id, m.equipo_id, m.incidencia_id, m.tipo_id,
           ${realizadoPorSql} AS realizado_por,
           m.tecnico_id, m.fecha_mantenimiento,
           m.descripcion, m.piezas_cambiadas, m.tiempo_fuera_servicio, m.costo, m.estado_id, m.notas,
           m.created_at, m.updated_at
    FROM mantenimientos m
  `
}

export async function getMantenimientos(pool: Pool): Promise<Mantenimiento[]> {
  const MANT_SELECT = await buildMantenimientoSelect(pool)
  const [rows] = await pool.query<MantenimientoRow[]>(
    `${MANT_SELECT} ORDER BY m.fecha_mantenimiento DESC, m.id DESC`
  )
  const arr = Array.isArray(rows) ? rows : []
  return Promise.all(arr.map((r) => resolveMantenimientoRow(pool, r)))
}

export async function getMantenimientosByIncidenciaId(
  pool: Pool,
  incidenciaId: string
): Promise<Mantenimiento[]> {
  const MANT_SELECT = await buildMantenimientoSelect(pool)
  const [rows] = await pool.query<MantenimientoRow[]>(
    `${MANT_SELECT} WHERE m.incidencia_id = ? ORDER BY m.fecha_mantenimiento DESC, m.id DESC`,
    [incidenciaId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return Promise.all(arr.map((r) => resolveMantenimientoRow(pool, r)))
}

export async function getMantenimientosByEquipoId(pool: Pool, equipoId: string): Promise<Mantenimiento[]> {
  const MANT_SELECT = await buildMantenimientoSelect(pool)
  const [rows] = await pool.query<MantenimientoRow[]>(
    `${MANT_SELECT} WHERE m.equipo_id = ? ORDER BY m.fecha_mantenimiento DESC, m.id DESC`,
    [equipoId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return Promise.all(arr.map((r) => resolveMantenimientoRow(pool, r)))
}

export async function getMantenimientoById(pool: Pool, mantenimientoId: string): Promise<Mantenimiento | null> {
  const MANT_SELECT = await buildMantenimientoSelect(pool)
  const [rows] = await pool.query<MantenimientoRow[]>(`${MANT_SELECT} WHERE m.id = ?`, [mantenimientoId])
  const arr = Array.isArray(rows) ? rows : []
  const row = arr[0]
  return row ? resolveMantenimientoRow(pool, row) : null
}

export async function crearMantenimiento(
  pool: Pool,
  data: {
    equipo_id: string
    incidencia_id?: string | null
    tipo: Mantenimiento["tipo"]
    realizado_por: Mantenimiento["realizado_por"]
    tecnico_id?: number | null
    fecha_mantenimiento: string
    descripcion: string
    piezas_cambiadas?: string | null
    tiempo_fuera_servicio?: number | null
    costo?: number | null
    estado: Mantenimiento["estado"]
    notas?: string | null
  }
): Promise<Mantenimiento> {
  const [tipoRows] = await pool.query<{ id: number }[]>(
    "SELECT id FROM cat_tipos_mantenimiento WHERE nombre = ?",
    [data.tipo]
  )
  const tipoId = Array.isArray(tipoRows) && tipoRows[0] ? tipoRows[0].id : null
  if (tipoId == null) throw new Error("Tipo de mantenimiento no encontrado")

  const [estadoRows] = await pool.query<{ id: number }[]>(
    "SELECT id FROM cat_estados_mantenimiento WHERE nombre = ?",
    [data.estado]
  )
  const estadoId = Array.isArray(estadoRows) && estadoRows[0] ? estadoRows[0].id : null
  if (estadoId == null) throw new Error("Estado de mantenimiento no encontrado")

  const caps = await getSchemaCapabilities(pool)
  const tecnicoId = data.realizado_por === "Externo" ? null : (data.tecnico_id ?? null)

  let insertId: number
  if (caps.realizadoPorColumn) {
    const [result] = await pool.query<{ insertId: number }>(
      `INSERT INTO mantenimientos (
        equipo_id, incidencia_id, tipo_id, realizado_por, tecnico_id, fecha_mantenimiento,
        descripcion, piezas_cambiadas, tiempo_fuera_servicio, costo, estado_id, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(data.equipo_id),
        data.incidencia_id ? Number(data.incidencia_id) : null,
        tipoId,
        data.realizado_por,
        tecnicoId,
        data.fecha_mantenimiento,
        data.descripcion,
        data.piezas_cambiadas ?? null,
        data.tiempo_fuera_servicio ?? null,
        data.costo ?? null,
        estadoId,
        data.notas ?? null,
      ]
    )
    insertId = (result as unknown as { insertId: number }).insertId
  } else {
    const [result] = await pool.query<{ insertId: number }>(
      `INSERT INTO mantenimientos (
        equipo_id, incidencia_id, tipo_id, tecnico_id, fecha_mantenimiento,
        descripcion, piezas_cambiadas, tiempo_fuera_servicio, costo, estado_id, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(data.equipo_id),
        data.incidencia_id ? Number(data.incidencia_id) : null,
        tipoId,
        tecnicoId,
        data.fecha_mantenimiento,
        data.descripcion,
        data.piezas_cambiadas ?? null,
        data.tiempo_fuera_servicio ?? null,
        data.costo ?? null,
        estadoId,
        data.notas ?? null,
      ]
    )
    insertId = (result as unknown as { insertId: number }).insertId
  }

  const mantenimiento = await getMantenimientoById(pool, String(insertId))
  if (!mantenimiento) throw new Error("No se pudo leer el mantenimiento creado")
  return mantenimiento
}

export async function actualizarMantenimiento(
  pool: Pool,
  mantenimientoId: string,
  data: Partial<{
    incidencia_id: string | null
    tipo: Mantenimiento["tipo"]
    realizado_por: Mantenimiento["realizado_por"]
    tecnico_id: number | null
    fecha_mantenimiento: string
    descripcion: string
    piezas_cambiadas: string | null
    tiempo_fuera_servicio: number | null
    costo: number | null
    estado: Mantenimiento["estado"]
    notas: string | null
  }>
): Promise<Mantenimiento> {
  const updates: string[] = []
  const values: unknown[] = []
  const caps = await getSchemaCapabilities(pool)

  if (data.incidencia_id !== undefined) {
    updates.push("incidencia_id = ?")
    values.push(data.incidencia_id ? Number(data.incidencia_id) : null)
  }

  if (data.tipo !== undefined) {
    const [rows] = await pool.query<{ id: number }[]>("SELECT id FROM cat_tipos_mantenimiento WHERE nombre = ?", [data.tipo])
    const id = Array.isArray(rows) && rows[0] ? rows[0].id : null
    if (id == null) throw new Error("Tipo de mantenimiento no encontrado")
    updates.push("tipo_id = ?")
    values.push(id)
  }

  if (data.estado !== undefined) {
    const [rows] = await pool.query<{ id: number }[]>("SELECT id FROM cat_estados_mantenimiento WHERE nombre = ?", [data.estado])
    const id = Array.isArray(rows) && rows[0] ? rows[0].id : null
    if (id == null) throw new Error("Estado de mantenimiento no encontrado")
    updates.push("estado_id = ?")
    values.push(id)
  }

  if (caps.realizadoPorColumn && data.realizado_por !== undefined) {
    updates.push("realizado_por = ?")
    values.push(data.realizado_por)
  }

  if (data.tecnico_id !== undefined) {
    updates.push("tecnico_id = ?")
    values.push(data.tecnico_id)
  }
  if (data.fecha_mantenimiento !== undefined) {
    updates.push("fecha_mantenimiento = ?")
    values.push(data.fecha_mantenimiento)
  }
  if (data.descripcion !== undefined) {
    updates.push("descripcion = ?")
    values.push(data.descripcion)
  }
  if (data.piezas_cambiadas !== undefined) {
    updates.push("piezas_cambiadas = ?")
    values.push(data.piezas_cambiadas)
  }
  if (data.tiempo_fuera_servicio !== undefined) {
    updates.push("tiempo_fuera_servicio = ?")
    values.push(data.tiempo_fuera_servicio)
  }
  if (data.costo !== undefined) {
    updates.push("costo = ?")
    values.push(data.costo)
  }
  if (data.notas !== undefined) {
    updates.push("notas = ?")
    values.push(data.notas)
  }

  if (updates.length > 0) {
    values.push(Number(mantenimientoId))
    await pool.query(`UPDATE mantenimientos SET ${updates.join(", ")} WHERE id = ?`, values)
  }

  const mantenimiento = await getMantenimientoById(pool, mantenimientoId)
  if (!mantenimiento) throw new Error("Mantenimiento no encontrado")
  return mantenimiento
}

export type { MantenimientoWithEmpresa } from "@/lib/types"

/** Lista mantenimientos de todas las bases (sin cache). En paralelo por empresa; timeout por empresa; si hubo timeout no se cachea. */
async function getMantenimientosAllBasesUncached(): Promise<{
  data: MantenimientoWithEmpresa[]
  shouldCache: boolean
}> {
  const ids = await getEmpresaIdsForDataLayer()
  const timeoutMs = getEmpresaQueryTimeoutMs()
  let hadTimeout = false
  const arrays = await Promise.all(
    ids.map((empresaId) =>
      timed(
        `getMantenimientosAllBases(${empresaId})`,
        () =>
          withTimeout(
            timeoutMs,
            `getMantenimientos(${empresaId})`,
            async () => {
              let pool = await getPool(empresaId)
              let list: Mantenimiento[]
              try {
                list = await getMantenimientos(pool)
              } catch (err) {
                const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : undefined
                if (code === "ECONNRESET") {
                  clearPool(empresaId)
                  pool = await getPool(empresaId)
                  list = await getMantenimientos(pool)
                } else {
                  throw err
                }
              }
              return list.map((m) => ({
                ...m,
                id: `${empresaId}-${m.id}`,
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

/** Lista mantenimientos de todas las bases. Cache 60 s cuando todas las empresas respondieron; paralelo + timeout por empresa. */
export async function getMantenimientosAllBases(): Promise<MantenimientoWithEmpresa[]> {
  return getCachedIf("mantenimientosAllBases", getMantenimientosAllBasesUncached)
}

function parseMantenimientoId(id: string): { empresaId?: EmpresaId; numericId: string } {
  const lastDash = id.lastIndexOf("-")
  if (lastDash > 0 && id.startsWith("emp-")) {
    const empresaId = id.slice(0, lastDash) as EmpresaId
    const numericId = id.slice(lastDash + 1)
    if (EMPRESA_IDS.includes(empresaId) && numericId) return { empresaId, numericId }
  }
  return { numericId: id }
}

export async function findMantenimientoInAllBases(
  id: string
): Promise<{ mantenimiento: Mantenimiento; pool: Pool; empresaId: EmpresaId } | null> {
  const { empresaId: onlyEmpresa, numericId } = parseMantenimientoId(id)
  const idsToTry = onlyEmpresa ? [onlyEmpresa] : await getEmpresaIdsForDataLayer()
  for (const empresaId of idsToTry) {
    const pool = await getPool(empresaId)
    const mant = await getMantenimientoById(pool, numericId)
    if (mant) return { mantenimiento: mant, pool, empresaId }
  }
  return null
}
