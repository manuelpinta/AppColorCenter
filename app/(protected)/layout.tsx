import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { auth0 } from "@/lib/auth0"
import { getCachedAllowedEmpresaIds } from "@/lib/allowed-empresas-context"
import { isAuth0OrganizationsEnabled } from "@/lib/auth0-organizations"

export const dynamic = "force-dynamic"

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
  let session: Awaited<ReturnType<typeof auth0.getSession>>
  try {
    session = await auth0.getSession()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[protected-layout] auth0.getSession threw", err)
    redirect("/login")
  }

  if (!session) {
    redirect("/login")
  }

  if (isAuth0OrganizationsEnabled()) {
    try {
      const allowed = await getCachedAllowedEmpresaIds()
      if (!allowed || allowed.length === 0) {
        redirect("/sin-empresa?reason=no_orgs_assigned")
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[protected-layout] Failed to compute allowed orgs", err)
      redirect("/sin-empresa?reason=auth0_orgs_failed")
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
