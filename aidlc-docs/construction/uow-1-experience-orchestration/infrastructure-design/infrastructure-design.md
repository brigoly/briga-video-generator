# Infrastructure Design - UOW-1 Experience and Orchestration

## Scope
Infrastructure mapping for UOW-1 orchestration control-plane components across local-first and cloud-promoted environments.

## 1. Deployment Environment
- Baseline environment:
  - Local-first Docker Compose for development and validation.
- Promotion target:
  - AWS as default cloud target when deployment promotion is required.
- Deployment model:
  - Environment parity preserved across local and cloud through containerized services and configuration layering.

## 2. Compute Infrastructure
- API service:
  - Containerized orchestration API service.
- Worker service:
  - Containerized worker pool for asynchronous execution.
- Scaling:
  - Queue-depth autoscaling policy for worker replicas.
- Operational mode:
  - Single-tenant runtime per environment for initial release.

## 3. Storage Infrastructure
- Primary relational store:
  - PostgreSQL for run state, idempotency keys, checkpoint metadata, and authorization context.
- Object/payload storage:
  - Hybrid model for larger checkpoint payloads and long-term telemetry archives.
- Durability posture:
  - Single-zone baseline with repository abstraction prepared for cross-zone upgrade.

## 4. Messaging Infrastructure
- Queue technology:
  - Redis-backed queue for command buffering and retry scheduling.
- Reliability controls:
  - Dead-letter queue enabled from first implementation slice.
  - Queue TTL and bounded admission controls to prevent unbounded backlog.

## 5. Networking Infrastructure
- Ingress:
  - API gateway in front of orchestration API.
- Service routing:
  - Internal service-to-service routing within private network segments.
- Isolation baseline:
  - Private subnets for data and worker services with controlled public ingress only at gateway.

## 6. Monitoring and Observability Infrastructure
- Mandatory telemetry:
  - Logs, metrics, traces, and audit event sink.
- Alert routing:
  - Chat/incident webhook with email fallback.
- Alert policy:
  - Warning on 5-minute sustained breach.
  - Critical on 15-minute sustained breach.

## 7. Security Infrastructure
- Identity:
  - OIDC user authentication for operator-triggered actions.
  - Service identity for internal automation paths.
- Authorization:
  - Gateway coarse checks plus service-layer run-level RBAC.
- Secrets:
  - Secret manager abstraction with short-lived retrieval path.
- Data protection:
  - TLS in transit and encryption at rest for all state/checkpoint/audit data.

## 8. Shared Infrastructure Strategy
- UOW-1 consumes shared foundational services exposed by UOW-5 for artifact/manifest/telemetry contracts.
- Duplicate ownership of shared persistence and manifest concerns is explicitly avoided.

## 9. Cost and Evolution Strategy
- Free-tier/open-source-first service choices preserved for initial deployment.
- Provider lock-in reduced through adapter and repository abstractions.
- Upgrade paths retained for:
  - Cross-zone durability
  - Managed queue migration
  - Managed telemetry backend substitution

## 10. Infrastructure Mapping Summary
- Command API Adapter -> API Gateway + Orchestration API container
- Orchestration Application Service -> API container + Worker container
- Idempotency Resolver / Run State Store -> PostgreSQL
- Command Queue Gateway -> Redis queue + DLQ
- Checkpoint Repository -> PostgreSQL metadata + object storage payload/archive
- Telemetry Publisher / Alert Evaluator -> OpenTelemetry pipeline + alert sink integrations
