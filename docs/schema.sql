-- Color Center Management - Esquema de base de datos
-- Probado para PostgreSQL. Para MySQL: cambiar UUID por CHAR(36), TIMESTAMPTZ por DATETIME, SERIAL por AUTO_INCREMENT.

-- Extension para UUID (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Empresas
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  pais VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Regiones (zonas por empresa)
CREATE TABLE regiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, nombre)
);
CREATE INDEX idx_regiones_empresa ON regiones(empresa_id);

-- 3. Sucursales (Color Centers)
CREATE TABLE sucursales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regiones(id) ON DELETE SET NULL,
  codigo_interno VARCHAR(50) NOT NULL,
  nombre_sucursal VARCHAR(255) NOT NULL,
  ubicacion VARCHAR(500),
  responsable VARCHAR(255),
  fecha_instalacion DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'Operativo'
    CHECK (estado IN ('Operativo', 'Mantenimiento', 'Inactivo')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo_interno)
);
CREATE INDEX idx_sucursales_empresa ON sucursales(empresa_id);
CREATE INDEX idx_sucursales_region ON sucursales(region_id);
CREATE INDEX idx_sucursales_empresa_region ON sucursales(empresa_id, region_id);

-- 4. Equipos
CREATE TABLE equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_center_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  tipo_equipo VARCHAR(50) NOT NULL
    CHECK (tipo_equipo IN ('Tintometrico', 'Mezcladora', 'Regulador', 'Equipo de Computo')),
  marca VARCHAR(255),
  modelo VARCHAR(255),
  numero_serie VARCHAR(100),
  fecha_compra DATE,
  tipo_propiedad VARCHAR(20) NOT NULL DEFAULT 'Propio'
    CHECK (tipo_propiedad IN ('Propio', 'Arrendado')),
  arrendador VARCHAR(255),
  estado VARCHAR(30) NOT NULL DEFAULT 'Operativo'
    CHECK (estado IN ('Operativo', 'Mantenimiento', 'Inactivo', 'Fuera de Servicio')),
  ultima_calibracion DATE,
  proxima_revision DATE,
  codigo_qr VARCHAR(500),
  foto_url VARCHAR(500),
  documentos_url VARCHAR(500),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_equipos_color_center ON equipos(color_center_id);
CREATE INDEX idx_equipos_estado ON equipos(estado);
CREATE INDEX idx_equipos_tipo ON equipos(tipo_equipo);

-- 5. Mantenimientos
CREATE TABLE mantenimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Preventivo', 'Correctivo')),
  tecnico_responsable VARCHAR(255) NOT NULL,
  fecha_mantenimiento DATE NOT NULL,
  descripcion TEXT NOT NULL,
  piezas_cambiadas TEXT,
  tiempo_fuera_servicio DECIMAL(5,2),
  costo DECIMAL(12,2),
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente', 'En Proceso', 'Completado')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mantenimientos_equipo ON mantenimientos(equipo_id);
CREATE INDEX idx_mantenimientos_fecha ON mantenimientos(fecha_mantenimiento);
CREATE INDEX idx_mantenimientos_estado ON mantenimientos(estado);

-- Trigger para updated_at (PostgreSQL)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sucursales_updated_at
  BEFORE UPDATE ON sucursales FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER equipos_updated_at
  BEFORE UPDATE ON equipos FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER mantenimientos_updated_at
  BEFORE UPDATE ON mantenimientos FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
