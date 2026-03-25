import { notFound } from "next/navigation"
import Link from "next/link"
import {
  findMantenimientoInAllBases,
  getEquipoById,
  getSucursalesByEmpresa,
  getFotosByMantenimientoId,
  buildEquipoCompositeId,
} from "@/lib/data"
import { MantenimientoFotosSection } from "@/components/mantenimiento-fotos-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { userCanWrite } from "@/lib/auth-roles"
import {
  ArrowLeft,
  Edit,
  User,
  Wrench,
  FileText,
  Building2,
  Clock,
  CheckCircle2,
  Timer,
  DollarSign,
  Package,
} from "lucide-react"

export default async function DetalleMantenimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const canWrite = await userCanWrite()
  const found = await findMantenimientoInAllBases(id)
  if (!found) notFound()
  const { mantenimiento, pool, empresaId } = found

  const [equipo, sucursales, fotos] = await Promise.all([
    getEquipoById(pool, mantenimiento.equipo_id),
    getSucursalesByEmpresa(empresaId),
    getFotosByMantenimientoId(pool, mantenimiento.id),
  ])
  const colorCenter = equipo
    ? sucursales.find((c) => c.id === equipo.color_center_id)
    : null
  const equipoIdForLink = equipo ? buildEquipoCompositeId(empresaId, equipo) : null

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

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
        <Link
          href="/mantenimientos"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Mantenimientos
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              {getEstadoIcon(mantenimiento.estado)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Mantenimiento {mantenimiento.tipo} n.º {mantenimiento.id}
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date(mantenimiento.fecha_mantenimiento).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {colorCenter && (
                <p className="text-sm text-foreground/90 mt-1">
                  {colorCenter.nombre_sucursal}
                  {colorCenter.codigo_interno ? (
                    <span className="text-muted-foreground"> · {colorCenter.codigo_interno}</span>
                  ) : null}
                </p>
              )}
            </div>
          </div>
          {canWrite && (
            <Link href={`/mantenimientos/${id}/editar`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
          <Card className="border border-border/60 shadow-sm lg:col-span-3">
            <CardHeader className="pb-2 space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" />
                Descripción
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{mantenimiento.descripcion}</p>
              {mantenimiento.piezas_cambiadas && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Piezas cambiadas
                  </p>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{mantenimiento.piezas_cambiadas}</p>
                </div>
              )}
              {mantenimiento.notas && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium">Notas</p>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{mantenimiento.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Contexto</CardTitle>
                <Badge className={`${getEstadoBadgeColor(mantenimiento.estado)} text-xs px-2 py-0.5`}>
                  {mantenimiento.estado}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Realizado por</p>
                    <p className="font-medium text-sm">
                      {mantenimiento.realizado_por === "Externo" ? "Externo" : "Interno"}
                      {mantenimiento.realizado_por === "Interno" && mantenimiento.tecnico_responsable && (
                        <span className="text-muted-foreground font-normal"> · {mantenimiento.tecnico_responsable}</span>
                      )}
                    </p>
                  </div>
                </div>
                {equipo && equipoIdForLink && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <Wrench className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Equipo</p>
                        <Link
                          href={`/equipos/${equipoIdForLink}`}
                          className="font-medium text-sm text-primary hover:underline"
                        >
                          {equipo.tipo_equipo} {equipo.marca && `- ${equipo.marca}`}
                        </Link>
                        {equipo.numero_serie && (
                          <p className="text-xs text-muted-foreground">{equipo.numero_serie}</p>
                        )}
                      </div>
                    </div>
                    {colorCenter && (
                      <div className="flex items-start gap-2.5">
                        <Building2 className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Sucursal</p>
                          <p className="font-medium text-sm">{colorCenter.nombre_sucursal}</p>
                          <p className="text-xs text-muted-foreground">{colorCenter.codigo_interno}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {(mantenimiento.tiempo_fuera_servicio != null || mantenimiento.costo != null) && (
                  <div className="flex flex-wrap gap-3 pt-1 border-t border-border/60">
                    {mantenimiento.tiempo_fuera_servicio != null && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{mantenimiento.tiempo_fuera_servicio}h fuera de servicio</span>
                      </div>
                    )}
                    {mantenimiento.costo != null && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>${mantenimiento.costo.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-4">
          <MantenimientoFotosSection
            mantenimientoId={id}
            fotos={fotos}
            canWrite={canWrite}
          />
        </div>
      </div>
    </div>
  )
}
