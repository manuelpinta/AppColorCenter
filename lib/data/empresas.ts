import type { Empresa } from "@/lib/types"
import { EMPRESA_IDS, type EmpresaId } from "@/lib/empresas-config"

/** Empresas de la app (mapeo fijo a las 5 bases Color Center). */
export const APP_EMPRESAS: Empresa[] = [
  { id: "emp-1", nombre: "Pintacomex", codigo: "PINTA", pais: "Mexico", regiones: ["Golfo", "Guerrero", "Metro"], total_sucursales: 0, created_at: "2020-01-01T00:00:00Z" },
  { id: "emp-2", nombre: "Gallco", codigo: "GALLCO", pais: "Mexico", regiones: ["Aguascalientes"], total_sucursales: 0, created_at: "2020-01-01T00:00:00Z" },
  { id: "emp-3", nombre: "Belice", codigo: "BELICE", pais: "Belice", regiones: ["Belice"], total_sucursales: 0, created_at: "2021-01-01T00:00:00Z" },
  { id: "emp-4", nombre: "El Salvador", codigo: "SALVADOR", pais: "El Salvador", regiones: ["El Salvador"], total_sucursales: 0, created_at: "2021-06-01T00:00:00Z" },
  { id: "emp-5", nombre: "Honduras", codigo: "HONDURAS", pais: "Honduras", regiones: ["Honduras"], total_sucursales: 0, created_at: "2022-01-01T00:00:00Z" },
]

export const PINTACOMEX_EMPRESA_ID = "emp-1"

export function getEmpresas(): Empresa[] {
  return APP_EMPRESAS
}

export function getEmpresaById(id: string): Empresa | undefined {
  return APP_EMPRESAS.find((e) => e.id === id)
}

export function getEmpresaByCodigo(codigo: string): Empresa | undefined {
  const upper = codigo.toUpperCase()
  return APP_EMPRESAS.find((e) => e.codigo.toUpperCase() === upper)
}

export function isEmpresaId(id: string): id is EmpresaId {
  return EMPRESA_IDS.includes(id as EmpresaId)
}
