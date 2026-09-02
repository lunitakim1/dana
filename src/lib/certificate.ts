import type { RaffleDTO, TicketDTO } from "@/lib/types";
import { formatDate, formatMoneyExacto } from "@/lib/utils";

const CREMA = "#fffdf5";
const MARRON = "#4a2415";
const ORO = "#d8a53a";
const ROJO = "#b1291f";
const VERDE = "#45601f";
const GRIS = "#7a5033";
const W = 1000;

function txtCentrado(ctx: CanvasRenderingContext2D, texto: string, y: number, ancho = W) {
  ctx.textAlign = "center";
  ctx.fillText(texto, ancho / 2, y);
}

function envolver(ctx: CanvasRenderingContext2D, texto: string, maxAncho: number): string[] {
  const palabras = String(texto).split(" ");
  const lineas: string[] = [];
  let actual = "";
  palabras.forEach((p) => {
    const prueba = actual ? actual + " " + p : p;
    if (ctx.measureText(prueba).width > maxAncho && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  });
  if (actual) lineas.push(actual);
  return lineas;
}

/** Reduce el tamaño de la fuente hasta que el texto quepa en el ancho dado. */
function fuenteQueQuepa(
  ctx: CanvasRenderingContext2D,
  texto: string,
  maxAncho: number,
  tamMax: number,
  familia: string,
  tamMin = 18
) {
  let tam = tamMax;
  ctx.font = `bold ${tam}px ${familia}`;
  while (ctx.measureText(texto).width > maxAncho && tam > tamMin) {
    tam -= 2;
    ctx.font = `bold ${tam}px ${familia}`;
  }
  return tam;
}

function lineaPunteada(ctx: CanvasRenderingContext2D, y: number, x1: number, x2: number, patron: number[]) {
  ctx.setLineDash(patron);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function marco(ctx: CanvasRenderingContext2D, H: number) {
  ctx.fillStyle = CREMA;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = MARRON;
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, W - 32, H - 32);
  ctx.strokeStyle = ORO;
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, W - 68, H - 68);
}

/**
 * Encabezado común: banda con el nombre del documento y la rifa, el titular
 * y el número en grande. Devuelve la posición vertical donde seguir dibujando.
 */
function encabezado(
  ctx: CanvasRenderingContext2D,
  raffle: RaffleDTO,
  ticket: TicketDTO,
  opciones: { rotulo: string; estado: string; colorEstado: string; leyenda: string }
): number {
  ctx.fillStyle = MARRON;
  ctx.fillRect(50, 50, W - 100, 190);

  ctx.fillStyle = CREMA;
  ctx.font = "22px Arial";
  txtCentrado(ctx, opciones.rotulo, 112);

  const tam = fuenteQueQuepa(ctx, raffle.title.toUpperCase(), W - 180, 68, "Arial Black, Arial", 26);
  ctx.fillStyle = CREMA;
  ctx.font = `bold ${tam}px Arial Black, Arial`;
  txtCentrado(ctx, raffle.title.toUpperCase(), 190);

  ctx.fillStyle = opciones.colorEstado;
  ctx.font = "bold 20px Arial";
  txtCentrado(ctx, opciones.estado, 222);

  let y = 320;
  ctx.fillStyle = GRIS;
  ctx.font = "26px Georgia, serif";
  txtCentrado(ctx, opciones.leyenda, y);

  y += 78;
  ctx.fillStyle = MARRON;
  ctx.font = "bold 52px Georgia, serif";
  const lineas = envolver(ctx, ticket.buyerName.toUpperCase(), W - 200);
  lineas.forEach((l) => {
    txtCentrado(ctx, l, y);
    y += 62;
  });

  ctx.strokeStyle = "rgba(74,36,21,.45)";
  ctx.lineWidth = 2;
  lineaPunteada(ctx, y - 34, 150, W - 150, [6, 8]);

  y += 30;
  ctx.fillStyle = GRIS;
  ctx.font = "26px Georgia, serif";
  txtCentrado(ctx, "le corresponde el número:", y);

  y += 175;
  ctx.fillStyle = MARRON;
  ctx.font = "bold 210px Arial Black, Arial";
  txtCentrado(ctx, ticket.number, y);

  return y;
}

function filaDato(ctx: CanvasRenderingContext2D, etiqueta: string, valor: string, y: number) {
  ctx.textAlign = "left";
  ctx.fillStyle = GRIS;
  ctx.font = "20px Arial";
  ctx.fillText(etiqueta, 90, y);
  ctx.fillStyle = MARRON;
  ctx.font = "bold 24px Arial";
  ctx.fillText(valor, 420, y);
  ctx.strokeStyle = "rgba(74,36,21,.25)";
  ctx.lineWidth = 1;
  lineaPunteada(ctx, y + 14, 90, W - 90, [2, 5]);
}

/** Mide cuántas líneas ocupa el nombre para calcular el alto del lienzo. */
function lineasDelNombre(nombre: string): number {
  const medidor = document.createElement("canvas").getContext("2d")!;
  medidor.font = "bold 52px Georgia, serif";
  return envolver(medidor, nombre.toUpperCase(), W - 200).length;
}

/**
 * CERTIFICADO — solo se genera cuando la organizadora confirmó el pago.
 * Acredita que el número ya está pagado y pertenece al titular.
 */
export function dibujarCertificado(raffle: RaffleDTO, ticket: TicketDTO): string {
  // 1400 deja aire bajo el sello y el pie sin salirse del marco.
  const extra = (lineasDelNombre(ticket.buyerName) - 1) * 62;
  const H = 1400 + extra;

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;

  marco(x, H);
  let y = encabezado(x, raffle, ticket, {
    rotulo: "C E R T I F I C A D O   D E   P A R T I C I P A C I Ó N",
    estado: (raffle.subtitle || raffle.prizeDescription).toUpperCase(),
    colorEstado: ORO,
    leyenda: "Se deja constancia de que",
  });

  y += 60;
  const filas: [string, string][] = [
    ["PREMIO", raffle.prizeDescription],
    ["VALOR DEL NÚMERO", `${formatMoneyExacto(raffle.price)} · PAGADO`],
    ["FECHA DEL SORTEO", raffle.drawDate ? formatDate(raffle.drawDate) : "Por confirmar"],
    ["MODALIDAD", raffle.drawMethod || "—"],
    ["TITULAR REGISTRADO EL", formatDate(ticket.createdAt)],
    ["TELÉFONO DEL TITULAR", ticket.buyerPhone || "—"],
  ];
  filas.forEach((f) => {
    filaDato(x, f[0], f[1], y);
    y += 48;
  });

  // Sello de pago confirmado
  y += 40;
  x.save();
  x.translate(W / 2, y + 40);
  x.rotate(-0.12);
  x.strokeStyle = VERDE;
  x.lineWidth = 5;
  x.strokeRect(-190, -52, 380, 104);
  x.strokeRect(-180, -42, 360, 84);
  x.fillStyle = VERDE;
  x.font = "bold 58px Arial Black, Arial";
  x.textAlign = "center";
  x.fillText("PAGADO", 0, 20);
  x.restore();
  y += 120;

  y += 40;
  x.fillStyle = GRIS;
  x.font = "20px Arial";
  txtCentrado(x, "Código de verificación", y);
  y += 40;
  x.fillStyle = MARRON;
  x.font = "bold 32px Courier New, monospace";
  txtCentrado(x, ticket.code, y);
  y += 44;
  x.fillStyle = GRIS;
  x.font = "20px Arial";
  txtCentrado(x, `Responsable: ${raffle.contactName || "—"} · WhatsApp ${raffle.whatsapp || "—"}`, y);
  y += 32;
  txtCentrado(x, "Este certificado acredita que el número está pagado y pertenece al titular.", y);

  return c.toDataURL("image/png");
}

/**
 * COMPROBANTE DE RESERVA — lo recibe quien aparta un número y todavía no paga.
 * Lleva la cuenta bancaria donde depositar y los pasos a seguir. No acredita
 * la titularidad: eso lo hace el certificado, una vez confirmado el pago.
 */
export function dibujarComprobante(raffle: RaffleDTO, ticket: TicketDTO): string {
  const extra = (lineasDelNombre(ticket.buyerName) - 1) * 62;
  const H = 1660 + extra;

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;

  marco(x, H);
  let y = encabezado(x, raffle, ticket, {
    rotulo: "C O M P R O B A N T E   D E   R E S E R V A",
    estado: "APARTADO · PENDIENTE DE PAGO",
    colorEstado: ORO,
    leyenda: "Se ha reservado a nombre de",
  });

  // Valor a pagar, destacado
  y += 45;
  x.fillStyle = "rgba(216,165,58,.20)";
  x.fillRect(80, y, W - 160, 110);
  x.strokeStyle = MARRON;
  x.lineWidth = 3;
  x.strokeRect(80, y, W - 160, 110);
  x.textAlign = "left";
  x.fillStyle = GRIS;
  x.font = "20px Arial";
  x.fillText("VALOR A DEPOSITAR", 110, y + 46);
  x.fillStyle = MARRON;
  x.font = "bold 26px Arial";
  x.fillText(raffle.prizeDescription.slice(0, 34), 110, y + 84);
  x.textAlign = "right";
  x.font = "bold 62px Arial Black, Arial";
  x.fillText(formatMoneyExacto(raffle.price), W - 110, y + 76);
  y += 110;

  // Cuenta bancaria
  y += 34;
  const altoCuenta = 320;
  x.fillStyle = "rgba(177,41,31,.08)";
  x.fillRect(80, y, W - 160, altoCuenta);
  x.strokeStyle = ROJO;
  x.lineWidth = 3;
  x.setLineDash([12, 8]);
  x.strokeRect(80, y, W - 160, altoCuenta);
  x.setLineDash([]);

  x.textAlign = "left";
  x.fillStyle = ROJO;
  x.font = "bold 26px Arial";
  x.fillText("DEPOSITA O TRANSFIERE A ESTA CUENTA", 110, y + 48);

  const pagos: [string, string][] = [
    ["BANCO", raffle.bankName || "—"],
    ["N° DE CUENTA", raffle.accountNumber || "—"],
    ["A NOMBRE DE", raffle.accountHolder || "—"],
    ["CÉDULA", raffle.cedula || "—"],
    ["CORREO", raffle.paymentEmail || "—"],
  ];
  let py = y + 100;
  pagos.forEach((p) => {
    x.fillStyle = GRIS;
    x.font = "20px Arial";
    x.fillText(p[0], 110, py);
    x.fillStyle = MARRON;
    x.font = "bold 24px Arial";
    x.fillText(p[1], 380, py);
    py += 40;
  });
  y += altoCuenta;

  // Pasos a seguir
  y += 44;
  x.fillStyle = MARRON;
  x.font = "bold 24px Arial";
  x.fillText("PARA COMPLETAR TU COMPRA", 90, y);
  y += 38;
  const pasos = [
    `1. Deposita o transfiere ${formatMoneyExacto(raffle.price)} a la cuenta de arriba.`,
    `2. Envía la foto del comprobante al WhatsApp ${raffle.whatsapp || "de la organizadora"}.`,
    `3. ${raffle.contactName || "La organizadora"} confirma tu pago y tu número pasa a PAGADO.`,
    "4. Ahí se genera tu certificado, que acredita que el número es tuyo.",
  ];
  x.fillStyle = GRIS;
  x.font = "21px Arial";
  pasos.forEach((p) => {
    x.fillText(p, 90, y);
    y += 34;
  });

  // Pie
  y += 30;
  x.fillStyle = GRIS;
  x.font = "20px Arial";
  txtCentrado(x, "Código de reserva", y);
  y += 40;
  x.fillStyle = MARRON;
  x.font = "bold 32px Courier New, monospace";
  txtCentrado(x, ticket.code, y);
  y += 46;
  x.fillStyle = ROJO;
  x.font = "bold 19px Arial";
  txtCentrado(x, "IMPORTANTE: este comprobante todavía no es tu certificado.", y);
  y += 30;
  x.fillStyle = GRIS;
  x.font = "19px Arial";
  txtCentrado(x, "Guárdalo hasta que se confirme tu pago. Reservado el " + formatDate(ticket.createdAt) + ".", y);

  return c.toDataURL("image/png");
}

export function dataUrlABlob(dataUrl: string): Blob {
  const partes = dataUrl.split(",");
  const mime = partes[0].match(/:(.*?);/)![1];
  const bin = atob(partes[1]);
  const buffer = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}
