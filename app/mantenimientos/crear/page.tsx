import { MantenimientoForm } from "@/components/mantenimiento-form"
import { mockEquipos, mockColorCenters } from "@/lib/mock-data"

export default async function NuevoMantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ equipo_id?: string; color_center_id?: string }>
}) {
  const params = await searchParams

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
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
        equipos={mockEquipos}
        colorCenters={mockColorCenters}
        defaultEquipoId={params.equipo_id}
        defaultColorCenterId={params.color_center_id}
      />
    </div>
  )
}
