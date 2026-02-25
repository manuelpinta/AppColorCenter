import {
  getColorCentersAllBases,
  getEquiposAllBases,
  getEmpresas,
  getRegionesFromColorCenters,
} from "@/lib/data"
import { SucursalesContent } from "@/components/sucursales-content"

export default async function SucursalesPage() {
  const [colorCenters, equipos, empresas] = await Promise.all([
    getColorCentersAllBases(),
    getEquiposAllBases(),
    getEmpresas(),
  ])
  const regiones = getRegionesFromColorCenters(colorCenters)
  return (
    <SucursalesContent
      colorCenters={colorCenters}
      equipos={equipos}
      empresas={empresas}
      regiones={regiones}
    />
  )
}
