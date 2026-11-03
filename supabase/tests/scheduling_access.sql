-- Remote transaction test. No fixtures or changes are retained.
begin;
insert into auth.users(id,email,raw_app_meta_data) values
('10000000-0000-4000-8000-000000000001','scheduler-admin@example.invalid','{"role":"admin"}'),
('10000000-0000-4000-8000-000000000002','scheduler-staff@example.invalid','{"role":"staff"}'),
('10000000-0000-4000-8000-000000000003','scheduler-other@example.invalid','{"role":"staff"}');
set local role authenticated;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000001","app_metadata":{"role":"admin"}}';
insert into public.jobs(id,title,customer_name) values
('20000000-0000-4000-8000-000000000001','Scheduler transaction test','Test customer'),
('20000000-0000-4000-8000-000000000002','Private unassigned test','Test customer');
do $$ declare first_id uuid; adjacent_id uuid; before_count integer; begin
  first_id:=public.save_booking(null,'20000000-0000-4000-8000-000000000001','field','2090-01-03T15:00Z','2090-01-03T16:00Z',null,null,array['10000000-0000-4000-8000-000000000002']::uuid[],'10000000-0000-4000-8000-000000000002','Test address','Test instructions',false);
  begin
    perform public.save_booking(null,'20000000-0000-4000-8000-000000000001','field','2090-01-03T15:30Z','2090-01-03T16:30Z',null,null,array['10000000-0000-4000-8000-000000000002']::uuid[],'10000000-0000-4000-8000-000000000002','','',false);
    raise exception 'Expected conflict warning';
  exception when raise_exception then if sqlerrm not like 'Crew overlap:%' then raise; end if; end;
  adjacent_id:=public.save_booking(null,'20000000-0000-4000-8000-000000000001','field','2090-01-03T16:00Z','2090-01-03T17:00Z',null,null,array['10000000-0000-4000-8000-000000000002']::uuid[],'10000000-0000-4000-8000-000000000002','','',false);
  perform public.save_booking(first_id,'20000000-0000-4000-8000-000000000001','field','2090-01-03T13:00Z','2090-01-03T14:00Z',null,null,array['10000000-0000-4000-8000-000000000002']::uuid[],'10000000-0000-4000-8000-000000000002','','',false);
  if (select count(*) from public.bookings where job_id='20000000-0000-4000-8000-000000000001')<>2 then raise exception 'Reschedule duplicated booking'; end if;
  begin
    perform public.save_booking(null,'20000000-0000-4000-8000-000000000001','shop',null,null,'2090-01-03','2090-01-03',array['10000000-0000-4000-8000-000000000002']::uuid[],'10000000-0000-4000-8000-000000000002','','',false);
    raise exception 'Expected shop/field conflict';
  exception when raise_exception then if sqlerrm not like 'Crew overlap:%' then raise; end if; end;
  perform public.save_booking(null,'20000000-0000-4000-8000-000000000001','shop',null,null,'2090-01-03','2090-01-04',array['10000000-0000-4000-8000-000000000002']::uuid[],'10000000-0000-4000-8000-000000000002','','',true);
  begin
    insert into public.bookings(job_id,kind,start_at,lead_id) values('20000000-0000-4000-8000-000000000001','field','2090-01-05T15:00Z','10000000-0000-4000-8000-000000000002');
    raise exception 'Missing end date accepted';
  exception when check_violation then null; end;
  select count(*) into before_count from public.bookings;
  begin
    perform public.save_booking(null,'20000000-0000-4000-8000-000000000001','field','2090-02-03T15:00Z','2090-02-03T16:00Z',null,null,array['10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000099']::uuid[],'10000000-0000-4000-8000-000000000002','','',false);
    raise exception 'Invalid crew accepted';
  exception when foreign_key_violation then null; end;
  if (select count(*) from public.bookings)<>before_count then raise exception 'Partial booking retained after assignment failure'; end if;
end $$;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000002","app_metadata":{"role":"staff"}}';
do $$ declare changed integer; begin
  if (select count(*) from public.jobs where id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002'))<>1 then raise exception 'Staff job visibility incorrect'; end if;
  if (select count(*) from public.bookings where job_id='20000000-0000-4000-8000-000000000001')<>3 then raise exception 'Staff booking visibility incorrect'; end if;
  update public.jobs set title='Unauthorized change' where id='20000000-0000-4000-8000-000000000001'; get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Staff can modify job'; end if;
  begin
    perform public.save_booking(null,'20000000-0000-4000-8000-000000000001','shop',null,null,'2090-01-03','2090-01-04',array['10000000-0000-4000-8000-000000000002']::uuid[],'10000000-0000-4000-8000-000000000002','','',true);
    raise exception 'Staff bypassed scheduling permission';
  exception when insufficient_privilege then null; end;
end $$;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000003","app_metadata":{"role":"staff"}}';
do $$ begin
  if exists(select 1 from public.jobs where id='20000000-0000-4000-8000-000000000001') then raise exception 'Other staff can read unassigned customer job'; end if;
end $$;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000002","app_metadata":{},"user_metadata":{"role":"admin"}}';
do $$ begin
  if exists(select 1 from public.jobs where id='20000000-0000-4000-8000-000000000001') then raise exception 'User metadata granted job access'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform * from public.jobs; raise exception 'Anonymous read allowed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
