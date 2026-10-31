# Payment integration

`PaymentProvider` defines checkout creation, status retrieval, verification, webhook processing, and reconciliation. `mock` returns responses marked `simulated: true`. Financial confirmation uses unique payment/idempotency references and an atomic journal posting.

The DevDraft adapter intentionally returns 501. Before enabling it, verify official base URL, authentication, request fields, status mapping, webhook signature algorithm, retries, and idempotency behavior. Required variables are `PAYMENT_PROVIDER`, `DEVDRAFT_API_KEY`, `DEVDRAFT_BASE_URL`, and `DEVDRAFT_WEBHOOK_SECRET`.
