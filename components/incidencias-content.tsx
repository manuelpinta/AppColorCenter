"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IncidenciasTable } from "@/components/incidencias-table"
import type { Incidencia, ColorCenter, Equipo } from "@/lib/types"
import type { IncidenciaWithEmpresa, EquipoWithEmpresa } from "@/lib/types"
import { findEquipoForMantenimientoRow } from "@/lib/data/ids"

interface IncidenciasContentProps {
  incidencias: IncidenciaWithEmpresa[]
  colorCenters: ColorCenter[]
  equipos: EquipoWithEmpresa[]
  canWrite: boolean
}

function findColorCenter(inc: IncidenciaWithEmpresa, colorCenters: ColorCenter[]): ColorCenter | undefined {
  return colorCenters.find((c) => c.empresa_id === inc.empresa_id && c.id === inc.sucursal_id)
}

function findEquipo(inc: IncidenciaWithEmpresa, equipos: EquipoWithEmpresa[]): EquipoWithEmpresa | undefined {
  if (!inc.equipo_id) return undefined
  return findEquipoForMantenimientoRow(inc, equipos)
}

export function IncidenciasContent({
  incidencias,
  colorCenters,
  equipos,
  canWrite,
}: IncidenciasContentProps) {
  const [search, setSearch] = useState("")

  const filteredIncidencias = useMemo(() => {
    const term = search.trim().toLowerCase()
    return incidencias.filter((inc) => {
      const cc = findColorCenter(inc, colorCenters)
      const equipo = findEquipo(inc, equipos)
      const matchSearch =
        !term ||
        (inc.quien_reporta?.toLowerCase().includes(term)) ||
        inc.descripcion.toLowerCase().includes(term) ||
        (inc.notas?.toLowerCase().includes(term)) ||
        (cc?.nombre_sucursal?.toLowerCase().includes(term)) ||
        (cc?.codigo_interno?.toLowerCase().includes(term)) ||
        (equipo?.tipo_equipo?.toLowerCase().includes(term)) ||
        (equipo?.numero_serie?.toLowerCase().includes(term))
      return matchSearch
    })
  }, [incidencias, colorCenters, equipos, search])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg lg:text-xl">
            Incidencias ({filteredIncidencias.length}
            {filteredIncidencias.length !== incidencias.length ? ` de ${incidencias.length}` : ""})
          </CardTitle>
          {canWrite && (
            <Link href="/incidencias/crear">
              <Button size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reportar incidencia
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por reporte, descripción, sucursal o equipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <IncidenciasTable
          incidencias={filteredIncidencias}
          colorCenters={colorCenters}
          equipos={equipos}
          canWrite={canWrite}
        />
      </CardContent>
    </Card>
  )
}
