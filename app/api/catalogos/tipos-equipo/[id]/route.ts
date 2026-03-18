import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarTipoEquipo, getTipoEquipoById } from "@/lib/data/catalogos"
import { updateCatTipoEquipoInOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"

/** Actualiza un tipo de equipo en el maestro y replica. Body: { nombre?: string, activo?: number } (activo 0 o 1). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar tipos de equipo" }, { status: 403 })
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 })
  }
  let body: { nombre?: string; activo?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  const data: { nombre?: string; activo?: number } = {}
  if (typeof body.nombre === "string") data.nombre = body.nombre.trim()
  if (typeof body.activo === "number") data.activo = body.activo === 1 ? 1 : 0
  if (body.activo === true) data.activo = 1
  if (body.activo === false) data.activo = 0
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Enviar nombre y/o activo" }, { status: 400 })
  }

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
    console.error("PATCH /api/catalogos/tipos-equipo/[id]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al actualizar tipo" },
      { status: 500 }
    )
  }
}
