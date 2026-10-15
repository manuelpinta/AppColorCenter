/** Error de validación o regla de negocio cuyo mensaje sí se muestra al usuario. */
export class ClientError extends Error {
  readonly status: number
  readonly field?: string

  constructor(message: string, status = 400, field?: string) {
    super(message)
    this.name = "ClientError"
    this.status = status
    this.field = field
  }
}
