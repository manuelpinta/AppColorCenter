import type { Pool } from "mysql2/promise"
import type { EquipoComputadora } from "@/lib/types"

type ComputadoraRow = {
  equipo_id: number
  procesador: string | null
  ram_gb: number | null
  almacenamiento_gb: number | null
  tipo_almacenamiento: string | null
  graficos: string | null
  windows_version: string | null
  so_64bits: number
  created_at: unknown
  updated_at: unknown
}

function mapComputadoraRow(row: ComputadoraRow): EquipoComputadora {
  return {
    equipo_id: String(row.equipo_id),
    procesador: row.procesador ?? null,
    ram_gb: row.ram_gb ?? null,
    almacenamiento_gb: row.almacenamiento_gb ?? null,
    tipo_almacenamiento: (row.tipo_almacenamiento as EquipoComputadora["tipo_almacenamiento"]) ?? null,
    graficos: row.graficos ?? null,
    windows_version: row.windows_version ?? null,
    so_64bits: Boolean(row.so_64bits),
    created_at: row.created_at != null ? String(row.created_at) : "",
    updated_at: row.updated_at != null ? String(row.updated_at) : "",
  }
}

export async function getComputadoraByEquipoId(
  pool: Pool,
  equipoId: string
): Promise<EquipoComputadora | null> {
  const [rows] = await pool.query<ComputadoraRow[]>(
    "SELECT equipo_id, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, graficos, windows_version, so_64bits, created_at, updated_at FROM equipo_computadora WHERE equipo_id = ?",
    [equipoId]
  )
  const arr = Array.isArray(rows) ? rows : []
  const row = arr[0]
  return row ? mapComputadoraRow(row) : null
}

export async function actualizarComputadora(
  pool: Pool,
  equipoId: string,
  data: Partial<Omit<EquipoComputadora, "equipo_id" | "created_at">>
): Promise<EquipoComputadora> {
  const existing = await getComputadoraByEquipoId(pool, equipoId)
  const updates: string[] = []
  const values: unknown[] = []

  if (data.procesador !== undefined) {
    updates.push("procesador = ?")
    values.push(data.procesador ?? null)
  }
  if (data.ram_gb !== undefined) {
    updates.push("ram_gb = ?")
    values.push(data.ram_gb ?? null)
  }
  if (data.almacenamiento_gb !== undefined) {
    updates.push("almacenamiento_gb = ?")
    values.push(data.almacenamiento_gb ?? null)
  }
  if (data.tipo_almacenamiento !== undefined) {
    updates.push("tipo_almacenamiento = ?")
    values.push(data.tipo_almacenamiento ?? null)
  }
  if (data.graficos !== undefined) {
    updates.push("graficos = ?")
    values.push(data.graficos ?? null)
  }
  if (data.windows_version !== undefined) {
    updates.push("windows_version = ?")
    values.push(data.windows_version ?? null)
  }
  if (data.so_64bits !== undefined) {
    updates.push("so_64bits = ?")
    values.push(data.so_64bits ? 1 : 0)
  }

  if (existing) {
    if (updates.length === 0) return existing
    values.push(equipoId)
    await pool.query(`UPDATE equipo_computadora SET ${updates.join(", ")} WHERE equipo_id = ?`, values)
  } else {
    const cols = ["equipo_id", ...updates.map((u) => u.split(" ")[0])]
    const placeholders = cols.map(() => "?").join(", ")
    values.unshift(equipoId)
    await pool.query(
      `INSERT INTO equipo_computadora (${cols.join(", ")}) VALUES (${placeholders})`,
      values
    )
  }
  const updated = await getComputadoraByEquipoId(pool, equipoId)
  if (!updated) throw new Error("No se pudo leer computadora actualizada")
  return updated
}
