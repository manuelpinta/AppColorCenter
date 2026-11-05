-- Número de contrato de arrendamiento en equipos.
-- Ejecutar en CADA base Color Center (Pintacomex, Gallco, Belice, Salvador, Honduras).

SET @db := DATABASE();

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'equipos' AND column_name = 'numero_contrato'
    ),
    'SELECT 1',
    'ALTER TABLE equipos ADD COLUMN numero_contrato VARCHAR(100) DEFAULT NULL COMMENT ''Número de contrato; solo si Arrendado'' AFTER fecha_vencimiento_arrendamiento'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
