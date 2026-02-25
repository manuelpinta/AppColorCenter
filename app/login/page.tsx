"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!login.trim() || !password) {
      setError("Usuario y contraseña son obligatorios.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 501 || res.status === 503) {
          setError("El inicio de sesión no está configurado aún. Prueba más tarde.")
        } else if (res.status === 401) {
          setError("Usuario o contraseña incorrectos.")
        } else {
          setError(data?.error ?? "Error al iniciar sesión. Intenta de nuevo.")
        }
        return
      }
      // Cuando la API devuelva sesión/token, aquí se guardaría y se redirige
      router.push("/")
      router.refresh()
    } catch {
      setError("No se pudo conectar. Revisa tu conexión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo y título */}
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
          <p className="text-sm text-muted-foreground mt-6">Inicia sesión con tu usuario</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Usuario o correo</Label>
            <Input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              placeholder="ej. jperez"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Sin conexión a la base común aún: el inicio de sesión mostrará un aviso.
        </p>
      </div>
    </div>
  )
}
