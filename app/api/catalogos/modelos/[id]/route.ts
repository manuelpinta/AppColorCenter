import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarModelo, getModeloById } from "@/lib/data/catalogos"
import { updateModeloInOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { catalogModeloPatchSchema, readBody, readUrlId } from "@/lib/api-schemas"

/** Actualiza un modelo en el maestro y replica. Body: { nombre?: string, marca_id?: string, activo?: number }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar modelos" }, { status: 403 })
  }
  const { id: rawId } = await params
  const urlId = readUrlId(rawId, "recurso")
  if (!urlId.ok) return urlId.response
  const id = urlId.numericId
  const parsed = await readBody(request, catalogModeloPatchSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  try {
    const empresaId = getCatalogoMaestroEmpresaId()
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    await actualizarModelo(pool, id, data)
    const row = await getModeloById(pool, id)
    if (!row) {
      return NextResponse.json({ error: "Modelo no encontrado" }, { status: 404 })
    }
    await updateModeloInOtrasBases(
      Number(id),
      Number(row.marca_id),
      row.nombre,
      row.activo
    )
    return NextResponse.json(row)
  } catch (err) {
    return apiError(err, "Error al actualizar modelo")
  }
}
