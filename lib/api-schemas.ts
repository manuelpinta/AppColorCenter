import { NextResponse } from "next/server"
import { z } from "zod"
import { EMPRESA_IDS, type EmpresaId } from "@/lib/empresas-config"
import { parseId, type ParseIdKind, type ParsedId } from "@/lib/data/ids"

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/

function calendarDate(value: string): string | null {
  const match = DATE_RE.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null
  }
  return `${match[1]}-${match[2]}-${match[3]}`
}

function issue(ctx: z.RefinementCtx, message: string) {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message })
}

/** Fecha AAAA-MM-DD (también acepta un ISO y se queda con el día). Vacío o null → null. */
const nullableDate = z.union([z.string(), z.null()]).transform((value, ctx) => {
  if (value == null || value.trim() === "") return null
  const parsed = calendarDate(value)
  if (!parsed) {
    issue(ctx, "Fecha inválida (use AAAA-MM-DD)")
    return z.NEVER
  }
  return parsed
})

const optionalDate = nullableDate.optional()

function enumField<const T extends readonly [string, ...string[]]>(values: T, message: string) {
  return z.enum(values, { errorMap: () => ({ message }) })
}

const empresaIdField = z
  .string()
  .trim()
  .refine((value): value is EmpresaId => EMPRESA_IDS.includes(value as EmpresaId), "empresa_id inválido")

function isPositiveInt(value: unknown): boolean {
  return (
    (typeof value === "number" && Number.isInteger(value) && value >= 1) ||
    (typeof value === "string" && /^\d+$/.test(value.trim()) && Number(value) >= 1)
  )
}

function asPositiveInt(value: unknown): number {
  return typeof value === "number" ? value : Number(String(value).trim())
}

/** Entero positivo o null. "" cuenta como null. NaN y texto no numérico se rechazan. */
function nullablePositiveInt(message: string) {
  return z.any().superRefine((value, ctx) => {
    if (value == null || value === "") return
    if (!isPositiveInt(value)) issue(ctx, message)
  }).transform((value) => {
    if (value == null || value === "") return null
    return asPositiveInt(value)
  })
}

/** Entero positivo, o ausente. null y "" no se mandan al SQL. */
function optionalPositiveInt(message: string) {
  return nullablePositiveInt(message).optional().transform((value) => value ?? undefined)
}

function finiteAmount(message: string) {
  return z.any().superRefine((value, ctx) => {
    if (value == null || value === "") return
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value < 0) issue(ctx, message)
      return
    }
    if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) return
    issue(ctx, message)
  }).transform((value) => {
    if (value == null || value === "") return null
    return typeof value === "number" ? value : Number(String(value).trim())
  })
}

function nonNegativeInt(message: string) {
  return z.any().superRefine((value, ctx) => {
    if (value == null || value === "") return
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 0) issue(ctx, message)
      return
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) return
    issue(ctx, message)
  }).transform((value) => {
    if (value == null || value === "") return null
    return typeof value === "number" ? value : Number(String(value).trim())
  })
}

const nullableText = z.union([z.string(), z.null()]).transform((value) => {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
})

const optionalNullableText = nullableText.optional()

const tipoEquipoEnum = enumField(
  ["Tintometrico", "Mezcladora", "Regulador", "Equipo de Computo"],
  "tipo_equipo inválido"
)
const tipoPropiedadEnum = enumField(["Propio", "Arrendado"], "tipo_propiedad inválido")
const estadoEquipoEnum = enumField(
  ["Operativo", "Mantenimiento", "Inactivo", "Fuera de Servicio"],
  "estado inválido"
)
const tipoMantenimientoEnum = enumField(["Preventivo", "Correctivo"], "tipo inválido")
const realizadoPorEnum = enumField(["Interno", "Externo"], "realizado_por inválido")
const estadoMantenimientoEnum = enumField(
  ["Pendiente", "En Proceso", "Completado"],
  "estado inválido"
)
const severidadEnum = enumField(["Baja", "Media", "Alta", "Crítica"], "severidad inválida")
const estadoIncidenciaEnum = enumField(
  ["Reportada", "En atención", "Resuelta", "Cerrada"],
  "estado inválido"
)

const catalogIdString = z.any().superRefine((value, ctx) => {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : ""
  const n = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n < 1) {
    issue(ctx, "Id de catálogo inválido")
  }
}).transform((value) => {
  const raw = typeof value === "number" ? String(value) : String(value).trim()
  return String(Number(raw))
})

const nombreCatalogo = z.string().trim().min(1, "nombre es requerido")

const activoField = z.union([z.literal(0), z.literal(1), z.boolean(), z.literal("0"), z.literal("1")]).transform((value) =>
  value === true || value === 1 || value === "1" ? 1 : 0
)

function colorCenterRef(message: string) {
  return z.unknown().superRefine((value, ctx) => {
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 1) issue(ctx, message)
      return
    }
    if (typeof value !== "string" || value.trim() === "") {
      issue(ctx, message)
      return
    }
    const parsed = parseId(value.trim(), "sucursal")
    if (!/^\d+$/.test(parsed.numericId) || Number(parsed.numericId) < 1) issue(ctx, message)
  })
}

const computadoraSchema = z.object({
  procesador: optionalNullableText,
  ram_gb: nonNegativeInt("ram_gb inválido").optional(),
  almacenamiento_gb: nonNegativeInt("almacenamiento_gb inválido").optional(),
  tipo_almacenamiento: z.union([z.enum(["SSD", "HDD"]), z.null(), z.literal("")]).optional().transform((value) => {
    if (value == null || value === "") return value === undefined ? undefined : null
    return value
  }),
  graficos: optionalNullableText,
  windows_version: optionalNullableText,
  so_64bits: z.union([z.boolean(), z.enum(["true", "false"])]).optional().transform((value) => {
    if (value === undefined) return undefined
    return value === true || value === "true"
  }),
})

const equipoBaseFields = {
  tipo_equipo: tipoEquipoEnum,
  tipo_equipo_id: optionalPositiveInt("tipo_equipo_id inválido"),
  marca: optionalNullableText,
  marca_id: optionalPositiveInt("marca_id inválido"),
  modelo: optionalNullableText,
  modelo_id: optionalPositiveInt("modelo_id inválido"),
  numero_serie: optionalNullableText,
  fecha_compra: optionalDate,
  tipo_propiedad: tipoPropiedadEnum,
  arrendador: optionalNullableText,
  fecha_vencimiento_arrendamiento: optionalDate,
  estado: estadoEquipoEnum,
  ultima_calibracion: optionalDate,
  proxima_revision: optionalDate,
  notas: optionalNullableText,
  equipo_ups_id: nullablePositiveInt("equipo_ups_id inválido").optional(),
  equipo_regulador_id: nullablePositiveInt("equipo_regulador_id inválido").optional(),
  equipo_impresora_id: nullablePositiveInt("equipo_impresora_id inválido").optional(),
  computadora: computadoraSchema.optional(),
}

export const equipoCreateSchema = z.object({
  color_center_id: colorCenterRef("color_center_id inválido").transform((value) => {
    if (typeof value === "number") return { empresaId: undefined as EmpresaId | undefined, numericId: value }
    const parsed = parseId(String(value).trim(), "sucursal")
    return { empresaId: parsed.empresaId, numericId: Number(parsed.numericId) }
  }),
  empresa_id: empresaIdField.optional(),
  ...equipoBaseFields,
})

export const equipoPatchSchema = z.object({
  empresa_id: empresaIdField,
  color_center_id: colorCenterRef("color_center_id inválido").optional().transform((value) => {
    if (value === undefined) return undefined
    if (typeof value === "number") return value
    return Number(parseId(String(value).trim(), "sucursal").numericId)
  }),
  foto_url: optionalNullableText,
  tipo_equipo: tipoEquipoEnum.optional(),
  tipo_equipo_id: optionalPositiveInt("tipo_equipo_id inválido"),
  marca: optionalNullableText,
  marca_id: optionalPositiveInt("marca_id inválido"),
  modelo: optionalNullableText,
  modelo_id: optionalPositiveInt("modelo_id inválido"),
  numero_serie: optionalNullableText,
  fecha_compra: optionalDate,
  tipo_propiedad: tipoPropiedadEnum.optional(),
  arrendador: optionalNullableText,
  fecha_vencimiento_arrendamiento: optionalDate,
  estado: estadoEquipoEnum.optional(),
  ultima_calibracion: optionalDate,
  proxima_revision: optionalDate,
  notas: optionalNullableText,
  equipo_ups_id: nullablePositiveInt("equipo_ups_id inválido").optional(),
  equipo_regulador_id: nullablePositiveInt("equipo_regulador_id inválido").optional(),
  equipo_impresora_id: nullablePositiveInt("equipo_impresora_id inválido").optional(),
  computadora: computadoraSchema.optional(),
})

const recursoId = z.union([z.string(), z.number(), z.null(), z.literal("")]).optional().transform((value, ctx) => {
  if (value == null || value === "") return null
  const parsed = parseId(String(value), "recurso")
  if (!/^\d+$/.test(parsed.numericId) || Number(parsed.numericId) < 1) {
    issue(ctx, "Id inválido")
    return z.NEVER
  }
  return String(Number(parsed.numericId))
})

export const mantenimientoCreateSchema = z.object({
  equipo_id: z.string({ required_error: "equipo_id es requerido" }).trim().min(1, "equipo_id es requerido"),
  empresa_id: empresaIdField.optional(),
  incidencia_id: recursoId,
  tipo: tipoMantenimientoEnum,
  realizado_por: realizadoPorEnum,
  fecha_mantenimiento: optionalDate,
  descripcion: z.string({ required_error: "descripcion es requerida" }).trim().min(1, "descripcion es requerida"),
  piezas_cambiadas: optionalNullableText,
  tiempo_fuera_servicio: finiteAmount("tiempo_fuera_servicio inválido").optional(),
  costo: finiteAmount("costo inválido").optional(),
  estado: estadoMantenimientoEnum.optional(),
  notas: optionalNullableText,
})

export const mantenimientoPatchSchema = z.object({
  tipo: tipoMantenimientoEnum.optional(),
  realizado_por: realizadoPorEnum.optional(),
  fecha_mantenimiento: optionalDate,
  descripcion: z.string().trim().min(1, "descripcion es requerida").optional(),
  piezas_cambiadas: optionalNullableText,
  tiempo_fuera_servicio: finiteAmount("tiempo_fuera_servicio inválido").optional(),
  costo: finiteAmount("costo inválido").optional(),
  estado: estadoMantenimientoEnum.optional(),
  notas: optionalNullableText,
})

export const incidenciaCreateSchema = z.object({
  sucursal_id: z.string({ required_error: "sucursal_id es requerido" }).trim().min(1, "sucursal_id es requerido"),
  empresa_id: empresaIdField.optional(),
  equipo_id: z.union([z.string(), z.null(), z.literal("")]).optional(),
  fecha_reporte: optionalDate,
  descripcion: z.string({ required_error: "descripcion es requerido" }).trim().min(1, "descripcion es requerido"),
  severidad: z.union([severidadEnum, z.null(), z.literal("")]).optional().transform((value) => value || null),
  estado: estadoIncidenciaEnum.optional(),
  notas: optionalNullableText,
})

export const moverEquipoSchema = z.object({
  sucursal_destino_id: z
    .string({ required_error: "sucursal_destino_id es requerido" })
    .trim()
    .min(1, "sucursal_destino_id es requerido"),
  motivo: optionalNullableText,
  registrado_por: optionalNullableText,
  empresa_id: empresaIdField.optional(),
})

export const catalogNombreSchema = z.object({
  nombre: nombreCatalogo,
})

export const catalogNombrePatchSchema = z
  .object({
    nombre: nombreCatalogo.optional(),
    activo: activoField.optional(),
  })
  .refine((data) => data.nombre !== undefined || data.activo !== undefined, "Enviar nombre y/o activo")

export const catalogMarcaSchema = z.object({
  nombre: nombreCatalogo,
  tipo_equipo_ids: z.array(catalogIdString).min(1, "tipo_equipo_ids es requerido"),
})

export const catalogMarcaPatchSchema = z
  .object({
    nombre: nombreCatalogo.optional(),
    activo: activoField.optional(),
    tipo_equipo_ids: z.array(catalogIdString).optional(),
  })
  .refine(
    (data) => data.nombre !== undefined || data.activo !== undefined || data.tipo_equipo_ids !== undefined,
    "Enviar nombre y/o activo"
  )

export const catalogModeloSchema = z.object({
  marca_id: catalogIdString,
  nombre: nombreCatalogo,
})

export const catalogModeloPatchSchema = z
  .object({
    nombre: nombreCatalogo.optional(),
    marca_id: catalogIdString.optional(),
    activo: activoField.optional(),
  })
  .refine(
    (data) => data.nombre !== undefined || data.marca_id !== undefined || data.activo !== undefined,
    "Enviar nombre, marca_id y/o activo"
  )

export type EquipoCreateInput = z.infer<typeof equipoCreateSchema>
export type EquipoPatchInput = z.infer<typeof equipoPatchSchema>
export type MantenimientoCreateInput = z.infer<typeof mantenimientoCreateSchema>
export type MantenimientoPatchInput = z.infer<typeof mantenimientoPatchSchema>
export type IncidenciaCreateInput = z.infer<typeof incidenciaCreateSchema>
export type MoverEquipoInput = z.infer<typeof moverEquipoSchema>

export async function readBody<T>(
  request: Request,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const message =
      !first || (first.code === "invalid_type" && first.path.length === 0)
        ? "Cuerpo inválido"
        : first.message
    const field = first && first.path.length > 0 ? first.path.join(".") : undefined
    return {
      ok: false,
      response: NextResponse.json(field ? { error: message, field } : { error: message }, { status: 400 }),
    }
  }
  return { ok: true, data: parsed.data }
}

/** Id de URL ya separado y comprobado como entero positivo. Evita pasar NaN al SQL. */
export function readUrlId(
  raw: string,
  kind: ParseIdKind = "recurso"
): { ok: true; parsed: ParsedId; numericId: string } | { ok: false; response: NextResponse } {
  const parsed = parseId(raw ?? "", kind)
  if (!/^\d+$/.test(parsed.numericId) || Number(parsed.numericId) < 1) {
    return { ok: false, response: NextResponse.json({ error: "Id inválido" }, { status: 400 }) }
  }
  return { ok: true, parsed, numericId: String(Number(parsed.numericId)) }
}
