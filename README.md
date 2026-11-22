# Commonroom

A private relationship CRM for keeping track of B2B contacts, what they need, and useful introductions between them.

## Run locally

1. Install Node.js 20.9 or later and run `npm install`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` using the project URL and anon/publishable key from Supabase Project Settings → API. This ignored local file is ready to fill in; `.env.example` is only a safe template. Restart the dev server after changing env values.
3. Apply `supabase/migrations/20261122000000_initial_schema.sql` to your Supabase project (or run it with the Supabase CLI).
4. In Supabase Auth, enable email/password sign-in and configure the site URL and redirect URLs for your local and deployed app.
5. Start with `npm run dev`, then open `http://localhost:3000`.

Without Supabase environment variables, the app opens in a clearly labeled, read-only sample-data preview. No preview data is persisted.

## Before deploying to GitHub and Vercel

1. Create a Supabase project and run the SQL migration above before deploying.
2. In Supabase Auth URL Configuration, set the Site URL to your Vercel URL and add `http://localhost:3000/**` plus your Vercel/custom-domain URL patterns to the Redirect URLs list.
3. Push the app, `supabase/` migration, and `.env.example` to GitHub. Keep `.env.local` and all real credentials out of Git; `.gitignore` already excludes local env files.
4. Import the GitHub repository into Vercel. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project’s Environment Variables for the environments you use, then redeploy.
5. Use only the anon/publishable key in these variables. Never add a Supabase service-role/secret key to `NEXT_PUBLIC_*`, the browser, or GitHub.
6. After deployment, test signup, email confirmation, sign-in, creating a contact/requirement, and signing out on the deployed URL.

## Security notes

- The browser and server use only the Supabase anon/publishable key. Never add a service-role key to client code or `NEXT_PUBLIC_*` environment variables.
- The SQL migration enables RLS on every table, scopes policies to `auth.uid()`, and uses composite foreign keys to prevent cross-user contact/requirement links.
- Authenticated routes refresh and verify the Supabase user in middleware. Server actions also verify the user; database authorization remains enforced by RLS.
- Contact and requirement archival is implemented as a soft archive.

## Commands

- `npm run dev` — local development
- `npm run lint` — ESLint
- `npm run build` — production build
