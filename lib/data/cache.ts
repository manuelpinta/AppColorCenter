/**
 * Cache en memoria para listados "all bases" (sucursales, equipos).
 * Evita repetir las N consultas por empresa al navegar entre Equipos / Sucursales / Dashboard.
 */
const TTL_MS = Number(process.env.ALL_BASES_CACHE_TTL_MS) || 60_000

const store = new Map<string, { data: unknown; expires: number }>()

export async function getCached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expires > now) return hit.data as T
  const data = await fn()
  store.set(key, { data, expires: now + TTL_MS })
  return data
}

/** Como getCached, pero solo guarda en cache si fn devuelve shouldCache: true (p. ej. cuando no hubo timeout por empresa). */
export async function getCachedIf<T>(
  key: string,
  fn: () => Promise<{ data: T; shouldCache: boolean }>
): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expires > now) return hit.data as T
  const { data, shouldCache } = await fn()
  if (shouldCache) store.set(key, { data, expires: now + TTL_MS })
  return data
}
