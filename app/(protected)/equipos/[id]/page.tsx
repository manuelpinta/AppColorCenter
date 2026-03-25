import { notFound } from "next/navigation"
import Link from "next/link"
import {
  findEquipoInAllBases,
  getSucursalesByEmpresa,
  getMovimientosByEquipoId,
  getIncidenciasByEquipoId,
  getFotosByEquipoId,
  getComputadoraByEquipoId,
  getMantenimientosByEquipoId,
  buildEquipoCompositeId,
} from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EquipoFotosSection } from "@/components/equipo-fotos-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { userCanWrite } from "@/lib/auth-roles"
import {
  ArrowLeft,
  ArrowRightLeft,
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
  AlertTriangle,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react"

export default async function EquipoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const canWrite = await userCanWrite()
  // Temporal: ocultar datos de arrendamiento y calibracion/revision en UI.
  const showLeasingInfo = false
  const showCalibrationInfo = false

  const found = await findEquipoInAllBases(id)
  if (!found) {
    notFound()
  }
  const { equipo, pool, empresaId } = found
  const compositeId = buildEquipoCompositeId(empresaId, equipo)

  const [sucursales, mantenimientos, movimientos, incidencias, fotos, computadoraOrNull] = await Promise.all([
    getSucursalesByEmpresa(empresaId),
    getMantenimientosByEquipoId(pool, equipo.id),
    getMovimientosByEquipoId(pool, equipo.id),
    getIncidenciasByEquipoId(pool, equipo.id),
    getFotosByEquipoId(pool, equipo.id),
    equipo.tipo_equipo === "Equipo de Computo" ? getComputadoraByEquipoId(pool, equipo.id) : Promise.resolve(null),
  ])
  const colorCenter = sucursales.find((cc) => cc.id === equipo.color_center_id) ?? null
  const computadora = computadoraOrNull

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
      <div className="px-4 py-0 lg:px-8 lg:py-8 max-w-6xl mx-auto">
        {/* Header: en móvil con fondo y borde para que no flote en blanco */}
        <header className="lg:mb-6 -mx-4 px-4 pt-4 pb-5 lg:mx-0 lg:px-0 lg:pt-0 lg:pb-0 lg:bg-transparent bg-muted/40 lg:rounded-none rounded-b-2xl border-b border-border/60 lg:border-0">
          <Link
            href="/equipos"
            className="inline-flex items-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground touch-manipulation mb-4 lg:mb-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 border border-border/60 lg:h-auto lg:w-auto lg:bg-transparent lg:border-0 lg:p-0">
              <ArrowLeft className="h-4 w-4 lg:mr-1" />
            </span>
            <span className="lg:inline">Volver a Equipos</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{equipo.tipo_equipo}</h1>
                {getEstadoBadge(equipo.estado)}
              </div>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              {canWrite && (
                <>
                  <Link href={`/equipos/${compositeId}/editar`} className="flex-1 min-w-0 sm:flex-initial">
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full sm:w-auto min-h-[44px] touch-manipulation border-border bg-background/80 hover:bg-muted/50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Link href={`/equipos/${compositeId}/mover`} className="flex-1 min-w-0 sm:flex-initial">
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full sm:w-auto min-h-[44px] touch-manipulation border-border bg-background/80 hover:bg-muted/50"
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Mover
                    </Button>
                  </Link>
                  <Link href={`/mantenimientos/crear?equipo_id=${compositeId}`} className="w-full sm:w-auto sm:flex-initial">
                    <Button size="default" className="w-full min-h-[44px] touch-manipulation shadow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Mantenimiento
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="pt-6 lg:pt-0">

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
                      {showLeasingInfo
                        ? equipo.tipo_propiedad === "Arrendado" && equipo.arrendador
                          ? `En arrendamiento - ${equipo.arrendador}`
                          : "Propiedad nuestra"
                        : equipo.tipo_propiedad}
                    </p>
                    {showLeasingInfo && equipo.tipo_propiedad === "Arrendado" && equipo.fecha_vencimiento_arrendamiento && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Vencimiento contrato:{" "}
                          {new Date(equipo.fecha_vencimiento_arrendamiento).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {(() => {
                          const hoy = new Date()
                          hoy.setHours(0, 0, 0, 0)
                          const venc = new Date(equipo.fecha_vencimiento_arrendamiento)
                          venc.setHours(0, 0, 0, 0)
                          const dias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                          if (dias < 0)
                            return (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20">Vencido</Badge>
                            )
                          if (dias <= 30)
                            return (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                                Por vencer ({dias} días)
                              </Badge>
                            )
                          return null
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {showCalibrationInfo && (
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
            )}

            {/* Especificaciones de computadora (solo cuando tipo = Equipo de Computo) */}
            {equipo.tipo_equipo === "Equipo de Computo" && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Especificaciones de computadora
                  </CardTitle>
                  <CardDescription>
                    Procesador, RAM, almacenamiento, Windows (requisitos de referencia: i5 ≥ 3.0 GHz, 16 GB RAM, ≥ 450 GB o SSD, Windows 11 Pro 23H2, 64 bits)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!computadora || (!computadora.procesador && computadora.ram_gb == null && computadora.almacenamiento_gb == null && !computadora.graficos && !computadora.windows_version) ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Sin especificaciones registradas. Edita el equipo para añadirlas.
                    </p>
                  ) : (
                    <>
                      {computadora.procesador && (
                        <div className="flex items-start gap-3">
                          <Cpu className="h-5 w-5 text-primary/60 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Procesador</p>
                            <p className="font-medium text-sm">{computadora.procesador}</p>
                          </div>
                        </div>
                      )}
                      {computadora.ram_gb != null && (
                        <div className="flex items-start gap-3">
                          <MemoryStick className="h-5 w-5 text-primary/60 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Memoria RAM</p>
                            <p className="font-medium text-sm">{computadora.ram_gb} GB</p>
                          </div>
                        </div>
                      )}
                      {(computadora.almacenamiento_gb != null || computadora.tipo_almacenamiento) && (
                        <div className="flex items-start gap-3">
                          <HardDrive className="h-5 w-5 text-primary/60 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Almacenamiento</p>
                            <p className="font-medium text-sm">
                              {computadora.almacenamiento_gb != null ? `${computadora.almacenamiento_gb} GB` : ""}
                              {computadora.almacenamiento_gb != null && computadora.tipo_almacenamiento ? " · " : ""}
                              {computadora.tipo_almacenamiento ?? ""}
                            </p>
                          </div>
                        </div>
                      )}
                      {computadora.graficos && (
                        <div>
                          <p className="text-sm text-muted-foreground">Gráficos</p>
                          <p className="font-medium text-sm">{computadora.graficos}</p>
                        </div>
                      )}
                      {computadora.windows_version && (
                        <div>
                          <p className="text-sm text-muted-foreground">Versión de Windows</p>
                          <p className="font-medium text-sm">
                            {computadora.windows_version}
                            {computadora.so_64bits ? " (64 bits)" : ""}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
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
                    {canWrite && (
                      <Link href={`/mantenimientos/crear?equipo_id=${compositeId}`}>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Mantenimiento
                        </Button>
                      </Link>
                    )}
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
                            <WrenchIcon className="h-4 w-4" />
                            <span className="truncate">
                              {mantenimiento.realizado_por === "Externo" ? "Externo" : "Interno"}
                              {mantenimiento.realizado_por === "Interno" && mantenimiento.tecnico_responsable && (
                                <> · {mantenimiento.tecnico_responsable}</>
                              )}
                            </span>
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

            {/* Fotos del equipo (estado, varias con fecha) */}
            <EquipoFotosSection equipoId={compositeId} fotos={fotos} canWrite={canWrite} />

            {/* Historial de movimientos */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowRightLeft className="h-5 w-5" />
                  Historial de movimientos
                </CardTitle>
                <CardDescription>
                  Registro de cambios de sucursal de este equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {movimientos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No hay movimientos registrados para este equipo.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {movimientos.map((mov) => {
                      const origen = sucursales.find((c) => c.id === mov.sucursal_origen_id)
                      const destino = sucursales.find((c) => c.id === mov.sucursal_destino_id)
                      return (
                        <div
                          key={mov.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-border/50 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{origen?.nombre_sucursal ?? mov.sucursal_origen_id}</p>
                            <p className="text-xs text-muted-foreground">{origen?.codigo_interno}</p>
                          </div>
                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{destino?.nombre_sucursal ?? mov.sucursal_destino_id}</p>
                            <p className="text-xs text-muted-foreground">{destino?.codigo_interno}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium">
                              {new Date(mov.fecha_movimiento).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            {mov.motivo && (
                              <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] sm:max-w-none truncate sm:whitespace-normal" title={mov.motivo}>
                                {mov.motivo}
                              </p>
                            )}
                            {mov.registrado_por && (
                              <p className="text-xs text-muted-foreground mt-0.5">{mov.registrado_por}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Incidencias */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5" />
                  Incidencias
                </CardTitle>
                <CardDescription>
                  Reportes de problema asociados a este equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incidencias.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No hay incidencias reportadas para este equipo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {incidencias.map((inc) => (
                      <div
                        key={inc.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-border/50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{inc.descripcion}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {inc.quien_reporta ?? "—"} · {new Date(inc.fecha_reporte).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 w-fit">{inc.estado}</Badge>
                        <Link href={`/incidencias/${inc.id}`}>
                          <Button variant="ghost" size="sm">Ver</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                {canWrite && (
                  <div className="mt-4">
                    <Link href={`/incidencias/crear?equipo_id=${compositeId}&sucursal_id=${equipo.color_center_id}`}>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Reportar incidencia
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
