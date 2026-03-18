import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATH = "/login"
const AUTH_PREFIX = "/auth"
const SESSION_COOKIE_NAME = "__session"

/**
 * 1) Auth0 maneja /auth/* y sesión.
 * 2) Rutas protegidas: si no hay cookie de sesión, redirigir a /login aquí
 *    para que el servidor NUNCA ejecute páginas ni fetches (dashboard, etc.).
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublic = pathname === PUBLIC_PATH || pathname.startsWith(AUTH_PREFIX)

  const authResponse = await auth0.middleware(request)

  // Si Auth0 devuelve un redirect (login, callback, logout), devolverlo tal cual
  if (authResponse.status >= 300 && authResponse.status < 400) {
    return authResponse
  }

  // Ruta pública: dejar pasar
  if (isPublic) {
    return authResponse
  }

  // Ruta protegida sin cookie de sesión → redirigir a login antes de tocar el servidor
  if (!request.cookies.get(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL(PUBLIC_PATH, request.url))
  }

  return authResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
