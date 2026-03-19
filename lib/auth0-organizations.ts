import type { EmpresaId } from "@/lib/empresas-config"
import { EMPRESA_IDS } from "@/lib/empresas-config"

const AUTH0_ORGANIZATIONS_ENABLED = process.env.AUTH0_ORGANIZATIONS_ENABLED === "true"

/** Respuesta de GET /api/v2/users/{id}/organizations (cada item). */
interface Auth0Organization {
  id: string
  name: string
}

/** Respuesta de GET /api/v2/users/{user_id}/roles (solo usamos name). */
interface Auth0Role {
  id: string
  name: string
}

/**
 * Mapeo nombre de Organization en Auth0 → EmpresaId.
 * Case-insensitive; "Pintacomex" y "Pinta" → emp-1.
 */
const ORG_NAME_TO_EMPRESA: Record<string, EmpresaId> = {
  pinta: "emp-1",
  pintacomex: "emp-1",
  gallco: "emp-2",
  belice: "emp-3",
  salvador: "emp-4",
  honduras: "emp-5",
}

function normalizeOrgName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "")
}

function mapOrgToEmpresaId(org: Auth0Organization): EmpresaId | null {
  const key = normalizeOrgName(org.name)
  const empresaId = ORG_NAME_TO_EMPRESA[key]
  if (empresaId && EMPRESA_IDS.includes(empresaId)) return empresaId
  return null
}

/** Obtiene access token para Auth0 Management API (client credentials). */
async function getManagementApiToken(): Promise<string> {
  const domain = process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_M2M_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET
  const audience = process.env.AUTH0_MANAGEMENT_AUDIENCE ?? `https://${domain}/api/v2/`
  const scopes = process.env.AUTH0_MANAGEMENT_SCOPES?.trim()

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "Auth0 Organizations: faltan AUTH0_DOMAIN y (AUTH0_M2M_CLIENT_ID + AUTH0_M2M_CLIENT_SECRET) o AUTH0_CLIENT_ID + AUTH0_CLIENT_SECRET"
    )
  }

  const controller = new AbortController()
  const timeoutMs = Number(process.env.AUTH0_MANAGEMENT_FETCH_TIMEOUT_MS) || 8000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        ...(scopes ? { scope: scopes } : {}),
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Auth0 Management API token failed: ${res.status} ${text}`)
    }

    const data = (await res.json()) as { access_token?: string }
    if (!data.access_token) throw new Error("Auth0 token response missing access_token")
    return data.access_token
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[auth0-organizations] Management token fetch failed", err)
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Devuelve las organizaciones a las que pertenece el usuario (Auth0 Management API).
 * Requiere M2M app con scope read:organization_memberships (y read:organizations para nombres).
 */
export async function getUserOrganizations(userId: string): Promise<Auth0Organization[]> {
  if (!AUTH0_ORGANIZATIONS_ENABLED) return []

  const domain = process.env.AUTH0_DOMAIN
  if (!domain) return []

  const token = await getManagementApiToken()
  const controller = new AbortController()
  const timeoutMs = Number(process.env.AUTH0_MANAGEMENT_FETCH_TIMEOUT_MS) || 8000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })

    if (res.status === 404) return []
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Auth0 getUserOrganizations failed: ${res.status} ${text}`)
    }

    const list = (await res.json()) as Auth0Organization[]
    return Array.isArray(list) ? list : []
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[auth0-organizations] getUserOrganizations fetch failed", err)
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Obtiene roles del usuario desde Auth0 Management API.
 * Requiere M2M con scope read:roles.
 */
export async function getUserRolesFromManagementAPI(userId: string): Promise<string[]> {
  if (!AUTH0_ORGANIZATIONS_ENABLED) return []

  const domain = process.env.AUTH0_DOMAIN
  if (!domain) return []

  const token = await getManagementApiToken()
  const controller = new AbortController()
  const timeoutMs = Number(process.env.AUTH0_MANAGEMENT_FETCH_TIMEOUT_MS) || 8000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error("[auth0-organizations] getUserRolesFromManagementAPI failed", res.status)
      const text = await res.text().catch(() => "")
      throw new Error(`Auth0 getUserRolesFromManagementAPI failed: ${res.status} ${text}`)
    }

    const list = (await res.json()) as Auth0Role[]
    return Array.isArray(list) ? list.map((r) => r.name).filter((n) => typeof n === "string" && n.trim() !== "") : []
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Convierte la lista de organizaciones del usuario en EmpresaIds permitidos.
 * Solo incluye empresas que existen en EMPRESA_IDS (mapeo por nombre de org).
 */
/** Orden determinista para evitar hydration mismatch (mismo orden servidor/cliente). */
export function mapOrganizationsToEmpresaIds(orgs: Auth0Organization[]): EmpresaId[] {
  const set = new Set<EmpresaId>()
  for (const org of orgs) {
    const eid = mapOrgToEmpresaId(org)
    if (eid) set.add(eid)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function isAuth0OrganizationsEnabled(): boolean {
  return AUTH0_ORGANIZATIONS_ENABLED
}
