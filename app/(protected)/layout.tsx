import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { auth0 } from "@/lib/auth0"
import { getCachedAllowedEmpresaIds } from "@/lib/allowed-empresas-context"
import { isAuth0OrganizationsEnabled } from "@/lib/auth0-organizations"

/**
 * Rutas protegidas: sin sesión no existe la app.
 * Redirige a /login antes de renderizar cualquier página (no se ejecutan fetches ni páginas).
 * Con Auth0 Organizations: si el usuario no tiene ninguna empresa asignada, redirige a /sin-empresa.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth0.getSession()
  if (!session) {
    redirect("/login")
  }

  if (isAuth0OrganizationsEnabled()) {
    const allowed = await getCachedAllowedEmpresaIds()
    if (!allowed || allowed.length === 0) {
      redirect("/sin-empresa")
    }
  }

  const sessionForClient = {
    user: {
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
      roles: (session.user["https://colorcenter.app/roles"] as string[]) ?? [],
    },
  }

  return (
    <AppShell session={sessionForClient}>
      {children}
    </AppShell>
  )
}
