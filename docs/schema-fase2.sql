-- =====================================================================
-- Color Center Management - Fase 2 (bases que YA tienen schema.sql)
-- =====================================================================
-- Ejecutar UNA VEZ en cada base Color Center que ya creaste con schema.sql.
-- Añade: usuarios (rol_id, empresa_id, zona_ids), mantenimientos, marca_tipo_equipo, seed.
--
-- Roles: rol_id en app → 1=Escritura, 2=Admin, 3=Lectura (sin cat_roles).
-- Zonas: usuarios.zona_ids (0=Todas; varios NumZona comun separados por coma: 1,2,3).
-- =====================================================================


-- =====================================================================
-- 1. Usuarios: rol_id, empresa_id, zona_ids (todo en esta tabla)
-- =====================================================================
-- Si alguna columna ya existe, ignorar el error.
ALTER TABLE usuarios ADD COLUMN empresa_id VARCHAR(50) DEFAULT NULL COMMENT 'emp-1..emp-5; solo para Editor';
ALTER TABLE usuarios ADD COLUMN rol_id TINYINT NOT NULL DEFAULT 1 COMMENT '1=Escritura 2=Admin 3=Lectura; significado en app';
ALTER TABLE usuarios ADD COLUMN zona_ids VARCHAR(50) DEFAULT NULL COMMENT '0=Todas; varios NumZona comun separados por coma: 1,2,3';
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);

-- Seed: 1 Admin, 1 Lectura, 10 Editors (zona_ids en usuarios)
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Admin', 2, NULL, '0', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Admin');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Lectura', 3, NULL, '0', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Lectura');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Gallco', 1, 'emp-2', '0', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Gallco');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Honduras', 1, 'emp-5', '0', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Honduras');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Belice', 1, 'emp-3', '0', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Belice');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor El Salvador', 1, 'emp-4', '0', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor El Salvador');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Pinta Gro Norte', 1, 'emp-1', '1', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Pinta Gro Norte');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Pinta Gro Centro', 1, 'emp-1', '2', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Pinta Gro Centro');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Pinta Gro Costa', 1, 'emp-1', '3', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Pinta Gro Costa');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Pinta Coatza-Mina', 1, 'emp-1', '4', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Pinta Coatza-Mina');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Pinta Acapulco', 1, 'emp-1', '5', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Pinta Acapulco');
INSERT INTO usuarios (nombre, rol_id, empresa_id, zona_ids, activo)
SELECT 'Editor Pinta Metro', 1, 'emp-1', '6', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Editor Pinta Metro');


-- =====================================================================
-- 2. Mantenimientos: realizado_por (Interno/Externo) y tecnico_id opcional
-- =====================================================================
ALTER TABLE mantenimientos ADD COLUMN realizado_por VARCHAR(20) NOT NULL DEFAULT 'Interno' COMMENT 'Interno | Externo';
ALTER TABLE mantenimientos MODIFY COLUMN tecnico_id INT DEFAULT NULL;


-- =====================================================================
-- 3. Marcas por tipo de equipo (filtrar marcas en formulario por tipo)
-- =====================================================================
CREATE TABLE IF NOT EXISTS marca_tipo_equipo (
  marca_id INT NOT NULL,
  tipo_equipo_id INT NOT NULL,
  PRIMARY KEY (marca_id, tipo_equipo_id),
  CONSTRAINT fk_mte_marca FOREIGN KEY (marca_id) REFERENCES marcas_equipo(id) ON DELETE CASCADE,
  CONSTRAINT fk_mte_tipo FOREIGN KEY (tipo_equipo_id) REFERENCES cat_tipos_equipo(id) ON DELETE CASCADE
);
CREATE INDEX idx_marca_tipo_equipo_tipo ON marca_tipo_equipo(tipo_equipo_id);
