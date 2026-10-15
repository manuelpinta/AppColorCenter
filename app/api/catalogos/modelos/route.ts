import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, getEmpresaIdForCatalogRead, isEmpresaAllowedForRequest } from "@/lib/db"
import { getModelosAll, getModelosAllParaAdmin, getModelosByMarca, crearModelo } from "@/lib/data/catalogos"
import { syncModeloToOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"

/** Lista modelos. ?empresa_id=emp-1 para leer de esa empresa; ?marca_id= filtrar; ?incluir_inactivos=1 solo Soporte Central. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = getEmpresaIdForCatalogRead(searchParams.get("empresa_id"))
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    const marcaId = searchParams.get("marca_id")
    const tipoEquipoId = searchParams.get("tipo_equipo_id")
    const incluirInactivos = searchParams.get("incluir_inactivos") === "1"
    if (incluirInactivos && !(await userHasRole("soporte-central"))) {
      return NextResponse.json({ error: "No tienes permisos para ver catálogos inactivos" }, { status: 403 })
    }
    let items = incluirInactivos
      ? await getModelosAllParaAdmin(pool)
      : marcaId
        ? await getModelosByMarca(pool, marcaId)
        : await getModelosAll(pool)
    if (tipoEquipoId) {
      const tipoStr = String(tipoEquipoId)
      const [filtered] = await pool.query<{ id: number }[]>(
        "SELECT marca_id AS id FROM marca_tipo_equipo WHERE tipo_equipo_id = ? AND activo = 1",
        [tipoStr]
      )
      const allowed = new Set((Array.isArray(filtered) ? filtered : []).map((x) => String(x.id)))
      items = items.filter((item) => allowed.has(String(item.marca_id)))
    }
    return NextResponse.json(items)
  } catch (err) {
    return apiError(err, "Error al listar modelos")
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
    return apiError(err, "Error al crear modelo")
  }
}
