/**
 * Helpers de IDs compuestos (sucursal, equipo) sin depender de lib/db.
 * Usado por componentes cliente para evitar meter mysql2 en el bundle.
 */
import type { ColorCenter, Equipo } from "@/lib/types"
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
