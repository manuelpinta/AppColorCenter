"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, WrenchIcon, Clock } from "lucide-react"
import { MantenimientosTable } from "@/components/mantenimientos-table"
import { SucursalFilterCombobox } from "@/components/sucursal-filter-combobox"
import type { Mantenimiento, Equipo, ColorCenter } from "@/lib/types"

interface MantenimientosContentProps {
  mantenimientos: Mantenimiento[]
  equipos: Equipo[]
  colorCenters: ColorCenter[]
}

export function MantenimientosContent({
  mantenimientos,
  equipos,
  colorCenters,
}: MantenimientosContentProps) {
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState("all")
  const [estado, setEstado] = useState("all")
  const [sucursalId, setSucursalId] = useState("all")

  const filteredMantenimientos = useMemo(() => {
    const equipoMap = new Map(equipos.map((e) => [e.id, e]))
    const colorCenterMap = new Map(colorCenters.map((c) => [c.id, c]))
    const term = search.trim().toLowerCase()
    return mantenimientos.filter((mant) => {
      const equipo = equipoMap.get(mant.equipo_id)
      const cc = equipo ? colorCenterMap.get(equipo.color_center_id) : null
      const matchSearch =
        !term ||
        mant.tecnico_responsable.toLowerCase().includes(term) ||
        (mant.descripcion?.toLowerCase().includes(term)) ||
        (mant.notas?.toLowerCase().includes(term)) ||
        (equipo?.tipo_equipo?.toLowerCase().includes(term)) ||
        (equipo?.marca?.toLowerCase().includes(term)) ||
        (equipo?.numero_serie?.toLowerCase().includes(term)) ||
        (cc?.nombre_sucursal?.toLowerCase().includes(term)) ||
        (cc?.codigo_interno?.toLowerCase().includes(term))
      const matchTipo = tipo === "all" || mant.tipo === tipo
      const matchEstado = estado === "all" || mant.estado === estado
      const matchSucursal =
        sucursalId === "all" || (equipo && equipo.color_center_id === sucursalId)
      return matchSearch && matchTipo && matchEstado && matchSucursal
    })
  }, [mantenimientos, equipos, colorCenters, search, tipo, estado, sucursalId])

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
              placeholder="Buscar por técnico, descripción, equipo o sucursal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10">
                <WrenchIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Preventivo">Preventivo</SelectItem>
                <SelectItem value="Correctivo">Correctivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En Proceso">En Proceso</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
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
        <MantenimientosTable
          mantenimientos={filteredMantenimientos}
          equipos={equipos}
          colorCenters={colorCenters}
        />
      </CardContent>
    </Card>
  )
}
