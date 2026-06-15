# Database migrations

Run SQL against the project's Supabase Postgres without leaving the terminal.

The connection string lives in `SUPABASE_DB_URL` inside `.env.local`
(gitignored — the password is never committed).

```bash
# run a .sql file
node scripts/migrate.mjs supabase-quotes.sql

# run inline SQL
node scripts/migrate.mjs -e "ALTER TABLE quotes ADD COLUMN notes TEXT;"
```

Existing schema files at the repo root:
- `supabase-schema.sql` — apartments, ski_passes, bookings, RLS
- `supabase-security-patch.sql` — RLS hardening
- `supabase-quotes.sql` — shareable quote links (`/q/<name>/<id>`)
