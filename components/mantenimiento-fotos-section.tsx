"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Loader2, Plus, Trash2, Upload } from "lucide-react"
import { EquipoFotoImage } from "@/components/equipo-foto-image"
import type { FotoMantenimiento } from "@/lib/types"

type Props = {
  mantenimientoId: string
  fotos: FotoMantenimiento[]
  canWrite: boolean
}

export function MantenimientoFotosSection({ mantenimientoId, fotos: initialFotos, canWrite }: Props) {
  const router = useRouter()
  const [fotos, setFotos] = useState(initialFotos)
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fechaFoto, setFechaFoto] = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const clearFile = () => {
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no puede superar 10 MB.")
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError("Selecciona una imagen.")
      return
    }
    if (!fechaFoto) {
      setError("La fecha es obligatoria.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", selectedFile)
      form.append("fecha_foto", fechaFoto)
      if (descripcion.trim()) form.append("descripcion", descripcion.trim())

      const res = await fetch(`/api/mantenimientos/${encodeURIComponent(mantenimientoId)}/fotos`, {
        method: "POST",
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al subir imagen")
        return
      }
      setFotos((prev) => [data.foto, ...prev])
      setShowForm(false)
      setDescripcion("")
      clearFile()
      router.refresh()
    } catch {
      setError("Error de conexión.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (fotoId: string) => {
    setDeletingId(fotoId)
    try {
      const res = await fetch(`/api/mantenimientos/${encodeURIComponent(mantenimientoId)}/fotos/${encodeURIComponent(fotoId)}`, {
        method: "DELETE",
      })
      if (!res.ok) return
      setFotos((prev) => prev.filter((f) => f.id !== fotoId))
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4 shrink-0" />
          Fotos del mantenimiento
        </CardTitle>
        <CardDescription className="text-xs leading-snug">
          Evidencia del trabajo (antes/después, piezas, etc.). Se sube cuando el registro ya existe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {fotos.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground">
            {canWrite ? "Aún no hay fotos. Sube la primera evidencia." : "Aún no hay fotos."}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fotos.map((foto) => (
            <div key={foto.id} className="rounded-lg border overflow-hidden bg-muted/30 group relative">
              <div className="aspect-[4/3] relative">
                <EquipoFotoImage
                  src={foto.url}
                  alt={foto.descripcion ?? `Foto ${foto.fecha_foto}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm font-medium">
                    {new Date(foto.fecha_foto).toLocaleDateString("es-ES")}
                  </p>
                  {foto.descripcion && (
                    <p className="text-white/90 text-xs mt-0.5">{foto.descripcion}</p>
                  )}
                </div>
                {canWrite && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(foto.id)}
                    disabled={deletingId === foto.id}
                  >
                    {deletingId === foto.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canWrite ? (
          showForm ? (
            <form onSubmit={handleAdd} className="rounded-lg border border-dashed p-4 space-y-3">
              <div className="space-y-2">
                <Label>Imagen *</Label>
                <Input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mant-foto-fecha">Fecha *</Label>
                <Input
                  id="mant-foto-fecha"
                  type="date"
                  value={fechaFoto}
                  onChange={(e) => setFechaFoto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mant-foto-desc">Descripción (opcional)</Label>
                <Input
                  id="mant-foto-desc"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Antes del cambio de pieza"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || !selectedFile}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Subir foto
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(null); clearFile() }}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir foto
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
