"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

export type SessionForClient = {
  user: { email?: string; name?: string; picture?: string; roles?: string[] }
} | null

/**
 * En /login no se muestra el sidebar (pantalla completa para inicio de sesión).
 * En el resto de rutas se muestra Sidebar + contenido.
 */
export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode
  session?: SessionForClient
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <MobileHeader session={session ?? null} />
      <Sidebar session={session ?? null} />
      <main className="min-h-0 flex-1 w-full pt-14 lg:ml-64 lg:pt-0">{children}</main>
    </div>
  )
}
