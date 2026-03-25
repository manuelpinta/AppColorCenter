-- =====================================================================
-- Color Center Management - Esquema normalizado MySQL 8.0+
-- =====================================================================
-- Requiere MySQL 8.0+
--
-- Este archivo incluye lo que antes estaba repartido en schema.sql +
-- extensiones puntuales (p. ej. usuarios con auth0_sub). Mantenimientos:
-- en bases reales suele NO existir la columna realizado_por; la app lo contempla.
--
-- Bases nuevas: ejecutar solo este script.
-- Bases antiguas (creadas solo con el schema.sql viejo): ver docs/schema-fase2.sql
--
-- Convenciones:
--   - IDs numéricos INT AUTO_INCREMENT para tablas propias de la app
--   - IDs INT (sin AUTO_INCREMENT) para tablas de referencia externa
--     (empresas, regiones, sucursales) que se sincronizan desde la BD
--     corporativa. Los nombres se resuelven con JOIN a la BD origen.
--   - FK a catálogos en lugar de CHECK constraints (normalización)
--   - Todas las tablas con created_at; las mutables con updated_at
--   - Catálogos con campo `activo` para desactivar sin borrar
-- =====================================================================
--
-- Revisión DDL (notas en archivo):
--   - "Tu nota:" = tus notas (revisión tuya; no las escribe la IA). Texto tal cual.
--     Ej.: "no la tengo" = no creaste esa tabla en tu DB (no es un cambio de contexto del producto).
--   - "Opinión (IA):" = comentario del asistente debajo de la tuya; sugerencia; el DDL del script sigue igual.
-- =====================================================================
--
-- =====================================================================
-- Empresas / regiones / sucursales
-- =====================================================================
-- No forman parte de este script: no están en esta DB; la app las obtiene de
-- la BD principal/común (mismos IDs numéricos donde aplica, p. ej. sucursal_id).
-- =====================================================================


-- =====================================================================
-- SECCIÓN 1: CATÁLOGOS
-- =====================================================================

CREATE TABLE cat_tipos_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_tipos_equipo (nombre) VALUES
  ('Tintometrico'), ('Mezcladora'), ('Regulador'), ('Equipo de Computo');
-- Tu nota: Esta correcto
-- Opinión (IA): Coincide con los nombres que usa la app (cat_tipos_equipo).

CREATE TABLE cat_estados_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_equipo (nombre) VALUES
  ('Operativo'), ('Mantenimiento'), ('Inactivo'), ('Fuera de Servicio');
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

CREATE TABLE cat_estados_sucursal (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_sucursal (nombre) VALUES
  ('Operativo'), ('Mantenimiento'), ('Inactivo');
-- Tu nota: No es necesario, en teoria si no esta en el catalogo del que las traemos no se muestra
-- Opinión (IA): Tiene sentido si el estado de sucursal solo vive en el catálogo corporativo.
--   En este DDL sigue existiendo porque sucursales.estado_id FK lo referencia; si en tu mundo
--   no hay tabla sucursales en esta BD, el catálogo puede ser prescindible en la práctica.

CREATE TABLE cat_estados_incidencia (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_incidencia (nombre) VALUES
  ('Reportada'), ('En atención'), ('Resuelta'), ('Cerrada');
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

CREATE TABLE cat_estados_mantenimiento (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_mantenimiento (nombre) VALUES
  ('Pendiente'), ('En Proceso'), ('Completado');
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

CREATE TABLE cat_severidades (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_severidades (nombre) VALUES
  ('Baja'), ('Media'), ('Alta'), ('Crítica');
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

CREATE TABLE cat_tipos_mantenimiento (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_tipos_mantenimiento (nombre) VALUES
  ('Preventivo'), ('Correctivo');
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

CREATE TABLE cat_tipos_propiedad (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_tipos_propiedad (nombre) VALUES
  ('Propio'), ('Arrendado');
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

CREATE TABLE marcas_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

-- Modelos de equipo (pertenecen a una marca)
CREATE TABLE modelos_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  marca_id INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_modelo_marca_nombre (marca_id, nombre),
  CONSTRAINT fk_modelo_marca FOREIGN KEY (marca_id) REFERENCES marcas_equipo(id) ON DELETE CASCADE
);
CREATE INDEX idx_modelos_marca ON modelos_equipo(marca_id);
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

-- Relación marcas ↔ tipos de equipo (filtrar marcas en formulario por tipo)
-- OMITIDA en esta variante local (no la tienes en tu DB por ahora).
-- Tu nota: No la tengo, que no la relacion la hace modelos_equipo?
-- Opinión (IA): "No la tengo" aquí = tabla no creada aún en tu DB. modelos_equipo no la sustituye:
--   cada modelo ya lleva marca_id, pero no dice qué marcas son válidas para "Tintométrico" vs "Mezcladora".
--   marca_tipo_equipo es solo para filtrar marcas por tipo en formularios; si no lo necesitas, puedes omitirla.

-- Arrendadores (empresas de las que se arriendan equipos)
CREATE TABLE arrendadores (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Tu nota: Esta correcto
-- Opinión (IA): OK.

-- =====================================================================
-- SECCIÓN 2: USUARIOS (nueva, propia de esta app)
-- =====================================================================

CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL UNIQUE,
  auth0_sub VARCHAR(255) DEFAULT NULL UNIQUE COMMENT 'Subject de Auth0 para mapear usuario de sesión -> usuario local',
  telefono VARCHAR(50) DEFAULT NULL,
  rol VARCHAR(50) DEFAULT NULL COMMENT 'Legacy; la app usa principalmente Auth0 para roles. Preferir rol_id si se mantienen seeds locales.',
  empresa_id VARCHAR(50) DEFAULT NULL COMMENT 'emp-1..emp-5; datos legacy / seed editores por empresa',
  rol_id TINYINT NOT NULL DEFAULT 1 COMMENT '1=Escritura 2=Admin 3=Lectura (significado en seeds locales)',
  zona_ids VARCHAR(50) DEFAULT NULL COMMENT '0=Todas; varios NumZona (base comun) separados por coma: 1,2,3',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_empresa (empresa_id),
  INDEX idx_usuarios_rol (rol_id)
);
-- Tu nota: Si la tengo pero no deberia de existir asi, se lleno con unos ejemplos de movimientos de equipo que hice, los usuarios estan por auth0, nos sirve de algo en realidad?
-- Opinión (IA): Sí sirve: el login es Auth0 pero las FK (reportado_por, tecnico_id, movimientos, etc.)
--   apuntan a usuarios.id local. La app puede crear filas al vuelo enlazando auth0_sub sin usar seeds.

-- =====================================================================
-- SECCIÓN 3: TABLAS DE REFERENCIA EXTERNAS (NO locales en tu DB)
-- =====================================================================
-- En tu entorno estas tablas viven en la BD principal/común, así que aquí
-- NO se crean: empresas, regiones, sucursales.
-- Tu nota: No la tengo, toda viene de la principal
-- Opinión (IA): Coherente; se mantiene fuera de este script local.

/* Referencia (desactivada en esta variante local):
CREATE TABLE empresas (
  id INT NOT NULL PRIMARY KEY COMMENT 'Mismo ID de la BD corporativa',
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  pais VARCHAR(100) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tu nota: No la tengo, toda viene de la principal
-- Opinión (IA): Coherente si empresas solo existen en la BD principal/comun; este bloque del script es modelo
--   de referencia o para quien replique espejo local. La app suele leer sucursales desde COMUN_DB_URL_*.

-- Regiones / Zonas por empresa (espejo de la BD corporativa)
CREATE TABLE regiones (
  id INT NOT NULL PRIMARY KEY COMMENT 'Mismo ID de la BD corporativa',
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_regiones_empresa_nombre (empresa_id, nombre),
  CONSTRAINT fk_regiones_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);
CREATE INDEX idx_regiones_empresa ON regiones(empresa_id);
-- Tu nota: No la tengo, toda viene de la principal
-- Opinión (IA): Mismo criterio que empresas: opcional en la BD Color Center si todo viene de la principal.

-- Sucursales / Color Centers (base de BD corporativa + campos propios de esta app)
CREATE TABLE sucursales (
  id INT NOT NULL PRIMARY KEY COMMENT 'Mismo ID de la BD corporativa',
  empresa_id INT NOT NULL,
  region_id INT DEFAULT NULL,
  codigo_interno VARCHAR(50) NOT NULL,
  nombre_sucursal VARCHAR(255) NOT NULL,
  ubicacion VARCHAR(500) DEFAULT NULL,
  -- Campos propios de Color Center Management:
  responsable_id INT DEFAULT NULL COMMENT 'FK a usuarios; responsable del color center',
  fecha_instalacion DATE DEFAULT NULL,
  estado_id INT NOT NULL COMMENT 'FK a cat_estados_sucursal',
  notas TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sucursales_empresa_codigo (empresa_id, codigo_interno),
  CONSTRAINT fk_sucursales_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_sucursales_region FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE SET NULL,
  CONSTRAINT fk_sucursales_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_sucursales_estado FOREIGN KEY (estado_id) REFERENCES cat_estados_sucursal(id)
);
CREATE INDEX idx_sucursales_empresa ON sucursales(empresa_id);
CREATE INDEX idx_sucursales_region ON sucursales(region_id);
CREATE INDEX idx_sucursales_empresa_region ON sucursales(empresa_id, region_id);
CREATE INDEX idx_sucursales_estado ON sucursales(estado_id);
-- Tu nota: no la tengo, toda viene de la principal
-- Opinión (IA): Igual: sucursales en runtime suelen ser la vista/tablas de la base comun; equipos.sucursal_id
--   en Color Center guarda el mismo id numérico de sucursal aunque la tabla sucursales no esté física aquí.
*/

-- =====================================================================
-- SECCIÓN 4: TABLAS PRINCIPALES (propias de esta app)
-- =====================================================================

-- Equipos (tintométricos, mezcladoras, etc.)
CREATE TABLE equipos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sucursal_id INT NOT NULL,
  tipo_equipo_id INT NOT NULL,
  marca_id INT DEFAULT NULL,
  modelo_id INT DEFAULT NULL,
  numero_serie VARCHAR(100) DEFAULT NULL,
  fecha_compra DATE DEFAULT NULL,
  tipo_propiedad_id INT NOT NULL,
  arrendador_id INT DEFAULT NULL COMMENT 'FK a arrendadores; solo si tipo_propiedad = Arrendado',
  fecha_vencimiento_arrendamiento DATE DEFAULT NULL,
  estado_id INT NOT NULL,
  ultima_calibracion DATE DEFAULT NULL,
  proxima_revision DATE DEFAULT NULL,
  codigo_qr VARCHAR(500) DEFAULT NULL,
  foto_url VARCHAR(500) DEFAULT NULL COMMENT 'Legacy; preferir equipo_fotos',
  documentos_url VARCHAR(500) DEFAULT NULL,
  notas TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipos_tipo FOREIGN KEY (tipo_equipo_id) REFERENCES cat_tipos_equipo(id),
  CONSTRAINT fk_equipos_marca FOREIGN KEY (marca_id) REFERENCES marcas_equipo(id) ON DELETE SET NULL,
  CONSTRAINT fk_equipos_modelo FOREIGN KEY (modelo_id) REFERENCES modelos_equipo(id) ON DELETE SET NULL,
  CONSTRAINT fk_equipos_propiedad FOREIGN KEY (tipo_propiedad_id) REFERENCES cat_tipos_propiedad(id),
  CONSTRAINT fk_equipos_arrendador FOREIGN KEY (arrendador_id) REFERENCES arrendadores(id) ON DELETE SET NULL,
  CONSTRAINT fk_equipos_estado FOREIGN KEY (estado_id) REFERENCES cat_estados_equipo(id)
);
CREATE INDEX idx_equipos_sucursal ON equipos(sucursal_id);
CREATE INDEX idx_equipos_tipo ON equipos(tipo_equipo_id);
CREATE INDEX idx_equipos_estado ON equipos(estado_id);
CREATE INDEX idx_equipos_marca ON equipos(marca_id);
CREATE INDEX idx_equipos_modelo ON equipos(modelo_id);
CREATE INDEX idx_equipos_arrendador ON equipos(arrendador_id);
-- Tu nota: Esta correcto pero no sirve codigoqr, foto ahi? va en otra tabla las fotos? Documento?
-- Opinión (IA): codigo_qr / foto_url / documentos_url son atajos o legacy. Fotos actuales: tabla equipo_fotos + Supabase.
--   documentos_url: un solo enlace; varios archivos implicarían otra tabla.

-- Fotos del equipo (varias por equipo, con fecha)
CREATE TABLE equipo_fotos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  fecha_foto DATE NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipo_fotos_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);
CREATE INDEX idx_equipo_fotos_equipo ON equipo_fotos(equipo_id);
CREATE INDEX idx_equipo_fotos_fecha ON equipo_fotos(fecha_foto);
-- Tu nota: Esta correcto

-- Especificaciones de equipo tipo Computadora (1:1 con equipos cuando tipo = Equipo de Computo)
CREATE TABLE equipo_computadora (
  equipo_id INT NOT NULL PRIMARY KEY,
  procesador VARCHAR(255) DEFAULT NULL COMMENT 'Ej: Intel Core i5 3.0 GHz',
  ram_gb INT DEFAULT NULL COMMENT 'Memoria RAM en GB, ej: 16',
  almacenamiento_gb INT DEFAULT NULL COMMENT 'Almacenamiento libre o total en GB',
  tipo_almacenamiento VARCHAR(20) DEFAULT NULL COMMENT 'SSD, HDD',
  graficos VARCHAR(255) DEFAULT NULL COMMENT 'Ej: Intel HD 530, Nvidia GTX, AMD',
  windows_version VARCHAR(100) DEFAULT NULL COMMENT 'Ej: Windows 11 Pro 23H2',
  so_64bits TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = 64 bits',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipo_computadora_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);
-- Tu nota: Esta correcto

-- Incidencias (reportes de problema)
CREATE TABLE incidencias (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT DEFAULT NULL,
  sucursal_id INT NOT NULL,
  reportado_por_id INT NOT NULL COMMENT 'FK a usuarios',
  fecha_reporte DATE NOT NULL,
  descripcion TEXT NOT NULL,
  severidad_id INT DEFAULT NULL,
  estado_id INT NOT NULL,
  notas TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidencias_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidencias_reportado FOREIGN KEY (reportado_por_id) REFERENCES usuarios(id),
  CONSTRAINT fk_incidencias_severidad FOREIGN KEY (severidad_id) REFERENCES cat_severidades(id),
  CONSTRAINT fk_incidencias_estado FOREIGN KEY (estado_id) REFERENCES cat_estados_incidencia(id)
);
CREATE INDEX idx_incidencias_sucursal ON incidencias(sucursal_id);
CREATE INDEX idx_incidencias_equipo ON incidencias(equipo_id);
CREATE INDEX idx_incidencias_estado ON incidencias(estado_id);
CREATE INDEX idx_incidencias_fecha ON incidencias(fecha_reporte);
-- Tu nota: Esta correcto

-- Mantenimientos (preventivos o correctivos)
-- Coincide con tablas ya creadas (p. ej. colorcentergallco.mantenimientos): sin realizado_por.
-- La app detecta si existe la columna (information_schema) y si no, asume Interno/Externo en UI
-- sin persistir realizado_por; ver lib/data/mantenimientos.ts (getSchemaCapabilities).
-- Opcional: ALTER TABLE mantenimientos ADD COLUMN realizado_por VARCHAR(20) NOT NULL DEFAULT 'Interno' COMMENT 'Interno | Externo';
CREATE TABLE mantenimientos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  incidencia_id INT DEFAULT NULL COMMENT 'Incidencia que originó el mantenimiento',
  tipo_id INT NOT NULL,
  tecnico_id INT DEFAULT NULL COMMENT 'FK a usuarios; técnico si Interno; NULL si Externo',
  fecha_mantenimiento DATE NOT NULL,
  descripcion TEXT NOT NULL,
  piezas_cambiadas TEXT DEFAULT NULL,
  tiempo_fuera_servicio DECIMAL(5,2) DEFAULT NULL COMMENT 'Horas fuera de servicio',
  costo DECIMAL(12,2) DEFAULT NULL,
  estado_id INT NOT NULL,
  notas TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mant_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  CONSTRAINT fk_mant_incidencia FOREIGN KEY (incidencia_id) REFERENCES incidencias(id) ON DELETE SET NULL,
  CONSTRAINT fk_mant_tipo FOREIGN KEY (tipo_id) REFERENCES cat_tipos_mantenimiento(id),
  CONSTRAINT fk_mant_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
  CONSTRAINT fk_mant_estado FOREIGN KEY (estado_id) REFERENCES cat_estados_mantenimiento(id)
);
CREATE INDEX idx_mant_equipo ON mantenimientos(equipo_id);
CREATE INDEX idx_mant_incidencia ON mantenimientos(incidencia_id);
CREATE INDEX idx_mant_tipo ON mantenimientos(tipo_id);
CREATE INDEX idx_mant_estado ON mantenimientos(estado_id);
CREATE INDEX idx_mant_fecha ON mantenimientos(fecha_mantenimiento);
-- Tu nota: Esta correcto

-- Fotos de mantenimiento (evidencia del trabajo realizado)
CREATE TABLE mantenimiento_fotos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  mantenimiento_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  fecha_foto DATE NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mantenimiento_fotos_mantenimiento FOREIGN KEY (mantenimiento_id) REFERENCES mantenimientos(id) ON DELETE CASCADE
);
CREATE INDEX idx_mantenimiento_fotos_mantenimiento ON mantenimiento_fotos(mantenimiento_id);
CREATE INDEX idx_mantenimiento_fotos_fecha ON mantenimiento_fotos(fecha_foto);
-- Tu nota: Esta correcto

-- Historial de movimientos de equipos entre sucursales
CREATE TABLE movimientos_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  sucursal_origen_id INT NOT NULL,
  sucursal_destino_id INT NOT NULL,
  fecha_movimiento DATE NOT NULL,
  motivo TEXT DEFAULT NULL,
  registrado_por_id INT DEFAULT NULL COMMENT 'FK a usuarios',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  CONSTRAINT fk_mov_registrado FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_mov_equipo ON movimientos_equipo(equipo_id);
CREATE INDEX idx_mov_fecha ON movimientos_equipo(fecha_movimiento);
-- Tu nota: Esta correcto
