# Backend setup

Requires Node.js 20+ and PostgreSQL (Neon supported). Copy `.env.example` to `.env`; generate a unique 32+ character access secret and refresh secret. Install packages with `npm install`, generate Prisma Client with `npm run db:generate`, and start with `npm run dev`.

No migration is committed before a real PostgreSQL development database is available. Create the initial migration with `npm run db:migrate -- --name init`. Never point `prisma migrate dev` at production.
