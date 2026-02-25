import { Suspense } from "react"
import { DashboardContent } from "@/components/dashboard-content"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import {
  getColorCentersAllBases,
  getEquiposAllBases,
  getEquiposByEmpresa,
  getEmpresas,
  getEmpresaById,
  getRegionesFromColorCenters,
  getSucursalesByEmpresa,
} from "@/lib/data"
import type { EmpresaId } from "@/lib/empresas-config"

/** Siempre dinámico para que searchParams (?e=, ?empresa=) se usen y solo se consulte esa base. */
export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string; e?: string }>
}) {
  const params = await searchParams
  const rawEmpresa = params.empresa ?? params.e
  const singleEmpresaId: EmpresaId | null =
    rawEmpresa && getEmpresaById(rawEmpresa) ? (rawEmpresa as EmpresaId) : null

  const empresas = getEmpresas()

  const [colorCenters, equipos] = singleEmpresaId
    ? await Promise.all([
        getSucursalesByEmpresa(singleEmpresaId),
        getEquiposByEmpresa(singleEmpresaId),
      ])
    : await Promise.all([getColorCentersAllBases(), getEquiposAllBases()])

  const regiones = getRegionesFromColorCenters(colorCenters)
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1.5">Vista general de sucursales y equipos</p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent
            colorCenters={colorCenters}
            equipos={equipos}
            empresas={empresas}
            regiones={regiones}
            initialEmpresaId={singleEmpresaId ?? undefined}
          />
        </Suspense>
      </div>
    </div>
  )
}
