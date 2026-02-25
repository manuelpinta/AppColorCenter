"use client"

import { useMemo, useState } from "react"
import type { Incidencia, ColorCenter, Equipo } from "@/lib/types"
import type { IncidenciaWithEmpresa, EquipoWithEmpresa } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Eye, ChevronRight } from "lucide-react"
import Link from "next/link"
import { TableColumnFilter } from "@/components/table-column-filter"
import { TableSortHeader, type SortOrder } from "@/components/table-sort-header"

interface IncidenciasTableProps {
  incidencias: IncidenciaWithEmpresa[]
  colorCenters: ColorCenter[]
  equipos: EquipoWithEmpresa[]
}

function getSucursalKey(inc: IncidenciaWithEmpresa): string {
  return inc.empresa_id ? `${inc.empresa_id}-${inc.sucursal_id}` : inc.sucursal_id
}

function findCC(inc: IncidenciaWithEmpresa, colorCenters: ColorCenter[]): ColorCenter | undefined {
  return colorCenters.find((c) => c.empresa_id === inc.empresa_id && c.id === inc.sucursal_id)
}

function findEquipo(inc: IncidenciaWithEmpresa, equipos: EquipoWithEmpresa[]): EquipoWithEmpresa | undefined {
  if (!inc.equipo_id) return undefined
  return equipos.find((e) => e.empresa_id === inc.empresa_id && e.id === `${inc.empresa_id}-${inc.equipo_id}`)
}

export function IncidenciasTable({ incidencias, colorCenters, equipos }: IncidenciasTableProps) {
  const [filterEstado, setFilterEstado] = useState<Set<string> | null>(null)
  const [filterSeveridad, setFilterSeveridad] = useState<Set<string> | null>(null)
  const [filterSucursalKey, setFilterSucursalKey] = useState<Set<string> | null>(null)
  const [sortBy, setSortBy] = useState<"fecha" | "reporto" | "descripcion" | "sucursal" | "equipo" | "severidad" | "estado" | null>("fecha")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const estadoOptions = useMemo(() => [
    { value: "Reportada", label: "Reportada" },
    { value: "En atención", label: "En atención" },
    { value: "Resuelta", label: "Resuelta" },
    { value: "Cerrada", label: "Cerrada" },
  ], [])
  const severidadOptions = useMemo(() => [
    { value: "__null__", label: "(Sin clasificar)" },
    { value: "Baja", label: "Baja" },
    { value: "Media", label: "Media" },
    { value: "Alta", label: "Alta" },
    { value: "Crítica", label: "Crítica" },
  ], [])
  const sucursalOptions = useMemo(() => {
    const keys = new Set(incidencias.map(getSucursalKey))
    return Array.from(keys).map((key) => {
      const inc = incidencias.find((i) => getSucursalKey(i) === key)
      const cc = inc ? findCC(inc, colorCenters) : undefined
      return { value: key, label: cc ? `${cc.nombre_sucursal} (${cc.codigo_interno})` : key }
    }).sort((a, b) => a.label.localeCompare(b.label))
  }, [incidencias, colorCenters])

  const filteredIncidencias = useMemo(() => {
    return incidencias.filter((inc) => {
      if (filterEstado !== null && !filterEstado.has(inc.estado)) return false
      if (filterSeveridad !== null) {
        const sev = inc.severidad == null ? "__null__" : inc.severidad
        if (!filterSeveridad.has(sev)) return false
      }
      if (filterSucursalKey !== null && !filterSucursalKey.has(getSucursalKey(inc))) return false
      return true
    })
  }, [incidencias, filterEstado, filterSeveridad, filterSucursalKey])

  const handleSort = (key: string) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
        return key
      }
      setSortOrder(key === "fecha" ? "desc" : "asc")
      return key as typeof sortBy
    })
  }

  const sortedIncidencias = useMemo(() => {
    if (!sortBy) return filteredIncidencias
    return [...filteredIncidencias].sort((a, b) => {
      const ccA = findCC(a, colorCenters)
      const ccB = findCC(b, colorCenters)
      const eqA = findEquipo(a, equipos)
      const eqB = findEquipo(b, equipos)
      let cmp = 0
      if (sortBy === "fecha") cmp = new Date(a.fecha_reporte).getTime() - new Date(b.fecha_reporte).getTime()
      else if (sortBy === "reporto") cmp = (a.quien_reporta ?? "").localeCompare(b.quien_reporta ?? "")
      else if (sortBy === "descripcion") cmp = (a.descripcion ?? "").localeCompare(b.descripcion ?? "")
      else if (sortBy === "sucursal") cmp = (ccA?.nombre_sucursal ?? "").localeCompare(ccB?.nombre_sucursal ?? "")
      else if (sortBy === "equipo") cmp = `${eqA?.tipo_equipo ?? ""} ${eqA?.numero_serie ?? ""}`.localeCompare(`${eqB?.tipo_equipo ?? ""} ${eqB?.numero_serie ?? ""}`)
      else if (sortBy === "severidad") cmp = (a.severidad ?? "").localeCompare(b.severidad ?? "")
      else if (sortBy === "estado") cmp = a.estado.localeCompare(b.estado)
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [filteredIncidencias, sortBy, sortOrder, colorCenters, equipos])

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Reportada":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Reportada</Badge>
      case "En atención":
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">En atención</Badge>
      case "Resuelta":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Resuelta</Badge>
      case "Cerrada":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Cerrada</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getSeveridadBadge = (severidad: string | null) => {
    if (!severidad) return <span className="text-muted-foreground">—</span>
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

  if (incidencias.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay incidencias</h3>
        <p className="text-muted-foreground mb-4">Los reportes de problema aparecerán aquí</p>
        <Link href="/incidencias/crear">
          <Button>Reportar incidencia</Button>
        </Link>
      </div>
    )
  }

  if (sortedIncidencias.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Ninguna incidencia coincide con los filtros.
      </div>
    )
  }

  return (
    <>
      <div className="md:hidden space-y-2">
        {sortedIncidencias.map((inc) => {
          const cc = findCC(inc, colorCenters)
          const equipo = findEquipo(inc, equipos)
          return (
            <Link key={inc.id} href={`/incidencias/${inc.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow active:bg-muted/30">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground line-clamp-2">{inc.descripcion}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {getEstadoBadge(inc.estado)}
                      {getSeveridadBadge(inc.severidad)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(inc.fecha_reporte).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      {" · "}
                      {inc.quien_reporta ?? "—"}
                      {" · "}
                      {cc?.nombre_sucursal ?? "—"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <TableSortHeader label="Fecha" sortKey="fecha" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader label="Reportó" sortKey="reporto" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader label="Descripción" sortKey="descripcion" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader
                label="Sucursal"
                sortKey="sucursal"
                currentSortKey={sortBy}
                currentOrder={sortOrder}
                onSort={handleSort}
                className="py-3 px-4"
                extra={<TableColumnFilter label="Sucursal" options={sucursalOptions} selected={filterSucursalKey} onSelectedChange={setFilterSucursalKey} searchPlaceholder="Buscar..." />}
              />
              <TableSortHeader label="Equipo" sortKey="equipo" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader
                label="Severidad"
                sortKey="severidad"
                currentSortKey={sortBy}
                currentOrder={sortOrder}
                onSort={handleSort}
                className="py-3 px-4"
                extra={<TableColumnFilter label="Severidad" options={severidadOptions} selected={filterSeveridad} onSelectedChange={setFilterSeveridad} />}
              />
              <TableSortHeader
                label="Estado"
                sortKey="estado"
                currentSortKey={sortBy}
                currentOrder={sortOrder}
                onSort={handleSort}
                className="py-3 px-4"
                extra={<TableColumnFilter label="Estado" options={estadoOptions} selected={filterEstado} onSelectedChange={setFilterEstado} />}
              />
              <th className="text-right py-3 px-4 font-medium text-muted-foreground w-20">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedIncidencias.map((inc) => {
              const cc = findCC(inc, colorCenters)
              const equipo = findEquipo(inc, equipos)
              return (
                <tr key={inc.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {new Date(inc.fecha_reporte).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4 font-medium">{inc.quien_reporta ?? "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate" title={inc.descripcion}>
                    {inc.descripcion}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{cc?.nombre_sucursal ?? inc.sucursal_id}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {equipo ? `${equipo.tipo_equipo} ${equipo.numero_serie ?? ""}` : "—"}
                  </td>
                  <td className="py-3 px-4">{getSeveridadBadge(inc.severidad)}</td>
                  <td className="py-3 px-4">{getEstadoBadge(inc.estado)}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/incidencias/${inc.id}`}>
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
    </>
  )
}
