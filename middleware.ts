import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATH = "/login"
const ORG_ERROR_PATH = "/sin-empresa"
const ROLES_ERROR_PATH = "/sin-rol"
const AUTH_PREFIX = "/auth"

/**
 * 1) Auth0 maneja /auth/* y sesión.
 * 2) Rutas protegidas: si no hay cookie de sesión, redirigir a /login aquí
 *    para que el servidor NUNCA ejecute páginas ni fetches (dashboard, etc.).
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublic = pathname === PUBLIC_PATH || pathname === ORG_ERROR_PATH || pathname === ROLES_ERROR_PATH || pathname.startsWith(AUTH_PREFIX)

  const authResponse = await auth0.middleware(request)

  // Si Auth0 devuelve un redirect (login, callback, logout), devolverlo tal cual
  if (authResponse.status >= 300 && authResponse.status < 400) {
    return authResponse
  }

  // Ruta pública: dejar pasar
  if (isPublic) {
    return authResponse
  }

  // Ruta protegida: validar sesión real (más robusto que revisar nombre de cookie).
  // Esto evita loops por cookies chunked/inconsistentes y sigue previniendo flicker.
  const session = await auth0.getSession(request)
  if (!session) {
    return NextResponse.redirect(new URL(PUBLIC_PATH, request.url))
  }

  return authResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
