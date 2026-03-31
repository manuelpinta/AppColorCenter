import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { getUserRolesFromManagementAPI } from "@/lib/auth0-organizations"

const ROLES_CLAIM = "https://colorcenter.app/roles"

const ROLES_FALLBACK_MANAGEMENT_API_ENABLED = process.env.AUTH0_ROLES_FALLBACK_MANAGEMENT_API === "true"

type RolesForAuthorization = {
  roles: string[]
  rolesClaimPresent: boolean
}

async function getRolesForAuthorization(): Promise<RolesForAuthorization> {
  const session = await auth0.getSession()
  const user = session?.user
  const rolesClaimValue = user?.[ROLES_CLAIM]
  const rolesClaimPresent = rolesClaimValue !== undefined

  // If claim is present and well-formed, use it as the source of truth.
  if (Array.isArray(rolesClaimValue)) {
    return { roles: rolesClaimValue as string[], rolesClaimPresent }
  }

  // Claim missing (or wrong type): optionally fallback to Management API.
  if (!ROLES_FALLBACK_MANAGEMENT_API_ENABLED) {
    return { roles: [], rolesClaimPresent }
  }

  const sub = user?.sub ?? "unknown-sub"
  try {
    const roles = await getUserRolesFromManagementAPI(sub)
    return { roles, rolesClaimPresent }
  } catch {
    return { roles: [], rolesClaimPresent }
  }
}

export async function getUserRoles(): Promise<string[]> {
  return (await getRolesForAuthorization()).roles
}

export async function userHasRole(role: string): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.includes(role)
}

export async function userCanWrite(): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.includes("soporte") || roles.includes("soporte-central")
}

export async function userCanEditNormatividadFields(): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.includes("normatividad")
}

export async function userCanUpdateEquipos(): Promise<boolean> {
  const [canWrite, canEditNormatividad] = await Promise.all([
    userCanWrite(),
    userCanEditNormatividadFields(),
  ])
  return canWrite || canEditNormatividad
}

export async function userCanRead(): Promise<boolean> {
  const session = await auth0.getSession()
  return Boolean(session?.user)
}

export async function requireRead(redirectTo: string = "/"): Promise<void> {
  const canRead = await userCanRead()
  if (!canRead) {
    redirect(redirectTo)
  }
}

export async function requireWrite(redirectTo: string = "/"): Promise<void> {
  const { roles, rolesClaimPresent } = await getRolesForAuthorization()
  const canWrite = roles.includes("soporte") || roles.includes("soporte-central")

  if (canWrite) return

  if (!roles.length && !rolesClaimPresent) {
    redirect("/sin-rol?reason=roles_claim_missing")
  }

  redirect(`/sin-rol?reason=insufficient_write&redirectTo=${encodeURIComponent(redirectTo)}`)
}

export async function requireUpdateEquipos(redirectTo: string = "/"): Promise<void> {
  const canUpdate = await userCanUpdateEquipos()
  if (canUpdate) return
  await requireWrite(redirectTo)
}

