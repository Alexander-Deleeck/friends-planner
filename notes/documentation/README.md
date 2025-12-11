## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment

Copy `.env.example` to `.env.local` and adjust as needed:

- `DATABASE_PATH` points at the SQLite file (default `./data/planner.db`).
- `SESSION_SECRET` signs session cookies and auth tokens.
- `BASE_URL` is used for absolute links (e.g. magic links).

## Database & migrations

- Apply pending migrations: `npm run db:migrate`
- Show applied/pending without executing: `npm run db:migrate -- --status`
- Add new SQL files under `db/migrations/` with incremental numeric prefixes (e.g. `002_add_indexes.sql`).