# API Layer Summary - UOW-1

## Implemented Scope
- Express REST handlers for:
  - POST /v1/runs/:commandType
  - GET /v1/runs/:runId/status
  - GET /v1/runs/:runId/inspect
- Bearer token auth middleware and run-scope authorization guard.
- Fast-ack command submission behavior using orchestration service.
- Structured error mapping for domain and unexpected errors.

## Primary Files
- src/uow-1-experience-orchestration/api/app.ts
- src/uow-1-experience-orchestration/api/auth.ts
- src/uow-1-experience-orchestration/api/server.ts

## Contract Notes
- Idempotency key supported via x-idempotency-key header.
- Start command accepts payload and creates new run ID.
- Resume/retry/status/inspect commands require runId.
- Status and inspect endpoints return run progress views.
