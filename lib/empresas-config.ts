/**
 * Configuración de empresas sin dependencias de Node (mysql2, etc.).
 * Usado por lib/data/empresas y lib/data/ids para que el bundle del cliente
 * no cargue lib/db ni mysql2.
 */
export const EMPRESA_IDS = ["emp-1", "emp-2", "emp-3", "emp-4", "emp-5"] as const
export type EmpresaId = (typeof EMPRESA_IDS)[number]

/** Empresa Pintacomex (única que muestra campo Zona en formulario de equipo). */
export const PINTACOMEX_EMPRESA_ID: EmpresaId = "emp-1"

/** Mapeo empresa app -> clave env (sin prefijo COLORCENTER_DB_URL_). */
export const EMPRESA_TO_ENV_KEY: Record<EmpresaId, string> = {
  "emp-1": "PINTACOMEX",
  "emp-2": "GALLCO",
  "emp-3": "BELICE",
  "emp-4": "SALVADOR",
  "emp-5": "HONDURAS",
}
