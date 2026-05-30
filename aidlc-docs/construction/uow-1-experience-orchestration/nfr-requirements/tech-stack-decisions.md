# Tech Stack Decisions - UOW-1 Experience and Orchestration

## Decision Drivers
- Enforce deterministic run orchestration and idempotent command behavior.
- Meet 99.9% availability and <= 500 ms p95 command latency targets.
- Preserve stage-output persistence/reuse with auditable checkpoints.
- Keep baseline costs low with free-tier/open-source-first approach.

## 1. Runtime and Language
- Decision:
  - Use Node.js LTS with TypeScript for orchestration services.
- Rationale:
  - Strong async/event-driven model for command and progress workflows.
  - Mature ecosystem for CLI and API interfaces.
  - Type safety supports state transition and invariant correctness.

## 2. API and Command Interface
- Decision:
  - Expose run-control via REST API and CLI wrapper sharing the same application service layer.
- Rationale:
  - Keeps command semantics consistent across automation and human operators.
  - Supports idempotency key propagation uniformly.

## 3. Persistence Layer
- Decision:
  - Primary metadata store: PostgreSQL.
  - Checkpoint and audit/event payload store: PostgreSQL JSONB and/or object storage references.
- Rationale:
  - ACID guarantees for lifecycle transitions and checkpoint integrity.
  - Strong query capability for run history, status, and replay diagnostics.
  - Open-source with low-cost hosting options.

## 4. Queueing and Work Distribution
- Decision:
  - Use a Redis-backed queue for command buffering and retry scheduling.
- Rationale:
  - Supports burst absorption (up to 300 commands/min target).
  - Enables delay-based retry policies and controlled concurrency.

## 5. Authentication and Authorization
- Decision:
  - Hybrid model:
    - OAuth2/OIDC for user-initiated operations.
    - Service identity (machine credentials) for internal automation paths.
  - RBAC scoped to run ownership and roles.
- Rationale:
  - Aligns with selected security NFRs.
  - Balances user-level accountability and service-to-service trust.

## 6. Observability Stack
- Decision:
  - Instrumentation: OpenTelemetry.
  - Signals: logs, metrics, traces, plus audit event stream.
  - Alerting: rule-based thresholds for 5-minute warning and 15-minute critical breaches.
- Rationale:
  - Unified telemetry model across local and cloud environments.
  - Good interoperability with open-source backends.

## 7. Testing Strategy and Tooling
- Decision:
  - Unit/integration tests with deterministic fixtures.
  - Property-based testing required for critical orchestration invariants.
- Suggested tooling:
  - Test runner: Vitest or Jest.
  - Property-based testing: fast-check.
- Rationale:
  - Directly supports idempotency/retry/state-transition correctness requirements.

## 8. Deployment and Cost Posture
- Decision:
  - Baseline deployment on low-cost container hosting with managed PostgreSQL and Redis where free/low tiers exist.
  - Keep adapters abstracted to allow migration between local and cloud providers.
- Rationale:
  - Meets free-tier-first constraint while preserving upgrade path.

## 9. Risk and Mitigation Notes
- Risk: Queue and DB hot spots at higher concurrency.
  - Mitigation: Horizontal worker scaling, backpressure, and command admission control.
- Risk: Trace/audit volume growth.
  - Mitigation: Tiered retention (30d hot, 180d archived) and selective sampling for high-volume spans.
- Risk: Cross-zone durability needs may emerge.
  - Mitigation: Keep checkpoint storage interfaces pluggable for cross-zone upgrade.

## 10. Deferred Decisions
- Exact hosting provider choice deferred until infrastructure design stage.
- Exact telemetry backend vendor deferred; OpenTelemetry contract is fixed now.
