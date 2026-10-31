# Chuma

A community-powered financial platform where people organise themselves into village banking groups, contribute savings, borrow from their collective savings, and work towards purchasing products through structured savings plans.

## How it's put together

It's one app with two folders:

- `src/` is the React frontend (Vite, Tailwind, Recharts)
- `backend/` is the Express API in TypeScript, with PostgreSQL through Prisma. It handles login, communities, savings, loans, payments and the Gemma 4 AI.

In development, Vite runs the frontend on port 5173 and forwards every `/api` call to the backend on 4100. In production the backend serves the built frontend too, so the whole thing is a single server with a single URL.

## Running it locally

You need Node 20+ and a PostgreSQL database. A free one from neon.tech works fine.

No database yet? You can still run the app and click "Try the demo" on the login screen. It uses sample data for everything except the AI Planner, which still talks to Gemma. Set `DEMO_MODE=false` in `backend/.env` before going live.

```bash
npm install                          # installs the frontend and the backend
cp backend/env.template backend/.env
```

Then fill in `backend/.env`:

- `DATABASE_URL` is your Postgres connection string
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are any two random strings, 32+ characters each (`openssl rand -hex 32` makes one)
- `GEMMA_API_KEY` is your key from https://aistudio.google.com/apikey

Create the database tables once:

```bash
npm --prefix backend run db:push
```

Start everything:

```bash
npm run dev
```

Open http://localhost:5173 and sign up.

No Gemma key? Set `AI_PROVIDER=mock` in `backend/.env` and the AI Planner returns demo data.

## Useful commands

- `npm run dev` starts the frontend and backend together
- `npm run dev:web` / `npm run dev:api` start just one of them
- `npm run build` builds the frontend and generates the Prisma client
- `npm start` runs the production server (syncs the database tables first)
- `npm --prefix backend test` runs the backend tests

## AI (Gemma 4)

The AI code is in `backend/src/modules/ai/`. `gemma.service.ts` does the work and `ai.routes.ts` has the endpoints. Both endpoints need the user to be logged in.

- `POST /api/v1/ai/analyze-product` takes a photo (form field `image`, max 5MB) and returns the product name, category, specs and a price only if one is printed in the photo.
- `POST /api/v1/ai/recommend-plan` takes `target_price` plus `duration_weeks` and/or `weekly_budget`, and returns the weekly amount, weeks needed, a few options and a short explanation from Gemma.

The savings numbers are calculated in code. Gemma only identifies the product and explains the plan, and it never guesses prices.

## Deploying on Render

Create one Web Service from this repo:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables: everything from `backend/.env` except `PORT`, with `NODE_ENV=production`

Render's free Postgres or Neon both work for `DATABASE_URL`.

## Things that aren't finished

- Payments are simulated. DevDraft returns "not configured" until the API handshake and webhook checks are done, and ZMW support still has to be confirmed with them. No real money moves.
- AI Planner savings goals are stored in the browser because the backend has no savings-goals endpoint yet.
- Some older screens still show demo numbers instead of real wallet balances.
- `npm --prefix backend run typecheck` reports type errors in the finance routes. The code runs fine with tsx, but they should be cleaned up.
- Any API keys shared in chat should be replaced before going live.
