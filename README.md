# Brandfabriek Social Planner

Small client-facing social media planner with login, review, comments, and approvals. Styled to match Brandfabriek’s clean, bold tone and blue palette.

## Tech stack
- Next.js (App Router)
- Supabase Auth + Database

## Setup
1. Create a Supabase project.
2. Run the SQL below in Supabase SQL editor.
3. Create a Storage bucket named `post-media` (set to **public** for easiest sharing).
4. Add env vars to a `.env.local` file in the project root.

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_SETUP_CODE=your_one_time_setup_code
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
  media jsonb default '[]'::jsonb,
  author_username text,
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  body text not null,
  author_username text,
  created_at timestamptz default now()
);

create table if not exists app_users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

create table if not exists sessions (
  token uuid primary key,
  user_id uuid references app_users(id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz default now()
);
```

## Admin setup
Use the login screen and the **Create admin** tab with your `ADMIN_SETUP_CODE`. This only works once.

## Notes
- Supabase has upload limits by plan; “no max file limit” isn’t possible. We can raise client-side limits but Supabase enforces the true cap.
- If you see "schema cache" errors after creating tables, wait a minute or trigger **Project Settings → API → Reload schema**.

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
