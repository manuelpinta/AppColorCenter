"use client"

import type { Equipo, ColorCenter } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, WrenchIcon, Eye } from "lucide-react"
import Link from "next/link"
import { Edit } from "lucide-react"

interface EquiposTableProps {
  equipos: Equipo[]
  colorCenters: ColorCenter[]
}

export function EquiposTable({ equipos, colorCenters }: EquiposTableProps) {
  const colorCenterMap = new Map(colorCenters.map((cc) => [cc.id, cc]))

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

  if (equipos.length === 0) {
    return (
      <div className="text-center py-12">
        <WrenchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay equipos registrados</h3>
        <p className="text-muted-foreground mb-4">Comienza agregando tu primer equipo</p>
        <Link href="/equipos/crear">
          <Button>Agregar Equipo</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Marca/Modelo</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">N° Serie</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sucursal</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((equipo) => {
            const colorCenter = colorCenterMap.get(equipo.color_center_id)
            return (
              <tr key={equipo.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-4 font-medium">{equipo.tipo_equipo}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{equipo.numero_serie || "-"}</td>
                <td className="py-3 px-4 text-muted-foreground">{colorCenter?.nombre_sucursal || "-"}</td>
                <td className="py-3 px-4">{getEstadoBadge(equipo.estado)}</td>
                <td className="py-3 px-4 text-right">
                  <Link href={`/equipos/${equipo.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
