import Link from "next/link"
import { Building2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth0 } from "@/lib/auth0"
import { getUserRoles } from "@/lib/auth-roles"

const ROLES_CLAIM = "https://colorcenter.app/roles"

export default async function SinRolPage({
  searchParams,
}: {
  searchParams?: { reason?: string; redirectTo?: string }
}) {
  const reason = searchParams?.reason ?? "unknown"
  const session = await auth0.getSession()
  const roles = await getUserRoles()
  const hasRolesClaim = session?.user?.[ROLES_CLAIM] !== undefined

  const title =
    reason === "roles_claim_missing" ? "Modo lectura por falta de roles" : "Error de permisos (roles)"

  const description =
    reason === "roles_claim_missing"
      ? "No se pudieron cargar los roles desde Auth0. Por seguridad, dejamos la app en modo lectura y registramos logs para debug."
      : "No tienes permisos para realizar esta acción. (Esto se decide con los roles de Auth0)."

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight text-foreground">Color Center</h1>
              <p className="text-xs text-muted-foreground mt-1">Sistema de Gestión</p>
            </div>
          </Link>

          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 text-sm space-y-2">
          <div className="text-muted-foreground">Debug (solo info)</div>
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-mono">{session?.user?.email ?? "unknown"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">roles claim presente:</span>{" "}
            <span className="font-mono">{String(hasRolesClaim)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">roles:</span>{" "}
            <span className="font-mono">{roles.length ? JSON.stringify(roles) : "[]"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">reason:</span>{" "}
            <span className="font-mono">{reason}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild variant="outline" className="w-full" size="lg">
            <a href="/auth/logout" className="flex items-center justify-center gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

