"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevaRifaPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function onFileChange() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setPreview(null); return; }
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const form = new FormData(e.currentTarget);

    try {
      let imageUrl: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upBody = await up.json();
        if (!up.ok) throw new Error(upBody.error || "No se pudo subir la imagen");
        imageUrl = upBody.url;
      }

      const payload = {
        title: form.get("title"),
        subtitle: form.get("subtitle"),
        prizeDescription: form.get("prizeDescription"),
        imageUrl,
        price: form.get("price"),
        totalNumbers: form.get("totalNumbers"),
        drawDate: form.get("drawDate") || null,
        drawMethod: form.get("drawMethod"),
        bankName: form.get("bankName"),
        accountNumber: form.get("accountNumber"),
        accountHolder: form.get("accountHolder"),
        cedula: form.get("cedula"),
        paymentEmail: form.get("paymentEmail"),
        whatsapp: form.get("whatsapp"),
        contactName: form.get("contactName"),
      };

      const res = await fetch("/api/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "No se pudo crear la rifa");

      router.push(`/r/${body.raffle.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-madera px-4 py-10">
      <div className="mx-auto max-w-2xl border-[3px] border-dorado bg-crema p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-marron">Nueva rifa</h1>
          <Link href="/dashboard" className="text-sm font-bold text-[#7a5033] underline">
            Volver
          </Link>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <Campo label="IMAGEN DEL PREMIO">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onFileChange}
              className="w-full border-2 border-marron bg-[#fff8e6] px-3 py-2 text-sm text-marron file:mr-3 file:border-0 file:bg-marron file:px-3 file:py-1.5 file:text-crema"
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Vista previa" className="mt-3 h-40 w-full border border-marron/40 object-cover" />
            )}
          </Campo>

          <Campo label="TÍTULO DEL SORTEO" required>
            <input name="title" required maxLength={120} placeholder="Ej: Pierna de chancho · 30 libras" className="ent" />
          </Campo>

          <Campo label="SUBTÍTULO (opcional)">
            <input name="subtitle" maxLength={160} placeholder="Ej: últimos 2 números de la Lotería Nacional" className="ent" />
          </Campo>

          <Campo label="DESCRIPCIÓN DEL PREMIO" required>
            <input name="prizeDescription" required maxLength={200} placeholder="Ej: Pierna de chancho de 30 libras" className="ent" />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="PRECIO POR NÚMERO ($)" required>
              <input name="price" type="number" step="0.25" min="0.25" required defaultValue="2" className="ent" />
            </Campo>
            <Campo label="CANTIDAD DE NÚMEROS">
              <input name="totalNumbers" type="number" min="10" max="1000" defaultValue="100" className="ent" />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="FECHA DEL SORTEO">
              <input name="drawDate" type="date" className="ent" />
            </Campo>
            <Campo label="MODALIDAD">
              <input name="drawMethod" maxLength={200} placeholder="Últimos 2 números de la Lotería" className="ent" />
            </Campo>
          </div>

          <h2 className="border-b-2 border-marron pb-1 text-[13px] tracking-[0.16em] text-marron">
            DATOS DE PAGO (se muestran en el certificado)
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="BANCO">
              <input name="bankName" maxLength={120} className="ent" />
            </Campo>
            <Campo label="N° DE CUENTA">
              <input name="accountNumber" maxLength={60} className="ent" />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="A NOMBRE DE">
              <input name="accountHolder" maxLength={120} className="ent" />
            </Campo>
            <Campo label="CÉDULA">
              <input name="cedula" maxLength={30} className="ent" />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="CORREO DE PAGO">
              <input name="paymentEmail" type="email" maxLength={160} className="ent" />
            </Campo>
            <Campo label="WHATSAPP DE CONTACTO">
              <input name="whatsapp" maxLength={30} placeholder="09XXXXXXXX" className="ent" />
            </Campo>
          </div>
          <Campo label="NOMBRE DEL RESPONSABLE">
            <input name="contactName" maxLength={120} className="ent" />
          </Campo>

          {error && <p className="text-sm text-rojo">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full border-2 border-marron bg-marron px-4 py-3 text-sm font-bold tracking-wide text-crema hover:bg-[#61301c] disabled:opacity-60"
          >
            {cargando ? "Creando tablero…" : "Crear tablero de la rifa"}
          </button>
        </form>
      </div>

      <style>{`.ent { width:100%; padding:10px 11px; font-size:16px; font-family:inherit; color:#4a2415; border:2px solid #4a2415; background:#fff8e6; }`}</style>
    </main>
  );
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] tracking-[0.14em] text-[#7a5033]">
        {label} {required && <span className="text-rojo">*</span>}
      </label>
      {children}
    </div>
  );
}
