# Domain Entities - UOW-1 Experience and Orchestration

## Entity: Run
### Description
Top-level lifecycle container for a generation execution.

### Key Attributes
- `runId`
- `currentRunState`
- `currentStageId`
- `createdAt`
- `updatedAt`
- `effectiveProfileRef`
- `resumeEligibility`

## Entity: StageExecution
### Description
Represents orchestration state and outcomes for one stage in a run.

### Key Attributes
- `runId`
- `stageId`
- `stageSubState`
- `attemptCount`
- `startedAt`
- `completedAt`
- `resultRef`
- `failureRef`

## Entity: CommandIntent
### Description
Canonicalized command request entering orchestration.

### Key Attributes
- `commandType` (`start`, `resume`, `retry`, `status`, `inspect`)
- `commandPayload`
- `idempotencyKey`
- `requestedAt`

## Entity: EffectiveConfiguration
### Description
Resolved immutable baseline profile plus validated override overlay.

### Key Attributes
- `baselineProfileRef`
- `overridePatchRef`
- `effectiveConfigHash`
- `mergeProvenance`

## Entity: RetryDecision
### Description
Outcome of retry-policy evaluation for a failed stage.

### Key Attributes
- `decisionType` (`RetryNow`, `RetryAfterDelay`, `RetryExhausted`)
- `delayMs`
- `reasonCode`
- `severity`

## Entity: Checkpoint
### Description
Resumption-safe snapshot emitted at stage start/complete boundaries.

### Key Attributes
- `checkpointId`
- `runId`
- `stageId`
- `checkpointType` (`StageStart`, `StageComplete`)
- `stateSnapshotRef`
- `artifactRefs`
- `createdAt`

## Entity: ProgressEvent
### Description
Business-facing progress signal for timeline and diagnostics.

### Key Attributes
- `runId`
- `stageId`
- `eventType`
- `eventTimestamp`
- `reasonCode`
- `recommendedAction`

## Entity: OrchestrationError
### Description
Domain-specific error object with retryability and severity semantics.

### Key Attributes
- `errorId`
- `category` (`Validation`, `Provider`, `Dependency`, `Persistence`, `Policy`)
- `retryability`
- `severity`
- `message`
- `contextRef`

## Entity: PartialSuccessMap
### Description
Structure capturing succeeded and invalidated outputs for resumable recovery.

### Key Attributes
- `runId`
- `successfulStages`
- `successfulPlatforms`
- `invalidatedStages`
- `resumeEntryPoints`

## Relationships
- A `Run` owns multiple `StageExecution` entities.
- A `Run` references one `EffectiveConfiguration`.
- A `StageExecution` may produce multiple `Checkpoint` entities.
- A `StageExecution` may reference zero or one `RetryDecision` per failed attempt.
- A `Run` emits many `ProgressEvent` records.
- A failed `StageExecution` references one `OrchestrationError`.
- A `Run` may maintain one evolving `PartialSuccessMap`.
