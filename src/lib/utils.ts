export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function padNumber(n: number, total: number): string {
  const digits = String(total - 1).length;
  return String(n).padStart(Math.max(digits, 2), "0");
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomSuffix(length = 4): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function ticketCode(raffleSlug: string, number: string): string {
  const s = `${raffleSlug}|${number}|${Date.now()}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return "GS-" + number + "-" + Math.abs(h).toString(36).toUpperCase().slice(0, 4).padStart(4, "X");
}

export function formatMoney(n: number): string {
  return `$${n % 1 === 0 ? n : n.toFixed(2)}`;
}

/** Formato para documentos: $2,00 */
export function formatMoneyExacto(n: number): string {
  return `$${n.toFixed(2).replace(".", ",")}`;
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
}

export function whatsappNumber(raw: string | null | undefined): string {
  let tel = (raw || "").replace(/\D/g, "");
  if (tel.length === 10 && tel[0] === "0") tel = "593" + tel.slice(1);
  return tel;
}
