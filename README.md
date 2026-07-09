# LamAsia Guest Invitation / Visitor Request System

A small React + Supabase app for Eljin/LamAsia visitor management. A supplier
fills in their visit details, draws a signature, and submits a request. An
admin reviews it in a dashboard and approves (co-signing) or rejects it. The
visitor checks back with a reference number and prints/downloads the
approved invitation card.

**Live app:** https://lamasia-guest.vercel.app

## Features

- **Request form** (`/`) - supplier name, an appointment date restricted to
  upcoming Mondays/Tuesdays, contact person, and a drawn signature. Submitting
  returns a short reference code (e.g. `AEBE6BF4`) and a shareable status
  link. In-progress form state (including the drawn signature) is saved to
  `localStorage` so a refresh or dropped connection doesn't lose it.
- **Status check** (`/status?ref=...`) - look up a request by its short
  reference or full ID. Approved requests show the finished invitation card
  with both signatures, ready to print or download as a PNG.
- **Admin dashboard** (`/admin`) - Supabase Auth email/password login.
  Approve (with admin name + signature) or reject pending requests, search,
  and view/print/download any request's card. Responsive: a stacked-card
  layout on mobile, a table on desktop.

## Tech stack

- [React 19](https://react.dev/) + [react-router-dom](https://reactrouter.com/) - client-side routing (`/`, `/status`, `/admin`)
- [Vite](https://vitejs.dev/) - dev server and build
- [Tailwind CSS](https://tailwindcss.com/) - styling
- [Supabase](https://supabase.com/) - Postgres database, Auth (admin login), all via `@supabase/supabase-js`
- [Vercel](https://vercel.com/) - hosting, auto-deploys on push to `main`

## Project structure

```
src/
  main.jsx                    entry point
  App.jsx                     routes: / , /status , /admin
  index.css                   Tailwind + shared component classes
  pages/
    RequestForm.jsx            /       - visitor submits a request
    StatusCheck.jsx             /status - visitor checks status
    Admin.jsx                   /admin  - login + dashboard
  components/
    InvitationCard.jsx         the printable card, shared by all three pages
    SignaturePad.jsx           canvas-based signature capture
  lib/
    supabase.js                Supabase client (reads VITE_SUPABASE_* env vars)
    downloadPng.js              renders InvitationCard to a downloadable PNG
    utils.js                    date formatting, signature trimming helpers
supabase/
  schema.sql                   full DB schema, RLS policies, RPC functions
public/
  logo.png                     favicon + in-app logo
```

> `logo.js`, `old-index.html`, `old-admin.html`, `old-status.html` and the
> root-level `logo.jpg` / `logo.png` are leftovers from the app's original
> single-file static HTML version (see git history) and are not used by the
> current build - safe to ignore or remove.

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project's URL + anon key
npm run dev            # http://localhost:5173
```

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`
(serve that build locally).

There is no PHP/XAMPP dependency despite the folder living under `htdocs` -
this is a standalone Vite app and does not need Apache to run locally.

## Environment variables

| Variable                  | Where to find it                                              |
|----------------------------|----------------------------------------------------------------|
| `VITE_SUPABASE_URL`       | Supabase Dashboard -> Settings -> API -> Project URL           |
| `VITE_SUPABASE_ANON_KEY`  | Supabase Dashboard -> Settings -> API -> Project API keys -> `anon` `public` |

These are baked into the JS bundle **at build time** (Vite convention - only
`VITE_`-prefixed vars are exposed to client code). On Vercel they're set under
Project -> Settings -> Environment Variables; changing them requires a new
deployment to take effect, not just a dashboard edit.

## Supabase setup

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor
(Dashboard -> SQL Editor -> New query) to create the `requests` table, its
RLS policies, and the two RPC functions the app relies on:

- `submit_request(...)` - the only way an anonymous visitor can insert a row.
- `get_request_status(ref)` - the only way an anonymous visitor can read a
  row, scoped to just the columns the status page needs.

The public anon key never gets direct table access - both reads and writes
from the public pages go through these `SECURITY DEFINER` functions. Only
the authenticated admin session reads/updates the table directly.

After running the schema, create an admin login at Dashboard ->
Authentication -> Users -> Add user (email + password) - that's what you
sign in with at `/admin`.

## Deployment

The Vercel project (`visitor`) is connected to this repo and auto-deploys on
push to `main`. Set the two environment variables above in Vercel's project
settings before the first deploy, and redeploy after changing them since
they're compiled in at build time (see above).
