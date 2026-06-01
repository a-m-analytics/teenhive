-- Run these in your Supabase SQL Editor

-- 1. Notifications table
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  read boolean default false,
  data jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_read_idx on notifications(user_id, read);

-- 2. Saved jobs table
create table if not exists saved_jobs (
  id uuid default gen_random_uuid() primary key,
  teen_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(teen_id, job_id)
);
create index if not exists saved_jobs_teen_id_idx on saved_jobs(teen_id);

-- 3. Reviews table (if not exists)
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  reviewee_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  unique(reviewer_id, job_id)
);
create index if not exists reviews_reviewee_id_idx on reviews(reviewee_id);

-- 4. Reports table
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  reported_id uuid references profiles(id) on delete cascade not null,
  reason text not null,
  details text,
  created_at timestamptz default now()
);

-- 5. Blocks table
create table if not exists blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);
create index if not exists blocks_blocker_id_idx on blocks(blocker_id);

-- 6. Add missing columns to profiles (safe - uses IF NOT EXISTS equivalent)
alter table profiles add column if not exists trust_score integer default 0;
alter table profiles add column if not exists jobs_completed integer default 0;
alter table profiles add column if not exists rating numeric(3,1) default 0;
alter table profiles add column if not exists rating_count integer default 0;
alter table profiles add column if not exists is_verified boolean default false;
alter table profiles add column if not exists profile_bonus_awarded boolean default false;

-- 7. Add missing columns to jobs
alter table jobs add column if not exists status text default 'open';
alter table jobs add column if not exists accepted_teen_id uuid references profiles(id);

-- 8. Add missing columns to messages
alter table messages add column if not exists read boolean default false;
alter table messages add column if not exists job_id uuid references jobs(id);

-- 9. RLS policies for notifications (enable read/write for authenticated user)
alter table notifications enable row level security;
create policy if not exists "Users see own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy if not exists "Users insert notifications" on notifications
  for insert with check (true);
create policy if not exists "Users update own notifications" on notifications
  for update using (auth.uid() = user_id);

-- 10. RLS for saved_jobs
alter table saved_jobs enable row level security;
create policy if not exists "Teens manage own saved jobs" on saved_jobs
  for all using (auth.uid() = teen_id);

-- 11. RLS for reports
alter table reports enable row level security;
create policy if not exists "Users insert reports" on reports
  for insert with check (auth.uid() = reporter_id);

-- 12. RLS for blocks
alter table blocks enable row level security;
create policy if not exists "Users manage own blocks" on blocks
  for all using (auth.uid() = blocker_id);

-- 13. RLS for reviews
alter table reviews enable row level security;
create policy if not exists "Anyone can read reviews" on reviews
  for select using (true);
create policy if not exists "Authenticated users can insert reviews" on reviews
  for insert with check (auth.uid() = reviewer_id);

-- 14. Fix applications status constraint (add 'invited' and 'completed')
-- Drop old constraint and recreate with all valid statuses
alter table applications drop constraint if exists applications_status_check;
alter table applications add constraint applications_status_check
  check (status in ('pending', 'accepted', 'declined', 'invited', 'completed'));

-- 15. Add parent-specific profile fields
alter table profiles add column if not exists num_kids integer;
alter table profiles add column if not exists kids_ages text[] default '{}';
alter table profiles add column if not exists has_pets boolean;
alter table profiles add column if not exists pets_description text;
alter table profiles add column if not exists home_type text;

-- 16. Add job timing and recurrence fields
alter table jobs add column if not exists start_time text;
alter table jobs add column if not exists recurring_days text[] default '{}';

-- 17. RLS: allow parents to insert invitations (status='invited') for their own jobs
--     Drop any conflicting policy first, then recreate
drop policy if exists "Parents can insert invitations" on applications;
create policy "Parents can insert invitations"
  on applications for insert
  to authenticated
  with check (
    auth.uid() = parent_id AND
    exists (select 1 from jobs where jobs.id = job_id and jobs.parent_id = auth.uid())
  );

-- 18. RLS: allow parents to read applications for their own jobs
drop policy if exists "Parents can read own job applications" on applications;
create policy "Parents can read own job applications"
  on applications for select
  to authenticated
  using (
    auth.uid() = parent_id OR auth.uid() = teen_id
  );

-- 19. RLS: allow parents to update applications for their own jobs (accept/decline)
drop policy if exists "Parents can update own job applications" on applications;
create policy "Parents can update own job applications"
  on applications for update
  to authenticated
  using (auth.uid() = parent_id OR auth.uid() = teen_id);
