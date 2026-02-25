"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortOrder = "asc" | "desc"

interface TableSortHeaderProps {
  label: string
  sortKey: string
  /** null = ningún orden activo (orden por defecto); solo la columna activa muestra flecha */
  currentSortKey: string | null
  currentOrder: SortOrder
  onSort: (key: string) => void
  className?: string
  /** Contenido extra (ej. filtro) que se muestra después del botón de ordenar */
  extra?: React.ReactNode
}

/**
 * Cabecera ordenable: sin flecha por defecto; solo la columna activa muestra ícono.
 * Ciclo: 1º click → Desc, 2º click → Asc, 3º click → Reset (lo gestiona el padre).
 */
export function TableSortHeader({
  label,
  sortKey,
  currentSortKey,
  currentOrder,
  onSort,
  className,
  extra,
}: TableSortHeaderProps) {
  const isActive = currentSortKey === sortKey
  const handleClick = () => onSort(sortKey)

  return (
    <th className={cn("text-left py-3 px-4 font-medium text-muted-foreground", className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "flex items-center gap-1.5 transition-colors group rounded px-1 -mx-1",
            isActive
              ? "text-primary font-semibold"
              : "hover:text-foreground"
          )}
        >
          {label}
          <span
            className={cn(
              "inline-flex shrink-0",
              isActive ? "text-primary" : "text-muted-foreground/0 group-hover:text-muted-foreground"
            )}
          >
            {isActive && currentOrder === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
            {isActive && currentOrder === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
            {!isActive && <ArrowUpDown className="h-3.5 w-3.5" />}
          </span>
        </button>
        {extra}
      </div>
    </th>
  )
}
