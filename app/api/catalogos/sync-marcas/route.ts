import { NextResponse } from "next/server"
import { syncAllMarcasFromMaster } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"

/** Re-sincroniza todas las marcas del maestro a todas las bases configuradas (incl. Honduras). */
export async function POST() {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para sincronizar catálogos" }, { status: 403 })
  }
  try {
    const result = await syncAllMarcasFromMaster()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("POST /api/catalogos/sync-marcas", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al sincronizar marcas" },
      { status: 500 }
    )
  }
}
