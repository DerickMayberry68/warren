create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_number bigint generated always as identity unique,
  title text not null check (char_length(trim(title)) between 1 and 160),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 160),
  customer_email text not null default '' check (char_length(customer_email) <= 254),
  customer_phone text not null default '' check (char_length(customer_phone) <= 40),
  equipment text not null default '' check (char_length(equipment) <= 500),
  location text not null default '' check (char_length(location) <= 500),
  instructions text not null default '' check (char_length(instructions) <= 5000),
  status text not null default 'new' check (status in ('new','ready','scheduled','in_progress','waiting','ready_pickup','completed')),
  blocker text not null default '' check (char_length(blocker) <= 300),
  priority text not null default 'normal' check (priority in ('normal','urgent')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_status_due_idx on public.jobs(status,due_date);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  kind text not null check (kind in ('shop','field')),
  start_at timestamptz,
  end_at timestamptz,
  start_day date,
  end_day date,
  lead_id uuid not null references auth.users(id),
  location text not null default '' check (char_length(location) <= 500),
  instructions text not null default '' check (char_length(instructions) <= 2000),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_dates check (
    (kind='field' and start_at is not null and end_at > start_at and start_day is null and end_day is null)
    or (kind='shop' and start_day is not null and end_day >= start_day and start_at is null and end_at is null)
  )
);
create index bookings_job_idx on public.bookings(job_id);
create index bookings_start_idx on public.bookings(start_at) where status='scheduled';
create index bookings_day_idx on public.bookings(start_day) where status='scheduled';
create index bookings_lead_idx on public.bookings(lead_id);

create table public.booking_assignments (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  staff_id uuid not null references auth.users(id) on delete cascade,
  primary key(booking_id,staff_id)
);
create index booking_assignments_staff_idx on public.booking_assignments(staff_id,booking_id);

alter table public.jobs enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_assignments enable row level security;
revoke all on public.jobs,public.bookings,public.booking_assignments from anon,authenticated;
grant select,insert,update,delete on public.jobs,public.bookings,public.booking_assignments to authenticated;
grant usage on sequence public.jobs_job_number_seq to authenticated;

create policy admins_manage_jobs on public.jobs for all to authenticated
using ((select auth.jwt())->'app_metadata'->>'role'='admin')
with check ((select auth.jwt())->'app_metadata'->>'role'='admin');
create policy admins_manage_bookings on public.bookings for all to authenticated
using ((select auth.jwt())->'app_metadata'->>'role'='admin')
with check ((select auth.jwt())->'app_metadata'->>'role'='admin');
create policy admins_manage_assignments on public.booking_assignments for all to authenticated
using ((select auth.jwt())->'app_metadata'->>'role'='admin')
with check ((select auth.jwt())->'app_metadata'->>'role'='admin');
create policy staff_read_assignments on public.booking_assignments for select to authenticated
using ((select auth.jwt())->'app_metadata'->>'role'='staff' and staff_id=(select auth.uid()));
create policy staff_read_bookings on public.bookings for select to authenticated
using ((select auth.jwt())->'app_metadata'->>'role'='staff' and exists (
  select 1 from public.booking_assignments a where a.booking_id=bookings.id and a.staff_id=(select auth.uid())
));
create policy staff_read_jobs on public.jobs for select to authenticated
using ((select auth.jwt())->'app_metadata'->>'role'='staff' and exists (
  select 1 from public.bookings b join public.booking_assignments a on a.booking_id=b.id
  where b.job_id=jobs.id and a.staff_id=(select auth.uid())
));

-- Atomic booking + assignment changes. Invoker permissions and RLS still apply.
create function public.save_booking(
  p_id uuid, p_job uuid, p_kind text, p_start timestamptz, p_end timestamptz,
  p_day date, p_last_day date, p_staff uuid[], p_lead uuid,
  p_location text, p_instructions text, p_override boolean default false
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_from timestamptz; v_to timestamptz;
begin
  if coalesce((select auth.jwt())->'app_metadata'->>'role','') <> 'admin' then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  if p_staff is null or cardinality(p_staff)=0 or p_lead is null or not (p_lead=any(p_staff)) or array_position(p_staff,null) is not null then
    raise exception 'Choose a crew and a lead person';
  end if;
  if p_kind='field' and p_start is not null and p_end>p_start and p_day is null and p_last_day is null then
    v_from:=p_start; v_to:=p_end;
  elsif p_kind='shop' and p_day is not null and p_last_day>=p_day and p_start is null and p_end is null then
    v_from:=p_day::timestamp at time zone 'America/Chicago';
    v_to:=(p_last_day+1)::timestamp at time zone 'America/Chicago';
  else raise exception 'Enter a valid booking date range'; end if;
  -- Serialize scheduler writes so simultaneous saves also see overlap warnings.
  perform pg_advisory_xact_lock(78349312);
  if not p_override and exists (
    select 1 from public.bookings b join public.booking_assignments a on a.booking_id=b.id
    where b.status='scheduled' and (p_id is null or b.id<>p_id) and a.staff_id=any(p_staff)
    and (case when b.kind='field' then b.start_at else b.start_day::timestamp at time zone 'America/Chicago' end) < v_to
    and (case when b.kind='field' then b.end_at else (b.end_day+1)::timestamp at time zone 'America/Chicago' end) > v_from
  ) then raise exception 'Crew overlap: at least one assigned person already has work during this time. Review the calendar or explicitly allow the overlap.'; end if;
  if p_id is null then
    insert into public.bookings(job_id,kind,start_at,end_at,start_day,end_day,lead_id,location,instructions)
    values(p_job,p_kind,p_start,p_end,p_day,p_last_day,p_lead,p_location,p_instructions) returning id into v_id;
  else
    update public.bookings set kind=p_kind,start_at=p_start,end_at=p_end,start_day=p_day,end_day=p_last_day,
      lead_id=p_lead,location=p_location,instructions=p_instructions,updated_at=now()
      where id=p_id and job_id=p_job and status='scheduled' returning id into v_id;
    if v_id is null then raise exception 'This booking changed or is no longer scheduled. Reload and try again.'; end if;
    delete from public.booking_assignments where booking_id=v_id;
  end if;
  insert into public.booking_assignments(booking_id,staff_id) select v_id,s from unnest(p_staff) s group by s;
  update public.jobs set status='scheduled',updated_at=now() where id=p_job and status in ('new','ready');
  return v_id;
end $$;
revoke execute on function public.save_booking(uuid,uuid,text,timestamptz,timestamptz,date,date,uuid[],uuid,text,text,boolean) from public,anon;
grant execute on function public.save_booking(uuid,uuid,text,timestamptz,timestamptz,date,date,uuid[],uuid,text,text,boolean) to authenticated;
