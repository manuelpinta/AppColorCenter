"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { ArrowLeft, Building2, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ColorCenter, Equipo } from "@/lib/types"

interface MoverEquipoFormProps {
  equipo: Equipo
  sucursalActual: ColorCenter | null
  sucursalesDestino: ColorCenter[]
  /** Para multi-DB: empresa de la base donde está el equipo. */
  empresaId?: string
  /** Para multi-DB: id compuesto para el redirect (ej. emp-1-42). */
  equipoIdForLink?: string
}

export function MoverEquipoForm({
  equipo,
  sucursalActual,
  sucursalesDestino,
  empresaId,
  equipoIdForLink,
}: MoverEquipoFormProps) {
  const router = useRouter()
  const [sucursalDestinoId, setSucursalDestinoId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [registradoPor, setRegistradoPor] = useState("")
  const [openCombobox, setOpenCombobox] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedDestino = sucursalesDestino.find((c) => c.id === sucursalDestinoId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!sucursalDestinoId) {
      setError("Selecciona la sucursal de destino.")
      return
    }
    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        sucursal_destino_id: sucursalDestinoId,
        motivo: motivo.trim() || null,
        registrado_por: registradoPor.trim() || null,
      }
      if (empresaId) body.empresa_id = empresaId
      const equipoIdForApi = equipoIdForLink ?? equipo.id
      const res = await fetch(`/api/equipos/${equipoIdForApi}/mover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al registrar el movimiento")
        return
      }
      const redirectId = equipoIdForLink ?? equipo.id
      router.push(`/equipos/${redirectId}`)
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-xl mx-auto">
        <Link
          href={`/equipos/${equipoIdForLink ?? equipo.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al equipo
        </Link>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Mover equipo a otra sucursal</CardTitle>
            <CardDescription>
              {equipo.tipo_equipo} {equipo.marca && equipo.modelo ? `– ${equipo.marca} ${equipo.modelo}` : ""}
              {equipo.numero_serie ? ` · Serie ${equipo.numero_serie}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-muted-foreground">Sucursal actual</Label>
                <div className="mt-1.5 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {sucursalActual
                      ? `${sucursalActual.nombre_sucursal} (${sucursalActual.codigo_interno})`
                      : "Sin asignar"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destino">Nueva sucursal *</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className={cn(
                        "w-full justify-between font-normal h-10",
                        !selectedDestino && "text-muted-foreground"
                      )}
                    >
                      <span className="truncate">
                        {selectedDestino
                          ? `${selectedDestino.nombre_sucursal} (${selectedDestino.codigo_interno})`
                          : "Seleccionar sucursal..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o código..." />
                      <CommandList>
                        <CommandEmpty>No hay sucursales que coincidan.</CommandEmpty>
                        <CommandGroup>
                          {sucursalesDestino.map((cc) => (
                            <CommandItem
                              key={cc.id}
                              value={`${cc.nombre_sucursal} ${cc.codigo_interno}`}
                              onSelect={() => {
                                setSucursalDestinoId(cc.id)
                                setOpenCombobox(false)
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

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Textarea
                  id="motivo"
                  placeholder="Ej. Reasignación por cierre temporal, préstamo a otra sucursal..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrado_por">Registrado por (opcional)</Label>
                <Input
                  id="registrado_por"
                  placeholder="Nombre de quien registra el movimiento"
                  value={registradoPor}
                  onChange={(e) => setRegistradoPor(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Registrar movimiento"
                  )}
                </Button>
                <Link href={`/equipos/${equipoIdForLink ?? equipo.id}`}>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
