# Esquema de base de datos – Color Center Management

Documento de referencia con las tablas necesarias para alimentar la aplicación (empresas, regiones, sucursales, equipos y mantenimientos). El esquema está pensado para PostgreSQL o MySQL; los tipos se pueden adaptar a otro motor.

---

## Resumen del modelo

```
empresas
    └── regiones (zonas por empresa; ej. Pintacomex: Golfo, Guerrero, Metro)
    └── sucursales (color_centers) → pertenecen a una empresa y opcionalmente a una región
            └── equipos → pertenecen a una sucursal
                    └── mantenimientos → pertenecen a un equipo
```

---

## Tablas

### 1. `empresas`

Empresas o marcas (Pintacomex, Gallco, Belice, etc.).

| Columna           | Tipo         | Restricción   | Descripción                    |
|-------------------|--------------|---------------|--------------------------------|
| id                | UUID / VARCHAR(36) | PK           | Identificador único            |
| nombre            | VARCHAR(255) | NOT NULL      | Nombre comercial                |
| codigo            | VARCHAR(50)  | NOT NULL, UNIQUE | Código corto (ej. PNTCMX)   |
| pais              | VARCHAR(100) | NOT NULL      | País                           |
| created_at        | TIMESTAMPTZ | NOT NULL      | Alta del registro              |

- **Nota:** `total_sucursales` se puede calcular con `COUNT` sobre `sucursales`; no es obligatorio guardarlo. Si se desea denormalizar, se puede añadir una columna y mantenerla con triggers o jobs.

---

### 2. `regiones`

Zonas o regiones por empresa (solo algunas empresas las usan, ej. Pintacomex: Golfo, Guerrero, Metro). Sirve para filtrar sucursales en el formulario de equipo.

| Columna    | Tipo         | Restricción | Descripción           |
|------------|--------------|-------------|------------------------|
| id         | UUID / VARCHAR(36) | PK       | Identificador único   |
| empresa_id | UUID / VARCHAR(36) | NOT NULL, FK(empresas.id) | Empresa dueña de la región |
| nombre     | VARCHAR(100) | NOT NULL  | Nombre de la zona (ej. Golfo, Metro) |
| created_at | TIMESTAMPTZ  | NOT NULL  | Alta del registro     |

- **Índice:** `(empresa_id)` para listar regiones por empresa.
- **UNIQUE:** `(empresa_id, nombre)` si no quieres nombres de región duplicados por empresa.

---

### 3. `sucursales` (color_centers)

Sucursales / Color Centers. Cada una pertenece a una empresa y, si aplica, a una región.

| Columna           | Tipo          | Restricción | Descripción                          |
|-------------------|---------------|-------------|--------------------------------------|
| id                | UUID / VARCHAR(36) | PK       | Identificador único                  |
| empresa_id        | UUID / VARCHAR(36) | NOT NULL, FK(empresas.id) | Empresa                      |
| region_id         | UUID / VARCHAR(36) | NULL, FK(regiones.id) | Zona (opcional; ej. Pintacomex) |
| codigo_interno    | VARCHAR(50)   | NOT NULL    | Código interno (ej. PNT-MET-001)     |
| nombre_sucursal   | VARCHAR(255)  | NOT NULL    | Nombre de la sucursal                |
| ubicacion         | VARCHAR(500)  | NULL        | Dirección o referencia de ubicación |
| responsable       | VARCHAR(255)  | NULL        | Nombre del responsable               |
| fecha_instalacion | DATE          | NULL        | Fecha de instalación del color center |
| estado            | VARCHAR(20)   | NOT NULL    | `Operativo`, `Mantenimiento`, `Inactivo` |
| notas             | TEXT          | NULL        | Notas libres                         |
| created_at        | TIMESTAMPTZ  | NOT NULL    | Alta del registro                    |
| updated_at        | TIMESTAMPTZ  | NOT NULL    | Última actualización                 |

- **Índices:** `(empresa_id)`, `(region_id)`, `(empresa_id, region_id)` para filtros del formulario y listados.
- **UNIQUE:** `(empresa_id, codigo_interno)` para evitar códigos duplicados por empresa.
- **Check:** `estado IN ('Operativo', 'Mantenimiento', 'Inactivo')`.

---

### 4. `equipos`

Equipos (tintométricos, mezcladoras, etc.) asignados a una sucursal.

| Columna            | Tipo          | Restricción | Descripción                                    |
|--------------------|---------------|-------------|------------------------------------------------|
| id                 | UUID / VARCHAR(36) | PK       | Identificador único                            |
| color_center_id    | UUID / VARCHAR(36) | NOT NULL, FK(sucursales.id) | Sucursal (color center)        |
| tipo_equipo        | VARCHAR(50)   | NOT NULL    | `Tintometrico`, `Mezcladora`, `Regulador`, `Equipo de Computo` |
| marca              | VARCHAR(255)  | NULL        | Marca                                          |
| modelo             | VARCHAR(255)  | NULL        | Modelo                                         |
| numero_serie       | VARCHAR(100)  | NULL       | Número de serie                                |
| fecha_compra       | DATE          | NULL        | Fecha de compra                                |
| tipo_propiedad    | VARCHAR(20)   | NOT NULL    | `Propio`, `Arrendado`                          |
| arrendador         | VARCHAR(255)  | NULL        | Nombre del arrendador (cuando tipo_propiedad = Arrendado) |
| estado             | VARCHAR(30)   | NOT NULL    | `Operativo`, `Mantenimiento`, `Inactivo`, `Fuera de Servicio` |
| ultima_calibracion | DATE          | NULL        | Última calibración                             |
| proxima_revision   | DATE          | NULL        | Próxima revisión programada                    |
| codigo_qr          | VARCHAR(500)  | NULL        | URL o valor del código QR                      |
| foto_url           | VARCHAR(500)  | NULL        | URL de foto del equipo                         |
| documentos_url     | VARCHAR(500)  | NULL        | URL de carpeta/documentos                      |
| notas              | TEXT          | NULL        | Notas libres                                   |
| created_at         | TIMESTAMPTZ   | NOT NULL    | Alta del registro                              |
| updated_at         | TIMESTAMPTZ   | NOT NULL    | Última actualización                            |

- **Índices:** `(color_center_id)`, `(estado)`, `(tipo_equipo)`.
- **Check:** `tipo_propiedad IN ('Propio', 'Arrendado')`, `estado IN ('Operativo', 'Mantenimiento', 'Inactivo', 'Fuera de Servicio')`, `tipo_equipo IN (...)`.

---

### 5. `mantenimientos`

Registro de mantenimientos (preventivos o correctivos) por equipo.

| Columna               | Tipo          | Restricción | Descripción                    |
|-----------------------|---------------|-------------|--------------------------------|
| id                    | UUID / VARCHAR(36) | PK       | Identificador único            |
| equipo_id             | UUID / VARCHAR(36) | NOT NULL, FK(equipos.id) | Equipo                  |
| tipo                  | VARCHAR(20)   | NOT NULL    | `Preventivo`, `Correctivo`     |
| tecnico_responsable   | VARCHAR(255)  | NOT NULL    | Nombre del técnico             |
| fecha_mantenimiento   | DATE          | NOT NULL    | Fecha del servicio             |
| descripcion           | TEXT          | NOT NULL    | Descripción del trabajo        |
| piezas_cambiadas      | TEXT          | NULL        | Piezas reemplazadas            |
| tiempo_fuera_servicio | DECIMAL(5,2)  | NULL        | Horas fuera de servicio        |
| costo                 | DECIMAL(12,2) | NULL        | Costo del mantenimiento        |
| estado                | VARCHAR(20)   | NOT NULL    | `Pendiente`, `En Proceso`, `Completado` |
| notas                 | TEXT          | NULL        | Notas adicionales              |
| created_at            | TIMESTAMPTZ   | NOT NULL    | Alta del registro              |
| updated_at            | TIMESTAMPTZ   | NOT NULL    | Última actualización           |

- **Índices:** `(equipo_id)`, `(fecha_mantenimiento)`, `(estado)`.
- **Check:** `tipo IN ('Preventivo', 'Correctivo')`, `estado IN ('Pendiente', 'En Proceso', 'Completado')`.

---

## Diagrama de relaciones

```
empresas (1) ──────────< regiones (N)
    │
    │ (1)
    └──────────────< sucursales (N)   [color_centers]
                            │
                            │ (1)
                            └────────< equipos (N)
                                            │
                                            │ (1)
                                            └────────< mantenimientos (N)
```

---

## Consultas útiles para alimentar la app

- **Empresas:** `SELECT * FROM empresas ORDER BY nombre`.
- **Regiones por empresa (ej. Pintacomex):** `SELECT * FROM regiones WHERE empresa_id = ? ORDER BY nombre`.
- **Sucursales por empresa (y opcionalmente región):**  
  `SELECT * FROM sucursales WHERE empresa_id = ? [AND region_id = ?] ORDER BY nombre_sucursal`.
- **Equipos por sucursal:** `SELECT * FROM equipos WHERE color_center_id = ?`.
- **Mantenimientos por equipo:** `SELECT * FROM mantenimientos WHERE equipo_id = ? ORDER BY fecha_mantenimiento DESC`.
- **Regiones disponibles (para filtros del dashboard):**  
  `SELECT DISTINCT r.nombre FROM regiones r JOIN sucursales s ON s.region_id = r.id`  
  o, si se usa `region` como texto en `sucursales`: `SELECT DISTINCT region FROM sucursales WHERE region IS NOT NULL`.

---

## Notas de implementación

1. **IDs:** Se puede usar `UUID` (PostgreSQL `gen_random_uuid()`) o `VARCHAR(36)` con UUIDs generados en la app.
2. **`total_sucursales` en empresas:** Opcional; si se usa, conviene actualizarlo con trigger al insertar/borrar en `sucursales`.
3. **Región en sucursales:** Si no se usa la tabla `regiones`, se puede mantener una columna `region VARCHAR(100)` en `sucursales` y seguir llenando filtros y listas desde ahí; la app ya soporta “región” como texto.
4. **Soft delete:** Si se necesita borrado lógico, añadir `deleted_at TIMESTAMPTZ NULL` y filtrar en las consultas.

Si quieres, el siguiente paso puede ser un archivo `docs/schema.sql` con `CREATE TABLE` listos para pegar en PostgreSQL o MySQL.
