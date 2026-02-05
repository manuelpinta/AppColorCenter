import { notFound } from "next/navigation"
import Link from "next/link"
import { mockMantenimientos, mockEquipos, mockColorCenters } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Wrench,
  FileText,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  DollarSign,
  Package,
} from "lucide-react"

export default async function DetalleMantenimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const mantenimiento = mockMantenimientos.find((m) => m.id === id)

  if (!mantenimiento) {
    notFound()
  }

  const equipo = mockEquipos.find((e) => e.id === mantenimiento.equipo_id)
  const colorCenter = equipo ? mockColorCenters.find((c) => c.id === equipo.color_center_id) : null

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Completado":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "En Proceso":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "Pendiente":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Completado":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "En Proceso":
        return <Timer className="h-5 w-5 text-blue-500" />
      case "Pendiente":
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <Clock className="h-5 w-5 text-slate-500" />
    }
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "Preventivo":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "Correctivo":
        return "bg-rose-50 text-rose-700 border-rose-200"
      default:
        return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/mantenimientos">
            <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Detalle del Mantenimiento
            </h1>
            <p className="text-sm text-muted-foreground mt-1">ID: {mantenimiento.id}</p>
          </div>
        </div>
        <Link href={`/mantenimientos/${mantenimiento.id}/editar`}>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estado y Tipo */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estado del Mantenimiento</CardTitle>
                <div className="flex items-center gap-2">
                  {getEstadoIcon(mantenimiento.estado)}
                  <Badge variant="outline" className={getEstadoBadgeColor(mantenimiento.estado)}>
                    {mantenimiento.estado}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Wrench className="h-5 w-5 text-primary/60" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <Badge variant="outline" className={`mt-1 ${getTipoBadgeColor(mantenimiento.tipo)}`}>
                      {mantenimiento.tipo}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary/60" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {new Date(mantenimiento.fecha_mantenimiento).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descripcion */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary/60" />
                Descripcion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{mantenimiento.descripcion}</p>
            </CardContent>
          </Card>

          {/* Tecnico */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary/60" />
                Tecnico Responsable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{mantenimiento.tecnico_responsable}</p>
                  <p className="text-sm text-muted-foreground">Tecnico de mantenimiento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Piezas Cambiadas */}
          {mantenimiento.piezas_cambiadas && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary/60" />
                  Piezas Cambiadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{mantenimiento.piezas_cambiadas}</p>
              </CardContent>
            </Card>
          )}

          {/* Notas */}
          {mantenimiento.notas && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{mantenimiento.notas}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Equipo Info */}
          {equipo && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary/60" />
                  Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{equipo.tipo_equipo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marca / Modelo</p>
                  <p className="font-medium">{equipo.marca} {equipo.modelo}</p>
                </div>
                {equipo.numero_serie && (
                  <div>
                    <p className="text-sm text-muted-foreground">Numero de Serie</p>
                    <p className="font-medium font-mono text-sm">{equipo.numero_serie}</p>
                  </div>
                )}
                <Link href={`/equipos/${equipo.id}`}>
                  <Button variant="outline" className="w-full mt-2 bg-transparent">
                    Ver Equipo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Color Center Info */}
          {colorCenter && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary/60" />
                  Color Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Sucursal</p>
                  <p className="font-medium">{colorCenter.nombre_sucursal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codigo</p>
                  <p className="font-medium">{colorCenter.codigo_interno}</p>
                </div>
                {colorCenter.region && (
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium">{colorCenter.region}</p>
                  </div>
                )}
                <Link href={`/sucursales/${colorCenter.id}`}>
                  <Button variant="outline" className="w-full mt-2 bg-transparent">
                    Ver Sucursal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Costos y Tiempo */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary/60" />
                Costos y Tiempo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mantenimiento.costo !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Costo</p>
                  <p className="font-medium text-lg">${mantenimiento.costo.toLocaleString("es-MX")}</p>
                </div>
              )}
              {mantenimiento.tiempo_fuera_servicio !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Tiempo fuera de servicio</p>
                  <p className="font-medium">{mantenimiento.tiempo_fuera_servicio} horas</p>
                </div>
              )}
              {mantenimiento.costo === null && mantenimiento.tiempo_fuera_servicio === null && (
                <p className="text-sm text-muted-foreground">No registrado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
