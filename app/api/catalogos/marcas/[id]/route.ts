import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarMarca, getMarcaById } from "@/lib/data/catalogos"
import { updateMarcaInOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { catalogMarcaPatchSchema, readBody, readUrlId } from "@/lib/api-schemas"

/** Actualiza una marca en el maestro y replica a las demás bases. Body: { nombre?: string, activo?: number, tipo_equipo_ids?: string[] }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar marcas" }, { status: 403 })
  }
  const { id: rawId } = await params
  const urlId = readUrlId(rawId, "recurso")
  if (!urlId.ok) return urlId.response
  const id = urlId.numericId
  const parsed = await readBody(request, catalogMarcaPatchSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

  try {
    const empresaId = getCatalogoMaestroEmpresaId()
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    await actualizarMarca(pool, id, data)
    const row = await getMarcaById(pool, id)
    if (!row) {
      return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 })
    }
    await updateMarcaInOtrasBases(
      Number(id),
      row.nombre,
      row.activo,
      row.tipo_equipo_ids.map((x) => Number(x))
    )
    return NextResponse.json(row)
  } catch (err) {
    return apiError(err, "Error al actualizar marca")
  }
}
