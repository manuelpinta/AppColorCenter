import { notFound } from "next/navigation"
import Link from "next/link"
import {
  findIncidenciaInAllBases,
  getSucursalesByEmpresa,
  getEquipoById,
  getMantenimientosByIncidenciaId,
} from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  User,
  Building2,
  Wrench,
  FileText,
  AlertTriangle,
} from "lucide-react"

export default async function DetalleIncidenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await findIncidenciaInAllBases(id)
  if (!found) notFound()
  const { incidencia, pool, empresaId } = found

  const [sucursales, equipo, mantenimientosRaw] = await Promise.all([
    getSucursalesByEmpresa(empresaId),
    incidencia.equipo_id ? getEquipoById(pool, incidencia.equipo_id) : Promise.resolve(null),
    getMantenimientosByIncidenciaId(pool, incidencia.id),
  ])
  const sucursal = sucursales.find((c) => c.id === incidencia.sucursal_id)
  const mantenimientos = mantenimientosRaw.map((m) => ({
    ...m,
    id: `${empresaId}-${m.id}`,
  }))
  const equipoIdForLink = equipo ? `${empresaId}-${equipo.id}` : null

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Reportada":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Reportada</Badge>
      case "En atención":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">En atención</Badge>
      case "Resuelta":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Resuelta</Badge>
      case "Cerrada":
        return <Badge className="bg-slate-50 text-slate-600 border-slate-200">Cerrada</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getSeveridadBadge = (severidad: string | null) => {
    if (!severidad) return null
    switch (severidad) {
      case "Crítica":
        return <Badge variant="outline" className="text-destructive border-destructive/30">Crítica</Badge>
      case "Alta":
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Alta</Badge>
      case "Media":
        return <Badge variant="outline" className="text-amber-600 border-amber-300">Media</Badge>
      case "Baja":
        return <Badge variant="outline" className="text-slate-600 border-slate-300">Baja</Badge>
      default:
        return <Badge variant="outline">{severidad}</Badge>
    }
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
        <Link
          href="/incidencias"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Incidencias
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Incidencia #{id}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(incidencia.fecha_reporte).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getEstadoBadge(incidencia.estado)}
            {getSeveridadBadge(incidencia.severidad)}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{incidencia.descripcion}</p>
                {incidencia.notas && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground font-medium">Notas</p>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{incidencia.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Contexto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary/60 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reportó</p>
                    <p className="font-medium">{incidencia.quien_reporta ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary/60 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sucursal</p>
                    <p className="font-medium">{sucursal?.nombre_sucursal ?? incidencia.sucursal_id}</p>
                    {sucursal?.codigo_interno && (
                      <p className="text-xs text-muted-foreground">{sucursal.codigo_interno}</p>
                    )}
                  </div>
                </div>
                {equipo && equipoIdForLink && (
                  <div className="flex items-start gap-3">
                    <Wrench className="h-5 w-5 text-primary/60 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Equipo</p>
                      <Link href={`/equipos/${equipoIdForLink}`} className="font-medium text-primary hover:underline">
                        {equipo.tipo_equipo} {equipo.marca && `- ${equipo.marca}`}
                      </Link>
                      {equipo.numero_serie && (
                        <p className="text-xs text-muted-foreground">{equipo.numero_serie}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {mantenimientos.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Mantenimientos derivados
                  </CardTitle>
                  <CardDescription>
                    Mantenimientos correctivos o preventivos vinculados a esta incidencia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {mantenimientos.map((mant) => (
                      <li key={mant.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <Link href={`/mantenimientos/${mant.id}`} className="font-medium text-primary hover:underline">
                            {mant.tipo} – {new Date(mant.fecha_mantenimiento).toLocaleDateString("es-ES")}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{mant.descripcion}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">{mant.estado}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
