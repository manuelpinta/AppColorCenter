import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarTipoEquipo, getTipoEquipoById } from "@/lib/data/catalogos"
import { updateCatTipoEquipoInOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { catalogNombrePatchSchema, readBody, readUrlId } from "@/lib/api-schemas"

/** Actualiza un tipo de equipo en el maestro y replica. Body: { nombre?: string, activo?: number } (activo 0 o 1). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar tipos de equipo" }, { status: 403 })
  }
  const { id: rawId } = await params
  const urlId = readUrlId(rawId, "recurso")
  if (!urlId.ok) return urlId.response
  const id = urlId.numericId
  const parsed = await readBody(request, catalogNombrePatchSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  try {
    const empresaId = getCatalogoMaestroEmpresaId()
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    await actualizarTipoEquipo(pool, id, data)
    const row = await getTipoEquipoById(pool, id)
    if (!row) {
      return NextResponse.json({ error: "Tipo no encontrado" }, { status: 404 })
    }
    await updateCatTipoEquipoInOtrasBases(Number(id), row.nombre, row.activo)
    return NextResponse.json(row)
  } catch (err) {
    return apiError(err, "Error al actualizar tipo")
  }
}
