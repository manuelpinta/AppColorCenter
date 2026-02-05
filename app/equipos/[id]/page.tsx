import { notFound } from "next/navigation"
import Link from "next/link"
import { mockColorCenters, mockEquipos, mockMantenimientos } from "@/lib/mock-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Edit,
  Plus,
  CheckCircle2,
  XCircle,
  WrenchIcon,
  Calendar,
  User,
  Building2,
  Clock,
  DollarSign,
} from "lucide-react"

export default async function EquipoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const equipo = mockEquipos.find((e) => e.id === id)

  if (!equipo) {
    notFound()
  }

  const colorCenter = mockColorCenters.find((cc) => cc.id === equipo.color_center_id)
  const mantenimientos = mockMantenimientos
    .filter((m) => m.equipo_id === equipo.id)
    .sort((a, b) => new Date(b.fecha_mantenimiento).getTime() - new Date(a.fecha_mantenimiento).getTime())

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Operativo":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Operativo
          </Badge>
        )
      case "Mantenimiento":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            <WrenchIcon className="h-3 w-3 mr-1" />
            Mantenimiento
          </Badge>
        )
      case "Fuera de Servicio":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="h-3 w-3 mr-1" />
            Fuera de Servicio
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-50 text-slate-600 border-slate-200">
            <XCircle className="h-3 w-3 mr-1" />
            {estado}
          </Badge>
        )
    }
  }

  const getMantenimientoEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Completado":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completado</Badge>
      case "En Proceso":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">En Proceso</Badge>
      case "Pendiente":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Pendiente</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === "Preventivo" ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Preventivo
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        Correctivo
      </Badge>
    )
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/equipos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Equipos
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{equipo.tipo_equipo}</h1>
                {getEstadoBadge(equipo.estado)}
              </div>
              <p className="text-muted-foreground mt-1">
                {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
              </p>
            </div>

            <div className="flex gap-2">
              <Link href={`/equipos/${equipo.id}/editar`}>
                <Button variant="outline" className="bg-transparent">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <Link href={`/mantenimientos/crear?equipo_id=${equipo.id}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Mantenimiento
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Equipo */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary/60 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sucursal</p>
                    <p className="font-medium">{colorCenter?.nombre_sucursal || "Sin asignar"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <WrenchIcon className="h-5 w-5 text-primary/60 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Número de Serie</p>
                    <p className="font-medium">{equipo.numero_serie || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary/60 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Compra</p>
                    <p className="font-medium">
                      {equipo.fecha_compra
                        ? new Date(equipo.fecha_compra).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary/60 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Propiedad</p>
                    <p className="font-medium">
                      {equipo.tipo_propiedad === "Arrendado" && equipo.arrendador
                        ? `En arrendamiento - ${equipo.arrendador}`
                        : "Propiedad nuestra"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Calibración y Revisión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Última Calibración</p>
                  <p className="font-medium">
                    {equipo.ultima_calibracion
                      ? new Date(equipo.ultima_calibracion).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Próxima Revisión</p>
                  <p className="font-medium">
                    {equipo.proxima_revision
                      ? new Date(equipo.proxima_revision).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </p>
                </div>

                {equipo.notas && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="text-sm">{equipo.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Historial de Mantenimientos */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Historial de Mantenimientos</CardTitle>
                <CardDescription>{mantenimientos.length} registros encontrados</CardDescription>
              </CardHeader>
              <CardContent>
                {mantenimientos.length === 0 ? (
                  <div className="text-center py-12">
                    <WrenchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Sin mantenimientos</h3>
                    <p className="text-muted-foreground mb-4">Este equipo no tiene mantenimientos registrados</p>
                    <Link href={`/mantenimientos/crear?equipo_id=${equipo.id}`}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Mantenimiento
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mantenimientos.map((mantenimiento) => (
                      <div
                        key={mantenimiento.id}
                        className="border border-border/50 rounded-lg p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            {getTipoBadge(mantenimiento.tipo)}
                            {getMantenimientoEstadoBadge(mantenimiento.estado)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(mantenimiento.fecha_mantenimiento).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <p className="font-medium mb-2">{mantenimiento.descripcion}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="truncate">{mantenimiento.tecnico_responsable}</span>
                          </div>
                          {mantenimiento.tiempo_fuera_servicio && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{mantenimiento.tiempo_fuera_servicio}h</span>
                            </div>
                          )}
                          {mantenimiento.costo && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>${mantenimiento.costo.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {mantenimiento.piezas_cambiadas && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">Piezas cambiadas</p>
                            <p className="text-sm">{mantenimiento.piezas_cambiadas}</p>
                          </div>
                        )}

                        <div className="mt-3 flex justify-end">
                          <Link href={`/mantenimientos/${mantenimiento.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver detalles
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
