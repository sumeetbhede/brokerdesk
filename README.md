# BrokerDesk

Mobile-first web app for independent real estate brokers: leads, listings, and tracked WhatsApp sharing.
Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage).

## Setup

1. **Database**: in the Supabase dashboard open SQL Editor, paste `supabase/migrations/0001_init.sql`, run it once.
2. **Keys**: copy `.env.example` to `.env.local` and fill in the project URL and publishable key (Project Settings → API).
3. **Run**: `npm install`, then `npm run dev`, and open http://localhost:3000.

For quick testing, turn off "Confirm email" under Authentication → Sign In / Providers → Email, otherwise
each signup has to click an email link first. For production, set Authentication → URL Configuration → Site URL
to your deployed address.

## What's in it

| Area | Path | Notes |
|---|---|---|
| Today | `/` | Follow-ups due, links clients opened, new leads |
| Leads | `/leads` | Stages, notes, follow-ups, matching listings, send on WhatsApp |
| Listings | `/listings` | Manual entry, photos, status, PDF brochure |
| Import | `/listings/import` | Excel/CSV inventory sheet, columns matched by heading |
| Public link | `/p/<token>` | What the client sees; each open is logged |

## Data model

Every signup gets its own `organization`, and every row carries `org_id`. Row-level security limits each
user to their own organization, so adding agents later needs an invite flow but no schema change.
Anonymous visitors can't read any table; the public page goes through the `get_share()` function, which
returns one listing for one token and leaves out `private_notes`.
