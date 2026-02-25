import type { Pool } from "mysql2/promise"
import { rowToApp, rowsToApp } from "./helpers"

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
): Promise<{ id: string; nombre: string; activo: number }[]> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM marcas_equipo ORDER BY nombre"
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => ({ id: String(r.id), nombre: r.nombre, activo: Number(r.activo) || 0 }))
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
export async function crearMarca(pool: Pool, nombre: string): Promise<{ id: string; nombre: string }> {
  const [result] = await pool.query<{ insertId: number }>("INSERT INTO marcas_equipo (nombre) VALUES (?)", [nombre])
  const insertId = result?.insertId ?? 0
  return { id: String(insertId), nombre }
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
): Promise<{ id: string; nombre: string; activo: number } | null> {
  const [rows] = await pool.query<{ id: number; nombre: string; activo: number }[]>(
    "SELECT id, nombre, activo FROM marcas_equipo WHERE id = ?",
    [id]
  )
  const r = Array.isArray(rows) && rows[0] ? rows[0] : null
  return r ? { id: String(r.id), nombre: r.nombre, activo: Number(r.activo) || 0 } : null
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
  await pool.query(`UPDATE marcas_equipo SET ${updates.join(", ")} WHERE id = ?`, values)
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
