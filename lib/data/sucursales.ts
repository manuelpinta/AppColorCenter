import type { Pool } from "mysql2/promise"
import type { ColorCenter } from "@/lib/types"
import type { EmpresaId } from "@/lib/db"
import {
  getPool,
  getComunPool,
  clearComunPool,
  getConfiguredEmpresaIds,
  hasComunForEmpresa,
  getSucursalesTableConfig,
  getZonasTableConfig,
  getZonasTableConfigForResolve,
} from "@/lib/db"
import { parseSucursalId } from "./ids"
import { timed, withTimeout, getEmpresaQueryTimeoutMs } from "./timing"
import { getCachedIf } from "./cache"

/** Convierte fila de sucursales + JOINs a ColorCenter con empresa_id de la app. */
function mapSucursalRow(row: Record<string, unknown>, empresaId: string): ColorCenter {
  return {
    id: String(row.id),
    empresa_id: empresaId,
    codigo_interno: String(row.codigo_interno ?? ""),
    nombre_sucursal: String(row.nombre_sucursal ?? ""),
    region: row.region != null ? String(row.region) : null,
    ubicacion: row.ubicacion != null ? String(row.ubicacion) : null,
    responsable: row.responsable != null ? String(row.responsable) : null,
    fecha_instalacion: row.fecha_instalacion != null ? String(row.fecha_instalacion) : null,
    estado: (row.estado as ColorCenter["estado"]) ?? "Operativo",
    notas: row.notas != null ? String(row.notas) : null,
    created_at: row.created_at != null ? String(row.created_at) : "",
    updated_at: row.updated_at != null ? String(row.updated_at) : "",
  }
}

/** Sucursales desde la base "comun": sucursal LEFT JOIN zonas. Consulta principal y zonas (si aplica) en paralelo. */
async function getSucursalesFromComun(empresaId: EmpresaId): Promise<ColorCenter[]> {
  const cfg = getSucursalesTableConfig()
  const zonasCfg = getZonasTableConfig()
  const zonasResolve = getZonasTableConfigForResolve()
  const whereComun = "s.FechaTerm = ? AND s.SubTipoSuc IN (?, ?, ?)"
  const whereParams = ["", "S", "B", "2"]

  const runMainQuery = async (pool: Awaited<ReturnType<typeof getComunPool>>): Promise<Record<string, unknown>[]> => {
    if (zonasCfg) {
      const [r] = await pool.query<Record<string, unknown>[]>(
        `SELECT s.?? as id, s.?? as nombre_sucursal, z.?? as region
         FROM ?? s
         LEFT JOIN ?? z ON z.?? = s.??
         WHERE ${whereComun}
         ORDER BY s.??`,
        [
          cfg.idCol,
          cfg.nombreCol,
          zonasCfg.nombreCol,
          cfg.table,
          zonasCfg.table,
          zonasCfg.joinCol,
          cfg.zonaCol,
          ...whereParams,
          cfg.nombreCol,
        ]
      )
      return Array.isArray(r) ? r : []
    }
    const [r] = await pool.query<Record<string, unknown>[]>(
      `SELECT ?? as id, ?? as nombre_sucursal, ?? as region FROM ?? WHERE FechaTerm = ? AND SubTipoSuc IN (?, ?, ?) ORDER BY ??`,
      [cfg.idCol, cfg.nombreCol, cfg.zonaCol, cfg.table, ...whereParams, cfg.nombreCol]
    )
    return Array.isArray(r) ? r : []
  }

  const runZonasQuery = async (pool: Awaited<ReturnType<typeof getComunPool>>): Promise<Map<string, string>> => {
    if (!zonasResolve) return new Map()
    const [zRows] = await pool.query<Record<string, unknown>[]>(
      `SELECT ?? as id_zona, ?? as nombre_zona FROM ??`,
      [zonasResolve.joinCol, zonasResolve.nombreCol, zonasResolve.table]
    )
    const arr = Array.isArray(zRows) ? zRows : []
    const idToName = new Map<string, string>()
    for (const z of arr) {
      const raw = z.id_zona
      const id = raw != null ? String(raw).trim() : ""
      const nom = z.nombre_zona != null ? String(z.nombre_zona).trim() : ""
      if (id) idToName.set(id, nom)
    }
    return idToName
  }

  let pool = await getComunPool(empresaId)
  let rows: Record<string, unknown>[]
  let idToName = new Map<string, string>()

  try {
    const [mainResult, zonasResult] = await Promise.all([
      runMainQuery(pool),
      zonasResolve ? runZonasQuery(pool) : Promise.resolve(new Map<string, string>()),
    ])
    rows = mainResult
    idToName = zonasResult
  } catch (err) {
    const message = (err as Error)?.message ?? ""
    const code = (err as NodeJS.ErrnoException)?.code
    const isConnectionReset =
      code === "ECONNRESET" || message.includes("ECONNRESET")
    const isPoolClosed = message.includes("Pool is closed")
    if (isConnectionReset || isPoolClosed) {
      clearComunPool(empresaId)
      pool = await getComunPool(empresaId)
      const [mainResult, zonasResult] = await Promise.all([
        runMainQuery(pool),
        zonasResolve ? runZonasQuery(pool) : Promise.resolve(new Map<string, string>()),
      ])
      rows = mainResult
      idToName = zonasResult
    } else {
      throw err
    }
  }

  let list = rows.map((r) => ({
    id: String(r.id ?? ""),
    empresa_id: empresaId,
    codigo_interno: "",
    nombre_sucursal: String(r.nombre_sucursal ?? ""),
    region: r.region != null && r.region !== "" ? String(r.region) : null,
    ubicacion: null,
    responsable: null,
    fecha_instalacion: null,
    estado: "Operativo" as const,
    notas: null,
    created_at: "",
    updated_at: "",
  }))

  if (idToName.size > 0) {
    list = list.map((c) => {
      if (c.region == null || c.region === "") return c
      const key = c.region.trim()
      const name = idToName.get(key) ?? idToName.get(String(Number(key)))
      return { ...c, region: name ?? c.region }
    })
  }

  return list
}

/**
 * Sucursales de una empresa.
 * Si tiene base "comun" configurada (COMUN_DB_URL_*), usa la tabla de sucursales definida en env.
 * Si no, usa la base Color Center (tabla sucursales con JOINs).
 */
export async function getSucursalesByEmpresa(empresaId: EmpresaId): Promise<ColorCenter[]> {
  if (hasComunForEmpresa(empresaId)) {
    return getSucursalesFromComun(empresaId)
  }
  const pool = await getPool(empresaId)
  const [rows] = await pool.query<
    { id: number; codigo_interno: string; nombre_sucursal: string; ubicacion: string | null; fecha_instalacion: string | null; notas: string | null; created_at: unknown; updated_at: unknown; region: string | null; responsable: string | null; estado: string }[]
  >(
    `SELECT s.id, s.codigo_interno, s.nombre_sucursal, s.ubicacion, s.fecha_instalacion, s.notas, s.created_at, s.updated_at,
        r.nombre AS region, u.nombre AS responsable, ce.nombre AS estado
     FROM sucursales s
     LEFT JOIN regiones r ON r.id = s.region_id
     LEFT JOIN usuarios u ON u.id = s.responsable_id
     JOIN cat_estados_sucursal ce ON ce.id = s.estado_id
     ORDER BY s.nombre_sucursal`
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => mapSucursalRow(r as unknown as Record<string, unknown>, empresaId))
}

/**
 * Sucursales por empresa y opcionalmente por zona (región).
 */
export async function getSucursalesByEmpresaAndZona(
  empresaId: EmpresaId,
  zona?: string | null
): Promise<ColorCenter[]> {
  const all = await getSucursalesByEmpresa(empresaId)
  if (!zona) return all
  return all.filter((c) => c.region === zona)
}

/** Sucursales de todas las bases (sin cache). Timeout por empresa para no bloquear. Si hubo timeout, no cachear. */
async function getColorCentersAllBasesUncached(): Promise<{ data: ColorCenter[]; shouldCache: boolean }> {
  const ids = getConfiguredEmpresaIds()
  const timeoutMs = getEmpresaQueryTimeoutMs()
  let hadTimeout = false
  const arrays = await Promise.all(
    ids.map((empresaId) =>
      timed(
        `getColorCentersAllBases(${empresaId})`,
        () =>
          withTimeout(
            timeoutMs,
            `getColorCenters(${empresaId})`,
            () => getSucursalesByEmpresa(empresaId),
            [],
            () => {
              hadTimeout = true
            }
          )
      )
    )
  )
  return { data: arrays.flat(), shouldCache: !hadTimeout }
}

/** Sucursales de todas las bases (cada una con empresa_id). Cache corto solo cuando todas las empresas respondieron. */
export async function getColorCentersAllBases(): Promise<ColorCenter[]> {
  return getCachedIf("colorCentersAllBases", getColorCentersAllBasesUncached)
}

/**
 * Regiones/zona únicas desde sucursales de la empresa.
 * Si usa base comun, devuelve valores distintos de la columna zona (env).
 * Si no, consulta la tabla regiones de la base Color Center.
 */
export async function getRegionesDisponibles(empresaId: EmpresaId): Promise<string[]> {
  if (hasComunForEmpresa(empresaId)) {
    const list = await getSucursalesByEmpresa(empresaId)
    const zonas = [...new Set(list.map((c) => c.region).filter(Boolean))] as string[]
    return zonas.sort()
  }
  const pool = await getPool(empresaId)
  const [rows] = await pool.query<{ nombre: string }[]>(
    `SELECT DISTINCT r.nombre FROM regiones r
     INNER JOIN sucursales s ON s.region_id = r.id
     WHERE r.nombre IS NOT NULL AND r.nombre != ''
     ORDER BY r.nombre`
  )
  const arr = Array.isArray(rows) ? rows : []
  return arr.map((r) => r.nombre)
}

/** Regiones únicas de todas las bases (para filtros en listados). */
export async function getRegionesDisponiblesAllBases(): Promise<string[]> {
  const ids = getConfiguredEmpresaIds()
  const arrays = await Promise.all(ids.map((empresaId) => getRegionesDisponibles(empresaId)))
  const seen = new Set<string>()
  arrays.flat().forEach((r) => seen.add(r))
  return Array.from(seen).sort()
}

/** Regiones únicas a partir de colorCenters ya cargados (evita volver a consultar). */
export function getRegionesFromColorCenters(colorCenters: ColorCenter[]): string[] {
  const seen = new Set<string>()
  colorCenters.forEach((c) => {
    if (c.region) seen.add(c.region)
  })
  return Array.from(seen).sort()
}

/**
 * Busca una sucursal por id (compuesto emp-1-5 o numérico en todas las bases).
 * Devuelve colorCenter, pool (Color Center para esa empresa) y empresaId.
 */
export async function getSucursalByCompositeId(
  id: string
): Promise<{ colorCenter: ColorCenter; pool: Pool; empresaId: EmpresaId } | null> {
  const { empresaId: onlyEmpresa, numericId } = parseSucursalId(id)
  const idsToTry = onlyEmpresa ? [onlyEmpresa] : getConfiguredEmpresaIds()
  for (const empresaId of idsToTry) {
    const list = await getSucursalesByEmpresa(empresaId)
    const colorCenter = list.find((c) => c.id === numericId)
    if (colorCenter) {
      const pool = await getPool(empresaId)
      return { colorCenter, pool, empresaId }
    }
  }
  return null
}
