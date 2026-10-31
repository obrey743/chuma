import type { RequestHandler } from 'express';
import { requirePrisma } from '../config/prisma.js';
import { AppError, asyncHandler } from '../utils/errors.js';
export const requireMembership = (...roles: string[]): RequestHandler => asyncHandler(async (req, _res, next) => {
  const communityId = req.params.id ?? req.params.communityId;
  const membership = await requirePrisma().communityMembership.findUnique({ where: { communityId_userId: { communityId, userId: req.user!.id } } });
  if (!membership || membership.status !== 'ACTIVE') throw new AppError(403, 'COMMUNITY_ACCESS_DENIED', 'Active community membership is required');
  if (roles.length && !roles.includes(membership.role)) throw new AppError(403, 'INSUFFICIENT_ROLE', 'Your community role does not permit this action');
  req.membership = membership; next();
});
