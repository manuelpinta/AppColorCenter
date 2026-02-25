"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus, Pencil, Power, PowerOff } from "lucide-react"

const INACTIVOS = "?incluir_inactivos=1"

type ItemSimple = { id: string; nombre: string; activo?: number }
type ModeloItem = { id: string; marca_id: string; nombre: string; activo?: number }

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error ?? res.statusText)
  }
  return res.json()
}

async function apiPost(path: string, body: object): Promise<unknown> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error ?? res.statusText)
  }
  return res.json()
}

async function apiPatch(path: string, body: object): Promise<unknown> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error ?? res.statusText)
  }
  return res.json()
}

function useCatalogList<T>(url: string | null) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<T[]>(url)
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar")
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, loading, error, refetch }
}

export function AdminCatalogosContent() {
  const [activeTab, setActiveTab] = useState("tipos")

  const {
    items: tipos,
    loading: loadingTipos,
    error: errorTipos,
    refetch: refetchTipos,
  } = useCatalogList<ItemSimple>(`/api/catalogos/tipos-equipo${INACTIVOS}`)

  const {
    items: marcas,
    loading: loadingMarcas,
    error: errorMarcas,
    refetch: refetchMarcas,
  } = useCatalogList<ItemSimple>(`/api/catalogos/marcas${INACTIVOS}`)

  const {
    items: modelos,
    loading: loadingModelos,
    error: errorModelos,
    refetch: refetchModelos,
  } = useCatalogList<ModeloItem>(`/api/catalogos/modelos${INACTIVOS}`)

  const {
    items: arrendadores,
    loading: loadingArrendadores,
    error: errorArrendadores,
    refetch: refetchArrendadores,
  } = useCatalogList<ItemSimple>(`/api/catalogos/arrendadores${INACTIVOS}`)

  const marcasMap = Object.fromEntries(marcas.map((m) => [m.id, m.nombre]))

  // Edit dialog
  type EditKind = "tipo" | "marca" | "modelo" | "arrendador"
  const [editOpen, setEditOpen] = useState(false)
  const [editKind, setEditKind] = useState<EditKind>("tipo")
  const [editId, setEditId] = useState("")
  const [editNombre, setEditNombre] = useState("")
  const [editMarcaId, setEditMarcaId] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function openEdit(kind: EditKind, id: string, nombre: string, marcaId?: string) {
    setEditKind(kind)
    setEditId(id)
    setEditNombre(nombre)
    setEditMarcaId(marcaId ?? "")
    setEditError(null)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    const nombre = editNombre.trim()
    if (!nombre) return
    setEditSubmitting(true)
    setEditError(null)
    try {
      const path =
        editKind === "tipo"
          ? `/api/catalogos/tipos-equipo/${editId}`
          : editKind === "marca"
            ? `/api/catalogos/marcas/${editId}`
            : editKind === "modelo"
              ? `/api/catalogos/modelos/${editId}`
              : `/api/catalogos/arrendadores/${editId}`
      const body: { nombre: string; marca_id?: string } = { nombre }
      if (editKind === "modelo" && editMarcaId) body.marca_id = editMarcaId
      await apiPatch(path, body)
      setEditOpen(false)
      if (editKind === "tipo") refetchTipos()
      else if (editKind === "marca") refetchMarcas()
      else if (editKind === "modelo") refetchModelos()
      else refetchArrendadores()
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Error")
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleToggleActivo(
    kind: EditKind,
    id: string,
    activoActual: number
  ) {
    const nuevo = activoActual === 1 ? 0 : 1
    const path =
      kind === "tipo"
        ? `/api/catalogos/tipos-equipo/${id}`
        : kind === "marca"
          ? `/api/catalogos/marcas/${id}`
          : kind === "modelo"
            ? `/api/catalogos/modelos/${id}`
            : `/api/catalogos/arrendadores/${id}`
    try {
      await apiPatch(path, { activo: nuevo })
      if (kind === "tipo") refetchTipos()
      else if (kind === "marca") refetchMarcas()
      else if (kind === "modelo") refetchModelos()
      else refetchArrendadores()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error")
    }
  }

  // Form state
  const [newNombre, setNewNombre] = useState("")
  const [newModeloMarcaId, setNewModeloMarcaId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    setSubmitError(null)
  }, [activeTab])

  async function handleCreateTipo() {
    const nombre = newNombre.trim()
    if (!nombre) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await apiPost("/api/catalogos/tipos-equipo", { nombre })
      setNewNombre("")
      refetchTipos()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateMarca() {
    const nombre = newNombre.trim()
    if (!nombre) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await apiPost("/api/catalogos/marcas", { nombre })
      setNewNombre("")
      refetchMarcas()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateModelo() {
    const nombre = newNombre.trim()
    if (!nombre || !newModeloMarcaId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await apiPost("/api/catalogos/modelos", { marca_id: newModeloMarcaId, nombre })
      setNewNombre("")
      refetchModelos()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateArrendador() {
    const nombre = newNombre.trim()
    if (!nombre) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await apiPost("/api/catalogos/arrendadores", { nombre })
      setNewNombre("")
      refetchArrendadores()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Los cambios se guardan en la base maestra (Pintacomex) y se replican al resto de empresas.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="tipos">Tipos</TabsTrigger>
          <TabsTrigger value="marcas">Marcas</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="arrendadores">Arrendadores</TabsTrigger>
        </TabsList>

        <TabsContent value="tipos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Tipos de equipo</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nuevo tipo (ej. Tintométrico)"
                  value={activeTab === "tipos" ? newNombre : ""}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button size="sm" onClick={handleCreateTipo} disabled={submitting || !newNombre.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {submitError && <p className="text-sm text-destructive mb-2">{submitError}</p>}
              {loadingTipos ? (
                <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</p>
              ) : errorTipos ? (
                <p className="text-destructive">{errorTipos}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Id</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tipos.map((t) => {
                      const activo = t.activo ?? 1
                      return (
                        <TableRow key={t.id} className={activo === 0 ? "opacity-60" : ""}>
                          <TableCell className="font-mono text-muted-foreground">{t.id}</TableCell>
                          <TableCell>{t.nombre}</TableCell>
                          <TableCell>{activo === 1 ? "Sí" : "No"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit("tipo", t.id, t.nombre)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleToggleActivo("tipo", t.id, activo)} title={activo === 1 ? "Desactivar" : "Activar"}>
                                {activo === 1 ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-green-600" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {tipos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center">No hay tipos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marcas" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Marcas de equipo</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nueva marca"
                  value={activeTab === "marcas" ? newNombre : ""}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button size="sm" onClick={handleCreateMarca} disabled={submitting || !newNombre.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {submitError && <p className="text-sm text-destructive mb-2">{submitError}</p>}
              {loadingMarcas ? (
                <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</p>
              ) : errorMarcas ? (
                <p className="text-destructive">{errorMarcas}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Id</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marcas.map((m) => {
                      const activo = m.activo ?? 1
                      return (
                        <TableRow key={m.id} className={activo === 0 ? "opacity-60" : ""}>
                          <TableCell className="font-mono text-muted-foreground">{m.id}</TableCell>
                          <TableCell>{m.nombre}</TableCell>
                          <TableCell>{activo === 1 ? "Sí" : "No"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit("marca", m.id, m.nombre)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleToggleActivo("marca", m.id, activo)} title={activo === 1 ? "Desactivar" : "Activar"}>
                                {activo === 1 ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-green-600" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {marcas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center">No hay marcas</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modelos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Modelos de equipo</CardTitle>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Marca</Label>
                  <select
                    value={newModeloMarcaId}
                    onChange={(e) => setNewModeloMarcaId(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[140px]"
                  >
                    <option value="">Selecciona marca</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <Input
                  placeholder="Nombre del modelo"
                  value={activeTab === "modelos" ? newNombre : ""}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="max-w-[180px]"
                />
                <Button size="sm" onClick={handleCreateModelo} disabled={submitting || !newNombre.trim() || !newModeloMarcaId}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {submitError && <p className="text-sm text-destructive mb-2">{submitError}</p>}
              {loadingModelos ? (
                <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</p>
              ) : errorModelos ? (
                <p className="text-destructive">{errorModelos}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Id</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelos.map((mo) => {
                      const activo = mo.activo ?? 1
                      return (
                        <TableRow key={mo.id} className={activo === 0 ? "opacity-60" : ""}>
                          <TableCell className="font-mono text-muted-foreground">{mo.id}</TableCell>
                          <TableCell>{marcasMap[mo.marca_id] ?? mo.marca_id}</TableCell>
                          <TableCell>{mo.nombre}</TableCell>
                          <TableCell>{activo === 1 ? "Sí" : "No"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit("modelo", mo.id, mo.nombre, mo.marca_id)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleToggleActivo("modelo", mo.id, activo)} title={activo === 1 ? "Desactivar" : "Activar"}>
                                {activo === 1 ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-green-600" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {modelos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground text-center">No hay modelos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arrendadores" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Arrendadores</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nuevo arrendador"
                  value={activeTab === "arrendadores" ? newNombre : ""}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button size="sm" onClick={handleCreateArrendador} disabled={submitting || !newNombre.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {submitError && <p className="text-sm text-destructive mb-2">{submitError}</p>}
              {loadingArrendadores ? (
                <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</p>
              ) : errorArrendadores ? (
                <p className="text-destructive">{errorArrendadores}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Id</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrendadores.map((a) => {
                      const activo = a.activo ?? 1
                      return (
                        <TableRow key={a.id} className={activo === 0 ? "opacity-60" : ""}>
                          <TableCell className="font-mono text-muted-foreground">{a.id}</TableCell>
                          <TableCell>{a.nombre}</TableCell>
                          <TableCell>{activo === 1 ? "Sí" : "No"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit("arrendador", a.id, a.nombre)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleToggleActivo("arrendador", a.id, activo)} title={activo === 1 ? "Desactivar" : "Activar"}>
                                {activo === 1 ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-green-600" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {arrendadores.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center">No hay arrendadores</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar {editKind === "tipo" ? "tipo de equipo" : editKind === "marca" ? "marca" : editKind === "modelo" ? "modelo" : "arrendador"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Nombre"
              />
            </div>
            {editKind === "modelo" && (
              <div className="space-y-2">
                <Label>Marca</Label>
                <select
                  value={editMarcaId}
                  onChange={(e) => setEditMarcaId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Selecciona marca</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSubmitting || !editNombre.trim()}>
              {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
