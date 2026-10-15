import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, getEmpresaIdForCatalogRead, isEmpresaAllowedForRequest } from "@/lib/db"
import { getArrendadores, getArrendadoresParaAdmin, crearArrendador } from "@/lib/data/catalogos"
import { syncArrendadorToOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"

/** Lista arrendadores. ?empresa_id=emp-1 para leer de esa empresa; ?incluir_inactivos=1 solo Soporte Central. */
export async function GET(request: NextRequest) {
  try {
    const empresaId = getEmpresaIdForCatalogRead(request.nextUrl.searchParams.get("empresa_id"))
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    const incluirInactivos = request.nextUrl.searchParams.get("incluir_inactivos") === "1"
    if (incluirInactivos && !(await userHasRole("soporte-central"))) {
      return NextResponse.json({ error: "No tienes permisos para ver catálogos inactivos" }, { status: 403 })
    }
    const items = incluirInactivos
      ? await getArrendadoresParaAdmin(pool)
      : (await getArrendadores(pool)).map((a) => ({ ...a, activo: 1 }))
    return NextResponse.json(items)
  } catch (err) {
    return apiError(err, "Error al listar arrendadores")
  }
}

/** Crea un arrendador en el maestro (Pintacomex) y replica a las demás bases. */
export async function POST(request: NextRequest) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar arrendadores" }, { status: 403 })
  }
  let body: { nombre?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : ""
  if (!nombre) {
    return NextResponse.json({ error: "nombre es requerido" }, { status: 400 })
  }

  try {
    const empresaId = getCatalogoMaestroEmpresaId()
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    const created = await crearArrendador(pool, nombre)
    await syncArrendadorToOtrasBases(Number(created.id), created.nombre)
    return NextResponse.json(created)
  } catch (err) {
    return apiError(err, "Error al crear arrendador")
  }
}
