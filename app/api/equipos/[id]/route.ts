import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarEquipo, actualizarComputadora } from "@/lib/data"
import type { Equipo } from "@/lib/types"
import { userCanEditNormatividadFields, userCanWrite } from "@/lib/auth-roles"

const equipoAllowed = [
  "color_center_id", "tipo_equipo", "marca", "modelo", "numero_serie", "fecha_compra",
  "tipo_propiedad", "arrendador", "fecha_vencimiento_arrendamiento", "estado",
  "ultima_calibracion", "proxima_revision", "notas", "foto_url",
]

const computadoraAllowed = [
  "procesador", "ram_gb", "almacenamiento_gb", "tipo_almacenamiento", "graficos",
  "windows_version", "so_64bits",
] as const

const normatividadAllowed = [
  "fecha_compra",
  "tipo_propiedad",
  "arrendador",
  "fecha_vencimiento_arrendamiento",
] as const

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [canWrite, canEditNormatividad] = await Promise.all([
    userCanWrite(),
    userCanEditNormatividadFields(),
  ])
  if (!canWrite && !canEditNormatividad) {
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
  const allowedFields = canWrite ? equipoAllowed : normatividadAllowed
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  try {
    const pool = await getPool(empresaId)
    const equipo = await actualizarEquipo(pool, id, data as Partial<Omit<Equipo, "id" | "created_at">>)
    const computadoraPayload = body.computadora
    if (canWrite && equipo.tipo_equipo === "Equipo de Computo" && computadoraPayload && typeof computadoraPayload === "object") {
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
    const message = err instanceof Error ? err.message : "Error al actualizar"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
