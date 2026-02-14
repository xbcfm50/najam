# Najam MVP

Personal rental tracking web app with Supabase Auth + Postgres and Next.js App Router.

## Supabase setup

1. Create a Supabase project.
2. In SQL editor (or Supabase CLI), run migrations in order:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_seed.sql`
3. In Supabase Auth settings, enable Email/Password provider.
4. Copy project URL and anon key.

## Vercel env vars

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do **not** expose service role key to browser/app runtime.

## Run locally

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open http://localhost:3000.

## How to test

1. Sign up/login at `/app/login`.
2. Go to `/app/settings/apartments`:
   - Create apartment (e.g. `A1`)
   - Add rent price with `valid_from=2026-01-01`, amount `500.00`
3. Go to `/app/bills/new`:
   - Create January electricity bill (`Struja`) with period `2026-01`
   - Set `received_on=2026-02-04` (after cutoff day 3)
4. Go to `/app/billing-runs/new?apartment=<A1_ID>&year=2026&month=2`:
   - Create draft + lock
   - Verify January electricity bill is **not** assigned (received after Feb cutoff)
5. Go to `/app/billing-runs/new?apartment=<A1_ID>&year=2026&month=3`:
   - Create draft + lock
   - Verify that same electricity bill is now included.
