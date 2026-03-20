import { notFound } from "next/navigation"
import Link from "next/link"
import { requireWrite } from "@/lib/auth-roles"
import { EquipoForm } from "@/components/equipo-form"
import {
  findEquipoInAllBases,
  getSucursalesByEmpresa,
  getComputadoraByEquipoId,
  parseEquipoId,
} from "@/lib/data"
import { ArrowLeft } from "lucide-react"
import { getEmpresasForCurrentUser } from "@/lib/data/empresas-auth"

export default async function EditarEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireWrite("/equipos")
  const { id } = await params

  const found = await findEquipoInAllBases(id)
  if (!found) notFound()
  const { equipo, pool, empresaId } = found

  const { numericId } = parseEquipoId(id)
  const [empresas, colorCenters, computadoraInicial] = await Promise.all([
    getEmpresasForCurrentUser(),
    getSucursalesByEmpresa(empresaId),
    equipo.tipo_equipo === "Equipo de Computo"
      ? getComputadoraByEquipoId(pool, numericId)
      : Promise.resolve(null),
  ])

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 pb-24 lg:pb-8 lg:px-8 lg:py-8 max-w-4xl mx-auto">
        <Link
          href={`/equipos/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al Equipo
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Editar Equipo</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1.5">
            {equipo.tipo_equipo} - {equipo.marca} {equipo.modelo}
          </p>
        </div>

        <EquipoForm
          empresas={empresas}
          colorCenters={colorCenters}
          equipo={equipo}
          computadoraInicial={computadoraInicial}
          empresaId={empresaId}
          equipoIdForLink={id}
        />
      </div>
    </div>
  )
}
