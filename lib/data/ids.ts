/**
 * Helpers de IDs compuestos (sucursal, equipo) sin depender de lib/db.
 * Usado por componentes cliente para evitar meter mysql2 en el bundle.
 */
import type { ColorCenter, Equipo, EquipoWithEmpresa } from "@/lib/types"
import { EMPRESA_IDS, type EmpresaId } from "@/lib/empresas-config"
import { getEmpresaById, getEmpresaByCodigo } from "./empresas"

export function buildSucursalCompositeId(empresaId: EmpresaId, colorCenter: ColorCenter): string {
  const empresa = getEmpresaById(empresaId)
  const codigo = empresa?.codigo || empresaId
  return `${codigo}-SUC${colorCenter.id}`
}

export function buildSucursalCompositeIdFromIds(empresaId: EmpresaId, sucursalId: string): string {
  const empresa = getEmpresaById(empresaId)
  const codigo = empresa?.codigo || empresaId
  return `${codigo}-SUC${sucursalId}`
}

export type ParsedId = { empresaId?: EmpresaId; numericId: string }

/**
 * Qué formato compuesto aceptar, además del numérico y de `emp-N-id`.
 * - recurso: mantenimiento, incidencia o catálogo (`42`, `emp-2-42`)
 * - sucursal: además `GALLCO-SUC41`
 * - equipo: además `GALLCO-105-45`
 * - auto: los tres
 */
export type ParseIdKind = "auto" | "sucursal" | "equipo" | "recurso"

function parseSucursalCodigo(value: string): ParsedId | null {
  const parts = value.split("-")
  if (parts.length === 2 && parts[1].toUpperCase().startsWith("SUC")) {
    const empresa = getEmpresaByCodigo(parts[0])
    const numericId = parts[1].slice(3)
    if (empresa && numericId) return { empresaId: empresa.id as EmpresaId, numericId }
  }
  return null
}

function parseEquipoCodigo(value: string): ParsedId | null {
  const parts = value.split("-")
  if (parts.length === 3 && !value.startsWith("emp-")) {
    const empresa = getEmpresaByCodigo(parts[0])
    const numericId = parts[2]
    if (empresa && numericId) return { empresaId: empresa.id as EmpresaId, numericId }
  }
  return null
}

function parseEmpSuffix(value: string): ParsedId | null {
  const lastDash = value.lastIndexOf("-")
  if (lastDash > 0 && value.startsWith("emp-")) {
    const empresaId = value.slice(0, lastDash) as EmpresaId
    const numericId = value.slice(lastDash + 1)
    if (EMPRESA_IDS.includes(empresaId) && numericId) return { empresaId, numericId }
  }
  return null
}

/** Un solo lector para los ids de la URL y de los cuerpos (numérico o compuesto). */
export function parseId(id: string, kind: ParseIdKind = "auto"): ParsedId {
  const value = id.trim()
  if (!value) return { numericId: "" }
  if (kind === "auto" || kind === "sucursal") {
    const sucursal = parseSucursalCodigo(value)
    if (sucursal) return sucursal
  }
  if (kind === "auto" || kind === "equipo") {
    const equipo = parseEquipoCodigo(value)
    if (equipo) return equipo
  }
  const emp = parseEmpSuffix(value)
  if (emp) return emp
  return { numericId: value }
}

export function parseSucursalId(id: string): ParsedId {
  return parseId(id, "sucursal")
}

export function buildEquipoCompositeId(empresaId: EmpresaId, equipo: Equipo): string {
  const empresa = getEmpresaById(empresaId)
  const codigo = empresa?.codigo || empresaId
  return `${codigo}-${equipo.color_center_id}-${equipo.id}`
}

export function parseEquipoId(equipoId: string): ParsedId {
  return parseId(equipoId, "equipo")
}

/** Alinea `?equipo_id=` de la URL con el id compuesto usado en listados (p. ej. Select de mantenimientos). */
export function resolveDefaultEquipoIdForForm(equipos: Equipo[], defaultEquipoId?: string): string {
  if (!defaultEquipoId?.trim()) return ""
  const trimmed = defaultEquipoId.trim()
  if (equipos.some((e) => e.id === trimmed)) return trimmed
  const parsed = parseEquipoId(trimmed)
  const match = equipos.find((e) => {
    const ep = parseEquipoId(e.id)
    if (parsed.empresaId && ep.empresaId) {
      return ep.numericId === parsed.numericId && ep.empresaId === parsed.empresaId
    }
    return ep.numericId === parsed.numericId
  })
  return match?.id ?? trimmed
}

/** Cruza un mantenimiento (empresa + equipo_id numérico o compuesto) con la lista de equipos (id compuesto CODIGO-sucursal-id). */
export function findEquipoForMantenimientoRow(
  mant: { empresa_id: string; equipo_id: string },
  equipos: EquipoWithEmpresa[]
): EquipoWithEmpresa | undefined {
  const mEq = parseEquipoId(String(mant.equipo_id).trim()).numericId
  if (!mEq) return undefined
  return equipos.find((e) => {
    if (e.empresa_id !== mant.empresa_id) return false
    return parseEquipoId(e.id).numericId === mEq
  })
}
