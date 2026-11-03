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

Copy the public Supabase settings from `.env.example` into `apps/marketing/.env.local`
and `apps/admin/.env.local`. Next.js loads environment files from each app's root.
`DATABASE_URL` is optional and is not needed for the contact flow.

## Contact Storage

The marketing contact modal writes to `public.contacts` through Supabase.
The remote-linked project is **WarrenWelding** (`kjzrpqpktsyghgabgjvj`) in
**studio-X-consulting**. The applied Supabase migration is:

```txt
supabase/migrations/20261102185211_contacts_foundation.sql
```

For a new checkout:

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Link with `supabase link --project-ref kjzrpqpktsyghgabgjvj`. Check
   `supabase migration list --linked` before applying any new migrations.
3. Give admin users `app_metadata.role = "admin"` or `"staff"` so the admin app
   can read and update contact requests under RLS.

Public visitors can only insert contact requests. Reading and updating contacts
is limited to authenticated admin/staff users by policy.

The original Drizzle SQL in `packages/db/drizzle` is retained as historical
scaffolding; do not apply it separately to the configured project.

Verify access against the linked remote database without retaining test data:

```bash
supabase db query --linked --file supabase/tests/contacts_access.sql
supabase db advisors --linked --type security
```

On November 2, 2026, the migration was applied, remote access tests passed,
anonymous REST insertion succeeded, anonymous REST reading was denied, and
the database security advisor reported no warnings. Both local apps have
ignored environment files configured. The `warren-marketing` Vercel project has
both public Supabase variables configured for Production. Deployment
`3irSScMGGcqbS6Lmf7igWy7eYfNv` reached Ready, and a submission through
`https://warren-marketing.vercel.app/` displayed success and was verified in
the remote database. The temporary test contact was removed afterward.
Preview/Development Vercel variables and the admin deployment connection
remain unconfigured. Admin authentication is implemented locally; it has not
yet been published to Vercel.

## Scheduling foundation (November 3, 2026)

Open **Schedule & jobs** in the admin sidebar or `/schedule`.
Admins can create/edit customer and equipment jobs, move job progress on the
shop board through the job editor, add timed field visits or flexible shop-day
ranges, assign multiple staff and a lead, reschedule, cancel, and complete
individual bookings. The weekly calendar shows bookings and assigned crew.
Staff can read only their assigned jobs/bookings; only admins manage scheduling.

Times use `America/Chicago`. Nonexistent spring-forward times are rejected;
the repeated fall hour resolves to its earlier occurrence. Overlapping staff
assignments require explicit acknowledgement, including flexible shop-day
reservations. Adjacent timed visits do not overlap. Booking/crew changes are
transactional. A completed visit does not complete the overall job; remaining
scheduled bookings must be completed/cancelled before closing the job.

The scheduling migrations are applied to the linked remote project. The app
changes are local and not yet committed or deployed. Verification includes:

```bash
node scripts/test-scheduling-time.mjs
supabase db query --linked --file supabase/tests/scheduling_access.sql
```

Remote RLS/transaction tests, Central Time/DST tests, type checks, lint, builds,
and production-browser create/edit/reschedule/overlap/complete/cancel checks
passed. Disposable browser fixtures were removed. Performance advisors reported
no issues. The project-wide Auth advisor separately reports that
[leaked-password protection is disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Remaining scheduler work: dedicated day/My day views, reusable named crews,
drag-and-drop scheduling, staff field-status/notes updates, activity history,
notifications and verified delivery, phone-calendar subscriptions, time off,
and resource/bay capacity. Current job list is capped at 200 most recently
updated jobs; booking views have explicit initial limits. These limits and
the remaining features should be addressed before a full scheduling release.

## Admin authentication

The admin app uses email/password sign-in, server-verified Supabase users,
session refresh in `src/proxy.ts`, and staff checks before reading contacts.
Only `app_metadata.role` values `admin` and `staff` grant portal access.
User-editable metadata cannot grant access. Public registration is disabled
in the linked project. Do not re-enable it for staff onboarding.

`derick@bodarksystems.com` is the initial admin account. No invitation email
has been sent. The private initial setup link is stored in an ignored local
file, `apps/admin/.env.admin-setup.local`. Treat setup links like passwords.
They expire and are single-use. Never commit them.

Run the built portal on its expected port:

```bash
npm run build --workspace=@warren/admin
npm run start --workspace=@warren/admin -- --port 3001
```

For this Windows machine's certificate chain, set `NODE_USE_SYSTEM_CA=1`
in the terminal before building/running or provisioning accounts. Keep TLS
verification enabled.

### Add staff or issue a replacement password-setup link

Admins can use **Staff & access** in the dashboard sidebar (`/staff`). Enter
first name, last name, and email, optionally add phone and job title, choose
Staff or Admin, and click **Add staff**. Copy the private
setup link and share it directly with that person. Existing accounts have
**Save role** and **New setup link** controls. Your own role cannot be changed
from this screen. Staff users cannot view this page or execute its actions.
**Edit staff details** updates first/last name, phone, and job title for
existing accounts, including your own. Sign-in email remains read-only in
the profile editor. Profile details live in user metadata; access roles remain
separate in app metadata. Phone validation, persisted profile edits, clearing
optional phone, and unchanged role permissions were verified with a disposable
account on November 2, 2026.

This screen requires `SUPABASE_SECRET_KEY` in **the admin app only**. It is
configured in the ignored local admin environment file. Add it separately to
the admin Vercel project before deploying. Never prefix it with `NEXT_PUBLIC_`
or put it in the marketing project's settings. The privileged client is
server-only and is called only after verifying the current user's Admin role.
No email is automatically sent. New accounts receive a one-time recovery
link for setting their initial password; duplicate creation does not replace
an existing account or its role.

The command-line alternative remains available:

From a trusted operator terminal with `SUPABASE_ACCESS_TOKEN` available:

```bash
node scripts/provision-staff.mjs person@example.com staff http://localhost:3001
```

After the admin site is deployed, replace localhost with its exact HTTPS
origin. Share the printed one-time link privately with the named recipient.
The script sends no email and retrieves its credential through the operator's
Management API access rather than reading the app's secret.
It defaults to the `staff` role. Use `admin` explicitly for administrators.
It refuses to change the role of an existing account. For an existing account
with the matching role, it generates a replacement recovery link.

Remove staff access through Supabase Authentication's **app metadata** role,
then revoke that user's sessions. Existing database JWT claims may retain the
old role until token expiry; the portal itself checks the current user on each
request. Do not use user metadata for permissions.

### Verification on November 2, 2026

Type checks, lint, and production builds passed. Browser checks against the
production admin build and remote Supabase verified anonymous redirects,
invalid-password errors, denial of nonstaff users (including forged admin user
metadata), staff/admin login, session persistence, sign-out, password setup,
password confirmation validation, single-use links, and current-role revocation.
Temporary test accounts were removed afterward. These are local production
build checks, not a claim that the admin app is deployed.

Staff-management verification also passed: browser-created Staff account,
duplicate rejection, Admin/Staff role changes, setup-link copying and replacement,
remote role persistence, staff/anonymous management-page denial, and hidden
management navigation for staff. The disposable test account was removed.

The private portal uses a shared grouped sidebar and account header across the dashboard, schedule, jobs, inquiries, staff, and password settings. This layout retains Warren branding and does not change the marketing site.
