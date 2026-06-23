/**
 * Sincronización de catálogos desde el maestro a las demás bases Color Center.
 * Regla: mismo id en todas las BDs para que las FK (equipos.marca_id, etc.) sigan válidas.
 * Los tipos de equipo se resuelven por nombre en cada BD por si los IDs numéricos difieren.
 */
import type { Pool } from "mysql2/promise"
import { getPool, getConfiguredEmpresaIds, getCatalogoMaestroEmpresaId } from "@/lib/db"
import type { EmpresaId } from "@/lib/db"
import { getMarcasEquipoParaAdmin } from "./catalogos"

function getOtrasEmpresasParaSync(): EmpresaId[] {
  const master = getCatalogoMaestroEmpresaId()
  return getConfiguredEmpresaIds().filter((eid) => eid !== master)
}

/** Resuelve el id de tipo en la BD destino usando el nombre del maestro. */
async function resolveTipoEquipoIdInTargetPool(
  masterPool: Pool,
  targetPool: Pool,
  masterTipoId: number
): Promise<number | null> {
  const [masterRows] = await masterPool.query<{ nombre: string }[]>(
    "SELECT nombre FROM cat_tipos_equipo WHERE id = ?",
    [masterTipoId]
  )
  const nombre = Array.isArray(masterRows) && masterRows[0] ? masterRows[0].nombre : null
  if (!nombre) return null
  const [targetRows] = await targetPool.query<{ id: number }[]>(
    "SELECT id FROM cat_tipos_equipo WHERE nombre = ?",
    [nombre]
  )
  const id = Array.isArray(targetRows) && targetRows[0] ? targetRows[0].id : null
  return id ?? null
}

async function syncMarcaTipoRelaciones(
  masterPool: Pool,
  targetPool: Pool,
  marcaId: number,
  masterTipoIds: number[]
): Promise<void> {
  await targetPool.query("DELETE FROM marca_tipo_equipo WHERE marca_id = ?", [marcaId])
  for (const masterTipoId of masterTipoIds) {
    const targetTipoId = await resolveTipoEquipoIdInTargetPool(masterPool, targetPool, masterTipoId)
    if (targetTipoId == null) continue
    await targetPool.query(
      "INSERT INTO marca_tipo_equipo (marca_id, tipo_equipo_id, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE activo = VALUES(activo)",
      [marcaId, targetTipoId]
    )
  }
}

/** Replica una marca al resto de las bases (mismo id). Idempotente: ON DUPLICATE KEY UPDATE. */
export async function syncMarcaToOtrasBases(
  id: number,
  nombre: string,
  tipoEquipoIds: number[] = []
): Promise<void> {
  const master = getCatalogoMaestroEmpresaId()
  const masterPool = await getPool(master)
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query(
      "INSERT INTO marcas_equipo (id, nombre, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo)",
      [id, nombre]
    )
    await syncMarcaTipoRelaciones(masterPool, pool, id, tipoEquipoIds)
  }
}

/** Replica un modelo al resto de las bases (mismo id). La marca debe existir (sync marcas antes). */
export async function syncModeloToOtrasBases(
  id: number,
  marca_id: number,
  nombre: string
): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query(
      "INSERT INTO modelos_equipo (id, marca_id, nombre, activo) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE marca_id = VALUES(marca_id), nombre = VALUES(nombre), activo = VALUES(activo)",
      [id, marca_id, nombre]
    )
  }
}

/** Replica un arrendador al resto de las bases (mismo id). */
export async function syncArrendadorToOtrasBases(id: number, nombre: string): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query(
      "INSERT INTO arrendadores (id, nombre, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo)",
      [id, nombre]
    )
  }
}

/** Replica un tipo de equipo (cat_tipos_equipo) al resto de las bases (mismo id). */
export async function syncCatTipoEquipoToOtrasBases(id: number, nombre: string): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query(
      "INSERT INTO cat_tipos_equipo (id, nombre, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo)",
      [id, nombre]
    )
  }
}

/** Replica actualización de marca en las demás bases. */
export async function updateMarcaInOtrasBases(
  id: number,
  nombre: string,
  activo: number,
  tipoEquipoIds: number[] = []
): Promise<void> {
  const master = getCatalogoMaestroEmpresaId()
  const masterPool = await getPool(master)
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query("UPDATE marcas_equipo SET nombre = ?, activo = ? WHERE id = ?", [
      nombre,
      activo,
      id,
    ])
    await syncMarcaTipoRelaciones(masterPool, pool, id, tipoEquipoIds)
  }
}

/** Replica actualización de modelo en las demás bases. */
export async function updateModeloInOtrasBases(
  id: number,
  marca_id: number,
  nombre: string,
  activo: number
): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query(
      "UPDATE modelos_equipo SET marca_id = ?, nombre = ?, activo = ? WHERE id = ?",
      [marca_id, nombre, activo, id]
    )
  }
}

/** Replica actualización de arrendador en las demás bases. */
export async function updateArrendadorInOtrasBases(
  id: number,
  nombre: string,
  activo: number
): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query("UPDATE arrendadores SET nombre = ?, activo = ? WHERE id = ?", [
      nombre,
      activo,
      id,
    ])
  }
}

/** Replica actualización de tipo de equipo en las demás bases. */
export async function updateCatTipoEquipoInOtrasBases(
  id: number,
  nombre: string,
  activo: number
): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query("UPDATE cat_tipos_equipo SET nombre = ?, activo = ? WHERE id = ?", [
      nombre,
      activo,
      id,
    ])
  }
}

/** Re-sincroniza todas las marcas (y relaciones tipo) del maestro a todas las bases configuradas. */
export async function syncAllMarcasFromMaster(): Promise<{ marcas: number; empresas: number }> {
  const master = getCatalogoMaestroEmpresaId()
  const masterPool = await getPool(master)
  const marcas = await getMarcasEquipoParaAdmin(masterPool)
  const otras = getOtrasEmpresasParaSync()
  for (const marca of marcas) {
    const tipoIds = marca.tipo_equipo_ids.map((x) => Number(x))
    for (const empresaId of otras) {
      const pool = await getPool(empresaId)
      await pool.query(
        "INSERT INTO marcas_equipo (id, nombre, activo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo)",
        [Number(marca.id), marca.nombre, marca.activo]
      )
      await syncMarcaTipoRelaciones(masterPool, pool, Number(marca.id), tipoIds)
    }
  }
  return { marcas: marcas.length, empresas: otras.length }
}
