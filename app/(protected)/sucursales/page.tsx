import {
  getColorCentersAllBases,
  getEquiposAllBases,
  getRegionesFromColorCenters,
} from "@/lib/data"
import { getEmpresasForCurrentUser } from "@/lib/data/empresas-auth"
import { SucursalesContent } from "@/components/sucursales-content"

export default async function SucursalesPage() {
  const [colorCenters, equipos, empresas] = await Promise.all([
    getColorCentersAllBases(),
    getEquiposAllBases(),
    getEmpresasForCurrentUser(),
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
