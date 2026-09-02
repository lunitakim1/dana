import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: "Formato de imagen no soportado" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen no debe superar 8MB" }, { status: 400 });
  }

  const ext = file.type.split("/")[1] || "jpg";
  const path = `rifas/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(path, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
