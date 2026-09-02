export type TicketDTO = {
  number: string;
  buyerName: string;
  buyerPhone: string | null;
  status: "APARTADO" | "PAGADO";
  note: string | null;
  code: string;
  createdAt: string;
};

export type RaffleDTO = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  prizeDescription: string;
  imageUrl: string | null;
  price: number;
  totalNumbers: number;
  drawDate: string | null;
  drawMethod: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  cedula: string | null;
  paymentEmail: string | null;
  whatsapp: string | null;
  contactName: string | null;
  winnerNumber: string | null;
  isOwner: boolean;
  tickets: TicketDTO[];
};
