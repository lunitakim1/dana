import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const esquema = z.object({
  bankName: z.string().trim().max(120).optional().nullable(),
  accountNumber: z.string().trim().max(60).optional().nullable(),
  accountHolder: z.string().trim().max(120).optional().nullable(),
  cedula: z.string().trim().max(30).optional().nullable(),
  paymentEmail: z.string().trim().max(160).optional().nullable(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
});

const CAMPOS = {
  bankName: true,
  accountNumber: true,
  accountHolder: true,
  cedula: true,
  paymentEmail: true,
  whatsapp: true,
  contactName: true,
} as const;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = (session.user as { id?: string }).id as string;

  const datos = await prisma.user.findUnique({ where: { id: userId }, select: CAMPOS });
  return NextResponse.json({ datos });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = (session.user as { id?: string }).id as string;

  const body = await req.json().catch(() => null);
  const parsed = esquema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const datos = await prisma.user.update({
    where: { id: userId },
    data: {
      bankName: d.bankName || null,
      accountNumber: d.accountNumber || null,
      accountHolder: d.accountHolder || null,
      cedula: d.cedula || null,
      paymentEmail: d.paymentEmail || null,
      whatsapp: d.whatsapp || null,
      contactName: d.contactName || null,
    },
    select: CAMPOS,
  });

  return NextResponse.json({ datos });
}
