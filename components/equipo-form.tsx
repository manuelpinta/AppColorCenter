"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ChevronLeft, Save, Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { ColorCenter, Empresa, Equipo } from "@/lib/types"
import { getSucursalesByEmpresaAndZona, PINTACOMEX_EMPRESA_ID } from "@/lib/mock-data"

interface EquipoFormProps {
  empresas: Empresa[]
  colorCenters: ColorCenter[]
  equipo?: Equipo
  defaultColorCenterId?: string
}

function getInitialEmpresaAndZona(
  colorCenters: ColorCenter[],
  colorCenterId: string | undefined
): { empresa_id: string; zona: string } {
  if (!colorCenterId) return { empresa_id: "", zona: "" }
  const cc = colorCenters.find((c) => c.id === colorCenterId)
  if (!cc) return { empresa_id: "", zona: "" }
  return { empresa_id: cc.empresa_id, zona: cc.region ?? "" }
}

export function EquipoForm({ empresas, colorCenters, equipo, defaultColorCenterId }: EquipoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialCcId = equipo?.color_center_id || defaultColorCenterId || ""
  const initial = useMemo(
    () => getInitialEmpresaAndZona(colorCenters, initialCcId),
    [colorCenters, initialCcId]
  )

  const [empresaId, setEmpresaId] = useState(initial.empresa_id)
  const [zona, setZona] = useState(initial.zona)

  const [formData, setFormData] = useState({
    color_center_id: initialCcId,
    tipo_equipo: equipo?.tipo_equipo || "",
    marca: equipo?.marca || "",
    modelo: equipo?.modelo || "",
    numero_serie: equipo?.numero_serie || "",
    fecha_compra: equipo?.fecha_compra || "",
    tipo_propiedad: (equipo?.tipo_propiedad ?? "Propio") as "Propio" | "Arrendado",
    arrendador: equipo?.arrendador ?? "",
    estado: equipo?.estado || "Operativo",
    ultima_calibracion: equipo?.ultima_calibracion || "",
    proxima_revision: equipo?.proxima_revision || "",
    notas: equipo?.notas || "",
  })

  const showZona = empresaId === PINTACOMEX_EMPRESA_ID
  const empresa = empresas.find((e) => e.id === empresaId)
  const sucursalesOpciones = useMemo(
    () => getSucursalesByEmpresaAndZona(empresaId, showZona ? zona || undefined : undefined),
    [empresaId, showZona, zona]
  )

  const handleEmpresaChange = (value: string) => {
    setEmpresaId(value)
    setZona("")
    setFormData((prev) => ({ ...prev, color_center_id: "" }))
  }

  const handleZonaChange = (value: string) => {
    setZona(value)
    setFormData((prev) => ({ ...prev, color_center_id: "" }))
  }

  const [sucursalOpen, setSucursalOpen] = useState(false)
  const sucursalSeleccionada = sucursalesOpciones.find((s) => s.id === formData.color_center_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar que se haya seleccionado un Color Center
      if (!formData.color_center_id) {
        setError("Debes seleccionar un Color Center")
        setIsSubmitting(false)
        return
      }

      // Validar campos requeridos
      if (!formData.tipo_equipo) {
        setError("El tipo de equipo es requerido")
        setIsSubmitting(false)
        return
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      alert(equipo ? "Equipo actualizado exitosamente (modo demo)" : "Equipo registrado exitosamente (modo demo)")

      router.push(`/sucursales/${formData.color_center_id}`)
      router.refresh()
    } catch (err) {
      console.error("Error saving equipo:", err)
      setError("Error al guardar el equipo. Por favor intenta de nuevo.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg lg:text-xl">Información del Equipo</CardTitle>
            <Link href={equipo ? `/sucursales/${equipo.color_center_id}` : "/"}>
              <Button type="button" variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6">
          <div className="bg-warning/10 text-warning-foreground px-4 py-3 rounded-lg text-sm border border-warning/20">
            Modo Demo: Los cambios no se guardarán permanentemente
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20">
              {error}
            </div>
          )}

          {/* Ubicación: Empresa → Zona (solo Pintacomex) → Sucursal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Ubicación (Color Center)</h3>

            <div className="space-y-2">
              <Label htmlFor="empresa_id">
                Empresa <span className="text-destructive">*</span>
              </Label>
              <Select
                value={empresaId}
                onValueChange={handleEmpresaChange}
                disabled={!!equipo}
              >
                <SelectTrigger id="empresa_id">
                  <SelectValue placeholder="Selecciona empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showZona && (
              <div className="space-y-2">
                <Label htmlFor="zona">Zona</Label>
                <Select value={zona} onValueChange={handleZonaChange} disabled={!!equipo}>
                  <SelectTrigger id="zona">
                    <SelectValue placeholder="Selecciona zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {(empresa?.regiones ?? []).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="color_center_id">
                Sucursal <span className="text-destructive">*</span>
              </Label>
              <Popover open={sucursalOpen} onOpenChange={setSucursalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="color_center_id"
                    variant="outline"
                    role="combobox"
                    aria-expanded={sucursalOpen}
                    disabled={!!equipo || !empresaId}
                    className={cn(
                      "w-full justify-between font-normal",
                      !sucursalSeleccionada && "text-muted-foreground"
                    )}
                  >
                    {sucursalSeleccionada
                      ? `${sucursalSeleccionada.nombre_sucursal} (${sucursalSeleccionada.codigo_interno})`
                      : !empresaId
                        ? "Primero selecciona empresa"
                        : "Escribe para buscar sucursal..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar sucursal por nombre o código..." />
                    <CommandList>
                      <CommandEmpty>No hay sucursales que coincidan.</CommandEmpty>
                      <CommandGroup>
                        {sucursalesOpciones.map((cc) => (
                          <CommandItem
                            key={cc.id}
                            value={`${cc.nombre_sucursal} ${cc.codigo_interno}`}
                            onSelect={() => {
                              setFormData((prev) => ({ ...prev, color_center_id: cc.id }))
                              setSucursalOpen(false)
                            }}
                          >
                            {cc.nombre_sucursal} ({cc.codigo_interno})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tipo de Equipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo_equipo">
              Tipo de Equipo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tipo_equipo}
              onValueChange={(value) => setFormData({ ...formData, tipo_equipo: value })}
            >
              <SelectTrigger id="tipo_equipo">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tintometrico">Tintometrico</SelectItem>
                <SelectItem value="Mezcladora">Mezcladora</SelectItem>
                <SelectItem value="Regulador">Regulador</SelectItem>
                <SelectItem value="Equipo de Computo">Equipo de Computo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Marca y Modelo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ej: ColorMix Pro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Ej: CM-2000"
              />
            </div>
          </div>

          {/* Número de Serie */}
          <div className="space-y-2">
            <Label htmlFor="numero_serie">Número de Serie</Label>
            <Input
              id="numero_serie"
              value={formData.numero_serie}
              onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
              placeholder="Ej: TM-001-2024"
            />
          </div>

          {/* Fecha de Compra */}
          <div className="space-y-2">
            <Label htmlFor="fecha_compra">Fecha de Compra</Label>
            <Input
              id="fecha_compra"
              type="date"
              value={formData.fecha_compra}
              onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
            />
          </div>

          {/* Propiedad: Propio / Arrendado */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_propiedad">Propiedad del equipo</Label>
              <Select
                value={formData.tipo_propiedad}
                onValueChange={(value: "Propio" | "Arrendado") =>
                  setFormData({ ...formData, tipo_propiedad: value, arrendador: value === "Propio" ? "" : formData.arrendador })
                }
              >
                <SelectTrigger id="tipo_propiedad">
                  <SelectValue placeholder="¿Propio o arrendado?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Propio">Propiedad nuestra</SelectItem>
                  <SelectItem value="Arrendado">En arrendamiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.tipo_propiedad === "Arrendado" && (
              <div className="space-y-2">
                <Label htmlFor="arrendador">¿De quién estamos arrendando?</Label>
                <Input
                  id="arrendador"
                  value={formData.arrendador}
                  onChange={(e) => setFormData({ ...formData, arrendador: e.target.value })}
                  placeholder="Ej: Equipos Industriales SA"
                />
              </div>
            )}
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operativo">Operativo</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="Fuera de Servicio">Fuera de Servicio</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calibración y Revisión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ultima_calibracion">Última Calibración</Label>
              <Input
                id="ultima_calibracion"
                type="date"
                value={formData.ultima_calibracion}
                onChange={(e) => setFormData({ ...formData, ultima_calibracion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proxima_revision">Próxima Revisión</Label>
              <Input
                id="proxima_revision"
                type="date"
                value={formData.proxima_revision}
                onChange={(e) => setFormData({ ...formData, proxima_revision: e.target.value })}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Información adicional sobre el equipo..."
              rows={4}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {equipo ? "Actualizar Equipo" : "Registrar Equipo"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
