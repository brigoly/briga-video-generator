# Contract Test Instructions

## Purpose
Validate API contracts across orchestration, packaging, and platform foundation units.

## Contract Scope
- POST /v1/runs/:commandType
- GET /v1/runs/:runId/status
- GET /v1/runs/:runId/inspect
- POST /packages/build
- POST /packages/build-multi
- POST /foundation/artifacts
- GET /foundation/runs/:runId/manifest
- POST /foundation/runs/:runId/telemetry
- GET /foundation/runs/:runId/telemetry-summary
- POST /foundation/runs/:runId/retry-decision
- POST /foundation/runs/:runId/resume-plan
- POST /foundation/runs/compare
- Error payload shape and status code guarantees

## Contract Test Strategy
1. Schema-assert success payloads for accepted and replayed responses.
2. Schema-assert error payloads for validation, auth, and not-found paths.
3. Verify compatibility of command envelope fields, packaging payloads, and manifest/telemetry contracts.

## Execution
```bash
npm test
```

## Validation Checklist
- Required fields remain stable across responses.
- Backward compatibility maintained for existing consumer expectations.
- Error codes map to documented API contract.
