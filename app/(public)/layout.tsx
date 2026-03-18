/**
 * Rutas públicas: sin verificación de sesión.
 * Solo envuelve con {children} (ej. /login).
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
