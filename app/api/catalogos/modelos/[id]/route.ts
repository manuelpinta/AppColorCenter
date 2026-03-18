import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, isEmpresaAllowedForRequest } from "@/lib/db"
import { actualizarModelo, getModeloById } from "@/lib/data/catalogos"
import { updateModeloInOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"

/** Actualiza un modelo en el maestro y replica. Body: { nombre?: string, marca_id?: string, activo?: number }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar modelos" }, { status: 403 })
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 })
  }
  let body: { nombre?: string; marca_id?: string; activo?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  const data: { nombre?: string; marca_id?: string; activo?: number } = {}
  if (typeof body.nombre === "string") data.nombre = body.nombre.trim()
  if (typeof body.marca_id === "string") data.marca_id = body.marca_id.trim()
  if (typeof body.activo === "number") data.activo = body.activo === 1 ? 1 : 0
  if (body.activo === true) data.activo = 1
  if (body.activo === false) data.activo = 0
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Enviar nombre, marca_id y/o activo" }, { status: 400 })
  }

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
    console.error("PATCH /api/catalogos/modelos/[id]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al actualizar modelo" },
      { status: 500 }
    )
  }
}
