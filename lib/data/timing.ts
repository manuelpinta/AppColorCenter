/**
 * Helpers para medir tiempos de queries en desarrollo.
 * Solo hace log cuando QUERY_TIMING=1 o NODE_ENV=development (opcional).
 */
const ENABLED =
  process.env.NODE_ENV === "development" || process.env.QUERY_TIMING === "1"

export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!ENABLED) return fn()
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const ms = Math.round(performance.now() - start)
    console.log(`[timing] ${label}: ${ms}ms`)
  }
}

export function timedSync<T>(label: string, fn: () => T): T {
  if (!ENABLED) return fn()
  const start = performance.now()
  try {
    return fn()
  } finally {
    const ms = Math.round(performance.now() - start)
    console.log(`[timing] ${label}: ${ms}ms`)
  }
}

/** Timeout en ms por empresa para no bloquear la página si una BD tarda mucho. Bases lentas pueden tardar 5–10 s; 15 s da margen sin colgar. */
const EMPRESA_QUERY_TIMEOUT_MS = Number(process.env.EMPRESA_QUERY_TIMEOUT_MS) || 15_000

/**
 * Ejecuta fn(); si tarda más de ms, devuelve fallback y registra warning.
 * Si ocurre timeout, llama a onTimeout (ej. para no cachear esa respuesta).
 */
export async function withTimeout<T>(
  ms: number,
  label: string,
  fn: () => Promise<T>,
  fallback: T,
  onTimeout?: () => void
): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout ${label}`)), ms)
      ),
    ])
  } catch (err) {
    if (err instanceof Error && err.message.includes("Timeout")) {
      console.warn(`[timing] ${label}: timeout after ${ms}ms, using fallback`)
      onTimeout?.()
      return fallback
    }
    throw err
  }
}

export function getEmpresaQueryTimeoutMs(): number {
  return EMPRESA_QUERY_TIMEOUT_MS
}
