# UOW-1 Infrastructure Design Plan - Experience and Orchestration

## Unit Context
- Unit: UOW-1 Experience and Orchestration
- Inputs reviewed:
  - Functional Design artifacts
  - NFR Design artifacts
  - NFR Requirements and tech-stack decisions
- Objective: Map UOW-1 logical components to concrete infrastructure decisions for low-cost, resilient deployment.

## Execution Checklist
- [x] Analyze functional and NFR design artifacts
- [x] Identify infrastructure ambiguity and decision points
- [x] Generate context-appropriate infrastructure questions with [Answer] tags
- [x] Store this plan in aidlc-docs/construction/plans/
- [x] Collect and validate all [Answer] entries
- [x] Analyze responses for ambiguity and contradiction
- [x] Add clarification questions if needed and resolve all ambiguity
- [x] Generate infrastructure-design.md
- [x] Generate deployment-architecture.md
- [x] Validate infrastructure mapping consistency
- [x] Present completion and request explicit approval

## Infrastructure Clarification Questions

### Deployment Environment
1. What baseline deployment target should be used initially?
   A) Local-first Docker Compose with optional cloud promotion
   B) Single cloud provider managed services from day one
   C) Pure on-premise
   D) Multi-cloud active-active
   [Answer]: A

2. Which cloud provider should be treated as default promotion target if cloud deployment is needed?
   A) AWS
   B) Azure
   C) GCP
   D) Provider-neutral abstraction only for now
   [Answer]: A

### Compute Infrastructure
3. Which compute model should host orchestration API and workers initially?
   A) Serverless functions
   B) Containerized services
   C) VM-based services
   D) Mixed serverless + VM
   [Answer]: B

4. What scaling strategy should be default for workers?
   A) Fixed replicas
   B) Queue-depth autoscaling
   C) CPU-only autoscaling
   D) Manual scaling
   [Answer]: B

### Storage Infrastructure
5. Which primary store should host run state and checkpoint metadata?
   A) PostgreSQL
   B) NoSQL document DB
   C) Key-value store only
   D) Embedded local DB only
   [Answer]: A

6. How should larger checkpoint payloads and telemetry archives be handled?
   A) Keep all in relational tables
   B) Hybrid: relational metadata + object storage payload/archive
   C) Object storage only
   D) In-memory cache only
   [Answer]: B

### Messaging Infrastructure
7. Which messaging approach should back command buffering and retry scheduling?
   A) Redis queue
   B) Cloud-native managed queue only
   C) Relational table polling
   D) No queue
   [Answer]: A

8. Should dead-letter queue handling be enabled from the first implementation slice?
   A) Yes
   B) No
   [Answer]: A

### Networking Infrastructure
9. Which ingress pattern should be default?
   A) API gateway + internal service routing
   B) Direct service exposure
   C) CLI local only
   D) VPN-only access
   [Answer]: A

10. What network isolation baseline should be applied?
    A) Public flat network
    B) Private subnet services + controlled public ingress
    C) Fully private with no ingress
    D) Shared multi-tenant public compute
    [Answer]: B

### Monitoring Infrastructure
11. Which observability baseline should be provisioned?
    A) Logs only
    B) Logs + metrics
    C) Logs + metrics + traces
    D) Logs + metrics + traces + audit event sink
    [Answer]: D

12. Which alert routing baseline should be used?
    A) Email only
    B) Chat/incident webhook + email fallback
    C) No active alerting
    D) Pager only
    [Answer]: B

### Shared Infrastructure
13. Should UOW-1 use shared foundational services for artifact/manifest/telemetry contracts (UOW-5) rather than owning duplicates?
    A) Yes, shared-by-default
    B) No, fully isolated duplicates
    C) Mixed case-by-case
    [Answer]: A

14. What tenancy isolation strategy should be assumed initially?
    A) Single-tenant per environment
    B) Multi-tenant shared runtime
    C) Per-run isolated environments
    D) Unknown
    [Answer]: A

## Notes
- Suggested answers are prefilled per user preference.
- Autonomous continuation directive used to resolve stage approvals while user is away.
