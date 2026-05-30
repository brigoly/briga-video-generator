# Unit of Work Dependency Matrix

## Dependency Strategy
- Primary pattern: Sequential flow across core pipeline units
- Controlled parallel branches: Validation and telemetry hooks may execute in parallel to stage completion events
- Cross-cutting foundation: UOW-5 is shared dependency for all units

## Matrix

| Unit | Depends On | Dependency Type | Notes |
|---|---|---|---|
| UOW-1 Experience and Orchestration | UOW-5 Platform Foundation | Hard | Needs run state, manifest lookups, retry policy hooks |
| UOW-2 Content Intelligence | UOW-1, UOW-5 | Hard | Executes under orchestrator and persists script outputs |
| UOW-3 Media Composition | UOW-2, UOW-5 | Hard | Requires script artifacts and persistence services |
| UOW-4 Platform Packaging | UOW-3, UOW-5 | Hard | Requires timeline and rendered composition artifacts |
| UOW-5 Platform Foundation | None | Base | Core cross-cutting services for all units |

## Dependency Graph
1. UOW-5 initialized as platform foundation
2. UOW-1 orchestrates run lifecycle
3. UOW-2 executes content intelligence
4. UOW-3 performs media composition
5. UOW-4 performs platform packaging

## Controlled Parallel Branches
- Telemetry emission can run alongside each stage completion
- Manifest indexing can run as post-write hooks without blocking non-critical reads
- Validation jobs can execute as asynchronous post-stage checks where safe

## Integration Boundaries
- UOW-1 to UOW-2: stage invocation contracts and script generation requests
- UOW-2 to UOW-3: script artifact handoff via manifest references
- UOW-3 to UOW-4: composition output handoff via manifest references
- All units to UOW-5: artifact I/O, manifest index, telemetry, retry policy interfaces

## Dependency Consistency Validation
- No cyclical dependencies identified
- Foundation dependency remains one-directional (units consume, foundation does not consume units)
- Story-critical flows preserve deterministic progression with explicit resume points
