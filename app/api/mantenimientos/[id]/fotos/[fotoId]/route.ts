import { NextResponse } from "next/server"
import { userCanWrite } from "@/lib/auth-roles"
import { isEmpresaAllowedForRequest } from "@/lib/db"
import { eliminarFotoMantenimiento, findMantenimientoInAllBases, getFotoMantenimientoUrl } from "@/lib/data"
import { apiError } from "@/lib/api-error"
import { removeStoredFoto } from "@/lib/supabase"

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
    const url = await getFotoMantenimientoUrl(found.pool, fotoId, found.mantenimiento.id)
    if (!url) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
    }
    await removeStoredFoto(url)
    const deleted = await eliminarFotoMantenimiento(found.pool, fotoId, found.mantenimiento.id)
    if (!deleted) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err, "Error al eliminar la foto", 500)
  }
}
