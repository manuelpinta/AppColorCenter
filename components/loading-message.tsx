"use client"

import { Loader2 } from "lucide-react"

interface LoadingMessageProps {
  message?: string
  className?: string
}

/** Franja visible que indica carga en curso. Reduce clics repetidos y recargas. */
export function LoadingMessage({
  message = "Cargando datos de todas las empresas…",
  className = "",
}: LoadingMessageProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  )
}
