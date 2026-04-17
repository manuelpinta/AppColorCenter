"use client"

import { useState, useMemo, useLayoutEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface TableColumnFilterProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  /** Valor aplicado: null = sin filtro (todos). Set parcial = solo esos. */
  selected: Set<T> | null
  onSelectedChange: (selected: Set<T> | null) => void
  searchPlaceholder?: string
  triggerClassName?: string
}

function normalizeCommit<T extends string>(
  draft: Set<T> | null,
  allValues: T[]
): Set<T> | null {
  if (draft === null) return null
  if (draft.size === 0 || draft.size === allValues.length) return null
  return new Set(draft)
}

export function TableColumnFilter<T extends string>({
  label,
  options,
  selected,
  onSelectedChange,
  searchPlaceholder = "Buscar...",
  triggerClassName,
}: TableColumnFilterProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  /** Borrador: null = todos marcados; Set vacío = ninguno marcado (al aplicar → sin filtro / ver todo). */
  const [draft, setDraft] = useState<Set<T> | null>(null)

  const allValues = useMemo(() => options.map((o) => o.value), [options])

  useLayoutEffect(() => {
    if (!open) return
    setDraft(selected === null ? null : new Set(selected))
    setSearch("")
  }, [open, selected])

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const term = search.trim().toLowerCase()
    return options.filter(
      (o) => o.label.toLowerCase().includes(term) || String(o.value).toLowerCase().includes(term)
    )
  }, [options, search])

  const draftAllSelected =
    draft === null || (draft !== null && draft.size === options.length)
  const draftPartial =
    draft !== null && draft.size > 0 && draft.size < options.length

  const active =
    selected !== null &&
    selected.size > 0 &&
    selected.size < options.length
  const selectedLabels = useMemo(
    () =>
      selected
        ? options.filter((o) => selected.has(o.value)).map((o) => o.label)
        : [],
    [options, selected]
  )

  const handleToggleAll = (checked: boolean) => {
    if (checked) setDraft(null)
    else setDraft(new Set())
  }

  const handleToggleOne = (value: T, checked: boolean) => {
    const base =
      draft === null ? (new Set(allValues) as Set<T>) : new Set(draft)
    if (checked) base.add(value)
    else base.delete(value)
    if (base.size === 0) setDraft(new Set())
    else if (base.size === options.length) setDraft(null)
    else setDraft(base)
  }

  const isChecked = (value: T) =>
    draft === null || (draft !== null && draft.has(value))

  const applyDraft = () => {
    if (draft === null) {
      onSelectedChange(null)
    } else {
      onSelectedChange(normalizeCommit(draft, allValues))
    }
    setOpen(false)
  }

  const cancelDraft = () => {
    setOpen(false)
  }

  const clearFilterNow = () => {
    onSelectedChange(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-1 shrink-0",
            active && "text-primary",
            triggerClassName
          )}
          title={`Filtrar por ${label}`}
        >
          <Filter className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
          {active && selectedLabels.length > 0 && (
            <span className="flex items-center gap-1 max-w-[120px]">
              <Badge
                variant="secondary"
                className="font-normal text-xs py-0 px-1.5 gap-0.5 bg-primary/10 text-primary border-primary/20"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedLabels.length <= 2
                  ? selectedLabels.join(", ")
                  : `${selectedLabels.length} valores`}
              </Badge>
              <span
                role="button"
                tabIndex={0}
                className="rounded p-0.5 hover:bg-muted"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelectedChange(null)
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), onSelectedChange(null))
                }
                aria-label="Quitar filtro"
              >
                <X className="h-3 w-3" />
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[240px] overflow-y-auto p-2">
          {open && (
            <>
              <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50">
                <Checkbox
                  checked={
                    draftAllSelected ? true : draftPartial ? "indeterminate" : false
                  }
                  onCheckedChange={(c) => handleToggleAll(!!c)}
                />
                <span className="text-sm font-medium">Todos ({options.length})</span>
              </div>
              {filteredOptions.map((opt) => (
                <div
                  key={String(opt.value)}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={isChecked(opt.value)}
                    onCheckedChange={(c) => handleToggleOne(opt.value, !!c)}
                  />
                  <span className="text-sm truncate">{opt.label}</span>
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Sin coincidencias</p>
              )}
            </>
          )}
        </div>
        <div className="p-2 border-t flex flex-col gap-2">
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={cancelDraft}
            >
              Cancelar
            </Button>
            <Button type="button" size="sm" className="flex-1" onClick={applyDraft}>
              Aplicar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center px-1">
            Aplicar confirma los cambios; Cancelar cierra sin cambiar el filtro activo.
          </p>
          {active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-8 text-muted-foreground"
              onClick={clearFilterNow}
            >
              Quitar filtro (mostrar todo)
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
