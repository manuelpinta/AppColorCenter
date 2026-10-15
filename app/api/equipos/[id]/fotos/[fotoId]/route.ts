import { NextResponse } from "next/server"
import { findEquipoInAllBases, getFotoEquipoUrl, eliminarFotoEquipo } from "@/lib/data"
import { isEmpresaAllowedForRequest } from "@/lib/db"
import { userCanWrite } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { removeStoredFoto } from "@/lib/supabase"

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
    const url = await getFotoEquipoUrl(found.pool, fotoId, found.equipo.id)
    if (!url) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
    }
    await removeStoredFoto(url)
    const deleted = await eliminarFotoEquipo(found.pool, fotoId, found.equipo.id)
    if (!deleted) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err, "Error al eliminar la foto", 500)
  }
}
