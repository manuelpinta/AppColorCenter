import { Suspense } from "react"
import { ReportesContent } from "@/components/reportes-content"
import { ReportesSkeleton } from "@/components/reportes-skeleton"
import {
  getColorCentersAllBases,
  getEquiposAllBases,
  getMantenimientosAllBases,
  getRegionesFromColorCenters,
} from "@/lib/data"

export default async function ReportesPage() {
  const [colorCenters, equipos, mantenimientos] = await Promise.all([
    getColorCentersAllBases().catch((err) => {
      console.error("[reportes] colorCenters:", err instanceof Error ? err.message : err)
      return []
    }),
    getEquiposAllBases().catch((err) => {
      console.error("[reportes] equipos:", err instanceof Error ? err.message : err)
      return []
    }),
    getMantenimientosAllBases().catch((err) => {
      console.error("[reportes] mantenimientos:", err instanceof Error ? err.message : err)
      return []
    }),
  ])
  const regiones = getRegionesFromColorCenters(colorCenters)
  return (
    <div className="pb-20 lg:pb-0">
      <Suspense fallback={<ReportesSkeleton />}>
        <ReportesContent
          colorCenters={colorCenters}
          equipos={equipos}
          mantenimientos={mantenimientos}
          regiones={regiones}
        />
      </Suspense>
    </div>
  )
}
