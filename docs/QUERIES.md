# Queries SQL utilizados en la aplicación

Documento de referencia: todos los queries MySQL que se crean o utilizan en `lib/data/*`, con archivo, función y propósito.

## Tiempos de respuesta (desarrollo)

En `NODE_ENV=development` (o con `QUERY_TIMING=1`) la consola del servidor muestra `[timing] <etiqueta>: Xms` para:

- **Página Equipos**: `equipos page (...)`, `getEquiposAllBases`, `getColorCentersAllBases`
- **Por empresa**: `getEquiposAllBases(emp-X)`, `getPool(emp-X)`, `getEquipos(emp-X)`, `getColorCentersAllBases(emp-X)`

Así puedes ver si la lentitud viene de la primera conexión (`getPool`), de las queries de equipos o de sucursales. El timeout de conexión MySQL es 10 s (`lib/db.ts`).

### Timeout y cache

- **Timeout por empresa** (`lib/data/timing.ts`): si una base tarda más de 15 s (configurable con `EMPRESA_QUERY_TIMEOUT_MS`), se devuelve lista vacía para esa empresa y la página no se bloquea. En consola verás `[timing] getColorCenters(emp-X): timeout after 15000ms, using fallback`.
- **Cache de listados** (`lib/data/cache.ts`): `getColorCentersAllBases` y `getEquiposAllBases` cachean el resultado 60 s solo cuando ninguna empresa hizo timeout; si hubo timeout, no se cachea para que la siguiente carga reintente.

---

## 1. Sucursales (`lib/data/sucursales.ts`)

### Base comun (tabla de sucursales por env)

| Query | Dónde | Propósito |
|-------|--------|-----------|
| `SELECT s.?? as id, s.?? as nombre_sucursal, z.?? as region FROM ?? s LEFT JOIN ?? z ON z.?? = s.?? WHERE s.FechaTerm = ? AND s.SubTipoSuc IN (?, ?, ?) ORDER BY s.??` | `getSucursalesFromComun` → runQuery | Listar sucursales desde BD comun con zona; columnas y tablas vienen de env (`getSucursalesTableConfig`, `getZonasTableConfig`). |
| `SELECT ?? as id, ?? as nombre_sucursal, ?? as region FROM ?? WHERE FechaTerm = ? AND SubTipoSuc IN (?, ?, ?) ORDER BY ??` | `getSucursalesFromComun` → runQuery | Mismo listado cuando no hay configuración de zonas (sin JOIN). |
| `SELECT ?? as id_zona, ?? as nombre_zona FROM ??` | `getSucursalesFromComun` (runZonasQuery) | Resolver nombres de región desde tabla zonas. Se ejecuta en paralelo con la consulta principal de sucursales. |

### Base Color Center (tabla `sucursales`)

| Query | Dónde | Propósito |
|-------|--------|-----------|
| `SELECT s.id, s.codigo_interno, s.nombre_sucursal, s.ubicacion, s.fecha_instalacion, s.notas, s.created_at, s.updated_at, r.nombre AS region, u.nombre AS responsable, ce.nombre AS estado FROM sucursales s LEFT JOIN regiones r ON r.id = s.region_id LEFT JOIN usuarios u ON u.id = s.responsable_id JOIN cat_estados_sucursal ce ON ce.id = s.estado_id ORDER BY s.nombre_sucursal` | `getSucursalesByEmpresa` | Sucursales de la empresa desde BD Color Center (cuando no hay base comun). |
| `SELECT DISTINCT r.nombre FROM regiones r INNER JOIN sucursales s ON s.region_id = r.id WHERE r.nombre IS NOT NULL AND r.nombre != '' ORDER BY r.nombre` | `getRegionesDisponibles` | Regiones únicas usadas por sucursales (filtros, combos). |

---

## 2. Equipos (`lib/data/equipos.ts`)

### Constante `EQUIPO_SELECT`

```sql
SELECT e.id, e.sucursal_id, e.numero_serie, e.fecha_compra, e.fecha_vencimiento_arrendamiento,
       e.ultima_calibracion, e.proxima_revision, e.codigo_qr, e.foto_url, e.documentos_url, e.notas,
       e.created_at, e.updated_at,
       te.nombre AS tipo_equipo, m.nombre AS marca, mo.nombre AS modelo,
       tp.nombre AS tipo_propiedad, a.nombre AS arrendador, ee.nombre AS estado
FROM equipos e
JOIN cat_tipos_equipo te ON te.id = e.tipo_equipo_id
LEFT JOIN marcas_equipo m ON m.id = e.marca_id
LEFT JOIN modelos_equipo mo ON mo.id = e.modelo_id
JOIN cat_tipos_propiedad tp ON tp.id = e.tipo_propiedad_id
LEFT JOIN arrendadores a ON a.id = e.arrendador_id
JOIN cat_estados_equipo ee ON ee.id = e.estado_id
```

| Uso | Función | Propósito |
|-----|---------|-----------|
| `EQUIPO_SELECT + WHERE e.sucursal_id = ? ORDER BY e.id` | `getEquiposBySucursal` | Equipos de una sucursal. |
| `EQUIPO_SELECT + ORDER BY e.id` | `getEquipos` | Todos los equipos de la BD. |
| `EQUIPO_SELECT + WHERE e.id = ?` | `getEquipoById` | Un equipo por id. |

### Catálogos (resolución por nombre en equipos)

| Query | Dónde | Propósito |
|-------|--------|-----------|
| `SELECT id FROM cat_tipos_equipo WHERE nombre = ?` | `actualizarEquipo`, `crearEquipo` | Obtener tipo_equipo_id. |
| `SELECT id FROM cat_estados_equipo WHERE nombre = ?` | `actualizarEquipo`, `crearEquipo` | Obtener estado_id. |
| `SELECT id FROM cat_tipos_propiedad WHERE nombre = ?` | `actualizarEquipo`, `crearEquipo` | Obtener tipo_propiedad_id. |
| `SELECT id FROM marcas_equipo WHERE nombre = ?` | `actualizarEquipo`, `crearEquipo` | Obtener marca_id. |
| `SELECT mo.id FROM modelos_equipo mo JOIN marcas_equipo m ON m.id = mo.marca_id WHERE mo.nombre = ? AND m.nombre = ?` | `actualizarEquipo`, `crearEquipo` | Obtener modelo_id por nombre modelo y marca. |
| `SELECT id FROM arrendadores WHERE nombre = ?` | `actualizarEquipo`, `crearEquipo` | Obtener arrendador_id. |

### Escritura equipos

| Query | Dónde | Propósito |
|-------|--------|-----------|
| `UPDATE equipos SET ... WHERE id = ?` (campos dinámicos) | `actualizarEquipo` | Actualizar equipo. |
| `INSERT INTO equipos (sucursal_id, tipo_equipo_id, marca_id, modelo_id, numero_serie, fecha_compra, tipo_propiedad_id, arrendador_id, fecha_vencimiento_arrendamiento, estado_id, ultima_calibracion, proxima_revision, notas) VALUES (?, ...)` | `crearEquipo` | Crear equipo. |

---

## 3. Catálogos (`lib/data/catalogos.ts`)

### Lectura

| Query | Función | Propósito |
|-------|---------|-----------|
| `SELECT id, nombre FROM ${tabla} WHERE activo = 1 ORDER BY nombre` | `getCatalogoNombres` | Nombres de un catálogo (tabla parametrizada: cat_tipos_equipo, cat_estados_equipo, etc.). |
| `SELECT id, nombre FROM marcas_equipo WHERE activo = 1 ORDER BY nombre` | `getMarcasEquipo` | Marcas para combobox. |
| `SELECT id, marca_id, nombre FROM modelos_equipo WHERE marca_id = ? AND activo = 1 ORDER BY nombre` | `getModelosByMarca` | Modelos por marca. |
| `SELECT id, marca_id, nombre FROM modelos_equipo WHERE activo = 1 ORDER BY nombre` | `getModelosAll` | Todos los modelos (admin). |
| `SELECT id, nombre, activo FROM marcas_equipo ORDER BY nombre` | `getMarcasEquipoParaAdmin` | Marcas para admin (incluye inactivos). |
| `SELECT id, marca_id, nombre, activo FROM modelos_equipo ORDER BY nombre` | `getModelosAllParaAdmin` | Modelos para admin. |
| `SELECT id, nombre, activo FROM arrendadores ORDER BY nombre` | `getArrendadoresParaAdmin` | Arrendadores para admin. |
| `SELECT id, nombre, activo FROM cat_tipos_equipo ORDER BY nombre` | `getTiposEquipoParaAdmin` | Tipos de equipo para admin. |
| `SELECT id, nombre FROM arrendadores WHERE activo = 1 ORDER BY nombre` | `getArrendadores` | Arrendadores activos. |
| `SELECT id, nombre, activo FROM marcas_equipo WHERE id = ?` | `getMarcaById` | Una marca por id (para sync). |
| `SELECT id, marca_id, nombre, activo FROM modelos_equipo WHERE id = ?` | `getModeloById` | Un modelo por id. |
| `SELECT id, nombre, activo FROM arrendadores WHERE id = ?` | `getArrendadorById` | Un arrendador por id. |
| `SELECT id, nombre, activo FROM cat_tipos_equipo WHERE id = ?` | `getTipoEquipoById` | Un tipo de equipo por id. |

### Escritura (maestro)

| Query | Función | Propósito |
|-------|---------|-----------|
| `INSERT INTO marcas_equipo (nombre) VALUES (?)` | `crearMarca` | Crear marca. |
| `INSERT INTO modelos_equipo (marca_id, nombre) VALUES (?, ?)` | `crearModelo` | Crear modelo. |
| `INSERT INTO arrendadores (nombre) VALUES (?)` | `crearArrendador` | Crear arrendador. |
| `INSERT INTO cat_tipos_equipo (nombre) VALUES (?)` | `crearTipoEquipo` | Crear tipo de equipo. |
| `UPDATE marcas_equipo SET ... WHERE id = ?` | `actualizarMarca` | Actualizar marca. |
| `UPDATE modelos_equipo SET ... WHERE id = ?` | `actualizarModelo` | Actualizar modelo. |
| `UPDATE arrendadores SET ... WHERE id = ?` | `actualizarArrendador` | Actualizar arrendador. |
| `UPDATE cat_tipos_equipo SET ... WHERE id = ?` | `actualizarTipoEquipo` | Actualizar tipo de equipo. |

---

## 4. Sincronización de catálogos (`lib/data/catalogos-sync.ts`)

Todos se ejecutan en las **demás** bases (no en el maestro), con mismo `id` para mantener FKs.

| Query | Función | Propósito |
|-------|--------|-----------|
| `INSERT INTO marcas_equipo (id, nombre, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo)` | `syncMarcaToOtrasBases` | Replicar marca. |
| `INSERT INTO modelos_equipo (id, marca_id, nombre, activo) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE ...` | `syncModeloToOtrasBases` | Replicar modelo. |
| `INSERT INTO arrendadores (id, nombre, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE ...` | `syncArrendadorToOtrasBases` | Replicar arrendador. |
| `INSERT INTO cat_tipos_equipo (id, nombre, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE ...` | `syncCatTipoEquipoToOtrasBases` | Replicar tipo de equipo. |
| `UPDATE marcas_equipo SET nombre = ?, activo = ? WHERE id = ?` | `updateMarcaInOtrasBases` | Actualizar marca en otras BDs. |
| `UPDATE modelos_equipo SET marca_id = ?, nombre = ?, activo = ? WHERE id = ?` | `updateModeloInOtrasBases` | Actualizar modelo en otras BDs. |
| `UPDATE arrendadores SET nombre = ?, activo = ? WHERE id = ?` | `updateArrendadorInOtrasBases` | Actualizar arrendador en otras BDs. |
| `UPDATE cat_tipos_equipo SET nombre = ?, activo = ? WHERE id = ?` | `updateCatTipoEquipoInOtrasBases` | Actualizar tipo de equipo en otras BDs. |

---

## 5. Mantenimientos (`lib/data/mantenimientos.ts`)

### Constante `MANT_SELECT`

```sql
SELECT m.id, m.equipo_id, m.incidencia_id, m.tipo_id, m.tecnico_id, m.fecha_mantenimiento,
       m.descripcion, m.piezas_cambiadas, m.tiempo_fuera_servicio, m.costo, m.estado_id, m.notas,
       m.created_at, m.updated_at
FROM mantenimientos m
```

| Uso | Función | Propósito |
|-----|---------|-----------|
| `MANT_SELECT + ORDER BY m.fecha_mantenimiento DESC, m.id DESC` | `getMantenimientos` | Todos los mantenimientos. |
| `MANT_SELECT + WHERE m.incidencia_id = ? ORDER BY ...` | `getMantenimientosByIncidenciaId` | Mantenimientos de una incidencia. |
| `MANT_SELECT + WHERE m.equipo_id = ? ORDER BY ...` | `getMantenimientosByEquipoId` | Mantenimientos de un equipo. |
| `MANT_SELECT + WHERE m.id = ?` | `getMantenimientoById` | Un mantenimiento por id. |

| Query | Función | Propósito |
|-------|--------|-----------|
| `SELECT nombre FROM ${tabla} WHERE id = ?` | `getCatalogoNombreById` (helper interno) | Resolver nombre de tipo/estado por id (cat_tipos_mantenimiento, cat_estados_mantenimiento). |

*(Los INSERT/UPDATE de mantenimientos pueden estar en API routes u otro módulo; aquí solo se documenta `lib/data`.)*

---

## 6. Incidencias (`lib/data/incidencias.ts`)

### Constante `INCIDENCIA_SELECT`

```sql
SELECT i.id, i.equipo_id, i.sucursal_id, i.reportado_por_id, i.fecha_reporte, i.descripcion,
       i.severidad_id, i.estado_id, i.notas, i.created_at
FROM incidencias i
```

| Uso | Función | Propósito |
|-----|---------|-----------|
| `INCIDENCIA_SELECT + ORDER BY i.fecha_reporte DESC, i.id DESC` | `getIncidencias` | Todas las incidencias. |
| `INCIDENCIA_SELECT + WHERE i.equipo_id = ? ORDER BY ...` | `getIncidenciasByEquipoId` | Incidencias de un equipo. |
| `INCIDENCIA_SELECT + WHERE i.sucursal_id = ? ORDER BY ...` | `getIncidenciasBySucursalId` | Incidencias de una sucursal. |
| `INCIDENCIA_SELECT + WHERE i.id = ?` | `getIncidenciaById` | Una incidencia por id. |

| Query | Función | Propósito |
|-------|--------|-----------|
| `SELECT nombre FROM ${tabla} WHERE id = ?` | `getCatalogoNombreById` | Nombre de severidad/estado incidencia (cat_severidades, cat_estados_incidencia). |
| `SELECT id FROM cat_estados_incidencia WHERE nombre = ?` | `crearIncidencia` | estado_id para INSERT. |
| `SELECT id FROM cat_severidades WHERE nombre = ?` | `crearIncidencia` | severidad_id (opcional). |
| `INSERT INTO incidencias (equipo_id, sucursal_id, reportado_por_id, fecha_reporte, descripcion, severidad_id, estado_id, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)` | `crearIncidencia` | Crear incidencia. |

---

## 7. Usuarios (`lib/data/usuarios.ts`)

| Query | Función | Propósito |
|-------|--------|-----------|
| `SELECT id FROM usuarios WHERE nombre = ? AND activo = 1` | `getOrCreateUsuarioByNombre` | Buscar usuario por nombre. |
| `INSERT INTO usuarios (nombre, activo) VALUES (?, 1)` | `getOrCreateUsuarioByNombre` | Crear usuario si no existe. |
| `SELECT nombre FROM usuarios WHERE id = ?` | `getNombreUsuarioById` | Nombre para mostrar (incidencias, mantenimientos, movimientos). |

---

## 8. Movimientos de equipo (`lib/data/movimientos.ts`)

| Query | Función | Propósito |
|-------|--------|-----------|
| `SELECT id, equipo_id, sucursal_origen_id, sucursal_destino_id, fecha_movimiento, motivo, registrado_por_id, created_at FROM movimientos_equipo WHERE equipo_id = ? ORDER BY fecha_movimiento DESC, id DESC` | `getMovimientosByEquipoId` | Historial de movimientos de un equipo. |
| `INSERT INTO movimientos_equipo (equipo_id, sucursal_origen_id, sucursal_destino_id, fecha_movimiento, motivo, registrado_por_id) VALUES (?, ?, ?, ?, ?, ?)` | `registrarMovimientoEquipo` | Registrar movimiento. |
| `SELECT ... FROM movimientos_equipo WHERE equipo_id = ? ORDER BY id DESC LIMIT 1` | `registrarMovimientoEquipo` | Leer el movimiento recién insertado. |

*(Tras el INSERT se actualiza `equipos.sucursal_id` vía `actualizarEquipo`.)*

---

## 9. Fotos de equipo (`lib/data/fotos.ts`)

| Query | Función | Propósito |
|-------|--------|-----------|
| `SELECT id, equipo_id, url, fecha_foto, descripcion, created_at FROM equipo_fotos WHERE equipo_id = ? ORDER BY fecha_foto DESC, id DESC` | `getFotosByEquipoId` | Fotos de un equipo. |
| `INSERT INTO equipo_fotos (equipo_id, url, fecha_foto, descripcion) VALUES (?, ?, ?, ?)` | `crearFotoEquipo` | Guardar URL de foto (la subida del archivo es en API + Supabase). |
| `SELECT id, equipo_id, url, fecha_foto, descripcion, created_at FROM equipo_fotos WHERE id = ?` | `crearFotoEquipo` | Leer la foto creada. |
| `DELETE FROM equipo_fotos WHERE id = ?` | `eliminarFotoEquipo` | Eliminar foto. |

---

## 10. Equipo computadora (`lib/data/computadora.ts`)

| Query | Función | Propósito |
|-------|--------|-----------|
| `SELECT equipo_id, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, graficos, windows_version, so_64bits, created_at, updated_at FROM equipo_computadora WHERE equipo_id = ?` | `getComputadoraByEquipoId` | Especificaciones de equipo de cómputo. |
| `UPDATE equipo_computadora SET ... WHERE equipo_id = ?` (campos dinámicos) | `actualizarComputadora` | Actualizar especificaciones. |
| `INSERT INTO equipo_computadora (...) VALUES (...)` (columnas dinámicas) | `actualizarComputadora` | Crear fila si no existía. |

---

## Resumen por tabla

| Tabla (o origen) | Operaciones |
|------------------|-------------|
| **comun** (sucursales/zonas) | SELECT (configuración por env) |
| **sucursales** | SELECT (con regiones, usuarios, estado) |
| **regiones** | SELECT DISTINCT nombre (vía JOIN con sucursales) |
| **equipos** | SELECT (con JOINs a catálogos, marcas, modelos, etc.), UPDATE, INSERT |
| **marcas_equipo** | SELECT, INSERT, UPDATE (maestro + sync) |
| **modelos_equipo** | SELECT, INSERT, UPDATE (maestro + sync) |
| **arrendadores** | SELECT, INSERT, UPDATE (maestro + sync) |
| **cat_tipos_equipo** | SELECT, INSERT, UPDATE (maestro + sync) |
| **cat_estados_equipo**, **cat_tipos_propiedad**, **cat_estados_sucursal** | SELECT (lectura por nombre o id) |
| **mantenimientos** | SELECT |
| **incidencias** | SELECT, INSERT |
| **cat_estados_incidencia**, **cat_severidades** | SELECT por id/nombre |
| **usuarios** | SELECT, INSERT (get-or-create) |
| **movimientos_equipo** | SELECT, INSERT |
| **equipo_fotos** | SELECT, INSERT, DELETE |
| **equipo_computadora** | SELECT, INSERT, UPDATE |
