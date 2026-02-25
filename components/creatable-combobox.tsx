"use client"

import { useState, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Plus, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
}

interface CreatableComboboxProps {
  /** Currently selected value (option.value) */
  value: string
  /** Callback when an option is selected */
  onValueChange: (value: string) => void
  /** Available options */
  options: ComboboxOption[]
  /** Callback when creating a new item; should return the new option or null if cancelled */
  onCreateNew?: (name: string) => Promise<ComboboxOption | null> | ComboboxOption | null
  /** Placeholder for the trigger button */
  placeholder?: string
  /** Placeholder for the search input */
  searchPlaceholder?: string
  /** Text for the "add new" button. {search} will be replaced with current search term */
  createLabel?: string
  /** Text to show when no results match */
  emptyText?: string
  /** Whether the combobox is disabled */
  disabled?: boolean
  /** Additional classes for the trigger button */
  className?: string
}

export function CreatableCombobox({
  value,
  onValueChange,
  options,
  onCreateNew,
  placeholder = "Selecciona...",
  searchPlaceholder = "Buscar...",
  createLabel = 'Agregar "{search}"',
  emptyText = "Sin resultados.",
  disabled = false,
  className,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showInlineForm, setShowInlineForm] = useState(false)
  const [newName, setNewName] = useState("")

  const selectedOption = options.find((o) => o.value === value)

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const term = search.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(term))
  }, [options, search])

  const exactMatch = useMemo(() => {
    if (!search.trim()) return true
    return options.some((o) => o.label.toLowerCase() === search.trim().toLowerCase())
  }, [options, search])

  const handleCreate = async (name: string) => {
    if (!onCreateNew || !name.trim()) return
    setIsCreating(true)
    try {
      const newOption = await onCreateNew(name.trim())
      if (newOption) {
        onValueChange(newOption.value)
        setSearch("")
        setNewName("")
        setShowInlineForm(false)
        setOpen(false)
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(""); setShowInlineForm(false); setNewName("") } }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {showInlineForm ? (
          <div className="p-3 space-y-2">
            <p className="text-sm font-medium">Agregar nuevo</p>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCreate(newName)
                } else if (e.key === "Escape") {
                  setShowInlineForm(false)
                  setNewName("")
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!newName.trim() || isCreating}
                onClick={() => handleCreate(newName)}
                className="flex-1"
              >
                {isCreating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Agregar
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowInlineForm(false); setNewName("") }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filteredOptions.length === 0 && !onCreateNew && (
                <CommandEmpty>{emptyText}</CommandEmpty>
              )}
              {filteredOptions.length === 0 && onCreateNew && (
                <CommandEmpty className="py-2 px-3 text-sm text-muted-foreground">{emptyText}</CommandEmpty>
              )}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value === value ? "" : option.value)
                      setSearch("")
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {onCreateNew && !exactMatch && search.trim() && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleCreate(search)}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreating ? (
                      <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Creando...</>
                    ) : (
                      createLabel.replace("{search}", search.trim())
                    )}
                  </CommandItem>
                </CommandGroup>
              )}
              {onCreateNew && (exactMatch || !search.trim()) && (
                <div className="p-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-primary hover:text-primary"
                    onClick={() => {
                      setShowInlineForm(true)
                      setNewName(search)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar nuevo...
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
