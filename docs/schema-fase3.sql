-- Migracion fase 3: Tipo -> Marca -> Modelo y equipos relacionados
-- Ejecutar por empresa (cada BD Color Center)

CREATE TABLE IF NOT EXISTS marca_tipo_equipo (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  marca_id INT NOT NULL,
  tipo_equipo_id INT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_marca_tipo (marca_id, tipo_equipo_id),
  CONSTRAINT fk_marca_tipo_marca FOREIGN KEY (marca_id) REFERENCES marcas_equipo(id) ON DELETE CASCADE,
  CONSTRAINT fk_marca_tipo_tipo FOREIGN KEY (tipo_equipo_id) REFERENCES cat_tipos_equipo(id) ON DELETE CASCADE
);

SET @db := DATABASE();

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'equipos' AND column_name = 'equipo_ups_id'
    ),
    'SELECT 1',
    'ALTER TABLE equipos ADD COLUMN equipo_ups_id INT DEFAULT NULL COMMENT ''Equipo UPS asociado'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'equipos' AND column_name = 'equipo_regulador_id'
    ),
    'SELECT 1',
    'ALTER TABLE equipos ADD COLUMN equipo_regulador_id INT DEFAULT NULL COMMENT ''Equipo regulador asociado'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'equipos' AND column_name = 'equipo_impresora_id'
    ),
    'SELECT 1',
    'ALTER TABLE equipos ADD COLUMN equipo_impresora_id INT DEFAULT NULL COMMENT ''Equipo impresora asociado'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = @db AND table_name = 'equipos' AND constraint_name = 'fk_equipos_ups'
    ),
    'SELECT 1',
    'ALTER TABLE equipos ADD CONSTRAINT fk_equipos_ups FOREIGN KEY (equipo_ups_id) REFERENCES equipos(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = @db AND table_name = 'equipos' AND constraint_name = 'fk_equipos_regulador'
    ),
    'SELECT 1',
    'ALTER TABLE equipos ADD CONSTRAINT fk_equipos_regulador FOREIGN KEY (equipo_regulador_id) REFERENCES equipos(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = @db AND table_name = 'equipos' AND constraint_name = 'fk_equipos_impresora'
    ),
    'SELECT 1',
    'ALTER TABLE equipos ADD CONSTRAINT fk_equipos_impresora FOREIGN KEY (equipo_impresora_id) REFERENCES equipos(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db AND table_name = 'marca_tipo_equipo' AND index_name = 'idx_marca_tipo_marca'
    ),
    'SELECT 1',
    'CREATE INDEX idx_marca_tipo_marca ON marca_tipo_equipo(marca_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db AND table_name = 'marca_tipo_equipo' AND index_name = 'idx_marca_tipo_tipo'
    ),
    'SELECT 1',
    'CREATE INDEX idx_marca_tipo_tipo ON marca_tipo_equipo(tipo_equipo_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db AND table_name = 'equipos' AND index_name = 'idx_equipos_ups'
    ),
    'SELECT 1',
    'CREATE INDEX idx_equipos_ups ON equipos(equipo_ups_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db AND table_name = 'equipos' AND index_name = 'idx_equipos_regulador'
    ),
    'SELECT 1',
    'CREATE INDEX idx_equipos_regulador ON equipos(equipo_regulador_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db AND table_name = 'equipos' AND index_name = 'idx_equipos_impresora'
    ),
    'SELECT 1',
    'CREATE INDEX idx_equipos_impresora ON equipos(equipo_impresora_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill inicial: mapear marcas por tipo a partir de equipos historicos
INSERT IGNORE INTO marca_tipo_equipo (marca_id, tipo_equipo_id, activo)
SELECT DISTINCT e.marca_id, e.tipo_equipo_id, 1
FROM equipos e
WHERE e.marca_id IS NOT NULL;

-- Reporte de datos invalidos: modelo que no pertenece a la marca actual
SELECT e.id, e.marca_id, e.modelo_id
FROM equipos e
JOIN modelos_equipo mo ON mo.id = e.modelo_id
WHERE e.modelo_id IS NOT NULL AND e.marca_id IS NOT NULL AND mo.marca_id <> e.marca_id;
