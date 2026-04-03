-- ============================================================
-- Neighborly Jobs — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  role             text        not null check (role in ('teen', 'parent')),
  full_name        text        not null default '',
  age              integer,
  bio              text,
  avatar_url       text,
  neighborhood     text,
  hourly_rate      numeric,
  skills           text[]      default '{}',
  availability     text[]      default '{}',
  trust_score      numeric     not null default 0,
  jobs_completed   integer     not null default 0,
  rating           numeric     not null default 0,
  rating_count     integer     not null default 0,
  is_verified      boolean     not null default false,
  phone_verified   boolean     not null default false,
  created_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone logged in can read any profile (needed for job browsing)
create policy "profiles: read any"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can only insert their own profile
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can only update their own profile
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can only delete their own profile
create policy "profiles: delete own"
  on public.profiles for delete
  using (auth.uid() = id);


-- ============================================================
-- 2. JOBS
-- ============================================================
create table if not exists public.jobs (
  id               uuid        primary key default gen_random_uuid(),
  parent_id        uuid        not null references public.profiles(id) on delete cascade,
  title            text        not null,
  category         text        not null,
  description      text,
  pay_rate         numeric     not null,
  pay_type         text        not null check (pay_type in ('hourly', 'flat')),
  location_area    text,
  date             text,
  estimated_hours  numeric,
  is_recurring     boolean     not null default false,
  frequency        text,
  kids_count       integer,
  teens_needed     integer     not null default 1,
  status           text        not null default 'open' check (status in ('open', 'in_progress', 'completed')),
  created_at       timestamptz not null default now()
);

alter table public.jobs enable row level security;

-- All authenticated users can browse open jobs
create policy "jobs: read open"
  on public.jobs for select
  using (
    auth.role() = 'authenticated'
    and (status = 'open' or parent_id = auth.uid())
  );

-- Only parents can post jobs
create policy "jobs: insert own"
  on public.jobs for insert
  with check (auth.uid() = parent_id);

-- Parents can only update their own jobs
create policy "jobs: update own"
  on public.jobs for update
  using (auth.uid() = parent_id);

-- Parents can only delete their own jobs
create policy "jobs: delete own"
  on public.jobs for delete
  using (auth.uid() = parent_id);


-- ============================================================
-- 3. APPLICATIONS
-- ============================================================
create table if not exists public.applications (
  id          uuid        primary key default gen_random_uuid(),
  job_id      uuid        not null references public.jobs(id) on delete cascade,
  teen_id     uuid        not null references public.profiles(id) on delete cascade,
  parent_id   uuid        not null references public.profiles(id) on delete cascade,
  status      text        not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  message     text,
  created_at  timestamptz not null default now(),
  unique (job_id, teen_id)
);

alter table public.applications enable row level security;

-- Teens see their own applications; parents see applications for their jobs
create policy "applications: read own"
  on public.applications for select
  using (
    auth.uid() = teen_id
    or auth.uid() = parent_id
  );

-- Only teens can apply
create policy "applications: insert teen"
  on public.applications for insert
  with check (auth.uid() = teen_id);

-- Parent can update status (accept/decline); teen cannot change status
create policy "applications: update parent"
  on public.applications for update
  using (auth.uid() = parent_id);

-- Teen can withdraw their own application
create policy "applications: delete teen"
  on public.applications for delete
  using (auth.uid() = teen_id);


-- ============================================================
-- 4. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id           uuid        primary key default gen_random_uuid(),
  sender_id    uuid        not null references public.profiles(id) on delete cascade,
  receiver_id  uuid        not null references public.profiles(id) on delete cascade,
  content      text        not null,
  read         boolean     not null default false,
  created_at   timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Users can only see messages they sent or received
create policy "messages: read own"
  on public.messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = receiver_id
  );

-- Users can only send messages as themselves
create policy "messages: insert own"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Receiver can mark as read; no other updates allowed
create policy "messages: update receiver"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- Sender can delete their own sent messages
create policy "messages: delete sender"
  on public.messages for delete
  using (auth.uid() = sender_id);


-- ============================================================
-- 5. REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id           uuid        primary key default gen_random_uuid(),
  reviewer_id  uuid        not null references public.profiles(id) on delete cascade,
  reviewee_id  uuid        not null references public.profiles(id) on delete cascade,
  job_id       uuid        not null references public.jobs(id) on delete cascade,
  rating       integer     not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now(),
  unique (reviewer_id, job_id)
);

alter table public.reviews enable row level security;

-- Anyone logged in can read reviews (shown on profiles)
create policy "reviews: read any"
  on public.reviews for select
  using (auth.role() = 'authenticated');

-- Users can only write reviews as themselves
create policy "reviews: insert own"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- Reviewers can edit their own reviews
create policy "reviews: update own"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

-- Reviewers can delete their own reviews
create policy "reviews: delete own"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);


-- ============================================================
-- 6. INDEXES (performance)
-- ============================================================
create index if not exists jobs_parent_id_idx        on public.jobs(parent_id);
create index if not exists jobs_status_idx           on public.jobs(status);
create index if not exists applications_job_id_idx   on public.applications(job_id);
create index if not exists applications_teen_id_idx  on public.applications(teen_id);
create index if not exists applications_parent_id_idx on public.applications(parent_id);
create index if not exists messages_sender_idx       on public.messages(sender_id);
create index if not exists messages_receiver_idx     on public.messages(receiver_id);
create index if not exists reviews_reviewee_id_idx   on public.reviews(reviewee_id);
create index if not exists reviews_job_id_idx        on public.reviews(job_id);


-- ============================================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
--    Trigger fires after a new auth.users row is inserted.
--    role + full_name must be passed as user_metadata during signUp().
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'teen'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
