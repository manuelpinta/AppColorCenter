import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { userCanWrite } from "@/lib/auth-roles"
import { crearMantenimiento, getOrCreateUsuarioFromAuth0, parseEquipoId } from "@/lib/data"
import type { Mantenimiento } from "@/lib/types"

type CreateBody = {
  equipo_id: string
  incidencia_id?: string | null
  tipo: Mantenimiento["tipo"]
  realizado_por: Mantenimiento["realizado_por"]
  fecha_mantenimiento?: string
  descripcion: string
  piezas_cambiadas?: string | null
  tiempo_fuera_servicio?: number | null
  costo?: number | null
  estado?: Mantenimiento["estado"]
  notas?: string | null
  empresa_id?: string
}

function parseAnyNumericId(value: string): string {
  const lastDash = value.lastIndexOf("-")
  if (value.startsWith("emp-") && lastDash > 0) {
    return value.slice(lastDash + 1)
  }
  return value
}

export async function POST(request: NextRequest) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para crear mantenimientos" }, { status: 403 })
  }

  let body: CreateBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  if (!body.equipo_id || typeof body.equipo_id !== "string") {
    return NextResponse.json({ error: "equipo_id es requerido" }, { status: 400 })
  }
  if (!body.descripcion?.trim()) {
    return NextResponse.json({ error: "descripcion es requerida" }, { status: 400 })
  }
  if (body.tipo !== "Preventivo" && body.tipo !== "Correctivo") {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 })
  }
  if (body.realizado_por !== "Interno" && body.realizado_por !== "Externo") {
    return NextResponse.json({ error: "realizado_por inválido" }, { status: 400 })
  }
  if (body.estado && !["Pendiente", "En Proceso", "Completado"].includes(body.estado)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 })
  }

  const parsedEquipo = parseEquipoId(body.equipo_id)
  const empresaId = body.empresa_id ?? parsedEquipo.empresaId
  const equipoNumericId = parsedEquipo.numericId
  if (!empresaId || !equipoNumericId) {
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
      equipo_id: equipoNumericId,
      incidencia_id: body.incidencia_id ? parseAnyNumericId(body.incidencia_id) : null,
      tipo: body.tipo,
      realizado_por: body.realizado_por,
      tecnico_id: body.realizado_por === "Interno" ? tecnicoId : null,
      fecha_mantenimiento: body.fecha_mantenimiento ?? new Date().toISOString().slice(0, 10),
      descripcion: body.descripcion.trim(),
      piezas_cambiadas: body.piezas_cambiadas?.trim() || null,
      tiempo_fuera_servicio:
        body.tiempo_fuera_servicio != null && Number.isFinite(Number(body.tiempo_fuera_servicio))
          ? Number(body.tiempo_fuera_servicio)
          : null,
      costo:
        body.costo != null && Number.isFinite(Number(body.costo))
          ? Number(body.costo)
          : null,
      estado: body.estado ?? "Pendiente",
      notas: body.notas?.trim() || null,
    })

    return NextResponse.json({
      mantenimiento: { ...mantenimiento, id: `${empresaId}-${mantenimiento.id}` },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear mantenimiento"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
