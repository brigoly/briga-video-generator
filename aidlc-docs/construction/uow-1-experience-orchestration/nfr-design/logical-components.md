# Logical Components - UOW-1 NFR Design

## Scope
Logical decomposition of UOW-1 non-functional architecture, including responsibilities, interfaces, and interaction paths.

## Component Inventory

## 1. Command API Adapter
- Responsibility:
  - Accept CLI/API run-control commands and normalize into command envelope.
- Key Interfaces:
  - `submitCommand(commandEnvelope)`
  - `getRunStatus(runId)`
  - `inspectRun(runId)`
- NFR alignment:
  - PR-1, SC-1, SC-2.

## 2. Orchestration Application Service
- Responsibility:
  - Central coordinator for state transition decisions and command routing.
- Key Interfaces:
  - `handleStart`, `handleResume`, `handleRetry`, `handleStatus`, `handleInspect`
- NFR alignment:
  - AR-4, MQ-3, OO-4.

## 3. Idempotency Resolver
- Responsibility:
  - Resolve command replay protection and deterministic response reuse.
- Key Interfaces:
  - `resolve(idempotencyKey, commandSignature)`
  - `recordOutcome(idempotencyKey, outcomeRef)`
- NFR alignment:
  - AR-4, MQ-3.

## 4. Retry Policy Engine
- Responsibility:
  - Compute retry decisions from failure context and policy constraints.
- Key Interfaces:
  - `evaluateRetry(failureContext, stagePolicy)`
- NFR alignment:
  - AR-2, MQ-2.

## 5. Circuit Breaker Manager
- Responsibility:
  - Track health state of selected unstable upstream dependencies.
- Key Interfaces:
  - `beforeCall(dependencyClass)`
  - `recordSuccess/dependencyFailure(dependencyClass)`
- NFR alignment:
  - AR-1, AR-2.

## 6. Command Queue Gateway
- Responsibility:
  - Enqueue/dequeue orchestration work with backpressure and bounded TTL.
- Key Interfaces:
  - `enqueue(commandWorkItem, ttl)`
  - `claimNext(workerId)`
- NFR alignment:
  - SR-1, PR-3.

## 7. Worker Coordinator
- Responsibility:
  - Execute asynchronous orchestration transitions and stage actions.
- Key Interfaces:
  - `processWorkItem(workItem)`
  - `publishExecutionResult(resultEvent)`
- NFR alignment:
  - SR-3, PR-3.

## 8. Checkpoint Repository
- Responsibility:
  - Persist and retrieve stage boundary checkpoints through pluggable backend.
- Key Interfaces:
  - `writeCheckpoint(runId, stageId, snapshot)`
  - `readLatestCheckpoint(runId)`
- NFR alignment:
  - AR-3, FR-10/NFR-7.

## 9. Run State Store
- Responsibility:
  - Durable source of truth for run/stage status and transition history.
- Key Interfaces:
  - `updateRunState(runId, transition)`
  - `getRunState(runId)`
- NFR alignment:
  - PR-2, AR-4.

## 10. Status Cache
- Responsibility:
  - Accelerate high-frequency status and inspect reads.
- Key Interfaces:
  - `getStatus(runId)`
  - `putStatus(runId, snapshot, ttl)`
  - `invalidate(runId)`
- NFR alignment:
  - PR-1, PR-2.

## 11. AuthN/AuthZ Gateway
- Responsibility:
  - Apply hybrid identity checks and route claims to service-layer RBAC.
- Key Interfaces:
  - `authenticate(requestContext)`
  - `authorize(principal, action, runScope)`
- NFR alignment:
  - SC-1, SC-2.

## 12. Secret Provider Adapter
- Responsibility:
  - Retrieve and rotate provider credentials and signing material securely.
- Key Interfaces:
  - `resolveSecret(alias, versionHint)`
- NFR alignment:
  - SC-3, CC-3.

## 13. Telemetry Event Publisher
- Responsibility:
  - Emit structured logs/metrics/traces/audit events with reason codes.
- Key Interfaces:
  - `publishDomainEvent(event)`
  - `recordMetric(metric)`
  - `startTraceSpan(context)`
- NFR alignment:
  - OO-1, OO-2, OO-4.

## 14. Alert Rule Evaluator
- Responsibility:
  - Evaluate SLO windows and trigger warning/critical incidents.
- Key Interfaces:
  - `evaluateSloWindow(windowSlice)`
  - `triggerAlert(level, context)`
- NFR alignment:
  - OO-2.

## 15. Retention and Archive Manager
- Responsibility:
  - Apply 30-day hot and 180-day archive retention lifecycle policies.
- Key Interfaces:
  - `archiveExpiredHotData()`
  - `purgeExpiredArchiveData()`
- NFR alignment:
  - OO-3.

## Interaction Topology
1. Command API Adapter receives request and forwards to AuthN/AuthZ Gateway.
2. Orchestration Application Service calls Idempotency Resolver.
3. On new mutation, service enqueues work through Command Queue Gateway.
4. Worker Coordinator processes work, invoking Retry Policy Engine and Circuit Breaker Manager where needed.
5. Worker persists transitions in Run State Store and writes checkpoints through Checkpoint Repository.
6. Status Cache invalidation and refresh occur on transition events.
7. Telemetry Event Publisher emits structured observability signals; Alert Rule Evaluator acts on SLO breaches.
8. Retention and Archive Manager enforces lifecycle policies.

## Boundary Notes
- UOW-1 owns orchestration control-plane components.
- Artifact persistence, manifest indexing, and shared diagnostics interfaces remain integrated with UOW-5 contracts.
- External provider volatility is isolated behind adapters and policy engines.
