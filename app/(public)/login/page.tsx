import { redirect } from "next/navigation"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth0 } from "@/lib/auth0"

/**
 * Página de login: redirige a Auth0 (/auth/login).
 * Si ya hay sesión, redirige al dashboard.
 */
export default async function LoginPage() {
  const session = await auth0.getSession()
  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight text-foreground">Color Center</h1>
              <p className="text-xs text-muted-foreground mt-1">Sistema de Gestión</p>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground mt-6">Inicia sesión con Auth0</p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <a href="/auth/login">Iniciar sesión</a>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <a href="/auth/login?screen_hint=signup">Registrarse</a>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Serás redirigido a Auth0 para autenticarte de forma segura.
        </p>
      </div>
    </div>
  )
}
