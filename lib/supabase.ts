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
