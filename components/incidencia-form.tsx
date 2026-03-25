"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { ChevronLeft, Save, Loader2, ChevronDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ColorCenter, Equipo } from "@/lib/types"
import type { EstadoIncidencia, SeveridadIncidencia } from "@/lib/types"

interface IncidenciaFormProps {
  colorCenters: ColorCenter[]
  equipos: Equipo[]
  defaultSucursalId?: string
  defaultEquipoId?: string
}

export function IncidenciaForm({
  colorCenters,
  equipos,
  defaultSucursalId,
  defaultEquipoId,
}: IncidenciaFormProps) {
  const router = useRouter()
  const [sucursalId, setSucursalId] = useState(defaultSucursalId ?? "")
  const [equipoId, setEquipoId] = useState(defaultEquipoId ?? "")
  const [openSucursal, setOpenSucursal] = useState(false)
  const [openEquipo, setOpenEquipo] = useState(false)
  const [formData, setFormData] = useState({
    fecha_reporte: new Date().toISOString().split("T")[0],
    descripcion: "",
    severidad: "" as SeveridadIncidencia | "",
    estado: "Reportada" as EstadoIncidencia,
    notas: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sucursalSeleccionada = colorCenters.find((c) => c.id === sucursalId)
  const equiposDeSucursal = useMemo(
    () => equipos.filter((e) => e.color_center_id === sucursalId),
    [equipos, sucursalId]
  )
  const equipoSeleccionado = equiposDeSucursal.find((e) => e.id === equipoId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!sucursalId) {
      setError("Selecciona la sucursal donde se reporta la incidencia.")
      return
    }
    if (!formData.descripcion.trim()) {
      setError("La descripción del problema es requerida.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursal_id: sucursalId,
          empresa_id: sucursalSeleccionada?.empresa_id,
          equipo_id: equipoId || null,
          fecha_reporte: formData.fecha_reporte,
          descripcion: formData.descripcion.trim(),
          severidad: formData.severidad || null,
          estado: formData.estado,
          notas: formData.notas.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al registrar la incidencia")
        setIsSubmitting(false)
        return
      }
      router.push(`/incidencias/${data.incidencia.id}`)
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reportar incidencia
            </CardTitle>
            <Link href="/incidencias">
              <Button type="button" variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Sucursal <span className="text-destructive">*</span></Label>
            <Popover open={openSucursal} onOpenChange={setOpenSucursal}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between font-normal", !sucursalSeleccionada && "text-muted-foreground")}
                >
                  {sucursalSeleccionada
                    ? `${sucursalSeleccionada.nombre_sucursal} (${sucursalSeleccionada.codigo_interno})`
                    : "Seleccionar sucursal..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar sucursal..." />
                  <CommandList>
                    <CommandEmpty>No hay sucursales.</CommandEmpty>
                    <CommandGroup>
                      {colorCenters.map((cc) => (
                        <CommandItem
                          key={`${cc.empresa_id}-${cc.id}`}
                          value={`${cc.nombre_sucursal} ${cc.codigo_interno}`}
                          onSelect={() => {
                            setSucursalId(cc.id)
                            setEquipoId("")
                            setOpenSucursal(false)
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

          {sucursalId && equiposDeSucursal.length > 0 && (
            <div className="space-y-2">
              <Label>Equipo afectado (opcional)</Label>
              <Popover open={openEquipo} onOpenChange={setOpenEquipo}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn("w-full justify-between font-normal", !equipoSeleccionado && "text-muted-foreground")}
                  >
                    {equipoSeleccionado
                      ? `${equipoSeleccionado.tipo_equipo} ${equipoSeleccionado.numero_serie ?? ""}`
                      : "Ninguno (incidencia general de sucursal)"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar equipo..." />
                    <CommandList>
                      <CommandEmpty>No hay equipos.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="ninguno"
                          onSelect={() => {
                            setEquipoId("")
                            setOpenEquipo(false)
                          }}
                        >
                          Ninguno (incidencia general de sucursal)
                        </CommandItem>
                        {equiposDeSucursal.map((eq) => (
                          <CommandItem
                            key={eq.id}
                            value={`${eq.tipo_equipo} ${eq.numero_serie ?? eq.marca ?? ""}`}
                            onSelect={() => {
                              setEquipoId(eq.id)
                              setOpenEquipo(false)
                            }}
                          >
                            {eq.tipo_equipo} {eq.numero_serie && `- ${eq.numero_serie}`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fecha_reporte">Fecha del reporte</Label>
            <Input
              id="fecha_reporte"
              type="date"
              value={formData.fecha_reporte}
              onChange={(e) => setFormData({ ...formData, fecha_reporte: e.target.value })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Se registrará automáticamente como reportado por el usuario actual.
          </p>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción del problema <span className="text-destructive">*</span></Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe la falla, avería o riesgo..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severidad">Severidad</Label>
              <Select
                value={formData.severidad || "none"}
                onValueChange={(v) => setFormData({ ...formData, severidad: v === "none" ? "" : (v as SeveridadIncidencia) })}
              >
                <SelectTrigger id="severidad">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin clasificar</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(v) => setFormData({ ...formData, estado: v as EstadoIncidencia })}
              >
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reportada">Reportada</SelectItem>
                  <SelectItem value="En atención">En atención</SelectItem>
                  <SelectItem value="Resuelta">Resuelta</SelectItem>
                  <SelectItem value="Cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Observaciones adicionales..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Reportar incidencia
                </>
              )}
            </Button>
            <Link href="/incidencias">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
