import { Auth0Client, filterDefaultIdTokenClaims } from "@auth0/nextjs-auth0/server"

/**
 * Cliente de Auth0 para Next.js (sesión en servidor).
 * Lee AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, APP_BASE_URL, AUTH0_SECRET de env.
 * Si Auth0 está en "Only organization", hace falta enviar organization en el login:
 * define AUTH0_ORGANIZATIONS_ENABLED=true y AUTH0_DEFAULT_ORGANIZATION_ID=org_xxx (ID de una org, p. ej. Pintacomex).
 */
const COLORCENTER_API_AUDIENCE =
  process.env.AUTH0_AUDIENCE ?? process.env.COLORCENTER_API_IDENTIFIER

const authorizationParameters: Record<string, string> = {}

// If Auth0 is configured as "Only organization", we must pass a default org to the login request.
if (process.env.AUTH0_ORGANIZATIONS_ENABLED === "true" && process.env.AUTH0_DEFAULT_ORGANIZATION_ID?.trim()) {
  authorizationParameters.organization = process.env.AUTH0_DEFAULT_ORGANIZATION_ID.trim()
}

// Request RBAC/authorization for our API, so Post Login can read event.authorization.roles.
// IMPORTANT: `audience` must be the Auth0 API "Identifier" (and must match what your Auth0 Action expects).
// If it's missing or wrong, Auth0 can fail the token validation and the login flow may loop.
if (COLORCENTER_API_AUDIENCE?.trim()) {
  authorizationParameters.audience = COLORCENTER_API_AUDIENCE.trim()
}

// Keep only our custom roles claim inside `session.user`.
// The SDK normally filters out non-default ID token claims; we re-add the one we need.
const ROLES_CLAIM = "https://colorcenter.app/roles"
const beforeSessionSaved = async (session: any) => {
  const userClaims = session?.user ?? {}
  const filtered = filterDefaultIdTokenClaims(userClaims)
  if (userClaims[ROLES_CLAIM] !== undefined) {
    filtered[ROLES_CLAIM] = userClaims[ROLES_CLAIM]
  }
  return { ...session, user: filtered }
}

const auth0Options =
  Object.keys(authorizationParameters).length > 0
    ? { authorizationParameters, beforeSessionSaved }
    : { beforeSessionSaved }

export const auth0 = new Auth0Client(auth0Options)
