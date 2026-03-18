"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Camera, Plus, Loader2, Trash2, Upload, ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react"
import { EquipoFotoImage } from "@/components/equipo-foto-image"
import type { FotoEquipo } from "@/lib/types"

interface EquipoFotosSectionProps {
  equipoId: string
  fotos: FotoEquipo[]
  canWrite: boolean
}

export function EquipoFotosSection({ equipoId, fotos: initialFotos, canWrite }: EquipoFotosSectionProps) {
  const router = useRouter()
  const [fotos, setFotos] = useState(initialFotos)
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fechaFoto, setFechaFoto] = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxOpen = lightboxIndex !== null

  // If user loses write permissions, keep UI consistent.
  useEffect(() => {
    if (!canWrite) setShowForm(false)
  }, [canWrite])

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || prev <= 0) return fotos.length - 1
      return prev - 1
    })
  }, [fotos.length])

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || prev >= fotos.length - 1) return 0
      return prev + 1
    })
  }, [fotos.length])

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev()
      else if (e.key === "ArrowRight") goToNext()
      else if (e.key === "Escape") closeLightbox()
    },
    [goToPrev, goToNext]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen (JPG, PNG, WebP, etc.)")
      return
    }
    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no puede superar los 10 MB.")
      return
    }
    setError(null)
    setSelectedFile(file)
    // Generate local preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selectedFile) {
      setError("Selecciona una imagen.")
      return
    }
    if (!fechaFoto) {
      setError("La fecha de la foto es obligatoria.")
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("fecha_foto", fechaFoto)
      if (descripcion.trim()) formData.append("descripcion", descripcion.trim())

      const res = await fetch(`/api/equipos/${equipoId}/fotos`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error ?? "Error al guardar la foto"
        setError(data.detail ? `${msg} (${data.detail})` : msg)
        return
      }
      setFotos((prev) => [data.foto, ...prev])
      clearFile()
      setDescripcion("")
      setFechaFoto(new Date().toISOString().slice(0, 10))
      setShowForm(false)
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
      const res = await fetch(`/api/equipos/${equipoId}/fotos/${fotoId}`, { method: "DELETE" })
      if (!res.ok) return
      setFotos((prev) => prev.filter((f) => f.id !== fotoId))
      // If we're viewing this photo in lightbox, close or adjust
      if (lightboxIndex !== null) {
        const deletedIndex = fotos.findIndex((f) => f.id === fotoId)
        if (deletedIndex === lightboxIndex) {
          if (fotos.length <= 1) closeLightbox()
          else if (lightboxIndex >= fotos.length - 1) setLightboxIndex(lightboxIndex - 1)
        } else if (deletedIndex < lightboxIndex) {
          setLightboxIndex(lightboxIndex - 1)
        }
      }
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  const currentLightboxFoto = lightboxIndex !== null ? fotos[lightboxIndex] : null

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Fotos del equipo
          </CardTitle>
          <CardDescription>
            Sube fotos para documentar el estado del equipo (varias vistas, cada una con fecha).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fotos.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground py-4">
              {canWrite ? "Aún no hay fotos. Añade la primera para documentar el estado del equipo." : "Aún no hay fotos."}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fotos.map((foto, index) => (
              <div
                key={foto.id}
                className="rounded-lg border overflow-hidden bg-muted/30 group relative cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="aspect-[4/3] relative">
                  <EquipoFotoImage
                    src={foto.url}
                    alt={foto.descripcion ?? `Foto ${foto.fecha_foto}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-sm font-medium">
                      {new Date(foto.fecha_foto).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(foto.id)
                      }}
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
                {/* File upload area */}
                <div className="space-y-2">
                  <Label>Imagen *</Label>
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Haz clic para seleccionar una imagen</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP hasta 10 MB</p>
                    </div>
                  ) : (
                    <div className="relative rounded-lg border overflow-hidden">
                      <div className="aspect-video relative bg-muted">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Vista previa"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={clearFile} className="shrink-0">
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foto-fecha">Fecha de la foto *</Label>
                  <Input
                    id="foto-fecha"
                    type="date"
                    value={fechaFoto}
                    onChange={(e) => setFechaFoto(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foto-desc">Descripción (opcional)</Label>
                  <Input
                    id="foto-desc"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Vista frontal, lateral derecho, detalle daño..."
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting || !selectedFile}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Subir foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      clearFile()
                      setError(null)
                    }}
                  >
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

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={(open) => { if (!open) closeLightbox() }}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-black/95 overflow-hidden [&>button]:hidden"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">
            Foto del equipo {currentLightboxFoto ? `: ${currentLightboxFoto.descripcion ?? currentLightboxFoto.fecha_foto}` : ""}
          </DialogTitle>
          {currentLightboxFoto && (
            <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[50vh]">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 z-50 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={closeLightbox}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation arrows */}
              {fotos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    onClick={(e) => { e.stopPropagation(); goToPrev() }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    onClick={(e) => { e.stopPropagation(); goToNext() }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Image */}
              <div className="flex items-center justify-center w-full" style={{ maxHeight: "calc(95vh - 80px)" }}>
                <img
                  src={currentLightboxFoto.url}
                  alt={currentLightboxFoto.descripcion ?? `Foto ${currentLightboxFoto.fecha_foto}`}
                  className="max-w-full max-h-[calc(95vh-80px)] object-contain"
                />
              </div>

              {/* Info bar */}
              <div className="w-full px-6 py-3 bg-black/80 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">
                    {new Date(currentLightboxFoto.fecha_foto).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {currentLightboxFoto.descripcion && (
                    <p className="text-white/80 text-xs mt-0.5">{currentLightboxFoto.descripcion}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-sm">
                    {lightboxIndex! + 1} / {fotos.length}
                  </span>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                      onClick={() => handleDelete(currentLightboxFoto.id)}
                      disabled={deletingId === currentLightboxFoto.id}
                    >
                      {deletingId === currentLightboxFoto.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
