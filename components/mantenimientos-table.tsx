"use client"

import type { Mantenimiento, Equipo, ColorCenter } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, AlertCircle, Eye } from "lucide-react"
import Link from "next/link"
import { Edit } from "lucide-react" // Import Edit icon

interface MantenimientosTableProps {
  mantenimientos: Mantenimiento[]
  equipos: Equipo[]
  colorCenters: ColorCenter[]
}

export function MantenimientosTable({ mantenimientos, equipos, colorCenters }: MantenimientosTableProps) {
  const equipoMap = new Map(equipos.map((e) => [e.id, e]))
  const colorCenterMap = new Map(colorCenters.map((cc) => [cc.id, cc]))

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Completado":
        return (
          <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        )
      case "En Proceso":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            En Proceso
          </Badge>
        )
      case "Pendiente":
        return (
          <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
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
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Correctivo
      </Badge>
    )
  }

  if (mantenimientos.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay mantenimientos registrados</h3>
        <p className="text-muted-foreground mb-4">Comienza registrando el primer mantenimiento</p>
        <Link href="/mantenimientos/crear">
          <Button>Registrar Mantenimiento</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fecha</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Equipo</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sucursal</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Técnico</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mantenimientos.map((mant) => {
            const equipo = equipoMap.get(mant.equipo_id)
            const colorCenter = equipo ? colorCenterMap.get(equipo.color_center_id) : null

            return (
              <tr key={mant.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-4 font-medium">
                  {new Date(mant.fecha_mantenimiento).toLocaleDateString("es-ES")}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {equipo?.tipo_equipo} - {equipo?.marca}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{colorCenter?.nombre_sucursal || "-"}</td>
                <td className="py-3 px-4">{getTipoBadge(mant.tipo)}</td>
                <td className="py-3 px-4 text-muted-foreground">{mant.tecnico_responsable}</td>
                <td className="py-3 px-4">{getEstadoBadge(mant.estado)}</td>
                <td className="py-3 px-4 text-right">
                  <Link href={`/mantenimientos/${mant.id}`}>
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
