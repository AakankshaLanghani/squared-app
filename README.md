# Squared

**Split bills, not friendships.**

Squared is a mobile-friendly web app for splitting shared expenses with friends, roommates, or family — dinners, trips, rent, cab rides. Add an expense, split it equally, by custom amounts, or item-by-item, and Squared works out exactly who owes who. Settle up in one tap, and share a receipt or balance summary with a link.

Live app: **https://squaredapp.vercel.app**

## Features

- Sign up with just a name and phone number — no password
- Create a group and invite friends with a shareable join code; they join from their own device and see the same live-synced data
- Add expenses with three split modes:
  - **Equal** — split evenly among selected members
  - **Custom** — set a specific amount per person
  - **By item** — assign individual line items to people, with tax split proportionally
- Automatic simplified "who owes whom" calculation
- One-tap settle up
- Share a generated receipt image or balance summary via the native share sheet
- Persistent shareable links to a single expense or a group's full balance summary — viewable without signing in
- Installable as a PWA (add to home screen)
- Dark mode (follows system setting)

## Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) for animation and page transitions
- [Supabase](https://supabase.com/) (Postgres + Realtime) as the backend
- [Vercel](https://vercel.com/) for hosting

## Getting started

```bash
npm install
```

Create a `.env.local` file in the project root with your Supabase project credentials:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Then create a `groups` table in your Supabase project via the SQL Editor:

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

> These policies are fully open (anyone with the anon key can read/write any group). That's fine for a small trusted group testing the app, but should be tightened before any public/production use.

Run the dev server:

```bash
npm run dev
```

## Deploying

```bash
npx vercel --prod
```

Add the two environment variables above to your Vercel project (Settings → Environment Variables → Production) so the deployed build can connect to Supabase.

## Project structure

```
src/
  App.jsx           screen router, onboarding tour, share-link entry point
  store.jsx          Supabase-backed data layer, balance calculations
  supabase.js        Supabase client setup
  screens/           Landing, SignUp, Home, Groups, GroupDetail,
                      CreateGroup, AddExpense, JoinGroup, Profile, ShareView
  components/        BottomNav, TopBar, Tour, LoadingScreen, icons
  utils/receipt.js   receipt image generation, share/copy-link helpers
public/
  logo.png           app icon
```

## Known limitations

- No real authentication — identity is a random ID stored locally per device. Clearing browser data loses that device's link to its groups (the group data itself stays safe on the server; rejoin with the group's join code).
- Database security rules are currently open by design for ease of early testing — tighten before a wider public launch.
- Not published to the App Store / Play Store; distributed as an installable web app (PWA).
