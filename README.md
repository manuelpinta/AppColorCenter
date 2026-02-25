# Color Center Management

App para gestión de equipos (tintométricos, mezcladoras, reguladores, equipos de cómputo) en sucursales/Color Centers, con multi-empresa y multi-base de datos.

**Repositorio:** [github.com/manuelpinta/AppColorCenter](https://github.com/manuelpinta/AppColorCenter)

**Stack:** Next.js 15 (App Router), TypeScript, MySQL (mysql2), Tailwind CSS.

---

## Fase 1 – Alcance actual

- **Sucursales:** desde bases **comun** (tabla `sucursal` + opcional `zonas`), filtro `FechaTerm = ''` y `SubTipoSuc IN ('S','B','2')`.
- **Equipos, incidencias, mantenimientos, movimientos, fotos:** bases **Color Center** (una por empresa).
- **Multi-DB:** 5 empresas (Pintacomex, Gallco, Belice, El Salvador, Honduras); cada una con `COLORCENTER_DB_URL_*` y opcionalmente `COMUN_DB_URL_*`.
- **Formulario de equipo:** marcas/modelos/arrendadores se cargan desde la BD vía `/api/catalogos`.

---

## Requisitos

- Node.js 18+
- MySQL 8.0+ (una base Color Center por empresa y, para sucursales, bases comun por empresa)

---

## Instalación y ejecución

```bash
npm install
cp .env.example .env   # luego editar .env con tus URLs y variables
npm run dev            # http://localhost:3000
```

**Build:**

```bash
npm run build
npm start
```

---

## Variables de entorno

Copiar `.env.example` a `.env` y rellenar. Next.js **no** carga `.env.example`; es solo plantilla.

| Variable | Uso |
|----------|-----|
| `COLORCENTER_DB_URL_*` | Una por empresa (PINTACOMEX, GALLCO, BELICE, SALVADOR, HONDURAS). Base donde están equipos, incidencias, mantenimientos, etc. |
| `COMUN_DB_URL_*` | Opcional. Base comun por empresa para sucursales (tabla `sucursal`, opcional `zonas`). |
| `SUCURSALES_TABLE`, `SUCURSALES_ID_COL`, `SUCURSALES_NOMBRE_COL`, `SUCURSALES_ZONA_COL` | Tabla/columnas de sucursal en comun (por defecto: `sucursal`, `num_suc`, `nombre`, `ZonaAsig`). |
| `ZONAS_TABLE`, `ZONAS_JOIN_COL`, `ZONAS_NOMBRE_COL` | Si existe tabla zonas: nombre tabla, columna de join (`NumZona`), columna con nombre de zona (ej. `nomzona`). |

Detalle en `.env.example` y en `docs/database-schema.md`.

---

## Estructura del proyecto

```
app/                 # App Router: páginas y API routes
components/          # UI (formularios, tablas, filtros)
lib/
  db.ts              # Pools MySQL (Color Center + comun), config sucursales/zonas
  data/              # Capa de datos: equipos, sucursales, incidencias, etc.
  types.ts           # Tipos compartidos
docs/
  README.md          # Índice de documentación (qué doc usar para qué)
  database-schema.md # Esquema y arquitectura de datos
  schema.sql        # DDL completo para crear base Color Center
  schema-fase2.sql  # ALTERs y tablas MVP para bases que ya tienen schema.sql
  planificacion-funcional.md  # Criterios de diseño
```

---

## Documentación

- **Índice:** `docs/README.md` — lista de todos los docs y para qué sirve cada uno.
- **Fase 1:** `docs/FASE1.md` — alcance y optimizaciones.
- **Fase 2:** `docs/FASE2.md` (estado, plan y decisiones).
- **Esquema:** `docs/database-schema.md`; DDL: `docs/schema.sql`, `docs/schema-fase2.sql`.
- **Operación:** `docs/RENDIMIENTO-Y-CONEXIONES-MYSQL.md`, `docs/QUERIES.md`.

---

## Licencia

Privado.
