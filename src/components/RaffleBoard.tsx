"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RaffleDTO, TicketDTO } from "@/lib/types";
import { formatDate, formatMoney, padNumber, whatsappNumber } from "@/lib/utils";
import { dibujarCertificado, dibujarComprobante, dataUrlABlob } from "@/lib/certificate";

type TicketMap = Record<string, TicketDTO>;

function ticketsToMap(tickets: TicketDTO[]): TicketMap {
  const m: TicketMap = {};
  tickets.forEach((t) => (m[t.number] = t));
  return m;
}

export default function RaffleBoard({ initial }: { initial: RaffleDTO }) {
  const [raffle] = useState(initial);
  const [tickets, setTickets] = useState<TicketMap>(() => ticketsToMap(initial.tickets));
  const [winner, setWinner] = useState<string | null>(initial.winnerNumber);
  const [filtro, setFiltro] = useState("");
  const [fichaNum, setFichaNum] = useState<string | null>(null);
  const [vistaDoc, setVistaDoc] = useState(false);
  const [sync, setSync] = useState<{ clase: string; texto: string }>({
    clase: "ok",
    texto: "Cargado",
  });

  const modalAbierto = fichaNum !== null;
  const numbers = useMemo(
    () => Array.from({ length: raffle.totalNumbers }, (_, i) => padNumber(i, raffle.totalNumbers)),
    [raffle.totalNumbers]
  );

  const hora = () => new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });

  const refrescar = useCallback(async () => {
    try {
      const res = await fetch(`/api/raffles/${raffle.slug}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const body = await res.json();
      const r: RaffleDTO = body.raffle;
      setTickets(ticketsToMap(r.tickets));
      setWinner(r.winnerNumber);
      setSync({ clase: "ok", texto: "Guardado en la nube · última revisión " + hora() });
    } catch {
      setSync({ clase: "error", texto: "No se pudo conectar. Intenta de nuevo." });
    }
  }, [raffle.slug]);

  useEffect(() => {
    const id = setInterval(() => {
      if (modalAbierto) return;
      refrescar();
    }, 20000);
    return () => clearInterval(id);
  }, [modalAbierto, refrescar]);

  const resumen = useMemo(() => {
    let pagados = 0;
    let apartados = 0;
    Object.values(tickets).forEach((t) => {
      if (t.status === "PAGADO") pagados++;
      else apartados++;
    });
    return {
      pagados,
      apartados,
      libres: raffle.totalNumbers - pagados - apartados,
      recaudado: pagados * raffle.price,
      pendiente: apartados * raffle.price,
    };
  }, [tickets, raffle.totalNumbers, raffle.price]);

  function coincide(num: string) {
    if (!filtro) return false;
    const t = filtro.toLowerCase();
    if (num.indexOf(t) === 0) return true;
    const d = tickets[num];
    if (!d) return false;
    return d.buyerName.toLowerCase().includes(t) || (d.buyerPhone || "").toLowerCase().includes(t);
  }

  async function guardarTicketApi(
    number: string,
    payload: Record<string, unknown>
  ): Promise<{ ok: true; ticket: TicketDTO } | { ok: false; error: string }> {
    setSync({ clase: "guardando", texto: "Guardando…" });
    try {
      const res = await fetch(`/api/raffles/${raffle.slug}/tickets/${number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setSync({ clase: "error", texto: body.error || "No se pudo guardar" });
        return { ok: false, error: body.error || "No se pudo guardar" };
      }
      setSync({ clase: "ok", texto: "Guardado en la nube · " + hora() });
      return { ok: true, ticket: body.ticket as TicketDTO };
    } catch {
      setSync({ clase: "error", texto: "No se pudo guardar. Revisa tu conexión." });
      return { ok: false, error: "No se pudo guardar" };
    }
  }

  async function liberarTicket(number: string) {
    setSync({ clase: "guardando", texto: "Liberando…" });
    const res = await fetch(`/api/raffles/${raffle.slug}/tickets/${number}`, { method: "DELETE" });
    if (res.ok) {
      setTickets((prev) => {
        const next = { ...prev };
        delete next[number];
        return next;
      });
      setSync({ clase: "ok", texto: "Guardado en la nube · " + hora() });
    } else {
      setSync({ clase: "error", texto: "No se pudo liberar el número" });
    }
  }

  async function registrarGanador() {
    const v = window.prompt(
      `Escribe el número ganador (00 a ${padNumber(raffle.totalNumbers - 1, raffle.totalNumbers)}).\nDeja vacío para borrar el ganador.`,
      winner || ""
    );
    if (v === null) return;
    const limpio = v.trim();
    const numero = limpio === "" ? null : padNumber(parseInt(limpio, 10), raffle.totalNumbers);
    if (numero !== null && (!/^\d+$/.test(limpio) || Number(limpio) < 0 || Number(limpio) >= raffle.totalNumbers)) {
      alert("Escribe un número válido dentro del rango de la rifa.");
      return;
    }
    const res = await fetch(`/api/raffles/${raffle.slug}/winner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerNumber: numero }),
    });
    if (res.ok) {
      setWinner(numero);
      if (numero) {
        const d = tickets[numero];
        alert(
          d
            ? `Número ganador ${numero}\nGanador: ${d.buyerName}\nTeléfono: ${d.buyerPhone || "sin registrar"}`
            : `Número ganador ${numero}\nEse número no se vendió.`
        );
      }
    }
  }

  function descargarArchivo(nombre: string, contenido: string, tipo: string) {
    const blob = new Blob([contenido], { type: tipo });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  function exportarCsv() {
    const filas = [["Numero", "Nombre", "Telefono", "Estado", "Valor", "Codigo", "Fecha", "Nota"]];
    Object.keys(tickets)
      .sort()
      .forEach((k) => {
        const t = tickets[k];
        filas.push([
          k,
          t.buyerName,
          t.buyerPhone || "",
          t.status,
          String(raffle.price),
          t.code,
          formatDate(t.createdAt),
          t.note || "",
        ]);
      });
    const csv = filas
      .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    descargarArchivo(`ventas-${raffle.slug}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
  }

  function exportarRespaldo() {
    descargarArchivo(
      `respaldo-${raffle.slug}.json`,
      JSON.stringify({ numeros: tickets, ganador: winner }, null, 2),
      "application/json"
    );
  }

  async function copiarEnlace() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setSync({ clase: "ok", texto: "Enlace copiado al portapapeles" });
    } catch {
      setSync({ clase: "error", texto: "No se pudo copiar. Copia el enlace manualmente." });
    }
  }

  return (
    <div
      className="min-h-screen px-3 py-4 pb-10 font-narrow text-marron sm:px-4"
      style={{
        background: "#2b1b12",
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(0,0,0,.16) 0 2px, rgba(255,255,255,.02) 2px 5px, rgba(0,0,0,0) 5px 34px)",
      }}
    >
      <div className="mx-auto max-w-3xl border-[3px] border-dorado bg-crema p-4 shadow-2xl outline outline-1 outline-marron outline-offset-4 sm:p-5">
        {raffle.isOwner && (
          <div className="mb-3 flex items-center justify-between border border-marron/30 bg-crema2 px-3 py-2 text-xs">
            <span>Estás administrando esta rifa.</span>
            <Link href="/dashboard" className="font-bold underline">
              Mi panel
            </Link>
          </div>
        )}

        <div className="border-b-2 border-marron pb-3 text-center">
          {raffle.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={raffle.imageUrl}
              alt={raffle.prizeDescription}
              className="mx-auto mb-3 h-40 w-40 rounded-full border-4 border-dorado object-cover sm:h-48 sm:w-48"
            />
          )}
          <span className="inline-block -skew-x-[8deg] bg-marron px-5 py-1 text-[13px] tracking-[0.22em] text-crema">
            <span className="inline-block skew-x-[8deg]">{raffle.prizeDescription}</span>
          </span>
          <h1 className="mt-2 text-[clamp(30px,8vw,52px)] font-black leading-[0.95] text-marron">
            {raffle.title}
          </h1>
          <p className="mt-1 text-[15px] tracking-wide text-[#6b4126]">
            {raffle.drawDate ? formatDate(raffle.drawDate) : "Fecha por confirmar"}
            {raffle.drawMethod ? ` · ${raffle.drawMethod}` : ""}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Dato label="PAGADOS" valor={String(resumen.pagados)} />
          <Dato label="APARTADOS" valor={String(resumen.apartados)} />
          <Dato label="LIBRES" valor={String(resumen.libres)} />
          <Dato label="EN CAJA" valor={formatMoney(resumen.recaudado)} color="text-verde" />
          <Dato label="POR COBRAR" valor={formatMoney(resumen.pendiente)} color="text-rojo" />
        </div>

        <div
          className={`mt-2 flex min-h-[18px] items-center justify-center gap-2 text-xs tracking-wide ${
            sync.clase === "error" ? "text-rojo" : "text-[#7a5033]"
          }`}
        >
          <i
            className={`inline-block h-[9px] w-[9px] rounded-full ${
              sync.clase === "ok" ? "bg-verde" : sync.clase === "guardando" ? "bg-dorado" : "bg-rojo"
            }`}
          />
          <span>{sync.texto}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nombre, teléfono o número"
            className="min-w-[180px] flex-1 border-2 border-marron bg-[#fff8e6] px-3 py-2 text-[15px] text-marron"
          />
          <button
            onClick={() => setFiltro("")}
            className="border-2 border-marron px-4 py-2 text-sm font-bold hover:bg-crema2"
          >
            Limpiar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#6b4126]">
          <span><i className="mr-1 inline-block h-3.5 w-3.5 border border-marron bg-crema align-[-2px]" />Libre</span>
          <span><i className="mr-1 inline-block h-3.5 w-3.5 border border-marron bg-dorado align-[-2px]" />Apartado</span>
          <span><i className="mr-1 inline-block h-3.5 w-3.5 border border-marron bg-verde align-[-2px]" />Pagado</span>
        </div>

        <div
          className="mt-3 grid gap-[3px] bg-marron p-1"
          style={{ gridTemplateColumns: `repeat(${Math.min(10, raffle.totalNumbers)}, 1fr)` }}
        >
          {numbers.map((num) => {
            const t = tickets[num];
            const resaltado = coincide(num);
            const esGanador = winner === num;
            return (
              <button
                key={num}
                onClick={() => setFichaNum(num)}
                title={t ? `${t.buyerName} · ${t.status}` : "Libre"}
                className={[
                  "flex aspect-square items-center justify-center text-[clamp(11px,2.6vw,19px)] font-black transition-transform hover:z-10 hover:scale-110",
                  esGanador
                    ? "animate-pulse bg-rojo text-white"
                    : t?.status === "PAGADO"
                    ? "bg-verde text-crema"
                    : t?.status === "APARTADO"
                    ? "bg-dorado text-marron"
                    : "bg-crema text-marron",
                  resaltado ? "shadow-[inset_0_0_0_3px_#b1291f]" : "",
                ].join(" ")}
              >
                {num}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {raffle.isOwner && (
            <>
              <button onClick={registrarGanador} className="border-2 border-marron bg-dorado px-4 py-2.5 text-sm font-bold text-marron hover:bg-[#e8b950]">
                Registrar número ganador
              </button>
              <button onClick={exportarCsv} className="border-2 border-marron px-4 py-2.5 text-sm font-bold hover:bg-crema2">
                Descargar Excel (CSV)
              </button>
              <button onClick={exportarRespaldo} className="border-2 border-marron px-4 py-2.5 text-sm font-bold hover:bg-crema2">
                Guardar respaldo
              </button>
            </>
          )}
          <button onClick={refrescar} className="border-2 border-marron px-4 py-2.5 text-sm font-bold hover:bg-crema2">
            Traer últimos cambios
          </button>
          <button onClick={copiarEnlace} className="border-2 border-marron px-4 py-2.5 text-sm font-bold hover:bg-crema2">
            Copiar enlace de esta rifa
          </button>
        </div>

        <h2 className="mb-2 mt-6 border-b-2 border-marron pb-1 text-[15px] tracking-[0.18em]">PARTICIPANTES</h2>
        <ListaParticipantes
          tickets={tickets}
          filtro={filtro}
          coincide={coincide}
          onSelect={setFichaNum}
          isOwner={raffle.isOwner}
        />
      </div>

      {fichaNum !== null && (
        <FichaModal
          raffle={raffle}
          numero={fichaNum}
          ticket={tickets[fichaNum]}
          isOwner={raffle.isOwner}
          onClose={() => {
            setFichaNum(null);
            setVistaDoc(false);
          }}
          onGuardado={(t) => {
            setTickets((prev) => ({ ...prev, [t.number]: t }));
          }}
          onLiberar={() => liberarTicket(fichaNum).then(() => setFichaNum(null))}
          guardarApi={guardarTicketApi}
          verDocumento={vistaDoc}
          setVerDocumento={setVistaDoc}
        />
      )}
    </div>
  );
}

function Dato({ label, valor, color }: { label: string; valor: string; color?: string }) {
  return (
    <div className="min-w-[92px] border border-marron/30 bg-crema2 px-3 py-1.5 text-center">
      <b className={`block text-2xl font-black leading-tight ${color || ""}`}>{valor}</b>
      <small className="text-[11px] tracking-[0.12em] text-[#7a5033]">{label}</small>
    </div>
  );
}

function ListaParticipantes({
  tickets,
  filtro,
  coincide,
  onSelect,
  isOwner,
}: {
  tickets: TicketMap;
  filtro: string;
  coincide: (num: string) => boolean;
  onSelect: (num: string) => void;
  isOwner: boolean;
}) {
  let claves = Object.keys(tickets).sort();
  if (filtro) claves = claves.filter(coincide);

  if (claves.length === 0) {
    return (
      <p className="py-4 text-sm text-[#8a6544]">
        {filtro
          ? "Ningún participante coincide con esa búsqueda."
          : "Todavía no hay números vendidos. Toca un número del tablero para participar."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {(isOwner ? ["N°", "Nombre", "Teléfono", "Estado", "Fecha"] : ["N°", "Nombre", "Estado", "Fecha"]).map((h) => (
              <th key={h} className="border-b border-marron/30 px-1.5 py-1.5 text-left text-[11px] tracking-[0.12em] text-[#7a5033]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {claves.map((k) => {
            const t = tickets[k];
            return (
              <tr key={k} onClick={() => onSelect(k)} className="cursor-pointer border-b border-marron/15 hover:bg-crema2">
                <td className="px-1.5 py-2"><b>{k}</b></td>
                <td className="px-1.5 py-2">{t.buyerName}</td>
                {isOwner && <td className="px-1.5 py-2">{t.buyerPhone || "—"}</td>}
                <td className="px-1.5 py-2">
                  <span
                    className={`border px-2 py-0.5 text-[11px] ${
                      t.status === "PAGADO" ? "border-verde bg-verde text-crema" : "border-marron bg-dorado"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-1.5 py-2">{formatDate(t.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FichaModal({
  raffle,
  numero,
  ticket,
  isOwner,
  onClose,
  onGuardado,
  onLiberar,
  guardarApi,
  verDocumento,
  setVerDocumento,
}: {
  raffle: RaffleDTO;
  numero: string;
  ticket: TicketDTO | undefined;
  isOwner: boolean;
  onClose: () => void;
  onGuardado: (t: TicketDTO) => void;
  onLiberar: () => void;
  guardarApi: (number: string, payload: Record<string, unknown>) => Promise<{ ok: true; ticket: TicketDTO } | { ok: false; error: string }>;
  verDocumento: boolean;
  setVerDocumento: (v: boolean) => void;
}) {
  const [nombre, setNombre] = useState(ticket?.buyerName || "");
  const [telefono, setTelefono] = useState(ticket?.buyerPhone || "");
  const [nota, setNota] = useState(ticket?.note || "");
  const [estado, setEstado] = useState<"APARTADO" | "PAGADO">(ticket?.status || "APARTADO");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /**
   * Guarda la ficha. Un visitante siempre termina viendo su comprobante de
   * reserva (con la cuenta donde depositar); la organizadora decide.
   */
  async function guardar(opciones?: { verDocumento?: boolean; estadoForzado?: "APARTADO" | "PAGADO" }) {
    if (!nombre.trim()) {
      setAviso(isOwner ? "Escribe el nombre del comprador para guardar." : "Escribe tu nombre para participar.");
      return;
    }
    setEnviando(true);
    const payload = isOwner
      ? {
          buyerName: nombre.trim(),
          buyerPhone: telefono.trim(),
          note: nota.trim(),
          status: opciones?.estadoForzado || estado,
        }
      : { buyerName: nombre.trim(), buyerPhone: telefono.trim() };
    const res = await guardarApi(numero, payload);
    setEnviando(false);
    if (!res.ok) {
      setAviso(res.error);
      return;
    }
    onGuardado(res.ticket);
    if (opciones?.estadoForzado) setEstado(opciones.estadoForzado);

    // El comprador se lleva su comprobante apenas aparta el número.
    if (opciones?.verDocumento || !isOwner) setVerDocumento(true);
    else onClose();
  }

  if (verDocumento && ticket) {
    return (
      <DocumentoModal
        raffle={raffle}
        ticket={ticket}
        isOwner={isOwner}
        onVolver={() => setVerDocumento(false)}
        onClose={onClose}
      />
    );
  }

  const puedeEditar = isOwner || !ticket;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-5"
    >
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto border-[3px] border-dorado bg-crema p-5 shadow-2xl">
        <div className="text-[60px] font-black leading-[0.9]">
          {numero}
          <small className="block text-xs font-normal tracking-[0.18em] text-[#7a5033]">
            NÚMERO DEL SORTEO · {formatMoney(raffle.price)}
          </small>
        </div>

        {!puedeEditar && (
          <div className="mt-3 border border-marron/30 bg-crema2 p-3 text-sm">
            <p><b>{ticket!.buyerName}</b> ya tomó este número.</p>
            <p className="mt-1">
              Estado:{" "}
              <span className="font-bold">
                {ticket!.status === "PAGADO" ? "PAGADO" : "APARTADO, pendiente de pago"}
              </span>
            </p>
          </div>
        )}

        {puedeEditar && (
          <>
            <Campo label="NOMBRE DEL COMPRADOR">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus className="ent" />
            </Campo>
            <Campo label="TELÉFONO / WHATSAPP">
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" className="ent" />
            </Campo>

            {isOwner && (
              <>
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] tracking-[0.14em] text-[#7a5033]">ESTADO DEL PAGO</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEstado("APARTADO")}
                      className={`flex-1 border-2 border-marron px-1 py-2.5 text-[13px] font-bold ${estado === "APARTADO" ? "bg-dorado" : "bg-crema2"}`}
                    >
                      Apartado
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstado("PAGADO")}
                      className={`flex-1 border-2 border-marron px-1 py-2.5 text-[13px] font-bold ${estado === "PAGADO" ? "bg-verde text-crema" : "bg-crema2"}`}
                    >
                      Pagado
                    </button>
                  </div>
                </div>
                <Campo label="NOTA (opcional)">
                  <textarea value={nota} onChange={(e) => setNota(e.target.value)} className="ent min-h-[54px] resize-y" />
                </Campo>
              </>
            )}
          </>
        )}

        {!isOwner && !ticket && (
          <p className="mt-3 text-xs leading-relaxed text-[#7a5033]">
            Al reservar recibirás un comprobante con la cuenta donde depositar{" "}
            {formatMoney(raffle.price)}. {raffle.contactName || "La organizadora"} confirma tu pago y
            ahí se genera tu certificado.
          </p>
        )}

        {aviso && <p className="mt-2 min-h-[18px] text-sm text-rojo">{aviso}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {puedeEditar && (
            <button
              onClick={() => guardar()}
              disabled={enviando}
              className="border-2 border-marron bg-marron px-4 py-2.5 text-sm font-bold text-crema hover:bg-[#61301c] disabled:opacity-60"
            >
              {isOwner ? "Guardar" : enviando ? "Reservando…" : "Reservar este número"}
            </button>
          )}
          {isOwner && ticket && ticket.status !== "PAGADO" && (
            <button
              onClick={() => guardar({ estadoForzado: "PAGADO", verDocumento: true })}
              disabled={enviando}
              className="border-2 border-verde bg-verde px-4 py-2.5 text-sm font-bold text-crema hover:bg-[#3a5019] disabled:opacity-60"
            >
              Confirmar pago y generar certificado
            </button>
          )}
          {ticket && (
            <button
              onClick={() => setVerDocumento(true)}
              className="border-2 border-marron bg-dorado px-4 py-2.5 text-sm font-bold text-marron hover:bg-[#e8b950]"
            >
              {ticket.status === "PAGADO" ? "Ver certificado" : "Ver comprobante de pago"}
            </button>
          )}
          <button onClick={onClose} className="border-2 border-marron bg-transparent px-4 py-2.5 text-sm font-bold hover:bg-crema2">
            Cerrar
          </button>
          {isOwner && ticket && (
            <button
              onClick={() => {
                if (confirm(`¿Liberar el número ${numero}? Se borran los datos de ${ticket.buyerName}.`)) onLiberar();
              }}
              className="border-2 border-rojo bg-transparent px-4 py-2.5 text-sm font-bold text-rojo hover:bg-rojo/10"
            >
              Liberar número
            </button>
          )}
        </div>
      </div>

      <style>{`.ent { width:100%; padding:10px 11px; font-size:16px; font-family:inherit; color:#4a2415; border:2px solid #4a2415; background:#fff8e6; margin-top:2px; }`}</style>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <label className="mb-1 block text-[11px] tracking-[0.14em] text-[#7a5033]">{label}</label>
      {children}
    </div>
  );
}

/**
 * Muestra el documento que corresponde al estado del número:
 * comprobante de reserva mientras está apartado, certificado cuando la
 * organizadora ya confirmó el pago.
 */
function DocumentoModal({
  raffle,
  ticket,
  isOwner,
  onVolver,
  onClose,
}: {
  raffle: RaffleDTO;
  ticket: TicketDTO;
  isOwner: boolean;
  onVolver: () => void;
  onClose: () => void;
}) {
  const esPagado = ticket.status === "PAGADO";
  const [img, setImg] = useState<string | null>(null);
  const [ayuda, setAyuda] = useState(
    esPagado
      ? "Mantén presionada la imagen para guardarla en tu galería, o usa los botones."
      : "Guarda esta imagen: tiene la cuenta donde debes depositar. Tu certificado se genera cuando se confirme el pago."
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImg(esPagado ? dibujarCertificado(raffle, ticket) : dibujarComprobante(raffle, ticket));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.number, ticket.status, ticket.buyerName, ticket.code]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!img) return null;

  const tipo = esPagado ? "certificado" : "comprobante";
  const nombreArchivo = `${tipo}-${ticket.number}-${ticket.buyerName.replace(/\s+/g, "-").toLowerCase()}.png`;
  const blob = dataUrlABlob(img);

  const datosDePago =
    `${raffle.bankName || ""} ${raffle.accountNumber || ""}\n` +
    `${raffle.accountHolder || ""}\n` +
    `CI: ${raffle.cedula || ""}\n` +
    `${raffle.paymentEmail || ""}`;

  // La organizadora le escribe al comprador; el comprador le escribe a ella.
  const textoWhatsapp = isOwner
    ? esPagado
      ? `*CERTIFICADO ${raffle.title.toUpperCase()}*\n` +
        `Número: ${ticket.number}\n` +
        `A nombre de: ${ticket.buyerName}\n` +
        `Premio: ${raffle.prizeDescription}\n` +
        (raffle.drawDate ? `Sorteo: ${formatDate(raffle.drawDate)}` : "") +
        (raffle.drawMethod ? `, ${raffle.drawMethod}\n` : "\n") +
        `Tu pago está confirmado, el número es tuyo.\n` +
        `Código de verificación: ${ticket.code}`
      : `Hola ${ticket.buyerName}, tienes apartado el número *${ticket.number}* de la rifa "${raffle.title}".\n\n` +
        `*Para completar tu compra deposita ${formatMoney(raffle.price)}:*\n` +
        datosDePago +
        `\n\nEnvíame la foto del comprobante y confirmo tu pago.`
    : `Hola${raffle.contactName ? " " + raffle.contactName : ""}, aparté el número *${ticket.number}* de la rifa "${raffle.title}".\n` +
      `Mi nombre: ${ticket.buyerName}\n` +
      (ticket.buyerPhone ? `Mi teléfono: ${ticket.buyerPhone}\n` : "") +
      `Código de reserva: ${ticket.code}\n\n` +
      (esPagado
        ? "Mi pago ya está confirmado."
        : `Voy a depositar ${formatMoney(raffle.price)} y te envío el comprobante.`);

  async function compartir() {
    try {
      const archivo = new File([blob], nombreArchivo, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({
          files: [archivo],
          title: `${esPagado ? "Certificado" : "Comprobante"} ${ticket.number}`,
        });
        return;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      setAyuda('Si no apareció la descarga, usa «Abrir en pestaña nueva» y guarda la imagen desde ahí.');
    } catch {
      setAyuda("Tu navegador bloqueó la descarga. Usa «Abrir en pestaña nueva» o mantén presionada la imagen.");
    }
  }

  async function copiarImagen() {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setAyuda("Imagen copiada. Pégala directo en el chat de WhatsApp.");
    } catch {
      setAyuda("No se pudo copiar aquí. Mantén presionada la imagen y elige copiar o guardar.");
    }
  }

  function abrirPestana() {
    const url = URL.createObjectURL(blob);
    const v = window.open(url, "_blank");
    if (!v) setAyuda("El navegador bloqueó la pestaña. Permite ventanas emergentes o mantén presionada la imagen.");
  }

  function enviarWhatsapp() {
    const tel = whatsappNumber(isOwner ? ticket.buyerPhone : raffle.whatsapp);
    if (!tel) {
      setAyuda(
        isOwner
          ? "Este comprador no dejó teléfono, así que no se puede abrir WhatsApp."
          : "La organizadora no registró un WhatsApp de contacto en esta rifa."
      );
      return;
    }
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(textoWhatsapp)}`, "_blank");
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-5"
    >
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto border-[3px] border-dorado bg-crema p-5 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={`${esPagado ? "Certificado" : "Comprobante de reserva"} del número ${ticket.number}`}
          className="w-full border-2 border-marron"
        />
        <p className="mt-2.5 text-xs leading-relaxed text-[#7a5033]">{ayuda}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={compartir} className="border-2 border-marron bg-marron px-4 py-2.5 text-sm font-bold text-crema hover:bg-[#61301c]">
            Compartir o guardar imagen
          </button>
          <button onClick={copiarImagen} className="border-2 border-marron px-4 py-2.5 text-sm font-bold hover:bg-crema2">
            Copiar imagen
          </button>
          <button onClick={abrirPestana} className="border-2 border-marron px-4 py-2.5 text-sm font-bold hover:bg-crema2">
            Abrir en pestaña nueva
          </button>
          <button onClick={enviarWhatsapp} className="border-2 border-marron bg-dorado px-4 py-2.5 text-sm font-bold text-marron hover:bg-[#e8b950]">
            {isOwner ? "Enviar al comprador por WhatsApp" : "Enviar mi reserva por WhatsApp"}
          </button>
          <button onClick={onVolver} className="border-2 border-marron bg-transparent px-4 py-2.5 text-sm font-bold hover:bg-crema2">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
