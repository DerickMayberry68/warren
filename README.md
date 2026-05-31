# Warren

Turborepo workspace with two Next.js apps and shared Supabase/database packages.

## Apps

- `apps/marketing` - public marketing site
- `apps/admin` - authenticated/admin surface

## Packages

- `packages/ui` - shared React UI primitives
- `packages/supabase` - Supabase browser, server, and proxy helpers
- `packages/db` - optional server-only Drizzle layer for complex SQL

## Getting Started

```bash
npm install
npm run dev
```

Run a single app:

```bash
npm run dev:marketing
npm run dev:admin
```

Copy `.env.example` to `.env.local` and add your Supabase project values before using real data.

## Contact Storage

The marketing contact modal writes to `public.contacts` through Supabase. The
local migration is in:

```txt
packages/db/drizzle/0000_sharp_dagger.sql
```

When the Warren Supabase project exists:

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Apply the contacts migration to the Supabase database.
3. Give admin users `app_metadata.role = "admin"` or `"staff"` so the admin app
   can read and update contact requests under RLS.

Public visitors can only insert contact requests. Reading and updating contacts
is limited to authenticated admin/staff users by policy.
