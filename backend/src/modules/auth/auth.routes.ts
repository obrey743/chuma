import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import argon2 from 'argon2';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { requirePrisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../utils/errors.js';

export const authRouter = Router();
const credentialsLimit = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });
const registerSchema = z.object({ firstName: z.string().min(1).max(80), lastName: z.string().min(1).max(80), email: z.email(), phoneNumber: z.string().min(7).max(25), password: z.string().min(10).max(128) });
const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });
const updateSchema = z.object({ firstName: z.string().min(1).max(80).optional(), lastName: z.string().min(1).max(80).optional(), phoneNumber: z.string().min(7).max(25).optional() }).refine(v => Object.keys(v).length > 0);
const publicUser = { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, isActive: true, createdAt: true, updatedAt: true } as const;
function accessToken(user: { id: string; email: string }) { return jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'] }); }
async function issueTokens(user: { id: string; email: string }) {
  const raw = crypto.randomBytes(48).toString('base64url');
  await requirePrisma().refreshToken.create({ data: { userId: user.id, tokenHash: crypto.createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 7 * 86400_000) } });
  return { accessToken: accessToken(user), refreshToken: raw, tokenType: 'Bearer' };
}
authRouter.post('/register', credentialsLimit, asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body); const db = requirePrisma();
  const duplicate = await db.user.findFirst({ where: { OR: [{ email: input.email.toLowerCase() }, { phoneNumber: input.phoneNumber }] } });
  if (duplicate) throw new AppError(409, 'ACCOUNT_EXISTS', 'An account with that email or phone number already exists');
  const user = await db.user.create({ data: { ...input, email: input.email.toLowerCase(), passwordHash: await argon2.hash(input.password) }, select: publicUser });
  res.status(201).json({ data: { user, tokens: await issueTokens(user) } });
}));
// Demo login: no database needed. The token only unlocks the AI endpoints; the frontend serves everything else
// from sample data. Turned off with DEMO_MODE=false.
const DEMO_USER = { id: '00000000-0000-4000-8000-000000000001', firstName: 'Mwila', lastName: 'Banda', email: 'demo@chuma.app', phoneNumber: '+260970000000' };
authRouter.post('/demo', credentialsLimit, (_req, res, next) => {
  if (!env.DEMO_MODE) return next(new AppError(404, 'DEMO_DISABLED', 'Demo mode is turned off'));
  res.json({ data: { user: DEMO_USER, tokens: { accessToken: accessToken({ id: DEMO_USER.id, email: DEMO_USER.email }), tokenType: 'Bearer' }, demo: true } });
});

authRouter.post('/login', credentialsLimit, asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body); const user = await requirePrisma().user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, input.password))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  res.json({ data: { user: Object.fromEntries(Object.entries(user).filter(([k]) => k !== 'passwordHash')), tokens: await issueTokens(user) } });
}));
authRouter.post('/refresh', credentialsLimit, asyncHandler(async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(20) }).parse(req.body); const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = await requirePrisma().refreshToken.findUnique({ where: { tokenHash: hash }, include: { user: true } });
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || !stored.user.isActive) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  await requirePrisma().refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  res.json({ data: { tokens: await issueTokens(stored.user) } });
}));
authRouter.get('/me', authenticate, asyncHandler(async (req, res) => { const user = await requirePrisma().user.findUnique({ where: { id: req.user!.id }, select: publicUser }); res.json({ data: user }); }));
authRouter.patch('/me', authenticate, asyncHandler(async (req, res) => { const user = await requirePrisma().user.update({ where: { id: req.user!.id }, data: updateSchema.parse(req.body), select: publicUser }); res.json({ data: user }); }));
