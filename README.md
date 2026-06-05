# Warehouse Loading Manager

Mobile-first warehouse-side vehicle loading management for beverage wholesale orders.

## Stack

- Next.js App Router with JavaScript
- Tailwind CSS
- shadcn/ui-style components
- Supabase Auth and Postgres
- Vercel Hobby compatible

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   copy .env.example .env.local
   ```

3. Create a free Supabase project and add the URL plus publishable/anon key.

4. Run `supabase/schema.sql` in the Supabase SQL editor, then run `supabase/seed.sql`.

5. Start the app:

   ```bash
   npm run dev
   ```

## Notes

- Route locks are stored in `route_locks` and renewed by the route editor while the user is active.
- Dropped routes remain visible in history but do not count in active loading summaries.
- The default history retention setting is 7 days and can be changed in Settings.
