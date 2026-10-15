import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest, type EmpresaId } from "@/lib/db"
import { registrarMovimientoEquipo, getSucursalesByEmpresa } from "@/lib/data"
import { userCanWrite } from "@/lib/auth-roles"
import { apiError } from "@/lib/api-error"
import { moverEquipoSchema, readBody, readUrlId } from "@/lib/api-schemas"
import { parseId } from "@/lib/data/ids"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para mover equipos" }, { status: 403 })
  }

  const { id: equipoIdParam } = await params
  const urlId = readUrlId(equipoIdParam, "equipo")
  if (!urlId.ok) return urlId.response

  const parsed = await readBody(request, moverEquipoSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  const destino = parseId(body.sucursal_destino_id, "sucursal")
  if (!/^\d+$/.test(destino.numericId)) {
    return NextResponse.json({ error: "sucursal_destino_id inválido" }, { status: 400 })
  }

  const empresaIdForPool = urlId.parsed.empresaId ?? body.empresa_id
  if (!empresaIdForPool) {
    return NextResponse.json(
      { error: "empresa_id es requerido (multi-DB) o usa id compuesto en la URL (ej. GALLCO-105-45)" },
      { status: 400 }
    )
  }
  if (!(await isEmpresaAllowedForRequest(empresaIdForPool))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }
  const sucursalesActivas = await getSucursalesByEmpresa(empresaIdForPool as EmpresaId)
  if (!sucursalesActivas.some((c) => c.id === destino.numericId)) {
    return NextResponse.json({ error: "La sucursal destino no existe o está cerrada" }, { status: 400 })
  }
  try {
    const pool = await getPool(empresaIdForPool)
    const movimiento = await registrarMovimientoEquipo(
      pool,
      urlId.numericId,
      destino.numericId,
      body.motivo ?? null,
      body.registrado_por ?? null
    )
    return NextResponse.json({ movimiento })
  } catch (err) {
    return apiError(err, "Error al registrar movimiento", 400)
  }
}
