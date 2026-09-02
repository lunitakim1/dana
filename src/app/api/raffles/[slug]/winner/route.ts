import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const esquema = z.object({
  winnerNumber: z.string().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const raffle = await prisma.raffle.findUnique({ where: { slug } });
  if (!raffle) return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  if (!userId || userId !== raffle.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = esquema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  let winnerNumber = parsed.data.winnerNumber;
  if (winnerNumber !== null) {
    winnerNumber = winnerNumber.trim();
    if (!/^\d+$/.test(winnerNumber) || Number(winnerNumber) < 0 || Number(winnerNumber) >= raffle.totalNumbers) {
      return NextResponse.json({ error: "Número fuera de rango" }, { status: 400 });
    }
  }

  const updated = await prisma.raffle.update({
    where: { id: raffle.id },
    data: { winnerNumber },
  });

  return NextResponse.json({ winnerNumber: updated.winnerNumber });
}
