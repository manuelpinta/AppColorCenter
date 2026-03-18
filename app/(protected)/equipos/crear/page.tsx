import { requireWrite } from "@/lib/auth-roles"
import { EquipoForm } from "@/components/equipo-form"
import { getColorCentersAllBases, getEmpresas } from "@/lib/data"

export default async function NuevoEquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ color_center_id?: string }>
}) {
  await requireWrite("/equipos")
  const params = await searchParams
  const [empresas, colorCenters] = await Promise.all([
    getEmpresas(),
    getColorCentersAllBases(),
  ])
  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Registrar Nuevo Equipo</h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-1.5">Completa la informacion del equipo</p>
      </div>

      <EquipoForm empresas={empresas} colorCenters={colorCenters} defaultColorCenterId={params.color_center_id} />
    </div>
  )
}
