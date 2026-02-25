import type { Pool } from "mysql2/promise"
import type { FotoEquipo } from "@/lib/types"

type FotoRow = {
  id: number
  equipo_id: number
  url: string
  fecha_foto: string
  descripcion: string | null
  created_at: unknown
}

function mapFotoRow(row: FotoRow): FotoEquipo {
  return {
    id: String(row.id),
    equipo_id: String(row.equipo_id),
    url: row.url,
    fecha_foto: row.fecha_foto != null ? (typeof row.fecha_foto === "string" ? row.fecha_foto : String(row.fecha_foto)) : "",
    descripcion: row.descripcion ?? null,
    created_at: row.created_at != null ? String(row.created_at) : "",
  }
}

export async function getFotosByEquipoId(pool: Pool, equipoId: string): Promise<FotoEquipo[]> {
  const [rows] = await pool.query<FotoRow[]>(
    "SELECT id, equipo_id, url, fecha_foto, descripcion, created_at FROM equipo_fotos WHERE equipo_id = ? ORDER BY fecha_foto DESC, id DESC",
    [equipoId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map(mapFotoRow)
}

export async function crearFotoEquipo(
  pool: Pool,
  data: { equipo_id: string; url: string; fecha_foto: string; descripcion: string | null }
): Promise<FotoEquipo> {
  const [result] = await pool.query<{ insertId: number }>(
    "INSERT INTO equipo_fotos (equipo_id, url, fecha_foto, descripcion) VALUES (?, ?, ?, ?)",
    [data.equipo_id, data.url, data.fecha_foto, data.descripcion ?? null]
  )
  const insertId = (result as unknown as { insertId: number }).insertId
  const [rows] = await pool.query<FotoRow[]>(
    "SELECT id, equipo_id, url, fecha_foto, descripcion, created_at FROM equipo_fotos WHERE id = ?",
    [insertId]
  )
  const arr = Array.isArray(rows) ? rows : []
  const row = arr[0]
  if (!row) throw new Error("No se pudo leer la foto creada")
  return mapFotoRow(row)
}

export async function eliminarFotoEquipo(pool: Pool, fotoId: string): Promise<void> {
  await pool.query("DELETE FROM equipo_fotos WHERE id = ?", [fotoId])
}
