"use client"

import { useMemo, useState } from "react"
import type { Equipo, ColorCenter } from "@/lib/types"
import type { EquipoWithEmpresa } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, WrenchIcon, Eye, ChevronRight } from "lucide-react"
import Link from "next/link"
import { TableColumnFilter } from "@/components/table-column-filter"
import { TableSortHeader, type SortOrder } from "@/components/table-sort-header"

interface EquiposTableProps {
  equipos: EquipoWithEmpresa[]
  colorCenters: ColorCenter[]
}

function getColorCenterKey(cc: ColorCenter): string {
  return cc.empresa_id ? `${cc.empresa_id}-${cc.id}` : cc.id
}

function getEquipoSucursalKey(eq: EquipoWithEmpresa): string {
  return eq.empresa_id ? `${eq.empresa_id}-${eq.color_center_id}` : eq.color_center_id
}

export function EquiposTable({ equipos, colorCenters }: EquiposTableProps) {
  const colorCenterMap = new Map(colorCenters.map((cc) => [getColorCenterKey(cc), cc]))

  const [filterTipo, setFilterTipo] = useState<Set<string> | null>(null)
  const [filterEstado, setFilterEstado] = useState<Set<string> | null>(null)
  const [sortBy, setSortBy] = useState<"tipo" | "marca" | "serie" | "sucursal" | "estado" | "vencimiento" | null>("sucursal")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const tipoOptions = useMemo(() => {
    const uniq = new Set(equipos.map((e) => e.tipo_equipo))
    return Array.from(uniq).sort().map((value) => ({ value, label: value }))
  }, [equipos])
  const estadoOptions = useMemo(() => {
    const uniq = new Set(equipos.map((e) => e.estado))
    return Array.from(uniq).sort().map((value) => ({ value, label: value }))
  }, [equipos])
  const filteredEquipos = useMemo(() => {
    return equipos.filter((eq) => {
      if (filterTipo !== null && !filterTipo.has(eq.tipo_equipo)) return false
      if (filterEstado !== null && !filterEstado.has(eq.estado)) return false
      return true
    })
  }, [equipos, filterTipo, filterEstado])

  const handleSort = (key: string) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
        return key
      }
      setSortOrder("asc")
      return key as "tipo" | "marca" | "serie" | "sucursal" | "estado" | "vencimiento"
    })
  }

  const sortedEquipos = useMemo(() => {
    if (!sortBy) return filteredEquipos
    return [...filteredEquipos].sort((a, b) => {
      let cmp = 0
      const ccA = colorCenterMap.get(getEquipoSucursalKey(a))
      const ccB = colorCenterMap.get(getEquipoSucursalKey(b))
      if (sortBy === "tipo") cmp = (a.tipo_equipo ?? "").localeCompare(b.tipo_equipo ?? "")
      else if (sortBy === "marca") cmp = `${a.marca ?? ""} ${a.modelo ?? ""}`.trim().localeCompare(`${b.marca ?? ""} ${b.modelo ?? ""}`.trim())
      else if (sortBy === "serie") cmp = (a.numero_serie ?? "").localeCompare(b.numero_serie ?? "")
      else if (sortBy === "sucursal") cmp = (ccA?.nombre_sucursal ?? "").localeCompare(ccB?.nombre_sucursal ?? "")
      else if (sortBy === "estado") cmp = (a.estado ?? "").localeCompare(b.estado ?? "")
      else if (sortBy === "vencimiento") {
        const dateA = a.tipo_propiedad === "Arrendado" && a.fecha_vencimiento_arrendamiento ? new Date(a.fecha_vencimiento_arrendamiento).getTime() : 0
        const dateB = b.tipo_propiedad === "Arrendado" && b.fecha_vencimiento_arrendamiento ? new Date(b.fecha_vencimiento_arrendamiento).getTime() : 0
        cmp = dateA - dateB
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [filteredEquipos, sortBy, sortOrder, colorCenterMap])

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

  if (sortedEquipos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Ningún equipo coincide con los filtros de columna.
      </div>
    )
  }

  return (
    <>
      {/* Móvil: lista en cards */}
      <div className="md:hidden space-y-2">
        {sortedEquipos.map((equipo) => {
          const colorCenter = colorCenterMap.get(getEquipoSucursalKey(equipo))
          const venc = equipo.tipo_propiedad === "Arrendado" && equipo.fecha_vencimiento_arrendamiento
          const vencDate = venc ? new Date(equipo.fecha_vencimiento_arrendamiento!) : null
          const hoy = new Date()
          hoy.setHours(0, 0, 0, 0)
          const dias = vencDate ? Math.ceil((vencDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null
          return (
            <Link key={equipo.id} href={`/equipos/${equipo.id}`} title={`${equipo.tipo_equipo} ${equipo.marca ?? ""} ${equipo.modelo ?? ""}`.trim()}>
              <Card className="border border-border/60 shadow-sm card-elevated transition-all duration-200 active:bg-muted/30 rounded-2xl">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-foreground">{equipo.tipo_equipo}</span>
                      {getEstadoBadge(equipo.estado)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {equipo.marca} {equipo.modelo && `· ${equipo.modelo}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {colorCenter?.nombre_sucursal || "—"}
                      {equipo.numero_serie && ` · ${equipo.numero_serie}`}
                    </p>
                    {venc && dias != null && (dias < 0 || dias <= 30) && (
                      <p className="text-xs mt-1">
                        {dias < 0 ? (
                          <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">Vencido</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Vence en {dias}d</Badge>
                        )}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <TableSortHeader
                label="Tipo"
                sortKey="tipo"
                currentSortKey={sortBy}
                currentOrder={sortOrder}
                onSort={handleSort}
                className="py-3 px-4"
                extra={
                  <TableColumnFilter label="Tipo" options={tipoOptions} selected={filterTipo} onSelectedChange={setFilterTipo} searchPlaceholder="Buscar tipo..." />
                }
              />
              <TableSortHeader label="Marca/Modelo" sortKey="marca" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader label="N° Serie" sortKey="serie" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader label="Sucursal" sortKey="sucursal" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader
                label="Estado"
                sortKey="estado"
                currentSortKey={sortBy}
                currentOrder={sortOrder}
                onSort={handleSort}
                className="py-3 px-4"
                extra={
                  <TableColumnFilter label="Estado" options={estadoOptions} selected={filterEstado} onSelectedChange={setFilterEstado} searchPlaceholder="Buscar estado..." />
                }
              />
              <TableSortHeader label="Venc. arrend." sortKey="vencimiento" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <th className="text-right py-3 px-4 font-medium text-muted-foreground w-20">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedEquipos.map((equipo) => {
              const colorCenter = colorCenterMap.get(getEquipoSucursalKey(equipo))
              const venc = equipo.tipo_propiedad === "Arrendado" && equipo.fecha_vencimiento_arrendamiento
              const vencDate = venc ? new Date(equipo.fecha_vencimiento_arrendamiento!) : null
              const hoy = new Date()
              hoy.setHours(0, 0, 0, 0)
              const dias = vencDate ? Math.ceil((vencDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null
              return (
                <tr key={equipo.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{equipo.tipo_equipo}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{equipo.numero_serie || "-"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{colorCenter?.nombre_sucursal || "-"}</td>
                  <td className="py-3 px-4">{getEstadoBadge(equipo.estado)}</td>
                  <td className="py-3 px-4">
                    {venc ? (
                      <span className="flex items-center gap-1.5">
                        {vencDate!.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        {dias != null && dias < 0 && (
                          <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">Vencido</Badge>
                        )}
                        {dias != null && dias >= 0 && dias <= 30 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">{dias}d</Badge>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
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
    </>
  )
}
