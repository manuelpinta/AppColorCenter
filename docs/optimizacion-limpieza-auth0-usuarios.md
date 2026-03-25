# Optimización y limpieza: Auth0 vs tabla `usuarios`

## Objetivo

Cuando alguien hace una acción **estando autenticado**, el registro en base debe reflejar **quién** la hizo: idealmente el **identificador estable de Auth0** (`sub`) y, para pantallas y reportes, un **nombre visible** (nombre o email de la sesión).

Auth0 sigue siendo la **fuente de verdad** de identidad y roles. La tabla `usuarios` en MySQL no pretende reemplazar a Auth0; sirve como **puente local** para claves foráneas (`INT`) y para mostrar nombres sin llamar a la API de Auth0 en cada lectura.

---

## Modelo recomendado (puente local)

| Concepto | Dónde vive |
|----------|------------|
| Login, sesión, roles RBAC | Auth0 |
| Quién creó/editó un mantenimiento, quién reportó una incidencia, etc. | Fila en `usuarios` con `auth0_sub` = `session.user.sub`, `nombre`/`email` rellenados desde la sesión la primera vez que se necesita |
| Consultas y FKs en tablas de negocio | `reportado_por_id`, `tecnico_id`, `registrado_por_id`, `responsable_id` → `usuarios.id` |

Flujo en servidor (API Route o Server Action):

1. `session = await auth0.getSession()` (si no hay sesión → 401 o no permitir escritura).
2. `usuarioLocalId = await getOrCreateUsuarioFromAuth0(pool, { sub, name, email })`.
3. Persistir el negocio usando `usuarioLocalId` donde corresponda.

La función `getOrCreateUsuarioFromAuth0` en `lib/data/usuarios.ts` ya implementa esto: busca por `auth0_sub`, y si no existe inserta `nombre`, `email`, `auth0_sub`.

---

## Estado actual en el código (revisión)

| Área | Comportamiento | ¿Alineado con el objetivo? |
|------|----------------|----------------------------|
| **Mantenimientos** (`POST` / `PATCH` en `app/api/mantenimientos/`) | Obtiene sesión Auth0 y `getOrCreateUsuarioFromAuth0` → `tecnico_id` cuando es interno | Sí |
| **Incidencias** (`POST` en `app/api/incidencias/route.ts`) | Llama a `crearIncidencia` **sin** `reportado_por_id` → en datos cae en `getDefaultUsuarioId` (primer usuario activo de la tabla) | **No**: el reporte no queda atado al usuario logueado |
| **Equipos** (`POST` en `app/api/equipos/`) | No hay campo de “creado por” en el flujo revisado | N/A salvo que se añada auditoría |
| **Movimientos de equipo** (si existen en API) | Esquema tiene `registrado_por_id` → verificar que la API use Auth0 igual que mantenimientos | Revisar cuando se use |
| **Sucursales / `responsable_id`** | JOIN a `usuarios` para mostrar nombre; asignación manual o futura pantalla | Definir si el responsable se elige en UI o se deriva |

---

## Plan por fases

### Fase 1 — Comportamiento correcto en escrituras (prioridad alta)

1. **Incidencias:** En `POST /api/incidencias`, tras `userCanWrite()`, obtener sesión Auth0 y pasar a `crearIncidencia` un `reportado_por_id` resuelto con `getOrCreateUsuarioFromAuth0`. Si no hay sesión (no debería ocurrir en rutas protegidas), devolver 401 en lugar de usar `getDefaultUsuarioId`.
2. **Centralizar:** Extraer un helper pequeño (por ejemplo `requireUsuarioLocalFromSession(pool)` o `getSessionUserOrThrow()`) usado por incidencias y mantenimientos para no duplicar el mapeo `session.user` → identidad.
3. **Auditoría rápida:** Buscar en `app/api/**` otros `POST`/`PATCH`/`DELETE` que deban registrar actor y aún no usen Auth0.

### Fase 2 — Limpieza de datos y semillas

1. **Seeds legacy** (`docs/schema.sql` sección 5, usuarios tipo “Editor …” sin `auth0_sub`): documentar que son **solo demo** o eliminarlos en entornos nuevos si la app ya no depende de ellos para permisos (los permisos reales vienen de Auth0).
2. **Filas huérfanas:** Usuarios creados solo por pruebas manuales; decidir si se marcan `activo = 0` o se consolidan por `auth0_sub` al migrar.
3. **`getDefaultUsuarioId`:** Reservarlo solo para scripts o casos sin sesión (importaciones batch); evitar usarlo en APIs detrás de login.

### Fase 3 — Esquema opcional (solo si lo necesitáis)

1. **Columnas redundantes en `usuarios`:** `rol`, `empresa_id`, `zona_ids` en tabla local pueden quedar como legacy si todo viene de Auth0; valorar deprecar en documentación y dejar de escribirlas desde la app.
2. **Denormalizar nombre para historial:** Si cambia el nombre en Auth0, las filas antiguas en `usuarios` siguen mostrando el nombre del primer login; si hace falta “nombre al momento del hecho”, valorar columnas de auditoría en tablas de negocio o actualizar `usuarios.nombre` en cada login (trade-off simple).

### Fase 4 — Observabilidad

1. Log estructurado en APIs de escritura: `auth0_sub` (o hash) + entidad + id para trazabilidad sin depender solo de MySQL.

---

## Resumen ejecutivo

- **No hace falta** duplicar toda la gestión de usuarios en MySQL: **Auth0 manda** para autenticación y autorización.
- **Sí hace falta** una fila local por usuario que toca datos con FKs: eso es **`usuarios` + `auth0_sub`**, creada automáticamente al primer acto.
- **Prioridad inmediata:** que **incidencias** (y cualquier otra API similar) usen la misma lógica que **mantenimientos**, para que “lo que hago logueado” quede asociado a **mi** `sub` y nombre en base.

---

## Referencias en el repo

- Sesión: `lib/auth0.ts`, rutas API con `auth0.getSession()`.
- Puente usuario local: `lib/data/usuarios.ts` — `getOrCreateUsuarioFromAuth0`, `getNombreUsuarioById`.
- Ejemplo ya correcto: `app/api/mantenimientos/route.ts`, `app/api/mantenimientos/[id]/route.ts`.
- Pendiente de alinear: `app/api/incidencias/route.ts` + `lib/data/incidencias.ts` (`crearIncidencia` / `getDefaultUsuarioId`).
