# Business Logic Summary - UOW-1

## Implemented Scope
- Command validation and normalization for start/resume/retry/status/inspect.
- Deterministic run-state transition guardrails.
- Idempotency resolver and replay decision flow.
- Retry decision policy with transient/non-transient handling.
- Orchestration service that persists run-state checkpoints and status updates.

## Primary Files
- src/uow-1-experience-orchestration/orchestration/commandValidator.ts
- src/uow-1-experience-orchestration/orchestration/stateMachine.ts
- src/uow-1-experience-orchestration/orchestration/idempotencyResolver.ts
- src/uow-1-experience-orchestration/orchestration/retryPolicy.ts
- src/uow-1-experience-orchestration/services/orchestrationService.ts

## Story Traceability
- S1 Topic Intake Command: command envelope, start command handling, state initialization.
- S12 Stage-Level Progress Visibility: run-state snapshots and status view model.
- S14 Repeatable Run Profiles: profile merge/hash support in profile service.

## NFR Traceability
- Idempotency and deterministic behavior for replay safety.
- State transition integrity checks.
- Checkpoint write path to support resume/recovery.
- Cache-ready status retrieval path for low-latency reads.
