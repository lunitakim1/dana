import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { RaffleDTO } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const raffle = await prisma.raffle.findUnique({
    where: { slug },
    include: { tickets: { orderBy: { number: "asc" } } },
  });

  if (!raffle) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }

  const dto: RaffleDTO = {
    id: raffle.id,
    slug: raffle.slug,
    title: raffle.title,
    subtitle: raffle.subtitle,
    prizeDescription: raffle.prizeDescription,
    imageUrl: raffle.imageUrl,
    price: raffle.price,
    totalNumbers: raffle.totalNumbers,
    drawDate: raffle.drawDate ? raffle.drawDate.toISOString() : null,
    drawMethod: raffle.drawMethod,
    bankName: raffle.bankName,
    accountNumber: raffle.accountNumber,
    accountHolder: raffle.accountHolder,
    cedula: raffle.cedula,
    paymentEmail: raffle.paymentEmail,
    whatsapp: raffle.whatsapp,
    contactName: raffle.contactName,
    winnerNumber: raffle.winnerNumber,
    isOwner: !!userId && userId === raffle.userId,
    tickets: raffle.tickets.map((t) => ({
      number: t.number,
      buyerName: t.buyerName,
      buyerPhone: t.buyerPhone,
      status: t.status,
      note: t.note,
      code: t.code,
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return NextResponse.json({ raffle: dto });
}
