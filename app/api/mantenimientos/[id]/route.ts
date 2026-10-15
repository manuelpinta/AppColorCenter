import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { userCanWrite } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarMantenimiento, findMantenimientoInAllBases, getOrCreateUsuarioFromAuth0 } from "@/lib/data"
import { mantenimientoPatchSchema, readBody, readUrlId } from "@/lib/api-schemas"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para actualizar mantenimientos" }, { status: 403 })
  }

  const { id } = await params
  const urlId = readUrlId(id, "recurso")
  if (!urlId.ok) return urlId.response

  const found = await findMantenimientoInAllBases(id)
  if (!found) {
    return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 })
  }
  if (!(await isEmpresaAllowedForRequest(found.empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  const parsed = await readBody(request, mantenimientoPatchSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  try {
    const session = await auth0.getSession()
    const tecnicoId = await getOrCreateUsuarioFromAuth0(found.pool, {
      sub: session?.user?.sub ?? null,
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? null,
    })
    const realizadoPor = body.realizado_por ?? found.mantenimiento.realizado_por

    const mantenimiento = await actualizarMantenimiento(found.pool, found.mantenimiento.id, {
      ...(body.tipo !== undefined ? { tipo: body.tipo } : {}),
      ...(body.realizado_por !== undefined ? { realizado_por: body.realizado_por } : {}),
      tecnico_id: realizadoPor === "Externo" ? null : tecnicoId,
      ...(body.fecha_mantenimiento !== undefined && body.fecha_mantenimiento !== null
        ? { fecha_mantenimiento: body.fecha_mantenimiento }
        : {}),
      ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
      ...(body.piezas_cambiadas !== undefined ? { piezas_cambiadas: body.piezas_cambiadas } : {}),
      ...(body.tiempo_fuera_servicio !== undefined ? { tiempo_fuera_servicio: body.tiempo_fuera_servicio } : {}),
      ...(body.costo !== undefined ? { costo: body.costo } : {}),
      ...(body.estado !== undefined ? { estado: body.estado } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    })

    return NextResponse.json({
      mantenimiento: { ...mantenimiento, id: `${found.empresaId}-${mantenimiento.id}` },
    })
  } catch (err) {
    return apiError(err, "Error al actualizar mantenimiento", 400)
  }
}
