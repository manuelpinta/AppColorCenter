import { AdminCatalogosContent } from "@/components/admin-catalogos-content"
import { redirect } from "next/navigation"
import { userHasRole } from "@/lib/auth-roles"

export const metadata = {
  title: "Admin catálogos | Color Center",
  description: "Gestionar tipos de equipo, marcas, modelos y arrendadores (maestro Pintacomex).",
}

export default async function AdminCatalogosPage() {
  const ok = await userHasRole("soporte-central")
  if (!ok) redirect("/")
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin catálogos</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            Tipos de equipo, marcas, modelos y arrendadores. Los cambios se escriben en la base maestra y se replican al resto de empresas.
          </p>
        </div>
        <AdminCatalogosContent />
      </div>
    </div>
  )
}
