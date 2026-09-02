"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setCargando(false);
    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="border-[3px] border-dorado bg-crema p-8 shadow-2xl w-full max-w-sm">
      <h1 className="text-2xl font-black text-marron">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-[#7a5033]">Entra a administrar tus rifas.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-[11px] tracking-[0.14em] text-[#7a5033]">CORREO</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-marron bg-[#fff8e6] px-3 py-2 text-[16px] text-marron"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] tracking-[0.14em] text-[#7a5033]">CONTRASEÑA</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-marron bg-[#fff8e6] px-3 py-2 text-[16px] text-marron"
          />
        </div>
        {error && <p className="text-sm text-rojo">{error}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="w-full border-2 border-marron bg-marron px-4 py-3 text-sm font-bold tracking-wide text-crema hover:bg-[#61301c] disabled:opacity-60"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#6b4126]">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-bold underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#2b1b12" }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
