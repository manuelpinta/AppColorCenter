# Estado UI y diseño

Resumen de decisiones de interfaz y diseño aplicadas en la app (móvil y escritorio). Sirve como referencia para mantener coherencia.

---

## Tokens globales (globals.css)

- **Fondo de página (light):** `--background: oklch(0.985 0.004 247)` (gris muy suave) para que las tarjetas blancas destaquen.
- **Radio de borde:** `--radius: 0.75rem` (esquinas más redondeadas).
- **Tarjetas:** Componente base con `rounded-2xl`, borde sutil `border-border/80`. Listas usan `.card-elevated` (sombra suave + hover).

---

## Móvil

- **Cabeceras de página:** Título `text-xl lg:text-3xl`, subtítulo `text-xs lg:text-base` para ahorrar espacio.
- **Resumen en cuadros (Dashboard, Sucursales):** En móvil una sola franja con scroll horizontal (`snap-x`, cards con ancho fijo); en escritorio grid sin scroll.
- **Filtros:** En listas (Dashboard, Sucursales) botón "Filtros" visible solo en móvil (`md:hidden`) que abre Sheet desde abajo con Empresa y Región (checkboxes). Misma lógica que los filtros de columna en tabla.
- **Touch targets:** Botones y controles táctiles con `min-h-[44px]` en móvil (paginación, Limpiar filtros, acciones principales).
- **Detalle de equipo:** Header con `bg-muted/40`, borde inferior y `rounded-b-2xl` en móvil; botón "Volver" con ícono en caja; acciones (Editar, Mover, Nuevo Mantenimiento) en columna a ancho completo.

---

## Navegación

- **Sidebar (escritorio):** Zona del logo con `bg-primary/[0.04]`; ícono con `ring-2 ring-primary/20`.
- **Barra inferior (móvil):** Enlaces con `title` y `aria-label` con el nombre completo. Admin catálogos no aparece en el menú; accesible por URL `/admin/catalogos`.

---

## Reportes

- Ruta `/reportes` muestra mensaje de que el tablero de BI está desactivado; sin contenido previo. Redirección al BI cuando corresponda.
