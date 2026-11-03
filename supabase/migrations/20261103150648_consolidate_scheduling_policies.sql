-- One SELECT policy per table avoids evaluating duplicate permissive policies.
drop policy admins_manage_jobs on public.jobs;
drop policy admins_manage_bookings on public.bookings;
drop policy admins_manage_assignments on public.booking_assignments;
alter policy staff_read_assignments on public.booking_assignments using (
  (select auth.jwt())->'app_metadata'->>'role'='admin'
  or ((select auth.jwt())->'app_metadata'->>'role'='staff' and staff_id=(select auth.uid()))
);
alter policy staff_read_bookings on public.bookings using (
  (select auth.jwt())->'app_metadata'->>'role'='admin'
  or ((select auth.jwt())->'app_metadata'->>'role'='staff' and exists (
    select 1 from public.booking_assignments a where a.booking_id=bookings.id and a.staff_id=(select auth.uid())
  ))
);
alter policy staff_read_jobs on public.jobs using (
  (select auth.jwt())->'app_metadata'->>'role'='admin'
  or ((select auth.jwt())->'app_metadata'->>'role'='staff' and exists (
    select 1 from public.bookings b join public.booking_assignments a on a.booking_id=b.id
    where b.job_id=jobs.id and a.staff_id=(select auth.uid())
  ))
);
do $$ declare t text; begin
  foreach t in array array['jobs','bookings','booking_assignments'] loop
    execute format('create policy admins_insert on public.%I for insert to authenticated with check ((select auth.jwt())->''app_metadata''->>''role''=''admin'')',t);
    execute format('create policy admins_update on public.%I for update to authenticated using ((select auth.jwt())->''app_metadata''->>''role''=''admin'') with check ((select auth.jwt())->''app_metadata''->>''role''=''admin'')',t);
    execute format('create policy admins_delete on public.%I for delete to authenticated using ((select auth.jwt())->''app_metadata''->>''role''=''admin'')',t);
  end loop;
end $$;
