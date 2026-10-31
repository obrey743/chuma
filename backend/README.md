# Village Banking Backend

TypeScript/Express/PostgreSQL API for community savings, lending, products, and inventory.

## Run locally

1. Copy `.env.example` to `.env` and set secrets. The server can start without `DATABASE_URL`; health then reports database unavailable and database-backed endpoints return HTTP 503.
2. Run `npm install`, `npm run db:generate`, and `npm run dev`.
3. With a Neon PostgreSQL URL configured, run `npm run db:migrate -- --name init` and `npm run db:seed`.

API base: `http://localhost:4000/api/v1`. Health: `/api/v1/health`. Swagger UI: `/api/docs`.

Money is stored as PostgreSQL Decimal and calculated with decimal.js. Financial writes use Prisma transactions and idempotent journal references.
