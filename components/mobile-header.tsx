"use client"

import Link from "next/link"
import { Building2, LifeBuoy, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SessionForClient } from "@/components/app-shell"

const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL?.trim()

function getInitials(user: { email?: string; name?: string }): string {
  if (user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      const a = parts[0]?.[0]
      const b = parts[parts.length - 1]?.[0]
      if (a && b) return `${a}${b}`.toUpperCase()
    }
    return user.name.slice(0, 2).toUpperCase()
  }
  const email = user.email
  if (email) {
    const local = email.split("@")[0] ?? ""
    if (local.length >= 2) return local.slice(0, 2).toUpperCase()
    return local.slice(0, 1).toUpperCase() || "?"
  }
  return "?"
}

/**
 * Barra superior solo en &lt; lg: marca + menú de cuenta (evita mezclar correo/salir/soporte con el tab bar).
 */
export function MobileHeader({ session }: { session: SessionForClient }) {
  const user = session?.user

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="truncate text-base font-semibold tracking-tight text-foreground">Color Center</span>
      </Link>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cuenta y sesión"
            >
              <Avatar className="h-9 w-9 border border-border shadow-sm">
                {user.picture ? <AvatarImage src={user.picture} alt="" /> : null}
                <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-[min(18rem,calc(100vw-2rem))]">
            <DropdownMenuLabel className="font-normal">
              <span className="sr-only">Correo</span>
              <p className="break-all text-xs leading-snug text-muted-foreground">{user.email ?? user.name ?? "Usuario"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {supportUrl ? (
              <DropdownMenuItem asChild>
                <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer py-2.5">
                  <LifeBuoy className="mr-2 h-4 w-4 shrink-0" />
                  Soporte técnico
                </a>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <a href="/auth/logout" className="cursor-pointer py-2.5">
                <LogOut className="mr-2 h-4 w-4 shrink-0" />
                Cerrar sesión
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/login" className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-primary">
          Iniciar sesión
        </Link>
      )}
    </header>
  )
}
