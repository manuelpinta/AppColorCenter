"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Wrench,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  LogOut,
  LogIn,
  LifeBuoy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SessionForClient } from "@/components/app-shell"

// Enlaces visibles en el sidebar (Admin catálogos queda oculto; accesible solo por URL directa /admin/catalogos)
const navigation = [
  { name: "Dashboard", short: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Sucursales", short: "Sucur.", href: "/sucursales", icon: Building2 },
  { name: "Equipos", short: "Equipos", href: "/equipos", icon: Wrench },
  { name: "Mantenimientos", short: "Manten.", href: "/mantenimientos", icon: ClipboardList },
  { name: "Incidencias", short: "Incid.", href: "/incidencias", icon: AlertTriangle },
  { name: "Reportes", short: "Report.", href: "/reportes", icon: BarChart3 },
]

/** URL pública (portal de tickets, mailto:..., etc.). Definir en .env: NEXT_PUBLIC_SUPPORT_URL */
const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL?.trim()

export function Sidebar({ session }: { session: SessionForClient }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col bg-card border-r border-border shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-primary/[0.04]">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm ring-2 ring-primary/20">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">Color Center</h1>
              <p className="text-xs text-muted-foreground mt-1">Sistema de Gestion</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer: sesión Auth0 */}
          <div className="px-6 py-4 border-t border-border space-y-2">
            {session?.user ? (
              <>
                <p className="text-xs text-muted-foreground truncate" title={session.user.email ?? undefined}>
                  {session.user.email ?? session.user.name ?? "Conectado"}
                </p>
                <a
                  href="/auth/logout"
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar sesión
                </a>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                Iniciar sesión
              </Link>
            )}
            {supportUrl ? (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors"
              >
                <LifeBuoy className="h-3.5 w-3.5 shrink-0" />
                Soporte técnico
              </a>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">Sistema de Control Técnico</p>
            )}
          </div>
        </div>
      </aside>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación principal"
      >
        <div className="flex items-center justify-around px-1 py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                aria-label={item.name}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-[44px] flex-1 py-2 px-1 rounded-lg transition-colors touch-manipulation",
                  isActive ? "text-primary" : "text-muted-foreground active:bg-secondary",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className={cn("h-6 w-6 shrink-0", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium leading-tight text-center max-w-full">{item.short}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
