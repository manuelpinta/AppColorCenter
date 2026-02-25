import { IncidenciaForm } from "@/components/incidencia-form"
import { getColorCentersAllBases, getEquiposAllBases } from "@/lib/data"

export default async function CrearIncidenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal_id?: string; equipo_id?: string }>
}) {
  const params = await searchParams
  const [colorCenters, equipos] = await Promise.all([
    getColorCentersAllBases(),
    getEquiposAllBases(),
  ])
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 pb-24 lg:pb-8 lg:px-8 lg:py-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Reportar incidencia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registra un problema (falla, avería o riesgo). Después podrás vincular mantenimientos correctivos si aplica.
          </p>
        </div>
        <IncidenciaForm
          colorCenters={colorCenters}
          equipos={equipos}
          defaultSucursalId={params.sucursal_id}
          defaultEquipoId={params.equipo_id}
        />
      </div>
    </div>
  )
}
