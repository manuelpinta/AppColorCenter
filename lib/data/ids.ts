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

export function parseSucursalId(id: string): { empresaId?: EmpresaId; numericId: string } {
  const parts = id.split("-")
  if (parts.length === 2 && parts[1].toUpperCase().startsWith("SUC")) {
    const [codigo, sucPart] = parts
    const empresa = getEmpresaByCodigo(codigo)
    const numericId = sucPart.slice(3)
    if (empresa && numericId) return { empresaId: empresa.id as EmpresaId, numericId }
  }
  const lastDash = id.lastIndexOf("-")
  if (lastDash > 0 && id.startsWith("emp-")) {
    const empresaId = id.slice(0, lastDash) as EmpresaId
    const numericId = id.slice(lastDash + 1)
    if (EMPRESA_IDS.includes(empresaId) && numericId) return { empresaId, numericId }
  }
  return { numericId: id }
}

export function buildEquipoCompositeId(empresaId: EmpresaId, equipo: Equipo): string {
  const empresa = getEmpresaById(empresaId)
  const codigo = empresa?.codigo || empresaId
  return `${codigo}-${equipo.color_center_id}-${equipo.id}`
}

export function parseEquipoId(equipoId: string): { empresaId?: EmpresaId; numericId: string } {
  const parts = equipoId.split("-")
  if (parts.length === 3) {
    const [codigo, , numericId] = parts
    const empresa = getEmpresaByCodigo(codigo)
    if (empresa && numericId) return { empresaId: empresa.id as EmpresaId, numericId }
  }
  if (parts.length === 3 && equipoId.startsWith("emp-")) {
    const empresaId = `${parts[0]}-${parts[1]}` as EmpresaId
    const numericId = parts[2]
    if (EMPRESA_IDS.includes(empresaId) && numericId) return { empresaId, numericId }
  }
  const lastDash = equipoId.lastIndexOf("-")
  if (lastDash > 0 && equipoId.startsWith("emp-")) {
    const empresaId = equipoId.slice(0, lastDash) as EmpresaId
    const numericId = equipoId.slice(lastDash + 1)
    if (EMPRESA_IDS.includes(empresaId) && numericId) return { empresaId, numericId }
  }
  return { numericId: equipoId }
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
