# UOW-1 NFR Requirements Plan - Experience and Orchestration

## Unit Context
- Unit: UOW-1 Experience and Orchestration
- Functional design artifacts reviewed:
  - business-logic-model.md
  - business-rules.md
  - domain-entities.md
- Objective: Define concrete non-functional requirements and tech-stack decisions for orchestration control, resilience, and observability.

## Execution Checklist
- [x] Analyze functional design artifacts for NFR implications
- [x] Identify ambiguity and missing constraints requiring user clarification
- [x] Prepare context-appropriate NFR questions with [Answer] tags
- [x] Store NFR requirements plan in aidlc-docs/construction/plans/
- [x] Collect and validate all [Answer] entries
- [x] Analyze responses for ambiguity and contradiction
- [x] Add clarification questions if needed and resolve all ambiguity
- [x] Generate nfr-requirements.md
- [x] Generate tech-stack-decisions.md
- [x] Validate NFR coverage and consistency against functional design
- [x] Present completion and request explicit approval

## NFR Clarification Questions

### Scalability
1. What peak number of concurrent orchestration runs must a single environment support?
    [Answer]: Suggested baseline: 100 concurrent runs per environment (burst up to 150 with queueing).

2. What growth profile should capacity planning target over the next 12 months?
   A) Stable (<2x)
   B) Moderate (2x to 5x)
   C) High (5x to 10x)
   D) Elastic/unknown
    [Answer]: B

3. Should scaling be primarily vertical, horizontal, or hybrid?
   A) Vertical first
   B) Horizontal first
   C) Hybrid
    [Answer]: C

### Performance
4. What is the target p95 latency for run-control commands (start/resume/retry/status/inspect)?
   A) <= 100 ms
   B) <= 250 ms
   C) <= 500 ms
   D) <= 1000 ms
    [Answer]: C

5. What is the required maximum delay for progress visibility updates after a state transition?
   A) <= 1 second
   B) <= 3 seconds
   C) <= 5 seconds
   D) <= 10 seconds
    [Answer]: B

6. What throughput target is required for command handling (steady-state commands/minute)?
    [Answer]: Suggested baseline: 120 commands/minute steady-state, 300 commands/minute burst.

### Availability and Reliability
7. What service availability target applies to orchestration APIs?
   A) 99.0%
   B) 99.5%
   C) 99.9%
   D) 99.95%+
    [Answer]: C

8. For recoverable failures, what maximum time-to-recovery is acceptable for a run?
   A) <= 1 minute
   B) <= 5 minutes
   C) <= 15 minutes
   D) <= 60 minutes
    [Answer]: B

9. What checkpoint durability target is required?
   A) Best effort
   B) Durable within single zone
   C) Durable across zones/regions
    [Answer]: B (upgrade path to C for production scale)

### Security and Compliance
10. What authentication model should guard run-control operations?
    A) API key only
    B) OAuth2/OIDC user tokens
    C) Service-to-service identity only
    D) Hybrid user + service identity
    [Answer]: D

11. What authorization granularity is required?
    A) Environment-wide role access
    B) Project/topic scoped access
    C) Run-level ownership and role-based access
    D) Attribute-based policy per command
    [Answer]: C

12. Are there mandatory compliance or data residency constraints for stored checkpoints, error context, and progress events?
    [Answer]: Suggested default: No strict regulatory residency mandate now; encrypt at rest/in transit and keep capability to pin storage region per deployment.

### Observability and Operability
13. Which telemetry signals are mandatory from day one?
    A) Logs only
    B) Logs + metrics
    C) Logs + metrics + traces
    D) Logs + metrics + traces + audit event stream
    [Answer]: D

14. What alerting SLO breach windows should trigger incident response?
    [Answer]: Suggested: Trigger warning at 5-minute sustained breach; critical at 15-minute sustained breach.

15. What retention policy is required for orchestration logs/events/checkpoints used for audit and replay diagnostics?
    [Answer]: Suggested default: 30 days hot retention + 180 days archived retention for audit/replay diagnostics.

### Maintainability and Delivery
16. What minimum automated test coverage gate should apply to orchestration modules?
    A) >= 60%
    B) >= 75%
    C) >= 85%
    D) >= 90%
    [Answer]: C

17. Should property-based testing be required for retry/idempotency/state-transition invariants in this unit?
    A) Required for critical invariants
    B) Optional but recommended
    C) Not required
    [Answer]: A

18. What runtime/platform constraints must guide tech selection (cost limits, free-tier preference, managed services limits, hosting constraints)?
    [Answer]: Suggested constraints: prioritize free-tier/open-source components first, avoid mandatory paid SaaS dependencies, and preserve local/dev parity with low-cost cloud deployment path.

## Notes
- If any answer is uncertain, provide a best-fit default plus any boundary conditions.
- Ambiguous answers will trigger focused follow-up questions before artifact generation.
