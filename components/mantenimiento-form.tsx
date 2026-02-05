"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Save, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"
import type { Mantenimiento, Equipo, ColorCenter } from "@/lib/types"

interface MantenimientoFormProps {
  equipos: Equipo[]
  colorCenters: ColorCenter[]
  mantenimiento?: Mantenimiento
  defaultEquipoId?: string
  defaultColorCenterId?: string
}

export function MantenimientoForm({
  equipos,
  colorCenters,
  mantenimiento,
  defaultEquipoId,
  defaultColorCenterId,
}: MantenimientoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colorCenterMap = new Map(colorCenters.map((cc) => [cc.id, cc]))

  // Si llegamos desde una sucursal, solo mostrar equipos de esa sucursal
  const equiposOpciones = useMemo(() => {
    if (defaultColorCenterId) {
      return equipos.filter((e) => e.color_center_id === defaultColorCenterId)
    }
    return equipos
  }, [equipos, defaultColorCenterId])

  const desdeEquipo = !!defaultEquipoId && !mantenimiento
  const desdeSucursal = !!defaultColorCenterId && !defaultEquipoId

  const [formData, setFormData] = useState({
    equipo_id: mantenimiento?.equipo_id || defaultEquipoId || "",
    tipo: mantenimiento?.tipo || "Preventivo",
    tecnico_responsable: mantenimiento?.tecnico_responsable || "",
    fecha_mantenimiento: mantenimiento?.fecha_mantenimiento || new Date().toISOString().split("T")[0],
    descripcion: mantenimiento?.descripcion || "",
    piezas_cambiadas: mantenimiento?.piezas_cambiadas || "",
    tiempo_fuera_servicio: mantenimiento?.tiempo_fuera_servicio?.toString() || "",
    costo: mantenimiento?.costo?.toString() || "",
    estado: mantenimiento?.estado || "Pendiente",
    notas: mantenimiento?.notas || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar campos requeridos
      if (!formData.equipo_id) {
        setError("Debes seleccionar un equipo")
        setIsSubmitting(false)
        return
      }

      if (!formData.tecnico_responsable) {
        setError("El técnico responsable es requerido")
        setIsSubmitting(false)
        return
      }

      if (!formData.descripcion) {
        setError("La descripción es requerida")
        setIsSubmitting(false)
        return
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      alert(
        mantenimiento
          ? "Mantenimiento actualizado exitosamente (modo demo)"
          : "Mantenimiento registrado exitosamente (modo demo)",
      )

      // Redirigir según contexto: equipo → detalle equipo; sucursal → detalle sucursal; sino → lista mantenimientos
      if (defaultEquipoId) {
        router.push(`/equipos/${formData.equipo_id}`)
      } else if (defaultColorCenterId) {
        router.push(`/sucursales/${defaultColorCenterId}`)
      } else {
        router.push("/mantenimientos")
      }
      router.refresh()
    } catch (err) {
      console.error("Error saving mantenimiento:", err)
      setError("Error al guardar el mantenimiento. Por favor intenta de nuevo.")
      setIsSubmitting(false)
    }
  }

  const handleMarcarCompletado = async () => {
    if (!mantenimiento) return

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Mantenimiento marcado como completado (modo demo)")
      router.push("/mantenimientos")
      router.refresh()
    } catch (err) {
      console.error("Error marking as completed:", err)
      setError("Error al marcar como completado")
      setIsSubmitting(false)
    }
  }

  const selectedEquipo = equipos.find((e) => e.id === formData.equipo_id)
  const selectedColorCenter = selectedEquipo ? colorCenterMap.get(selectedEquipo.color_center_id) : null

  const cancelHref = defaultEquipoId
    ? `/equipos/${defaultEquipoId}`
    : defaultColorCenterId
      ? `/sucursales/${defaultColorCenterId}`
      : "/mantenimientos"

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg lg:text-xl">Información del Mantenimiento</CardTitle>
            <div className="flex gap-2">
              {mantenimiento && mantenimiento.estado !== "Completado" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarcarCompletado}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Marcar Completado</span>
                  <span className="sm:hidden">Completar</span>
                </Button>
              )}
              <Link href={cancelHref}>
                <Button type="button" variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </Link>
            </div>
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

          {/* Equipo */}
          <div className="space-y-2">
            <Label htmlFor="equipo_id">
              Equipo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.equipo_id}
              onValueChange={(value) => setFormData({ ...formData, equipo_id: value })}
              disabled={!!mantenimiento || desdeEquipo}
            >
              <SelectTrigger id="equipo_id">
                <SelectValue
                  placeholder={
                    desdeSucursal
                      ? "Selecciona un equipo de esta sucursal"
                      : "Selecciona un equipo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {equiposOpciones.map((equipo) => {
                  const cc = colorCenterMap.get(equipo.color_center_id)
                  return (
                    <SelectItem key={equipo.id} value={equipo.id}>
                      {equipo.tipo_equipo} - {equipo.marca} {equipo.numero_serie ? `(${equipo.numero_serie})` : ""}
                      {!defaultColorCenterId && cc ? ` - ${cc.nombre_sucursal}` : ""}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedEquipo && selectedColorCenter && (
              <p className="text-sm text-muted-foreground">
                Sucursal: {selectedColorCenter.nombre_sucursal} | N° Serie: {selectedEquipo.numero_serie || "N/A"}
              </p>
            )}
          </div>

          {/* Tipo y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Mantenimiento <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventivo">Preventivo</SelectItem>
                  <SelectItem value="Correctivo">Correctivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Técnico y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tecnico_responsable">
                Técnico Responsable <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tecnico_responsable"
                value={formData.tecnico_responsable}
                onChange={(e) => setFormData({ ...formData, tecnico_responsable: e.target.value })}
                placeholder="Nombre del técnico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_mantenimiento">
                Fecha de Mantenimiento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fecha_mantenimiento"
                type="date"
                value={formData.fecha_mantenimiento}
                onChange={(e) => setFormData({ ...formData, fecha_mantenimiento: e.target.value })}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe el trabajo realizado o a realizar..."
              rows={4}
            />
          </div>

          {/* Piezas Cambiadas */}
          <div className="space-y-2">
            <Label htmlFor="piezas_cambiadas">Piezas Cambiadas</Label>
            <Textarea
              id="piezas_cambiadas"
              value={formData.piezas_cambiadas}
              onChange={(e) => setFormData({ ...formData, piezas_cambiadas: e.target.value })}
              placeholder="Lista de piezas reemplazadas..."
              rows={3}
            />
          </div>

          {/* Tiempo y Costo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tiempo_fuera_servicio">Tiempo Fuera de Servicio (horas)</Label>
              <Input
                id="tiempo_fuera_servicio"
                type="number"
                min="0"
                value={formData.tiempo_fuera_servicio}
                onChange={(e) => setFormData({ ...formData, tiempo_fuera_servicio: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo">Costo ($)</Label>
              <Input
                id="costo"
                type="number"
                min="0"
                step="0.01"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Información adicional..."
              rows={3}
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
                  {mantenimiento ? "Actualizar Mantenimiento" : "Registrar Mantenimiento"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
