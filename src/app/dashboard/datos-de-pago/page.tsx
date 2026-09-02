import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FormularioDatosDePago from "./FormularioDatosDePago";

export default async function DatosDePagoPage() {
  const session = await auth();
  const userId = (session!.user as { id?: string }).id as string;

  const datos = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      bankName: true,
      accountNumber: true,
      accountHolder: true,
      cedula: true,
      paymentEmail: true,
      whatsapp: true,
      contactName: true,
    },
  });

  return (
    <main className="min-h-screen bg-madera px-4 py-10">
      <div className="mx-auto max-w-2xl border-[3px] border-dorado bg-crema p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-marron">Mis datos de pago</h1>
          <Link href="/dashboard" className="text-sm font-bold text-[#7a5033] underline">
            Volver
          </Link>
        </div>
        <p className="mt-2 text-sm text-[#7a5033]">
          Se guardan en tu cuenta y autocompletan cada rifa nueva que crees. Son los
          datos que verá quien aparte un número, en su comprobante de pago.
        </p>

        <FormularioDatosDePago
          inicial={{
            bankName: datos?.bankName || "",
            accountNumber: datos?.accountNumber || "",
            accountHolder: datos?.accountHolder || "",
            cedula: datos?.cedula || "",
            paymentEmail: datos?.paymentEmail || "",
            whatsapp: datos?.whatsapp || "",
            contactName: datos?.contactName || datos?.name || "",
          }}
        />
      </div>
    </main>
  );
}
