import type { Empresa } from "@/lib/types"
import { getEmpresaIdsForDataLayer } from "@/lib/db"
import type { EmpresaId } from "@/lib/empresas-config"
import { getEmpresas } from "./empresas"

/**
 * Empresas visibles para el usuario actual (Auth0 Organizations + reglas de rol).
 * Usar en Server Components para poblar dropdowns/filtros de empresa.
 */
export async function getEmpresasForCurrentUser(): Promise<Empresa[]> {
  const allowedIds = new Set(await getEmpresaIdsForDataLayer())
  return getEmpresas().filter((empresa) => allowedIds.has(empresa.id as EmpresaId))
}
