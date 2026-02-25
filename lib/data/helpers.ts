import type { RowDataPacket } from "mysql2/promise"

/** Convierte fila MySQL a objeto con ids como string y fechas como ISO string. */
export function rowToApp<T extends Record<string, unknown>>(
  row: T,
  options?: { dateFields?: string[]; idFields?: string[] }
): T {
  const out = { ...row }
  const dateFields = options?.dateFields ?? ["created_at", "updated_at", "fecha_foto", "fecha_reporte", "fecha_mantenimiento", "fecha_movimiento", "fecha_compra", "fecha_vencimiento_arrendamiento", "ultima_calibracion", "proxima_revision", "fecha_instalacion"]
  const idFields = options?.idFields ?? ["id", "equipo_id", "sucursal_id", "color_center_id", "empresa_id", "marca_id", "modelo_id", "arrendador_id", "tipo_equipo_id", "estado_id", "tipo_propiedad_id", "region_id", "sucursal_origen_id", "sucursal_destino_id", "incidencia_id"]
  for (const key of Object.keys(out)) {
    if (idFields.includes(key) && (out[key] === 0 || typeof (out as RowDataPacket)[key] === "number")) {
      (out as Record<string, unknown>)[key] = String((out as RowDataPacket)[key])
    }
    if (dateFields.includes(key) && (out as RowDataPacket)[key] != null) {
      const v = (out as RowDataPacket)[key]
      if (v instanceof Date) (out as Record<string, unknown>)[key] = v.toISOString()
      else if (typeof v === "string") (out as Record<string, unknown>)[key] = v.includes("T") ? v : `${v}T00:00:00.000Z`
    }
  }
  return out
}

export function rowsToApp<T extends Record<string, unknown>>(
  rows: T[],
  options?: { dateFields?: string[]; idFields?: string[] }
): T[] {
  return rows.map((r) => rowToApp(r, options))
}
