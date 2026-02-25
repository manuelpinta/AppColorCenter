"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { MantenimientosTable } from "@/components/mantenimientos-table"
import type { Mantenimiento, ColorCenter } from "@/lib/types"
import type { MantenimientoWithEmpresa, EquipoWithEmpresa } from "@/lib/types"

interface MantenimientosContentProps {
  mantenimientos: MantenimientoWithEmpresa[]
  equipos: EquipoWithEmpresa[]
  colorCenters: ColorCenter[]
}

function findEquipo(mant: MantenimientoWithEmpresa, equipos: EquipoWithEmpresa[]): EquipoWithEmpresa | undefined {
  return equipos.find((e) => e.empresa_id === mant.empresa_id && e.id === `${mant.empresa_id}-${mant.equipo_id}`)
}

function findCC(equipo: EquipoWithEmpresa, colorCenters: ColorCenter[]): ColorCenter | undefined {
  return colorCenters.find((c) => c.empresa_id === equipo.empresa_id && c.id === equipo.color_center_id)
}

export function MantenimientosContent({
  mantenimientos,
  equipos,
  colorCenters,
}: MantenimientosContentProps) {
  const [search, setSearch] = useState("")

  const filteredMantenimientos = useMemo(() => {
    const term = search.trim().toLowerCase()
    return mantenimientos.filter((mant) => {
      const equipo = findEquipo(mant, equipos)
      const cc = equipo ? findCC(equipo, colorCenters) : null
      const matchSearch =
        !term ||
        mant.realizado_por?.toLowerCase().includes(term) ||
        (mant.descripcion?.toLowerCase().includes(term)) ||
        (mant.notas?.toLowerCase().includes(term)) ||
        (equipo?.tipo_equipo?.toLowerCase().includes(term)) ||
        (equipo?.marca?.toLowerCase().includes(term)) ||
        (equipo?.numero_serie?.toLowerCase().includes(term)) ||
        (cc?.nombre_sucursal?.toLowerCase().includes(term)) ||
        (cc?.codigo_interno?.toLowerCase().includes(term))
      return matchSearch
    })
  }, [mantenimientos, equipos, colorCenters, search])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg lg:text-xl">
            Historial de Mantenimientos ({filteredMantenimientos.length}
            {filteredMantenimientos.length !== mantenimientos.length ? ` de ${mantenimientos.length}` : ""})
          </CardTitle>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por interno/externo, descripción, equipo o sucursal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MantenimientosTable
          mantenimientos={filteredMantenimientos}
          equipos={equipos}
          colorCenters={colorCenters}
        />
      </CardContent>
    </Card>
  )
}
