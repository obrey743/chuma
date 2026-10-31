# AI module

This is the Gemma part of the backend. It does two things:

- looks at a product photo and tells you what the product is
- works out a savings plan for that product and explains it in simple words

It runs inside the same Express backend as everything else. It is not a separate server.

## Stack

- JavaScript (Node.js)
- Express 5
- Multer for image uploads
- Gemma 4 (gemma-4-26b-a4b-it) through the Google Gemini API
- dotenv and cors

There's no Google SDK. Gemma is called with plain fetch.

## Files

- `src/services/gemma.service.js` is the main file. It talks to Gemma, reads the response and does the savings calculations.
- `src/controllers/ai.controller.js` checks the request data and sends back the response.
- `src/routes/ai.routes.js` has the two endpoints and handles the image upload.
- `.env.example` shows the env variables you need.
- `src/ai-dev-server.js` is only for testing the AI on its own. We can delete it once app.js is ready.

The savings numbers are calculated in code, not by Gemma. Gemma only names the product and explains the plan. It won't guess a price. If there's no price in the photo, the user has to type one in.

## Running it

```bash
cd backend
npm install
cp .env.example .env
npm run dev:ai
```

Put your Gemma key in `.env` as `GEMMA_API_KEY`. You can get one at https://aistudio.google.com/apikey

If you don't have a key, set `AI_MOCK=true` and you'll get fake data back so you can keep working.

## Backend (Dev 2)

Add this to app.js:

```js
app.use('/api/ai', require('./routes/ai.routes'));
```

Please don't remove multer from package.json.

When a user saves a plan, the frontend will call `POST /api/savings-goals` with something like:

```json
{
  "member_id": 1,
  "product_name": "Hisense TV",
  "target_amount": 3500,
  "weekly_amount": 292,
  "duration_weeks": 12
}
```

If you need to recalculate the plan on your side, you can import `calculatePlan` from gemma.service.js. It doesn't call Gemma.

## Frontend (Dev 1)

### Analyse a photo

`POST /api/ai/analyze-product`

Send it as form data. The field name has to be `image` (jpg, png or webp, under 5MB).

```js
const form = new FormData();
form.append('image', file);
const res = await fetch(`${API_URL}/api/ai/analyze-product`, { method: 'POST', body: form });
```

You get back:

```json
{
  "success": true,
  "data": {
    "name": "Video game controller",
    "category": "Electronics",
    "description": "A wireless gaming controller with dual analog sticks.",
    "specifications": ["Wireless", "Dual analog sticks"],
    "detected_price": null,
    "price_confidence": "none",
    "requires_price_confirmation": true,
    "is_mock": false
  },
  "message": "Product analysed. No price found — please enter the price."
}
```

It can take up to 10 seconds, so show a loader.

If `detected_price` is null, ask the user to enter the price. If there is a price, put it in the input and let them confirm it.

### Get a savings plan

`POST /api/ai/recommend-plan`

Send JSON. You need `target_price` and at least one of `duration_weeks` or `weekly_budget`.

```json
{
  "product_name": "Hisense TV",
  "target_price": 3500,
  "duration_weeks": 12,
  "weekly_budget": 250,
  "saved_amount": 0,
  "currency": "ZMW"
}
```

You get back:

```json
{
  "success": true,
  "data": {
    "product_name": "Hisense TV",
    "currency": "ZMW",
    "target_price": 3500,
    "saved_amount": 0,
    "remaining_amount": 3500,
    "duration_weeks": 12,
    "weekly_amount": 292,
    "monthly_amount": 1264,
    "weekly_budget": 250,
    "weeks_required": 14,
    "fits_budget": false,
    "options": [
      { "label": "Finish in 12 weeks", "weekly": 292, "weeks": 12 },
      { "label": "Your weekly budget", "weekly": 250, "weeks": 14 },
      { "label": "8 weeks", "weekly": 438, "weeks": 8 },
      { "label": "26 weeks", "weekly": 135, "weeks": 26 }
    ],
    "explanation": "To get your Hisense TV costing 3500 ZMW, you can save 292 ZMW every week for 12 weeks...",
    "is_mock": false
  },
  "message": "Plan generated"
}
```

The main things to show are `explanation`, `weekly_amount` and `weeks_required`. If `fits_budget` is false, the user can't afford the plan on their budget, so it's worth showing a warning. `options` works well as cards the user can pick from.

### Errors

Errors always come back like this. Just show the `message`:

```json
{ "success": false, "data": null, "message": "Upload an image in the \"image\" field" }
```

### How the AI planner page should work

1. User uploads a photo and we call analyze-product
2. User confirms or types the price
3. User enters how many weeks or how much they can save per week, and we call recommend-plan
4. User picks an option and we save it with `POST /api/savings-goals`
