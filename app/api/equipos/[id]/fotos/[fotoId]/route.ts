import { NextResponse } from "next/server"
import { findEquipoInAllBases, eliminarFotoEquipo } from "@/lib/data"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const { id: equipoIdParam, fotoId } = await params
  const found = await findEquipoInAllBases(equipoIdParam)
  if (!found) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
  }
  try {
    await eliminarFotoEquipo(found.pool, fotoId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 400 })
  }
}
