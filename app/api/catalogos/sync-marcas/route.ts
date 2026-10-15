import { NextResponse } from "next/server"
import { syncAllMarcasFromMaster } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"

/** Re-sincroniza todas las marcas del maestro a todas las bases configuradas (incl. Honduras). */
export async function POST() {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para sincronizar catálogos" }, { status: 403 })
  }
  try {
    const result = await syncAllMarcasFromMaster()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return apiError(err, "Error al sincronizar marcas")
  }
}
