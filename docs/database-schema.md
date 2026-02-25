# Esquema de base de datos – Color Center Management

Esquema normalizado para **MySQL 8.0+**. Todas las FK apuntan a catálogos o tablas relacionadas (sin CHECK constraints para valores).

Para bases nuevas: usar **schema.sql** para crear todas las tablas; luego **schema-fase2.sql** para columnas y tablas del MVP (usuarios/roles, marcas por tipo). Ver `docs/README.md` para índice de documentación.

---

## Arquitectura de datos

```
┌─────────────────────────────────────────────────────────────┐
│                   BD CORPORATIVA (externa)                   │
│  empresas, regiones, sucursales (IDs numéricos INT)         │
│  → Se sincronizan a tablas espejo en esta BD (solo lectura) │
└──────────────────────────┬──────────────────────────────────┘
                           │ IDs INT (sin AUTO_INCREMENT)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              BD COLOR CENTER MANAGEMENT (esta app)           │
│                                                              │
│  Tablas espejo:  empresas, regiones, sucursales              │
│  Catálogos:      cat_tipos_equipo, cat_estados_*, etc.       │
│  Propias:        usuarios, equipos, equipo_fotos,            │
│                  incidencias, mantenimientos,                 │
│                  movimientos_equipo, marcas_equipo            │
│                  → IDs INT AUTO_INCREMENT                     │
└─────────────────────────────────────────────────────────────┘
```

**Backend:** Next.js 15 (App Router) + TypeScript. API Routes en `app/api/`.

---

## Bases "comun" (Fase 1 – sucursales)

En Fase 1 las **sucursales** se leen desde bases **comun** (una por empresa), no desde la base Color Center. Variables de entorno: `COMUN_DB_URL_*`, `SUCURSALES_*`, `ZONAS_*` (ver `.env.example`).

- **Tabla sucursal:** nombre y columnas configurables por env (`SUCURSALES_TABLE=sucursal`, `SUCURSALES_ID_COL=num_suc`, `SUCURSALES_NOMBRE_COL=nombre`, `SUCURSALES_ZONA_COL=ZonaAsig`).
- **Filtro aplicado:** `WHERE FechaTerm = '' AND SubTipoSuc IN ('S', 'B', '2')` (solo sucursales activas y tipos S/B/2).
- **Zonas (opcional):** si se define `ZONAS_TABLE` y `ZONAS_NOMBRE_COL`, se hace `LEFT JOIN zonas ON zonas.NumZona = sucursal.ZonaAsig` y la región mostrada es el nombre de la zona.

Si una empresa no tiene `COMUN_DB_URL_*`, se usa la base Color Center y las tablas `sucursales` / `regiones` (esquema de este documento).

---

## Resumen del modelo

```
CATÁLOGOS                              REFERENCIA (BD corporativa)
  cat_tipos_equipo                       empresas ──< regiones
  cat_estados_equipo                         └──────< sucursales
  cat_estados_sucursal                                   │
  cat_estados_incidencia                                 │
  cat_estados_mantenimiento          PROPIAS DE LA APP   │
  cat_severidades                      usuarios          │
  cat_tipos_mantenimiento              marcas_equipo     │
  cat_tipos_propiedad                    └── modelos_equipo
                                       arrendadores      │
                                       equipos ──────────┘
                                         ├── equipo_fotos
                                         ├── incidencias
                                         ├── mantenimientos
                                         └── movimientos_equipo
```

---

## Tablas

### Catálogos

Todas las tablas catálogo comparten la misma estructura:

| Columna    | Tipo        | Restricción             | Descripción          |
|------------|-------------|-------------------------|----------------------|
| id         | INT         | PK, AUTO_INCREMENT      | ID                   |
| nombre     | VARCHAR(N)  | NOT NULL, UNIQUE        | Valor del catálogo   |
| activo     | TINYINT(1)  | NOT NULL, DEFAULT 1     | 1 = activo, 0 = desactivado |
| created_at | DATETIME    | DEFAULT CURRENT_TIMESTAMP | Alta               |

| Tabla catálogo              | Valores iniciales                                           |
|-----------------------------|-------------------------------------------------------------|
| `cat_tipos_equipo`          | Tintometrico, Mezcladora, Regulador, Equipo de Computo      |
| `cat_estados_equipo`        | Operativo, Mantenimiento, Inactivo, Fuera de Servicio        |
| `cat_estados_sucursal`      | Operativo, Mantenimiento, Inactivo                           |
| `cat_estados_incidencia`    | Reportada, En atención, Resuelta, Cerrada                    |
| `cat_estados_mantenimiento` | Pendiente, En Proceso, Completado                            |
| `cat_severidades`           | Baja, Media, Alta, Crítica                                   |
| `cat_tipos_mantenimiento`   | Preventivo, Correctivo                                       |
| `cat_tipos_propiedad`       | Propio, Arrendado                                            |

### `marcas_equipo`

Catálogo de marcas de equipo. Se pueden crear desde el formulario de equipo (combobox con "Agregar nueva").

| Columna    | Tipo         | Restricción             | Descripción          |
|------------|--------------|-------------------------|----------------------|
| id         | INT          | PK, AUTO_INCREMENT      | ID                   |
| nombre     | VARCHAR(255) | NOT NULL, UNIQUE        | Nombre de la marca   |
| activo     | TINYINT(1)   | NOT NULL, DEFAULT 1     | Activo / inactivo    |
| created_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta               |

---

### `modelos_equipo`

Modelos de equipo, ligados a una marca. Al seleccionar marca, se filtran los modelos. Se pueden crear inline.

| Columna    | Tipo         | Restricción                   | Descripción             |
|------------|--------------|-------------------------------|-------------------------|
| id         | INT          | PK, AUTO_INCREMENT            | ID                      |
| marca_id   | INT          | NOT NULL, FK(marcas_equipo)   | Marca a la que pertenece |
| nombre     | VARCHAR(255) | NOT NULL                      | Nombre del modelo       |
| activo     | TINYINT(1)   | NOT NULL, DEFAULT 1           | Activo / inactivo       |
| created_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP     | Alta                    |

- **UNIQUE:** `(marca_id, nombre)` para evitar modelos duplicados por marca.

---

### `arrendadores`

Empresas arrendadoras de equipos. Se pueden crear desde el formulario de equipo (combobox con "Agregar nuevo").

| Columna    | Tipo         | Restricción             | Descripción                   |
|------------|--------------|-------------------------|-------------------------------|
| id         | INT          | PK, AUTO_INCREMENT      | ID                            |
| nombre     | VARCHAR(255) | NOT NULL, UNIQUE        | Nombre de la arrendadora      |
| activo     | TINYINT(1)   | NOT NULL, DEFAULT 1     | Activo / inactivo             |
| created_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta                        |

---

### `usuarios`

Tabla nueva, propia de esta app. Técnicos, supervisores, responsables de sucursal, etc.

| Columna    | Tipo         | Restricción             | Descripción          |
|------------|--------------|-------------------------|----------------------|
| id         | INT          | PK, AUTO_INCREMENT      | ID                   |
| nombre     | VARCHAR(255) | NOT NULL                | Nombre completo      |
| email      | VARCHAR(255) | NULL, UNIQUE            | Correo electrónico   |
| telefono   | VARCHAR(50)  | NULL                    | Teléfono             |
| rol        | VARCHAR(50)  | NULL                    | Ej: Admin, Técnico, Supervisor |
| activo     | TINYINT(1)   | NOT NULL, DEFAULT 1     | Activo / inactivo    |
| created_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta               |
| updated_at | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | Última actualización |

---

### `empresas` (referencia externa)

Espejo de la BD corporativa. **No se crean/editan desde esta app.**

| Columna    | Tipo         | Restricción             | Descripción                        |
|------------|--------------|-------------------------|------------------------------------|
| id         | INT          | PK (sin AUTO_INCREMENT) | Mismo ID de la BD corporativa      |
| nombre     | VARCHAR(255) | NOT NULL                | Nombre comercial                   |
| codigo     | VARCHAR(50)  | NOT NULL, UNIQUE        | Código corto (ej. PNTCMX)         |
| pais       | VARCHAR(100) | NULL                    | País                               |
| created_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta del registro                |
| updated_at | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | Última sincronización           |

---

### `regiones` (referencia externa)

Zonas por empresa. Espejo de la BD corporativa.

| Columna    | Tipo         | Restricción             | Descripción                        |
|------------|--------------|-------------------------|------------------------------------|
| id         | INT          | PK (sin AUTO_INCREMENT) | Mismo ID de la BD corporativa      |
| empresa_id | INT          | NOT NULL, FK(empresas)  | Empresa                            |
| nombre     | VARCHAR(100) | NOT NULL                | Zona (Golfo, Metro, etc.)          |
| created_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta                             |

- **UNIQUE:** `(empresa_id, nombre)`.

---

### `sucursales` (referencia externa + campos propios)

Base de la BD corporativa. Los campos `responsable_id`, `fecha_instalacion`, `estado_id` y `notas` son propios de esta app (gestión de color center).

| Columna           | Tipo         | Restricción             | Descripción                                   |
|-------------------|--------------|-------------------------|-----------------------------------------------|
| id                | INT          | PK (sin AUTO_INCREMENT) | Mismo ID de la BD corporativa                 |
| empresa_id        | INT          | NOT NULL, FK(empresas)  | Empresa                                       |
| region_id         | INT          | NULL, FK(regiones)      | Zona (opcional)                               |
| codigo_interno    | VARCHAR(50)  | NOT NULL                | Código interno (ej. PNT-MET-001)              |
| nombre_sucursal   | VARCHAR(255) | NOT NULL                | Nombre de la sucursal                         |
| ubicacion         | VARCHAR(500) | NULL                    | Dirección                                     |
| responsable_id    | INT          | NULL, FK(usuarios)      | Responsable del color center                  |
| fecha_instalacion | DATE         | NULL                    | Fecha de instalación del color center          |
| estado_id         | INT          | NOT NULL, FK(cat_estados_sucursal) | Estado del color center          |
| notas             | TEXT         | NULL                    | Notas libres                                  |
| created_at        | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta                                        |
| updated_at        | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | Última actualización                      |

- **UNIQUE:** `(empresa_id, codigo_interno)`.
- **Índices:** `(empresa_id)`, `(region_id)`, `(empresa_id, region_id)`, `(estado_id)`.

---

### `equipos`

Equipos asignados a una sucursal. **Tabla propia de esta app.**

| Columna                          | Tipo         | Restricción                      | Descripción                                    |
|----------------------------------|--------------|----------------------------------|------------------------------------------------|
| id                               | INT          | PK, AUTO_INCREMENT               | ID                                             |
| sucursal_id                      | INT          | NOT NULL, FK(sucursales)         | Sucursal                                       |
| tipo_equipo_id                   | INT          | NOT NULL, FK(cat_tipos_equipo)   | Tipo de equipo                                 |
| marca_id                         | INT          | NULL, FK(marcas_equipo)          | Marca (combobox con crear)                     |
| modelo_id                        | INT          | NULL, FK(modelos_equipo)         | Modelo (filtrado por marca, combobox con crear) |
| numero_serie                     | VARCHAR(100) | NULL                             | Número de serie                                |
| fecha_compra                     | DATE         | NULL                             | Fecha de compra                                |
| tipo_propiedad_id                | INT          | NOT NULL, FK(cat_tipos_propiedad)| Propio / Arrendado                             |
| arrendador_id                    | INT          | NULL, FK(arrendadores)           | Arrendadora (combobox con crear; si aplica)    |
| fecha_vencimiento_arrendamiento  | DATE         | NULL                             | Vencimiento del contrato                       |
| estado_id                        | INT          | NOT NULL, FK(cat_estados_equipo) | Estado del equipo                              |
| ultima_calibracion               | DATE         | NULL                             | Última calibración                             |
| proxima_revision                 | DATE         | NULL                             | Próxima revisión programada                    |
| codigo_qr                        | VARCHAR(500) | NULL                             | URL / valor QR                                 |
| foto_url                         | VARCHAR(500) | NULL                             | Legacy; preferir `equipo_fotos`                |
| documentos_url                   | VARCHAR(500) | NULL                             | URL de carpeta/documentos                      |
| notas                            | TEXT         | NULL                             | Notas libres                                   |
| created_at                       | DATETIME     | DEFAULT CURRENT_TIMESTAMP        | Alta                                           |
| updated_at                       | DATETIME     | ON UPDATE CURRENT_TIMESTAMP      | Última actualización                           |

- **Índices:** `(sucursal_id)`, `(tipo_equipo_id)`, `(estado_id)`, `(marca_id)`, `(modelo_id)`, `(arrendador_id)`.
- **UX marca/modelo:** Al seleccionar marca se filtran los modelos disponibles. Si no existe, se crea inline desde el combobox.

---

### `equipo_fotos`

Varias fotos por equipo con fecha para documentar estado visual.

| Columna     | Tipo         | Restricción             | Descripción                    |
|-------------|--------------|-------------------------|--------------------------------|
| id          | INT          | PK, AUTO_INCREMENT      | ID                             |
| equipo_id   | INT          | NOT NULL, FK(equipos) ON DELETE CASCADE | Equipo       |
| url         | VARCHAR(500) | NOT NULL                | URL de la imagen               |
| fecha_foto  | DATE         | NOT NULL                | Fecha de la foto               |
| descripcion | VARCHAR(255) | NULL                    | Ej: "Vista frontal"           |
| created_at  | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta                         |

- **Índices:** `(equipo_id)`, `(fecha_foto)`.

---

### `equipo_computadora`

Especificaciones propias de equipos tipo **Equipo de Computo** (relación 1:1). Solo se usa cuando el equipo es una computadora; el formulario de edición muestra estos campos solo en ese caso.

| Columna             | Tipo         | Restricción | Descripción                                      |
|---------------------|--------------|-------------|--------------------------------------------------|
| equipo_id           | INT          | PK, FK(equipos) ON DELETE CASCADE | Equipo (computadora)        |
| procesador          | VARCHAR(255) | NULL        | Ej: Intel Core i5 ≥ 3.0 GHz                      |
| ram_gb              | INT          | NULL        | Memoria RAM en GB (ej: 16)                       |
| almacenamiento_gb   | INT          | NULL        | Almacenamiento en GB (ej: 450 o 512)             |
| tipo_almacenamiento | VARCHAR(20)  | NULL        | SSD, HDD                                        |
| graficos            | VARCHAR(255) | NULL        | Ej: Intel HD 530, Nvidia, AMD compatible         |
| windows_version     | VARCHAR(100) | NULL        | Ej: Windows 11 Pro 23H2                         |
| so_64bits           | TINYINT(1)   | NOT NULL, DEFAULT 1 | 1 = 64 bits                      |
| created_at          | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Alta                         |
| updated_at          | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | Última actualización       |

Referencia de requisitos típicos: Procesador Intel Core i5 o superior (≥ 3.0 GHz), RAM 16 GB o más, almacenamiento ≥ 450 GB libres o SSD, gráficos Intel HD 530 / Nvidia / AMD, Windows 11 Pro 23H2 o posterior, 64 bits.

---

### `incidencias`

Reportes de problema. Pueden derivar en mantenimientos.

| Columna          | Tipo    | Restricción                         | Descripción                    |
|------------------|---------|-------------------------------------|--------------------------------|
| id               | INT     | PK, AUTO_INCREMENT                  | ID                             |
| equipo_id        | INT     | NULL, FK(equipos) ON DELETE SET NULL| Equipo afectado (opcional)     |
| sucursal_id      | INT     | NOT NULL, FK(sucursales)            | Sucursal donde se reporta     |
| reportado_por_id | INT     | NOT NULL, FK(usuarios)              | Quién reporta                  |
| fecha_reporte    | DATE    | NOT NULL                            | Fecha del reporte              |
| descripcion      | TEXT    | NOT NULL                            | Descripción del problema       |
| severidad_id     | INT     | NULL, FK(cat_severidades)           | Severidad                      |
| estado_id        | INT     | NOT NULL, FK(cat_estados_incidencia)| Estado                         |
| notas            | TEXT    | NULL                                | Notas adicionales              |
| created_at       | DATETIME| DEFAULT CURRENT_TIMESTAMP           | Alta                           |
| updated_at       | DATETIME| ON UPDATE CURRENT_TIMESTAMP         | Última actualización           |

- **Índices:** `(sucursal_id)`, `(equipo_id)`, `(estado_id)`, `(fecha_reporte)`.

---

### `mantenimientos`

Mantenimientos preventivos o correctivos por equipo.

| Columna               | Tipo         | Restricción                              | Descripción                    |
|-----------------------|--------------|------------------------------------------|--------------------------------|
| id                    | INT          | PK, AUTO_INCREMENT                       | ID                             |
| equipo_id             | INT          | NOT NULL, FK(equipos)                    | Equipo                         |
| incidencia_id         | INT          | NULL, FK(incidencias) ON DELETE SET NULL  | Incidencia origen (opcional)   |
| tipo_id               | INT          | NOT NULL, FK(cat_tipos_mantenimiento)    | Preventivo / Correctivo        |
| tecnico_id            | INT          | NOT NULL, FK(usuarios)                   | Técnico responsable            |
| fecha_mantenimiento   | DATE         | NOT NULL                                 | Fecha del servicio             |
| descripcion           | TEXT         | NOT NULL                                 | Descripción del trabajo        |
| piezas_cambiadas      | TEXT         | NULL                                     | Piezas reemplazadas            |
| tiempo_fuera_servicio | DECIMAL(5,2) | NULL                                     | Horas fuera de servicio        |
| costo                 | DECIMAL(12,2)| NULL                                     | Costo del mantenimiento        |
| estado_id             | INT          | NOT NULL, FK(cat_estados_mantenimiento)  | Estado                         |
| notas                 | TEXT         | NULL                                     | Notas adicionales              |
| created_at            | DATETIME     | DEFAULT CURRENT_TIMESTAMP                | Alta                           |
| updated_at            | DATETIME     | ON UPDATE CURRENT_TIMESTAMP              | Última actualización           |

- **Índices:** `(equipo_id)`, `(incidencia_id)`, `(tipo_id)`, `(estado_id)`, `(fecha_mantenimiento)`.

---

### `movimientos_equipo`

Historial de traslados de equipo entre sucursales.

| Columna             | Tipo    | Restricción                        | Descripción              |
|---------------------|---------|------------------------------------|--------------------------|
| id                  | INT     | PK, AUTO_INCREMENT                 | ID                       |
| equipo_id           | INT     | NOT NULL, FK(equipos)              | Equipo                   |
| sucursal_origen_id  | INT     | NOT NULL, FK(sucursales)           | Sucursal de origen       |
| sucursal_destino_id | INT     | NOT NULL, FK(sucursales)           | Sucursal de destino      |
| fecha_movimiento    | DATE    | NOT NULL                           | Fecha del movimiento     |
| motivo              | TEXT    | NULL                               | Motivo / observaciones   |
| registrado_por_id   | INT     | NULL, FK(usuarios) ON DELETE SET NULL | Quién registró        |
| created_at          | DATETIME| DEFAULT CURRENT_TIMESTAMP          | Alta                     |

- **Índices:** `(equipo_id)`, `(fecha_movimiento)`.

---

## Diagrama de relaciones

```
                        cat_tipos_equipo ──┐
                       cat_estados_equipo ──┤
                      cat_tipos_propiedad ──┤
                          marcas_equipo ────┤
                            └── modelos_equipo ──┤
                          arrendadores ────┤
                                            │
empresas (ext) ────< regiones (ext)         │
    │                                       │
    └────< sucursales (ext+app)             │
               │    └── FK → cat_estados_sucursal
               │    └── FK → usuarios (responsable)
               │                            │
               └────< equipos ──────────────┘
                        │  └── FK → marcas_equipo
                        │  └── FK → modelos_equipo (filtrado por marca)
                        │  └── FK → arrendadores (si tipo_propiedad = Arrendado)
                        │
                        ├──< equipo_fotos
                        ├──< equipo_computadora (1:1, solo si tipo = Equipo de Computo)
                        │
                        ├──< incidencias
                        │      └── FK → usuarios (reportado_por)
                        │      └── FK → cat_severidades
                        │      └── FK → cat_estados_incidencia
                        │
                        ├──< mantenimientos
                        │      └── FK → incidencias (opcional)
                        │      └── FK → usuarios (tecnico)
                        │      └── FK → cat_tipos_mantenimiento
                        │      └── FK → cat_estados_mantenimiento
                        │
                        └──< movimientos_equipo
                               └── FK → sucursales (origen, destino)
                               └── FK → usuarios (registrado_por)
```

---

## Consultas útiles

```sql
-- Empresas
SELECT * FROM empresas ORDER BY nombre;

-- Regiones por empresa
SELECT * FROM regiones WHERE empresa_id = ? ORDER BY nombre;

-- Sucursales con nombre de estado y responsable
SELECT s.*, cs.nombre AS estado, u.nombre AS responsable
FROM sucursales s
JOIN cat_estados_sucursal cs ON cs.id = s.estado_id
LEFT JOIN usuarios u ON u.id = s.responsable_id
WHERE s.empresa_id = ?
ORDER BY s.nombre_sucursal;

-- Equipos con tipo, marca, estado (por sucursal)
SELECT e.*, te.nombre AS tipo_equipo, m.nombre AS marca,
       ee.nombre AS estado, tp.nombre AS tipo_propiedad
FROM equipos e
JOIN cat_tipos_equipo te ON te.id = e.tipo_equipo_id
LEFT JOIN marcas_equipo m ON m.id = e.marca_id
JOIN cat_estados_equipo ee ON ee.id = e.estado_id
JOIN cat_tipos_propiedad tp ON tp.id = e.tipo_propiedad_id
WHERE e.sucursal_id = ?;

-- Mantenimientos con tipo, estado, técnico
SELECT mt.*, tm.nombre AS tipo, em.nombre AS estado,
       u.nombre AS tecnico
FROM mantenimientos mt
JOIN cat_tipos_mantenimiento tm ON tm.id = mt.tipo_id
JOIN cat_estados_mantenimiento em ON em.id = mt.estado_id
JOIN usuarios u ON u.id = mt.tecnico_id
WHERE mt.equipo_id = ?
ORDER BY mt.fecha_mantenimiento DESC;

-- Incidencias con severidad, estado, quien reporta
SELECT i.*, sv.nombre AS severidad, ei.nombre AS estado,
       u.nombre AS reportado_por
FROM incidencias i
LEFT JOIN cat_severidades sv ON sv.id = i.severidad_id
JOIN cat_estados_incidencia ei ON ei.id = i.estado_id
JOIN usuarios u ON u.id = i.reportado_por_id
WHERE i.sucursal_id = ?
ORDER BY i.fecha_reporte DESC;

-- Valores de un catálogo (ej. tipos de equipo activos)
SELECT id, nombre FROM cat_tipos_equipo WHERE activo = 1 ORDER BY nombre;
```

---

## Notas de implementación (MySQL 8.0+)

1. **Tablas de referencia (empresas, regiones, sucursales):** IDs `INT` sin `AUTO_INCREMENT`; se sincronizan desde la BD corporativa. No se crean ni eliminan desde esta app.
2. **Tablas propias:** IDs `INT AUTO_INCREMENT`. Incluyen equipos, fotos, incidencias, mantenimientos, movimientos, usuarios, marcas y todos los catálogos.
3. **Catálogos:** Permiten agregar, desactivar o renombrar valores sin tocar el esquema. El campo `activo` evita borrar registros en uso.
4. **Usuarios:** Tabla nueva para gestionar técnicos, supervisores y responsables. Reemplaza los campos VARCHAR sueltos (`tecnico_responsable`, `quien_reporta`, `responsable`, `registrado_por`).
5. **`updated_at`:** `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`; sin triggers.
6. **Almacenamiento de fotos:** Las imágenes se guardan en un servicio de storage externo (Supabase Storage, AWS S3, etc.), **nunca en MySQL**. La tabla `equipo_fotos` solo almacena la URL pública resultante. El flujo es: la app sube la imagen al bucket → obtiene la URL → guarda la URL en `equipo_fotos.url`.
7. **Soft delete:** Si se necesita, añadir `deleted_at DATETIME NULL` a las tablas que lo requieran.

El script SQL listo para ejecutar está en **`docs/schema.sql`**.
