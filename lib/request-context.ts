import { AsyncLocalStorage } from "async_hooks"
import type { EmpresaId } from "@/lib/empresas-config"

export interface RequestContextValue {
  allowedEmpresaIds: EmpresaId[] | null
}

/**
 * Request-scoped context para "allowed empresas" del usuario (desde Auth0 Organizations).
 * El layout protegido escribe aquí; la capa de datos lee en getEmpresaIdsForDataLayer().
 */
export const requestContext = new AsyncLocalStorage<RequestContextValue>()

export function runWithAllowedEmpresas<T>(allowedEmpresaIds: EmpresaId[] | null, fn: () => T): T {
  return requestContext.run({ allowedEmpresaIds }, fn)
}

export function getAllowedEmpresaIdsFromContext(): EmpresaId[] | null {
  return requestContext.getStore()?.allowedEmpresaIds ?? null
}
