import { NextResponse } from "next/server"

/**
 * Stub de login. Cuando exista la base común y la tabla usuarios,
 * aquí se leerá el usuario por login, se comparará password_hash (bcrypt)
 * y se devolverá { user: { id, nombre, rol_id, empresa_id, zona_ids } } + sesión/token.
 *
 * Por ahora responde 501 para que la pantalla de login muestre un mensaje
 * amigable ("no configurado aún").
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const login = typeof body?.login === "string" ? body.login.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!login || !password) {
      return NextResponse.json(
        { error: "Se requieren usuario y contraseña." },
        { status: 400 }
      )
    }

    // TODO: conectar a base común (COLORCENTER_COMUN_DB_URL), buscar usuario por login,
    // comparar bcrypt.compare(password, row.password_hash), crear sesión/JWT,
    // devolver { user: { id, nombre, rol_id, empresa_id, zona_ids } }
    return NextResponse.json(
      { error: "Inicio de sesión no configurado aún. Configura la base común y la tabla usuarios." },
      { status: 501 }
    )
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 500 }
    )
  }
}
