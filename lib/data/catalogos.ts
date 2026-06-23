import type { Pool } from "mysql2/promise"
import { rowToApp, rowsToApp } from "./helpers"

type MarcaTipoRow = { marca_id: number; tipo_equipo_id: number }

/** Lee nombres de un catálogo (activos). */
export async function getCatalogoNombres(
  pool: Pool,
  tabla: "cat_tipos_equipo" | "cat_estados_equipo" | "cat_estados_sucursal" | "cat_estados_incidencia" | "cat_estados_mantenimiento" | "cat_severidades" | "cat_tipos_mantenimiento" | "cat_tipos_propiedad"
): Promise<{ id: number; nombre: string }[]> {
  const [rows] = await pool.query<{ id: number; nombre: string }[]>(
    `SELECT id, nombre FROM ${tabla} WHERE activo = 1 ORDER BY nombre`
  )
  return Array.isArray(rows) ? rows : []
}

/** Tipos de equipo para el formulario (nombres). */
export async function getTiposEquipo(pool: Pool): Promise<string[]> {
  const rows = await getCatalogoNombres(pool, "cat_tipos_equipo")
  return rows.map((r) => r.nombre)
}

/** Marcas de equipo (id, nombre) para combobox. */
export async function getMarcasEquipo(pool: Pool): Promise<{ id: string; nombre: string }[]> {
  const [rows] = await pool.query<{ id: number; nombre: string }[]>(
    "SELECT id, nombre FROM marcas_equipo WHERE activo = 1 ORDER BY nombre"
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), nombre: r.nombre }))
}

function mapMarcaRows(rows: { id: number; nombre: string }[]): { id: string; nombre: string }[] {
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), nombre: r.nombre }))
}

/** Marcas activas filtradas por tipo de equipo (id y/o nombre del tipo). */
export async function getMarcasEquipoByTipo(
  pool: Pool,
  tipoEquipoId: string,
  tipoEquipoNombre?: string
): Promise<{ id: string; nombre: string }[]> {
  const [byIdRows] = await pool.query<{ id: number; nombre: string }[]>(
    `SELECT m.id, m.nombre
     FROM marcas_equipo m
     JOIN marca_tipo_equipo mt ON mt.marca_id = m.id
     WHERE m.activo = 1 AND mt.activo = 1 AND mt.tipo_equipo_id = ?
     ORDER BY m.nombre`,
    [tipoEquipoId]
  )
  const byId = mapMarcaRows(byIdRows)
  if (byId.length > 0) return byId

  if (tipoEquipoNombre) {
    const [byNombreRows] = await pool.query<{ id: number; nombre: string }[]>(
      `SELECT m.id, m.nombre
       FROM marcas_equipo m
       JOIN marca_tipo_equipo mt ON mt.marca_id = m.id
       JOIN cat_tipos_equipo te ON te.id = mt.tipo_equipo_id
       WHERE m.activo = 1 AND mt.activo = 1 AND te.nombre = ?
       ORDER BY m.nombre`,
      [tipoEquipoNombre]
    )
    const byNombre = mapMarcaRows(byNombreRows)
    if (byNombre.length > 0) return byNombre
  }

  const [historicRows] = await pool.query<{ id: number; nombre: string }[]>(
    `SELECT DISTINCT m.id, m.nombre
     FROM marcas_equipo m
     JOIN equipos e ON e.marca_id = m.id
     WHERE m.activo = 1 AND e.tipo_equipo_id = ?
     ORDER BY m.nombre`,
    [tipoEquipoId]
  )
  return mapMarcaRows(historicRows)
}

/** Modelos por marca. */
export async function getModelosByMarca(
  pool: Pool,
  marcaId: string
): Promise<{ id: string; marca_id: string; nombre: string }[]> {
  const [rows] = await pool.query<{ id: number; marca_id: number; nombre: string }[]>(
    "SELECT id, marca_id, nombre FROM modelos_equipo WHERE marca_id = ? AND activo = 1 ORDER BY nombre",
    [marcaId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), marca_id: String(r.marca_id), nombre: r.nombre }))
}

/** Todos los modelos (para admin). */
export async function getModelosAll(
  pool: Pool
): Promise<{ id: string; marca_id: string; nombre: string }[]> {
  const [rows] = await pool.query<{ id: number; marca_id: number; nombre: string }[]>(
    "SELECT id, marca_id, nombre FROM modelos_equipo WHERE activo = 1 ORDER BY nombre"
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), marca_id: String(r.marca_id), nombre: r.nombre }))
}

/** Marcas para admin (incluye inactivos). */
export async function getMarcasEquipoParaAdmin(
  pool: Pool
): Promise<{ id: string; nombre: string; activo: number; tipo_equipo_ids: string[] }[]> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM marcas_equipo ORDER BY nombre"
  )
  const [relRows] = await pool.query<MarcaTipoRow[]>(
    "SELECT marca_id, tipo_equipo_id FROM marca_tipo_equipo WHERE activo = 1"
  )
  const relArr = Array.isArray(relRows) ? relRows : []
  const tipoIdsByMarca = new Map<number, string[]>()
  for (const rel of relArr) {
    const prev = tipoIdsByMarca.get(rel.marca_id) ?? []
    prev.push(String(rel.tipo_equipo_id))
    tipoIdsByMarca.set(rel.marca_id, prev)
  }
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({
    id: String(r.id),
    nombre: r.nombre,
    activo: Number(r.activo) || 0,
    tipo_equipo_ids: tipoIdsByMarca.get(r.id) ?? [],
  }))
}

/** Modelos para admin (incluye inactivos). */
export async function getModelosAllParaAdmin(
  pool: Pool
): Promise<{ id: string; marca_id: string; nombre: string; activo: number }[]> {
  const [rows] = await pool.query<{ id: number; marca_id: number; nombre: string; activo: number }[]>(
    "SELECT id, marca_id, nombre, activo FROM modelos_equipo ORDER BY nombre"
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({
    id: String(r.id),
    marca_id: String(r.marca_id),
    nombre: r.nombre,
    activo: Number(r.activo) || 0,
  }))
}

/** Arrendadores para admin (incluye inactivos). */
export async function getArrendadoresParaAdmin(
  pool: Pool
): Promise<{ id: string; nombre: string; activo: number }[]> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM arrendadores ORDER BY nombre"
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), nombre: r.nombre, activo: Number(r.activo) || 0 }))
}

/** Tipos de equipo para admin (incluye inactivos). */
export async function getTiposEquipoParaAdmin(
  pool: Pool
): Promise<{ id: string; nombre: string; activo: number }[]> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM cat_tipos_equipo ORDER BY nombre"
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), nombre: r.nombre, activo: Number(r.activo) || 0 }))
}

/** Arrendadores. */
export async function getArrendadores(pool: Pool): Promise<{ id: string; nombre: string }[]> {
  const [rows] = await pool.query<{ id: number; nombre: string }[]>(
    "SELECT id, nombre FROM arrendadores WHERE activo = 1 ORDER BY nombre"
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), nombre: r.nombre }))
}

/** Crear marca y devolverla. */
export async function crearMarca(
  pool: Pool,
  nombre: string,
  tipoEquipoIds?: string[]
): Promise<{ id: string; nombre: string; tipo_equipo_ids: string[] }> {
  const [result] = await pool.query<{ insertId: number }>("INSERT INTO marcas_equipo (nombre) VALUES (?)", [nombre])
  const insertId = result?.insertId ?? 0
  const normalized = normalizeTipoEquipoIds(tipoEquipoIds)
  if (normalized.length > 0) {
    await assignMarcaToTipos(pool, String(insertId), normalized)
  }
  return { id: String(insertId), nombre, tipo_equipo_ids: normalized }
}

/** Crear modelo y devolverlo. */
export async function crearModelo(
  pool: Pool,
  marca_id: string,
  nombre: string
): Promise<{ id: string; marca_id: string; nombre: string }> {
  const [result] = await pool.query<{ insertId: number }>(
    "INSERT INTO modelos_equipo (marca_id, nombre) VALUES (?, ?)",
    [marca_id, nombre]
  )
  const insertId = result?.insertId ?? 0
  return { id: String(insertId), marca_id, nombre }
}

/** Crear arrendador y devolverlo. */
export async function crearArrendador(pool: Pool, nombre: string): Promise<{ id: string; nombre: string }> {
  const [result] = await pool.query<{ insertId: number }>("INSERT INTO arrendadores (nombre) VALUES (?)", [nombre])
  const insertId = result?.insertId ?? 0
  return { id: String(insertId), nombre }
}

/** Crear tipo de equipo (cat_tipos_equipo) y devolverlo. */
export async function crearTipoEquipo(pool: Pool, nombre: string): Promise<{ id: string; nombre: string }> {
  const [result] = await pool.query<{ insertId: number }>(
    "INSERT INTO cat_tipos_equipo (nombre) VALUES (?)",
    [nombre]
  )
  const insertId = result?.insertId ?? 0
  return { id: String(insertId), nombre }
}

/** Una marca por id (para replicar tras actualizar). */
export async function getMarcaById(
  pool: Pool,
  id: string
): Promise<{ id: string; nombre: string; activo: number; tipo_equipo_ids: string[] } | null> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM marcas_equipo WHERE id = ?",
    [id]
  )
  const r = Array.isArray(rows) && rows[0] ? rows[0] : null
  if (!r) return null
  const [relRows] = await pool.query<{ tipo_equipo_id: number }[]>(
    "SELECT tipo_equipo_id FROM marca_tipo_equipo WHERE marca_id = ? AND activo = 1 ORDER BY tipo_equipo_id",
    [id]
  )
  const relArr = Array.isArray(relRows) ? relRows : []
  return {
    id: String(r.id),
    nombre: r.nombre,
    activo: Number(r.activo) || 0,
    tipo_equipo_ids: relArr.map((x) => String(x.tipo_equipo_id)),
  }
}

/** Un modelo por id (para replicar tras actualizar). */
export async function getModeloById(
  pool: Pool,
  id: string
): Promise<{ id: string; marca_id: string; nombre: string; activo: number } | null> {
  const [rows] = await pool.query<{ id: number; marca_id: number; nombre: string; activo: number }[]>(
    "SELECT id, marca_id, nombre, activo FROM modelos_equipo WHERE id = ?",
    [id]
  )
  const r = Array.isArray(rows) && rows[0] ? rows[0] : null
  return r
    ? {
        id: String(r.id),
        marca_id: String(r.marca_id),
        nombre: r.nombre,
        activo: Number(r.activo) || 0,
      }
    : null
}

/** Un arrendador por id (para replicar tras actualizar). */
export async function getArrendadorById(
  pool: Pool,
  id: string
): Promise<{ id: string; nombre: string; activo: number } | null> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM arrendadores WHERE id = ?",
    [id]
  )
  const r = Array.isArray(rows) && rows[0] ? rows[0] : null
  return r ? { id: String(r.id), nombre: r.nombre, activo: Number(r.activo) || 0 } : null
}

/** Un tipo de equipo por id (para replicar tras actualizar). */
export async function getTipoEquipoById(
  pool: Pool,
  id: string
): Promise<{ id: string; nombre: string; activo: number } | null> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM cat_tipos_equipo WHERE id = ?",
    [id]
  )
  const r = Array.isArray(rows) && rows[0] ? rows[0] : null
  return r ? { id: String(r.id), nombre: r.nombre, activo: Number(r.activo) || 0 } : null
}

/** Actualizar marca en el maestro. */
export async function actualizarMarca(
  pool: Pool,
  id: string,
  data: { nombre?: string; activo?: number; tipo_equipo_ids?: string[] }
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  if (data.nombre !== undefined) {
    updates.push("nombre = ?")
    values.push(data.nombre)
  }
  if (data.activo !== undefined) {
    updates.push("activo = ?")
    values.push(data.activo)
  }
  if (updates.length === 0) return
  if (updates.length > 0) {
    values.push(id)
    await pool.query(`UPDATE marcas_equipo SET ${updates.join(", ")} WHERE id = ?`, values)
  }
  if (data.tipo_equipo_ids !== undefined) {
    await assignMarcaToTipos(pool, id, normalizeTipoEquipoIds(data.tipo_equipo_ids))
  }
}

export async function assignMarcaToTipos(pool: Pool, marcaId: string, tipoEquipoIds: string[]): Promise<void> {
  const normalized = normalizeTipoEquipoIds(tipoEquipoIds)
  await pool.query("DELETE FROM marca_tipo_equipo WHERE marca_id = ?", [marcaId])
  for (const tipoId of normalized) {
    await pool.query(
      "INSERT INTO marca_tipo_equipo (marca_id, tipo_equipo_id, activo) VALUES (?, ?, 1)",
      [marcaId, tipoId]
    )
  }
}

function normalizeTipoEquipoIds(ids?: string[]): string[] {
  if (!Array.isArray(ids)) return []
  return Array.from(new Set(ids.map((x) => x.trim()).filter((x) => /^\d+$/.test(x))))
}

/** Actualizar modelo en el maestro. */
export async function actualizarModelo(
  pool: Pool,
  id: string,
  data: { nombre?: string; marca_id?: string; activo?: number }
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  if (data.nombre !== undefined) {
    updates.push("nombre = ?")
    values.push(data.nombre)
  }
  if (data.marca_id !== undefined) {
    updates.push("marca_id = ?")
    values.push(data.marca_id)
  }
  if (data.activo !== undefined) {
    updates.push("activo = ?")
    values.push(data.activo)
  }
  if (updates.length === 0) return
  values.push(id)
  await pool.query(`UPDATE modelos_equipo SET ${updates.join(", ")} WHERE id = ?`, values)
}

/** Actualizar arrendador en el maestro. */
export async function actualizarArrendador(
  pool: Pool,
  id: string,
  data: { nombre?: string; activo?: number }
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  if (data.nombre !== undefined) {
    updates.push("nombre = ?")
    values.push(data.nombre)
  }
  if (data.activo !== undefined) {
    updates.push("activo = ?")
    values.push(data.activo)
  }
  if (updates.length === 0) return
  values.push(id)
  await pool.query(`UPDATE arrendadores SET ${updates.join(", ")} WHERE id = ?`, values)
}

/** Actualizar tipo de equipo en el maestro. */
export async function actualizarTipoEquipo(
  pool: Pool,
  id: string,
  data: { nombre?: string; activo?: number }
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  if (data.nombre !== undefined) {
    updates.push("nombre = ?")
    values.push(data.nombre)
  }
  if (data.activo !== undefined) {
    updates.push("activo = ?")
    values.push(data.activo)
  }
  if (updates.length === 0) return
  values.push(id)
  await pool.query(`UPDATE cat_tipos_equipo SET ${updates.join(", ")} WHERE id = ?`, values)
}
