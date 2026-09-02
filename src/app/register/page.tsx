"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error || "No se pudo crear la cuenta.");
      setCargando(false);
      return;
    }

    const login = await signIn("credentials", { email, password, redirect: false });
    setCargando(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#2b1b12" }}
    >
      <div className="w-full max-w-sm border-[3px] border-dorado bg-crema p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-marron">Crear cuenta</h1>
        <p className="mt-1 text-sm text-[#7a5033]">Empieza a organizar tu rifa en minutos.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-[11px] tracking-[0.14em] text-[#7a5033]">NOMBRE</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-marron bg-[#fff8e6] px-3 py-2 text-[16px] text-marron"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-marron bg-[#fff8e6] px-3 py-2 text-[16px] text-marron"
            />
          </div>
          {error && <p className="text-sm text-rojo">{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="w-full border-2 border-marron bg-dorado px-4 py-3 text-sm font-bold tracking-wide text-marron hover:bg-[#e8b950] disabled:opacity-60"
          >
            {cargando ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6b4126]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-bold underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
