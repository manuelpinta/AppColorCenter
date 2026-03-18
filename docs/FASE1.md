# Fase 1 – Alcance y estado

Resumen de lo implementado en Fase 1 y pendiente para fases posteriores.
.\run-dev.cmd
---

## Incluido en Fase 1

- **Multi-DB:** 5 empresas, cada una con base Color Center (`COLORCENTER_DB_URL_*`) para equipos, incidencias, mantenimientos, movimientos, fotos, catálogos. Login y usuarios en Auth0.
- **Sucursales desde comun:** Por empresa, base comun (`COMUN_DB_URL_*`) con tabla `sucursal`; filtro `FechaTerm = ''` y `SubTipoSuc IN ('S','B','2')`; opcional JOIN con tabla `zonas` (nombre de zona por env).
- **Conexiones:** Pools con keepalive y timeout; retry ante ECONNRESET en lectura de sucursales desde comun; `clearComunPool()` para forzar reconexión.
- **Equipos:** CRUD contra BD (crear, editar, mover); listados y detalle desde Color Center.
- **Incidencias, mantenimientos, movimientos, fotos:** Lectura/escritura contra Color Center.
- **Documentación:** README, `database-schema.md` (incl. bases comun), `docs/README.md` (índice de docs), `.env.example` como plantilla.
- **UI/UX móvil y diseño:** Filtros en Sheet (Dashboard, Sucursales), touch targets 44px, cabeceras compactas, resumen en scroll horizontal, tarjetas con elevación y borde, header del detalle de equipo con fondo en móvil. Ver `docs/PLAN-MOBILE-UX.md` y sección "UI y diseño" en `docs/README.md`.

---

## Pendiente / Fase 2

- **Marcas, modelos, arrendadores en formulario de equipo:** Ya se cargan desde la BD vía API de catálogos; el combobox usa la BD.
- **Alertas por incidencias:** Según `planificacion-funcional.md`, notificar a responsables al reportar incidencia.
- **Reportes avanzados:** Equipos por costo de reparación, obsoletos, arrendamiento próximo a vencer (datos ya existen en el modelo).

---

## Optimizaciones aplicadas (Fase 1)

- Pools MySQL creados con `enableKeepAlive`, `connectTimeout`, `connectionLimit` (evitar conexiones obsoletas y timeouts).
- Retry automático (1 vez) en `getSucursalesFromComun` ante ECONNRESET; limpieza del pool comun para esa empresa antes de reintentar.
- Una sola función `parseMysqlUrl()` en `lib/db.ts` para Color Center y comun (sin duplicar lógica).
