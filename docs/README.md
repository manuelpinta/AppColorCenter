# Documentación – Color Center Management

Índice de la documentación del proyecto. Variables de entorno: ver **.env.example** en la raíz (no versionar `.env` ni archivos con credenciales).

---

## Bases de datos

| Archivo | Uso |
|---------|-----|
| **database-schema.md** | Modelo de datos: tablas, relaciones, bases por empresa y bases comun (sucursales). |
| **schema.sql** | DDL para crear una base Color Center desde cero (por empresa). |
| **schema-fase2.sql** | Ejecutar después de schema.sql: columnas usuarios (empresa_id, zona_ids), mantenimientos, marca_tipo_equipo, seed. |
| **schema-base-comun.md** | Modelo de la base común (empresas, usuarios, opcionales). |
| **schema-base-comun.sql** | DDL para crear las tablas de la base común (login, empresas, usuarios). |

**Orden típico:** Base por empresa → schema.sql, luego schema-fase2.sql. Base común → schema-base-comun.sql.

---

## Login y base común

| Archivo | Uso |
|---------|-----|
| **BASE-COMUN-Y-LOGIN.md** | Flujo de inicio de sesión, tabla usuarios, acceso por empresa, qué hace falta (env, API, sesión). |

---

## Fases y diseño

| Archivo | Uso |
|---------|-----|
| **FASE1.md** | Alcance y estado Fase 1 (multi-DB, comun, equipos). |
| **FASE2.md** | Estado y plan Fase 2 (catálogos, auth, subzonas). |
| **planificacion-funcional.md** | Criterios de diseño (movimientos, incidencias, alertas). |

---

## Operación y código

| Archivo | Uso |
|---------|-----|
| **RENDIMIENTO-Y-CONEXIONES-MYSQL.md** | Pools, timeouts, cache, variables de entorno. |
| **QUERIES.md** | Consultas SQL por módulo (referencia). |
| **ARQUITECTURA-BUNDLE.md** | Por qué `lib/data/ids.ts` y `lib/empresas-config.ts` (evitar MySQL en el bundle cliente). |

---

## Resumen rápido

- **Nuevo en el proyecto:** README raíz + database-schema.md + .env.example.
- **Montar bases:** schema.sql + schema-fase2.sql (por empresa); schema-base-comun.sql (base común).
- **Login y permisos:** BASE-COMUN-Y-LOGIN.md.
- **Lentitud o conexiones:** RENDIMIENTO-Y-CONEXIONES-MYSQL.md.
