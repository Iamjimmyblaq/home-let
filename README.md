# Home-Let Nigeria

A modern, full-featured real-estate marketplace built for the Nigerian market. Home-Let connects renters, buyers, landlords, and agents — with secure payments, KYC-verified agents, virtual tours, in-app messaging, and admin moderation tools.

## Live URLs

- **Production:** https://home-let.lovable.app
- **Preview:** https://id-preview--ea9d1c75-91c7-46be-a3b7-f6e12cce215e.lovable.app

## What it does

- **Property discovery** – Search and filter properties by type (Flats, Houses, Shortlets, Hotels, Land, Hostels), location, price, and amenities.
- **Agent & landlord profiles** – Dedicated dashboards for agents/landlords to list properties, manage inspections, reply to messages, and request listing boosts.
- **KYC verification** – Agents and landlords submit identity documents; admin approval unlocks listing and boosts.
- **Secure wallet & payments** – Paystack-powered deposits and wallet-based transactions; wallet debits for boosts happen only after admin approval.
- **Virtual tours** – Auto-generated cinematic Ken Burns tours from uploaded property photos.
- **Maps integration** – Google Maps / Google Earth embeds for precise property location.
- **Anti-fraud image screening** – Perceptual hashing blocks duplicate uploads; AI + web search flags images found elsewhere on the internet.
- **Admin moderation** – Super admin can approve listings, manage users, suspend/delete accounts, and promote featured/boosted properties.
- **Real-time messaging** – Users and agents can chat inside the platform.
- **SEO-ready** – Per-route metadata, JSON-LD structured data, generated sitemap, and `llms.txt`.

## Tech stack

- **Frontend:** React 18, TypeScript 5, Vite 5, Tailwind CSS v3, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — Postgres, Auth, Storage, Edge Functions, Realtime
- **Payments:** Paystack
- **Maps:** Google Maps Embed / Google Earth
- **AI / search:** Gemini vision, Firecrawl reverse image search
- **Email:** Zoho Mail (`hello@home-let.com`, `support@home-let.com`)

## Project structure

```text
src/
  components/        # Reusable UI components
  contexts/            # React context providers (auth, etc.)
  data/                # Static data (Nigerian states, seed data)
  hooks/               # Custom React hooks (listings, wallet, favorites, etc.)
  integrations/        # Supabase client, Lovable helpers
  lib/                 # Utility functions
  pages/               # Route-level page components
  test/                # Vitest test setup
supabase/
  functions/           # Supabase Edge Functions
public/                # Static assets, sitemap, robots, llms.txt
```

## Getting started locally

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Environment variables**

   Copy `.env` and fill in the required values:

   ```bash
   cp .env .env.local
   ```

   Required variables include:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

4. **Run the dev server**

   ```bash
   bun run dev
   ```

5. **Run tests**

   ```bash
   bunx vitest run
   ```

## Key environment roles

- **Super admin:** `home-let@zohomail.com` — permanently assigned, cannot be changed via UI.
- **Admin / moderator:** Promoted only from the backend; no self-service signup path.
- **Agent / landlord:** Created during signup; KYC required before listing properties.
- **Regular user:** Can browse, book inspections, message agents, and manage favorites.

## Important notes

- This is a **client-side React application**. Backend logic lives in Lovable Cloud Edge Functions and Supabase policies.
- Do not add persistent server code (Node/Python/Ruby servers) to this repository.
- Row-Level Security (RLS) is enforced on all public tables; every new table must include `GRANT` statements and policies in its migration.
- User roles are stored in a separate `user_roles` table; never store roles on the `profiles` table.

## Deployment

The project is deployed through Lovable. Connect a GitHub repository via the Lovable editor to enable two-way sync, then publish from the Lovable dashboard.

## License

Copyright © Home-Let. All rights reserved.

## Deploying outside Lovable (Vercel, Netlify, any static host)

The app is a standard Vite SPA — nothing is tied to Lovable except the optional
hosted OAuth helper, which now falls back automatically to standard Supabase
OAuth on non-Lovable hosts.

### 1. Environment variables

Copy `.env.example` and set these in your host's project settings (they are
browser-safe; data is protected by Row Level Security):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Without them the app boots into a "Backend configuration missing" screen instead
of failing silently — that's the usual cause of a "shell only, no backend" deploy.

### 2. Build settings

`vercel.json` is included: framework `vite`, build `npm run build`, output `dist`,
plus SPA rewrites so deep links and refreshes work.

### 3. Auth redirect URLs

In the backend auth settings add your deployed origins to **Site URL** and
**Redirect URLs**:

- `https://your-app.vercel.app`
- `https://your-app.vercel.app/**`
- your custom domain (same two entries)

For Google sign-in also add `https://<project-ref>.supabase.co/auth/v1/callback`
as an authorized redirect URI in the Google Cloud OAuth client.

Missing entries are why Google sign-in and existing-account logins error out on
a fresh Vercel deployment.

### 4. Backend

Database, auth, storage and edge functions are hosted by the backend project and
are reachable from any origin — no extra deployment step is needed for them.
