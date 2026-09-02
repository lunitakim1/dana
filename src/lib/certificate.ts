import type { RaffleDTO, TicketDTO } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

function txtCentrado(ctx: CanvasRenderingContext2D, texto: string, y: number, W: number) {
  ctx.textAlign = "center";
  ctx.fillText(texto, W / 2, y);
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

export function dibujarCertificado(raffle: RaffleDTO, ticket: TicketDTO): string {
  const porPagar = ticket.status !== "PAGADO";
  const W = 1000;
  const H = porPagar ? 1660 : 1330;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;

  const CREMA = "#fffdf5", MARRON = "#4a2415", ORO = "#d8a53a", ROJO = "#b1291f", GRIS = "#7a5033";

  x.fillStyle = CREMA;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = MARRON;
  x.lineWidth = 8;
  x.strokeRect(16, 16, W - 32, H - 32);
  x.strokeStyle = ORO;
  x.lineWidth = 3;
  x.strokeRect(34, 34, W - 68, H - 68);

  x.fillStyle = MARRON;
  x.fillRect(50, 50, W - 100, 190);
  x.fillStyle = CREMA;
  x.font = "22px Arial";
  txtCentrado(x, "C E R T I F I C A D O   D E   P A R T I C I P A C I Ó N", 112, W);
  x.font = "bold 74px Arial Black, Arial";
  txtCentrado(x, raffle.title.toUpperCase(), 190, W);
  x.fillStyle = ORO;
  x.font = "20px Arial";
  txtCentrado(x, (raffle.subtitle || raffle.prizeDescription).toUpperCase(), 222, W);

  let y = 320;
  x.fillStyle = GRIS;
  x.font = "26px Georgia, serif";
  txtCentrado(x, "Se deja constancia de que", y, W);

  y += 78;
  x.fillStyle = MARRON;
  x.font = "bold 52px Georgia, serif";
  const lineas = envolver(x, ticket.buyerName.toUpperCase(), W - 200);
  lineas.forEach((l) => {
    txtCentrado(x, l, y, W);
    y += 62;
  });

  x.strokeStyle = "rgba(74,36,21,.45)";
  x.lineWidth = 2;
  x.setLineDash([6, 8]);
  x.beginPath();
  x.moveTo(150, y - 34);
  x.lineTo(W - 150, y - 34);
  x.stroke();
  x.setLineDash([]);

  y += 30;
  x.fillStyle = GRIS;
  x.font = "26px Georgia, serif";
  txtCentrado(x, "es titular del siguiente número:", y, W);

  y += 175;
  x.fillStyle = MARRON;
  x.font = "bold 210px Arial Black, Arial";
  txtCentrado(x, ticket.number, y, W);

  y += 60;
  const filas: [string, string][] = [
    ["PREMIO", raffle.prizeDescription],
    ["VALOR DEL NÚMERO", `${formatMoney(raffle.price)} · ${porPagar ? "PENDIENTE DE PAGO" : "PAGADO"}`],
    ["FECHA DEL SORTEO", raffle.drawDate ? formatDate(raffle.drawDate) : "Por confirmar"],
    ["MODALIDAD", raffle.drawMethod || "—"],
    ["TITULAR REGISTRADO EL", formatDate(ticket.createdAt)],
    ["TELÉFONO DEL TITULAR", ticket.buyerPhone || "—"],
  ];
  filas.forEach((f) => {
    x.textAlign = "left";
    x.fillStyle = GRIS;
    x.font = "20px Arial";
    x.fillText(f[0], 90, y);
    x.fillStyle = MARRON;
    x.font = "bold 24px Arial";
    x.fillText(f[1], 420, y);
    x.strokeStyle = "rgba(74,36,21,.25)";
    x.lineWidth = 1;
    x.setLineDash([2, 5]);
    x.beginPath();
    x.moveTo(90, y + 14);
    x.lineTo(W - 90, y + 14);
    x.stroke();
    x.setLineDash([]);
    y += 48;
  });

  if (porPagar) {
    y += 22;
    const alto = 300;
    x.fillStyle = "rgba(216,165,58,.16)";
    x.fillRect(80, y, W - 160, alto);
    x.strokeStyle = ROJO;
    x.lineWidth = 3;
    x.setLineDash([12, 8]);
    x.strokeRect(80, y, W - 160, alto);
    x.setLineDash([]);

    x.fillStyle = ROJO;
    x.font = "bold 26px Arial";
    x.textAlign = "left";
    x.fillText("CÓMO PAGAR TU NÚMERO", 110, y + 48);

    const pagos: [string, string][] = [
      ["BANCO", raffle.bankName || "—"],
      ["N° DE CUENTA", raffle.accountNumber || "—"],
      ["A NOMBRE DE", raffle.accountHolder || "—"],
      ["CÉDULA", raffle.cedula || "—"],
      ["CORREO", raffle.paymentEmail || "—"],
    ];
    let py = y + 96;
    pagos.forEach((p) => {
      x.fillStyle = GRIS;
      x.font = "20px Arial";
      x.fillText(p[0], 110, py);
      x.fillStyle = MARRON;
      x.font = "bold 24px Arial";
      x.fillText(p[1], 380, py);
      py += 38;
    });
    x.fillStyle = GRIS;
    x.font = "19px Arial";
    x.fillText(
      `Envía el comprobante al WhatsApp ${raffle.whatsapp || "del organizador"} y tu número pasa a pagado.`,
      110,
      y + alto - 22
    );
    y += alto;
  }

  y += 62;
  x.fillStyle = GRIS;
  x.font = "20px Arial";
  txtCentrado(x, "Código de verificación", y, W);
  y += 40;
  x.fillStyle = MARRON;
  x.font = "bold 32px Courier New, monospace";
  txtCentrado(x, ticket.code, y, W);
  y += 44;
  x.fillStyle = GRIS;
  x.font = "20px Arial";
  txtCentrado(x, `Responsable: ${raffle.contactName || "—"} · WhatsApp ${raffle.whatsapp || "—"}`, y, W);
  y += 32;
  txtCentrado(x, "Este certificado acredita la titularidad del número ante la organizadora.", y, W);

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
