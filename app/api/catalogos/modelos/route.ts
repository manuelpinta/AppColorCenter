import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, getEmpresaIdForCatalogRead, isEmpresaAllowedForRequest } from "@/lib/db"
import { getModelosAll, getModelosAllParaAdmin, getModelosByMarca, crearModelo } from "@/lib/data/catalogos"
import { syncModeloToOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"

/** Lista modelos. ?empresa_id=emp-1 para leer de esa empresa; ?marca_id= filtrar; ?incluir_inactivos=1 para admin. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = getEmpresaIdForCatalogRead(searchParams.get("empresa_id"))
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    const marcaId = searchParams.get("marca_id")
    const incluirInactivos = searchParams.get("incluir_inactivos") === "1"
    const items = incluirInactivos
      ? await getModelosAllParaAdmin(pool)
      : marcaId
        ? await getModelosByMarca(pool, marcaId)
        : await getModelosAll(pool)
    return NextResponse.json(items)
  } catch (err) {
    console.error("GET /api/catalogos/modelos", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al listar modelos" },
      { status: 500 }
    )
  }
}

/** Crea un modelo en el maestro (Pintacomex) y replica a las demás bases. */
export async function POST(request: NextRequest) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar modelos" }, { status: 403 })
  }
  let body: { marca_id?: string; nombre?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  const marca_id = typeof body.marca_id === "string" ? body.marca_id.trim() : ""
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : ""
  if (!marca_id || !nombre) {
    return NextResponse.json(
      { error: "marca_id y nombre son requeridos" },
      { status: 400 }
    )
  }

  try {
    const empresaId = getCatalogoMaestroEmpresaId()
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    const created = await crearModelo(pool, marca_id, nombre)
    await syncModeloToOtrasBases(
      Number(created.id),
      Number(created.marca_id),
      created.nombre
    )
    return NextResponse.json(created)
  } catch (err) {
    console.error("POST /api/catalogos/modelos", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear modelo" },
      { status: 500 }
    )
  }
}
