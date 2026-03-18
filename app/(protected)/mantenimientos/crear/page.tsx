import { MantenimientoForm } from "@/components/mantenimiento-form"
import { getEquiposAllBases, getColorCentersAllBases } from "@/lib/data"
import { requireWrite } from "@/lib/auth-roles"

export default async function NuevoMantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ equipo_id?: string; color_center_id?: string }>
}) {
  await requireWrite("/mantenimientos")
  const params = await searchParams
  const [equipos, colorCenters] = await Promise.all([
    getEquiposAllBases(),
    getColorCentersAllBases(),
  ])
  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Registrar Mantenimiento</h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-1.5">
          {params.equipo_id
            ? "Completa los datos del mantenimiento para este equipo."
            : params.color_center_id
              ? "Elige el equipo y completa la información del mantenimiento."
              : "Completa la información del mantenimiento."}
        </p>
      </div>

      <MantenimientoForm
        equipos={equipos}
        colorCenters={colorCenters}
        defaultEquipoId={params.equipo_id}
        defaultColorCenterId={params.color_center_id}
      />
    </div>
  )
}
