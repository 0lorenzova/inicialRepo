# Claro — Finanzas personales

Aplicación web de finanzas personales con presupuesto por sobres, autenticación Supabase y sincronización privada de datos por cuenta.

## Requisitos

- Node.js 20.9 o posterior
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js App Router, React y TypeScript
- Material UI y Material React Table
- Supabase Auth y PostgreSQL con Row Level Security
- Vercel para despliegue continuo desde Git

Cloudinary no se incluye por ahora: la primera fase no necesita cargar ni procesar archivos multimedia.

## Configuración de Supabase

1. Copia `.env.example` a `.env.local` y añade la URL del proyecto y la clave publicable (o anon) de Supabase.
2. Ejecuta el contenido de `supabase/migrations/202609270001_user_finance_data.sql` en el SQL Editor de Supabase.
3. Inicia la app con `npm run dev`; crea una cuenta desde la pantalla de acceso. Las filas quedan protegidas por RLS para que cada persona solo pueda leer y cambiar sus propios datos.

No pongas una clave `service_role` en variables `NEXT_PUBLIC_*` ni en el navegador.

## Git y Vercel

Conecta este repositorio a GitHub y luego impórtalo desde Vercel. Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en las variables de entorno de Vercel para Production, Preview y Development. Cada push a `main` genera el despliegue de producción y los cambios en otras ramas crean previews.
