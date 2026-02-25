import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  MapPin,
  Calendar,
  FileText,
  Plus,
  AlertCircle,
  AlertTriangle,
  Wrench,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"
import { EquiposList } from "@/components/equipos-list"
import type { ColorCenter, Empresa, Incidencia } from "@/lib/types"
import type { EquipoWithEmpresa } from "@/lib/types"

interface ColorCenterDetailProps {
  colorCenter: ColorCenter
  equipos: EquipoWithEmpresa[]
  empresa?: Empresa
  incidencias: Incidencia[]
  /** Id a usar en enlaces (crear equipo, incidencia, etc.): compuesto o numérico. */
  sucursalIdForLinks: string
}

export function ColorCenterDetail({
  colorCenter,
  equipos,
  empresa,
  incidencias,
  sucursalIdForLinks,
}: ColorCenterDetailProps) {
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Operativo":
        return "bg-green-500/10 text-green-700 border-green-500/20"
      case "Mantenimiento":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20"
      case "Inactivo":
        return "bg-gray-500/10 text-gray-700 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20"
    }
  }

  const equiposOperativos = equipos.filter((e) => e.estado === "Operativo").length
  const equiposEnMantenimiento = equipos.filter(
    (e) => e.estado === "Mantenimiento" || e.estado === "Fuera de Servicio"
  ).length

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 lg:px-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 min-h-[44px] touch-manipulation">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {empresa && (
              <p className="text-sm font-medium text-primary mb-1">
                {empresa.nombre} - {empresa.pais}
              </p>
            )}
            <h1 className="text-3xl font-bold text-foreground">{colorCenter.nombre_sucursal}</h1>
            <p className="text-muted-foreground mt-1">{colorCenter.codigo_interno}</p>
          </div>
          <Badge
            className={`${getEstadoBadgeColor(colorCenter.estado)} text-base px-4 py-1`}
          >
            {colorCenter.estado}
          </Badge>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorCenter.region && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Región</span>
                </div>
                <p className="text-foreground pl-6">{colorCenter.region}</p>
              </div>
            )}

            {colorCenter.ubicacion && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Ubicación</span>
                </div>
                <p className="text-foreground pl-6">{colorCenter.ubicacion}</p>
              </div>
            )}

            {colorCenter.fecha_instalacion && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Fecha de Instalación</span>
                </div>
                <p className="text-foreground pl-6">
                  {new Date(colorCenter.fecha_instalacion).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Wrench className="h-4 w-4" />
                <span className="font-medium">Total de Equipos</span>
              </div>
              <p className="text-foreground pl-6">{equipos.length}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Wrench className="h-4 w-4" />
                <span className="font-medium">Estado de Equipos</span>
              </div>
              <p className="text-foreground pl-6">
                {equiposOperativos} operativos, {equiposEnMantenimiento} en mantenimiento
              </p>
            </div>
          </div>

          {colorCenter.notas && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Notas</span>
              </div>
              <p className="text-foreground pl-6">{colorCenter.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipos ({equipos.length})
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Link href={`/mantenimientos/crear?color_center_id=${sucursalIdForLinks}`}>
                <Button size="sm" variant="outline" className="min-h-[44px] touch-manipulation">
                  <Wrench className="h-4 w-4 mr-2" />
                  Nuevo Mantenimiento
                </Button>
              </Link>
              <Link href={`/equipos/crear?color_center_id=${sucursalIdForLinks}`}>
                <Button size="sm" className="min-h-[44px] touch-manipulation">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Equipo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EquiposList equipos={equipos} colorCenterId={sucursalIdForLinks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Incidencias ({incidencias.length})
            </CardTitle>
            <Link href={`/incidencias/crear?sucursal_id=${sucursalIdForLinks}`}>
              <Button size="sm" variant="outline" className="min-h-[44px] touch-manipulation">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reportar incidencia
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {incidencias.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No hay incidencias reportadas en esta sucursal.
            </p>
          ) : (
            <ul className="space-y-3">
              {incidencias.map((inc) => (
                <li
                  key={inc.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{inc.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inc.quien_reporta ?? "—"} ·{" "}
                      {new Date(inc.fecha_reporte).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 w-fit">
                    {inc.estado}
                  </Badge>
                  <Link href={`/incidencias/${inc.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
