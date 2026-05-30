# NFR Design Patterns - UOW-1 Experience and Orchestration

## Scope
This document converts approved UOW-1 NFR requirements into concrete non-functional design patterns for orchestration control paths.

## Pattern Catalog

## 1. Idempotent Command Processing Pattern
- Intent:
  - Ensure `start`, `resume`, `retry`, `status`, and `inspect` remain deterministic with no duplicate side effects.
- Design:
  - Command envelope carries idempotency key.
  - Idempotency resolver checks durable idempotency store before execution.
  - Replay returns previous canonical result for equivalent request.
- NFRs addressed:
  - PR-1, AR-4, MQ-3.

## 2. Retry with Exponential Backoff and Jitter Pattern
- Intent:
  - Provide resilient recovery for transient dependency/provider failures.
- Design:
  - Default policy: exponential backoff + jitter.
  - Per-stage configurable retry budget (default 3 attempts).
  - Policy result emits `RetryNow`, `RetryAfterDelay`, or `RetryExhausted`.
- NFRs addressed:
  - AR-2, AR-4, MQ-2.

## 3. Selective Circuit Breaker Pattern
- Intent:
  - Prevent cascading failures from unstable upstream providers.
- Design:
  - Apply circuit breakers only to high-failure integrations.
  - Half-open probes determine recovery readiness.
  - Orchestrator surfaces reason codes and recommended recovery actions.
- NFRs addressed:
  - AR-1, AR-2, OO-4.

## 4. Queue Backpressure plus Worker Autoscaling Pattern
- Intent:
  - Meet steady and burst load targets while preserving latency and reliability.
- Design:
  - Bounded queue with TTL-based admission control.
  - Horizontal worker autoscaling based on queue depth and processing lag.
  - Hybrid partitioning: run ID hash with stage-affinity override for hotspots.
- NFRs addressed:
  - SR-1, SR-3, PR-3.

## 5. Fast Acknowledge and Async Execution Pattern
- Intent:
  - Keep p95 command latency <= 500 ms.
- Design:
  - Command API performs validation/idempotency checks and fast acknowledgment.
  - Heavy orchestration transitions execute asynchronously through worker pipeline.
  - Status endpoint reflects accepted, queued, running, and terminal states.
- NFRs addressed:
  - PR-1, PR-2, PR-3.

## 6. Read-Through Status Cache with Event Invalidation Pattern
- Intent:
  - Optimize status and inspect read paths while preserving correctness.
- Design:
  - Short-lived read-through cache for run status snapshots.
  - State transition events invalidate affected cache keys.
  - Cache miss falls back to durable store query.
- NFRs addressed:
  - PR-1, PR-2.

## 7. Dependency-Class Timeout and Cancellation Pattern
- Intent:
  - Prevent long-tail latency and stuck orchestration calls.
- Design:
  - External calls use dependency-class timeout profiles.
  - Cancellation token propagation across orchestration chain.
  - Timeout outcomes emit structured failure category and retryability metadata.
- NFRs addressed:
  - PR-1, AR-4, OO-4.

## 8. Layered Authentication and Authorization Pattern
- Intent:
  - Enforce secure run-control operations for user and service channels.
- Design:
  - OIDC for human-initiated commands.
  - Service identity for internal automation paths.
  - Gateway performs coarse checks; service layer performs run-level RBAC.
- NFRs addressed:
  - SC-1, SC-2.

## 9. Secret Manager Abstraction Pattern
- Intent:
  - Keep credentials and signing material out of code and static configuration.
- Design:
  - Secret-provider abstraction for environment portability.
  - Short-lived retrieval with in-memory secure caching.
  - Rotation-safe key lookup by alias/version.
- NFRs addressed:
  - SC-3, CC-3.

## 10. Structured Telemetry Event Contract Pattern
- Intent:
  - Preserve operational explainability and long-term audit/replay diagnostics.
- Design:
  - Emit schema-enforced domain events for command lifecycle, retry decisions, and checkpoint boundaries.
  - Include reason code and recommended action fields in all failed/recoverable transitions.
  - Route logs/metrics/traces/audit stream through unified telemetry pipeline.
- NFRs addressed:
  - OO-1, OO-2, OO-3, OO-4.

## 11. Pluggable Checkpoint Repository Pattern
- Intent:
  - Support current single-zone durability and future cross-zone upgrade with minimal business logic impact.
- Design:
  - Checkpoint repository interface hides storage implementation.
  - Baseline implementation uses PostgreSQL-backed metadata and payload references.
  - Upgrade path supports cross-zone/region backend without orchestration contract changes.
- NFRs addressed:
  - AR-3, SC-4, FR-10/NFR-7 persistence goals.

## Pattern Interaction Summary
- Command path: Idempotent Command Processing -> Fast Ack + Async Execution -> Queue/Worker Pattern -> Retry/Circuit Breaker -> Checkpoint Repository.
- Read path: Read-Through Status Cache -> Durable state query fallback.
- Governance path: Layered AuthN/AuthZ + Secret Manager + Structured Telemetry Event Contract.

## Validation Notes
- Patterns align with selected NFR answers and do not introduce contradictory assumptions.
- Property-based testing candidates are explicit for idempotency, retry policy invariants, and state transitions.
