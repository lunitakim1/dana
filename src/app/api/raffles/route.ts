import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, randomSuffix } from "@/lib/utils";

const esquema = z.object({
  title: z.string().trim().min(3).max(120),
  subtitle: z.string().trim().max(160).optional().nullable(),
  prizeDescription: z.string().trim().min(3).max(200),
  imageUrl: z.string().url().optional().nullable(),
  price: z.coerce.number().min(0.25).max(100000),
  totalNumbers: z.coerce.number().int().min(10).max(1000).default(100),
  drawDate: z.string().optional().nullable(),
  drawMethod: z.string().trim().max(200).optional().nullable(),
  bankName: z.string().trim().max(120).optional().nullable(),
  accountNumber: z.string().trim().max(60).optional().nullable(),
  accountHolder: z.string().trim().max(120).optional().nullable(),
  cedula: z.string().trim().max(30).optional().nullable(),
  paymentEmail: z.string().trim().max(160).optional().nullable(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = (session.user as { id?: string }).id as string;

  const raffles = await prisma.raffle.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });

  return NextResponse.json({ raffles });
}

export async function POST(req: Request) {
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

  let base = slugify(d.title) || "rifa";
  let slug = `${base}-${randomSuffix(4)}`;
  for (let i = 0; i < 5; i++) {
    const existe = await prisma.raffle.findUnique({ where: { slug } });
    if (!existe) break;
    slug = `${base}-${randomSuffix(4)}`;
  }

  const raffle = await prisma.raffle.create({
    data: {
      userId,
      slug,
      title: d.title,
      subtitle: d.subtitle || null,
      prizeDescription: d.prizeDescription,
      imageUrl: d.imageUrl || null,
      price: d.price,
      totalNumbers: d.totalNumbers,
      drawDate: d.drawDate ? new Date(d.drawDate) : null,
      drawMethod: d.drawMethod || null,
      bankName: d.bankName || null,
      accountNumber: d.accountNumber || null,
      accountHolder: d.accountHolder || null,
      cedula: d.cedula || null,
      paymentEmail: d.paymentEmail || null,
      whatsapp: d.whatsapp || null,
      contactName: d.contactName || null,
    },
  });

  return NextResponse.json({ raffle });
}
