# API contract

Base URL: `/api/v1`. JSON responses use `{ "data": ... }`; failures use `{ "error": { "code": string, "message": string, "details"?: object } }`. Protected endpoints require `Authorization: Bearer <accessToken>`. Monetary values in responses should be treated as decimal strings. Collection pagination is not yet implemented.

## Endpoints

- `GET /health` — application/database status (200 when DB connected, otherwise 503 while application remains live)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET|PATCH /auth/me`
- `POST|GET /communities`, `GET|PATCH /communities/:id`, `GET|POST /communities/:id/members`, `PATCH /communities/:id/members/:memberId`, `GET /communities/:id/dashboard`
- `POST|GET /communities/:communityId/contributions`, `POST /communities/:communityId/contributions/:contributionId/mock-confirm`
- `POST /communities/:communityId/loan-products`, `POST|GET /communities/:communityId/loans`, `POST /communities/:communityId/loans/:loanId/decision|disburse|repayments`
- `POST|GET /communities/:communityId/products`, `GET /communities/:communityId/products/:productId/availability`
- `POST /communities/:communityId/inventory/movements`, `GET /communities/:communityId/inventory`
- `POST /communities/:communityId/payments/checkout`
- `POST /ai/products/analyse`, `POST /ai/savings-plan`

Roles are `ADMIN`, `TREASURER`, and `MEMBER`. Community membership is checked against the community path parameter on every community-scoped endpoint.
