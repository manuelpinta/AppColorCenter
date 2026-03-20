"use client"

import type { Equipo, Mantenimiento, ColorCenter } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowLeft, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  WrenchIcon,
  Building2,
  Package,
  FileText,
  Clock,
  DollarSign,
  User,
  Pencil,
  Plus
} from "lucide-react"
import Link from "next/link"

interface EquipoDetailProps {
  equipo: Equipo
  colorCenter: ColorCenter
  mantenimientos: Mantenimiento[]
}

export function EquipoDetail({ equipo, colorCenter, mantenimientos }: EquipoDetailProps) {
  // Temporal: ocultar datos de arrendamiento y calibracion/revision en UI.
  const showLeasingInfo = false
  const showCalibrationInfo = false
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
      case "Inactivo":
        return (
          <Badge className="bg-slate-50 text-slate-600 border-slate-200">
            <XCircle className="h-3 w-3 mr-1" />
            Inactivo
          </Badge>
        )
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getMantenimientoEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Completado":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completado</Badge>
      case "En Proceso":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">En Proceso</Badge>
      case "Pendiente":
        return <Badge className="bg-slate-50 text-slate-600 border-slate-200">Pendiente</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === "Preventivo" 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Preventivo</Badge>
      : <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Correctivo</Badge>
  }

  const isProximaRevisionCercana = (fecha: string | null) => {
    if (!fecha) return false
    const hoy = new Date()
    const proximaRevision = new Date(fecha)
    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
    return proximaRevision <= treintaDias && proximaRevision >= hoy
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={
              colorCenter && equipo.empresa_id
                ? `/sucursales/${buildSucursalCompositeIdFromIds(equipo.empresa_id as any, colorCenter.id)}`
                : `/sucursales/${colorCenter ? colorCenter.id : ""}`
            }
          >
            <Button variant="outline" size="icon" className="bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                {equipo.tipo_equipo}
              </h1>
              {getEstadoBadge(equipo.estado)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/mantenimientos/crear?equipo_id=${equipo.id}`}>
            <Button variant="outline" className="bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Mantenimiento
            </Button>
          </Link>
          <Link href={`/equipos/${equipo.id}/editar`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Detalles del Equipo */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Informacion del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {equipo.numero_serie && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Numero de Serie</p>
                  <p className="font-medium">{equipo.numero_serie}</p>
                </div>
              )}
              {equipo.marca && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{equipo.marca}</p>
                </div>
              )}
              {equipo.modelo && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{equipo.modelo}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Propiedad</p>
                <p className="font-medium">
                  {showLeasingInfo
                    ? equipo.tipo_propiedad === "Arrendado" && equipo.arrendador
                      ? `En arrendamiento - ${equipo.arrendador}`
                      : "Propiedad nuestra"
                    : equipo.tipo_propiedad}
                </p>
                {showLeasingInfo && equipo.tipo_propiedad === "Arrendado" && equipo.fecha_vencimiento_arrendamiento && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Vencimiento contrato:{" "}
                    {new Date(equipo.fecha_vencimiento_arrendamiento).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              {equipo.fecha_compra && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de Compra</p>
                  <p className="font-medium">
                    {new Date(equipo.fecha_compra).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              {showCalibrationInfo && equipo.ultima_calibracion && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ultima Calibracion</p>
                  <p className="font-medium">
                    {new Date(equipo.ultima_calibracion).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              {showCalibrationInfo && equipo.proxima_revision && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Proxima Revision</p>
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${isProximaRevisionCercana(equipo.proxima_revision) ? "text-amber-600" : ""}`}>
                      {new Date(equipo.proxima_revision).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {isProximaRevisionCercana(equipo.proxima_revision) && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              )}
            </div>
            {equipo.notas && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm text-foreground">{equipo.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ubicacion */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Ubicacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Color Center</p>
              <Link href={`/sucursales/${colorCenter.id}`} className="font-medium text-primary hover:underline">
                {colorCenter.nombre_sucursal}
              </Link>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Codigo</p>
              <p className="font-medium">{colorCenter.codigo_interno}</p>
            </div>
            {colorCenter.region && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="font-medium">{colorCenter.region}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historial de Mantenimientos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <WrenchIcon className="h-5 w-5 text-primary" />
              Historial de Mantenimientos
            </CardTitle>
            <Badge variant="outline" className="bg-transparent">
              {mantenimientos.length} registro{mantenimientos.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {mantenimientos.length === 0 ? (
            <div className="text-center py-8">
              <WrenchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin mantenimientos registrados</h3>
              <p className="text-muted-foreground mb-4">Este equipo aun no tiene mantenimientos en su historial</p>
              <Link href={`/mantenimientos/crear?equipo_id=${equipo.id}`}>
                <Button>Registrar Primer Mantenimiento</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {mantenimientos.map((mantenimiento) => (
                <div 
                  key={mantenimiento.id} 
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {getTipoBadge(mantenimiento.tipo)}
                        {getMantenimientoEstadoBadge(mantenimiento.estado)}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(mantenimiento.fecha_mantenimiento).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground">{mantenimiento.descripcion}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <WrenchIcon className="h-3.5 w-3.5" />
                          {mantenimiento.realizado_por === "Externo" ? "Externo" : "Interno"}
                          {mantenimiento.realizado_por === "Interno" && mantenimiento.tecnico_responsable && (
                            <> · {mantenimiento.tecnico_responsable}</>
                          )}
                        </span>
                        {mantenimiento.tiempo_fuera_servicio && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {mantenimiento.tiempo_fuera_servicio}h fuera de servicio
                          </span>
                        )}
                        {mantenimiento.costo && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            ${mantenimiento.costo.toLocaleString("es-MX")}
                          </span>
                        )}
                      </div>

                      {mantenimiento.piezas_cambiadas && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Piezas cambiadas: </span>
                          <span className="text-foreground">{mantenimiento.piezas_cambiadas}</span>
                        </div>
                      )}

                      {mantenimiento.notas && (
                        <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                          {mantenimiento.notas}
                        </p>
                      )}
                    </div>

                    <Link href={`/mantenimientos/${mantenimiento.id}`}>
                      <Button variant="outline" size="sm" className="bg-transparent">
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
  )
}
