import { NextResponse } from "next/server"
import { userCanWrite } from "@/lib/auth-roles"
import { isEmpresaAllowedForRequest } from "@/lib/db"
import { eliminarFotoMantenimiento, findMantenimientoInAllBases } from "@/lib/data"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para eliminar fotos" }, { status: 403 })
  }

  const { id, fotoId } = await params
  const found = await findMantenimientoInAllBases(id)
  if (!found) {
    return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 })
  }
  if (!(await isEmpresaAllowedForRequest(found.empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  try {
    await eliminarFotoMantenimiento(found.pool, fotoId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar foto" }, { status: 400 })
  }
}
