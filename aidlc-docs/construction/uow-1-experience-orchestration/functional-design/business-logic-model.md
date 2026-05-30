# Business Logic Model - UOW-1 Experience and Orchestration

## Scope
This model defines technology-agnostic business logic for run lifecycle orchestration, command control semantics, and progress visibility.

## Core Workflow Model
1. Receive command intent (`start`, `resume`, `retry`, `status`, `inspect`)
2. Validate command payload, profile, and dependency readiness
3. Resolve idempotency outcome for command
4. Transition run lifecycle and stage sub-states
5. Emit orchestration events and progress view updates
6. Apply retry policy on failure and produce recoverable-failed decisions
7. Persist checkpoints at stage start and stage completion

## Lifecycle State Model
- Run-level states:
  - `Created`
  - `Validating`
  - `Running`
  - `Paused`
  - `RecoverableFailed`
  - `Completed`
  - `Cancelled`
- Stage-level sub-states:
  - `Pending`
  - `Ready`
  - `InProgress`
  - `Succeeded`
  - `FailedRetryable`
  - `FailedTerminal`
  - `SkippedByReuse`

## Command Orchestration Logic
- Strict idempotency applies to all run control commands.
- Repeated command invocations with equivalent input return deterministic equivalent outcomes.
- Mutating commands (`start`, `resume`, `retry`) must not duplicate run actions when replayed.
- Read commands (`status`, `inspect`) are side-effect free.

## Failure Decision Model
- On stage failure, orchestration executes retry policy.
- Retry policy result outcomes:
  - `RetryNow`
  - `RetryAfterDelay`
  - `RetryExhausted`
- If retries are exhausted, run transitions to `RecoverableFailed` with explicit recovery actions.

## Checkpoint Model
- Required checkpoint events:
  - Stage-start checkpoint
  - Stage-complete checkpoint
- Checkpoints include run state, stage sub-state, artifact references, and retry counters.
- Resume logic rehydrates the most recent valid checkpoint and recomputes invalidation scope.

## Profile and Override Model
- Profile baseline is immutable.
- Overrides apply as validated deep-merge overlays.
- Effective run configuration must be fully auditable and reproducible.

## Progress Visibility Model
- Progress view includes:
  - Stage timeline
  - Timestamps
  - Reason codes
  - Recommended next actions
- Progress updates reflect both run-level and stage-level state transitions.

## Partial-Success Model
- Success is tracked at stage level and platform level.
- Partial success produces resumable invalidation map indicating re-execution boundaries.
- Final summary distinguishes initial success paths from recovery paths.
