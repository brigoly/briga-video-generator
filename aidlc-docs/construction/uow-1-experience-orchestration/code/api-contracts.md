# API Contracts - UOW-1

## Authentication
- Bearer token required for all endpoints.

## Endpoints

### POST /v1/runs/:commandType
- Supported commandType values: start, resume, retry, status, inspect.
- Headers:
  - Authorization: Bearer <token>
  - x-idempotency-key: <string>
- Body:
  - runId (required for resume/retry/status/inspect)
  - payload (object)
- Response:
  - 202 for accepted new command
  - 200 for idempotent replay response

### GET /v1/runs/:runId/status
- Returns current run-state view.
- 404 if run does not exist.

### GET /v1/runs/:runId/inspect
- Returns detailed run inspection payload.
- 404 if run does not exist.

## Error Contract
- Domain errors:
  - CMD_VALIDATION_FAILED
  - CMD_RUN_ID_REQUIRED
  - RUN_ILLEGAL_TRANSITION
  - AUTH_UNAUTHORIZED
  - AUTH_FORBIDDEN
- Shape:
  {
    "code": "<ERROR_CODE>",
    "message": "<human-readable>"
  }
