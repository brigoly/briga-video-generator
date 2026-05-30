# Repository Layer Summary - UOW-1

## Implemented Scope
- In-memory repository implementations for run state, checkpoint records, and idempotency store.
- PostgreSQL adapter skeleton for run-state repository (placeholder for production adapter).
- In-memory status cache with TTL expiration and invalidation.

## Primary Files
- src/uow-1-experience-orchestration/repositories/interfaces.ts
- src/uow-1-experience-orchestration/repositories/statusCache.ts

## Integration Assumptions (UOW-5)
- Shared artifact persistence and manifest indexing are external to UOW-1 and consumed via contracts.
- UOW-1 persists orchestration control-plane state and checkpoint metadata only.
- Telemetry and artifact lineage remain compatible with UOW-5 ownership model.
