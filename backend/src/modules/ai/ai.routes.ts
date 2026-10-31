import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../utils/errors.js';
import { MockAiProvider } from './providers/mock-ai.provider.js';
import * as gemma from './gemma.service.js';

export const aiRouter = Router();
aiRouter.use(authenticate);

// ---------- Gemma 4 endpoints used by the AI Planner page ----------

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadImage: import('express').RequestHandler = (req, res, next) =>
  upload.single('image')(req, res, (err) => next(err ? new AppError(400, 'INVALID_UPLOAD', err.message) : undefined));

aiRouter.post('/analyze-product', uploadImage, asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'IMAGE_REQUIRED', 'Upload an image in the "image" field');
  if (!IMAGE_TYPES.includes(req.file.mimetype)) throw new AppError(400, 'INVALID_IMAGE', 'Image must be JPEG, PNG or WEBP');
  try {
    res.json({ data: await gemma.analyzeProduct(req.file.buffer, req.file.mimetype) });
  } catch (err) {
    console.error('[ai] analyze-product failed:', (err as Error).message);
    throw new AppError(502, 'AI_UNAVAILABLE', 'Could not analyse the image. Please try again or enter the product details manually.');
  }
}));

const planSchema = z.object({
  product_name: z.string().max(120).default('this product'),
  target_price: z.coerce.number().positive(),
  duration_weeks: z.coerce.number().int().min(1).max(260).nullish().transform((v) => v ?? null),
  weekly_budget: z.coerce.number().positive().nullish().transform((v) => v ?? null),
  saved_amount: z.coerce.number().min(0).default(0),
  currency: z.string().length(3).default('ZMW'),
}).refine((x) => x.duration_weeks || x.weekly_budget, { message: 'Provide duration_weeks or weekly_budget' });

aiRouter.post('/recommend-plan', asyncHandler(async (req, res) => {
  res.json({ data: await gemma.recommendPlan(planSchema.parse(req.body)) });
}));

// ---------- Original provider endpoints (kept for the finance API contract) ----------

const ai = new MockAiProvider();
aiRouter.post('/products/analyse', asyncHandler(async (req, res) => {
  const input = z.object({ imageUrl: z.url().optional(), description: z.string().optional() }).refine((x) => x.imageUrl || x.description).parse(req.body);
  res.json({ data: await ai.analyseProduct(input) });
}));
aiRouter.post('/savings-plan', asyncHandler(async (req, res) => {
  const input = z.object({ targetAmount: z.string(), currentAmount: z.string(), targetDate: z.string().optional(), currency: z.string().default('ZMW') }).parse(req.body);
  res.json({ data: await ai.explainSavingsPlan(input) });
}));
