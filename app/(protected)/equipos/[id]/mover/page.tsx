import { notFound } from "next/navigation"
import { findEquipoInAllBases, getSucursalesByEmpresa } from "@/lib/data"
import { MoverEquipoForm } from "@/components/mover-equipo-form"
import { requireWrite } from "@/lib/auth-roles"

export default async function MoverEquipoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireWrite("/equipos")
  const { id } = await params
  const found = await findEquipoInAllBases(id)
  if (!found) notFound()
  const { equipo, pool, empresaId } = found

  const sucursales = await getSucursalesByEmpresa(empresaId)
  const sucursalActual = sucursales.find((c) => c.id === equipo.color_center_id) ?? null
  const sucursalesDestino = sucursales.filter((c) => c.id !== equipo.color_center_id)

  return (
    <MoverEquipoForm
      equipo={equipo}
      sucursalActual={sucursalActual}
      sucursalesDestino={sucursalesDestino}
      empresaId={empresaId}
      equipoIdForLink={id}
    />
  )
}
