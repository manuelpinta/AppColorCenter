import type { Pool } from "mysql2/promise"
import type { MovimientoEquipo } from "@/lib/types"
import { getEquipoById } from "./equipos"
import { actualizarEquipo } from "./equipos"
import { getOrCreateUsuarioByNombre, getNombreUsuarioById } from "./usuarios"

type MovimientoRow = {
  id: number
  equipo_id: number
  sucursal_origen_id: number
  sucursal_destino_id: number
  fecha_movimiento: string
  motivo: string | null
  registrado_por_id: number | null
  created_at: unknown
}

async function resolveMovimientoRow(pool: Pool, row: MovimientoRow): Promise<MovimientoEquipo> {
  const registradoPor =
    row.registrado_por_id != null ? await getNombreUsuarioById(pool, row.registrado_por_id) : null
  return {
    id: String(row.id),
    equipo_id: String(row.equipo_id),
    sucursal_origen_id: String(row.sucursal_origen_id),
    sucursal_destino_id: String(row.sucursal_destino_id),
    fecha_movimiento: row.fecha_movimiento != null ? (typeof row.fecha_movimiento === "string" ? row.fecha_movimiento : String(row.fecha_movimiento)) : "",
    motivo: row.motivo ?? null,
    registrado_por: registradoPor ?? null,
    created_at: row.created_at != null ? String(row.created_at) : "",
  }
}

export async function getMovimientosByEquipoId(
  pool: Pool,
  equipoId: string
): Promise<MovimientoEquipo[]> {
  const [rows] = await pool.query<MovimientoRow[]>(
    `SELECT id, equipo_id, sucursal_origen_id, sucursal_destino_id, fecha_movimiento, motivo, registrado_por_id, created_at
     FROM movimientos_equipo WHERE equipo_id = ? ORDER BY fecha_movimiento DESC, id DESC`,
    [equipoId]
  )
  const arr = Array.isArray(rows) ? rows : []
  return Promise.all(arr.map((r) => resolveMovimientoRow(pool, r)))
}

/**
 * Registra un movimiento de equipo a otra sucursal: inserta en movimientos_equipo y actualiza equipo.sucursal_id.
 */
export async function registrarMovimientoEquipo(
  pool: Pool,
  equipoId: string,
  sucursalDestinoId: string,
  motivo: string | null = null,
  registradoPor: string | null = null
): Promise<MovimientoEquipo> {
  const equipo = await getEquipoById(pool, equipoId)
  if (!equipo) throw new Error("Equipo no encontrado")
  if (sucursalDestinoId === equipo.color_center_id) throw new Error("El equipo ya está en esa sucursal")

  const sucursalOrigenId = equipo.color_center_id
  const fecha = new Date().toISOString().slice(0, 10)
  let registradoPorId: number | null = null
  if (registradoPor?.trim()) {
    registradoPorId = await getOrCreateUsuarioByNombre(pool, registradoPor.trim())
  }

  await pool.query(
    `INSERT INTO movimientos_equipo (equipo_id, sucursal_origen_id, sucursal_destino_id, fecha_movimiento, motivo, registrado_por_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [equipoId, sucursalOrigenId, sucursalDestinoId, fecha, motivo ?? null, registradoPorId]
  )
  await actualizarEquipo(pool, equipoId, { color_center_id: sucursalDestinoId })

  const [rows] = await pool.query<MovimientoRow[]>(
    `SELECT id, equipo_id, sucursal_origen_id, sucursal_destino_id, fecha_movimiento, motivo, registrado_por_id, created_at
     FROM movimientos_equipo WHERE equipo_id = ? ORDER BY id DESC LIMIT 1`,
    [equipoId]
  )
  const arr = Array.isArray(rows) ? rows : []
  const row = arr[0]
  if (!row) throw new Error("No se pudo leer el movimiento registrado")
  return resolveMovimientoRow(pool, row)
}
