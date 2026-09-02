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

### La organizadora (administradora de su rifa)

1. Crea su cuenta (correo + contraseña) y guarda sus datos de pago una sola
   vez en **Mis datos de pago**; autocompletan cada rifa nueva.
2. Desde su panel (`/dashboard`) crea la rifa: sube la foto del premio,
   define el precio por número y la fecha del sorteo.
3. Se genera un tablero en `/r/<slug-de-la-rifa>` que comparte por WhatsApp.
4. Es la **única** que puede confirmar pagos, editar o liberar números y
   registrar el número ganador. Nadie más puede tocar su rifa.

### El comprador (sin iniciar sesión)

1. Abre el enlace, elige un número libre y deja su nombre y teléfono.
2. Recibe al instante un **comprobante de reserva** en imagen, con la cuenta
   bancaria donde depositar y los pasos a seguir. Puede guardarlo o
   enviárselo a la organizadora por WhatsApp con un botón.
3. Deposita y manda la foto del comprobante por WhatsApp.
4. Cuando la organizadora confirma el pago, el número pasa a **PAGADO** y
   recién ahí se genera el **certificado** que acredita que el número es
   suyo. Un número apartado nunca genera certificado.

### Aislamiento y privacidad

- Cada organizadora solo ve y administra sus propias rifas.
- El tablero público muestra qué números están libres, apartados o pagados,
  pero **no** muestra los teléfonos de los compradores: eso solo lo ve la
  organizadora.

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
prisma/schema.prisma            Modelos: User, Raffle, Ticket
src/lib/auth.ts                 Configuración de NextAuth (credenciales)
src/lib/certificate.ts          Dibuja el comprobante de reserva y el certificado
src/app/dashboard/              Panel: rifas y datos de pago de la organizadora
src/app/r/[slug]/               Tablero de cada rifa
src/components/RaffleBoard.tsx  Cuadrícula, ficha de número, documentos
src/app/api/raffles/            Endpoints (crear rifa, reservar número, ganador)
src/app/api/upload/             Subida de la imagen del premio a Vercel Blob
```

## Nota sobre los datos bancarios

Los datos de pago **no están escritos en el código**: se guardan en la base
de datos de cada organizadora (en su perfil y en cada rifa). Este repositorio
es público, así que ninguna cuenta ni cédula debe escribirse en el código
fuente; se cargan desde la app una vez desplegada.
