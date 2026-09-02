import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session!.user as { id?: string }).id as string;

  const raffles = await prisma.raffle.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });

  return (
    <main className="min-h-screen bg-madera px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-crema2/40 pb-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-crema2">MI PANEL</p>
            <h1 className="text-2xl font-black text-crema">Hola, {session!.user!.name}</h1>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="border-2 border-crema2 px-4 py-2 text-sm font-bold text-crema hover:bg-crema2 hover:text-marron">
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Link
            href="/dashboard/datos-de-pago"
            className="border-2 border-crema2 px-5 py-3 text-sm font-bold tracking-wide text-crema hover:bg-crema2 hover:text-marron"
          >
            Mis datos de pago
          </Link>
          <Link
            href="/dashboard/new"
            className="border-2 border-marron bg-dorado px-5 py-3 text-sm font-bold tracking-wide text-marron hover:bg-[#e8b950]"
          >
            + Nueva rifa
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {raffles.length === 0 && (
            <div className="border-2 border-dashed border-crema2/50 p-8 text-center text-crema2">
              Todavía no has creado ninguna rifa. Empieza con &laquo;+ Nueva rifa&raquo;.
            </div>
          )}

          {raffles.map((r) => {
            const vendidos = r._count.tickets;
            const restantes = r.totalNumbers - vendidos;
            return (
              <Link
                key={r.id}
                href={`/r/${r.slug}`}
                className="flex items-center gap-4 border-2 border-dorado bg-crema p-4 hover:bg-crema2"
              >
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="h-16 w-16 flex-none border border-marron/40 object-cover" />
                ) : (
                  <div className="h-16 w-16 flex-none border border-marron/40 bg-crema2" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-marron">{r.title}</p>
                  <p className="truncate text-sm text-[#7a5033]">
                    {formatMoney(r.price)} · {vendidos}/{r.totalNumbers} números vendidos · {restantes} libres
                  </p>
                  {r.drawDate && (
                    <p className="text-xs text-[#7a5033]">Sorteo: {formatDate(r.drawDate)}</p>
                  )}
                </div>
                {r.winnerNumber && (
                  <span className="flex-none border-2 border-rojo px-3 py-1 text-xs font-bold text-rojo">
                    GANADOR {r.winnerNumber}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
