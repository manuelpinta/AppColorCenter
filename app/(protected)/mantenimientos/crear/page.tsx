import { MantenimientoForm } from "@/components/mantenimiento-form"
import { getEquiposAndColorCentersForMantenimientoCrear } from "@/lib/data"
import { requireWrite } from "@/lib/auth-roles"

export default async function NuevoMantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ equipo_id?: string; color_center_id?: string }>
}) {
  await requireWrite("/mantenimientos")
  const params = await searchParams
  const { equipos, colorCenters } = await getEquiposAndColorCentersForMantenimientoCrear({
    equipo_id: params.equipo_id,
    color_center_id: params.color_center_id,
  })
  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Registrar Mantenimiento</h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-1.5">
          {params.equipo_id
            ? "Completa los datos del mantenimiento para este equipo. Las fotos de evidencia se suben después, desde el detalle del mantenimiento."
            : params.color_center_id
              ? "Elige el equipo y completa la información del mantenimiento. Las fotos de evidencia se suben desde el detalle del registro."
              : "Completa la información del mantenimiento. Las fotos de evidencia se suben desde el detalle del registro."}
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
