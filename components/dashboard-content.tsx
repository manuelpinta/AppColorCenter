"use client"

import { useState, useMemo } from "react"
import { KPICards } from "@/components/kpi-cards"
import { DashboardFilters } from "@/components/dashboard-filters"
import { mockColorCenters, mockEquipos, mockEmpresas, getRegionesDisponibles } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, ChevronRight, ChevronLeft, LayoutGrid, List } from "lucide-react"
import Link from "next/link"

const ITEMS_PER_PAGE = 20

export function DashboardContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [empresaFilter, setEmpresaFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const regiones = getRegionesDisponibles()

  // Filtrar sucursales
  const filteredCenters = useMemo(() => {
    setCurrentPage(1) // Reset page when filters change
    return mockColorCenters.filter((center) => {
      const matchesSearch =
        center.nombre_sucursal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.region?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesEmpresa = empresaFilter === "all" || center.empresa_id === empresaFilter
      const matchesRegion = regionFilter === "all" || center.region === regionFilter
      const matchesEstado = estadoFilter === "all" || center.estado === estadoFilter

      return matchesSearch && matchesEmpresa && matchesRegion && matchesEstado
    })
  }, [searchTerm, empresaFilter, regionFilter, estadoFilter])

  // Paginacion
  const totalPages = Math.ceil(filteredCenters.length / ITEMS_PER_PAGE)
  const paginatedCenters = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredCenters.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredCenters, currentPage])

  // Filtrar equipos de las sucursales filtradas
  const filteredEquipos = useMemo(() => {
    const filteredCenterIds = new Set(filteredCenters.map((c) => c.id))
    return mockEquipos.filter((e) => filteredCenterIds.has(e.color_center_id))
  }, [filteredCenters])

  // Calcular KPIs
  const kpis = useMemo(() => {
    const totalCenters = filteredCenters.length
    const operativos = filteredCenters.filter((cc) => cc.estado === "Operativo").length
    const enMantenimiento = filteredCenters.filter((cc) => cc.estado === "Mantenimiento").length
    const porcentajeOperativos = totalCenters > 0 ? Math.round((operativos / totalCenters) * 100) : 0

    const totalEquipos = filteredEquipos.length
    const equiposOperativos = filteredEquipos.filter((e) => e.estado === "Operativo").length
    const equiposEnMantenimiento = filteredEquipos.filter(
      (e) => e.estado === "Mantenimiento" || e.estado === "Fuera de Servicio"
    ).length

    const hoy = new Date()
    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
    const alertasVencimiento = filteredEquipos.filter((e) => {
      if (!e.proxima_revision) return false
      const proximaRevision = new Date(e.proxima_revision)
      return proximaRevision <= treintaDias && proximaRevision >= hoy
    }).length

    return {
      totalCenters,
      operativos,
      porcentajeOperativos,
      enMantenimiento,
      totalEquipos,
      equiposOperativos,
      equiposEnMantenimiento,
      alertasVencimiento,
    }
  }, [filteredCenters, filteredEquipos])

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Operativo":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "Mantenimiento":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "Inactivo":
        return "bg-slate-100 text-slate-600 border-slate-200"
      default:
        return "bg-slate-100 text-slate-600 border-slate-200"
    }
  }

  const getEmpresaNombre = (empresaId: string) => {
    return mockEmpresas.find((e) => e.id === empresaId)?.nombre || ""
  }

  return (
    <div className="space-y-6">
      <KPICards kpis={kpis} />

      <DashboardFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        empresaFilter={empresaFilter}
        onEmpresaChange={setEmpresaFilter}
        regionFilter={regionFilter}
        onRegionChange={setRegionFilter}
        estadoFilter={estadoFilter}
        onEstadoChange={setEstadoFilter}
        regiones={regiones}
      />

      {/* Header con conteo y toggle de vista */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium text-foreground">{paginatedCenters.length}</span> de{" "}
          <span className="font-medium text-foreground">{filteredCenters.length}</span> sucursales
        </p>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Vista de lista */}
      {viewMode === "list" && (
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Sucursal</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Empresa</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Region</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Equipos</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedCenters.map((center) => {
                const equiposCount = mockEquipos.filter((e) => e.color_center_id === center.id).length
                return (
                  <tr key={center.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm">{center.nombre_sucursal}</p>
                        <p className="text-xs text-muted-foreground">{center.codigo_interno}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-sm">{getEmpresaNombre(center.empresa_id)}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{center.region || "-"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`${getEstadoBadgeColor(center.estado)} text-xs`}>
                        {center.estado}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-sm">{equiposCount}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/sucursales/${center.id}`}>
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
      )}

      {/* Vista de grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedCenters.map((center) => {
            const equiposCount = mockEquipos.filter((e) => e.color_center_id === center.id).length
            return (
              <Card key={center.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
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
                    <Badge variant="outline" className={`${getEstadoBadgeColor(center.estado)} text-xs shrink-0`}>
                      {center.estado}
                    </Badge>
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
                    <span className="text-xs text-muted-foreground">{equiposCount} equipos</span>
                    <Link href={`/sucursales/${center.id}`}>
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
              className="h-9"
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
              className="h-9"
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
