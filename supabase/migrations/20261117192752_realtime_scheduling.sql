-- Broadcast schedule changes so open admin pages refresh live.
-- Realtime applies each subscriber's RLS, so staff only receive rows they can already read.
alter publication supabase_realtime add table public.jobs, public.bookings, public.booking_assignments;
