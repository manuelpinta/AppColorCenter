"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Barra fina en la parte superior que se muestra al cambiar de ruta.
 * Refuerza que la app está cargando y reduce la sensación de "no pasa nada" al hacer clic.
 */
export function GlobalLoadingBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1500)
    return () => clearTimeout(t)
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/90 animate-pulse"
      role="progressbar"
      aria-valuenow={null}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Cargando"
    />
  )
}
