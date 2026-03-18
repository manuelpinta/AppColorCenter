import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { registrarMovimientoEquipo, parseEquipoId } from "@/lib/data"
import { userCanWrite } from "@/lib/auth-roles"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para mover equipos" }, { status: 403 })
  }

  const { id: equipoIdParam } = await params
  const { empresaId: parsedEmpresaId, numericId } = parseEquipoId(equipoIdParam)
  const empresa_id = parsedEmpresaId
  const equipoId = numericId

  let body: {
    sucursal_destino_id: string
    motivo?: string | null
    registrado_por?: string | null
    empresa_id?: string
  }
  try {
    body = await _request.json()
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido" },
      { status: 400 }
    )
  }
  const { sucursal_destino_id, motivo = null, registrado_por = null, empresa_id: bodyEmpresaId } = body
  if (!sucursal_destino_id || typeof sucursal_destino_id !== "string") {
    return NextResponse.json(
      { error: "sucursal_destino_id es requerido" },
      { status: 400 }
    )
  }
  const empresaIdForPool = empresa_id ?? bodyEmpresaId
  if (!empresaIdForPool || typeof empresaIdForPool !== "string") {
    return NextResponse.json(
      { error: "empresa_id es requerido (multi-DB) o usa id compuesto en la URL (ej. GALLCO-105-45)" },
      { status: 400 }
    )
  }
  if (!(await isEmpresaAllowedForRequest(empresaIdForPool))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }
  try {
    const pool = await getPool(empresaIdForPool)
    const movimiento = await registrarMovimientoEquipo(
      pool,
      equipoId,
      sucursal_destino_id,
      motivo ?? null,
      registrado_por ?? null
    )
    return NextResponse.json({ movimiento })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrar movimiento"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
