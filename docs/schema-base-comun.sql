-- =====================================================================
-- Color Center Management - Base común (MySQL 8.0+)
-- =====================================================================
-- Ejecutar contra la base que usa COLORCENTER_COMUN_DB_URL.
-- Crea: empresas, usuarios (obligatorios); opcionalmente cat_roles,
--       app_config, login_log.
-- Documentación: schema-base-comun.md, BASE-COMUN-Y-LOGIN.md
-- =====================================================================


-- =====================================================================
-- SECCIÓN 1: EMPRESAS (listado y FK desde usuarios)
-- =====================================================================

CREATE TABLE empresas (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'emp-1..emp-5; mismo que getPool(empresaId)',
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  pais VARCHAR(100) DEFAULT NULL,
  env_key VARCHAR(50) NOT NULL COMMENT 'COLORCENTER_DB_URL_ + env_key',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_empresas_codigo (codigo),
  INDEX idx_empresas_activo (activo)
);

INSERT INTO empresas (id, codigo, nombre, pais, env_key, activo) VALUES
('emp-1', 'PINTA', 'Pintacomex', 'México', 'PINTACOMEX', 1),
('emp-2', 'GALLCO', 'Gallco', 'México', 'GALLCO', 1),
('emp-3', 'BELICE', 'Belice', 'Belice', 'BELICE', 1),
('emp-4', 'SALVADOR', 'El Salvador', 'El Salvador', 'SALVADOR', 1),
('emp-5', 'HONDURAS', 'Honduras', 'Honduras', 'HONDURAS', 1);


-- =====================================================================
-- SECCIÓN 2: USUARIOS (login, permisos, empresa_id, zona_ids)
-- =====================================================================

CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  telefono VARCHAR(50) DEFAULT NULL,
  rol_id TINYINT NOT NULL DEFAULT 1 COMMENT '1=Escritura 2=Admin 3=Lectura',
  empresa_id VARCHAR(50) DEFAULT NULL COMMENT 'FK empresas.id; NULL=todas para Admin/Lectura',
  zona_ids VARCHAR(50) DEFAULT NULL COMMENT '0=Todas; o 1,2,3 (NumZona comun)',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuarios_login (login),
  UNIQUE KEY uk_usuarios_email (email),
  INDEX idx_usuarios_empresa (empresa_id),
  INDEX idx_usuarios_activo (activo),
  INDEX idx_usuarios_empresa_activo (empresa_id, activo),
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);


-- =====================================================================
-- SECCIÓN 3: OPCIONALES (cat_roles, app_config, login_log)
-- =====================================================================
-- Si no quieres estas tablas, comenta o no ejecutes esta sección.
-- =====================================================================

CREATE TABLE IF NOT EXISTS cat_roles (
  id TINYINT NOT NULL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_roles (id, nombre, activo) VALUES
(1, 'Escritura', 1),
(2, 'Admin', 1),
(3, 'Lectura', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo);

CREATE TABLE IF NOT EXISTS app_config (
  clave VARCHAR(100) NOT NULL PRIMARY KEY,
  valor TEXT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_log (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  INDEX idx_login_log_usuario (usuario_id),
  INDEX idx_login_log_fecha (fecha),
  CONSTRAINT fk_login_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
