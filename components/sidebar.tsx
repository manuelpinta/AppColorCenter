"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, Wrench, ClipboardList, AlertTriangle, BarChart3, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", short: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Sucursales", short: "Sucur.", href: "/sucursales", icon: Building2 },
  { name: "Equipos", short: "Equipos", href: "/equipos", icon: Wrench },
  { name: "Mantenimientos", short: "Manten.", href: "/mantenimientos", icon: ClipboardList },
  { name: "Incidencias", short: "Incid.", href: "/incidencias", icon: AlertTriangle },
  { name: "Reportes", short: "Report.", href: "/reportes", icon: BarChart3 },
  { name: "Admin catálogos", short: "Admin", href: "/admin/catalogos", icon: Settings2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col bg-card border-r border-border shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Sistema de Control Técnico</p>
          </div>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-[44px] flex-1 py-2 px-1 rounded-lg transition-colors touch-manipulation",
                  isActive ? "text-primary" : "text-muted-foreground active:bg-secondary",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className={cn("h-6 w-6 shrink-0", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium leading-tight text-center max-w-full" title={item.name}>{item.short}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
