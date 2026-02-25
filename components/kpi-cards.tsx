import { Card, CardContent } from "@/components/ui/card"
import { Building2, CheckCircle2, Wrench, AlertTriangle } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  Tintometrico: "Tint.",
  Mezcladora: "Mez.",
  Regulador: "Reg.",
  "Equipo de Computo": "Cómputo",
  Otro: "Otro",
}

interface KPICardsProps {
  kpis: {
    totalSucursales: number
    totalEquipos: number
    equiposOperativos: number
    equiposEnMantenimiento: number
    porcentajeEquiposOperativos: number
    equiposPorTipo: Record<string, number>
    alertasVencimiento: number
  }
}

export function KPICards({ kpis }: KPICardsProps) {
  const tiposLine = Object.entries(kpis.equiposPorTipo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tipo, n]) => `${TIPO_LABELS[tipo] ?? tipo}: ${n}`)
    .join(" · ")

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Sucursales</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">{kpis.totalSucursales}</p>
            </div>
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Equipos operativos</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                {kpis.porcentajeEquiposOperativos}%
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {kpis.equiposOperativos} de {kpis.totalEquipos} equipos
              </p>
              {tiposLine && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={tiposLine}>
                  {tiposLine}
                </p>
              )}
            </div>
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Mantenimiento</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">{kpis.equiposEnMantenimiento}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">
                equipos afectados
              </p>
            </div>
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Alertas</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">{kpis.alertasVencimiento}</p>
              <p className="text-xs text-rose-600 font-medium mt-1">Próximos 30 días</p>
            </div>
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
