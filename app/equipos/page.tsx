import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { EquiposContent } from "@/components/equipos-content"
import { mockEquipos, mockColorCenters } from "@/lib/mock-data"

export default function EquiposPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Equipos</h1>
            <p className="text-sm lg:text-base text-muted-foreground mt-1">Gestión de todos los equipos</p>
          </div>
          <Link href="/equipos/crear">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Equipo
            </Button>
          </Link>
        </div>

        <EquiposContent equipos={mockEquipos} colorCenters={mockColorCenters} />
      </div>
    </div>
  )
}
