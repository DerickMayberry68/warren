CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"service" text DEFAULT 'General inquiry' NOT NULL,
	"message" text,
	"source" text DEFAULT 'marketing' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.contacts FROM anon, authenticated;
GRANT INSERT (name, email, phone, service, message, source, status) ON public.contacts TO anon, authenticated;
GRANT SELECT, UPDATE ON "contacts" TO authenticated;

CREATE POLICY "Public can submit contact requests"
ON "contacts"
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'new' AND source = 'marketing');

CREATE POLICY "Admins can view contact requests"
ON "contacts"
FOR SELECT
TO authenticated
USING (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') IN ('admin', 'staff')
);

CREATE POLICY "Admins can update contact requests"
ON "contacts"
FOR UPDATE
TO authenticated
USING (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') IN ('admin', 'staff')
)
WITH CHECK (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') IN ('admin', 'staff')
);
