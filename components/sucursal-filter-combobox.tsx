"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Building2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ColorCenter } from "@/lib/types"

interface SucursalFilterComboboxProps {
  value: string
  onValueChange: (value: string) => void
  colorCenters: ColorCenter[]
  placeholder?: string
  triggerClassName?: string
}

export function SucursalFilterCombobox({
  value,
  onValueChange,
  colorCenters,
  placeholder = "Sucursal",
  triggerClassName,
}: SucursalFilterComboboxProps) {
  const [open, setOpen] = useState(false)

  const selected = value === "all" ? null : colorCenters.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 justify-between font-normal min-w-[200px]",
            !selected && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selected ? `${selected.nombre_sucursal} (${selected.codigo_interno})` : "Todas las sucursales"}
            </span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar sucursal por nombre o código..." />
          <CommandList>
            <CommandEmpty>No hay sucursales que coincidan.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="todas las sucursales"
                onSelect={() => {
                  onValueChange("all")
                  setOpen(false)
                }}
              >
                Todas las sucursales
              </CommandItem>
              {colorCenters.map((cc) => (
                <CommandItem
                  key={cc.id}
                  value={`${cc.nombre_sucursal} ${cc.codigo_interno}`}
                  onSelect={() => {
                    onValueChange(cc.id)
                    setOpen(false)
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
  )
}
