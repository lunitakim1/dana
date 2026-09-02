"use client";

import { useState } from "react";

export type DatosDePago = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  cedula: string;
  paymentEmail: string;
  whatsapp: string;
  contactName: string;
};

export default function FormularioDatosDePago({ inicial }: { inicial: DatosDePago }) {
  const [datos, setDatos] = useState<DatosDePago>(inicial);
  const [estado, setEstado] = useState<{ tipo: "" | "ok" | "error"; texto: string }>({
    tipo: "",
    texto: "",
  });
  const [guardando, setGuardando] = useState(false);

  function campo(clave: keyof DatosDePago) {
    return {
      value: datos[clave],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setDatos((d) => ({ ...d, [clave]: e.target.value })),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setEstado({ tipo: "", texto: "" });

    const res = await fetch("/api/perfil/pago", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const body = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setEstado({ tipo: "error", texto: body.error || "No se pudieron guardar los datos." });
      return;
    }
    setEstado({ tipo: "ok", texto: "Datos guardados. Se usarán en tus próximas rifas." });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Campo label="BANCO">
          <input {...campo("bankName")} maxLength={120} placeholder="Banco Guayaquil" className="ent" />
        </Campo>
        <Campo label="N° DE CUENTA">
          <input {...campo("accountNumber")} maxLength={60} placeholder="Ahorros 00XXXXXXXX" className="ent" />
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo label="A NOMBRE DE">
          <input {...campo("accountHolder")} maxLength={120} className="ent" />
        </Campo>
        <Campo label="CÉDULA">
          <input {...campo("cedula")} maxLength={30} className="ent" />
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo label="CORREO DE PAGO">
          <input {...campo("paymentEmail")} type="email" maxLength={160} className="ent" />
        </Campo>
        <Campo label="WHATSAPP DE CONTACTO">
          <input {...campo("whatsapp")} maxLength={30} placeholder="09XXXXXXXX" className="ent" />
        </Campo>
      </div>
      <Campo label="NOMBRE DEL RESPONSABLE">
        <input {...campo("contactName")} maxLength={120} className="ent" />
      </Campo>

      {estado.texto && (
        <p className={`text-sm ${estado.tipo === "error" ? "text-rojo" : "text-verde"}`}>{estado.texto}</p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="w-full border-2 border-marron bg-marron px-4 py-3 text-sm font-bold tracking-wide text-crema hover:bg-[#61301c] disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar mis datos de pago"}
      </button>

      <style>{`.ent { width:100%; padding:10px 11px; font-size:16px; font-family:inherit; color:#4a2415; border:2px solid #4a2415; background:#fff8e6; }`}</style>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] tracking-[0.14em] text-[#7a5033]">{label}</label>
      {children}
    </div>
  );
}
