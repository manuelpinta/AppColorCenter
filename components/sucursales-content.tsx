"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Building2, ChevronRight, ChevronLeft, Search, X, Filter } from "lucide-react"
import Link from "next/link"
import type { ColorCenter, Empresa } from "@/lib/types"
import type { EquipoWithEmpresa } from "@/lib/types"
import { buildSucursalCompositeId } from "@/lib/data/ids"
import { TableSortHeader, type SortOrder } from "@/components/table-sort-header"

const ITEMS_PER_PAGE = 25

interface SucursalesContentProps {
  colorCenters: ColorCenter[]
  equipos: EquipoWithEmpresa[]
  empresas: Empresa[]
  regiones: string[]
}

export function SucursalesContent({
  colorCenters,
  equipos,
  empresas,
  regiones,
}: SucursalesContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [empresaFilter, setEmpresaFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [filterEmpresaSet, setFilterEmpresaSet] = useState<Set<string> | null>(null)
  const [filterRegionSet, setFilterRegionSet] = useState<Set<string> | null>(null)
  const [sortBy, setSortBy] = useState<"sucursal" | "empresa" | "region" | "equipos" | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false)
  const DEFAULT_SORT_KEY = "sucursal" as const
  const DEFAULT_SORT_ORDER: SortOrder = "asc"
  // Volver a página 1 cuando cambian búsqueda o filtros (evita "Mostrando 0 de N")
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, empresaFilter, filterEmpresaSet, filterRegionSet])

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
    return colorCenters.filter((center) => {
      const matchesSearch =
        !term ||
        (center.nombre_sucursal?.toLowerCase().includes(term)) ||
        (center.codigo_interno?.toLowerCase().includes(term)) ||
        (center.region?.toLowerCase().includes(term))
      const matchesEmpresa = empresaFilter === "all" || center.empresa_id === empresaFilter
      return matchesSearch && matchesEmpresa
    })
  }, [searchTerm, empresaFilter, colorCenters])

  const columnFilteredCenters = useMemo(() => {
    return filteredCenters.filter((center) => {
      if (filterEmpresaSet !== null && !filterEmpresaSet.has(center.empresa_id)) return false
      if (filterRegionSet !== null) {
        const r = center.region ?? ""
        if (!filterRegionSet.has(r)) return false
      }
      return true
    })
  }, [filteredCenters, filterEmpresaSet, filterRegionSet])

  const getEmpresaNombreForSort = (id: string) => empresas.find((e) => e.id === id)?.nombre ?? ""
  const getEquiposCountForSort = (c: ColorCenter) =>
    equipos.filter((e) => e.empresa_id === c.empresa_id && e.color_center_id === c.id).length

  /** Ciclo: 1º click → Desc, 2º click → Asc, 3º click → Reset (orden por defecto) */
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
    const sorted = [...columnFilteredCenters].sort((a, b) => {
      let cmp = 0
      if (effectiveSortKey === "sucursal") cmp = (a.nombre_sucursal ?? "").localeCompare(b.nombre_sucursal ?? "")
      else if (effectiveSortKey === "empresa") cmp = getEmpresaNombreForSort(a.empresa_id).localeCompare(getEmpresaNombreForSort(b.empresa_id))
      else if (effectiveSortKey === "region") cmp = (a.region ?? "").localeCompare(b.region ?? "")
      else if (effectiveSortKey === "equipos") cmp = getEquiposCountForSort(a) - getEquiposCountForSort(b)
      return effectiveSortOrder === "asc" ? cmp : -cmp
    })
    return sorted
  }, [columnFilteredCenters, effectiveSortKey, effectiveSortOrder, empresas, equipos])

  const totalPages = Math.ceil(sortedCenters.length / ITEMS_PER_PAGE)
  const paginatedCenters = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedCenters.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedCenters, currentPage])

  const getEmpresaNombre = (empresaId: string) =>
    empresas.find((e) => e.id === empresaId)?.nombre || ""

  const empresaStats = useMemo(
    () =>
      empresas.map((empresa) => {
        const sucursales = colorCenters.filter((c) => c.empresa_id === empresa.id)
        const operativas = sucursales.filter((s) => s.estado === "Operativo").length
        return { ...empresa, total: sucursales.length, operativas }
      }),
    [empresas, colorCenters]
  )

  const getEquiposCount = (center: ColorCenter) =>
    equipos.filter(
      (e) => e.empresa_id === center.empresa_id && e.color_center_id === center.id
    ).length

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl lg:text-3xl font-bold text-foreground tracking-tight">
            Sucursales
          </h1>
          <p className="text-xs lg:text-base text-muted-foreground mt-1">
            {colorCenters.length} sucursales en {empresas.length} empresas
          </p>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 snap-x snap-mandatory mb-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible">
          {empresaStats.map((empresa) => (
            <Card
              key={empresa.id}
              className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md shrink-0 w-[140px] snap-start md:w-auto md:shrink ${empresaFilter === empresa.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setEmpresaFilter(empresaFilter === empresa.id ? "all" : empresa.id)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <p className="font-medium text-xs sm:text-sm truncate">{empresa.nombre}</p>
                </div>
                <p className="text-lg sm:text-2xl font-bold">{empresa.total}</p>
                <p className="text-xs text-muted-foreground">
                  {empresa.operativas === empresa.total
                    ? "Todas operativas"
                    : `${empresa.operativas} operativas`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 max-w-md mb-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar sucursal o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 min-h-[44px] w-full"
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
                <Button className="w-full min-h-[44px]" onClick={() => setFiltersSheetOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center justify-between my-4">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{paginatedCenters.length}</span> de{" "}
            <span className="font-medium text-foreground">{sortedCenters.length}</span> sucursales
          </p>
        </div>

        {/* Filtros activos: resumen y Limpiar todos */}
        {(filterEmpresaSet !== null && filterEmpresaSet.size > 0) ||
        (filterRegionSet !== null && filterRegionSet.size > 0) ? (
          <div className="flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 border border-border mb-4">
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

        {/* Empty state */}
        {sortedCenters.length === 0 && (
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="py-10 px-6 text-center">
              <p className="text-muted-foreground">No hay sucursales que coincidan con la búsqueda o filtros.</p>
              <p className="text-sm text-muted-foreground mt-1">Prueba a cambiar los criterios o limpiar los filtros.</p>
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

        {/* Móvil: lista en cards (sin scroll horizontal) */}
        <div className="md:hidden space-y-2">
          {paginatedCenters.map((center) => {
            const compositeId =
              center.empresa_id && center.id
                ? buildSucursalCompositeId(center.empresa_id as any, center)
                : center.id
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

        {/* Desktop: tabla */}
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
                const compositeId =
                  center.empresa_id && center.id
                    ? buildSucursalCompositeId(center.empresa_id as any, center)
                    : center.id
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
                  if (totalPages <= 5) pageNum = i + 1
                  else if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i
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
    </div>
  )
}
