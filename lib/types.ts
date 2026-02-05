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
  estado: "Operativo" | "Mantenimiento" | "Inactivo" | "Fuera de Servicio"
  ultima_calibracion: string | null
  proxima_revision: string | null
  codigo_qr: string | null
  foto_url: string | null
  documentos_url: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Mantenimiento {
  id: string
  equipo_id: string
  tipo: "Preventivo" | "Correctivo"
  tecnico_responsable: string
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

export interface ColorCenterWithEquipos extends ColorCenter {
  equipos: Equipo[]
}

export interface EquipoWithMantenimientos extends Equipo {
  mantenimientos: Mantenimiento[]
}

export interface EmpresaWithSucursales extends Empresa {
  sucursales: ColorCenter[]
}
