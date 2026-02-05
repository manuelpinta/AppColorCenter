"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, WrenchIcon } from "lucide-react"
import { EquiposTable } from "@/components/equipos-table"
import { SucursalFilterCombobox } from "@/components/sucursal-filter-combobox"
import type { Equipo, ColorCenter } from "@/lib/types"

interface EquiposContentProps {
  equipos: Equipo[]
  colorCenters: ColorCenter[]
}

export function EquiposContent({ equipos, colorCenters }: EquiposContentProps) {
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState("all")
  const [tipoEquipo, setTipoEquipo] = useState("all")
  const [sucursalId, setSucursalId] = useState("all")

  const filteredEquipos = useMemo(() => {
    const term = search.trim().toLowerCase()
    return equipos.filter((eq) => {
      const cc = colorCenters.find((c) => c.id === eq.color_center_id)
      const matchSearch =
        !term ||
        eq.tipo_equipo.toLowerCase().includes(term) ||
        (eq.marca?.toLowerCase().includes(term)) ||
        (eq.modelo?.toLowerCase().includes(term)) ||
        (eq.numero_serie?.toLowerCase().includes(term)) ||
        (cc?.nombre_sucursal?.toLowerCase().includes(term)) ||
        (cc?.codigo_interno?.toLowerCase().includes(term))
      const matchEstado = estado === "all" || eq.estado === estado
      const matchTipo = tipoEquipo === "all" || eq.tipo_equipo === tipoEquipo
      const matchSucursal = sucursalId === "all" || eq.color_center_id === sucursalId
      return matchSearch && matchEstado && matchTipo && matchSucursal
    })
  }, [equipos, colorCenters, search, estado, tipoEquipo, sucursalId])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg lg:text-xl">
            Todos los Equipos ({filteredEquipos.length}
            {filteredEquipos.length !== equipos.length ? ` de ${equipos.length}` : ""})
          </CardTitle>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por tipo, marca, modelo, N° serie o sucursal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Operativo">Operativo</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
                <SelectItem value="Fuera de Servicio">Fuera de Servicio</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoEquipo} onValueChange={setTipoEquipo}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10">
                <WrenchIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Tintometrico">Tintométrico</SelectItem>
                <SelectItem value="Mezcladora">Mezcladora</SelectItem>
                <SelectItem value="Regulador">Regulador</SelectItem>
                <SelectItem value="Equipo de Computo">Equipo de Cómputo</SelectItem>
              </SelectContent>
            </Select>
            <SucursalFilterCombobox
              value={sucursalId}
              onValueChange={setSucursalId}
              colorCenters={colorCenters}
              triggerClassName="w-full sm:w-auto sm:min-w-[200px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EquiposTable equipos={filteredEquipos} colorCenters={colorCenters} />
      </CardContent>
    </Card>
  )
}
