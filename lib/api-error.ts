import { NextResponse } from "next/server"
import { ClientError } from "@/lib/client-error"

/**
 * Registra el error completo en el servidor y responde un mensaje genérico.
 * Si el error es de validación (`ClientError`), conserva ese mensaje.
 */
export function apiError(err: unknown, publicMessage: string, status = 500): NextResponse {
  if (err instanceof ClientError) {
    const body = err.field ? { error: err.message, field: err.field } : { error: err.message }
    return NextResponse.json(body, { status: err.status })
  }
  console.error(publicMessage, err)
  return NextResponse.json({ error: publicMessage }, { status })
}
