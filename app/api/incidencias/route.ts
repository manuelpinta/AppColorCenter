import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { crearIncidencia } from "@/lib/data"
import { parseId } from "@/lib/data/ids"
import { invalidateCachedList } from "@/lib/data/cache"
import { userCanWrite } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { incidenciaCreateSchema, readBody } from "@/lib/api-schemas"

export async function POST(request: NextRequest) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para crear incidencias" }, { status: 403 })
  }

  const parsed = await readBody(request, incidenciaCreateSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  const sucursal = parseId(body.sucursal_id, "sucursal")
  const empresaIdToUse = body.empresa_id ?? sucursal.empresaId
  if (!empresaIdToUse || !/^\d+$/.test(sucursal.numericId)) {
    return NextResponse.json(
      { error: "empresa_id es requerido o use sucursal_id compuesto (emp-1-5 o CODIGO-SUC)" },
      { status: 400 }
    )
  }

  let equipoNumericId: string | null = null
  if (body.equipo_id && body.equipo_id.trim()) {
    const equipo = parseId(body.equipo_id, "equipo")
    if (!/^\d+$/.test(equipo.numericId)) {
      return NextResponse.json({ error: "equipo_id inválido" }, { status: 400 })
    }
    equipoNumericId = equipo.numericId
  }

  if (!(await isEmpresaAllowedForRequest(empresaIdToUse))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }
  try {
    const pool = await getPool(empresaIdToUse)
    const incidencia = await crearIncidencia(pool, {
      sucursal_id: sucursal.numericId,
      equipo_id: equipoNumericId,
      fecha_reporte: body.fecha_reporte ?? new Date().toISOString().slice(0, 10),
      descripcion: body.descripcion,
      severidad: body.severidad,
      estado: body.estado ?? "Reportada",
      notas: body.notas ?? null,
    })
    invalidateCachedList("incidenciasAllBases")
    const idForClient = `${empresaIdToUse}-${incidencia.id}`
    return NextResponse.json({
      incidencia: { ...incidencia, id: idForClient, empresa_id: empresaIdToUse },
    })
  } catch (err) {
    return apiError(err, "Error al crear incidencia", 400)
  }
}
