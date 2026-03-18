"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CalendarClock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { EquiposTable } from "@/components/equipos-table"
import { SucursalFilterCombobox } from "@/components/sucursal-filter-combobox"
import type { Equipo, ColorCenter } from "@/lib/types"
import type { EquipoWithEmpresa } from "@/lib/types"

interface EquiposContentProps {
  equipos: EquipoWithEmpresa[]
  colorCenters: ColorCenter[]
  canWrite: boolean
}

function findColorCenter(equipo: EquipoWithEmpresa, colorCenters: ColorCenter[]): ColorCenter | undefined {
  return colorCenters.find(
    (c) => c.empresa_id === equipo.empresa_id && c.id === equipo.color_center_id
  )
}

const DIAS_POR_VENCER = 90

export function EquiposContent({ equipos, colorCenters, canWrite }: EquiposContentProps) {
  const [search, setSearch] = useState("")
  const [sucursalId, setSucursalId] = useState("all")
  const [propiedad, setPropiedad] = useState<"all" | "Propio" | "Arrendado">("all")
  const [soloPorVencer, setSoloPorVencer] = useState(false)

  const filteredEquipos = useMemo(() => {
    const term = search.trim().toLowerCase()
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const limiteVencer = new Date(hoy)
    limiteVencer.setDate(limiteVencer.getDate() + DIAS_POR_VENCER)
    return equipos.filter((eq) => {
      const cc = findColorCenter(eq, colorCenters)
      const matchSearch =
        !term ||
        eq.tipo_equipo.toLowerCase().includes(term) ||
        (eq.marca?.toLowerCase().includes(term)) ||
        (eq.modelo?.toLowerCase().includes(term)) ||
        (eq.numero_serie?.toLowerCase().includes(term)) ||
        (cc?.nombre_sucursal?.toLowerCase().includes(term)) ||
        (cc?.codigo_interno?.toLowerCase().includes(term))
      const matchSucursal =
        sucursalId === "all" ||
        (eq.empresa_id && eq.color_center_id && `${eq.empresa_id}-${eq.color_center_id}` === sucursalId)
      const matchPropiedad = propiedad === "all" || eq.tipo_propiedad === propiedad
      const matchPorVencer =
        !soloPorVencer ||
        (eq.tipo_propiedad === "Arrendado" &&
          eq.fecha_vencimiento_arrendamiento != null && (() => {
            const v = new Date(eq.fecha_vencimiento_arrendamiento)
            return v >= hoy && v <= limiteVencer
          })())
      return matchSearch && matchSucursal && matchPropiedad && matchPorVencer
    })
  }, [equipos, colorCenters, search, sucursalId, propiedad, soloPorVencer])

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
              className="pl-9 h-10 min-h-[44px] w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SucursalFilterCombobox
              value={sucursalId}
              onValueChange={setSucursalId}
              colorCenters={colorCenters}
              triggerClassName="w-full sm:w-auto sm:min-w-[200px] min-h-[44px] sm:min-h-[40px]"
            />
            <Select value={propiedad} onValueChange={(v) => setPropiedad(v as "all" | "Propio" | "Arrendado")}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-10 min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos (propiedad)</SelectItem>
                <SelectItem value="Propio">Propio</SelectItem>
                <SelectItem value="Arrendado">En arrendamiento</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0 h-10 px-3 rounded-md border bg-background min-w-[200px] touch-manipulation">
              <Checkbox
                id="solo-por-vencer"
                checked={soloPorVencer}
                onCheckedChange={(c) => setSoloPorVencer(!!c)}
              />
              <label
                htmlFor="solo-por-vencer"
                className="text-sm cursor-pointer flex items-center gap-1.5"
              >
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Por vencer ({DIAS_POR_VENCER} días)
              </label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EquiposTable equipos={filteredEquipos} colorCenters={colorCenters} canWrite={canWrite} />
      </CardContent>
    </Card>
  )
}
