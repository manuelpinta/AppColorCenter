import { NextRequest, NextResponse } from "next/server"
import { getPool, getCatalogoMaestroEmpresaId, getEmpresaIdForCatalogRead, isEmpresaAllowedForRequest } from "@/lib/db"
import { getCatalogoNombres, getTiposEquipoParaAdmin, crearTipoEquipo } from "@/lib/data/catalogos"
import { syncCatTipoEquipoToOtrasBases } from "@/lib/data/catalogos-sync"
import { userHasRole } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { catalogNombreSchema, readBody } from "@/lib/api-schemas"

/** Lista tipos de equipo. ?empresa_id=emp-1 para leer de esa empresa; ?incluir_inactivos=1 solo Soporte Central. */
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
      ? await getTiposEquipoParaAdmin(pool)
      : (await getCatalogoNombres(pool, "cat_tipos_equipo")).map((r) => ({
          id: String(r.id),
          nombre: r.nombre,
          activo: 1,
        }))
    return NextResponse.json(items)
  } catch (err) {
    return apiError(err, "Error al listar tipos de equipo")
  }
}

/** Crea un tipo de equipo en el maestro (Pintacomex) y replica a las demás bases. */
export async function POST(request: NextRequest) {
  if (!(await userHasRole("soporte-central"))) {
    return NextResponse.json({ error: "No tienes permisos para gestionar tipos de equipo" }, { status: 403 })
  }
  const parsed = await readBody(request, catalogNombreSchema)
  if (!parsed.ok) return parsed.response
  const { nombre } = parsed.data

  try {
    const empresaId = getCatalogoMaestroEmpresaId()
    if (!(await isEmpresaAllowedForRequest(empresaId))) {
      return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
    }
    const pool = await getPool(empresaId)
    const created = await crearTipoEquipo(pool, nombre)
    await syncCatTipoEquipoToOtrasBases(Number(created.id), created.nombre)
    return NextResponse.json(created)
  } catch (err) {
    return apiError(err, "Error al crear tipo de equipo")
  }
}
