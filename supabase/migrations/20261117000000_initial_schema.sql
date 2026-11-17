-- InternTrack: initial database schema.
--
-- Run it once in the Supabase dashboard (SQL Editor -> New query -> paste -> Run)
-- or with the Supabase CLI (`supabase db push`).
--
-- Every table has Row Level Security (RLS): Postgres itself checks that a user
-- reads and changes only their own rows, whatever the browser sends.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Extra user data on top of Supabase Auth (auth.users holds email and password).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 200),
  created_at timestamptz not null default now()
);

-- One row = one internship application.
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (char_length(company) between 1 and 200),
  role text not null check (char_length(role) between 1 and 200),
  job_url text check (char_length(job_url) <= 2000),
  location text check (char_length(location) <= 200),
  status text not null default 'wishlist'
    check (status in ('wishlist', 'applied', 'test', 'interview', 'offer', 'rejected')),
  -- The date of the next step: the application deadline, the test deadline,
  -- the interview date or the date to answer an offer, depending on status.
  deadline date,
  applied_at date,
  job_description text check (char_length(job_description) <= 50000),
  notes text check (char_length(notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);

-- Application history. `type` is either the status the application moved to
-- or 'note' for a note the user wrote.
create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  type text not null
    check (type in ('wishlist', 'applied', 'test', 'interview', 'offer', 'rejected', 'note')),
  happened_at timestamptz not null default now(),
  note text check (char_length(note) <= 2000)
);

create index application_events_application_id_idx
  on public.application_events (application_id, happened_at);

-- CV text that the AI compares with job postings.
create table public.cv_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Основное' check (char_length(title) between 1 and 100),
  content text not null default '' check (char_length(content) <= 30000),
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one default CV per user.
create unique index cv_versions_one_default_per_user
  on public.cv_versions (user_id) where is_default;

-- Saved AI answers, so the same analysis is not paid for twice.
-- content: {"matches": [], "gaps": [], "highlights": []} for an analysis,
--          {"text": "..."} for a cover letter.
create table public.ai_results (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  kind text not null check (kind in ('analysis', 'cover_letter')),
  content jsonb not null,
  cv_title text,
  created_at timestamptz not null default now()
);

create index ai_results_application_id_idx
  on public.ai_results (application_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keep updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create trigger cv_versions_set_updated_at
  before update on public.cv_versions
  for each row execute function public.set_updated_at();

-- Write a history event when an application is created or changes status.
-- The database does it, so the history stays correct whichever code
-- changes the status.
create function public.log_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_events (application_id, type)
    values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger applications_log_status_change
  after insert or update of status on public.applications
  for each row execute function public.log_status_change();

-- Create a profile for every new user. security definer lets the function
-- write to public.profiles while it runs inside Supabase Auth's insert.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- auth.uid() is the id of the signed-in user, taken from their login token.
-- `using` filters the rows a query can see; `with check` validates the rows
-- an insert or update would write. Requests without a login (role anon)
-- match no policy, so they see nothing.

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.cv_versions enable row level security;
alter table public.ai_results enable row level security;

create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users manage their own applications"
  on public.applications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage events of their own applications"
  on public.application_events for all to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = application_id and a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.applications a
    where a.id = application_id and a.user_id = (select auth.uid())
  ));

create policy "Users manage their own CV versions"
  on public.cv_versions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage AI results of their own applications"
  on public.ai_results for all to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = application_id and a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.applications a
    where a.id = application_id and a.user_id = (select auth.uid())
  ));
