\set ON_ERROR_STOP on
-- Two users. The profile trigger must create a profile for each.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com', '{"full_name": "Alice"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@example.com', '{}');
do $$ begin
  assert (select count(*) from public.profiles) = 2, 'profiles not created';
  assert (select full_name from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'Alice', 'full_name not copied';
end $$;

-- ---- User A works with their data
set role authenticated;
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-0000-0000-0000-000000000001"}', false);
insert into public.applications (id, company, role, status, deadline)
  values ('11111111-0000-0000-0000-000000000001', 'Northwind Labs', 'AI Engineer Intern', 'wishlist', '2026-11-18');
insert into public.applications (company, role, status) values ('Helix Data', 'Data Science Intern', 'applied');
do $$ begin
  assert (select count(*) from public.applications) = 2, 'A should see 2 applications';
  assert (select user_id from public.applications where company = 'Helix Data') = 'aaaaaaaa-0000-0000-0000-000000000001', 'user_id default';
  assert (select count(*) from public.application_events) = 2, 'one created-event per application';
  assert (select type from public.application_events where application_id = '11111111-0000-0000-0000-000000000001') = 'wishlist', 'first event = initial status';
end $$;

select pg_sleep(0.01);
update public.applications set status = 'applied', applied_at = '2026-11-17' where id = '11111111-0000-0000-0000-000000000001';
update public.applications set notes = 'just a note' where id = '11111111-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) from public.application_events where application_id = '11111111-0000-0000-0000-000000000001') = 2, 'status change logged once, notes change not logged';
  assert (select updated_at > created_at from public.applications where id = '11111111-0000-0000-0000-000000000001'), 'updated_at not bumped';
end $$;
insert into public.application_events (application_id, type, note) values ('11111111-0000-0000-0000-000000000001', 'note', 'Recruiter called');
insert into public.cv_versions (content) values ('My CV');
insert into public.ai_results (application_id, kind, content) values ('11111111-0000-0000-0000-000000000001', 'analysis', '{"matches": [], "gaps": [], "highlights": []}');
do $$ begin
  begin
    insert into public.cv_versions (content) values ('Second default CV');
    raise exception 'second default CV was allowed';
  exception when unique_violation then null;
  end;
  begin
    insert into public.applications (company, role, status) values ('X', 'Y', 'hired');
    raise exception 'unknown status was allowed';
  exception when check_violation then null;
  end;
end $$;

-- ---- User B must not see or touch A's data
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-0000-0000-000000000002"}', false);
do $$
declare n int;
begin
  assert (select count(*) from public.applications) = 0, 'B sees A applications';
  assert (select count(*) from public.application_events) = 0, 'B sees A events';
  assert (select count(*) from public.cv_versions) = 0, 'B sees A CV';
  assert (select count(*) from public.ai_results) = 0, 'B sees A AI results';
  assert (select count(*) from public.profiles) = 1, 'B sees other profiles';

  update public.applications set company = 'hacked' where id = '11111111-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'B updated A application';
  delete from public.applications where id = '11111111-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'B deleted A application';

  begin
    insert into public.applications (user_id, company, role) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Spoof', 'Spoof');
    raise exception 'B inserted a row owned by A';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.application_events (application_id, type, note) values ('11111111-0000-0000-0000-000000000001', 'note', 'spam');
    raise exception 'B added an event to A application';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.ai_results (application_id, kind, content) values ('11111111-0000-0000-0000-000000000001', 'cover_letter', '{"text": "x"}');
    raise exception 'B added an AI result to A application';
  exception when insufficient_privilege then null;
  end;
end $$;

-- B's own CV is fine: the one-default rule is per user.
insert into public.cv_versions (content) values ('B CV');

-- ---- Anonymous requests see nothing
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
do $$ begin
  assert (select count(*) from public.applications) = 0, 'anon sees applications';
  assert (select count(*) from public.cv_versions) = 0, 'anon sees CVs';
end $$;

-- ---- Deleting an application removes its history and AI results
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-0000-0000-0000-000000000001"}', false);
delete from public.applications where id = '11111111-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) from public.application_events where application_id = '11111111-0000-0000-0000-000000000001') = 0, 'events not cascaded';
  assert (select count(*) from public.ai_results) = 0, 'ai_results not cascaded';
end $$;
reset role;
select 'ALL RLS CHECKS PASSED' as result;
