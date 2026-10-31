// Gemma 4 service (Developer 3).
// Gemma identifies products and explains plans. All savings maths happens in plain code here, never in the model.
import { env } from '../../config/env.js';

const API_BASE = env.GEMMA_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;

export const gemmaEnabled = () => env.AI_PROVIDER === 'gemma' && Boolean(env.GEMMA_API_KEY);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

async function callGemma(parts: Part[]): Promise<string> {
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    // Minimal thinking keeps responses around 1-3s and made the API far more reliable in testing
    generationConfig: { temperature: 0.2, thinkingConfig: { thinkingLevel: 'minimal' } },
  });

  let lastErr: Error = new Error('Gemma call failed');
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/${env.GEMMA_MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMMA_API_KEY ?? '' },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        lastErr = new Error(`Gemma API ${res.status}: ${(await res.text()).slice(0, 300)}`);
        // Bad request / bad key won't fix themselves. 404/429/5xx are often temporary on this API.
        if ([400, 401, 403].includes(res.status)) throw Object.assign(lastErr, { fatal: true });
      } else {
        const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
        // Skip Gemma 4 "thought" parts, we only want the final answer
        const text = (json.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
        if (text.trim()) return text;
        lastErr = new Error('Gemma returned an empty response');
      }
    } catch (err) {
      if ((err as { fatal?: boolean }).fatal) throw err;
      lastErr = err as Error;
    }
    if (attempt < MAX_ATTEMPTS) await sleep(500 * attempt);
  }
  throw lastErr;
}

// Gemma sometimes wraps JSON in ``` fences or adds text around it
export function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Gemma did not return JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const toPrice = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v.replace(/[^\d.]/g, '')) : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

// ---------- product recognition ----------

const MOCK_PRODUCT = {
  name: 'Solar Home Kit',
  category: 'Electronics',
  description: 'Solar lighting system with a panel, battery and three bulbs.',
  specifications: ['Solar panel', 'Battery', '3 bulbs'],
  detected_price: null,
};

function normalizeProduct(p: Record<string, unknown>) {
  const detected_price = toPrice(p.detected_price);
  return {
    name: String(p.name || 'Unknown product').slice(0, 120),
    category: String(p.category || 'Other').slice(0, 60),
    description: String(p.description || '').slice(0, 500),
    specifications: Array.isArray(p.specifications) ? p.specifications.map(String).slice(0, 10) : [],
    detected_price,
    price_confidence: detected_price ? 'visible_in_image' : 'none',
    requires_price_confirmation: true, // the member always confirms, the AI never sets the final price
  };
}

export async function analyzeProduct(buffer: Buffer, mimeType: string) {
  if (!gemmaEnabled()) return { ...normalizeProduct(MOCK_PRODUCT), is_mock: true };

  const prompt = `You are helping members of a Zambian village banking group identify products they want to save for.
Look at the image and identify the product (or the item on the quotation/receipt).
Reply with ONLY a JSON object, no other text:
{"name": string, "category": string, "description": string (one sentence), "specifications": string[] (max 6), "detected_price": number | null}
Rules:
- detected_price must be a number ONLY if a price is clearly printed in the image (e.g. price tag, quotation). Otherwise null.
- NEVER guess or estimate a price.
- If you cannot identify a product, use "Unknown product".`;

  const text = await callGemma([{ text: prompt }, { inline_data: { mime_type: mimeType, data: buffer.toString('base64') } }]);
  return { ...normalizeProduct(parseJson(text)), is_mock: false };
}

// ---------- savings plan ----------

type PlanInput = { target_price: number; duration_weeks: number | null; weekly_budget: number | null; saved_amount: number };

// The real calculation. No AI involved.
export function calculatePlan({ target_price, duration_weeks, weekly_budget, saved_amount }: PlanInput) {
  const remaining = Math.max(0, target_price - saved_amount);
  const plan = {
    target_price,
    saved_amount,
    remaining_amount: remaining,
    duration_weeks,
    weekly_amount: null as number | null,
    monthly_amount: null as number | null,
    weekly_budget,
    weeks_required: null as number | null,
    fits_budget: null as boolean | null,
    options: [] as { label: string; weekly: number; weeks: number }[],
  };

  if (duration_weeks) {
    plan.weekly_amount = Math.ceil(remaining / duration_weeks);
    plan.monthly_amount = Math.ceil((remaining / duration_weeks) * (52 / 12));
    plan.options.push({ label: `Finish in ${duration_weeks} weeks`, weekly: plan.weekly_amount, weeks: duration_weeks });
  }
  if (weekly_budget) {
    plan.weeks_required = Math.ceil(remaining / weekly_budget);
    plan.options.push({ label: 'Your weekly budget', weekly: weekly_budget, weeks: plan.weeks_required });
    if (duration_weeks) plan.fits_budget = weekly_budget >= (plan.weekly_amount ?? 0);
  }
  for (const weeks of [8, 12, 26]) {
    if (weeks !== duration_weeks && weeks !== plan.weeks_required && remaining > 0) {
      plan.options.push({ label: `${weeks} weeks`, weekly: Math.ceil(remaining / weeks), weeks });
    }
  }
  return plan;
}

function templateExplanation(productName: string, plan: ReturnType<typeof calculatePlan>, currency: string) {
  const k = (n: number) => `${currency} ${n.toLocaleString()}`;
  let s = `To save ${k(plan.remaining_amount)} for the ${productName}`;
  if (plan.weekly_amount) s += `, you need ${k(plan.weekly_amount)} per week for ${plan.duration_weeks} weeks (about ${k(plan.monthly_amount ?? 0)} per month)`;
  s += '.';
  if (plan.weeks_required && plan.weekly_budget) {
    s += ` At your budget of ${k(plan.weekly_budget)} per week it will take ${plan.weeks_required} weeks.`;
    if (plan.fits_budget === false) s += ' Consider a longer timeline or a slightly higher weekly contribution.';
  }
  return s;
}

export async function recommendPlan(input: PlanInput & { product_name: string; currency: string }) {
  const plan = calculatePlan(input);
  let explanation = templateExplanation(input.product_name, plan, input.currency);
  let is_mock = true;

  if (gemmaEnabled()) {
    try {
      const prompt = `You are a friendly savings advisor for a Zambian village banking group.
Explain this savings plan to a member in 2-3 short, simple sentences. Use ONLY the numbers given, do not calculate new ones.
Product: ${input.product_name}
Currency: ${input.currency}
Plan: ${JSON.stringify(plan)}
Reply with ONLY JSON: {"explanation": string}`;
      const out = parseJson(await callGemma([{ text: prompt }]));
      if (out.explanation) {
        explanation = String(out.explanation).slice(0, 800);
        is_mock = false;
      }
    } catch (err) {
      console.warn('[gemma] explanation failed, using template:', (err as Error).message);
    }
  }

  return { product_name: input.product_name, currency: input.currency, ...plan, explanation, is_mock };
}
