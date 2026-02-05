import { MantenimientosContent } from "@/components/mantenimientos-content"
import { mockMantenimientos, mockEquipos, mockColorCenters } from "@/lib/mock-data"

export default function MantenimientosPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Mantenimientos</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            Historial de mantenimientos. Para registrar uno nuevo, entra a una sucursal o al detalle de un equipo.
          </p>
        </div>

        <MantenimientosContent
          mantenimientos={mockMantenimientos}
          equipos={mockEquipos}
          colorCenters={mockColorCenters}
        />
      </div>
    </div>
  )
}
