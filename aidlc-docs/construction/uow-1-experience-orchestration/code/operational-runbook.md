# Operational Runbook Stub - UOW-1

## Common Scenarios

## 1. Unauthorized Requests
- Symptom: API returns AUTH_UNAUTHORIZED.
- Actions:
  - Verify Authorization bearer token value.
  - Confirm ORCH_BEARER_TOKEN environment variable.

## 2. Command Validation Failures
- Symptom: CMD_VALIDATION_FAILED or CMD_RUN_ID_REQUIRED.
- Actions:
  - Confirm commandType path parameter is valid.
  - Ensure runId is provided for resume/retry/status/inspect.

## 3. Illegal State Transition
- Symptom: RUN_ILLEGAL_TRANSITION.
- Actions:
  - Inspect current run state via status endpoint.
  - Verify command ordering and retry/resume logic.

## 4. Recovery Path
- For recoverable failures, prefer retry command with same runId and a new idempotency key.
- Confirm checkpoint write/read behavior in repository implementation.

## 5. Idempotency Replay Checks
- Submit identical command payload with same idempotency key.
- Expect 200 replay response with same runId.
