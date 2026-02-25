import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, getEmpresaIdForCatalogRead } from "@/lib/db"
import { getMarcasEquipo, getMarcasEquipoParaAdmin, crearMarca } from "@/lib/data/catalogos"
import { syncMarcaToOtrasBases } from "@/lib/data/catalogos-sync"

/** Lista marcas. ?empresa_id=emp-1 para leer de esa empresa (país/contexto); si no, maestro. ?incluir_inactivos=1 para admin. */
export async function GET(request: NextRequest) {
  try {
    const empresaParam = request.nextUrl.searchParams.get("empresa_id")
    const empresaId = getEmpresaIdForCatalogRead(empresaParam)
    const pool = await getPool(empresaId)
    const incluirInactivos = request.nextUrl.searchParams.get("incluir_inactivos") === "1"
    const items = incluirInactivos
      ? await getMarcasEquipoParaAdmin(pool)
      : (await getMarcasEquipo(pool)).map((m) => ({ ...m, activo: 1 }))
    return NextResponse.json(items)
  } catch (err) {
    console.error("GET /api/catalogos/marcas", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al listar marcas" },
      { status: 500 }
    )
  }
}

/** Crea una marca en el maestro (Pintacomex) y replica a las demás bases. */
export async function POST(request: NextRequest) {
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
    const pool = await getPool(empresaId)
    const created = await crearMarca(pool, nombre)
    await syncMarcaToOtrasBases(Number(created.id), created.nombre)
    return NextResponse.json(created)
  } catch (err) {
    console.error("POST /api/catalogos/marcas", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear marca" },
      { status: 500 }
    )
  }
}
