"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { ChevronLeft, Save, Loader2, ChevronDown, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { ColorCenter, Empresa, Equipo } from "@/lib/types"
import { buildSucursalCompositeIdFromIds, parseSucursalId } from "@/lib/data/ids"
import { PINTACOMEX_EMPRESA_ID } from "@/lib/empresas-config"
import type { EquipoComputadora } from "@/lib/types"
import { CreatableCombobox } from "@/components/creatable-combobox"

interface EquipoFormProps {
  empresas: Empresa[]
  colorCenters: ColorCenter[]
  equipo?: Equipo
  defaultColorCenterId?: string
  /** Para edición: especificaciones de computadora cuando tipo = Equipo de Computo. */
  computadoraInicial?: EquipoComputadora | null
  /** Para edición multi-DB: empresa de la base donde está el equipo. */
  empresaId?: string
  /** Para edición multi-DB: id compuesto para el redirect (ej. emp-1-42). */
  equipoIdForLink?: string
}

function getInitialEmpresaAndZona(
  colorCenters: ColorCenter[],
  colorCenterId: string | undefined
): { empresa_id: string; zona: string; numericSucursalId: string } {
  if (!colorCenterId) return { empresa_id: "", zona: "", numericSucursalId: "" }
  // Si viene de sucursal (ej. emp-1-42 o PINTA-SUC42), parsear para empresa + id numérico
  const parsed = parseSucursalId(colorCenterId)
  if (parsed.empresaId && parsed.numericId) {
    const cc = colorCenters.find(
      (c) => c.empresa_id === parsed.empresaId && c.id === parsed.numericId
    )
    return {
      empresa_id: parsed.empresaId,
      zona: cc?.region ?? "",
      numericSucursalId: parsed.numericId,
    }
  }
  const cc = colorCenters.find((c) => c.id === colorCenterId)
  if (!cc) return { empresa_id: "", zona: "", numericSucursalId: "" }
  return {
    empresa_id: cc.empresa_id,
    zona: cc.region ?? "",
    numericSucursalId: cc.id,
  }
}

export function EquipoForm({
  empresas,
  colorCenters,
  equipo,
  defaultColorCenterId,
  computadoraInicial: computadoraInicialProp,
  empresaId: empresaIdProp,
  equipoIdForLink,
}: EquipoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultCcIdForResolve = equipo?.color_center_id || defaultColorCenterId || ""
  const initial = useMemo(
    () => getInitialEmpresaAndZona(colorCenters, defaultCcIdForResolve),
    [colorCenters, defaultCcIdForResolve]
  )
  // Al venir desde sucursal (ID compuesto), el select usa id numérico; si no, el valor tal cual
  const initialCcId =
    initial.numericSucursalId || equipo?.color_center_id || defaultColorCenterId || ""

  const [empresaId, setEmpresaId] = useState(empresaIdProp ?? initial.empresa_id)
  const [zona, setZona] = useState(initial.zona)

  const computadoraInicial =
    equipo?.tipo_equipo === "Equipo de Computo" ? computadoraInicialProp ?? null : null

  const [formData, setFormData] = useState({
    color_center_id: initialCcId,
    tipo_equipo: equipo?.tipo_equipo || "",
    marca_id: "",
    modelo_id: "",
    numero_serie: equipo?.numero_serie || "",
    fecha_compra: equipo?.fecha_compra || "",
    tipo_propiedad: (equipo?.tipo_propiedad ?? "Propio") as "Propio" | "Arrendado",
    arrendador_id: "",
    fecha_vencimiento_arrendamiento: equipo?.fecha_vencimiento_arrendamiento ?? "",
    estado: equipo?.estado || "Operativo",
    ultima_calibracion: equipo?.ultima_calibracion || "",
    proxima_revision: equipo?.proxima_revision || "",
    notas: equipo?.notas || "",
    // Especificaciones de computadora (solo cuando tipo = Equipo de Computo)
    computadora: {
      procesador: computadoraInicial?.procesador ?? "",
      ram_gb: computadoraInicial?.ram_gb ?? "",
      almacenamiento_gb: computadoraInicial?.almacenamiento_gb ?? "",
      tipo_almacenamiento: (computadoraInicial?.tipo_almacenamiento ?? "") as "" | "SSD" | "HDD",
      graficos: computadoraInicial?.graficos ?? "",
      windows_version: computadoraInicial?.windows_version ?? "",
      so_64bits: computadoraInicial?.so_64bits ?? true,
    },
  })

  // Catálogo por empresa (país/contexto): se carga cuando hay empresa seleccionada
  const [catalogTipos, setCatalogTipos] = useState<{ id: string; nombre: string }[]>([])
  const [catalogMarcas, setCatalogMarcas] = useState<{ id: string; nombre: string }[]>([])
  const [catalogModelos, setCatalogModelos] = useState<{ id: string; marca_id: string; nombre: string }[]>([])
  const [catalogArrendadores, setCatalogArrendadores] = useState<{ id: string; nombre: string }[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)

  useEffect(() => {
    if (!empresaId) {
      setCatalogTipos([])
      setCatalogMarcas([])
      setCatalogModelos([])
      setCatalogArrendadores([])
      return
    }
    const q = new URLSearchParams({ empresa_id: empresaId })
    setCatalogLoading(true)
    Promise.all([
      fetch(`/api/catalogos/tipos-equipo?${q}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/catalogos/marcas?${q}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/catalogos/modelos?${q}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/catalogos/arrendadores?${q}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([tipos, marcas, modelos, arrendadores]) => {
        setCatalogTipos(Array.isArray(tipos) ? tipos : [])
        setCatalogMarcas(Array.isArray(marcas) ? marcas : [])
        setCatalogModelos(Array.isArray(modelos) ? modelos : [])
        setCatalogArrendadores(Array.isArray(arrendadores) ? arrendadores : [])
      })
      .catch(() => {
        setCatalogTipos([])
        setCatalogMarcas([])
        setCatalogModelos([])
        setCatalogArrendadores([])
      })
      .finally(() => setCatalogLoading(false))
  }, [empresaId])

  const catalogSyncedForEdit = useRef(false)
  // Al editar: cuando el catálogo carga, rellenar una vez marca_id, modelo_id, arrendador_id desde nombres del equipo
  useEffect(() => {
    if (!equipo || catalogLoading || catalogSyncedForEdit.current) return
    if (catalogMarcas.length === 0 && catalogArrendadores.length === 0) return
    catalogSyncedForEdit.current = true
    setFormData((prev) => {
      let next = { ...prev }
      if (equipo.marca && catalogMarcas.length > 0 && !prev.marca_id) {
        const found = catalogMarcas.find((m) => m.nombre === equipo.marca)
        if (found) next = { ...next, marca_id: found.id }
      }
      if (equipo.modelo && catalogModelos.length > 0 && !prev.modelo_id && next.marca_id) {
        const found = catalogModelos.find((m) => m.nombre === equipo.modelo && m.marca_id === next.marca_id)
        if (found) next = { ...next, modelo_id: found.id }
      }
      if (equipo.arrendador && catalogArrendadores.length > 0 && !prev.arrendador_id) {
        const found = catalogArrendadores.find((a) => a.nombre === equipo.arrendador)
        if (found) next = { ...next, arrendador_id: found.id }
      }
      return next
    })
  }, [equipo, catalogLoading, catalogMarcas, catalogModelos, catalogArrendadores])

  const marcaOptions = useMemo(
    () => catalogMarcas.map((m) => ({ value: m.id, label: m.nombre })),
    [catalogMarcas]
  )
  const modeloOptions = useMemo(
    () =>
      catalogModelos
        .filter((m) => m.marca_id === formData.marca_id)
        .map((m) => ({ value: m.id, label: m.nombre })),
    [catalogModelos, formData.marca_id]
  )
  const arrendadorOptions = useMemo(
    () => catalogArrendadores.map((a) => ({ value: a.id, label: a.nombre })),
    [catalogArrendadores]
  )
  const tipoEquipoOptions = useMemo(
    () => catalogTipos.map((t) => ({ value: t.nombre, label: t.nombre })),
    [catalogTipos]
  )

  const showZona = empresaId === PINTACOMEX_EMPRESA_ID
  const empresa = empresas.find((e) => e.id === empresaId)
  /** Zonas para Pintacomex: nombres desde los datos (comun/zonas), no números. */
  const zonasOpciones = useMemo(() => {
    if (!showZona || !empresaId || colorCenters.length === 0) return []
    const porEmpresa = colorCenters.filter((c) => c.empresa_id === empresaId)
    const nombres = [...new Set(porEmpresa.map((c) => c.region).filter(Boolean))] as string[]
    return nombres.sort()
  }, [colorCenters, empresaId, showZona])

  const sucursalesOpciones = useMemo(() => {
    const porEmpresa = colorCenters.filter((c) => c.empresa_id === empresaId)
    return showZona && zona ? porEmpresa.filter((c) => c.region === zona) : porEmpresa
  }, [colorCenters, empresaId, showZona, zona])

  const handleEmpresaChange = (value: string) => {
    setEmpresaId(value)
    setZona("")
    catalogSyncedForEdit.current = false
    setFormData((prev) => ({
      ...prev,
      color_center_id: "",
      marca_id: "",
      modelo_id: "",
      arrendador_id: "",
    }))
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

      const isComputo = formData.tipo_equipo === "Equipo de Computo"
      const marcaNombre = isComputo ? null : catalogMarcas.find((m) => m.id === formData.marca_id)?.nombre || null
      const modeloNombre = isComputo ? null : catalogModelos.find((m) => m.id === formData.modelo_id)?.nombre || null
      const arrendadorNombre = catalogArrendadores.find((a) => a.id === formData.arrendador_id)?.nombre || null

      if (equipo) {
        const body: Record<string, unknown> = {
          color_center_id: formData.color_center_id,
          tipo_equipo: formData.tipo_equipo,
          marca: marcaNombre,
          modelo: modeloNombre,
          numero_serie: isComputo ? null : formData.numero_serie || null,
          fecha_compra: isComputo ? null : formData.fecha_compra || null,
          tipo_propiedad: formData.tipo_propiedad,
          arrendador: formData.tipo_propiedad === "Arrendado" ? arrendadorNombre : null,
          fecha_vencimiento_arrendamiento:
            formData.tipo_propiedad === "Arrendado" ? formData.fecha_vencimiento_arrendamiento || null : null,
          estado: formData.estado,
          ultima_calibracion: isComputo ? null : formData.ultima_calibracion || null,
          proxima_revision: isComputo ? null : formData.proxima_revision || null,
          notas: formData.notas || null,
        }
        if (formData.tipo_equipo === "Equipo de Computo") {
          body.computadora = {
            procesador: formData.computadora.procesador || null,
            ram_gb: formData.computadora.ram_gb === "" ? null : formData.computadora.ram_gb,
            almacenamiento_gb: formData.computadora.almacenamiento_gb === "" ? null : formData.computadora.almacenamiento_gb,
            tipo_almacenamiento: formData.computadora.tipo_almacenamiento || null,
            graficos: formData.computadora.graficos || null,
            windows_version: formData.computadora.windows_version || null,
            so_64bits: formData.computadora.so_64bits,
          }
        }
        if (empresaIdProp) body.empresa_id = empresaIdProp
        const res = await fetch(`/api/equipos/${equipo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const d = await res.json()
          setError(d.error ?? "Error al actualizar")
          setIsSubmitting(false)
          return
        }
        router.push(equipoIdForLink ?? `/equipos/${equipo.id}`)
        router.refresh()
        return
      }

      const createBody: Record<string, unknown> = {
        color_center_id: formData.color_center_id,
        tipo_equipo: formData.tipo_equipo,
        marca: marcaNombre,
        modelo: modeloNombre,
        numero_serie: isComputo ? null : formData.numero_serie || null,
        fecha_compra: isComputo ? null : formData.fecha_compra || null,
        tipo_propiedad: formData.tipo_propiedad,
        arrendador: formData.tipo_propiedad === "Arrendado" ? arrendadorNombre : null,
        fecha_vencimiento_arrendamiento:
          formData.tipo_propiedad === "Arrendado" ? formData.fecha_vencimiento_arrendamiento || null : null,
        estado: formData.estado,
        ultima_calibracion: isComputo ? null : formData.ultima_calibracion || null,
        proxima_revision: isComputo ? null : formData.proxima_revision || null,
        notas: formData.notas || null,
      }
      if (empresaId) createBody.empresa_id = empresaId
      if (isComputo) {
        createBody.computadora = {
          procesador: formData.computadora.procesador || null,
          ram_gb: formData.computadora.ram_gb === "" ? null : formData.computadora.ram_gb,
          almacenamiento_gb: formData.computadora.almacenamiento_gb === "" ? null : formData.computadora.almacenamiento_gb,
          tipo_almacenamiento: formData.computadora.tipo_almacenamiento || null,
          graficos: formData.computadora.graficos || null,
          windows_version: formData.computadora.windows_version || null,
          so_64bits: formData.computadora.so_64bits,
        }
      }
      const res = await fetch("/api/equipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al crear equipo")
        setIsSubmitting(false)
        return
      }
      const { equipo: created } = await res.json()
      const redirectId = created?.id
      router.push(redirectId ? `/equipos/${redirectId}` : `/sucursales/${formData.color_center_id}`)
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
            <Link
              href={
                equipo && empresaId
                  ? `/sucursales/${buildSucursalCompositeIdFromIds(empresaId as any, equipo.color_center_id)}`
                  : "/"
              }
            >
              <Button type="button" variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6">
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
                    {zonasOpciones.map((r) => (
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

          {/* Tipo de Equipo (catálogo de la empresa seleccionada) */}
          <div className="space-y-2">
            <Label htmlFor="tipo_equipo">
              Tipo de Equipo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tipo_equipo}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  tipo_equipo: value,
                  ...(value === "Equipo de Computo"
                    ? { tipo_propiedad: "Propio" as const, arrendador_id: "" }
                    : {}),
                })
              }
              disabled={!empresaId || catalogLoading}
            >
              <SelectTrigger id="tipo_equipo">
                <SelectValue placeholder={!empresaId ? "Primero selecciona empresa" : catalogLoading ? "Cargando..." : "Selecciona el tipo"} />
              </SelectTrigger>
              <SelectContent>
                {tipoEquipoOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marca, Modelo, Serie, Fecha compra, Propiedad: no se usan para Equipo de Computo */}
          {formData.tipo_equipo !== "Equipo de Computo" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <CreatableCombobox
                    value={formData.marca_id}
                    onValueChange={(v) => setFormData({ ...formData, marca_id: v, modelo_id: "" })}
                    options={marcaOptions}
                    placeholder={!empresaId ? "Primero selecciona empresa" : catalogLoading ? "Cargando..." : "Selecciona marca..."}
                    searchPlaceholder="Buscar marca..."
                    disabled={!empresaId || catalogLoading}
                    emptyText="No hay marcas con ese nombre."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <CreatableCombobox
                    value={formData.modelo_id}
                    onValueChange={(v) => setFormData({ ...formData, modelo_id: v })}
                    options={modeloOptions}
                    placeholder={!empresaId ? "Primero selecciona empresa" : !formData.marca_id ? "Primero selecciona marca" : "Selecciona modelo..."}
                    disabled={!empresaId || !formData.marca_id || catalogLoading}
                    searchPlaceholder="Buscar modelo..."
                    emptyText="No hay modelos para esta marca."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_serie">Número de Serie</Label>
                <Input
                  id="numero_serie"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  placeholder="Ej: TM-001-2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_compra">Fecha de Compra</Label>
                <Input
                  id="fecha_compra"
                  type="date"
                  value={formData.fecha_compra}
                  onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_propiedad">Propiedad del equipo</Label>
                  <Select
                    value={formData.tipo_propiedad}
                    onValueChange={(value: "Propio" | "Arrendado") =>
                      setFormData({ ...formData, tipo_propiedad: value, arrendador_id: value === "Propio" ? "" : formData.arrendador_id })
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
                  <>
                    <div className="space-y-2">
                      <Label>¿De quién estamos arrendando?</Label>
                      <CreatableCombobox
                        value={formData.arrendador_id}
                        onValueChange={(v) => setFormData({ ...formData, arrendador_id: v })}
                        options={arrendadorOptions}
                        placeholder={!empresaId ? "Primero selecciona empresa" : catalogLoading ? "Cargando..." : "Selecciona arrendadora..."}
                        disabled={!empresaId || catalogLoading}
                        searchPlaceholder="Buscar arrendadora..."
                        emptyText="No hay arrendadoras con ese nombre."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_vencimiento_arrendamiento">Vencimiento del contrato</Label>
                      <Input
                        id="fecha_vencimiento_arrendamiento"
                        type="date"
                        value={formData.fecha_vencimiento_arrendamiento}
                        onChange={(e) =>
                          setFormData({ ...formData, fecha_vencimiento_arrendamiento: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

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

          {/* Especificaciones de computadora (solo cuando tipo = Equipo de Computo) */}
          {formData.tipo_equipo === "Equipo de Computo" && (
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Especificaciones de computadora
              </h3>
              <p className="text-xs text-muted-foreground">
                Requisitos de referencia: Intel Core i5 o superior (≥ 3.0 GHz), 16 GB RAM, ≥ 450 GB o SSD, Windows 11 Pro 23H2 o posterior, 64 bits.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="procesador">Procesador</Label>
                  <Input
                    id="procesador"
                    value={formData.computadora.procesador}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        computadora: { ...formData.computadora, procesador: e.target.value },
                      })
                    }
                    placeholder="Ej: Intel Core i5 ≥ 3.0 GHz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ram_gb">Memoria RAM (GB)</Label>
                  <Input
                    id="ram_gb"
                    type="number"
                    min={1}
                    max={256}
                    value={formData.computadora.ram_gb === "" ? "" : formData.computadora.ram_gb}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Number(e.target.value)
                      setFormData({
                        ...formData,
                        computadora: { ...formData.computadora, ram_gb: v as number | "" },
                      })
                    }}
                    placeholder="Ej: 16"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="almacenamiento_gb">Almacenamiento (GB)</Label>
                  <Input
                    id="almacenamiento_gb"
                    type="number"
                    min={1}
                    value={formData.computadora.almacenamiento_gb === "" ? "" : formData.computadora.almacenamiento_gb}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Number(e.target.value)
                      setFormData({
                        ...formData,
                        computadora: { ...formData.computadora, almacenamiento_gb: v as number | "" },
                      })
                    }}
                    placeholder="Ej: 450 o 512"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_almacenamiento">Tipo de almacenamiento</Label>
                  <Select
                    value={formData.computadora.tipo_almacenamiento}
                    onValueChange={(v: "SSD" | "HDD") =>
                      setFormData({
                        ...formData,
                        computadora: { ...formData.computadora, tipo_almacenamiento: v },
                      })
                    }
                  >
                    <SelectTrigger id="tipo_almacenamiento">
                      <SelectValue placeholder="SSD o HDD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SSD">SSD</SelectItem>
                      <SelectItem value="HDD">HDD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="graficos">Gráficos</Label>
                  <Input
                    id="graficos"
                    value={formData.computadora.graficos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        computadora: { ...formData.computadora, graficos: e.target.value },
                      })
                    }
                    placeholder="Ej: Intel HD 530, Nvidia, AMD compatible"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="windows_version">Versión de Windows</Label>
                  <Input
                    id="windows_version"
                    value={formData.computadora.windows_version}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        computadora: { ...formData.computadora, windows_version: e.target.value },
                      })
                    }
                    placeholder="Ej: Windows 11 Pro 23H2"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="so_64bits"
                    checked={formData.computadora.so_64bits}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        computadora: { ...formData.computadora, so_64bits: checked === true },
                      })
                    }
                  />
                  <Label htmlFor="so_64bits" className="text-sm font-normal cursor-pointer">
                    Sistema operativo 64 bits
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Calibración y Revisión: no aplican a Equipo de Computo */}
          {formData.tipo_equipo !== "Equipo de Computo" && (
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
          )}

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
            <Button type="submit" disabled={isSubmitting} className="flex-1 w-full min-h-[44px]">
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
