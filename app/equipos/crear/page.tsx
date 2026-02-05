import { EquipoForm } from "@/components/equipo-form"
import { mockColorCenters, mockEmpresas } from "@/lib/mock-data"

export default async function NuevoEquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ color_center_id?: string }>
}) {
  const params = await searchParams

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Registrar Nuevo Equipo</h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-1.5">Completa la informacion del equipo</p>
      </div>

      <EquipoForm empresas={mockEmpresas} colorCenters={mockColorCenters} defaultColorCenterId={params.color_center_id} />
    </div>
  )
}
