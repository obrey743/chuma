// Gemma AI service — Developer 3
// Gemma identifies products and explains plans. All money maths happens in plain JS here,
// never in the model.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 20000;

const useMock = () => process.env.AI_MOCK === 'true' || !process.env.GEMMA_API_KEY;

// ---------- low-level ----------

const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemma(parts) {
  const model = process.env.GEMMA_MODEL;
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      // Minimal thinking = ~1s responses and far fewer API errors in testing
      thinkingConfig: { thinkingLevel: 'minimal' },
    },
  });

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMMA_API_KEY },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        lastErr = new Error(`Gemma API ${res.status}: ${(await res.text()).slice(0, 300)}`);
        // 400/401/403 won't fix themselves — don't retry. 404/429/5xx are often transient.
        if ([400, 401, 403].includes(res.status)) throw lastErr;
      } else {
        const json = await res.json();
        // Skip Gemma 4 "thought" parts — we only want the final answer
        const text = (json.candidates?.[0]?.content?.parts || [])
          .filter((p) => !p.thought)
          .map((p) => p.text || '')
          .join('');
        if (text.trim()) return text;
        lastErr = new Error('Gemma returned an empty response');
      }
    } catch (err) {
      if (err === lastErr) throw err; // non-retryable status
      lastErr = err; // network error / timeout
    }
    if (attempt < MAX_ATTEMPTS) await sleep(500 * attempt);
  }
  throw lastErr;
}

// Gemma may wrap JSON in ``` fences or add prose around it — extract the first {...} block.
function parseJson(text) {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Gemma did not return JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const toPrice = (v) => {
  const n = typeof v === 'string' ? Number(v.replace(/[^\d.]/g, '')) : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

// ---------- product recognition ----------

const MOCK_PRODUCT = {
  name: 'Hisense 32" LED TV',
  category: 'Electronics',
  description: '32-inch HD LED television suitable for home use.',
  specifications: ['32 inch screen', 'HD 720p', '2x HDMI', 'USB'],
  detected_price: null,
};

function normalizeProduct(p) {
  const detected_price = toPrice(p.detected_price);
  return {
    name: String(p.name || 'Unknown product').slice(0, 120),
    category: String(p.category || 'Other').slice(0, 60),
    description: String(p.description || '').slice(0, 500),
    specifications: Array.isArray(p.specifications) ? p.specifications.map(String).slice(0, 10) : [],
    detected_price,
    price_confidence: detected_price ? 'visible_in_image' : 'none',
    requires_price_confirmation: true, // member always confirms; AI never sets the final price
  };
}

async function analyzeProduct(buffer, mimeType) {
  if (useMock()) return { ...normalizeProduct(MOCK_PRODUCT), is_mock: true };

  const prompt = `You are helping members of a Zambian village banking group identify products they want to save for.
Look at the image and identify the product (or the item on the quotation/receipt).
Reply with ONLY a JSON object, no other text:
{"name": string, "category": string, "description": string (one sentence), "specifications": string[] (max 6), "detected_price": number | null}
Rules:
- detected_price must be a number ONLY if a price is clearly printed in the image (e.g. price tag, quotation). Otherwise null.
- NEVER guess or estimate a price.
- If you cannot identify a product, use "Unknown product".`;

  const text = await callGemma([
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: buffer.toString('base64') } },
  ]);
  return { ...normalizeProduct(parseJson(text)), is_mock: false };
}

// ---------- savings plan ----------

// Authoritative calculation — deterministic, no AI.
function calculatePlan({ target_price, duration_weeks, weekly_budget, saved_amount = 0 }) {
  const remaining = Math.max(0, target_price - saved_amount);
  const plan = {
    target_price,
    saved_amount,
    remaining_amount: remaining,
    duration_weeks: duration_weeks || null,
    weekly_amount: null,
    monthly_amount: null,
    weekly_budget: weekly_budget || null,
    weeks_required: null,
    fits_budget: null,
    options: [],
  };

  if (duration_weeks) {
    plan.weekly_amount = Math.ceil(remaining / duration_weeks);
    plan.monthly_amount = Math.ceil((remaining / duration_weeks) * (52 / 12));
    plan.options.push({ label: `Finish in ${duration_weeks} weeks`, weekly: plan.weekly_amount, weeks: duration_weeks });
  }
  if (weekly_budget) {
    plan.weeks_required = Math.ceil(remaining / weekly_budget);
    plan.options.push({ label: 'Your weekly budget', weekly: weekly_budget, weeks: plan.weeks_required });
    if (duration_weeks) plan.fits_budget = weekly_budget >= plan.weekly_amount;
  }
  // Always give a couple of standard alternatives
  for (const weeks of [8, 12, 26]) {
    if (weeks !== duration_weeks && weeks !== plan.weeks_required && remaining > 0) {
      plan.options.push({ label: `${weeks} weeks`, weekly: Math.ceil(remaining / weeks), weeks });
    }
  }
  return plan;
}

function templateExplanation(productName, plan, currency) {
  const k = (n) => `${currency} ${n.toLocaleString()}`;
  const parts = [`To save ${k(plan.remaining_amount)} for the ${productName}`];
  if (plan.weekly_amount) parts.push(`you need ${k(plan.weekly_amount)} per week for ${plan.duration_weeks} weeks (about ${k(plan.monthly_amount)} per month)`);
  let s = parts.join(', ') + '.';
  if (plan.weeks_required) {
    s += ` At your budget of ${k(plan.weekly_budget)} per week it will take ${plan.weeks_required} weeks.`;
    if (plan.fits_budget === false) s += ' Consider a longer timeline or a slightly higher weekly contribution.';
  }
  return s;
}

async function recommendPlan({ product_name, target_price, duration_weeks, weekly_budget, saved_amount, currency }) {
  const plan = calculatePlan({ target_price, duration_weeks, weekly_budget, saved_amount });
  let explanation = templateExplanation(product_name, plan, currency);
  let is_mock = true;

  if (!useMock()) {
    try {
      const prompt = `You are a friendly savings advisor for a Zambian village banking group.
Explain this savings plan to a member in 2-3 short, simple sentences. Use ONLY the numbers given — do not calculate new ones.
Product: ${product_name}
Currency: ${currency}
Plan: ${JSON.stringify(plan)}
Reply with ONLY JSON: {"explanation": string}`;
      const out = parseJson(await callGemma([{ text: prompt }]));
      if (out.explanation) {
        explanation = String(out.explanation).slice(0, 800);
        is_mock = false;
      }
    } catch (err) {
      console.warn('[gemma] explanation failed, using template:', err.message);
    }
  }

  return { product_name, currency, ...plan, explanation, is_mock };
}

module.exports = { analyzeProduct, recommendPlan, calculatePlan, callGemma, parseJson };
