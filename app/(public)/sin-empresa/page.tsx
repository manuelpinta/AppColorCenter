import Link from "next/link"
import { Building2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Página mostrada cuando el usuario está autenticado pero no tiene ninguna
 * empresa (Organization en Auth0) asignada. Redirigido desde el layout protegido.
 */
export default function SinEmpresaPage() {
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
          <p className="text-sm text-muted-foreground mt-6">
            No tienes empresa asignada. Contacta al administrador para que te asigne a una organización.
          </p>
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
