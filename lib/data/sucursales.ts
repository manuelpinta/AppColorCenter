import type { Pool, RowDataPacket } from "mysql2/promise"
import type { ColorCenter } from "@/lib/types"
import type { EmpresaId } from "@/lib/db"
import {
  getPool,
  getComunPool,
  clearComunPool,
  getEmpresaIdsForDataLayer,
  getEmpresaIdsToSearch,
  hasComunForEmpresa,
  getSucursalesTableConfig,
  getZonasTableConfig,
  getZonasTableConfigForResolve,
} from "@/lib/db"
import { parseSucursalId } from "./ids"
import { timed, withTimeout, getEmpresaQueryTimeoutMs } from "./timing"
import { getCachedIf, cacheKeyForEmpresas } from "./cache"

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
    codigo_interno: String(r.id ?? ""),
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
 * Sucursales cerradas (fuera del filtro de activas en la base comun) que todavía tienen equipos o incidencias
 * en la base Color Center. Sin base comun no aplica: la tabla local ya incluye todas las sucursales.
 */
async function getSucursalesCerradasConRegistros(
  empresaId: EmpresaId,
  activas: ColorCenter[]
): Promise<ColorCenter[]> {
  if (!hasComunForEmpresa(empresaId)) return []

  const pool = await getPool(empresaId)
  const [refRows] = await pool.query<RowDataPacket[]>(
    `SELECT sucursal_id FROM equipos WHERE sucursal_id IS NOT NULL
     UNION
     SELECT sucursal_id FROM incidencias WHERE sucursal_id IS NOT NULL`
  )
  const activeIds = new Set(activas.map((c) => c.id))
  const missingIds = refRows.map((r) => String(r.sucursal_id)).filter((id) => !activeIds.has(id))
  if (missingIds.length === 0) return []

  const cfg = getSucursalesTableConfig()
  const comun = await getComunPool(empresaId)
  const [rows] = await comun.query<RowDataPacket[]>(
    `SELECT ?? as id, ?? as nombre_sucursal, ?? as region, FechaTerm as fecha_cierre
     FROM ?? WHERE ?? IN (?) AND FechaTerm <> '' ORDER BY ??`,
    [cfg.idCol, cfg.nombreCol, cfg.zonaCol, cfg.table, cfg.idCol, missingIds, cfg.nombreCol]
  )

  return rows.map((r) => ({
    id: String(r.id ?? ""),
    empresa_id: empresaId,
    codigo_interno: String(r.id ?? ""),
    nombre_sucursal: String(r.nombre_sucursal ?? ""),
    region: r.region != null && r.region !== "" ? String(r.region) : null,
    ubicacion: null,
    responsable: null,
    fecha_instalacion: null,
    estado: "Inactivo" as const,
    notas: null,
    created_at: "",
    updated_at: "",
    cerrada: true,
    fecha_cierre: r.fecha_cierre != null && String(r.fecha_cierre).trim() !== "" ? String(r.fecha_cierre).trim() : null,
  }))
}

/**
 * Sucursales activas más las cerradas que aún tienen equipos o incidencias (marcadas con `cerrada: true`).
 * Para listados de consulta y fichas; los formularios deben seguir usando solo las activas.
 */
export async function getSucursalesByEmpresaConCerradas(empresaId: EmpresaId): Promise<ColorCenter[]> {
  const activas = await getSucursalesByEmpresa(empresaId)
  const cerradas = await getSucursalesCerradasConRegistros(empresaId, activas)
  return cerradas.length > 0 ? [...activas, ...cerradas] : activas
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
async function getColorCentersAllBasesUncached(
  ids: EmpresaId[],
  loadEmpresa: (empresaId: EmpresaId) => Promise<ColorCenter[]> = getSucursalesByEmpresa
): Promise<{ data: ColorCenter[]; shouldCache: boolean }> {
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
            () => loadEmpresa(empresaId),
            [],
            () => {
              hadTimeout = true
            }
          )
      )
    )
  )
  const flat = arrays.flat()
  // Locale fijo para que servidor (Node) y cliente coincidan (evita que Ñ/acentos cambien el orden).
  const locale = "en"
  flat.sort((a, b) => {
    const byEmpresa = a.empresa_id.localeCompare(b.empresa_id, locale)
    if (byEmpresa !== 0) return byEmpresa
    return (a.nombre_sucursal ?? "").localeCompare(b.nombre_sucursal ?? "", locale)
  })
  return { data: flat, shouldCache: !hadTimeout }
}

/** Orden estable para evitar hydration mismatch (mismo locale que servidor). */
function sortColorCentersStable(list: ColorCenter[]): void {
  const locale = "en"
  list.sort((a, b) => {
    const byEmpresa = a.empresa_id.localeCompare(b.empresa_id, locale)
    if (byEmpresa !== 0) return byEmpresa
    return (a.nombre_sucursal ?? "").localeCompare(b.nombre_sucursal ?? "", locale)
  })
}

/** Sucursales de todas las bases (cada una con empresa_id). Cache corto solo cuando todas las empresas respondieron. */
export async function getColorCentersAllBases(): Promise<ColorCenter[]> {
  const ids = await getEmpresaIdsForDataLayer()
  const data = await getCachedIf(cacheKeyForEmpresas("colorCentersAllBases", ids), () =>
    getColorCentersAllBasesUncached(ids)
  )
  sortColorCentersStable(data)
  return data
}

/** Como getColorCentersAllBases, más las sucursales cerradas que aún tienen equipos o incidencias. */
export async function getColorCentersConCerradasAllBases(): Promise<ColorCenter[]> {
  const ids = await getEmpresaIdsForDataLayer()
  const data = await getCachedIf(cacheKeyForEmpresas("colorCentersConCerradasAllBases", ids), () =>
    getColorCentersAllBasesUncached(ids, getSucursalesByEmpresaConCerradas)
  )
  sortColorCentersStable(data)
  return data
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
  const ids = await getEmpresaIdsForDataLayer()
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
 * Incluye cerradas con registros (`colorCenter.cerrada`), para que su ficha siga abriendo en solo lectura.
 * Devuelve colorCenter, pool (Color Center para esa empresa) y empresaId.
 */
export async function getSucursalByCompositeId(
  id: string
): Promise<{ colorCenter: ColorCenter; pool: Pool; empresaId: EmpresaId } | null> {
  const { empresaId: onlyEmpresa, numericId } = parseSucursalId(id)
  const idsToTry = await getEmpresaIdsToSearch(onlyEmpresa)
  for (const empresaId of idsToTry) {
    const list = await getSucursalesByEmpresaConCerradas(empresaId)
    const colorCenter = list.find((c) => c.id === numericId)
    if (colorCenter) {
      const pool = await getPool(empresaId)
      return { colorCenter, pool, empresaId }
    }
  }
  return null
}
