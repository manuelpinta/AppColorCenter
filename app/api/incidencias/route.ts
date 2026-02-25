import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { crearIncidencia } from "@/lib/data"
import { parseEquipoId } from "@/lib/data"
import type { EstadoIncidencia, SeveridadIncidencia } from "@/lib/types"

/** Parsea sucursal_id que puede ser compuesto (emp-1-5) o numérico. */
function parseSucursalId(id: string): { empresaId: string; numericId: string } {
  const lastDash = id.lastIndexOf("-")
  if (lastDash > 0 && id.startsWith("emp-")) {
    const empresaId = id.slice(0, lastDash)
    const numericId = id.slice(lastDash + 1)
    if (empresaId && numericId) return { empresaId, numericId }
  }
  return { empresaId: "", numericId: id }
}

export async function POST(request: NextRequest) {
  let body: {
    sucursal_id: string
    equipo_id?: string | null
    fecha_reporte?: string
    descripcion: string
    severidad?: SeveridadIncidencia | null
    estado?: EstadoIncidencia
    notas?: string | null
    empresa_id?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 })
  }
  const {
    sucursal_id,
    equipo_id = null,
    fecha_reporte = new Date().toISOString().slice(0, 10),
    descripcion,
    severidad = null,
    estado = "Reportada",
    notas = null,
    empresa_id: bodyEmpresaId,
  } = body
  if (!sucursal_id || typeof sucursal_id !== "string") {
    return NextResponse.json({ error: "sucursal_id es requerido" }, { status: 400 })
  }
  if (!descripcion?.trim()) {
    return NextResponse.json({ error: "descripcion es requerido" }, { status: 400 })
  }
  const validEstados: EstadoIncidencia[] = ["Reportada", "En atención", "Resuelta", "Cerrada"]
  const validSeveridades: (SeveridadIncidencia | null)[] = [null, "Baja", "Media", "Alta", "Crítica"]
  if (!validEstados.includes(estado)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 })
  }
  if (severidad !== null && !validSeveridades.includes(severidad)) {
    return NextResponse.json({ error: "severidad inválida" }, { status: 400 })
  }
  const { empresaId, numericId: sucursalNumericId } = parseSucursalId(sucursal_id)
  const empresaIdToUse = bodyEmpresaId ?? empresaId
  if (!empresaIdToUse) {
    return NextResponse.json(
      { error: "empresa_id es requerido o use sucursal_id compuesto (emp-1-5)" },
      { status: 400 }
    )
  }
  let equipoNumericId: string | null = null
  if (equipo_id) {
    const parsed = parseEquipoId(equipo_id)
    equipoNumericId = parsed.numericId
  }
  try {
    const pool = await getPool(empresaIdToUse)
    const incidencia = await crearIncidencia(pool, {
      sucursal_id: sucursalNumericId,
      equipo_id: equipoNumericId,
      fecha_reporte,
      descripcion: descripcion.trim(),
      severidad,
      estado,
      notas: notas?.trim() ?? null,
    })
    return NextResponse.json({ incidencia })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear incidencia"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
