import { NextResponse } from "next/server"
import { findEquipoInAllBases, eliminarFotoEquipo } from "@/lib/data"
import { isEmpresaAllowedForRequest } from "@/lib/db"
import { userCanWrite } from "@/lib/auth-roles"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para eliminar fotos" }, { status: 403 })
  }

  const { id: equipoIdParam, fotoId } = await params
  const found = await findEquipoInAllBases(equipoIdParam)
  if (!found) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
  }
  const { empresaId } = found
  if (!(await isEmpresaAllowedForRequest(empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }
  try {
    await eliminarFotoEquipo(found.pool, fotoId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 400 })
  }
}
