# Plan de mejora UX/UI móvil — Color Center Management

Documento crítico de experiencia móvil. Objetivo: identificar mejoras concretas y priorizarlas para que la app sea cómoda, clara y usable en smartphone.

---

## Estado de implementación

**Implementado (según este plan):** Filtros en móvil (Sheet Empresa/Región en Dashboard y Sucursales), touch targets ≥44px (paginación, botones, Limpiar filtros), toggle lista/grid oculto en móvil en Dashboard, jerarquía en tarjetas de sucursal y equipo (nombre destacado, línea secundaria), KPIs con `text-xs` y desglose oculto en móvil, cabeceras compactas en móvil (títulos `text-xl lg:text-3xl`), barra inferior con `aria-label`/`title`, empty states en listas, resumen en cuadros como franja horizontal con scroll en móvil (Dashboard y Sucursales), tarjetas con borde y sombra (`.card-elevated`), header del detalle de equipo en móvil con fondo y borde. Ver también **docs/README.md** → "UI y diseño".

---

## 1. Resumen ejecutivo

La app ya tiene bases sólidas: viewport con `viewportFit: cover`, safe area en la barra inferior, padding para no quedar bajo el nav, y enlaces de tarjeta completos. Pero hay **gaps importantes** (filtros inexistentes en móvil, redundancia list/grid, touch targets justos, jerarquía visual y carga cognitiva) que justifican un plan dedicado a móvil.

---

## 2. Crítica por zona (Dashboard como referencia)

### 2.1 Cabecera de página

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Título + subtítulo | Ocupan mucho vertical | En móvil cada px cuenta. "Dashboard" + "Vista general de sucursales y equipos" podrían ser una sola línea o el subtítulo colapsar en vista pequeña. |
| Sticky | No | Si el usuario hace scroll, pierde el contexto. Valorar header sticky en móvil (solo título o título + búsqueda). |

**Mejoras sugeridas:**
- En viewport pequeño: título más compacto (p. ej. `text-xl`) o subtítulo opcional/colapsable.
- Opcional: header sticky con título + barra de búsqueda al hacer scroll.

---

### 2.2 Tarjetas KPI (cuadrícula 2×2)

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Grid 2×2 | Correcto | Buen uso del espacio en móvil. |
| Legibilidad | Regular | Texto secundario en `text-xs` y `text-[10px]` (p. ej. "Tint.: 2") puede costar leer en pantallas pequeñas o con poca luz. |
| Densidad | Alta | Mucha información en cada tarjeta (valor, subtítulo, desglose por tipo). En móvil puede abrumar. |
| Iconos | Bien | Iconos con color semántico (verde/ámbar/rojo) ayudan a escanear. |

**Mejoras sugeridas:**
- Evitar `text-[10px]` en KPIs; usar como mínimo `text-xs` y, si sobra espacio, reducir cantidad de texto (p. ej. no mostrar desglose por tipo en móvil, o solo en expansión).
- Asegurar contraste suficiente (WCAG) en "2 de 2 equipos", "equipos afectados", "Próximos 30 días".
- Opcional: en móvil mostrar solo número + etiqueta corta en cada KPI y mover el detalle a un toque o a una segunda línea colapsable.

---

### 2.3 Búsqueda

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Altura táctil | Bien | `min-h-[44px]` cumple recomendaciones de touch target. |
| Placeholder | Claro | "Buscar sucursal o código..." está bien. |
| Ancho | Full width | Aprovecha bien el ancho en móvil. |

**Mejora menor:** Mantener focus visible (outline/ring) para accesibilidad y uso con teclado virtual.

---

### 2.4 Filtros (Empresa / Región) — Crítico

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Disponibilidad en móvil | **No existe** | Los filtros por Empresa y Región solo están en la cabecera de la **tabla** (desktop). En vista móvil solo hay lista de tarjetas y búsqueda. |
| Consecuencia | Grave | Con muchas sucursales (p. ej. 201), el usuario en móvil no puede filtrar por empresa o región sin cambiar de vista o dispositivo. |

**Mejoras obligatorias:**
- Añadir un punto de entrada a filtros en móvil: botón "Filtros" (o chip "Empresa / Región") que abra un **drawer/sheet** con los mismos criterios (Empresa, Región) que en desktop.
- Mostrar filtros activos en forma de chips bajo la búsqueda (igual que en desktop) y permitir quitar desde ahí.
- Mantener la misma lógica de filtrado que en la tabla (empresa, región, etc.) para consistencia.

---

### 2.5 Contador y cambio de vista (lista / cuadrícula)

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Texto "Mostrando X de Y" | Útil | Bien para contexto. |
| Toggle lista/cuadrícula | Redundante en móvil | En el código, en viewport pequeño la cuadrícula es `grid-cols-1`; es decir, **lista y cuadrícula se ven igual** (una columna). El usuario no gana nada al cambiar de modo. |
| Tamaño de botones | Justo | Botones con `h-8` están por debajo de los 44px recomendados para touch. |

**Mejoras sugeridas:**
- En móvil: ocultar el toggle lista/cuadrícula, o en su lugar ofrecer **solo lista** (más predecible para listas largas).
- Si se mantiene el toggle: aumentar altura de los botones a `min-h-[44px]` en móvil.
- Opcional: en móvil usar 2 columnas para la vista "grid" (`grid-cols-2` en base, `md:grid-cols-2`…) para que el cambio de vista tenga sentido.

---

### 2.6 Lista de sucursales (tarjetas)

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Área de toque | Bien | Toda la tarjeta es un `Link`; target amplio. |
| Jerarquía | Mejorable | Nombre, código, empresa/región y "X equipos" compiten visualmente. No queda claro cuál es el dato principal (nombre de sucursal) en un vistazo. |
| Chevron | Bien | Indica que es navegable. |
| Densidad | Aceptable | `p-4` está bien; no apretar más en móvil. |

**Mejoras sugeridas:**
- Reforzar jerarquía: nombre de sucursal en una sola línea, más grande y peso mayor; código y ubicación en línea secundaria; "X equipos" alineado a la derecha o debajo con estilo más sutil.
- Evitar truncado excesivo del nombre; si se trunca, mostrar tooltip o atributo `title` (ya se hace en desktop en otros sitios; revisar aquí).

---

### 2.7 Paginación

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| En móvil | Solo Anterior / Siguiente | Los números de página están ocultos (`hidden sm:flex`); bien para no saturar. |
| Botones | Altura `h-9` (~36px) | Por debajo de 44px; en móvil es preferible `min-h-[44px]`. |
| Texto "Pagina X de Y" | Útil | Podría acortarse en móvil (p. ej. "Pág. 1/11") si falta espacio. |

**Mejoras sugeridas:**
- Aumentar altura táctil de Anterior/Siguiente en móvil (`min-h-[44px]`).
- Valorar "Cargar más" o infinite scroll en móvil en lugar de paginación clásica, para reducir scroll hacia abajo y clics.

---

### 2.8 Barra de navegación inferior

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Safe area | Bien | Clase `safe-area-inset-bottom` aplicada. |
| Altura / touch | Bien | `min-h-[56px]`, `min-w-[44px]`, `touch-manipulation`. |
| Cantidad de ítems | Alta | 6 ítems (Inicio, Sucur., Equipos, Manten., Incid., Report.) saturan la barra; etiquetas muy cortas ("Sucur.", "Manten.", "Incid.", "Report.) pueden no ser claras para todos. |
| Iconos | Consistentes | Coinciden con los de las tarjetas del dashboard. |

**Mejoras sugeridas:**
- Valorar agrupar 1–2 ítems en "Más" (por ejemplo Manten. + Incid. + Report.) para dejar 4 ítems principales y ganar claridad.
- Si se mantienen los 6: asegurar que las etiquetas cortas tengan `title`/aria-label con el nombre completo para accesibilidad.
- Revisar contraste del ítem activo (azul) frente al fondo en modo claro/oscuro.

---

### 2.9 Espacio y scroll

| Aspecto | Estado | Crítica |
|--------|--------|--------|
| Padding inferior | Bien | `pb-20` evita que el contenido quede bajo la barra inferior. |
| Contenedor | `max-w-7xl` centrado | En móvil el ancho es el de la pantalla; correcto. |
| Scroll largo | Posible | 20 ítems por página pueden hacer el scroll largo; combinado con KPIs + búsqueda + filtros futuros, la página puede ser alta. Sticky del header ayudaría. |

**Mejora:** Añadir padding inferior extra en contenedores principales si hay dispositivos con gesture bar (`env(safe-area-inset-bottom)` ya considerado en la barra; revisar que el contenido no quede pegado al borde).

---

## 3. Otras pantallas (consideraciones breves)

- **Formularios (ej. equipo, mantenimiento):** Ya se usan `min-h-[44px]` y `touch-manipulation` en varios botones; extender este patrón a todos los controles interactivos en móvil.
- **Tablas:** En móvil se sustituyen por tarjetas; mantener este patrón en todas las listas (equipos, mantenimientos, incidencias).
- **Modales / sheets:** Si se añaden filtros o acciones secundarias en móvil, preferir bottom sheet o drawer antes que modales centrados (más cómodos con una mano).

---

## 4. Plan de acción priorizado

### P0 — Imprescindible
1. **Filtros en móvil (Dashboard):** Añadir botón/chip "Filtros" que abra un drawer/sheet con filtros por Empresa y Región, y mostrar chips de filtros activos bajo la búsqueda.

### P1 — Alta prioridad
2. **Touch targets:** Unificar botones y controles táctiles a mínimo 44px de altura/ancho en vistas móviles (toggle lista/grid, paginación, y revisar formularios y listas).
3. **Toggle lista/grid en móvil:** Ocultar en viewport pequeño o hacer que la vista "grid" en móvil sea 2 columnas para que el cambio tenga sentido.
4. **Jerarquía en tarjetas de sucursal:** Nombre más destacado; código y "X equipos" más secundarios.

### P2 — Mejora de experiencia
5. **KPIs en móvil:** Subir tamaño mínimo de fuente (evitar `text-[10px]`); opcionalmente simplificar texto en móvil.
6. **Cabecera:** Opción de header compacto o sticky en móvil.
7. **Paginación móvil:** Botones Anterior/Siguiente con `min-h-[44px]`; valorar "Cargar más" o infinite scroll.
8. **Barra inferior:** Revisar si 6 ítems es sostenible; si no, agrupar en "Más" y mejorar labels/aria.

### P3 — Refinamiento
9. **Empty states:** Comprobar mensajes cuando no hay sucursales/equipos en móvil.
10. **Contraste y tipografía:** Revisar WCAG en textos pequeños y en modo oscuro.

---

## 5. Criterios de éxito

- Usuario en móvil puede **filtrar por empresa y región** sin usar la tabla de escritorio.
- **Todos los controles** con interacción táctil ≥ 44px en móvil.
- **Lista de sucursales** con jerarquía clara (nombre destacado, resto secundario).
- **Navegación inferior** comprensible y, si hace falta, agrupada para no saturar.
- Documentar en este archivo las decisiones implementadas (por ejemplo: "Filtros móvil: sheet con Empresa y Región, chips bajo búsqueda") para mantener coherencia en futuras pantallas.

---

*Documento creado como plan de mejora UX/UI móvil. Actualizar al implementar cada bloque.*
