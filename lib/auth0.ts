import { Auth0Client } from "@auth0/nextjs-auth0/server"

/**
 * Cliente de Auth0 para Next.js (sesión en servidor).
 * Lee AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, APP_BASE_URL, AUTH0_SECRET de env.
 * Si Auth0 está en "Only organization", hace falta enviar organization en el login:
 * define AUTH0_ORGANIZATIONS_ENABLED=true y AUTH0_DEFAULT_ORGANIZATION_ID=org_xxx (ID de una org, p. ej. Pintacomex).
 */
const COLORCENTER_API_AUDIENCE =
  process.env.AUTH0_AUDIENCE ?? process.env.COLORCENTER_API_IDENTIFIER ?? "https://app-color-center-api.com"

const authorizationParameters: Record<string, string> = {}

// If Auth0 is configured as "Only organization", we must pass a default org to the login request.
if (process.env.AUTH0_ORGANIZATIONS_ENABLED === "true" && process.env.AUTH0_DEFAULT_ORGANIZATION_ID?.trim()) {
  authorizationParameters.organization = process.env.AUTH0_DEFAULT_ORGANIZATION_ID.trim()
}

// Request RBAC/authorization for our API, so Post Login can read event.authorization.roles.
authorizationParameters.audience = COLORCENTER_API_AUDIENCE

const auth0Options = Object.keys(authorizationParameters).length > 0 ? { authorizationParameters } : undefined

export const auth0 = new Auth0Client(auth0Options)
