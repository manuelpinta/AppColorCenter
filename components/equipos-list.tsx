import type { Equipo } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, AlertTriangle, CheckCircle2, XCircle, WrenchIcon } from "lucide-react"
import Link from "next/link"

interface EquiposListProps {
  equipos: Equipo[]
  colorCenterId: string
}

export function EquiposList({ equipos, colorCenterId }: EquiposListProps) {
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Operativo":
        return (
          <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Operativo
          </Badge>
        )
      case "Mantenimiento":
        return (
          <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
            <WrenchIcon className="h-3 w-3 mr-1" />
            Mantenimiento
          </Badge>
        )
      case "Fuera de Servicio":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Fuera de Servicio
          </Badge>
        )
      case "Inactivo":
        return (
          <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Inactivo
          </Badge>
        )
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const isProximaRevisionCercana = (fecha: string | null) => {
    if (!fecha) return false
    const hoy = new Date()
    const proximaRevision = new Date(fecha)
    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
    return proximaRevision <= treintaDias && proximaRevision >= hoy
  }

  if (equipos.length === 0) {
    return (
      <div className="text-center py-12">
        <WrenchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay equipos registrados</h3>
        <p className="text-muted-foreground mb-4">Comienza agregando el primer equipo a este Color Center</p>
        <Link href={`/equipos/crear?color_center_id=${colorCenterId}`}>
          <Button>Agregar Equipo</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {equipos.map((equipo) => (
        <div key={equipo.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{equipo.tipo_equipo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
                  </p>
                </div>
                {getEstadoBadge(equipo.estado)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {equipo.numero_serie && (
                  <div>
                    <span className="text-muted-foreground">N° Serie:</span>
                    <span className="ml-2 font-medium text-foreground">{equipo.numero_serie}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Propiedad:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {equipo.tipo_propiedad === "Arrendado" && equipo.arrendador
                      ? `Arrendado - ${equipo.arrendador}`
                      : "Propio"}
                  </span>
                </div>
                {equipo.ultima_calibracion && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Última calibración:</span>
                    <span className="font-medium text-foreground">
                      {new Date(equipo.ultima_calibracion).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                )}
                {equipo.proxima_revision && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Próxima revisión:</span>
                    <span
                      className={`font-medium ${
                        isProximaRevisionCercana(equipo.proxima_revision) ? "text-orange-600" : "text-foreground"
                      }`}
                    >
                      {new Date(equipo.proxima_revision).toLocaleDateString("es-ES")}
                    </span>
                    {isProximaRevisionCercana(equipo.proxima_revision) && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                )}
              </div>

              {equipo.notas && (
                <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">{equipo.notas}</p>
              )}
            </div>

            <div className="flex sm:flex-col gap-2">
              <Link href={`/equipos/${equipo.id}`} className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Ver detalles
                </Button>
              </Link>
              <Link href={`/mantenimientos/crear?equipo_id=${equipo.id}`} className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Reportar falla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
