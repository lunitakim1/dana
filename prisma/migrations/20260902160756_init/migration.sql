-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('APARTADO', 'PAGADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "prizeDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "totalNumbers" INTEGER NOT NULL DEFAULT 100,
    "drawDate" TIMESTAMP(3),
    "drawMethod" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "cedula" TEXT,
    "paymentEmail" TEXT,
    "whatsapp" TEXT,
    "contactName" TEXT,
    "winnerNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'APARTADO',
    "note" TEXT,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Raffle_slug_key" ON "Raffle"("slug");

-- CreateIndex
CREATE INDEX "Raffle_userId_idx" ON "Raffle"("userId");

-- CreateIndex
CREATE INDEX "Ticket_raffleId_idx" ON "Ticket"("raffleId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_raffleId_number_key" ON "Ticket"("raffleId", "number");

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
