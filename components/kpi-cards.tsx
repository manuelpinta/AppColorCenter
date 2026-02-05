import { Card, CardContent } from "@/components/ui/card"
import { Building2, CheckCircle2, Wrench, AlertTriangle } from "lucide-react"

interface KPICardsProps {
  kpis: {
    totalCenters: number
    operativos: number
    porcentajeOperativos: number
    enMantenimiento: number
    totalEquipos: number
    equiposOperativos: number
    equiposEnMantenimiento: number
    alertasVencimiento: number
  }
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Color Centers</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">{kpis.totalCenters}</p>
              <p className="text-xs text-primary font-medium mt-1">
                {kpis.operativos} operativos
              </p>
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
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Operativos</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                {kpis.porcentajeOperativos}%
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {kpis.equiposOperativos} de {kpis.totalEquipos} equipos
              </p>
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
              <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">{kpis.enMantenimiento}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">
                {kpis.equiposEnMantenimiento} equipos afectados
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
              <p className="text-xs text-rose-600 font-medium mt-1">Proximos 30 dias</p>
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
