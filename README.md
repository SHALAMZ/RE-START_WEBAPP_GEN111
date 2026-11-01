# RE:START

RE:START is a React 19, TypeScript, and Vite application backed by Supabase PostgreSQL, Anonymous Auth, and Realtime. Public identities are pseudonymous profiles; anonymous authentication sessions are device/browser-specific.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project for hosted development, or Docker and the Supabase CLI for the local stack

## Local frontend setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the project URL and client key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

   The anon/publishable key is intended for browser use. **Never put a `service_role` or secret key in a `VITE_` variable or commit it to Git.**

3. In Supabase, enable **Anonymous Sign-Ins** under Authentication providers/settings. For local Supabase, anonymous sign-in is enabled in `supabase/config.toml`.

4. Start the frontend:

   ```sh
   npm run dev
   ```

The app validates missing or malformed Supabase configuration and displays authentication/data errors in the UI.

## Local Supabase and migrations

Install the Supabase CLI and Docker using the official [local development guide](https://supabase.com/docs/guides/local-development/cli/getting-started). From the repository root:

```sh
supabase start
supabase db reset
supabase status
```

`supabase db reset` creates a fresh local database and applies migrations in order. Copy the local API URL and anon key printed by `supabase status` into `.env.local`, then run `npm run dev`. The migration uses Supabase Auth and Realtime database objects and schedules cycle rollover with `pg_cron`; use the Supabase stack rather than plain PostgreSQL for a faithful local integration test.

Migrations are in `supabase/migrations/`:

1. `20261101120000_initial_schema.sql` — application schema, constraints, RLS, RPCs, and scheduled global-cycle rollover.
2. `20261101121000_private_realtime.sql` — participant-scoped Realtime Broadcast triggers and authorization policies.

For an existing hosted project, first verify that it is the intended target and that `pg_cron` is available/enabled. Then authenticate and link the CLI to that project before applying migrations:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Review the migration SQL and the linked project before running `db push`. Do not apply these migrations to a database containing data you need to preserve without first reviewing the effects. The cycle rollover deletes expired cycle-owned data by design; it does not delete Supabase Auth users.

## Development data

`src/lib/seedData.ts` contains fixtures for development/testing only. It is not automatically inserted into Supabase, and the application does not migrate old browser data into a database. Application data is fetched from Supabase; the browser's persisted Supabase Auth session is used only to preserve the device's anonymous login.

## Application behavior and security

- PostgreSQL RPCs derive ownership from `auth.uid()`; client-supplied owner IDs are not trusted.
- RLS scopes active-cycle data and private chats. Private owner columns and report records are not readable by ordinary clients.
- Reports are persisted and are not automatically moderated. The current report flow asks for a category and reason using browser prompts.
- The 48-hour cycle is shared and database-controlled. Identity reset creates a new pseudonymous profile without resetting the cycle or changing historical authorship.
- Anonymous identities are tied to the browser/device. They cannot be recovered on another device unless a future account-linking feature is added.
- Anonymous access can still be abused. Content bounds and Supabase Auth rate limits are present, but there is no CAPTCHA, application-level per-user post/message/report rate limiter, spam moderation queue, or admin dashboard.
- The current client loads the active-cycle board and chat histories without pagination. Monitor growth and Realtime usage before scaling.

## Checks

```sh
npm run build
npm run lint
```

The repository currently has no dedicated automated frontend test script. Browser journeys involving Auth, RLS, and Realtime must be tested against a running Supabase project/local stack with two separate browser sessions.

## Vercel

Import the GitHub repository into Vercel. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the project's environment-variable settings for each required deployment environment, then deploy the Vite build. The existing `vercel.json` rewrite sends application routes to `index.html` for React Router SPA navigation.

In Supabase Authentication URL configuration, set the production Site URL and allow the deployed Vercel URL (and any custom domain) as redirect URLs. Anonymous sign-in does not normally need an OAuth redirect. Never configure a service-role key in Vercel frontend variables.

## Free-tier limits

As listed on the providers' pricing pages when this document was updated, Supabase Free includes 500 MB database size, 50,000 monthly active users, 5 GB egress, 5 GB cached egress, 1 GB file storage, 2 million Realtime messages/month, and 200 peak concurrent Realtime connections. Free projects may pause after one week of inactivity and are limited to two active projects. Vercel Hobby currently includes 100 GB monthly fast data transfer and 1 million monthly CDN requests. Limits and eligibility can change; confirm the current terms before launch:

- [Supabase pricing](https://supabase.com/pricing)
- [Vercel pricing](https://vercel.com/pricing)

These are quotas, not an availability or backup guarantee. The application stores text/chat/report data in PostgreSQL and does not currently use Supabase Storage. A free-tier project may pause, hit a quota, or be abused; plan monitoring, backups, moderation, and recovery accordingly.
