"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Building2, MapPin, Filter } from "lucide-react"
import type { Empresa } from "@/lib/types"

interface DashboardFiltersProps {
  empresas: Empresa[]
  searchTerm: string
  onSearchChange: (value: string) => void
  empresaFilter: string
  onEmpresaChange: (value: string) => void
  regionFilter: string
  onRegionChange: (value: string) => void
  estadoFilter: string
  onEstadoChange: (value: string) => void
  regiones: string[]
}

export function DashboardFilters({
  empresas,
  searchTerm,
  onSearchChange,
  empresaFilter,
  onEmpresaChange,
  regionFilter,
  onRegionChange,
  estadoFilter,
  onEstadoChange,
  regiones,
}: DashboardFiltersProps) {
  const empresaSeleccionada = empresas.find((e) => e.id === empresaFilter)
  const regionesDisponibles =
    empresaFilter === "all" ? regiones : empresaSeleccionada?.regiones ?? []

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar sucursal o código..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 w-full"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={empresaFilter} onValueChange={(val) => {
          onEmpresaChange(val)
          onRegionChange("all")
        }}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.nombre} ({empresa.total_sucursales})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {regionesDisponibles.length > 1 && (
          <Select value={regionFilter} onValueChange={onRegionChange}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las regiones</SelectItem>
              {regionesDisponibles.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={estadoFilter} onValueChange={onEstadoChange}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Operativo">Operativo</SelectItem>
            <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
            <SelectItem value="Inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
