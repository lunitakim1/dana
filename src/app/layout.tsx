import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rifas en la Nube",
  description: "Crea y administra tus rifas: números, compradores, pagos y certificados, todo en la nube.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-narrow text-marron">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
