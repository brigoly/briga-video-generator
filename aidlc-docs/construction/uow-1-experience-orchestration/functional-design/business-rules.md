# Business Rules - UOW-1 Experience and Orchestration

## BR-1 Command Validation Gate
A command may enter orchestration only after schema validation, business-rule validation, and dependency readiness checks pass.

## BR-2 Strict Command Idempotency
Repeated equivalent run control commands (`start`, `resume`, `retry`, `status`, `inspect`) must yield deterministic equivalent outcomes and must not create duplicate lifecycle effects.

## BR-3 Lifecycle Transition Integrity
Run state transitions must follow allowed transition graph; illegal transitions are rejected with domain error codes.

## BR-4 Stage Sub-State Consistency
A stage sub-state change must always be accompanied by a corresponding run-level consistency check.

## BR-5 Retry Policy Precedence
On stage failure, retry policy is evaluated before terminal failure determination.

## BR-6 Recoverable Failure Contract
When retry is exhausted for a retryable stage, run transitions to `RecoverableFailed` and must expose at least one actionable recovery pathway (`resume` or `retry`).

## BR-7 Checkpoint Completeness
Every stage start and completion must produce checkpoints containing run ID, stage ID, state snapshot, and references needed for deterministic resume.

## BR-8 Resume Safety
Resume operation must revalidate checkpoint integrity before stage restart plan is executed.

## BR-9 Immutable Baseline Profiles
Run profiles are immutable at execution time; overrides are overlay-only and cannot mutate stored baseline profiles.

## BR-10 Override Auditability
Effective configuration must include baseline reference, override delta, and merge provenance metadata.

## BR-11 Progress Explanation Requirement
Progress output must include reason codes and recommended next actions for failed and recoverable states.

## BR-12 Partial-Success Preservation
Successful stage/platform outcomes must remain accessible even when later stages fail.

## BR-13 Error Taxonomy Enforcement
All orchestration failures must map to domain-specific error categories with retryability and severity metadata.

## BR-14 Terminal Failure Criteria
A run may transition to terminal failure only if a failure is non-retryable or retry-exhausted with no valid recovery policy path.

## BR-15 Deterministic Reproducibility
Given identical effective inputs and deterministic mode, orchestration decisions (state transitions and retry scheduling class) must be reproducible within defined tolerance.
