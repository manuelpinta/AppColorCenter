import type { Pool } from "mysql2/promise"
import type { FotoMantenimiento } from "@/lib/types"

type FotoRow = {
  id: number
  mantenimiento_id: number
  url: string
  fecha_foto: string
  descripcion: string | null
  created_at: unknown
}

function mapFotoRow(row: FotoRow): FotoMantenimiento {
  return {
    id: String(row.id),
    mantenimiento_id: String(row.mantenimiento_id),
    url: row.url,
    fecha_foto: row.fecha_foto != null ? (typeof row.fecha_foto === "string" ? row.fecha_foto : String(row.fecha_foto)) : "",
    descripcion: row.descripcion ?? null,
    created_at: row.created_at != null ? String(row.created_at) : "",
  }
}

export async function getFotosByMantenimientoId(pool: Pool, mantenimientoId: string): Promise<FotoMantenimiento[]> {
  const [rows] = await pool.query<FotoRow[]>(
    "SELECT id, mantenimiento_id, url, fecha_foto, descripcion, created_at FROM mantenimiento_fotos WHERE mantenimiento_id = ? ORDER BY fecha_foto DESC, id DESC",
    [mantenimientoId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map(mapFotoRow)
}

export async function crearFotoMantenimiento(
  pool: Pool,
  data: { mantenimiento_id: string; url: string; fecha_foto: string; descripcion: string | null }
): Promise<FotoMantenimiento> {
  const [result] = await pool.query<{ insertId: number }>(
    "INSERT INTO mantenimiento_fotos (mantenimiento_id, url, fecha_foto, descripcion) VALUES (?, ?, ?, ?)",
    [Number(data.mantenimiento_id), data.url, data.fecha_foto, data.descripcion ?? null]
  )
  const insertId = (result as unknown as { insertId: number }).insertId
  const [rows] = await pool.query<FotoRow[]>(
    "SELECT id, mantenimiento_id, url, fecha_foto, descripcion, created_at FROM mantenimiento_fotos WHERE id = ?",
    [insertId]
  )
  const arr = Array.isArray(rows) ? rows : []
  const row = arr[0]
  if (!row) throw new Error("No se pudo leer la foto creada")
  return mapFotoRow(row)
}

export async function getFotoMantenimientoUrl(
  pool: Pool,
  fotoId: string,
  mantenimientoId: string
): Promise<string | null> {
  const [rows] = await pool.query<{ url: string }[]>(
    "SELECT url FROM mantenimiento_fotos WHERE id = ? AND mantenimiento_id = ?",
    [Number(fotoId), Number(mantenimientoId)]
  )
  const row = Array.isArray(rows) ? rows[0] : undefined
  return row?.url ?? null
}

/** Borra la foto solo si pertenece a ese mantenimiento. */
export async function eliminarFotoMantenimiento(
  pool: Pool,
  fotoId: string,
  mantenimientoId: string
): Promise<boolean> {
  const [result] = await pool.query(
    "DELETE FROM mantenimiento_fotos WHERE id = ? AND mantenimiento_id = ?",
    [Number(fotoId), Number(mantenimientoId)]
  )
  return ((result as { affectedRows?: number }).affectedRows ?? 0) > 0
}
