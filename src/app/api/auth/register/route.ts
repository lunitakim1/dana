import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo").max(120),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(200),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = esquema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Datos inválidos" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ user });
}
