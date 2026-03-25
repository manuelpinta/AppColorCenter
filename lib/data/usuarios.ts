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

type Auth0UserIdentity = {
  sub?: string | null
  name?: string | null
  email?: string | null
}

function normalizeNombre(user: Auth0UserIdentity): string {
  const byName = user.name?.trim()
  if (byName) return byName
  const byEmail = user.email?.trim()
  if (byEmail) return byEmail
  const bySub = user.sub?.trim()
  if (bySub) return bySub
  return "Usuario Auth0"
}

/**
 * Resuelve un usuario local (tabla `usuarios`) desde la identidad de Auth0.
 * - Fuente principal: `auth0_sub` (si la columna existe).
 * - Fallback legacy: nombre/email cuando la base aún no tiene `auth0_sub`.
 */
export async function getOrCreateUsuarioFromAuth0(pool: Pool, user: Auth0UserIdentity): Promise<number> {
  const sub = user.sub?.trim() ?? ""
  const nombre = normalizeNombre(user)
  const email = user.email?.trim() || null

  if (!sub) {
    return getOrCreateUsuarioByNombre(pool, nombre)
  }

  try {
    const [rows] = await pool.query<{ id: number }[]>(
      "SELECT id FROM usuarios WHERE auth0_sub = ? AND activo = 1 LIMIT 1",
      [sub]
    )
    const arr = Array.isArray(rows) ? rows : []
    if (arr[0]) return arr[0].id

    const [insert] = await pool.query<{ insertId: number }>(
      "INSERT INTO usuarios (nombre, email, auth0_sub, activo) VALUES (?, ?, ?, 1)",
      [nombre, email, sub]
    )
    return (insert as unknown as { insertId: number }).insertId
  } catch (err) {
    // Compatibilidad con esquemas viejos sin columna auth0_sub.
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : undefined
    if (code === "ER_BAD_FIELD_ERROR" || code === "ER_NO_SUCH_TABLE") {
      return getOrCreateUsuarioByNombre(pool, nombre)
    }
    throw err
  }
}

/** Obtiene texto para mostrar (prefiere nombre legible; si solo hay correo en nombre, muestra email una vez). */
export async function getNombreUsuarioById(pool: Pool, userId: number): Promise<string | null> {
  try {
    const [rows] = await pool.query<{ nombre: string; email: string | null }[]>(
      "SELECT nombre, email FROM usuarios WHERE id = ?",
      [userId]
    )
    const arr = Array.isArray(rows) ? rows : []
    const row = arr[0]
    if (!row) return null
    const n = row.nombre?.trim() ?? ""
    const em = row.email?.trim() ?? ""
    if (n && !n.includes("@")) return n
    if (n && em && n === em) return em
    if (n) return n
    return em || null
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : undefined
    if (code === "ER_BAD_FIELD_ERROR") {
      const [rows] = await pool.query<{ nombre: string }[]>("SELECT nombre FROM usuarios WHERE id = ?", [userId])
      const arr = Array.isArray(rows) ? rows : []
      return arr[0]?.nombre ?? null
    }
    throw err
  }
}

/** Id del usuario por defecto al registrar incidencias (ej. el que "está registrando"). Sin auth se usa el primero activo. */
export async function getDefaultUsuarioId(pool: Pool): Promise<number> {
  const [rows] = await pool.query<{ id: number }[]>("SELECT id FROM usuarios WHERE activo = 1 ORDER BY id ASC LIMIT 1")
  const arr = Array.isArray(rows) ? rows : []
  if (arr[0]) return arr[0].id
  throw new Error("No hay usuarios activos en la base; crea al menos uno para registrar incidencias.")
}
