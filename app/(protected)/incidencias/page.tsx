import { IncidenciasContent } from "@/components/incidencias-content"
import {
  getIncidenciasAllBases,
  getColorCentersAllBases,
  getEquiposAllBases,
} from "@/lib/data"
import { userCanWrite } from "@/lib/auth-roles"

export default async function IncidenciasPage() {
  const [incidencias, colorCenters, equipos] = await Promise.all([
    getIncidenciasAllBases(),
    getColorCentersAllBases(),
    getEquiposAllBases(),
  ])
  const canWrite = await userCanWrite()
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Incidencias</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            Reportes de problemas (fallas, averías). Pueden derivar en mantenimientos correctivos.
          </p>
        </div>

        <IncidenciasContent
          incidencias={incidencias}
          colorCenters={colorCenters}
          equipos={equipos}
          canWrite={canWrite}
        />
      </div>
    </div>
  )
}
