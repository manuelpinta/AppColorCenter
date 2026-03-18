import { NextRequest, NextResponse } from "next/server"
import { findEquipoInAllBases, crearFotoEquipo, getEmpresaById } from "@/lib/data"
import { getSupabaseServer, SUPABASE_BUCKET_FOTOS } from "@/lib/supabase"
import { isEmpresaAllowedForRequest } from "@/lib/db"
import { userCanWrite } from "@/lib/auth-roles"

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await userCanWrite())) {
    return NextResponse.json({ error: "No tienes permisos para subir fotos" }, { status: 403 })
  }
  const { id: equipoIdParam } = await params
  const found = await findEquipoInAllBases(equipoIdParam)
  if (!found) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
  }
  const { equipo, pool, empresaId } = found
  if (!(await isEmpresaAllowedForRequest(empresaId))) {
    return NextResponse.json({ error: "No tienes acceso a esta empresa" }, { status: 403 })
  }

  const contentType = request.headers.get("content-type") ?? ""
  let url: string
  let fecha_foto: string
  let descripcion: string | null = null

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fecha = formData.get("fecha_foto")
    const desc = formData.get("descripcion")
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Falta el archivo de imagen" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes (JPG, PNG, WebP, etc.)" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no puede superar 10 MB" }, { status: 400 })
    }
    if (!fecha || typeof fecha !== "string") {
      return NextResponse.json({ error: "fecha_foto es requerido" }, { status: 400 })
    }
    fecha_foto = fecha
    descripcion = typeof desc === "string" && desc.trim() ? desc.trim() : null

    try {
      const supabase = getSupabaseServer();
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg";
      const empresa = getEmpresaById(empresaId);
      const empresaCodigo = (empresa?.codigo || empresaId).toString();
      const sucSegment = `SUC${equipo.color_center_id}`;
      // Ruta legible: CODIGO_EMPRESA / SUC<id_sucursal> / equipoId / timestamp-nombre.ext
      // Ej: GALLCO/SUC105/45/...
      const path = `${empresaCodigo}/${sucSegment}/${equipo.id}/${Date.now()}-${sanitizeFileName(file.name) || "foto"}${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET_FOTOS)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        console.error("[Supabase Storage upload]", uploadError);
        const detail = uploadError.message ?? uploadError.error ?? "";
        return NextResponse.json(
          {
            error: "Error al subir la imagen. Revisa que el bucket exista y las variables SUPABASE_* estén configuradas.",
            detail: detail || undefined,
          },
          { status: 502 }
        );
      }
      const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET_FOTOS).getPublicUrl(uploadData.path);
      url = urlData.publicUrl;
    } catch (err) {
      if (err instanceof Error && err.message.includes("SUPABASE")) {
        return NextResponse.json(
          { error: "Storage no configurado. Añade NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env" },
          { status: 503 }
        );
      }
      throw err;
    }
  } else {
    let body: { url: string; fecha_foto: string; descripcion?: string | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }
    const { url: bodyUrl, fecha_foto: bodyFecha, descripcion: bodyDesc = null } = body;
    if (!bodyUrl || typeof bodyUrl !== "string" || !bodyUrl.trim()) {
      return NextResponse.json({ error: "url es requerido" }, { status: 400 });
    }
    if (!bodyFecha || typeof bodyFecha !== "string") {
      return NextResponse.json({ error: "fecha_foto es requerido" }, { status: 400 });
    }
    url = bodyUrl.trim();
    fecha_foto = bodyFecha;
    descripcion = bodyDesc?.trim() || null;
  }

  try {
    const foto = await crearFotoEquipo(pool, {
      equipo_id: equipo.id,
      url,
      fecha_foto,
      descripcion,
    });
    return NextResponse.json({ foto });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar la foto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
