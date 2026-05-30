# UOW-1 NFR Design Plan - Experience and Orchestration

## Unit Context
- Unit: UOW-1 Experience and Orchestration
- Input artifacts reviewed:
  - aidlc-docs/construction/uow-1-experience-orchestration/nfr-requirements/nfr-requirements.md
  - aidlc-docs/construction/uow-1-experience-orchestration/nfr-requirements/tech-stack-decisions.md
- Objective: Translate approved NFR requirements into concrete non-functional design patterns and logical component structures.

## Execution Checklist
- [x] Analyze NFR requirements and tech-stack decisions
- [x] Identify ambiguity and missing detail affecting NFR design quality
- [x] Generate context-appropriate NFR design questions with [Answer] tags
- [x] Store this plan in aidlc-docs/construction/plans/uow-1-experience-orchestration-nfr-design-plan.md
- [x] Collect and validate all [Answer] entries
- [x] Analyze responses for ambiguity and contradiction
- [x] Add clarification questions if needed and resolve all ambiguity
- [x] Generate nfr-design-patterns.md
- [x] Generate logical-components.md
- [x] Validate NFR design consistency against NFR requirements
- [x] Present completion and request explicit approval

## NFR Design Clarification Questions

### Resilience Patterns
1. Which retry strategy should be the default for transient dependency/provider failures?
   A) Fixed delay retries
   B) Exponential backoff
   C) Exponential backoff with jitter
   D) Policy varies by dependency class
   [Answer]: C

2. What should the default retry budget be for a retryable stage attempt before entering recoverable-failed state?
   A) 2 attempts
   B) 3 attempts
   C) 5 attempts
   D) Per-stage configurable with default 3
   [Answer]: D

3. Should circuit-breaker behavior be included for unstable upstream providers in UOW-1 orchestration?
   A) Yes, mandatory for all providers
   B) Yes, only for known high-failure integrations
   C) Optional
   D) No
   [Answer]: B

### Scalability Patterns
4. For 100 steady / 150 burst concurrent runs, which scaling control should be primary?
   A) Worker autoscaling only
   B) Queue backpressure only
   C) Combined queue backpressure + worker autoscaling
   D) Manual operator scaling
   [Answer]: C

5. How should admission control behave under overload?
   A) Reject immediately
   B) Queue indefinitely
   C) Queue with bounded TTL then reject with actionable reason
   D) Degrade features but always accept
   [Answer]: C

6. Which partitioning strategy should be used for worker distribution?
   A) No partitioning (global pool)
   B) Partition by run ID hash
   C) Partition by stage type
   D) Hybrid run ID hash + stage affinity for hotspots
   [Answer]: D

### Performance Patterns
7. Which approach should enforce p95 <= 500 ms for command APIs?
   A) Synchronous orchestration path end-to-end
   B) Fast command acknowledgment + async execution for heavy transitions
   C) Best-effort execution without explicit latency guard
   D) Client polling optimization only
   [Answer]: B

8. Which caching strategy is appropriate for `status` and `inspect` paths?
   A) No cache, always database
   B) Short-lived read-through cache with invalidation on state transition
   C) Long-lived cache (5+ minutes)
   D) Client-side cache only
   [Answer]: B

9. Which timeout pattern should be default for external dependency calls in orchestration flow?
   A) No timeout
   B) Fixed global timeout
   C) Dependency-class-based timeouts + cancellation propagation
   D) User-configurable only
   [Answer]: C

### Security Patterns
10. How should hybrid authentication be applied across CLI and API channels?
    A) API key for both
    B) OIDC user token for human actions, service identity for automation paths
    C) Service identity only
    D) Session cookie model
    [Answer]: B

11. What authorization enforcement point should be canonical?
    A) API gateway only
    B) Application service layer only
    C) Both gateway coarse checks + service-layer run-level RBAC checks
    D) Data layer only
    [Answer]: C

12. Which secret-handling pattern should be baseline for provider credentials and signing material?
    A) Environment variables only
    B) Secret manager abstraction + short-lived token retrieval
    C) Encrypted file in repo
    D) Manual operator injection per run
    [Answer]: B

### Logical Components
13. Which logical component set is required in UOW-1 to satisfy current NFRs?
    A) API + worker only
    B) API, orchestration service, queue, worker pool, checkpoint store, telemetry pipeline
    C) API, orchestration service, database only
    D) Monolith single process
    [Answer]: B

14. Where should idempotency key resolution and replay protection be owned?
    A) API gateway
    B) Orchestration application service with durable idempotency store
    C) Worker only
    D) Client SDK
    [Answer]: B

15. How should checkpoint persistence be composed to support durability now and cross-zone upgrade later?
    A) Single table only forever
    B) Abstract checkpoint repository with pluggable storage backend
    C) In-memory only with periodic dump
    D) Object storage only without metadata index
    [Answer]: B

16. Which telemetry integration pattern should be default for reason codes and recommended actions?
    A) Free-text logs only
    B) Structured domain events with schema-enforced fields
    C) Metrics only
    D) Traces only
    [Answer]: B

## Notes
- Suggested answers are prefilled per user preference and can be edited directly.
- If any answer is changed to uncertain or conditional wording, follow-up clarification questions will be generated before design artifacts are produced.
