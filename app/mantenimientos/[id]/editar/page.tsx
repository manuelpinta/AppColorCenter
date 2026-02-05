import { notFound } from "next/navigation"
import Link from "next/link"
import { MantenimientoForm } from "@/components/mantenimiento-form"
import { mockMantenimientos, mockEquipos, mockColorCenters } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function EditarMantenimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const mantenimiento = mockMantenimientos.find((m) => m.id === id)

  if (!mantenimiento) {
    notFound()
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/mantenimientos/${mantenimiento.id}`}>
          <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Editar Mantenimiento</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1.5">
            Actualiza la informacion del mantenimiento
          </p>
        </div>
      </div>

      <MantenimientoForm equipos={mockEquipos} colorCenters={mockColorCenters} mantenimiento={mantenimiento} />
    </div>
  )
}
