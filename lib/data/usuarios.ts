import type { Pool } from "mysql2/promise"

/** Obtiene usuario por nombre; si no existe, lo crea y devuelve su id. Útil para reportado_por_id y tecnico_id. */
export async function getOrCreateUsuarioByNombre(pool: Pool, nombre: string): Promise<number> {
  const trimmed = nombre.trim()
  if (!trimmed) throw new Error("Nombre de usuario requerido")
  const [rows] = await pool.query<{ id: number }[]>("SELECT id FROM usuarios WHERE nombre = ? AND activo = 1", [trimmed])
  const arr = Array.isArray(rows) ? rows : []
  if (arr[0]) return arr[0].id
  const [insert] = await pool.query<{ insertId: number }>("INSERT INTO usuarios (nombre, activo) VALUES (?, 1)", [trimmed])
  const result = insert as unknown as { insertId: number }
  return result.insertId
}

/** Obtiene nombre de usuario por id (para mostrar en listados). */
export async function getNombreUsuarioById(pool: Pool, userId: number): Promise<string | null> {
  const [rows] = await pool.query<{ nombre: string }[]>("SELECT nombre FROM usuarios WHERE id = ?", [userId])
  const arr = Array.isArray(rows) ? rows : []
  return arr[0]?.nombre ?? null
}

/** Id del usuario por defecto al registrar incidencias (ej. el que "está registrando"). Sin auth se usa el primero activo. */
export async function getDefaultUsuarioId(pool: Pool): Promise<number> {
  const [rows] = await pool.query<{ id: number }[]>("SELECT id FROM usuarios WHERE activo = 1 ORDER BY id ASC LIMIT 1")
  const arr = Array.isArray(rows) ? rows : []
  if (arr[0]) return arr[0].id
  throw new Error("No hay usuarios activos en la base; crea al menos uno para registrar incidencias.")
}
