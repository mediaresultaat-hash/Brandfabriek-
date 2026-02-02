# Brandfabriek Social Planner

Small client-facing social media planner with login, review, comments, and approvals. Styled to match Brandfabriek’s clean, bold tone and blue palette.

## Tech stack
- Next.js (App Router)
- Supabase Auth + Database

## Setup
1. Create a Supabase project.
2. In Supabase Auth, enable Email/Password sign-in.
3. Run the SQL below in Supabase SQL editor.
4. Add env vars to a `.env.local` file in the project root.

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. Install deps and run.

```
npm install
npm run dev
```

## Database schema
```
create extension if not exists "uuid-ossp";

create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  platform text not null,
  scheduled_at timestamptz,
  status text not null default 'review',
  copy text,
  assets text,
  author_email text,
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  body text not null,
  author_email text,
  created_at timestamptz default now()
);
```

## Row Level Security (simple, two-user setup)
```
alter table posts enable row level security;
alter table comments enable row level security;

create policy "Authenticated read" on posts
  for select
  to authenticated
  using (true);

create policy "Authenticated insert" on posts
  for insert
  to authenticated
  with check (true);

create policy "Authenticated update" on posts
  for update
  to authenticated
  using (true);

create policy "Authenticated read" on comments
  for select
  to authenticated
  using (true);

create policy "Authenticated insert" on comments
  for insert
  to authenticated
  with check (true);
```

## Deployment
Recommended stack: Vercel (frontend) + Supabase (auth/db). Add the same env vars in Vercel Project Settings.

### Vercel deploy checklist
1. Push this repo to GitHub.
2. Create a new Vercel project from that repo.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
4. In Supabase Auth, set Site URL to the Vercel domain (if you enable email confirmations).
5. Deploy.

## Notes
- The login page supports Sign Up for the first two accounts. You can disable sign-up later and create users in Supabase directly.
- Approvals set `status` to `approved`.
```
