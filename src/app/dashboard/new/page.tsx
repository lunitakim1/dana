import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FormularioNuevaRifa from "./FormularioNuevaRifa";

export default async function NuevaRifaPage() {
  const session = await auth();
  const userId = (session!.user as { id?: string }).id as string;

  const perfil = await prisma.user.findUnique({
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
    <FormularioNuevaRifa
      pago={{
        bankName: perfil?.bankName || "",
        accountNumber: perfil?.accountNumber || "",
        accountHolder: perfil?.accountHolder || "",
        cedula: perfil?.cedula || "",
        paymentEmail: perfil?.paymentEmail || "",
        whatsapp: perfil?.whatsapp || "",
        contactName: perfil?.contactName || perfil?.name || "",
      }}
    />
  );
}
