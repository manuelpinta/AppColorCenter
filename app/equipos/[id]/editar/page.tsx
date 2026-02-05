import { notFound } from "next/navigation"
import Link from "next/link"
import { EquipoForm } from "@/components/equipo-form"
import { mockColorCenters, mockEmpresas, mockEquipos } from "@/lib/mock-data"
import { ArrowLeft } from "lucide-react"

export default async function EditarEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const equipo = mockEquipos.find((e) => e.id === id)

  if (!equipo) {
    notFound()
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
        <Link
          href={`/equipos/${equipo.id}`}
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

        <EquipoForm empresas={mockEmpresas} colorCenters={mockColorCenters} equipo={equipo} />
      </div>
    </div>
  )
}
