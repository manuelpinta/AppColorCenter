"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react"
import type { ColorCenter } from "@/lib/types"
import type { EquipoWithEmpresa, MantenimientoWithEmpresa } from "@/lib/types"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

interface ReportesContentProps {
  colorCenters: ColorCenter[]
  equipos: EquipoWithEmpresa[]
  mantenimientos: MantenimientoWithEmpresa[]
  regiones: string[]
}

export function ReportesContent({
  colorCenters,
  equipos,
  mantenimientos,
  regiones,
}: ReportesContentProps) {
  const [periodo, setPeriodo] = useState("mes")
  const [region, setRegion] = useState("todas")
  const [tipoEquipo, setTipoEquipo] = useState("todos")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    const centersFiltered =
      region === "todas"
        ? colorCenters
        : colorCenters.filter((c) => (c.region ?? "") === region)
    const centerIds = new Set(centersFiltered.map((c) => (c.empresa_id ? `${c.empresa_id}-${c.id}` : c.id)))
    const equiposFiltered = equipos.filter((eq) => {
      if (!centerIds.has(`${eq.empresa_id}-${eq.color_center_id}`)) return false
      if (tipoEquipo !== "todos" && (eq.tipo_equipo || "") !== tipoEquipo) return false
      return true
    })
    const equipoIds = new Set(equiposFiltered.map((e) => e.id))
    const mantenimientosFiltered = mantenimientos.filter((m) =>
      equipoIds.has(`${m.empresa_id}-${m.equipo_id}`)
    )
    calculateStats(centersFiltered, equiposFiltered, mantenimientosFiltered)
  }, [periodo, region, tipoEquipo, colorCenters, equipos, mantenimientos])

  function calculateStats(
    centers: ColorCenter[],
    equiposFilt: EquipoWithEmpresa[],
    mantenimientosFilt: MantenimientoWithEmpresa[]
  ) {
    const totalSucursales = centers.length
    const totalEquipos = equiposFilt.length
    const totalMantenimientos = mantenimientosFilt.length

    const sucursalesOperativas = centers.filter((c) => c.estado === "Operativo").length
    const porcentajeOperativo =
      totalSucursales > 0 ? Math.round((sucursalesOperativas / totalSucursales) * 100) : 0

    const conTiempo = mantenimientosFilt.filter((m) => m.tiempo_fuera_servicio != null && m.tiempo_fuera_servicio > 0)
    const tiempoPromedioFueraServicio =
      conTiempo.length > 0
        ? conTiempo.reduce((s, m) => s + (m.tiempo_fuera_servicio ?? 0), 0) / conTiempo.length
        : null
    const costoTotal = mantenimientosFilt.reduce((sum, m) => sum + (m.costo || 0), 0)

    const equiposPorTipo = equiposFilt.reduce((acc: Record<string, number>, eq) => {
      const tipo = eq.tipo_equipo || "Otro"
      acc[tipo] = (acc[tipo] || 0) + 1
      return acc
    }, {})

    const equiposPorTipoData = Object.entries(equiposPorTipo).map(([name, value]) => ({ name, value }))

    const byMonth: Record<
      number,
      { preventivo: number; correctivo: number; costo: number }
    > = {}
    for (let i = 0; i < 12; i++) byMonth[i] = { preventivo: 0, correctivo: 0, costo: 0 }
    for (const m of mantenimientosFilt) {
      const fecha = m.fecha_mantenimiento ? new Date(m.fecha_mantenimiento) : null
      if (!fecha || isNaN(fecha.getTime())) continue
      const month = fecha.getMonth()
      if (m.tipo === "Preventivo") byMonth[month].preventivo += 1
      else byMonth[month].correctivo += 1
      byMonth[month].costo += m.costo || 0
    }
    const mantenimientosPorMes = MESES.map((mes, i) => ({
      mes,
      preventivo: byMonth[i].preventivo,
      correctivo: byMonth[i].correctivo,
    }))
    const costosPorMes = MESES.map((mes, i) => ({ mes, costo: byMonth[i].costo }))

    const equiposPorEstado = equiposFilt.reduce((acc: Record<string, number>, eq) => {
      const e = eq.estado || "Otro"
      acc[e] = (acc[e] || 0) + 1
      return acc
    }, {})
    const equiposPorEstadoData = Object.entries(equiposPorEstado).map(([name, value]) => ({
      name: name === "Operativo" ? "Operativo" : name === "Mantenimiento" ? "Mantenimiento" : name === "Fuera de Servicio" ? "Fuera de Servicio" : name,
      value,
    }))

    const countByEquipo: Record<string, number> = {}
    for (const m of mantenimientosFilt) {
      const key = `${m.empresa_id}-${m.equipo_id}`
      countByEquipo[key] = (countByEquipo[key] || 0) + 1
    }
    const equiposProblematicos = Object.entries(countByEquipo)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => {
        const eq = equiposFilt.find((e) => e.id === key)
        const label = eq
          ? [eq.tipo_equipo, eq.marca, eq.modelo].filter(Boolean).join(" ") || eq.id
          : key
        return { equipo: label, mantenimientos: count }
      })

    const pendientes = mantenimientosFilt.filter(
      (m) => m.estado === "Pendiente" || m.estado === "En Proceso"
    ).length

    setStats({
      totalSucursales,
      sucursalesOperativas,
      totalEquipos,
      totalMantenimientos,
      porcentajeOperativo,
      tiempoPromedioFueraServicio,
      costoTotal,
      equiposPorTipoData,
      mantenimientosPorMes,
      costosPorMes,
      equiposPorEstadoData,
      equiposProblematicos,
      pendientes,
    })
    setLoading(false)
  }

  function exportarExcel() {
    if (!stats) return
    const csvContent = [
      ["Reporte de Sucursales y Equipos"],
      [""],
      ["Métrica", "Valor"],
      ["Total Sucursales", stats.totalSucursales],
      ["% Operativo (sucursales)", `${stats.porcentajeOperativo}%`],
      ["Total Equipos", stats.totalEquipos],
      ["Total Mantenimientos", stats.totalMantenimientos],
      ["Tiempo prom. fuera de servicio (h)", stats.tiempoPromedioFueraServicio != null ? `${stats.tiempoPromedioFueraServicio.toFixed(1)} h` : "—"],
      ["Costo Total", `$${stats.costoTotal.toLocaleString()}`],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte-sucursales-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading || !stats) {
    return <div className="p-4 lg:p-6">Cargando reportes...</div>
  }

  return (
    <div className="px-4 py-6 pb-24 lg:pb-6 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reportes y Métricas</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">Análisis y estadísticas del sistema</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mes</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="año">Último año</SelectItem>
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las regiones</SelectItem>
              {regiones.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
              {colorCenters.some((c) => !c.region) && (
                <SelectItem value="">Sin región</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select value={tipoEquipo} onValueChange={setTipoEquipo}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Tipo de equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {Array.from(new Set(equipos.map((e) => e.tipo_equipo).filter(Boolean))).sort().map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={exportarExcel} className="w-full sm:w-auto sm:ml-auto bg-transparent" variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">Total Sucursales</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.totalSucursales}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <div className="flex items-center text-xs lg:text-sm text-primary">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              <span>{stats.sucursalesOperativas} operativas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">% Operativo (sucursales)</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.porcentajeOperativo}%</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <div className="flex items-center text-xs lg:text-sm text-success">
              <CheckCircle2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              <span>{stats.totalSucursales > 0 ? "Sucursales en operación" : "Sin datos"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">Total Equipos</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.totalEquipos}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <p className="text-xs lg:text-sm text-muted-foreground">Según filtros aplicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">Mantenimientos</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.totalMantenimientos}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <div className="flex items-center text-xs lg:text-sm text-warning">
              <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              <span>{stats.pendientes} pendientes / en proceso</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">Tiempo prom. fuera de servicio</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">
              {stats.tiempoPromedioFueraServicio != null ? `${stats.tiempoPromedioFueraServicio.toFixed(1)} h` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <p className="text-xs lg:text-sm text-muted-foreground">Horas (mantenimientos con dato)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">Costo Total</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">${(stats.costoTotal / 1000).toFixed(0)}k</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <p className="text-xs lg:text-sm text-muted-foreground">Mantenimientos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Mantenimientos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Mantenimientos por Mes</CardTitle>
            <CardDescription className="text-xs lg:text-sm">Preventivos vs Correctivos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.mantenimientosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="preventivo" fill="#2563eb" name="Preventivo" radius={[4, 4, 0, 0]} />
                <Bar dataKey="correctivo" fill="#f59e0b" name="Correctivo" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Equipos por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Equipos por Tipo</CardTitle>
            <CardDescription className="text-xs lg:text-sm">Distribución de equipos</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.equiposPorTipoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.equiposPorTipoData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Costos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Costos de Mantenimiento</CardTitle>
            <CardDescription className="text-xs lg:text-sm">Evolución mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.costosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="costo"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Costo"
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Equipos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Estado de Equipos</CardTitle>
            <CardDescription className="text-xs lg:text-sm">Distribución actual</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.equiposPorEstadoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.equiposPorEstadoData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">Equipos Más Problemáticos</CardTitle>
          <CardDescription className="text-xs lg:text-sm">Top 5 con más mantenimientos correctivos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.equiposProblematicos.map((equipo: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? "bg-danger/10 text-danger"
                        : index === 1
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{equipo.equipo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{equipo.mantenimientos} mantenimientos</span>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
