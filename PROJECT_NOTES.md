# Squared — Project Notes

Bill-splitting app for friend groups in Pakistan. "Split bills, not friendships."

## What it does
- Sign up with name + phone (no password)
- Create a group, add friends, add expenses, split equally
- See who owes whom (simplified debt calculation)
- Settle up with one tap
- Share a receipt image or balance summary (via native share sheet / WhatsApp)
- Groups sync live across everyone's phones via a shared **join code**

## Tech stack
- React + Vite + Tailwind CSS v4
- Framer Motion for animations/transitions
- Supabase (Postgres) as the backend — free tier, no card required
- Deployed on Vercel (free tier)

## Live links
- **App**: https://squaredapp.vercel.app
- **Vercel project**: squared-app (account: akankshalanghani13-5125, team `aakanksha13`)
- **Supabase project**: `squared-93fad`... *(actually project ref is `iiznpmwcokjacknzygog` — log in at supabase.com to manage)*

## Environment variables (in `.env.local`, not committed to git)
```
VITE_SUPABASE_URL=https://iiznpmwcokjacknzygog.supabase.co
VITE_SUPABASE_ANON_KEY=<see your password manager / Vercel project settings — not stored in this repo>
```
This is the Supabase **anon/public** key — safe to expose client-side (that's how Supabase is designed), but the database currently has fully open read/write rules, so don't publicize the repo without tightening security rules first (see below).

These same two vars are already set in Vercel's project settings (Production environment), so deployments work without needing this file. You only need `.env.local` for running it on a new laptop.

## Supabase database setup
Table: `groups` (already created). If you ever need to recreate it, run this in Supabase SQL Editor:
```sql
create table groups (
  id text primary key,
  name text not null,
  created_at bigint,
  join_code text unique,
  members jsonb not null default '[]',
  expenses jsonb not null default '[]',
  settlements jsonb not null default '[]'
);

alter table groups enable row level security;

create policy "public read" on groups for select using (true);
create policy "public insert" on groups for insert with check (true);
create policy "public update" on groups for update using (true);
```
⚠️ These policies are wide open (anyone with the anon key can read/write any group). Fine for a trusted ~30-person test. Tighten before a public launch.

## Running locally on a new machine
```bash
npm install
npm run dev
```
Then create `.env.local` in the project root with the two Supabase vars above (this file isn't in git).

## Deploying changes
```bash
npx vercel --prod
```
(First time on a new machine: `npx vercel login`, then `npx vercel link --yes --project squared-app` to reconnect to the existing project.)

## Branding
- Name: **Squared**
- Colors: `--ink: #202020` (near-black), `--accent: #c9f158` (lime), `--surface: #f2f3f5` (light gray)
- Font: Space Grotesk
- Logo: `public/logo.png` — a glossy 3D two-overlapping-squares icon (custom generated, already wired into landing page, sign-up, favicon, and shared receipts)

## Known limitations / next steps
- **Open security rules** on Supabase — anyone with the anon key can read/write any group's data. Fine for a private 30-person test; needs real rules (e.g. scoped by join code or device auth) before wider release.
- **No real auth** — identity is just a random ID stored in the browser's localStorage per device. Clearing browser data loses your identity in existing groups (not the group data itself, which lives in Supabase).
- **PWA/installable** on mobile (manifest + icons set up) but not published to App Store/Play Store — it's a web app installed via "Add to Home Screen."
- Marketing: working on an Instagram hard-launch teaser strategy (guess-the-app style story).

## Key fixes worth knowing about
- Fixed a crash in `CreateGroup.jsx` where `creating` state was referenced before declaration (caused "can't create group" bug in production).
- Removed `AnimatePresence mode="wait"` in `App.jsx` — it could permanently freeze screen transitions if an exit animation didn't fire (e.g. reduced-motion settings, backgrounded tabs).
