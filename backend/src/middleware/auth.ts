import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return next(new AppError(401, 'UNAUTHENTICATED', 'A bearer token is required'));
  try { req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string; email: string }; next(); }
  catch { next(new AppError(401, 'INVALID_TOKEN', 'The access token is invalid or expired')); }
};
