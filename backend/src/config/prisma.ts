import { PrismaClient } from '@prisma/client';
import { databaseConfigured } from './env.js';
export const prisma = databaseConfigured ? new PrismaClient() : null;
export function requirePrisma(): PrismaClient {
  if (!prisma) throw Object.assign(new Error('Database is not configured'), { statusCode: 503, code: 'DATABASE_UNAVAILABLE' });
  return prisma;
}
