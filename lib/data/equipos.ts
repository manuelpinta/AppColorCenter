import type { Pool } from "mysql2/promise"
import type { Equipo } from "@/lib/types"
import { getPool, getEmpresaIdsForDataLayer, EMPRESA_IDS, clearPool } from "@/lib/db"
import type { EmpresaId } from "@/lib/db"
import { buildEquipoCompositeId as buildEquipoCompositeIdImpl, parseEquipoId as parseEquipoIdImpl } from "./ids"
import { timed, withTimeout, getEmpresaQueryTimeoutMs } from "./timing"
import { getCachedIf } from "./cache"

export class EquipoValidationError extends Error {
  field: string
  constructor(field: string, message: string) {
    super(message)
    this.name = "EquipoValidationError"
    this.field = field
  }
}

type EquipoRow = {
  id: number
  sucursal_id: number
  tipo_equipo: string
  marca: string | null
  modelo: string | null
  numero_serie: string | null
  fecha_compra: string | null
  tipo_propiedad: string
  arrendador: string | null
  fecha_vencimiento_arrendamiento: string | null
  estado: string
  ultima_calibracion: string | null
  proxima_revision: string | null
  codigo_qr: string | null
  foto_url: string | null
  documentos_url: string | null
  notas: string | null
  created_at: unknown
  updated_at: unknown
}

type EquipoInput = {
  color_center_id: number
  tipo_equipo?: Equipo["tipo_equipo"]
  tipo_equipo_id?: number | null
  marca?: string | null
  marca_id?: number | null
  modelo?: string | null
  modelo_id?: number | null
  numero_serie?: string | null
  fecha_compra?: string | null
  tipo_propiedad: Equipo["tipo_propiedad"]
  arrendador?: string | null
  arrendador_id?: number | null
  fecha_vencimiento_arrendamiento?: string | null
  estado: Equipo["estado"]
  ultima_calibracion?: string | null
  proxima_revision?: string | null
  notas?: string | null
  equipo_ups_id?: number | null
  equipo_regulador_id?: number | null
  equipo_impresora_id?: number | null
}

async function resolveTipoId(pool: Pool, data: { tipo_equipo?: string; tipo_equipo_id?: number | null }): Promise<number> {
  if (typeof data.tipo_equipo_id === "number" && data.tipo_equipo_id > 0) return data.tipo_equipo_id
  if (data.tipo_equipo) {
    const [r] = await pool.query<{ id: number }[]>("SELECT id FROM cat_tipos_equipo WHERE nombre = ?", [data.tipo_equipo])
    const tid = Array.isArray(r) && r[0] ? r[0].id : null
    if (tid != null) return tid
  }
  throw new EquipoValidationError("tipo_equipo_id", "Tipo de equipo no encontrado")
}

async function resolveMarcaId(pool: Pool, data: { marca?: string | null; marca_id?: number | null }): Promise<number> {
  if (typeof data.marca_id === "number" && data.marca_id > 0) return data.marca_id
  if (data.marca) {
    const [r] = await pool.query<{ id: number }[]>("SELECT id FROM marcas_equipo WHERE nombre = ?", [data.marca])
    const mid = Array.isArray(r) && r[0] ? r[0].id : null
    if (mid != null) return mid
  }
  throw new EquipoValidationError("marca_id", "Marca no encontrada")
}

async function resolveModeloId(pool: Pool, data: { modelo?: string | null; modelo_id?: number | null; marca_id: number }): Promise<number> {
  if (typeof data.modelo_id === "number" && data.modelo_id > 0) {
    const [r] = await pool.query<{ id: number }[]>(
      "SELECT id FROM modelos_equipo WHERE id = ? AND marca_id = ?",
      [data.modelo_id, data.marca_id]
    )
    const found = Array.isArray(r) && r[0] ? r[0].id : null
    if (found != null) return found
    throw new EquipoValidationError("modelo_id", "El modelo no pertenece a la marca seleccionada")
  }
  if (data.modelo) {
    const [r] = await pool.query<{ id: number }[]>(
      "SELECT id FROM modelos_equipo WHERE nombre = ? AND marca_id = ?",
      [data.modelo, data.marca_id]
    )
    const found = Array.isArray(r) && r[0] ? r[0].id : null
    if (found != null) return found
  }
  throw new EquipoValidationError("modelo_id", "Modelo no encontrado para la marca seleccionada")
}

async function ensureMarcaTipo(pool: Pool, marcaId: number, tipoEquipoId: number): Promise<void> {
  const [r] = await pool.query<{ ok: number }[]>(
    "SELECT 1 AS ok FROM marca_tipo_equipo WHERE marca_id = ? AND tipo_equipo_id = ? AND activo = 1 LIMIT 1",
    [marcaId, tipoEquipoId]
  )
  if (!(Array.isArray(r) && r[0])) {
    throw new EquipoValidationError("marca_id", "La marca no está habilitada para el tipo de equipo seleccionado")
  }
}

function mapEquipoRow(row: EquipoRow): Equipo {
  return {
    id: String(row.id),
    color_center_id: String(row.sucursal_id),
    tipo_equipo: row.tipo_equipo as Equipo["tipo_equipo"],
    marca: row.marca ?? null,
    modelo: row.modelo ?? null,
    numero_serie: row.numero_serie ?? null,
    fecha_compra: row.fecha_compra ?? null,
    tipo_propiedad: row.tipo_propiedad as Equipo["tipo_propiedad"],
    arrendador: row.arrendador ?? null,
    fecha_vencimiento_arrendamiento: row.fecha_vencimiento_arrendamiento ?? null,
    estado: row.estado as Equipo["estado"],
    ultima_calibracion: row.ultima_calibracion ?? null,
    proxima_revision: row.proxima_revision ?? null,
    codigo_qr: row.codigo_qr ?? null,
    foto_url: row.foto_url ?? null,
    documentos_url: row.documentos_url ?? null,
    notas: row.notas ?? null,
    created_at: row.created_at != null ? String(row.created_at) : "",
    updated_at: row.updated_at != null ? String(row.updated_at) : "",
  }
}

const EQUIPO_SELECT = `
  SELECT e.id, e.sucursal_id, e.numero_serie, e.fecha_compra, e.fecha_vencimiento_arrendamiento,
         e.ultima_calibracion, e.proxima_revision, e.codigo_qr, e.foto_url, e.documentos_url, e.notas,
         e.created_at, e.updated_at,
         te.nombre AS tipo_equipo, m.nombre AS marca, mo.nombre AS modelo,
         tp.nombre AS tipo_propiedad, a.nombre AS arrendador, ee.nombre AS estado
  FROM equipos e
  JOIN cat_tipos_equipo te ON te.id = e.tipo_equipo_id
  LEFT JOIN marcas_equipo m ON m.id = e.marca_id
  LEFT JOIN modelos_equipo mo ON mo.id = e.modelo_id
  JOIN cat_tipos_propiedad tp ON tp.id = e.tipo_propiedad_id
  LEFT JOIN arrendadores a ON a.id = e.arrendador_id
  JOIN cat_estados_equipo ee ON ee.id = e.estado_id
`

export async function getEquiposBySucursal(pool: Pool, sucursalId: string): Promise<Equipo[]> {
  const [rows] = await pool.query<EquipoRow[]>(`${EQUIPO_SELECT} WHERE e.sucursal_id = ? ORDER BY e.id`, [sucursalId])
  const arr = Array.isArray(rows) ? rows : []
  return arr.map(mapEquipoRow)
}

export async function getEquipos(pool: Pool): Promise<Equipo[]> {
  const [rows] = await pool.query<EquipoRow[]>(`${EQUIPO_SELECT} ORDER BY e.id`)
  const arr = Array.isArray(rows) ? rows : []
  return arr.map(mapEquipoRow)
}

export async function getEquipoById(pool: Pool, equipoId: string): Promise<Equipo | null> {
  const [rows] = await pool.query<EquipoRow[]>(`${EQUIPO_SELECT} WHERE e.id = ?`, [equipoId])
  const arr = Array.isArray(rows) ? rows : []
  const row = arr[0]
  return row ? mapEquipoRow(row) : null
}

/** Re-export para uso en servidor. */
export const buildEquipoCompositeId = buildEquipoCompositeIdImpl
export const parseEquipoId = parseEquipoIdImpl

export type { EquipoWithEmpresa } from "@/lib/types"

/** Lista equipos de todas las bases (sin cache). Timeout por empresa; reintento por empresa si ECONNRESET. Si hubo timeout, no cachear. */
async function getEquiposAllBasesUncached(): Promise<{ data: EquipoWithEmpresa[]; shouldCache: boolean }> {
  const ids = await getEmpresaIdsForDataLayer()
  const timeoutMs = getEmpresaQueryTimeoutMs()
  let hadTimeout = false
  const arrays = await Promise.all(
    ids.map((empresaId) =>
      timed(
        `getEquiposAllBases(${empresaId})`,
        () =>
          withTimeout(
            timeoutMs,
            `getEquipos(${empresaId})`,
            async () => {
              let pool = await getPool(empresaId)
              let equipos: Equipo[]
              try {
                equipos = await getEquipos(pool)
              } catch (err) {
                const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : undefined
                if (code === "ECONNRESET") {
                  clearPool(empresaId)
                  pool = await getPool(empresaId)
                  equipos = await getEquipos(pool)
                } else {
                  throw err
                }
              }
              return equipos.map((e) => ({
                ...e,
                id: buildEquipoCompositeId(empresaId, e),
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

/** Lista equipos de una sola base (una empresa). Para vistas por empresa sin consultar el resto. */
export async function getEquiposByEmpresa(empresaId: EmpresaId): Promise<EquipoWithEmpresa[]> {
  const pool = await getPool(empresaId)
  const equipos = await getEquipos(pool)
  return equipos.map((e) => ({
    ...e,
    id: buildEquipoCompositeId(empresaId, e),
    empresa_id: empresaId,
  }))
}

/** Lista equipos de todas las bases con id compuesto y empresa_id. Cache corto solo cuando todas las empresas respondieron. */
export async function getEquiposAllBases(): Promise<EquipoWithEmpresa[]> {
  return getCachedIf("equiposAllBases", getEquiposAllBasesUncached)
}

/** Busca un equipo por id en todas las bases. Acepta id numérico o compuesto (emp-1-42). */
export async function findEquipoInAllBases(
  equipoId: string
): Promise<{ equipo: Equipo; pool: Pool; empresaId: EmpresaId } | null> {
  const { empresaId: onlyEmpresa, numericId } = parseEquipoId(equipoId)
  const idsToTry = onlyEmpresa ? [onlyEmpresa] : await getEmpresaIdsForDataLayer()
  for (const empresaId of idsToTry) {
    const pool = await getPool(empresaId)
    const equipo = await getEquipoById(pool, numericId)
    if (equipo) return { equipo, pool, empresaId }
  }
  return null
}

/** Actualiza equipo. Solo campos presentes en data. */
export async function actualizarEquipo(
  pool: Pool,
  equipoId: string,
  data: Partial<Omit<EquipoInput, "color_center_id" | "tipo_propiedad" | "estado">> & {
    color_center_id?: number | string
    tipo_propiedad?: Equipo["tipo_propiedad"]
    estado?: Equipo["estado"]
  }
): Promise<Equipo> {
  const equipo = await getEquipoById(pool, equipoId)
  if (!equipo) throw new Error("Equipo no encontrado")

  const updates: string[] = []
  const values: unknown[] = []

  if (data.color_center_id !== undefined) {
    updates.push("sucursal_id = ?")
    values.push(data.color_center_id)
  }
  if (data.numero_serie !== undefined) {
    updates.push("numero_serie = ?")
    values.push(data.numero_serie)
  }
  if (data.fecha_compra !== undefined) {
    updates.push("fecha_compra = ?")
    values.push(data.fecha_compra || null)
  }
  if (data.fecha_vencimiento_arrendamiento !== undefined) {
    updates.push("fecha_vencimiento_arrendamiento = ?")
    values.push(data.fecha_vencimiento_arrendamiento || null)
  }
  if (data.ultima_calibracion !== undefined) {
    updates.push("ultima_calibracion = ?")
    values.push(data.ultima_calibracion || null)
  }
  if (data.proxima_revision !== undefined) {
    updates.push("proxima_revision = ?")
    values.push(data.proxima_revision || null)
  }
  if (data.notas !== undefined) {
    updates.push("notas = ?")
    values.push(data.notas || null)
  }
  if (data.foto_url !== undefined) {
    updates.push("foto_url = ?")
    values.push(data.foto_url || null)
  }

  let nextTipoId: number | null = null
  if (data.tipo_equipo !== undefined || data.tipo_equipo_id !== undefined) {
    nextTipoId = await resolveTipoId(pool, {
      tipo_equipo: data.tipo_equipo,
      tipo_equipo_id: data.tipo_equipo_id ?? null,
    })
    updates.push("tipo_equipo_id = ?")
    values.push(nextTipoId)
  }
  if (data.estado !== undefined) {
    const [r] = await pool.query<{ id: number }[]>("SELECT id FROM cat_estados_equipo WHERE nombre = ?", [data.estado])
    const eid = Array.isArray(r) && r[0] ? r[0].id : null
    if (eid != null) {
      updates.push("estado_id = ?")
      values.push(eid)
    }
  }
  if (data.tipo_propiedad !== undefined) {
    const [r] = await pool.query<{ id: number }[]>("SELECT id FROM cat_tipos_propiedad WHERE nombre = ?", [data.tipo_propiedad])
    const pid = Array.isArray(r) && r[0] ? r[0].id : null
    if (pid != null) {
      updates.push("tipo_propiedad_id = ?")
      values.push(pid)
    }
  }
  let nextMarcaId: number | null = null
  if (data.marca !== undefined || data.marca_id !== undefined) {
    nextMarcaId = await resolveMarcaId(pool, { marca: data.marca ?? null, marca_id: data.marca_id ?? null })
    const tipoForMarca = nextTipoId ?? (
      await resolveTipoId(pool, { tipo_equipo: equipo.tipo_equipo, tipo_equipo_id: null })
    )
    await ensureMarcaTipo(pool, nextMarcaId, tipoForMarca)
    updates.push("marca_id = ?")
    values.push(nextMarcaId)
    if (data.modelo === undefined && data.modelo_id === undefined) {
      updates.push("modelo_id = NULL")
    }
  }
  if (data.modelo !== undefined || data.modelo_id !== undefined) {
    const markaId = nextMarcaId ?? (
      await resolveMarcaId(pool, { marca: equipo.marca, marca_id: null })
    )
    const modeloId = await resolveModeloId(pool, {
      modelo: data.modelo ?? null,
      modelo_id: data.modelo_id ?? null,
      marca_id: markaId,
    })
    updates.push("modelo_id = ?")
    values.push(modeloId)
  }
  if (data.arrendador !== undefined) {
    if (data.arrendador) {
      const [r] = await pool.query<{ id: number }[]>("SELECT id FROM arrendadores WHERE nombre = ?", [data.arrendador])
      const aid = Array.isArray(r) && r[0] ? r[0].id : null
      updates.push("arrendador_id = ?")
      values.push(aid)
    } else {
      updates.push("arrendador_id = NULL")
    }
  }
  if (data.equipo_ups_id !== undefined) {
    updates.push("equipo_ups_id = ?")
    values.push(data.equipo_ups_id || null)
  }
  if (data.equipo_regulador_id !== undefined) {
    updates.push("equipo_regulador_id = ?")
    values.push(data.equipo_regulador_id || null)
  }
  if (data.equipo_impresora_id !== undefined) {
    updates.push("equipo_impresora_id = ?")
    values.push(data.equipo_impresora_id || null)
  }

  if (updates.length === 0) return equipo
  values.push(equipoId)
  await pool.query(`UPDATE equipos SET ${updates.join(", ")} WHERE id = ?`, values)
  const updated = await getEquipoById(pool, equipoId)
  return updated ?? equipo
}

/** Crea un equipo en la base. Requiere sucursal_id (numérico), tipo_equipo, tipo_propiedad, estado. */
export async function crearEquipo(
  pool: Pool,
  data: EquipoInput
): Promise<Equipo> {
  const tipo_equipo_id = await resolveTipoId(pool, {
    tipo_equipo: data.tipo_equipo,
    tipo_equipo_id: data.tipo_equipo_id ?? null,
  })

  const [er] = await pool.query<{ id: number }[]>("SELECT id FROM cat_estados_equipo WHERE nombre = ?", [data.estado])
  const estado_id = Array.isArray(er) && er[0] ? er[0].id : null
  if (estado_id == null) throw new Error("Estado de equipo no encontrado")

  const [pr] = await pool.query<{ id: number }[]>("SELECT id FROM cat_tipos_propiedad WHERE nombre = ?", [data.tipo_propiedad])
  const tipo_propiedad_id = Array.isArray(pr) && pr[0] ? pr[0].id : null
  if (tipo_propiedad_id == null) throw new Error("Tipo de propiedad no encontrado")

  const marca_id = await resolveMarcaId(pool, { marca: data.marca ?? null, marca_id: data.marca_id ?? null })
  await ensureMarcaTipo(pool, marca_id, tipo_equipo_id)
  const modelo_id = await resolveModeloId(pool, {
    modelo: data.modelo ?? null,
    modelo_id: data.modelo_id ?? null,
    marca_id,
  })

  let arrendador_id: number | null = null
  if (data.arrendador) {
    const [ar] = await pool.query<{ id: number }[]>("SELECT id FROM arrendadores WHERE nombre = ?", [data.arrendador])
    arrendador_id = Array.isArray(ar) && ar[0] ? ar[0].id : null
  }

  const [result] = await pool.query<{ insertId: number }>(
    `INSERT INTO equipos (
      sucursal_id, tipo_equipo_id, marca_id, modelo_id, numero_serie, fecha_compra,
      tipo_propiedad_id, arrendador_id, fecha_vencimiento_arrendamiento, estado_id,
      ultima_calibracion, proxima_revision, notas, equipo_ups_id, equipo_regulador_id, equipo_impresora_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(data.color_center_id),
      tipo_equipo_id,
      marca_id,
      modelo_id,
      data.numero_serie ?? null,
      data.fecha_compra || null,
      tipo_propiedad_id,
      arrendador_id,
      data.fecha_vencimiento_arrendamiento || null,
      estado_id,
      data.ultima_calibracion || null,
      data.proxima_revision || null,
      data.notas ?? null,
      data.equipo_ups_id ?? null,
      data.equipo_regulador_id ?? null,
      data.equipo_impresora_id ?? null,
    ]
  )
  const insertId = (result as unknown as { insertId: number }).insertId
  const equipo = await getEquipoById(pool, String(insertId))
  if (!equipo) throw new Error("No se pudo leer el equipo creado")
  return equipo
}
