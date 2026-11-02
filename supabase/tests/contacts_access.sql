-- Run with: supabase db query --linked --file supabase/tests/contacts_access.sql
-- All test data and role changes are rolled back.
begin;
set local role anon;
insert into public.contacts (name, email, message)
values ('Access test', 'access-test@example.invalid', 'Disposable access test');
do $$ begin
  begin
    perform * from public.contacts;
    raise exception 'Anonymous read unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.contacts (name, email, status)
    values ('Forbidden', 'forbidden@example.invalid', 'closed');
    raise exception 'Anonymous status spoof unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{},"user_metadata":{"role":"admin"}}';
do $$ declare changed integer; begin
  if exists (select 1 from public.contacts) then
    raise exception 'Nonstaff read unexpectedly allowed';
  end if;
  update public.contacts set status = 'closed';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Nonstaff update unexpectedly allowed'; end if;
end $$;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"staff"}}';
do $$ declare changed integer; begin
  if not exists (select 1 from public.contacts where email = 'access-test@example.invalid') then
    raise exception 'Staff cannot read test contact';
  end if;
  update public.contacts set status = 'contacted' where email = 'access-test@example.invalid';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Staff update failed'; end if;
end $$;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"admin"}}';
do $$ begin
  if not exists (select 1 from public.contacts where email = 'access-test@example.invalid' and status = 'contacted') then
    raise exception 'Admin cannot read updated contact';
  end if;
end $$;
rollback;
