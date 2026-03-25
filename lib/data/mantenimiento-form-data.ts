import type { ColorCenter } from "@/lib/types"
import type { EquipoWithEmpresa } from "@/lib/types"
import type { EmpresaId } from "@/lib/db"
import { parseEquipoId } from "./ids"
import {
  getEquiposAllBases,
  getEquiposByEmpresa,
  getEquiposBySucursal,
  buildEquipoCompositeId,
} from "./equipos"
import { getColorCentersAllBases, getSucursalesByEmpresa, getSucursalByCompositeId } from "./sucursales"

/**
 * Datos para el formulario de crear mantenimiento.
 * Si hay `equipo_id` o `color_center_id` resolvibles, solo consulta esa empresa (1 pool + 1 comun)
 * en lugar de todas las bases.
 */
export async function getEquiposAndColorCentersForMantenimientoCrear(params: {
  equipo_id?: string | null
  color_center_id?: string | null
}): Promise<{ equipos: EquipoWithEmpresa[]; colorCenters: ColorCenter[] }> {
  const equipo_id = params.equipo_id?.trim()
  const color_center_id = params.color_center_id?.trim()

  if (equipo_id) {
    const { empresaId } = parseEquipoId(equipo_id)
    if (empresaId) {
      const [equipos, colorCenters] = await Promise.all([
        getEquiposByEmpresa(empresaId as EmpresaId),
        getSucursalesByEmpresa(empresaId as EmpresaId),
      ])
      return { equipos, colorCenters }
    }
  }

  if (color_center_id) {
    const resolved = await getSucursalByCompositeId(color_center_id)
    if (resolved) {
      const { pool, empresaId, colorCenter } = resolved
      const raw = await getEquiposBySucursal(pool, colorCenter.id)
      const equipos: EquipoWithEmpresa[] = raw.map((e) => ({
        ...e,
        id: buildEquipoCompositeId(empresaId, e),
        empresa_id: empresaId,
      }))
      const colorCenters = await getSucursalesByEmpresa(empresaId)
      return { equipos, colorCenters }
    }
  }

  const [equipos, colorCenters] = await Promise.all([getEquiposAllBases(), getColorCentersAllBases()])
  return { equipos, colorCenters }
}
