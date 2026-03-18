import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, getEmpresaIdForCatalogRead, isEmpresaAllowedForRequest } from "@/lib/db"
import { getArrendadores, getArrendadoresParaAdmin, crearArrendador } from "@/lib/data/catalogos"
import { syncArrendadorToOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"

/** Lista arrendadores. ?empresa_id=emp-1 para leer de esa empresa; ?incluir_inactivos=1 para admin. */
export async function GET(request: NextRequest) {
  try {
    const empresaId = getEmpresaIdForCatalogRead(request.nextUrl.searchParams.get("empresa_id"))
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    const incluirInactivos = request.nextUrl.searchParams.get("incluir_inactivos") === "1"
    const items = incluirInactivos
      ? await getArrendadoresParaAdmin(pool)
      : (await getArrendadores(pool)).map((a) => ({ ...a, activo: 1 }))
    return NextResponse.json(items)
  } catch (err) {
    console.error("GET /api/catalogos/arrendadores", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al listar arrendadores" },
      { status: 500 }
    )
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
    console.error("POST /api/catalogos/arrendadores", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear arrendador" },
      { status: 500 }
    )
  }
}
