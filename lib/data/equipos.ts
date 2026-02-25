import type { Pool } from "mysql2/promise"
import type { Equipo } from "@/lib/types"
import { getPool, getConfiguredEmpresaIds, EMPRESA_IDS, clearPool } from "@/lib/db"
import type { EmpresaId } from "@/lib/db"
import { buildEquipoCompositeId as buildEquipoCompositeIdImpl, parseEquipoId as parseEquipoIdImpl } from "./ids"
import { timed, withTimeout, getEmpresaQueryTimeoutMs } from "./timing"
import { getCachedIf } from "./cache"

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
  const ids = getConfiguredEmpresaIds()
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
  const idsToTry = onlyEmpresa ? [onlyEmpresa] : getConfiguredEmpresaIds()
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
  data: Partial<Omit<Equipo, "id" | "created_at">>
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

  if (data.tipo_equipo !== undefined) {
    const [r] = await pool.query<{ id: number }[]>("SELECT id FROM cat_tipos_equipo WHERE nombre = ?", [data.tipo_equipo])
    const tid = Array.isArray(r) && r[0] ? r[0].id : null
    if (tid != null) {
      updates.push("tipo_equipo_id = ?")
      values.push(tid)
    }
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
  if (data.marca !== undefined) {
    if (data.marca) {
      const [r] = await pool.query<{ id: number }[]>("SELECT id FROM marcas_equipo WHERE nombre = ?", [data.marca])
      const mid = Array.isArray(r) && r[0] ? r[0].id : null
      updates.push("marca_id = ?")
      values.push(mid)
    } else {
      updates.push("marca_id = NULL")
    }
  }
  if (data.modelo !== undefined) {
    if (data.modelo && data.marca) {
      const [r] = await pool.query<{ id: number }[]>(
        "SELECT mo.id FROM modelos_equipo mo JOIN marcas_equipo m ON m.id = mo.marca_id WHERE mo.nombre = ? AND m.nombre = ?",
        [data.modelo, data.marca]
      )
      const mid = Array.isArray(r) && r[0] ? r[0].id : null
      updates.push("modelo_id = ?")
      values.push(mid)
    } else {
      updates.push("modelo_id = NULL")
    }
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

  if (updates.length === 0) return equipo
  values.push(equipoId)
  await pool.query(`UPDATE equipos SET ${updates.join(", ")} WHERE id = ?`, values)
  const updated = await getEquipoById(pool, equipoId)
  return updated ?? equipo
}

/** Crea un equipo en la base. Requiere sucursal_id (numérico), tipo_equipo, tipo_propiedad, estado. */
export async function crearEquipo(
  pool: Pool,
  data: {
    color_center_id: number
    tipo_equipo: Equipo["tipo_equipo"]
    marca?: string | null
    modelo?: string | null
    numero_serie?: string | null
    fecha_compra?: string | null
    tipo_propiedad: Equipo["tipo_propiedad"]
    arrendador?: string | null
    fecha_vencimiento_arrendamiento?: string | null
    estado: Equipo["estado"]
    ultima_calibracion?: string | null
    proxima_revision?: string | null
    notas?: string | null
  }
): Promise<Equipo> {
  const [tr] = await pool.query<{ id: number }[]>("SELECT id FROM cat_tipos_equipo WHERE nombre = ?", [data.tipo_equipo])
  const tipo_equipo_id = Array.isArray(tr) && tr[0] ? tr[0].id : null
  if (tipo_equipo_id == null) throw new Error("Tipo de equipo no encontrado")

  const [er] = await pool.query<{ id: number }[]>("SELECT id FROM cat_estados_equipo WHERE nombre = ?", [data.estado])
  const estado_id = Array.isArray(er) && er[0] ? er[0].id : null
  if (estado_id == null) throw new Error("Estado de equipo no encontrado")

  const [pr] = await pool.query<{ id: number }[]>("SELECT id FROM cat_tipos_propiedad WHERE nombre = ?", [data.tipo_propiedad])
  const tipo_propiedad_id = Array.isArray(pr) && pr[0] ? pr[0].id : null
  if (tipo_propiedad_id == null) throw new Error("Tipo de propiedad no encontrado")

  let marca_id: number | null = null
  if (data.marca) {
    const [mr] = await pool.query<{ id: number }[]>("SELECT id FROM marcas_equipo WHERE nombre = ?", [data.marca])
    marca_id = Array.isArray(mr) && mr[0] ? mr[0].id : null
  }

  let modelo_id: number | null = null
  if (data.modelo && data.marca) {
    const [mor] = await pool.query<{ id: number }[]>(
      "SELECT mo.id FROM modelos_equipo mo JOIN marcas_equipo m ON m.id = mo.marca_id WHERE mo.nombre = ? AND m.nombre = ?",
      [data.modelo, data.marca]
    )
    modelo_id = Array.isArray(mor) && mor[0] ? mor[0].id : null
  }

  let arrendador_id: number | null = null
  if (data.arrendador) {
    const [ar] = await pool.query<{ id: number }[]>("SELECT id FROM arrendadores WHERE nombre = ?", [data.arrendador])
    arrendador_id = Array.isArray(ar) && ar[0] ? ar[0].id : null
  }

  const [result] = await pool.query<{ insertId: number }>(
    `INSERT INTO equipos (
      sucursal_id, tipo_equipo_id, marca_id, modelo_id, numero_serie, fecha_compra,
      tipo_propiedad_id, arrendador_id, fecha_vencimiento_arrendamiento, estado_id,
      ultima_calibracion, proxima_revision, notas
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ]
  )
  const insertId = (result as unknown as { insertId: number }).insertId
  const equipo = await getEquipoById(pool, String(insertId))
  if (!equipo) throw new Error("No se pudo leer el equipo creado")
  return equipo
}
