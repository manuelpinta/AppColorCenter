"use client"

import type { ColorCenter, Equipo } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Calendar, Wrench, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

interface ColorCenterGridProps {
  colorCenters: ColorCenter[]
  equipos: Equipo[]
  compact?: boolean
}

export function ColorCenterGrid({ colorCenters, equipos, compact = false }: ColorCenterGridProps) {
  // Agrupar equipos por color center
  const equiposPorCenter = useMemo(() => {
    const map = new Map<string, Equipo[]>()
    equipos.forEach((equipo) => {
      const existing = map.get(equipo.color_center_id) || []
      map.set(equipo.color_center_id, [...existing, equipo])
    })
    return map
  }, [equipos])

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Operativo":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "Mantenimiento":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "Inactivo":
        return "bg-slate-50 text-slate-600 border-slate-200"
      default:
        return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-semibold text-foreground">Sucursales ({colorCenters.length})</h2>
        </div>
      )}

      <div className={`grid gap-4 ${compact ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"}`}>
        {colorCenters.map((center) => {
          const equiposDelCenter = equiposPorCenter.get(center.id) || []
          const equiposOperativos = equiposDelCenter.filter((e) => e.estado === "Operativo").length
          const totalEquipos = equiposDelCenter.length

          return (
            <Card key={center.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold truncate">{center.nombre_sucursal}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{center.codigo_interno}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${getEstadoBadgeColor(center.estado)} text-xs shrink-0 font-medium`}>{center.estado}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2.5 text-sm">
                  {center.region && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 text-primary/60" />
                      <span className="truncate">{center.region}</span>
                    </div>
                  )}
                  {center.fecha_instalacion && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0 text-primary/60" />
                      <span className="truncate">
                        {new Date(center.fecha_instalacion).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary/60" />
                      <span className="text-sm font-medium">{totalEquipos} equipos</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">{equiposOperativos} operativos</span>
                  </div>
                </div>

                <Link
                  href={
                    center.empresa_id
                      ? `/sucursales/${buildSucursalCompositeId(center.empresa_id as any, center)}`
                      : `/sucursales/${center.id}`
                  }
                  className="block"
                >
                  <Button variant="outline" className="w-full bg-transparent h-10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" size="sm">
                    Ver detalles
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {colorCenters.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay Color Centers registrados</h3>
          <p className="text-muted-foreground">Comienza agregando tu primer Color Center</p>
        </div>
      )}
    </div>
  )
}
