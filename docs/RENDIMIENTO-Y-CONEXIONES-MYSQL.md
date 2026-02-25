# Rendimiento y conexiones MySQL

Conexiones, pools, cache, timeouts y comportamiento de la app (listados, filtros, UX de carga).

---

## 1. Resumen

| Concepto | Valor |
|----------|--------|
| Empresas | Hasta 5; cada una con `COLORCENTER_DB_URL_*` y opcionalmente `COMUN_DB_URL_*`. |
| Pools | 1 por empresa (Color Center) + 1 por empresa (comun si existe). Lazy. |
| Conexiones por pool | Por defecto **1** (`MYSQL_POOL_CONNECTION_LIMIT`, `lib/db.ts`). |
| Pico por petición | 5 Color Center + 5 comun = hasta **10** conexiones. |
| Estrategia | Consultas "all bases" en **paralelo**; **timeout 15 s** por empresa; **cache 60 s** en memoria (no se cachea si hubo timeout). |

Varios usuarios comparten los mismos pools; con límite 1 por pool las peticiones se encolan → puede haber sensación de lentitud sin superar conexiones.

---

## 2. Pools y límite de conexiones

- **Color Center:** `COLORCENTER_DB_URL_*`; uso: equipos, mantenimientos, incidencias, catálogos.
- **Comun:** `COMUN_DB_URL_*`; uso: sucursales (getSucursalesFromComun). Mismo `connectionLimit` que Color Center.
- **Archivo:** `lib/db.ts`. Variable `MYSQL_POOL_CONNECTION_LIMIT` (default 1). Subir aumenta pico; evita "Too many connections" mantener bajo salvo que MySQL tenga margen (`SHOW VARIABLES LIKE 'max_connections'`).

---

## 3. Cache, timeout y paralelo

- **Cache** (`lib/data/cache.ts`): Claves `colorCentersAllBases`, `equiposAllBases`, `mantenimientosAllBases`, `incidenciasAllBases`. TTL 60 s solo si ninguna empresa hizo timeout. Variable `ALL_BASES_CACHE_TTL_MS`.
- **Timeout** (`lib/data/timing.ts`): Por empresa 15 s; si se supera, esa empresa devuelve lista vacía y no se cachea. Variable `EMPRESA_QUERY_TIMEOUT_MS`.
- **Paralelo:** Todas las "all bases" usan `Promise.all` (una query por empresa a la vez).

---

## 4. Carga por página

Páginas que consultan todas las bases (Dashboard, Equipos, Sucursales, Mantenimientos, Incidencias, Reportes): hasta 5 conexiones Color Center (+ 5 comun) por petición. Detalle de equipo: 1 empresa, pocas conexiones.

**Varios procesos Node (workers):** Cada proceso tiene sus pools. Conexiones totales ≈ procesos × (5 Color Center + 5 comun) × connectionLimit. Ej.: 4 workers, limit 1 → hasta 40 conexiones; `max_connections` del servidor debe ser mayor.

---

## 5. Variables de entorno

| Variable | Efecto | Default |
|----------|--------|---------|
| `MYSQL_POOL_CONNECTION_LIMIT` | Conexiones máximas por pool | 1 |
| `EMPRESA_QUERY_TIMEOUT_MS` | Timeout por empresa en "all bases" | 15000 |
| `ALL_BASES_CACHE_TTL_MS` | TTL del cache de listados | 60000 |

---

## 6. UX de carga y medición

- **loading.tsx** en rutas con datos pesados; mensaje "Cargando datos de todas las empresas…" y spinner; barra superior al navegar (`global-loading-bar.tsx`).
- **Timing (desarrollo):** Con `NODE_ENV=development` o `QUERY_TIMING=1`, en consola `[timing] <etiqueta>: Xms`. Ver también `docs/QUERIES.md`.

---

## 7. Filtros en Sucursales (resumen)

- Búsqueda por texto en nombre_sucursal, codigo_interno, region (cliente).
- Filtro por empresa (tarjetas); filtros de columnas Empresa/Región/Estado (`table-column-filter.tsx`). Paginación 25 por página; al cambiar filtros se resetea a página 1.

---

## 8. Recomendaciones

1. Mantener `MYSQL_POOL_CONNECTION_LIMIT` bajo (1 o 2) salvo que el servidor tenga margen.
2. Si todas las empresas apuntan al mismo MySQL, ese `max_connections` es el cuello de botella.
3. En producción, vigilar número de workers: más procesos = más conexiones totales.
4. No subir mucho el TTL de cache sin tener en cuenta datos desactualizados.
5. Monitorear: `SHOW STATUS LIKE 'Threads_connected'` y `max_connections`.

---

## 9. Mejoras futuras

- Invalidar cache al crear/editar/eliminar (equipo, sucursal, mantenimiento, incidencia).
- Filtro por empresa: cargar solo esa base cuando se filtre por una empresa.
- Búsqueda y paginación en servidor (SQL) para muchos registros.
