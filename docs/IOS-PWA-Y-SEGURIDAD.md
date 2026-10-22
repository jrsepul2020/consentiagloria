# Consentia · iPhone (PWA) y seguridad

## Instalar en iPhone

1. Despliega la app en **HTTPS** (Vercel, Netlify, Cloudflare Pages, etc.).
2. Abre la URL en **Safari** (no Chrome/Firefox en iOS para “Añadir a inicio”).
3. Comparte → **Añadir a pantalla de inicio**.
4. Se abrirá a pantalla completa como app (standalone).

Incluye: `manifest.webmanifest`, iconos, metas Apple y service worker (`vite-plugin-pwa`).

## Checklist Supabase (obligatorio)

Ejecuta en el SQL Editor:

`supabase/migrations/20261022_rls_storage_pagination.sql`

Eso:
- añade `consents.signature_path`
- índices de búsqueda
- RLS: solo `authenticated`
- buckets privados `consent-pdfs` y `consent-signatures`

## Accesos recomendados

| Quién | Cómo |
|-------|------|
| Staff clínica | Usuarios Auth email/contraseña |
| Anónimos | Sin acceso a tablas ni Storage |
| Service role | Solo en backend/admin, nunca en el cliente |

Cuando haya varias clínicas: añadir `clinic_id` + políticas RLS por clínica.

## Firmas y PDF

- La firma se sube a **Storage** (`consent-signatures`).
- El PDF firmado a **Storage** (`consent-pdfs`).
- La columna `signature_data` deja de usarse en firmas nuevas (se pone a `null`).
