import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { userCanWrite } from "@/lib/auth-roles"
import { isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarMantenimiento, findMantenimientoInAllBases, getOrCreateUsuarioFromAuth0 } from "@/lib/data"
import type { Mantenimiento } from "@/lib/types"

type PatchBody = Partial<{
  tipo: Mantenimiento["tipo"]
  realizado_por: Mantenimiento["realizado_por"]
  fecha_mantenimiento: string
  descripcion: string
  piezas_cambiadas: string | null
  tiempo_fuera_servicio: number | null
  costo: number | null
  estado: Mantenimiento["estado"]
  notas: string | null
}>

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para actualizar mantenimientos" }, { status: 403 })
  }

  const { id } = await params
  const found = await findMantenimientoInAllBases(id)
  if (!found) {
    return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 })
  }
  if (!(await isEmpresaAllowedForRequest(found.empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  if (body.tipo && !["Preventivo", "Correctivo"].includes(body.tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 })
  }
  if (body.realizado_por && !["Interno", "Externo"].includes(body.realizado_por)) {
    return NextResponse.json({ error: "realizado_por inválido" }, { status: 400 })
  }
  if (body.estado && !["Pendiente", "En Proceso", "Completado"].includes(body.estado)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 })
  }

  try {
    const session = await auth0.getSession()
    const tecnicoId = await getOrCreateUsuarioFromAuth0(found.pool, {
      sub: session?.user?.sub ?? null,
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? null,
    })
    const realizadoPor = body.realizado_por ?? found.mantenimiento.realizado_por

    const mantenimiento = await actualizarMantenimiento(found.pool, found.mantenimiento.id, {
      tipo: body.tipo,
      realizado_por: body.realizado_por,
      tecnico_id: realizadoPor === "Externo" ? null : tecnicoId,
      fecha_mantenimiento: body.fecha_mantenimiento,
      descripcion: body.descripcion?.trim(),
      piezas_cambiadas: body.piezas_cambiadas?.trim() || null,
      tiempo_fuera_servicio:
        body.tiempo_fuera_servicio != null && Number.isFinite(Number(body.tiempo_fuera_servicio))
          ? Number(body.tiempo_fuera_servicio)
          : body.tiempo_fuera_servicio === null
            ? null
            : undefined,
      costo:
        body.costo != null && Number.isFinite(Number(body.costo))
          ? Number(body.costo)
          : body.costo === null
            ? null
            : undefined,
      estado: body.estado,
      notas: body.notas?.trim() || null,
    })

    return NextResponse.json({
      mantenimiento: { ...mantenimiento, id: `${found.empresaId}-${mantenimiento.id}` },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar mantenimiento"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
