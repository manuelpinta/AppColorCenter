import mysql from "mysql2/promise"
import { EMPRESA_IDS, EMPRESA_TO_ENV_KEY, type EmpresaId } from "@/lib/empresas-config"
import { getCachedAllowedEmpresaIds } from "@/lib/allowed-empresas-context"
import { userHasRole } from "@/lib/auth-roles"

export { EMPRESA_IDS, type EmpresaId }

/** Convierte URL en formato Python (mysql+pymysql://) a formato Node (mysql://). */
function toNodeUrl(url: string): string {
  return url.replace(/^mysql\+pymysql:\/\//, "mysql://")
}

function getUrlForEmpresa(empresaId: EmpresaId): string | null {
  const key = EMPRESA_TO_ENV_KEY[empresaId]
  if (!key) return null
  const envKey = `COLORCENTER_DB_URL_${key}`
  const url = process.env[envKey]
  if (!url || typeof url !== "string") return null
  return toNodeUrl(url)
}

const pools = new Map<EmpresaId, mysql.Pool>()

/** Quita el pool Color Center de esa empresa para forzar reconexión (útil tras ECONNRESET). */
export function clearPool(empresaId: EmpresaId): void {
  const pool = pools.get(empresaId)
  if (pool) {
    try {
      pool.end().catch(() => {})
    } catch {
      // ignore
    }
    pools.delete(empresaId)
  }
}

/**
 * Límite de conexiones por pool. Con 5 empresas = 5 pools; pico = 5 × este valor (y otro tanto si usas bases "comun").
 * Por defecto 1 para no superar max_connections del servidor MySQL (sobre todo si todas las empresas apuntan al mismo servidor).
 * Ajustable con MYSQL_POOL_CONNECTION_LIMIT (ej. 2 o 3 si tu MySQL tiene margen).
 */
const MYSQL_POOL_CONNECTION_LIMIT = Number(process.env.MYSQL_POOL_CONNECTION_LIMIT) || 1

/** Parsea URL MySQL a opciones para createPool (keepalive, timeout). */
function parseMysqlUrl(url: string): mysql.PoolOptions {
  const u = new URL(url.replace(/^mysql:\/\//, "http://"))
  const database = u.pathname.slice(1).replace(/%2F/g, "/")
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    database: database || undefined,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10_000,
    waitForConnections: true,
    connectionLimit: MYSQL_POOL_CONNECTION_LIMIT,
  }
}

/**
 * Devuelve el pool de MySQL para la empresa dada (base Color Center).
 * Crea el pool a la primera petición (lazy).
 */
export async function getPool(empresaId: string): Promise<mysql.Pool> {
  if (!EMPRESA_IDS.includes(empresaId as EmpresaId)) {
    throw new Error(`Empresa no configurada: ${empresaId}`)
  }
  const eid = empresaId as EmpresaId
  let pool = pools.get(eid)
  if (!pool) {
    const url = getUrlForEmpresa(eid)
    if (!url) {
      throw new Error(
        `Falta variable de entorno para ${empresaId}. Definir COLORCENTER_DB_URL_${EMPRESA_TO_ENV_KEY[eid]}`
      )
    }
    pool = mysql.createPool(parseMysqlUrl(url))
    pools.set(eid, pool)
  }
  return pool
}

/**
 * Devuelve todos los pools configurados con su empresaId.
 * Útil para listados que agregan datos de todas las bases.
 */
export async function getAllPools(): Promise<{ empresaId: EmpresaId; pool: mysql.Pool }[]> {
  const result: { empresaId: EmpresaId; pool: mysql.Pool }[] = []
  for (const empresaId of EMPRESA_IDS) {
    const url = getUrlForEmpresa(empresaId)
    if (url) {
      let pool = pools.get(empresaId)
      if (!pool) {
        pool = mysql.createPool(parseMysqlUrl(url))
        pools.set(empresaId, pool)
      }
      result.push({ empresaId, pool })
    }
  }
  return result
}

/**
 * Ejecuta una función de consulta en cada base y concatena resultados.
 * Cada item recibirá el empresaId para poder etiquetar en la app.
 */
export async function queryAllBases<T>(
  queryFn: (pool: mysql.Pool, empresaId: EmpresaId) => Promise<T[]>
): Promise<T[]> {
  const all = await getAllPools()
  const arrays = await Promise.all(all.map(({ pool, empresaId }) => queryFn(pool, empresaId)))
  return arrays.flat()
}

/** Lista de empresaIds que tienen base configurada. */
export function getConfiguredEmpresaIds(): EmpresaId[] {
  return EMPRESA_IDS.filter((eid) => getUrlForEmpresa(eid) != null)
}

/**
 * EmpresaIds que la capa de datos debe usar en este request.
 * Si hay contexto de Auth0 Organizations (cached), devuelve la intersección con las configuradas.
 * Si no, devuelve getConfiguredEmpresaIds() (comportamiento anterior).
 */
/** Orden determinista (emp-1, emp-2, ...) para evitar hydration mismatch. */
export async function getEmpresaIdsForDataLayer(): Promise<EmpresaId[]> {
  // Soporte Central actúa como admin: sin importar Organizations, ve y escribe en todas las empresas configuradas.
  if (await userHasRole("soporte-central")) {
    return [...getConfiguredEmpresaIds()].sort((a, b) => a.localeCompare(b))
  }

  const allowed = await getCachedAllowedEmpresaIds()
  const configured = getConfiguredEmpresaIds()
  const list = allowed === null || allowed.length === 0 ? configured : allowed.filter((eid) => getUrlForEmpresa(eid) != null)
  return [...list].sort((a, b) => a.localeCompare(b))
}

/**
 * Comprueba si la empresa está permitida para el usuario actual (Auth0 orgs o todas si no aplica).
 * Usar en rutas API y Server Actions antes de getPool(empresaId).
 */
export async function isEmpresaAllowedForRequest(empresaId: string): Promise<boolean> {
  if (await userHasRole("soporte-central")) {
    return true
  }

  const allowed = await getEmpresaIdsForDataLayer()
  return allowed.includes(empresaId as EmpresaId)
}

/** Empresa que es maestro de catálogos (solo ahí se escriben; se replica al resto). Por defecto Pintacomex = emp-1. */
export function getCatalogoMaestroEmpresaId(): EmpresaId {
  const v = process.env.CATALOGO_MAESTRO_EMPRESA_ID
  if (v && EMPRESA_IDS.includes(v as EmpresaId)) return v as EmpresaId
  return "emp-1"
}

/** Para lectura de catálogo: si empresaIdParam es válido y tiene BD configurada, usa esa empresa (país/contexto); si no, maestro. */
export function getEmpresaIdForCatalogRead(empresaIdParam: string | null): EmpresaId {
  if (empresaIdParam && EMPRESA_IDS.includes(empresaIdParam as EmpresaId) && getUrlForEmpresa(empresaIdParam as EmpresaId))
    return empresaIdParam as EmpresaId
  return getCatalogoMaestroEmpresaId()
}

// --- Bases "comun" (sucursales por empresa) ---

function getComunUrlForEmpresa(empresaId: EmpresaId): string | null {
  const key = EMPRESA_TO_ENV_KEY[empresaId]
  if (!key) return null
  const url = process.env[`COMUN_DB_URL_${key}`]
  if (!url || typeof url !== "string") return null
  return toNodeUrl(url)
}

const comunPools = new Map<EmpresaId, mysql.Pool>()

/** Quita el pool comun de esa empresa para forzar reconexión (útil tras ECONNRESET). */
export function clearComunPool(empresaId: EmpresaId): void {
  const pool = comunPools.get(empresaId)
  if (pool) {
    try {
      pool.end().catch(() => {})
    } catch {
      // ignore
    }
    comunPools.delete(empresaId)
  }
}

/** Pool de la base "comun" de la empresa (sucursales). Crea el pool a la primera petición. */
export async function getComunPool(empresaId: string): Promise<mysql.Pool> {
  if (!EMPRESA_IDS.includes(empresaId as EmpresaId)) {
    throw new Error(`Empresa no configurada: ${empresaId}`)
  }
  const eid = empresaId as EmpresaId
  let pool = comunPools.get(eid)
  if (!pool) {
    const url = getComunUrlForEmpresa(eid)
    if (!url) {
      throw new Error(
        `Falta COMUN_DB_URL para ${empresaId}. Definir COMUN_DB_URL_${EMPRESA_TO_ENV_KEY[eid]}`
      )
    }
    pool = mysql.createPool(parseMysqlUrl(url))
    comunPools.set(eid, pool)
  }
  return pool
}

/** True si la empresa tiene base comun configurada (para sucursales). */
export function hasComunForEmpresa(empresaId: EmpresaId): boolean {
  return getComunUrlForEmpresa(empresaId) != null
}

/** Configuración de la tabla de sucursales en bases comun (env). */
export function getSucursalesTableConfig(): {
  table: string
  idCol: string
  nombreCol: string
  zonaCol: string
} {
  const table = process.env.SUCURSALES_TABLE ?? "sucursal"
  const idCol = process.env.SUCURSALES_ID_COL ?? "num_suc"
  const nombreCol = process.env.SUCURSALES_NOMBRE_COL ?? "nombre"
  const zonaCol = process.env.SUCURSALES_ZONA_COL ?? "ZonaAsig"
  return { table, idCol, nombreCol, zonaCol }
}

/** Configuración de la tabla zonas en bases comun (LEFT JOIN: zonas.NumZona = sucursal.ZonaAsig). Solo env. */
export function getZonasTableConfig(): {
  table: string
  joinCol: string
  nombreCol: string
} | null {
  const table = process.env.ZONAS_TABLE
  const nombreCol = process.env.ZONAS_NOMBRE_COL
  const sucursalNombreCol = process.env.SUCURSALES_NOMBRE_COL ?? "nombre"
  if (!table || !nombreCol || typeof nombreCol !== "string" || !nombreCol.trim()) return null
  if (nombreCol.trim() === sucursalNombreCol) return null
  const joinCol = process.env.ZONAS_JOIN_COL ?? "NumZona"
  return { table, joinCol, nombreCol: nombreCol.trim() }
}

/** Para resolver número de zona → nombre cuando el JOIN no se usó. Si ZONAS_TABLE está definido, devuelve { table, joinCol, nombreCol }. La columna de nombre en zonas suele ser "nomzona", no "nombre". */
export function getZonasTableConfigForResolve(): {
  table: string
  joinCol: string
  nombreCol: string
} | null {
  const table = process.env.ZONAS_TABLE
  if (!table || typeof table !== "string" || !table.trim()) return null
  const joinCol = process.env.ZONAS_JOIN_COL ?? "NumZona"
  let nombreCol = (process.env.ZONAS_NOMBRE_COL ?? "nomzona").trim()
  if (nombreCol === "" || nombreCol === "nombre") nombreCol = "nomzona"
  return { table: table.trim(), joinCol, nombreCol }
}
