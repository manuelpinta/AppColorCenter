"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react"
import { mockColorCenters, mockEquipos, mockMantenimientos } from "@/lib/mock-data"
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

export function ReportesContent() {
  const [periodo, setPeriodo] = useState("mes")
  const [region, setRegion] = useState("todas")
  const [tipoEquipo, setTipoEquipo] = useState("todos")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadReportData()
  }, [periodo, region, tipoEquipo])

  async function loadReportData() {
    setLoading(true)
    calculateStats(mockColorCenters, mockEquipos, mockMantenimientos)
  }

  function calculateStats(centers: any[], equipos: any[], mantenimientos: any[]) {
    const totalCenters = centers?.length || 0
    const totalEquipos = equipos?.length || 0
    const totalMantenimientos = mantenimientos?.length || 0

    const operativos = centers?.filter((c) => c.estado === "Operativo").length || 0
    const porcentajeOperativo = totalCenters > 0 ? Math.round((operativos / totalCenters) * 100) : 0

    const tiempoPromedioRespuesta = 4.5
    const costoTotal = mantenimientos?.reduce((sum, m) => sum + (m.costo || 0), 0) || 0

    const equiposPorTipo = equipos?.reduce((acc: any, eq: any) => {
      const tipo = eq.tipo_equipo || eq.tipo || "Otro"
      acc[tipo] = (acc[tipo] || 0) + 1
      return acc
    }, {})

    const equiposPorTipoData = Object.entries(equiposPorTipo || {}).map(([name, value]) => ({
      name,
      value,
    }))

    const mantenimientosPorMes = [
      { mes: "May", preventivo: 12, correctivo: 5 },
      { mes: "Jun", preventivo: 15, correctivo: 8 },
      { mes: "Jul", preventivo: 18, correctivo: 6 },
      { mes: "Ago", preventivo: 14, correctivo: 9 },
      { mes: "Sep", preventivo: 20, correctivo: 7 },
      { mes: "Oct", preventivo: 16, correctivo: 4 },
    ]

    const costosPorMes = [
      { mes: "May", costo: 45000 },
      { mes: "Jun", costo: 52000 },
      { mes: "Jul", costo: 48000 },
      { mes: "Ago", costo: 61000 },
      { mes: "Sep", costo: 55000 },
      { mes: "Oct", costo: 43000 },
    ]

    const equiposPorEstado = equipos?.reduce((acc: any, eq: any) => {
      acc[eq.estado] = (acc[eq.estado] || 0) + 1
      return acc
    }, {})

    const equiposPorEstadoData = Object.entries(equiposPorEstado || {}).map(([name, value]) => ({
      name: name === "Operativo" ? "Operativo" : name === "Mantenimiento" ? "Mantenimiento" : "Fuera de Servicio",
      value,
    }))

    const equiposProblematicos = [
      { equipo: "Dispensador CM-5000X", mantenimientos: 8 },
      { equipo: "Agitador SM-250", mantenimientos: 6 },
      { equipo: "Espectrofotómetro CS-200", mantenimientos: 5 },
      { equipo: "Dispensador AC-2500", mantenimientos: 4 },
      { equipo: "Agitador SM-300", mantenimientos: 3 },
    ]

    setStats({
      totalCenters,
      totalEquipos,
      totalMantenimientos,
      porcentajeOperativo,
      tiempoPromedioRespuesta,
      costoTotal,
      equiposPorTipoData,
      mantenimientosPorMes,
      costosPorMes,
      equiposPorEstadoData,
      equiposProblematicos,
    })
    setLoading(false)
  }

  async function exportarExcel() {
    const csvContent = [
      ["Reporte de Color Centers"],
      [""],
      ["Métrica", "Valor"],
      ["Total Color Centers", stats.totalCenters],
      ["% Operativo", `${stats.porcentajeOperativo}%`],
      ["Total Equipos", stats.totalEquipos],
      ["Total Mantenimientos", stats.totalMantenimientos],
      ["Tiempo Promedio Respuesta", `${stats.tiempoPromedioRespuesta} horas`],
      ["Costo Total", `$${stats.costoTotal.toLocaleString()}`],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte-color-centers-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
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
              <SelectItem value="norte">Norte</SelectItem>
              <SelectItem value="sur">Sur</SelectItem>
              <SelectItem value="centro">Centro</SelectItem>
              <SelectItem value="occidente">Occidente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoEquipo} onValueChange={setTipoEquipo}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Tipo de equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los equipos</SelectItem>
              <SelectItem value="tintometro">Tintómetro</SelectItem>
              <SelectItem value="agitador">Agitador</SelectItem>
              <SelectItem value="dispensador">Dispensador</SelectItem>
              <SelectItem value="balanza">Balanza</SelectItem>
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
            <CardDescription className="text-xs lg:text-sm">Total Color Centers</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.totalCenters}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <div className="flex items-center text-xs lg:text-sm text-success">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              <span>+2 este mes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">% Operativo</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.porcentajeOperativo}%</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <div className="flex items-center text-xs lg:text-sm text-success">
              <CheckCircle2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              <span>Excelente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">Total Equipos</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.totalEquipos}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <div className="flex items-center text-xs lg:text-sm text-muted-foreground">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              <span>+5 este mes</span>
            </div>
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
              <span>3 pendientes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-3">
            <CardDescription className="text-xs lg:text-sm">Tiempo Promedio</CardDescription>
            <CardTitle className="text-xl lg:text-3xl">{stats.tiempoPromedioRespuesta}h</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 lg:pb-4">
            <p className="text-xs lg:text-sm text-muted-foreground">Respuesta a fallas</p>
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
