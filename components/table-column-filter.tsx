"use client"

import { useState, useMemo } from "react"
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
  /** Etiqueta de la columna */
  label: string
  /** Valores únicos que aparecen en la columna (opciones del filtro) */
  options: { value: T; label: string }[]
  /** Valores actualmente seleccionados (null = todos). Si el set está vacío, se muestran 0 filas. */
  selected: Set<T> | null
  onSelectedChange: (selected: Set<T> | null) => void
  /** Placeholder del buscador dentro del popover */
  searchPlaceholder?: string
  /** Clase para el trigger (icono) */
  triggerClassName?: string
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

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const term = search.trim().toLowerCase()
    return options.filter(
      (o) => o.label.toLowerCase().includes(term) || String(o.value).toLowerCase().includes(term)
    )
  }, [options, search])

  const allSelected = selected === null || selected.size === options.length
  const active = selected !== null && selected.size > 0 && selected.size < options.length
  const selectedLabels = useMemo(
    () => (selected ? options.filter((o) => selected.has(o.value)).map((o) => o.label) : []),
    [options, selected]
  )

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      onSelectedChange(null)
    } else {
      onSelectedChange(new Set())
    }
  }

  const handleToggleOne = (value: T, checked: boolean) => {
    const next = new Set(selected ?? options.map((o) => o.value))
    if (checked) next.add(value)
    else next.delete(value)
    if (next.size === 0) onSelectedChange(new Set())
    else if (next.size === options.length) onSelectedChange(null)
    else onSelectedChange(next)
  }

  const isChecked = (value: T) => selected === null || selected.has(value)

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
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onSelectedChange(null))}
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
        <div className="max-h-[280px] overflow-y-auto p-2">
          <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50">
            <Checkbox
              checked={allSelected}
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
        </div>
        {active && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-muted-foreground"
              onClick={() => {
                onSelectedChange(null)
                setOpen(false)
              }}
            >
              Limpiar filtro
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
