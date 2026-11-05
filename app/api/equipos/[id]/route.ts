import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarEquipo, actualizarComputadora } from "@/lib/data"
import type { Equipo } from "@/lib/types"
import { userCanEditNormatividadFields, userCanWrite } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { equipoPatchSchema, readBody, readUrlId, type EquipoPatchInput } from "@/lib/api-schemas"

const equipoAllowed = [
  "color_center_id",
  "tipo_equipo",
  "tipo_equipo_id",
  "marca",
  "marca_id",
  "modelo",
  "modelo_id",
  "numero_serie",
  "fecha_compra",
  "tipo_propiedad",
  "arrendador",
  "fecha_vencimiento_arrendamiento",
  "numero_contrato",
  "estado",
  "ultima_calibracion",
  "proxima_revision",
  "notas",
  "foto_url",
  "equipo_ups_id",
  "equipo_regulador_id",
  "equipo_impresora_id",
] as const satisfies readonly (keyof EquipoPatchInput)[]

const leasingFields = [
  "tipo_propiedad",
  "arrendador",
  "fecha_vencimiento_arrendamiento",
  "numero_contrato",
] as const satisfies readonly (keyof EquipoPatchInput)[]

const normatividadAllowed = [
  "fecha_compra",
  ...leasingFields,
] as const satisfies readonly (keyof EquipoPatchInput)[]

export async function PATCH(
  request: NextRequest,
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
  const urlId = readUrlId(id, "equipo")
  if (!urlId.ok) return urlId.response

  const parsed = await readBody(request, equipoPatchSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  if (!(await isEmpresaAllowedForRequest(body.empresa_id))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  const data: Record<string, unknown> = {}
  if (canWrite) {
    for (const key of equipoAllowed) {
      if (leasingFields.includes(key as (typeof leasingFields)[number]) && !canEditNormatividad) continue
      if (body[key] !== undefined) data[key] = body[key]
    }
  } else if (canEditNormatividad) {
    for (const key of normatividadAllowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
  }

  try {
    const pool = await getPool(body.empresa_id)
    const equipo = await actualizarEquipo(pool, urlId.numericId, data as Partial<Omit<Equipo, "id" | "created_at">>)
    if (canWrite && equipo.tipo_equipo === "Equipo de Computo" && body.computadora) {
      await actualizarComputadora(pool, urlId.numericId, body.computadora)
    }
    return NextResponse.json({ equipo })
  } catch (err) {
    return apiError(err, "Error al actualizar", 400)
  }
}
