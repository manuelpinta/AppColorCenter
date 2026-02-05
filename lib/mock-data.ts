import type { Empresa, ColorCenter, Equipo, Mantenimiento, TipoEquipo } from "./types"

// 5 Empresas principales con sus regiones y totales reales
export const mockEmpresas: Empresa[] = [
  {
    id: "emp-1",
    nombre: "Pintacomex",
    codigo: "PNTCMX",
    pais: "Mexico",
    regiones: ["Golfo", "Guerrero", "Metro"],
    total_sucursales: 83,
    created_at: "2020-01-01T00:00:00Z",
  },
  {
    id: "emp-2",
    nombre: "Gallco",
    codigo: "GLLCO",
    pais: "Mexico",
    regiones: ["Aguascalientes"],
    total_sucursales: 38,
    created_at: "2020-01-01T00:00:00Z",
  },
  {
    id: "emp-3",
    nombre: "Belice",
    codigo: "BLCE",
    pais: "Belice",
    regiones: ["Belice"],
    total_sucursales: 12,
    created_at: "2021-01-01T00:00:00Z",
  },
  {
    id: "emp-4",
    nombre: "El Salvador",
    codigo: "SLVDR",
    pais: "El Salvador",
    regiones: ["El Salvador"],
    total_sucursales: 20,
    created_at: "2021-06-01T00:00:00Z",
  },
  {
    id: "emp-5",
    nombre: "Honduras",
    codigo: "HNDRS",
    pais: "Honduras",
    regiones: ["Honduras"],
    total_sucursales: 13,
    created_at: "2022-01-01T00:00:00Z",
  },
]

// Generar sucursales de prueba - muestra representativa
function generarSucursalesPintacomex(): ColorCenter[] {
  const regiones = ["Golfo", "Guerrero", "Metro"]
  const sucursales: ColorCenter[] = []
  let id = 1
  
  // Generar sucursales por region
  const sucursalesPorRegion = {
    "Metro": 30,
    "Golfo": 28, 
    "Guerrero": 25
  }
  
  for (const region of regiones) {
    const cantidad = sucursalesPorRegion[region as keyof typeof sucursalesPorRegion]
    for (let i = 1; i <= cantidad; i++) {
      sucursales.push({
        id: String(id),
        empresa_id: "emp-1",
        codigo_interno: `PNT-${region.substring(0, 3).toUpperCase()}-${String(i).padStart(3, "0")}`,
        nombre_sucursal: `Sucursal ${region} ${i}`,
        region: region,
        ubicacion: `Ubicacion ${region} ${i}`,
        responsable: `Responsable ${i}`,
        estado: i % 10 === 0 ? "Mantenimiento" : i % 15 === 0 ? "Inactivo" : "Operativo",
        fecha_instalacion: "2023-01-15",
        notas: null,
        created_at: "2023-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      })
      id++
    }
  }
  return sucursales
}

function generarSucursalesGallco(): ColorCenter[] {
  const sucursales: ColorCenter[] = []
  const baseId = 84
  
  for (let i = 1; i <= 38; i++) {
    sucursales.push({
      id: String(baseId + i - 1),
      empresa_id: "emp-2",
      codigo_interno: `GLC-AGS-${String(i).padStart(3, "0")}`,
      nombre_sucursal: `Gallco Aguascalientes ${i}`,
      region: "Aguascalientes",
      ubicacion: `Ubicacion Aguascalientes ${i}`,
      responsable: `Responsable ${i}`,
      estado: i % 8 === 0 ? "Mantenimiento" : i % 12 === 0 ? "Inactivo" : "Operativo",
      fecha_instalacion: "2022-06-10",
      notas: null,
      created_at: "2022-06-10T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    })
  }
  return sucursales
}

function generarSucursalesBelice(): ColorCenter[] {
  const sucursales: ColorCenter[] = []
  const baseId = 122
  
  for (let i = 1; i <= 12; i++) {
    sucursales.push({
      id: String(baseId + i - 1),
      empresa_id: "emp-3",
      codigo_interno: `BLC-${String(i).padStart(3, "0")}`,
      nombre_sucursal: `Belice ${i}`,
      region: "Belice",
      ubicacion: `Ubicacion Belice ${i}`,
      responsable: `Responsable ${i}`,
      estado: i % 6 === 0 ? "Mantenimiento" : "Operativo",
      fecha_instalacion: "2022-06-01",
      notas: null,
      created_at: "2022-06-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    })
  }
  return sucursales
}

function generarSucursalesElSalvador(): ColorCenter[] {
  const sucursales: ColorCenter[] = []
  const baseId = 134
  
  for (let i = 1; i <= 20; i++) {
    sucursales.push({
      id: String(baseId + i - 1),
      empresa_id: "emp-4",
      codigo_interno: `SLV-${String(i).padStart(3, "0")}`,
      nombre_sucursal: `El Salvador ${i}`,
      region: "El Salvador",
      ubicacion: `Ubicacion El Salvador ${i}`,
      responsable: `Responsable ${i}`,
      estado: i % 7 === 0 ? "Mantenimiento" : i % 10 === 0 ? "Inactivo" : "Operativo",
      fecha_instalacion: "2022-08-01",
      notas: null,
      created_at: "2022-08-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    })
  }
  return sucursales
}

function generarSucursalesHonduras(): ColorCenter[] {
  const sucursales: ColorCenter[] = []
  const baseId = 154
  
  for (let i = 1; i <= 13; i++) {
    sucursales.push({
      id: String(baseId + i - 1),
      empresa_id: "emp-5",
      codigo_interno: `HND-${String(i).padStart(3, "0")}`,
      nombre_sucursal: `Honduras ${i}`,
      region: "Honduras",
      ubicacion: `Ubicacion Honduras ${i}`,
      responsable: `Responsable ${i}`,
      estado: i % 5 === 0 ? "Mantenimiento" : "Operativo",
      fecha_instalacion: "2022-10-01",
      notas: null,
      created_at: "2022-10-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    })
  }
  return sucursales
}

// Total: 166 sucursales
export const mockColorCenters: ColorCenter[] = [
  ...generarSucursalesPintacomex(),
  ...generarSucursalesGallco(),
  ...generarSucursalesBelice(),
  ...generarSucursalesElSalvador(),
  ...generarSucursalesHonduras(),
]

// Funcion helper para generar equipos por sucursal
function generarEquiposSucursal(colorCenterId: string, baseId: number): Equipo[] {
  const tiposEquipo: { tipo: TipoEquipo; marca: string; modelo: string }[] = [
    { tipo: "Tintometrico", marca: "ColorMix Pro", modelo: "TM-5000" },
    { tipo: "Mezcladora", marca: "ShakeMaster", modelo: "MX-300" },
    { tipo: "Regulador", marca: "PowerGuard", modelo: "RG-120" },
    { tipo: "Equipo de Computo", marca: "Dell", modelo: "OptiPlex 7090" },
  ]

  return tiposEquipo.map((equipo, index) => ({
    id: `eq-${colorCenterId}-${index}`,
    color_center_id: colorCenterId,
    tipo_equipo: equipo.tipo,
    marca: equipo.marca,
    modelo: equipo.modelo,
    numero_serie: `SN-${colorCenterId}-${equipo.tipo.substring(0, 3).toUpperCase()}-${String(baseId + index).padStart(3, "0")}`,
    fecha_compra: "2023-01-15",
    tipo_propiedad: (index % 5 === 0 ? "Arrendado" : "Propio") as "Propio" | "Arrendado",
    arrendador: index % 5 === 0 ? "Equipos Industriales SA" : null,
    estado: "Operativo" as const,
    ultima_calibracion: equipo.tipo !== "Equipo de Computo" ? "2024-09-15" : null,
    proxima_revision: equipo.tipo !== "Equipo de Computo" ? "2025-03-15" : "2025-01-15",
    codigo_qr: null,
    foto_url: null,
    documentos_url: null,
    notas: null,
    created_at: "2023-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  }))
}

// Generar equipos para todas las sucursales (4 equipos por sucursal = 664 equipos)
export const mockEquipos: Equipo[] = mockColorCenters.flatMap((sucursal, index) => 
  generarEquiposSucursal(sucursal.id, index * 4 + 1)
)

export const mockMantenimientos: Mantenimiento[] = [
  {
    id: "1",
    equipo_id: "eq-1-0",
    tipo: "Preventivo",
    fecha_mantenimiento: "2024-09-15",
    tecnico_responsable: "Carlos Mendez",
    descripcion: "Calibracion y limpieza general del tintometrico",
    piezas_cambiadas: "Filtros, boquillas",
    tiempo_fuera_servicio: 2,
    costo: 1500.0,
    estado: "Completado",
    notas: "Mantenimiento programado exitoso",
    created_at: "2024-09-15T00:00:00Z",
    updated_at: "2024-09-15T00:00:00Z",
  },
  {
    id: "2",
    equipo_id: "eq-2-1",
    tipo: "Preventivo",
    fecha_mantenimiento: "2024-10-01",
    tecnico_responsable: "Carlos Mendez",
    descripcion: "Revision de motor y sistema de agitacion de mezcladora",
    piezas_cambiadas: "Rodamientos",
    tiempo_fuera_servicio: 1.5,
    costo: 800.0,
    estado: "Completado",
    notas: "Todo en orden",
    created_at: "2024-10-01T00:00:00Z",
    updated_at: "2024-10-01T00:00:00Z",
  },
  {
    id: "3",
    equipo_id: "eq-10-0",
    tipo: "Correctivo",
    fecha_mantenimiento: "2024-10-25",
    tecnico_responsable: "Luis Hernandez",
    descripcion: "Reparacion de fuga en sistema de dispensado",
    piezas_cambiadas: "Sellos, mangueras",
    tiempo_fuera_servicio: 4,
    costo: 2500.0,
    estado: "En Proceso",
    notas: "Esperando piezas de reemplazo",
    created_at: "2024-10-25T00:00:00Z",
    updated_at: "2024-10-25T00:00:00Z",
  },
  {
    id: "4",
    equipo_id: "eq-84-0",
    tipo: "Preventivo",
    fecha_mantenimiento: "2024-09-20",
    tecnico_responsable: "Luis Hernandez",
    descripcion: "Calibracion trimestral de tintometrico",
    piezas_cambiadas: "Boquillas",
    tiempo_fuera_servicio: 2,
    costo: 1200.0,
    estado: "Completado",
    notas: "Calibracion exitosa",
    created_at: "2024-09-20T00:00:00Z",
    updated_at: "2024-09-20T00:00:00Z",
  },
  {
    id: "5",
    equipo_id: "eq-122-0",
    tipo: "Preventivo",
    fecha_mantenimiento: "2024-11-15",
    tecnico_responsable: "Maria Gonzalez",
    descripcion: "Mantenimiento preventivo programado",
    piezas_cambiadas: "Filtros",
    tiempo_fuera_servicio: 1.5,
    costo: 900.0,
    estado: "Pendiente",
    notas: "Proximo mantenimiento programado",
    created_at: "2024-10-20T00:00:00Z",
    updated_at: "2024-10-20T00:00:00Z",
  },
]

// Helper para obtener empresa por ID de sucursal
export function getEmpresaBySucursalId(sucursalId: string): Empresa | undefined {
  const sucursal = mockColorCenters.find((c) => c.id === sucursalId)
  if (!sucursal) return undefined
  return mockEmpresas.find((e) => e.id === sucursal.empresa_id)
}

// Helper para obtener sucursales por empresa
export function getSucursalesByEmpresa(empresaId: string): ColorCenter[] {
  return mockColorCenters.filter((c) => c.empresa_id === empresaId)
}

// Helper para obtener regiones únicas (zonas)
export function getRegionesDisponibles(): string[] {
  return Array.from(new Set(mockColorCenters.map((c) => c.region).filter(Boolean))) as string[]
}

/** Sucursales por empresa y, si aplica, por zona (región). Para Pintacomex usar zona; Gallco/CAM solo empresa. */
export function getSucursalesByEmpresaAndZona(empresaId: string, zona?: string | null): ColorCenter[] {
  const porEmpresa = mockColorCenters.filter((c) => c.empresa_id === empresaId)
  if (!zona) return porEmpresa
  return porEmpresa.filter((c) => c.region === zona)
}

/** ID de empresa Pintacomex (única que muestra campo Zona). */
export const PINTACOMEX_EMPRESA_ID = "emp-1"

// Tipos de equipo disponibles
export const tiposEquipoDisponibles: TipoEquipo[] = [
  "Tintometrico",
  "Mezcladora",
  "Regulador",
  "Equipo de Computo",
]
