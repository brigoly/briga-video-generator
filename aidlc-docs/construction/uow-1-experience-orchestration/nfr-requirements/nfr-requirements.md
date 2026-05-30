# NFR Requirements - UOW-1 Experience and Orchestration

## Scope
Non-functional requirements for orchestration run control, state progression, retries/resume behavior, checkpoint durability, and operational visibility.

## 1. Scalability Requirements
- SR-1 Concurrent Run Capacity:
  - Support 100 concurrent runs per environment in steady conditions.
  - Support burst up to 150 concurrent runs with queue-mediated admission control.
- SR-2 Growth Planning:
  - Capacity model targets moderate growth (2x to 5x) over 12 months.
- SR-3 Scaling Strategy:
  - Hybrid scaling required.
  - Prefer horizontal scale for command processing and event handling.
  - Permit vertical scaling for stateful bottlenecks when cost-effective.

## 2. Performance Requirements
- PR-1 Command Latency:
  - p95 latency for `start`, `resume`, `retry`, `status`, `inspect` <= 500 ms under nominal load.
- PR-2 Progress Freshness:
  - State transition visibility delay <= 3 seconds.
- PR-3 Throughput:
  - Sustain >= 120 run-control commands per minute.
  - Handle burst >= 300 commands per minute without data loss.

## 3. Availability and Reliability Requirements
- AR-1 API Availability:
  - Monthly availability target: 99.9% for orchestration APIs.
- AR-2 Recovery Time Objective for Recoverable Failures:
  - Recoverable run time-to-recovery <= 5 minutes.
- AR-3 Checkpoint Durability:
  - Durable within a single zone as baseline.
  - Architecture must support upgrade path to cross-zone/region durability.
- AR-4 Failure Safety:
  - No duplicate run mutation on command replay.
  - Resume only from integrity-validated checkpoints.

## 4. Security and Compliance Requirements
- SC-1 Authentication:
  - Hybrid identity model required (user token plus service identity where applicable).
- SC-2 Authorization:
  - Run-level ownership plus role-based access control.
- SC-3 Data Protection:
  - Encrypt checkpoint, error-context, and progress data in transit and at rest.
- SC-4 Residency Flexibility:
  - No strict residency mandate in current baseline.
  - Deployment must support storage-region pinning when required.

## 5. Observability and Operability Requirements
- OO-1 Telemetry Baseline:
  - Mandatory from day one: logs, metrics, traces, and audit event stream.
- OO-2 Alerting Windows:
  - Warning alert: 5-minute sustained SLO breach.
  - Critical alert: 15-minute sustained SLO breach.
- OO-3 Retention:
  - 30 days hot retention for operational investigation.
  - 180 days archived retention for audit and replay diagnostics.
- OO-4 Explainability:
  - Failed/recoverable states must expose reason code and recommended action.

## 6. Maintainability and Quality Requirements
- MQ-1 Coverage Gate:
  - Minimum automated test coverage for orchestration modules >= 85%.
- MQ-2 Property-Based Testing:
  - Required for critical invariants:
    - Idempotency invariants
    - Retry policy invariants
    - State-transition invariants
- MQ-3 Reproducibility:
  - Deterministic orchestration mode decisions reproducible for equivalent inputs.

## 7. Constraints and Cost Requirements
- CC-1 Cost Model:
  - Prioritize free-tier and open-source components where practical.
- CC-2 Vendor Lock Minimization:
  - Avoid mandatory paid SaaS coupling for core orchestration paths.
- CC-3 Environment Parity:
  - Preserve local/dev parity with low-cost cloud deployment path.

## 8. Traceability to Functional Design
- BR-2 / BR-15: addressed by PR-1, AR-4, MQ-2, MQ-3.
- BR-5 / BR-6 / BR-14: addressed by AR-2, AR-4, OO-4.
- BR-7 / BR-8: addressed by AR-3, AR-4.
- BR-10 / BR-11: addressed by SC-3, OO-1, OO-4.
- FR-10 and NFR-7 persistence/reuse goals: addressed by AR-3, OO-3, SC-3, CC-3.
