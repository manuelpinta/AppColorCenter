import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"

const ROLES_CLAIM = "https://colorcenter.app/roles"

const warnedMissingRolesForSub = new Set<string>()

type RolesClaimDebug = {
  sessionExists: boolean
  hasRolesClaim: boolean
  rolesClaimValue: unknown
  roles: string[]
}

async function getRolesClaimDebug(): Promise<RolesClaimDebug> {
  const session = await auth0.getSession()
  const sessionExists = Boolean(session?.user)
  const rolesClaimValue = session?.user?.[ROLES_CLAIM]
  const hasRolesClaim = rolesClaimValue !== undefined

  const roles = Array.isArray(rolesClaimValue) ? (rolesClaimValue as string[]) : []

  if (sessionExists && !hasRolesClaim) {
    const sub = session?.user?.sub ?? "unknown-sub"
    if (!warnedMissingRolesForSub.has(sub)) {
      warnedMissingRolesForSub.add(sub)
      // eslint-disable-next-line no-console
      console.warn("[auth-roles] Roles claim missing in Auth0 session. Falling back to read-only.", {
        sub,
      })
    }
  }

  if (sessionExists && hasRolesClaim && !Array.isArray(rolesClaimValue)) {
    const sub = session?.user?.sub ?? "unknown-sub"
    // eslint-disable-next-line no-console
    console.warn("[auth-roles] Roles claim present but not an array. Falling back to read-only.", {
      sub,
      claimType: typeof rolesClaimValue,
    })
  }

  return { sessionExists, hasRolesClaim, rolesClaimValue, roles }
}

export async function getUserRoles(): Promise<string[]> {
  const debug = await getRolesClaimDebug()
  return debug.roles
}

export async function userHasRole(role: string): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.includes(role)
}

export async function userCanWrite(): Promise<boolean> {
  const { roles, sessionExists, hasRolesClaim } = await getRolesClaimDebug()
  if (!sessionExists) return false
  if (!hasRolesClaim) return false
  return roles.includes("soporte") || roles.includes("soporte-central")
}

export async function userCanRead(): Promise<boolean> {
  const session = await auth0.getSession()
  // Fallback para debug: si los roles no llegan (claim ausente), mantenemos acceso de lectura.
  return Boolean(session?.user)
}

export async function requireRead(redirectTo: string = "/"): Promise<void> {
  const canRead = await userCanRead()
  if (!canRead) {
    redirect(redirectTo)
  }
}

export async function requireWrite(redirectTo: string = "/"): Promise<void> {
  const { hasRolesClaim, roles } = await getRolesClaimDebug()
  const canWrite = roles.includes("soporte") || roles.includes("soporte-central")

  if (canWrite) return

  // Si falló el “role lookup” (audience/claims), mandamos pantalla de error para debug.
  if (!hasRolesClaim) {
    redirect("/sin-rol?reason=roles_claim_missing")
  }

  // Roles presentes pero no tiene permisos de escritura.
  redirect(`/sin-rol?reason=insufficient_write&redirectTo=${encodeURIComponent(redirectTo)}`)
}

