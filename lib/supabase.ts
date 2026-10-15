import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Cliente de Supabase para uso en servidor (upload a Storage, etc.).
 * Usa SUPABASE_SERVICE_ROLE_KEY si está definida; si no, NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Con anon key el bucket debe ser público y tener políticas Storage que permitan a anon hacer upload (INSERT).
 */
export function getSupabaseServer() {
  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en el entorno.")
  }
  const key = serviceRoleKey ?? anonKey
  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.")
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Nombre del bucket de fotos. Por defecto "equipo-fotos"; override con SUPABASE_BUCKET_FOTOS o NEXT_PUBLIC_SUPABASE_BUCKET_FOTOS. */
export const SUPABASE_BUCKET_FOTOS =
  process.env.SUPABASE_BUCKET_FOTOS ?? process.env.NEXT_PUBLIC_SUPABASE_BUCKET_FOTOS ?? "equipo-fotos"

/**
 * Ruta del objeto dentro del bucket, si la URL pública es de este proyecto y de este bucket.
 * URLs externas (pegadas a mano) devuelven null y no se borran de Storage.
 */
export function storagePathFromPublicUrl(publicUrl: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(publicUrl)
  } catch {
    return null
  }
  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET_FOTOS}/`
  const idx = parsed.pathname.indexOf(marker)
  if (idx === -1) return null

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")
  if (!base) {
    throw new Error("No se pudo ubicar el archivo de la foto en Storage")
  }
  let baseUrl: URL
  try {
    baseUrl = new URL(base)
  } catch {
    throw new Error("No se pudo ubicar el archivo de la foto en Storage")
  }
  if (parsed.origin !== baseUrl.origin) return null

  const raw = parsed.pathname.slice(idx + marker.length)
  if (!raw || raw.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error("No se pudo ubicar el archivo de la foto en Storage")
  }
  try {
    return decodeURIComponent(raw)
  } catch {
    throw new Error("No se pudo ubicar el archivo de la foto en Storage")
  }
}

/** Borra el archivo en Storage cuando la URL es de nuestro bucket. No hace nada si la URL es externa. */
export async function removeStoredFoto(publicUrl: string): Promise<void> {
  const path = storagePathFromPublicUrl(publicUrl)
  if (!path) return
  const supabase = getSupabaseServer()
  const { error } = await supabase.storage.from(SUPABASE_BUCKET_FOTOS).remove([path])
  if (error) throw error
}
