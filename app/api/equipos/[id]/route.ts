import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarEquipo, actualizarComputadora } from "@/lib/data"
import { EquipoValidationError } from "@/lib/data/equipos"
import type { Equipo } from "@/lib/types"
import { userCanWrite } from "@/lib/auth-roles"

const equipoAllowed = [
  "color_center_id", "tipo_equipo", "tipo_equipo_id", "marca", "marca_id", "modelo", "modelo_id", "numero_serie", "fecha_compra",
  "tipo_propiedad", "arrendador", "fecha_vencimiento_arrendamiento", "estado",
  "ultima_calibracion", "proxima_revision", "notas", "foto_url", "equipo_ups_id", "equipo_regulador_id", "equipo_impresora_id",
]

const computadoraAllowed = [
  "procesador", "ram_gb", "almacenamiento_gb", "tipo_almacenamiento", "graficos",
  "windows_version", "so_64bits",
] as const

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para actualizar equipos" }, { status: 403 })
  }

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await _request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  const empresaId = typeof body.empresa_id === "string" ? body.empresa_id : null
  if (!empresaId) {
    return NextResponse.json(
      { error: "empresa_id es requerido para actualizar equipo (multi-DB)" },
      { status: 400 }
    )
  }
  if (!(await isEmpresaAllowedForRequest(empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }
  const data: Record<string, unknown> = {}
  for (const key of equipoAllowed) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  try {
    const pool = await getPool(empresaId)
    if (data.color_center_id !== undefined) data.color_center_id = Number(data.color_center_id)
    if (data.tipo_equipo_id !== undefined) data.tipo_equipo_id = Number(data.tipo_equipo_id)
    if (data.marca_id !== undefined) data.marca_id = Number(data.marca_id)
    if (data.modelo_id !== undefined) data.modelo_id = Number(data.modelo_id)
    if (data.equipo_ups_id !== undefined) data.equipo_ups_id = Number(data.equipo_ups_id)
    if (data.equipo_regulador_id !== undefined) data.equipo_regulador_id = Number(data.equipo_regulador_id)
    if (data.equipo_impresora_id !== undefined) data.equipo_impresora_id = Number(data.equipo_impresora_id)
    const equipo = await actualizarEquipo(pool, id, data as Partial<Omit<Equipo, "id" | "created_at">>)
    const computadoraPayload = body.computadora
    if (equipo.tipo_equipo === "Equipo de Computo" && computadoraPayload && typeof computadoraPayload === "object") {
      const comp: Record<string, unknown> = {}
      for (const key of computadoraAllowed) {
        if ((computadoraPayload as Record<string, unknown>)[key] !== undefined) {
          comp[key] = (computadoraPayload as Record<string, unknown>)[key]
        }
      }
      if (comp.so_64bits === "true" || comp.so_64bits === true) comp.so_64bits = true
      else if (comp.so_64bits === "false" || comp.so_64bits === false) comp.so_64bits = false
      await actualizarComputadora(pool, id, comp as Parameters<typeof actualizarComputadora>[2])
    }
    return NextResponse.json({ equipo })
  } catch (err) {
    if (err instanceof EquipoValidationError) {
      return NextResponse.json({ error: err.message, field: err.field }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : "Error al actualizar"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
