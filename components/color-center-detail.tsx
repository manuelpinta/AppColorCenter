import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, User, Calendar, FileText, Plus, AlertCircle, Wrench, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { EquiposList } from "@/components/equipos-list"
import { mockColorCenters, mockEquipos, mockEmpresas } from "@/lib/mock-data"

function getColorCenterData(id: string) {
  const mockCenter = mockColorCenters.find((cc) => cc.id === id)
  const mockCenterEquipos = mockEquipos.filter((e) => e.color_center_id === id)
  const empresa = mockCenter ? mockEmpresas.find((e) => e.id === mockCenter.empresa_id) : null
  return { colorCenter: mockCenter || null, equipos: mockCenterEquipos, empresa }
}

export function ColorCenterDetail({ id }: { id: string }) {
  const { colorCenter, equipos, empresa } = getColorCenterData(id)

  if (!colorCenter) {
    return (
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Color Center no encontrado</h3>
          <p className="text-muted-foreground mb-4">El Color Center que buscas no existe</p>
          <Link href="/">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

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
    (e) => e.estado === "Mantenimiento" || e.estado === "Fuera de Servicio",
  ).length

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 lg:px-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {empresa && (
              <p className="text-sm font-medium text-primary mb-1">{empresa.nombre} - {empresa.pais}</p>
            )}
            <h1 className="text-3xl font-bold text-foreground">{colorCenter.nombre_sucursal}</h1>
            <p className="text-muted-foreground mt-1">{colorCenter.codigo_interno}</p>
          </div>
          <Badge className={`${getEstadoBadgeColor(colorCenter.estado)} text-base px-4 py-1`}>
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

            {colorCenter.responsable && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Responsable</span>
                </div>
                <p className="text-foreground pl-6">{colorCenter.responsable}</p>
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
              <Link href={`/mantenimientos/crear?color_center_id=${colorCenter.id}`}>
                <Button size="sm" variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Nuevo Mantenimiento
                </Button>
              </Link>
              <Link href={`/equipos/crear?color_center_id=${colorCenter.id}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Equipo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EquiposList equipos={equipos} colorCenterId={colorCenter.id} />
        </CardContent>
      </Card>
    </div>
  )
}
