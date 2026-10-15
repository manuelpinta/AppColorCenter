import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { userCanWrite } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { crearMantenimiento, getOrCreateUsuarioFromAuth0 } from "@/lib/data"
import { parseId } from "@/lib/data/ids"
import { mantenimientoCreateSchema, readBody } from "@/lib/api-schemas"

export async function POST(request: NextRequest) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para crear mantenimientos" }, { status: 403 })
  }

  const parsed = await readBody(request, mantenimientoCreateSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  const parsedEquipo = parseId(body.equipo_id, "equipo")
  const empresaId = body.empresa_id ?? parsedEquipo.empresaId
  if (!empresaId || !/^\d+$/.test(parsedEquipo.numericId)) {
    return NextResponse.json(
      { error: "equipo_id debe ser compuesto (emp-x-y) o incluir empresa_id explícito" },
      { status: 400 }
    )
  }

  if (!(await isEmpresaAllowedForRequest(empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  try {
    const session = await auth0.getSession()
    const pool = await getPool(empresaId)
    const tecnicoId = await getOrCreateUsuarioFromAuth0(pool, {
      sub: session?.user?.sub ?? null,
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? null,
    })
    const mantenimiento = await crearMantenimiento(pool, {
      equipo_id: parsedEquipo.numericId,
      incidencia_id: body.incidencia_id,
      tipo: body.tipo,
      realizado_por: body.realizado_por,
      tecnico_id: body.realizado_por === "Interno" ? tecnicoId : null,
      fecha_mantenimiento: body.fecha_mantenimiento ?? new Date().toISOString().slice(0, 10),
      descripcion: body.descripcion,
      piezas_cambiadas: body.piezas_cambiadas ?? null,
      tiempo_fuera_servicio: body.tiempo_fuera_servicio ?? null,
      costo: body.costo ?? null,
      estado: body.estado ?? "Pendiente",
      notas: body.notas ?? null,
    })

    return NextResponse.json({
      mantenimiento: { ...mantenimiento, id: `${empresaId}-${mantenimiento.id}` },
    })
  } catch (err) {
    return apiError(err, "Error al crear mantenimiento", 400)
  }
}
