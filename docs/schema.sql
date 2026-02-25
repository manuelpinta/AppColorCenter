-- =====================================================================
-- Color Center Management - Esquema normalizado MySQL 8.0+
-- =====================================================================
-- Requiere MySQL 8.0+
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

CREATE TABLE cat_estados_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_equipo (nombre) VALUES
  ('Operativo'), ('Mantenimiento'), ('Inactivo'), ('Fuera de Servicio');

CREATE TABLE cat_estados_sucursal (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_sucursal (nombre) VALUES
  ('Operativo'), ('Mantenimiento'), ('Inactivo');

CREATE TABLE cat_estados_incidencia (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_incidencia (nombre) VALUES
  ('Reportada'), ('En atención'), ('Resuelta'), ('Cerrada');

CREATE TABLE cat_estados_mantenimiento (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_estados_mantenimiento (nombre) VALUES
  ('Pendiente'), ('En Proceso'), ('Completado');

CREATE TABLE cat_severidades (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_severidades (nombre) VALUES
  ('Baja'), ('Media'), ('Alta'), ('Crítica');

CREATE TABLE cat_tipos_mantenimiento (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_tipos_mantenimiento (nombre) VALUES
  ('Preventivo'), ('Correctivo');

CREATE TABLE cat_tipos_propiedad (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_tipos_propiedad (nombre) VALUES
  ('Propio'), ('Arrendado');

CREATE TABLE marcas_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- Arrendadores (empresas de las que se arriendan equipos)
CREATE TABLE arrendadores (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- SECCIÓN 2: USUARIOS (nueva, propia de esta app)
-- =====================================================================

CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL UNIQUE,
  telefono VARCHAR(50) DEFAULT NULL,
  rol VARCHAR(50) DEFAULT NULL COMMENT 'Ej: Admin, Técnico, Supervisor',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- =====================================================================
-- SECCIÓN 3: TABLAS DE REFERENCIA (sincronizadas desde BD corporativa)
-- Los IDs coinciden con la BD origen. NO se crean desde esta app.
-- =====================================================================

-- Empresas (espejo de la BD corporativa)
CREATE TABLE empresas (
  id INT NOT NULL PRIMARY KEY COMMENT 'Mismo ID de la BD corporativa',
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  pais VARCHAR(100) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
  CONSTRAINT fk_equipos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
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
  CONSTRAINT fk_incidencias_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
  CONSTRAINT fk_incidencias_reportado FOREIGN KEY (reportado_por_id) REFERENCES usuarios(id),
  CONSTRAINT fk_incidencias_severidad FOREIGN KEY (severidad_id) REFERENCES cat_severidades(id),
  CONSTRAINT fk_incidencias_estado FOREIGN KEY (estado_id) REFERENCES cat_estados_incidencia(id)
);
CREATE INDEX idx_incidencias_sucursal ON incidencias(sucursal_id);
CREATE INDEX idx_incidencias_equipo ON incidencias(equipo_id);
CREATE INDEX idx_incidencias_estado ON incidencias(estado_id);
CREATE INDEX idx_incidencias_fecha ON incidencias(fecha_reporte);

-- Mantenimientos (preventivos o correctivos)
CREATE TABLE mantenimientos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  incidencia_id INT DEFAULT NULL COMMENT 'Incidencia que originó el mantenimiento',
  tipo_id INT NOT NULL,
  tecnico_id INT NOT NULL COMMENT 'FK a usuarios; técnico responsable',
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
  CONSTRAINT fk_mov_origen FOREIGN KEY (sucursal_origen_id) REFERENCES sucursales(id),
  CONSTRAINT fk_mov_destino FOREIGN KEY (sucursal_destino_id) REFERENCES sucursales(id),
  CONSTRAINT fk_mov_registrado FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_mov_equipo ON movimientos_equipo(equipo_id);
CREATE INDEX idx_mov_fecha ON movimientos_equipo(fecha_movimiento);
