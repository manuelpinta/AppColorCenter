// Empresas y configuración
export {
  APP_EMPRESAS,
  PINTACOMEX_EMPRESA_ID,
  getEmpresas,
  getEmpresaById,
} from "./empresas"

// Catálogos
export {
  getCatalogoNombres,
  getTiposEquipo,
  getMarcasEquipo,
  getModelosByMarca,
  getArrendadores,
  crearMarca,
  crearModelo,
  crearArrendador,
} from "./catalogos"

// IDs compuestos (sin lib/db — seguro para cliente)
export {
  buildSucursalCompositeId,
  buildSucursalCompositeIdFromIds,
  parseSucursalId,
  buildEquipoCompositeId,
  parseEquipoId,
} from "./ids"

// Sucursales
export {
  getSucursalesByEmpresa,
  getSucursalesByEmpresaAndZona,
  getRegionesDisponibles,
  getRegionesDisponiblesAllBases,
  getRegionesFromColorCenters,
  getColorCentersAllBases,
  getSucursalByCompositeId,
} from "./sucursales"

// Equipos
export {
  getEquipos,
  getEquiposBySucursal,
  getEquiposByEmpresa,
  getEquipoById,
  actualizarEquipo,
  crearEquipo,
  findEquipoInAllBases,
  getEquiposAllBases,
} from "./equipos"
export type { EquipoWithEmpresa } from "@/lib/types"

// Fotos de equipo
export {
  getFotosByEquipoId,
  crearFotoEquipo,
  eliminarFotoEquipo,
} from "./fotos"

// Computadora (especificaciones)
export { getComputadoraByEquipoId, actualizarComputadora } from "./computadora"

// Incidencias
export {
  getIncidencias,
  getIncidenciasByEquipoId,
  getIncidenciasBySucursalId,
  getIncidenciaById,
  crearIncidencia,
  getIncidenciasAllBases,
  findIncidenciaInAllBases,
} from "./incidencias"
export type { IncidenciaWithEmpresa } from "@/lib/types"

// Mantenimientos
export {
  getMantenimientos,
  getMantenimientosByIncidenciaId,
  getMantenimientosByEquipoId,
  getMantenimientoById,
  getMantenimientosAllBases,
  findMantenimientoInAllBases,
} from "./mantenimientos"
export type { MantenimientoWithEmpresa } from "@/lib/types"

// Movimientos de equipo
export {
  getMovimientosByEquipoId,
  registrarMovimientoEquipo,
} from "./movimientos"

// Usuarios (helpers para reportado_por / técnico)
export {
  getOrCreateUsuarioByNombre,
  getNombreUsuarioById,
} from "./usuarios"
