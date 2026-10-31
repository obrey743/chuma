// AI controller — Developer 3
const gemma = require('../services/gemma.service');

const ok = (res, data, message) => res.json({ success: true, data, message });
const fail = (res, status, message) => res.status(status).json({ success: false, data: null, message });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function analyzeProduct(req, res) {
  if (!req.file) return fail(res, 400, 'Upload an image in the "image" field');
  if (!ALLOWED_TYPES.includes(req.file.mimetype)) return fail(res, 400, 'Image must be JPEG, PNG or WEBP');

  try {
    const data = await gemma.analyzeProduct(req.file.buffer, req.file.mimetype);
    const message = data.detected_price
      ? 'Product analysed. Please confirm the detected price.'
      : 'Product analysed. No price found — please enter the price.';
    return ok(res, data, message);
  } catch (err) {
    console.error('[ai] analyze-product failed:', err.message);
    return fail(res, 502, 'Could not analyse the image. Please try again or enter the product details manually.');
  }
}

async function recommendPlan(req, res) {
  const b = req.body || {};
  const target_price = Number(b.target_price);
  const duration_weeks = b.duration_weeks != null ? Number(b.duration_weeks) : null;
  const weekly_budget = b.weekly_budget != null ? Number(b.weekly_budget) : null;
  const saved_amount = b.saved_amount != null ? Number(b.saved_amount) : 0;

  if (!Number.isFinite(target_price) || target_price <= 0) return fail(res, 400, 'target_price must be a positive number');
  if (!duration_weeks && !weekly_budget) return fail(res, 400, 'Provide duration_weeks or weekly_budget');
  if (duration_weeks != null && (!Number.isInteger(duration_weeks) || duration_weeks < 1 || duration_weeks > 260))
    return fail(res, 400, 'duration_weeks must be a whole number between 1 and 260');
  if (weekly_budget != null && (!Number.isFinite(weekly_budget) || weekly_budget <= 0))
    return fail(res, 400, 'weekly_budget must be a positive number');
  if (!Number.isFinite(saved_amount) || saved_amount < 0) return fail(res, 400, 'saved_amount must be 0 or more');

  try {
    const data = await gemma.recommendPlan({
      product_name: String(b.product_name || 'this product').slice(0, 120),
      target_price,
      duration_weeks,
      weekly_budget,
      saved_amount,
      currency: b.currency || 'ZMW',
    });
    return ok(res, data, 'Plan generated');
  } catch (err) {
    console.error('[ai] recommend-plan failed:', err.message);
    return fail(res, 500, 'Could not generate a savings plan');
  }
}

module.exports = { analyzeProduct, recommendPlan };
