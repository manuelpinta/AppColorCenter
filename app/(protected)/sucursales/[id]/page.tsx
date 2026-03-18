import { notFound } from "next/navigation"
import {
  getSucursalByCompositeId,
  getEquiposBySucursal,
  getIncidenciasBySucursalId,
  getEmpresaById,
} from "@/lib/data"
import { ColorCenterDetail } from "@/components/color-center-detail"
import type { EquipoWithEmpresa } from "@/lib/data"
import { userCanWrite } from "@/lib/auth-roles"

export default async function ColorCenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const canWrite = await userCanWrite()
  const found = await getSucursalByCompositeId(id)
  if (!found) notFound()
  const { colorCenter, pool, empresaId } = found

  const [equiposRaw, incidencias, empresa] = await Promise.all([
    getEquiposBySucursal(pool, colorCenter.id),
    getIncidenciasBySucursalId(pool, colorCenter.id),
    getEmpresaById(empresaId),
  ])
  const equipos: EquipoWithEmpresa[] = equiposRaw.map((e) => ({
    ...e,
    id: `${empresaId}-${e.id}`,
    empresa_id: empresaId,
  }))
  const compositeSucursalId = `${empresaId}-${colorCenter.id}`

  return (
    <div className="pb-20 lg:pb-0">
      <ColorCenterDetail
        colorCenter={colorCenter}
        equipos={equipos}
        empresa={empresa ?? undefined}
        incidencias={incidencias}
        sucursalIdForLinks={compositeSucursalId}
        canWrite={canWrite}
      />
    </div>
  )
}
