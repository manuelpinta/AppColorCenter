"use client"

import { useMemo, useState } from "react"
import type { Mantenimiento, ColorCenter } from "@/lib/types"
import type { MantenimientoWithEmpresa, EquipoWithEmpresa } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle2, AlertCircle, Eye, ChevronRight } from "lucide-react"
import Link from "next/link"
import { TableColumnFilter } from "@/components/table-column-filter"
import { TableSortHeader, type SortOrder } from "@/components/table-sort-header"

interface MantenimientosTableProps {
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

function getSucursalKey(equipo: EquipoWithEmpresa): string {
  return equipo.empresa_id ? `${equipo.empresa_id}-${equipo.color_center_id}` : equipo.color_center_id
}

export function MantenimientosTable({ mantenimientos, equipos, colorCenters }: MantenimientosTableProps) {
  const [filterTipo, setFilterTipo] = useState<Set<string> | null>(null)
  const [filterEstado, setFilterEstado] = useState<Set<string> | null>(null)
  const [filterSucursalKey, setFilterSucursalKey] = useState<Set<string> | null>(null)
  const [sortBy, setSortBy] = useState<"fecha" | "equipo" | "sucursal" | "tipo" | "realizado" | "estado" | null>("fecha")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const tipoOptions = useMemo(() => [
    { value: "Preventivo", label: "Preventivo" },
    { value: "Correctivo", label: "Correctivo" },
  ], [])
  const estadoOptions = useMemo(() => [
    { value: "Pendiente", label: "Pendiente" },
    { value: "En Proceso", label: "En Proceso" },
    { value: "Completado", label: "Completado" },
  ], [])
  const sucursalOptions = useMemo(() => {
    const keys = new Set<string>()
    mantenimientos.forEach((m) => {
      const eq = findEquipo(m, equipos)
      if (eq) keys.add(getSucursalKey(eq))
    })
    return Array.from(keys).map((key) => {
      const eq = equipos.find((e) => getSucursalKey(e) === key)
      const cc = eq ? findCC(eq, colorCenters) : undefined
      return { value: key, label: cc ? `${cc.nombre_sucursal} (${cc.codigo_interno})` : key }
    }).sort((a, b) => a.label.localeCompare(b.label))
  }, [mantenimientos, equipos, colorCenters])

  const filteredMantenimientos = useMemo(() => {
    return mantenimientos.filter((m) => {
      const eq = findEquipo(m, equipos)
      const sucursalKey = eq ? getSucursalKey(eq) : null
      if (filterTipo !== null && !filterTipo.has(m.tipo)) return false
      if (filterEstado !== null && !filterEstado.has(m.estado)) return false
      if (filterSucursalKey !== null && sucursalKey && !filterSucursalKey.has(sucursalKey)) return false
      return true
    })
  }, [mantenimientos, equipos, filterTipo, filterEstado, filterSucursalKey])

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

  const sortedMantenimientos = useMemo(() => {
    if (!sortBy) return filteredMantenimientos
    return [...filteredMantenimientos].sort((a, b) => {
      const eqA = findEquipo(a, equipos)
      const eqB = findEquipo(b, equipos)
      const ccA = eqA ? findCC(eqA, colorCenters) : null
      const ccB = eqB ? findCC(eqB, colorCenters) : null
      let cmp = 0
      if (sortBy === "fecha") cmp = new Date(a.fecha_mantenimiento).getTime() - new Date(b.fecha_mantenimiento).getTime()
      else if (sortBy === "equipo") cmp = `${eqA?.tipo_equipo ?? ""} ${eqA?.marca ?? ""}`.localeCompare(`${eqB?.tipo_equipo ?? ""} ${eqB?.marca ?? ""}`)
      else if (sortBy === "sucursal") cmp = (ccA?.nombre_sucursal ?? "").localeCompare(ccB?.nombre_sucursal ?? "")
      else if (sortBy === "tipo") cmp = a.tipo.localeCompare(b.tipo)
      else if (sortBy === "realizado") cmp = (a.realizado_por ?? "").localeCompare(b.realizado_por ?? "")
      else if (sortBy === "estado") cmp = a.estado.localeCompare(b.estado)
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [filteredMantenimientos, sortBy, sortOrder, equipos, colorCenters])

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

  if (sortedMantenimientos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Ningún mantenimiento coincide con los filtros.
      </div>
    )
  }

  return (
    <>
      <div className="md:hidden space-y-2">
        {sortedMantenimientos.map((mant) => {
          const equipo = findEquipo(mant, equipos)
          const colorCenter = equipo ? findCC(equipo, colorCenters) : null
          return (
            <Link key={mant.id} href={`/mantenimientos/${mant.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow active:bg-muted/30">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {new Date(mant.fecha_mantenimiento).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {getTipoBadge(mant.tipo)}
                      {getEstadoBadge(mant.estado)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {equipo?.tipo_equipo} {equipo?.marca && `· ${equipo.marca}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {colorCenter?.nombre_sucursal || "—"} · {mant.realizado_por === "Externo" ? "Externo" : "Interno"}
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
              <TableSortHeader label="Equipo" sortKey="equipo" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
              <TableSortHeader
                label="Sucursal"
                sortKey="sucursal"
                currentSortKey={sortBy}
                currentOrder={sortOrder}
                onSort={handleSort}
                className="py-3 px-4"
                extra={<TableColumnFilter label="Sucursal" options={sucursalOptions} selected={filterSucursalKey} onSelectedChange={setFilterSucursalKey} searchPlaceholder="Buscar..." />}
              />
              <TableSortHeader
                label="Tipo"
                sortKey="tipo"
                currentSortKey={sortBy}
                currentOrder={sortOrder}
                onSort={handleSort}
                className="py-3 px-4"
                extra={<TableColumnFilter label="Tipo" options={tipoOptions} selected={filterTipo} onSelectedChange={setFilterTipo} />}
              />
              <TableSortHeader label="Realizado por" sortKey="realizado" currentSortKey={sortBy} currentOrder={sortOrder} onSort={handleSort} className="py-3 px-4" />
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
            {sortedMantenimientos.map((mant) => {
              const equipo = findEquipo(mant, equipos)
              const colorCenter = equipo ? findCC(equipo, colorCenters) : null
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
                  <td className="py-3 px-4 text-muted-foreground">{mant.realizado_por === "Externo" ? "Externo" : "Interno"}</td>
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
    </>
  )
}
