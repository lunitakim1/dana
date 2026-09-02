# Rifas en la Nube

Plataforma multi-usuario para crear y administrar rifas: cada organizador
crea su cuenta, sube la foto de su premio y obtiene un tablero de números
en un enlace único (`/r/tu-rifa`) para compartir. Los datos de cada quien
(rifas, compradores, pagos, imágenes) se guardan en la nube y quedan
aislados por cuenta.

Basado en el tablero de rifa original (HTML/JS de una sola página) —aquí
convertido en una app Next.js multi-tenant con inicio de sesión y
almacenamiento en la nube por usuario.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **NextAuth (Auth.js) v5** — inicio de sesión con correo y contraseña
- **PostgreSQL + Prisma** — usuarios, rifas, números y compradores
- **Vercel Blob** — almacenamiento de las imágenes de cada rifa

## Cómo funciona

1. Cada persona crea una cuenta (correo + contraseña).
2. Desde su panel (`/dashboard`) crea una rifa: sube la foto del premio,
   define el precio por número, la fecha del sorteo y sus datos de pago.
3. Se genera un tablero público en `/r/<slug-de-la-rifa>` con la cuadrícula
   de números, buscador, lista de participantes y certificados descargables
   (igual que el tablero original).
4. Cualquier visitante con el enlace puede reservar un número libre
   escribiendo su nombre y teléfono. Solo la organizadora (dueña de la
   rifa, con sesión iniciada) puede marcar un número como pagado, liberar
   un número o registrar el número ganador.
5. Todo lo que ve/edita cada organizador está aislado por usuario: nadie
   más puede administrar o borrar los números de una rifa que no le
   pertenece.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completa las variables (ver abajo)
npx prisma migrate dev # crea las tablas en tu Postgres local
npm run dev
```

### Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Postgres |
| `AUTH_SECRET` | Clave para firmar las sesiones (genera una con `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública del sitio (en local: `http://localhost:3000`) |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob para subir las imágenes de las rifas |

## Desplegar en Vercel

1. **Importa el repositorio** en [vercel.com/new](https://vercel.com/new)
   apuntando a este repo/rama.
2. **Crea la base de datos**: en el proyecto de Vercel ve a
   **Storage → Create Database → Postgres** (Neon). Al conectarla, Vercel
   agrega automáticamente la variable `DATABASE_URL` al proyecto.
3. **Crea el almacenamiento de imágenes**: en **Storage → Create Database →
   Blob**. Al conectarlo, Vercel agrega `BLOB_READ_WRITE_TOKEN`
   automáticamente.
4. **Agrega las variables restantes** en **Settings → Environment
   Variables**:
   - `AUTH_SECRET`: genera un valor con `openssl rand -base64 32`.
   - `NEXTAUTH_URL`: la URL de tu dominio en Vercel (por ejemplo
     `https://tu-proyecto.vercel.app`).
5. **Despliega.** El script de build (`prisma generate && prisma migrate
   deploy && next build`) crea automáticamente las tablas en tu base de
   datos la primera vez.

Después de esto, cualquier persona puede entrar a tu dominio, crear su
cuenta y publicar su propia rifa con almacenamiento en la nube.

## Estructura del proyecto

```
prisma/schema.prisma        Modelos: User, Raffle, Ticket
src/lib/auth.ts              Configuración de NextAuth (credenciales)
src/app/dashboard/           Panel del organizador (listar/crear rifas)
src/app/r/[slug]/            Tablero público de cada rifa
src/components/RaffleBoard.tsx  Cuadrícula, ficha de número, certificado
src/app/api/raffles/         Endpoints (crear rifa, reservar número, ganador)
src/app/api/upload/          Subida de la imagen del premio a Vercel Blob
```
