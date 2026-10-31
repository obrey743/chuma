import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-access-secret-change-me-now'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-refresh-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'), JWT_REFRESH_TTL: z.string().default('7d'),
  PAYMENT_PROVIDER: z.enum(['mock', 'devdraft']).default('mock'),
  DEVDRAFT_API_KEY: z.string().optional(), DEVDRAFT_BASE_URL: z.string().url().optional(),
  DEVDRAFT_WEBHOOK_SECRET: z.string().optional(), AI_PROVIDER: z.enum(['mock', 'gemma']).default('mock'),
  GEMMA_BASE_URL: z.string().url().optional(), GEMMA_API_KEY: z.string().optional(),
  GEMMA_MODEL: z.string().default('gemma-4-26b-a4b-it'),
  // Demo login with sample data and no database. Set to false when the app goes live.
  DEMO_MODE: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});
// Treat empty values in .env (e.g. "GEMMA_BASE_URL=") as not set, otherwise the url() checks fail on startup
const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
export const env = schema.parse(raw);
export const databaseConfigured = Boolean(env.DATABASE_URL);
