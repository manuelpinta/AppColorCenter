import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { crearEquipo, buildEquipoCompositeId, actualizarComputadora } from "@/lib/data"
import type { EmpresaId } from "@/lib/db"
import { userCanWrite } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { equipoCreateSchema, readBody } from "@/lib/api-schemas"

export async function POST(request: NextRequest) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para crear equipos" }, { status: 403 })
  }

  const parsed = await readBody(request, equipoCreateSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  const empresaId = data.color_center_id.empresaId ?? data.empresa_id
  const sucursalIdNum = data.color_center_id.numericId
  if (!empresaId) {
    return NextResponse.json(
      { error: "Se requiere empresa_id y color_center_id, o un id de sucursal compuesto" },
      { status: 400 }
    )
  }

  if (!(await isEmpresaAllowedForRequest(empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  try {
    const pool = await getPool(empresaId)
    const equipo = await crearEquipo(pool, {
      color_center_id: sucursalIdNum,
      tipo_equipo: data.tipo_equipo,
      tipo_equipo_id: data.tipo_equipo_id,
      marca: data.marca ?? null,
      marca_id: data.marca_id,
      modelo: data.modelo ?? null,
      modelo_id: data.modelo_id,
      numero_serie: data.numero_serie ?? null,
      fecha_compra: data.fecha_compra ?? null,
      tipo_propiedad: data.tipo_propiedad,
      arrendador: data.arrendador ?? null,
      fecha_vencimiento_arrendamiento: data.fecha_vencimiento_arrendamiento ?? null,
      estado: data.estado,
      ultima_calibracion: data.ultima_calibracion ?? null,
      proxima_revision: data.proxima_revision ?? null,
      notas: data.notas ?? null,
      equipo_ups_id: data.equipo_ups_id ?? null,
      equipo_regulador_id: data.equipo_regulador_id ?? null,
      equipo_impresora_id: data.equipo_impresora_id ?? null,
    })
    if (data.tipo_equipo === "Equipo de Computo" && data.computadora) {
      await actualizarComputadora(pool, equipo.id, data.computadora)
    }
    const compositeId = buildEquipoCompositeId(empresaId as EmpresaId, equipo)
    return NextResponse.json({ equipo: { ...equipo, id: compositeId }, empresa_id: empresaId })
  } catch (err) {
    return apiError(err, "Error al crear equipo", 400)
  }
}
