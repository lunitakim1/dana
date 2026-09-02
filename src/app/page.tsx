import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main
      className="min-h-screen px-4 py-14"
      style={{
        background: "#2b1b12",
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(0,0,0,.16) 0 2px, rgba(255,255,255,.02) 2px 5px, rgba(0,0,0,0) 5px 34px)",
      }}
    >
      <div className="mx-auto max-w-3xl border-[3px] border-dorado bg-crema p-8 shadow-2xl outline outline-1 outline-marron outline-offset-[6px]">
        <div className="text-center">
          <span className="inline-block -skew-x-[8deg] bg-marron px-5 py-1 text-[13px] tracking-[0.22em] text-crema">
            <span className="inline-block skew-x-[8deg]">Rifas en la nube</span>
          </span>
          <h1 className="mt-2 text-[clamp(34px,8vw,58px)] font-black leading-[0.95] text-marron [text-shadow:2px_2px_0_var(--tw-shadow-color)] shadow-dorado">
            CREA TU SORTEO
          </h1>
          <p className="mt-2 text-[15px] tracking-wide text-[#6b4126]">
            Sube la foto de tu premio, genera tu tablero de números y comparte el enlace.
            Cada organizador administra su propia rifa, guardada en la nube.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="border border-marron/30 bg-crema2 p-4 text-center text-sm">
            <b className="block text-lg">1. Regístrate</b>
            Crea tu cuenta gratis con tu correo.
          </div>
          <div className="border border-marron/30 bg-crema2 p-4 text-center text-sm">
            <b className="block text-lg">2. Sube tu rifa</b>
            Foto del premio, precio, fecha del sorteo y datos de pago.
          </div>
          <div className="border border-marron/30 bg-crema2 p-4 text-center text-sm">
            <b className="block text-lg">3. Comparte</b>
            Tu tablero queda en un enlace único, listo para vender.
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="border-2 border-marron bg-dorado px-6 py-3 text-sm font-bold tracking-wide text-marron hover:bg-[#e8b950]"
            >
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="border-2 border-marron bg-dorado px-6 py-3 text-sm font-bold tracking-wide text-marron hover:bg-[#e8b950]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="border-2 border-marron bg-transparent px-6 py-3 text-sm font-bold tracking-wide text-marron hover:bg-crema2"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
