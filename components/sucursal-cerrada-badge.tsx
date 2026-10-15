import { Badge } from "@/components/ui/badge"
import type { ColorCenter } from "@/lib/types"

export function SucursalCerradaBadge({
  colorCenter,
  showFecha = false,
  className,
}: {
  colorCenter: Pick<ColorCenter, "cerrada" | "fecha_cierre"> | null | undefined
  showFecha?: boolean
  className?: string
}) {
  if (!colorCenter?.cerrada) return null
  return (
    <Badge variant="outline" className={`border-amber-300 bg-amber-50 text-amber-800 shrink-0 ${className ?? ""}`}>
      Cerrada{showFecha && colorCenter.fecha_cierre ? ` · ${colorCenter.fecha_cierre}` : ""}
    </Badge>
  )
}
