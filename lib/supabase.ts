import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Cliente de Supabase para uso en servidor (upload a Storage, etc.). Usar solo en API routes o server components. */
export function getSupabaseServer() {
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.")
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } })
}

export const SUPABASE_BUCKET_FOTOS = "equipo-fotos"
