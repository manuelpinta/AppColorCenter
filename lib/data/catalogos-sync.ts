/**
 * Sincronización de catálogos desde el maestro a las demás bases Color Center.
 * Regla: mismo id en todas las BDs para que las FK (equipos.marca_id, etc.) sigan válidas.
 */
import { getPool, getConfiguredEmpresaIds, getCatalogoMaestroEmpresaId } from "@/lib/db"
import type { EmpresaId } from "@/lib/db"

function getOtrasEmpresasParaSync(): EmpresaId[] {
  const master = getCatalogoMaestroEmpresaId()
  return getConfiguredEmpresaIds().filter((eid) => eid !== master)
}

/** Replica una marca al resto de las bases (mismo id). Idempotente: ON DUPLICATE KEY UPDATE. */
export async function syncMarcaToOtrasBases(id: number, nombre: string): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query(
      "INSERT INTO marcas_equipo (id, nombre, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo)",
      [id, nombre]
    )
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
  activo: number
): Promise<void> {
  const otras = getOtrasEmpresasParaSync()
  for (const empresaId of otras) {
    const pool = await getPool(empresaId)
    await pool.query("UPDATE marcas_equipo SET nombre = ?, activo = ? WHERE id = ?", [
      nombre,
      activo,
      id,
    ])
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
