import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketCode } from "@/lib/utils";

const esquemaPropietario = z.object({
  buyerName: z.string().trim().min(1, "Escribe el nombre del comprador").max(120),
  buyerPhone: z.string().trim().max(30).optional().nullable(),
  note: z.string().trim().max(300).optional().nullable(),
  status: z.enum(["APARTADO", "PAGADO"]),
});

const esquemaPublico = z.object({
  buyerName: z.string().trim().min(1, "Escribe tu nombre").max(120),
  buyerPhone: z.string().trim().max(30).optional().nullable(),
});

async function cargarContexto(slug: string, number: string) {
  const raffle = await prisma.raffle.findUnique({ where: { slug } });
  if (!raffle) return { raffle: null, ticket: null };
  if (!/^\d+$/.test(number) || Number(number) < 0 || Number(number) >= raffle.totalNumbers) {
    return { raffle, ticket: undefined };
  }
  const ticket = await prisma.ticket.findUnique({
    where: { raffleId_number: { raffleId: raffle.id, number } },
  });
  return { raffle, ticket };
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string; number: string }> }
) {
  const { slug, number } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const { raffle, ticket } = await cargarContexto(slug, number);
  if (!raffle) return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  if (ticket === undefined) {
    return NextResponse.json({ error: "Número fuera de rango" }, { status: 400 });
  }

  const esOwner = !!userId && userId === raffle.userId;
  const body = await req.json().catch(() => null);

  if (esOwner) {
    const parsed = esquemaPropietario.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const saved = await prisma.ticket.upsert({
      where: { raffleId_number: { raffleId: raffle.id, number } },
      create: {
        raffleId: raffle.id,
        number,
        buyerName: d.buyerName,
        buyerPhone: d.buyerPhone || null,
        note: d.note || null,
        status: d.status,
        code: ticketCode(slug, number),
      },
      update: {
        buyerName: d.buyerName,
        buyerPhone: d.buyerPhone || null,
        note: d.note || null,
        status: d.status,
      },
    });
    return NextResponse.json({ ticket: saved });
  }

  // Visitante público: solo puede reservar un número libre.
  if (ticket) {
    return NextResponse.json({ error: "Ese número ya fue tomado por alguien más." }, { status: 409 });
  }
  const parsed = esquemaPublico.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  try {
    const saved = await prisma.ticket.create({
      data: {
        raffleId: raffle.id,
        number,
        buyerName: d.buyerName,
        buyerPhone: d.buyerPhone || null,
        status: "APARTADO",
        code: ticketCode(slug, number),
      },
    });
    return NextResponse.json({ ticket: saved });
  } catch {
    return NextResponse.json({ error: "Ese número ya fue tomado por alguien más." }, { status: 409 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; number: string }> }
) {
  const { slug, number } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const { raffle, ticket } = await cargarContexto(slug, number);
  if (!raffle) return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  if (!userId || userId !== raffle.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!ticket) return NextResponse.json({ ok: true });

  await prisma.ticket.delete({ where: { raffleId_number: { raffleId: raffle.id, number } } });
  return NextResponse.json({ ok: true });
}
