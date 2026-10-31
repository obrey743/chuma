# AI integration contract

The backend owns authoritative calculations and all financial writes. AI endpoints are authenticated and read/explain only.

`POST /api/v1/ai/products/analyse` accepts `{ "imageUrl"?: string, "description"?: string }`. `POST /api/v1/ai/savings-plan` accepts `{ "targetAmount": string, "currentAmount": string, "targetDate"?: ISO date, "currency"?: "ZMW" }`.

The current provider is explicitly simulated. Replace the provider behind `AiProvider`; do not modify ledger or savings services and do not let model output set balances.
