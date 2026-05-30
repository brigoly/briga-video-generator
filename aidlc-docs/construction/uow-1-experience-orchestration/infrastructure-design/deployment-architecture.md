# Deployment Architecture - UOW-1 Experience and Orchestration

## Topology Summary
A local-first container topology that promotes to AWS with minimal structural changes.

## Environment Layers
1. Local Development
- Docker Compose stack with services:
  - `orchestration-api`
  - `orchestration-worker`
  - `postgres`
  - `redis`
  - `otel-collector` (or compatible local telemetry endpoint)

2. Cloud Promotion (AWS Target)
- API ingress:
  - API Gateway (or equivalent edge) routing to container service.
- Compute:
  - Container service for API and worker tasks.
- Data:
  - Managed PostgreSQL-compatible service.
  - Managed Redis-compatible service.
  - Object storage bucket for archives and large payload references.
- Observability:
  - OpenTelemetry collector path and managed alert sink integration.

## Request and Execution Flow
1. Client/CLI submits command to API ingress.
2. API validates identity/authorization, resolves idempotency, and acknowledges quickly.
3. Work item is enqueued for asynchronous execution.
4. Worker dequeues task, applies retry/circuit-breaker policies, and executes orchestration transitions.
5. State and checkpoint updates persist to relational store; payload/archive references are written when needed.
6. Domain telemetry events are emitted to logs/metrics/traces/audit sink.
7. Status/inspect reads use short-lived cache with transition-triggered invalidation.

## Reliability and Recovery
- Retry model:
  - Exponential backoff with jitter and per-stage budget.
- Failure quarantine:
  - Dead-letter queue for repeatedly failing tasks.
- Resume model:
  - Checkpoint integrity validation before replay/re-entry.

## Network and Security Boundaries
- Public boundary:
  - API ingress only.
- Private boundary:
  - API, workers, data stores, and queue run in private subnets.
- Secret boundary:
  - Credentials resolved via secret manager abstraction, never hard-coded.

## Scaling Model
- Worker autoscaling based on queue depth and processing lag.
- API scales on request rate/latency targets.
- Admission control applies bounded queue TTL to avoid overload collapse.

## Retention and Lifecycle
- Hot operational data retention target: 30 days.
- Archived diagnostic/audit data retention target: 180 days.
- Retention jobs run as scheduled background processes.

## Implementation Readiness Notes
- Architecture is implementation-ready for initial UOW-1 slice.
- UOW-5 shared services remain explicit dependencies for manifest/artifact integration contracts.
- No shared-infrastructure global file created at this stage; cross-unit shared infra will be consolidated when multiple units reach infrastructure design completion.
