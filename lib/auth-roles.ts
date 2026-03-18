import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"

const ROLES_CLAIM = "https://colorcenter.app/roles"

export async function getUserRoles(): Promise<string[]> {
  const session = await auth0.getSession()
  if (!session) return []
  return (session.user[ROLES_CLAIM] as string[]) ?? []
}

export async function userHasRole(role: string): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.includes(role)
}

export async function userCanWrite(): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.includes("soporte") || roles.includes("soporte-central")
}

export async function userCanRead(): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.length > 0
}

export async function requireRead(redirectTo: string = "/"): Promise<void> {
  const canRead = await userCanRead()
  if (!canRead) {
    redirect(redirectTo)
  }
}

export async function requireWrite(redirectTo: string = "/"): Promise<void> {
  const canWrite = await userCanWrite()
  if (!canWrite) {
    redirect(redirectTo)
  }
}

