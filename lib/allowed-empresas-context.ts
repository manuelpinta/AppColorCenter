import { cache } from "react"
import { auth0 } from "@/lib/auth0"
import {
  getUserOrganizations,
  mapOrganizationsToEmpresaIds,
  isAuth0OrganizationsEnabled,
} from "@/lib/auth0-organizations"
import type { EmpresaId } from "@/lib/empresas-config"

/**
 * Por request (React cache): allowed EmpresaIds del usuario desde Auth0 Organizations.
 * El layout debe llamar esto primero; la capa de datos usa getEmpresaIdsForDataLayer() que lo consume.
 */
export const getCachedAllowedEmpresaIds = cache(async (): Promise<EmpresaId[] | null> => {
  if (!isAuth0OrganizationsEnabled()) return null
  try {
    const session = await auth0.getSession()
    if (!session?.user?.sub) return null
    const orgs = await getUserOrganizations(session.user.sub)
    const allowed = mapOrganizationsToEmpresaIds(orgs)
    return allowed.length > 0 ? allowed : null
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[allowed-empresas-context] Failed to fetch orgs", err)
    return null
  }
})
