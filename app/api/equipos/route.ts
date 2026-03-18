import { NextRequest, NextResponse } from "next/server"
import { getPool, isEmpresaAllowedForRequest } from "@/lib/db"
import { crearEquipo, parseEquipoId, buildEquipoCompositeId, actualizarComputadora } from "@/lib/data"
import type { Equipo } from "@/lib/types"
import type { EmpresaId } from "@/lib/db"
import { userCanWrite } from "@/lib/auth-roles"

const bodyAllowed = [
  "color_center_id",
  "tipo_equipo",
  "marca",
  "modelo",
  "numero_serie",
  "fecha_compra",
  "tipo_propiedad",
  "arrendador",
  "fecha_vencimiento_arrendamiento",
  "estado",
  "ultima_calibracion",
  "proxima_revision",
  "notas",
] as const

export async function POST(request: NextRequest) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para crear equipos" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const rawCcId = body.color_center_id
  const rawEmpresaId = body.empresa_id
  let empresaId: string
  let sucursalIdNum: number

  if (typeof rawCcId === "string" && rawCcId.includes("-") && rawCcId.startsWith("emp-")) {
    const parsed = parseEquipoId(rawCcId)
    if (!parsed.empresaId || !parsed.numericId) {
      return NextResponse.json(
        { error: "color_center_id compuesto inválido (ej: emp-1-5)" },
        { status: 400 }
      )
    }
    empresaId = parsed.empresaId
    sucursalIdNum = Number(parsed.numericId)
  } else if (typeof rawEmpresaId === "string" && (rawCcId === undefined || rawCcId === null || typeof rawCcId === "string")) {
    empresaId = rawEmpresaId
    const n = Number(rawCcId)
    if (Number.isNaN(n) || n < 1) {
      return NextResponse.json(
        { error: "color_center_id (sucursal) numérico requerido" },
        { status: 400 }
      )
    }
    sucursalIdNum = n
  } else {
    return NextResponse.json(
      { error: "Se requiere empresa_id y color_center_id, o color_center_id compuesto (emp-X-Y)" },
      { status: 400 }
    )
  }

  const data: Record<string, unknown> = { color_center_id: sucursalIdNum }
  for (const key of bodyAllowed) {
    if (key !== "color_center_id" && body[key] !== undefined) data[key] = body[key]
  }

  const tipo_equipo = data.tipo_equipo as Equipo["tipo_equipo"] | undefined
  const tipo_propiedad = data.tipo_propiedad as Equipo["tipo_propiedad"] | undefined
  const estado = data.estado as Equipo["estado"] | undefined
  if (!tipo_equipo || !tipo_propiedad || !estado) {
    return NextResponse.json(
      { error: "tipo_equipo, tipo_propiedad y estado son requeridos" },
      { status: 400 }
    )
  }

  const computadoraPayload = body.computadora

  if (!(await isEmpresaAllowedForRequest(empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  try {
    const pool = await getPool(empresaId)
    const equipo = await crearEquipo(pool, {
      color_center_id: sucursalIdNum,
      tipo_equipo,
      marca: (data.marca as string | null) ?? null,
      modelo: (data.modelo as string | null) ?? null,
      numero_serie: (data.numero_serie as string | null) ?? null,
      fecha_compra: (data.fecha_compra as string | null) ?? null,
      tipo_propiedad,
      arrendador: (data.arrendador as string | null) ?? null,
      fecha_vencimiento_arrendamiento: (data.fecha_vencimiento_arrendamiento as string | null) ?? null,
      estado,
      ultima_calibracion: (data.ultima_calibracion as string | null) ?? null,
      proxima_revision: (data.proxima_revision as string | null) ?? null,
      notas: (data.notas as string | null) ?? null,
    })
    if (tipo_equipo === "Equipo de Computo" && computadoraPayload && typeof computadoraPayload === "object") {
      const comp = computadoraPayload as Record<string, unknown>
      await actualizarComputadora(pool, equipo.id, {
        procesador: (comp.procesador as string | null) ?? null,
        ram_gb: comp.ram_gb != null ? Number(comp.ram_gb) : null,
        almacenamiento_gb: comp.almacenamiento_gb != null ? Number(comp.almacenamiento_gb) : null,
        tipo_almacenamiento: (comp.tipo_almacenamiento as "SSD" | "HDD" | null) ?? null,
        graficos: (comp.graficos as string | null) ?? null,
        windows_version: (comp.windows_version as string | null) ?? null,
        so_64bits: comp.so_64bits === true || comp.so_64bits === "true",
      })
    }
    const compositeId = buildEquipoCompositeId(empresaId as EmpresaId, equipo)
    return NextResponse.json({ equipo: { ...equipo, id: compositeId }, empresa_id: empresaId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear equipo"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
