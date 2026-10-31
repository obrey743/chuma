import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export const asyncHandler = (fn: RequestHandler): RequestHandler => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const notFound: RequestHandler = (req, _res, next) => next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} was not found`));
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return void res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.flatten() } });
  const status = error.statusCode ?? 500;
  const message = status >= 500 && !error.code ? 'Internal server error' : error.message;
  res.status(status).json({ error: { code: error.code ?? 'INTERNAL_ERROR', message, ...(error.details ? { details: error.details } : {}) } });
};
