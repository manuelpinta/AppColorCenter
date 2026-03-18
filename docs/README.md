# Documentación – Color Center Management

Índice de la documentación del proyecto. Variables de entorno: ver **.env.example** en la raíz (no versionar `.env` ni archivos con credenciales).

---

## Bases de datos

| Archivo | Uso |
|---------|-----|
| **database-schema.md** | Modelo de datos: tablas, relaciones, bases por empresa y bases comun (sucursales). |
| **schema.sql** | DDL para crear una base Color Center desde cero (por empresa). |
| **schema-fase2.sql** | Ejecutar después de schema.sql: columnas/tablas adicionales por empresa (mantenimientos, marca_tipo_equipo, seed). Login/usuarios están en Auth0. |
| **schema-base-comun.md** | Modelo de la base común (empresas y tablas opcionales). Usuarios/login en Auth0. |
| **schema-base-comun.sql** | DDL para la base común (empresas, etc.). Usuarios/login en Auth0. |

**Orden típico:** Base por empresa → schema.sql, luego schema-fase2.sql. Base común → schema-base-comun.sql.

---

## Login y Auth0

| Archivo | Uso |
|---------|-----|
| **Auth0.md** | Documento maestro de Auth0: configuración base, variables de entorno, roles y Organizations por empresa. |

---

## Fases y diseño

| Archivo | Uso |
|---------|-----|
| **FASE1.md** | Alcance y estado Fase 1 (multi-DB, comun, equipos). |
| **FASE2.md** | Estado y plan Fase 2 (catálogos, auth, subzonas). |

---

## Operación y código

| Archivo | Uso |
|---------|-----|
| **RENDIMIENTO-Y-CONEXIONES-MYSQL.md** | Pools, timeouts, cache, variables de entorno. |

---

## Manual de usuario

| Archivo | Uso |
|---------|-----|
| **MANUAL-USUARIO.md** | Manual de uso: cómo hacer cada cosa (subir equipo, mover equipo, registrar mantenimiento, reportar incidencia, etc.) con rutas y pasos. |

---

## Resumen rápido

- **Montar bases:** schema.sql + schema-fase2.sql (por empresa); schema-base-comun.sql si usas base común (empresas, etc.).
- **Login y permisos:** Auth0 (ver `Auth0.md`).
- **Lentitud o conexiones:** `RENDIMIENTO-Y-CONEXIONES-MYSQL.md`.

## Documentos por tipo

- **Imprescindibles:** `README.md` (este índice), `database-schema.md`, `.env.example`, `schema.sql`, `schema-base-comun.sql` si usas base común.
- **Login/seguridad:** `Auth0.md`.
- **Referencia de uso:** `MANUAL-USUARIO.md` (cómo hacer cada acción).
- **Referencia técnica:** `RENDIMIENTO-Y-CONEXIONES-MYSQL.md`.
- **Fases y criterios:** `FASE1.md`, `FASE2.md`.
- **Opcional:** `schema-base-comun.md` repite en prosa el contenido del DDL `schema-base-comun.sql`.
