"use client"

import { useState, useMemo } from "react"
import { KPICards } from "@/components/kpi-cards"
import { TableColumnFilter } from "@/components/table-column-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Building2, MapPin, ChevronRight, ChevronLeft, LayoutGrid, List, Search, X, Filter } from "lucide-react"
import Link from "next/link"
import type { ColorCenter, Empresa } from "@/lib/types"
import type { EquipoWithEmpresa } from "@/lib/types"
import { TableSortHeader, type SortOrder } from "@/components/table-sort-header"

const ITEMS_PER_PAGE = 20

interface DashboardContentProps {
  colorCenters: ColorCenter[]
  equipos: EquipoWithEmpresa[]
  empresas: Empresa[]
  regiones: string[]
  /** Si viene de URL (ej. /gallco → emp-2), filtrar solo esta empresa al cargar. */
  initialEmpresaId?: string
}

export function DashboardContent({
  colorCenters,
  equipos,
  empresas,
  regiones,
  initialEmpresaId,
}: DashboardContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const validEmpresaIds = useMemo(() => new Set(empresas.map((e) => e.id)), [empresas])
  const [filterEmpresaSet, setFilterEmpresaSet] = useState<Set<string> | null>(() =>
    initialEmpresaId && validEmpresaIds.has(initialEmpresaId) ? new Set([initialEmpresaId]) : null
  )
  const [filterRegionSet, setFilterRegionSet] = useState<Set<string> | null>(null)
  const [sortBy, setSortBy] = useState<"sucursal" | "empresa" | "region" | "equipos" | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false)
  const DEFAULT_SORT_KEY = "sucursal" as const
  const DEFAULT_SORT_ORDER: SortOrder = "asc"

  const empresaOptions = useMemo(
    () => empresas.map((e) => ({ value: e.id, label: e.nombre })),
    [empresas]
  )
  const regionOptions = useMemo(() => {
    const list = regiones.map((r) => ({ value: r, label: r }))
    if (!regiones.includes("")) list.unshift({ value: "", label: "(Sin región)" })
    return list
  }, [regiones])
  const filteredCenters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return colorCenters
    return colorCenters.filter((center) => {
      return (
        center.nombre_sucursal.toLowerCase().includes(term) ||
        center.codigo_interno.toLowerCase().includes(term) ||
        (center.region?.toLowerCase().includes(term))
      )
    })
  }, [searchTerm, colorCenters])

  // Filtros por columna (tipo Excel)
  const columnFilteredCenters = useMemo(() => {
    return filteredCenters.filter((center) => {
      if (filterEmpresaSet !== null && !filterEmpresaSet.has(center.empresa_id)) return false
      if (filterRegionSet !== null) {
        if (!filterRegionSet.has(center.region ?? "")) return false
      }
      return true
    })
  }, [filteredCenters, filterEmpresaSet, filterRegionSet])

  /** Ciclo: 1º click → Desc, 2º click → Asc, 3º click → Reset */
  const handleSort = (key: string) => {
    setSortBy((prev) => {
      if (prev !== key) {
        setSortOrder("desc")
        return key as "sucursal" | "empresa" | "region" | "equipos"
      }
      if (sortOrder === "desc") {
        setSortOrder("asc")
        return key
      }
      setSortOrder(DEFAULT_SORT_ORDER)
      return null
    })
  }

  const effectiveSortKey = sortBy ?? DEFAULT_SORT_KEY
  const effectiveSortOrder = sortBy === null ? DEFAULT_SORT_ORDER : sortOrder

  const sortedCenters = useMemo(() => {
    const locale = "en"
    const getEmpresaNombre = (id: string) => empresas.find((e) => e.id === id)?.nombre ?? ""
    const getEquiposCount = (c: ColorCenter) =>
      equipos.filter((e) => e.empresa_id === c.empresa_id && e.color_center_id === c.id).length
    const sorted = [...columnFilteredCenters].sort((a, b) => {
      let cmp = 0
      if (effectiveSortKey === "sucursal") {
        cmp = (a.nombre_sucursal ?? "").localeCompare(b.nombre_sucursal ?? "", locale)
      } else if (effectiveSortKey === "empresa") {
        cmp = getEmpresaNombre(a.empresa_id).localeCompare(getEmpresaNombre(b.empresa_id), locale)
      } else if (effectiveSortKey === "region") {
        cmp = (a.region ?? "").localeCompare(b.region ?? "", locale)
      } else if (effectiveSortKey === "equipos") {
        cmp = getEquiposCount(a) - getEquiposCount(b)
      }
      return effectiveSortOrder === "asc" ? cmp : -cmp
    })
    return sorted
  }, [columnFilteredCenters, effectiveSortKey, effectiveSortOrder, empresas, equipos])

  const totalPages = Math.ceil(sortedCenters.length / ITEMS_PER_PAGE)
  const paginatedCenters = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedCenters.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedCenters, currentPage])

  const filteredEquipos = useMemo(() => {
    return equipos.filter((e) =>
      sortedCenters.some(
        (c) => c.empresa_id === e.empresa_id && c.id === e.color_center_id
      )
    )
  }, [sortedCenters, equipos])

  const kpis = useMemo(() => {
    const totalSucursales = columnFilteredCenters.length
    const totalEquipos = filteredEquipos.length
    const equiposOperativos = filteredEquipos.filter((e) => e.estado === "Operativo").length
    const equiposEnMantenimiento = filteredEquipos.filter(
      (e) => e.estado === "Mantenimiento" || e.estado === "Fuera de Servicio"
    ).length
    const porcentajeEquiposOperativos =
      totalEquipos > 0 ? Math.round((equiposOperativos / totalEquipos) * 100) : 0

    const equiposPorTipo = filteredEquipos.reduce(
      (acc, e) => {
        const t = e.tipo_equipo || "Otro"
        acc[t] = (acc[t] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const hoy = new Date()
    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
    const alertasVencimiento = filteredEquipos.filter((e) => {
      if (!e.proxima_revision) return false
      const proximaRevision = new Date(e.proxima_revision)
      return proximaRevision <= treintaDias && proximaRevision >= hoy
    }).length

    return {
      totalSucursales,
      totalEquipos,
      equiposOperativos,
      equiposEnMantenimiento,
      porcentajeEquiposOperativos,
      equiposPorTipo,
      alertasVencimiento,
    }
  }, [sortedCenters, filteredEquipos])

  const getEmpresaNombre = (empresaId: string) =>
    empresas.find((e) => e.id === empresaId)?.nombre || ""

  const getEquiposCount = (center: ColorCenter) =>
    equipos.filter(
      (e) => e.empresa_id === center.empresa_id && e.color_center_id === center.id
    ).length

  const getCenterCompositeId = (center: ColorCenter) =>
    center.empresa_id ? `${center.empresa_id}-${center.id}` : center.id

  return (
    <div className="space-y-6">
      <KPICards kpis={kpis} />

      <div className="flex flex-col sm:block gap-2">
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar sucursal o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 min-h-[44px] w-full"
            />
          </div>
          <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="md:hidden shrink-0 min-h-[44px] px-3 gap-2"
                aria-label="Abrir filtros"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Empresa</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <label className="flex items-center gap-2 py-2 cursor-pointer">
                      <Checkbox
                        checked={filterEmpresaSet === null || (filterEmpresaSet !== null && filterEmpresaSet.size === empresaOptions.length)}
                        onCheckedChange={(c) => setFilterEmpresaSet(c ? null : new Set())}
                      />
                      <span className="text-sm">Todas ({empresaOptions.length})</span>
                    </label>
                    {empresaOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 py-2 cursor-pointer">
                        <Checkbox
                          checked={filterEmpresaSet === null || (filterEmpresaSet?.has(opt.value) ?? false)}
                          onCheckedChange={(c) => {
                            const checked = !!c
                            if (filterEmpresaSet === null) {
                              if (!checked) setFilterEmpresaSet(new Set(empresaOptions.filter((o) => o.value !== opt.value).map((o) => o.value)))
                              return
                            }
                            const next = new Set(filterEmpresaSet)
                            if (checked) next.add(opt.value)
                            else next.delete(opt.value)
                            setFilterEmpresaSet(next.size === 0 ? new Set() : next.size === empresaOptions.length ? null : next)
                          }}
                        />
                        <span className="text-sm truncate">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Región</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <label className="flex items-center gap-2 py-2 cursor-pointer">
                      <Checkbox
                        checked={filterRegionSet === null || (filterRegionSet !== null && filterRegionSet.size === regionOptions.length)}
                        onCheckedChange={(c) => setFilterRegionSet(c ? null : new Set())}
                      />
                      <span className="text-sm">Todas ({regionOptions.length})</span>
                    </label>
                    {regionOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 py-2 cursor-pointer">
                        <Checkbox
                          checked={filterRegionSet === null || (filterRegionSet?.has(opt.value) ?? false)}
                          onCheckedChange={(c) => {
                            const checked = !!c
                            if (filterRegionSet === null) {
                              if (!checked) setFilterRegionSet(new Set(regionOptions.filter((o) => o.value !== opt.value).map((o) => o.value)))
                              return
                            }
                            const next = new Set(filterRegionSet)
                            if (checked) next.add(opt.value)
                            else next.delete(opt.value)
                            setFilterRegionSet(next.size === 0 ? new Set() : next.size === regionOptions.length ? null : next)
                          }}
                        />
                        <span className="text-sm truncate">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full min-h-[44px]"
                  onClick={() => setFiltersSheetOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium text-foreground">{paginatedCenters.length}</span> de{" "}
          <span className="font-medium text-foreground">{sortedCenters.length}</span> sucursales
        </p>
        <div className="hidden md:flex items-center gap-1 border rounded-lg p-1 sm:self-auto self-start">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 min-h-[44px] md:min-h-0 px-2"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 min-h-[44px] md:min-h-0 px-2"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros activos */}
      {(filterEmpresaSet !== null && filterEmpresaSet.size > 0) ||
      (filterRegionSet !== null && filterRegionSet.size > 0) ? (
        <div className="flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 border border-border">
          <span className="text-sm font-medium text-muted-foreground">Filtros activos:</span>
          {filterEmpresaSet !== null && filterEmpresaSet.size > 0 && (
            <span className="text-sm text-foreground">
              Empresa:{" "}
              {empresaOptions
                .filter((o) => filterEmpresaSet.has(o.value))
                .map((o) => o.label)
                .join(", ")}
            </span>
          )}
          {filterEmpresaSet !== null && filterEmpresaSet.size > 0 && filterRegionSet !== null && filterRegionSet.size > 0 && (
            <span className="text-muted-foreground">|</span>
          )}
          {filterRegionSet !== null && filterRegionSet.size > 0 && (
            <span className="text-sm text-foreground">
              Región:{" "}
              {regionOptions
                .filter((o) => filterRegionSet.has(o.value))
                .map((o) => o.label)
                .join(", ")}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto min-h-[44px] md:min-h-8 h-8 text-muted-foreground hover:text-foreground touch-manipulation"
            onClick={() => {
              setFilterEmpresaSet(null)
              setFilterRegionSet(null)
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar todos
          </Button>
        </div>
      ) : null}

      {/* Empty state cuando no hay resultados */}
      {sortedCenters.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 px-6 text-center">
            <p className="text-muted-foreground">
              No hay sucursales que coincidan con la búsqueda o filtros.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Prueba a cambiar los criterios o limpiar los filtros.
            </p>
            {(filterEmpresaSet !== null && filterEmpresaSet.size > 0) ||
            (filterRegionSet !== null && filterRegionSet.size > 0) ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 min-h-[44px] sm:min-h-9"
                onClick={() => {
                  setFilterEmpresaSet(null)
                  setFilterRegionSet(null)
                }}
              >
                Limpiar filtros
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Vista de lista: móvil = cards, desktop = tabla */}
      {viewMode === "list" && sortedCenters.length > 0 && (
        <>
          <div className="md:hidden space-y-2">
            {paginatedCenters.map((center) => {
              const compositeId = getCenterCompositeId(center)
              const equiposCount = getEquiposCount(center)
              const secondaryParts = [center.codigo_interno, getEmpresaNombre(center.empresa_id), center.region].filter(Boolean)
              return (
                <Link key={compositeId} href={`/sucursales/${compositeId}`} title={center.nombre_sucursal}>
                  <Card className="border border-border/60 shadow-sm card-elevated transition-all duration-200 active:bg-muted/30 rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-foreground truncate">{center.nombre_sucursal}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {secondaryParts.join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{equiposCount} equipos</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
          <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <TableSortHeader
                    label="Sucursal"
                    sortKey="sucursal"
                    currentSortKey={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-4"
                  />
                  <TableSortHeader
                    label="Empresa"
                    sortKey="empresa"
                    currentSortKey={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-4"
                    extra={
                      <TableColumnFilter
                        label="Empresa"
                        options={empresaOptions}
                        selected={filterEmpresaSet}
                        onSelectedChange={setFilterEmpresaSet}
                        searchPlaceholder="Buscar empresa..."
                      />
                    }
                  />
                  <TableSortHeader
                    label="Región"
                    sortKey="region"
                    currentSortKey={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-4 hidden lg:table-cell"
                    extra={
                      <TableColumnFilter
                        label="Región"
                        options={regionOptions}
                        selected={filterRegionSet}
                        onSelectedChange={setFilterRegionSet}
                        searchPlaceholder="Buscar región..."
                      />
                    }
                  />
                  <TableSortHeader
                    label="Equipos"
                    sortKey="equipos"
                    currentSortKey={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-4"
                  />
                  <th className="py-3 px-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCenters.map((center) => {
                  const compositeId = getCenterCompositeId(center)
                  return (
                    <tr key={compositeId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{center.nombre_sucursal}</p>
                          <p className="text-xs text-muted-foreground">{center.codigo_interno}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{getEmpresaNombre(center.empresa_id)}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{center.region || "-"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{getEquiposCount(center)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/sucursales/${compositeId}`}>
                          <Button variant="ghost" size="sm" className="h-8">
                            Ver
                            <ChevronRight className="h-4 w-4 ml-1" />
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
      )}

      {/* Vista de grid */}
      {viewMode === "grid" && sortedCenters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedCenters.map((center) => {
            const compositeId = getCenterCompositeId(center)
            return (
              <Card key={compositeId} className="border border-border/60 shadow-sm card-elevated transition-all duration-200 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{center.nombre_sucursal}</p>
                        <p className="text-xs text-muted-foreground">{center.codigo_interno}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{getEmpresaNombre(center.empresa_id)}</span>
                    </div>
                    {center.region && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{center.region}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{getEquiposCount(center)} equipos</span>
                    <Link href={`/sucursales/${compositeId}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Ver detalles
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginacion */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 min-h-[44px] sm:min-h-9"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-9 w-9 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 min-h-[44px] sm:min-h-9"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
