import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { EquiposContent } from "@/components/equipos-content"
import { getEquiposAllBases, getColorCentersAllBases } from "@/lib/data"
import { timed } from "@/lib/data/timing"

export default async function EquiposPage() {
  const [equipos, colorCenters] = await timed("equipos page (getEquiposAllBases + getColorCentersAllBases)", async () =>
    Promise.all([
      timed("getEquiposAllBases", () => getEquiposAllBases()),
      timed("getColorCentersAllBases", () => getColorCentersAllBases()),
    ])
  )
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-foreground">Equipos</h1>
            <p className="text-xs lg:text-base text-muted-foreground mt-1">Gestión de todos los equipos</p>
          </div>
          <Link href="/equipos/crear">
            <Button className="w-full sm:w-auto min-h-[44px] touch-manipulation">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Equipo
            </Button>
          </Link>
        </div>

        <EquiposContent equipos={equipos} colorCenters={colorCenters} />
      </div>
    </div>
  )
}
