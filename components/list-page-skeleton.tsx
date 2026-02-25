"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

interface ListPageSkeletonProps {
  /** Mensaje breve que ve el usuario mientras cargan los datos (evita clics repetidos). */
  message?: string
}

export function ListPageSkeleton({ message = "Cargando datos de todas las empresas…" }: ListPageSkeletonProps) {
  return (
    <div className="pb-20 lg:pb-0 relative min-h-[60vh]">
      {/* Capa que bloquea clics y selección mientras carga; cursor de espera */}
      <div
        className="absolute inset-0 z-10 cursor-wait select-none pointer-events-auto"
        aria-hidden
        title={message}
      />

      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto relative z-0 pointer-events-none select-none">
        {/* Mensaje de carga: el usuario sabe que debe esperar */}
        <div
          className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" aria-hidden />
          <span>{message}</span>
        </div>

        {/* Título y descripción */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Barra de búsqueda / filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Tabla skeleton */}
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
