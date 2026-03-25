export interface Empresa {
  id: string
  nombre: string
  codigo: string
  pais: string
  regiones: string[]
  total_sucursales: number
  created_at: string
}

export interface ColorCenter {
  id: string
  empresa_id: string
  codigo_interno: string
  nombre_sucursal: string
  region: string | null
  ubicacion: string | null
  responsable: string | null
  fecha_instalacion: string | null
  estado: "Operativo" | "Mantenimiento" | "Inactivo"
  notas: string | null
  created_at: string
  updated_at: string
}

export type TipoEquipo = "Tintometrico" | "Mezcladora" | "Regulador" | "Equipo de Computo"

export type TipoPropiedadEquipo = "Propio" | "Arrendado"

export interface Equipo {
  id: string
  color_center_id: string
  tipo_equipo: TipoEquipo
  marca: string | null
  modelo: string | null
  numero_serie: string | null
  fecha_compra: string | null
  tipo_propiedad: TipoPropiedadEquipo
  arrendador: string | null
  /** Fecha de vencimiento del contrato de arrendamiento (solo cuando tipo_propiedad = Arrendado). */
  fecha_vencimiento_arrendamiento: string | null
  estado: "Operativo" | "Mantenimiento" | "Inactivo" | "Fuera de Servicio"
  ultima_calibracion: string | null
  proxima_revision: string | null
  codigo_qr: string | null
  /** @deprecated Usar fotos del equipo (galería con fecha) en su lugar. */
  foto_url: string | null
  documentos_url: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

/** Especificaciones de equipo tipo Equipo de Computo (solo para ese tipo). */
export interface EquipoComputadora {
  equipo_id: string
  procesador: string | null
  ram_gb: number | null
  almacenamiento_gb: number | null
  tipo_almacenamiento: "SSD" | "HDD" | null
  graficos: string | null
  windows_version: string | null
  so_64bits: boolean
  created_at: string
  updated_at: string
}

/** Foto del equipo para ver estado; varias por equipo, cada una con fecha. */
export interface FotoEquipo {
  id: string
  equipo_id: string
  url: string
  /** Fecha en que se tomó la foto (para ver estado en el tiempo). */
  fecha_foto: string
  descripcion: string | null
  created_at: string
}

/** Foto de mantenimiento; varias por mantenimiento, cada una con fecha. */
export interface FotoMantenimiento {
  id: string
  mantenimiento_id: string
  url: string
  fecha_foto: string
  descripcion: string | null
  created_at: string
}

export interface Mantenimiento {
  id: string
  equipo_id: string
  /** Si el mantenimiento surgió de un reporte de incidencia. */
  incidencia_id: string | null
  tipo: "Preventivo" | "Correctivo"
  /** Si lo realizó nuestro soporte (Interno) o se llevó con externo (Externo). */
  realizado_por: "Interno" | "Externo"
  /** Nombre del técnico cuando realizado_por = Interno y hay tecnico_id. */
  tecnico_responsable: string | null
  fecha_mantenimiento: string
  descripcion: string
  piezas_cambiadas: string | null
  tiempo_fuera_servicio: number | null
  costo: number | null
  estado: "Pendiente" | "En Proceso" | "Completado"
  notas: string | null
  created_at: string
  updated_at: string
}

/** Severidad de una incidencia (opcional). */
export type SeveridadIncidencia = "Baja" | "Media" | "Alta" | "Crítica"

/** Estado del flujo de una incidencia. */
export type EstadoIncidencia = "Reportada" | "En atención" | "Resuelta" | "Cerrada"

/** Reporte de un problema (falla, avería, riesgo). Puede derivar en uno o más mantenimientos. */
export interface Incidencia {
  id: string
  /** Equipo afectado (opcional si se reporta a nivel sucursal). */
  equipo_id: string | null
  /** Sucursal donde se reporta (si no hay equipo específico, o para contexto). */
  sucursal_id: string
  /** Usuario que registró la incidencia (asignado automáticamente al crear). */
  quien_reporta: string | null
  fecha_reporte: string
  descripcion: string
  severidad: SeveridadIncidencia | null
  estado: EstadoIncidencia
  notas: string | null
  created_at: string
}

/** Registro de un movimiento de equipo de una sucursal a otra (para historial). */
export interface MovimientoEquipo {
  id: string
  equipo_id: string
  sucursal_origen_id: string
  sucursal_destino_id: string
  fecha_movimiento: string
  motivo: string | null
  registrado_por: string | null
  created_at: string
}

export interface ColorCenterWithEquipos extends ColorCenter {
  equipos: Equipo[]
}

export interface EquipoWithMantenimientos extends Equipo {
  mantenimientos: Mantenimiento[]
}

export interface EmpresaWithSucursales extends Empresa {
  sucursales: ColorCenter[]
}

/** Equipo con empresa_id e id compuesto para listados multi-DB (uso en cliente sin cargar lib/db). */
export type EquipoWithEmpresa = Equipo & { id: string; empresa_id: string }

/** Mantenimiento con empresa_id e id compuesto para listados multi-DB. */
export type MantenimientoWithEmpresa = Mantenimiento & { id: string; empresa_id: string }

/** Incidencia con empresa_id e id compuesto para listados multi-DB. */
export type IncidenciaWithEmpresa = Incidencia & { id: string; empresa_id: string }
