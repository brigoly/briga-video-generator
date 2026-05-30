# Component Dependency and Data Flow

## Dependency Matrix

| From | To | Dependency Type | Purpose |
|---|---|---|---|
| CLI Gateway | Run Orchestrator | Direct call | Start/resume/retry workflows |
| Run Orchestrator | Topic and Script Component | Direct call | Stage execution |
| Run Orchestrator | Asset Sourcing Component | Direct call | Stage execution |
| Run Orchestrator | Timeline and Composition Component | Direct call | Stage execution |
| Run Orchestrator | Packaging Component | Direct call | Stage execution |
| Run Orchestrator | Retry and Resume Coordinator | Policy decision | Retry/resume decisions |
| Run Orchestrator | Telemetry Aggregator | Event emission | Stage lifecycle telemetry |
| Topic and Script Component | Provider Integration Service | Adapter call | LLM-based script generation |
| Asset Sourcing Component | Provider Integration Service | Adapter call | Stock/AI asset operations |
| All Stage Components | Artifact Store Component | Persistence I/O | Stage-local artifact writes |
| Artifact Store Component | Run Manifest Component | Index update | Artifact discoverability and lineage |
| Run Manifest Component | Run Reuse Service | Query | Reuse candidate discovery |
| Packaging Component | Provider Integration Service | Optional adapter call | Platform metadata enrichment |
| Telemetry Aggregator | Run Manifest Component | Reference association | Tie events to artifacts |

## Communication Patterns
- Primary pattern: request-response for deterministic orchestration.
- Secondary pattern: artifact-centric handoff via persisted references and manifest entries.
- Event hooks: stage lifecycle and telemetry events emitted from orchestrator and services.

## Canonical Artifact-Centric Data Flow

1. `run start` command enters CLI Gateway.
2. Run Orchestrator initializes run state and stage sequence.
3. Stage component executes and writes outputs to Artifact Store using run ID + stage ID paths.
4. Run Manifest records artifact references and lineage metadata.
5. Next stage resolves prior outputs through manifest-driven references.
6. Telemetry Aggregator records lifecycle events and stage metrics.
7. On failure, Retry and Resume Coordinator computes retry/resume plan.
8. On reuse mode, Run Reuse Service links compatible prior artifacts and skips unchanged stages.

## Deterministic Path Convention
- Root: `<workspace>/runs/<run-id>/`
- Stage scope: `<workspace>/runs/<run-id>/stages/<stage-id>/`
- Artifact payloads: `<workspace>/runs/<run-id>/stages/<stage-id>/artifacts/`
- Stage logs: `<workspace>/runs/<run-id>/stages/<stage-id>/logs/`
- Run manifest: `<workspace>/runs/<run-id>/manifest.json`

## Coupling and Boundary Notes
- Strong contracts for core stage I/O models.
- Adapter interfaces isolate provider-specific volatility.
- Persistence index (Run Manifest) is centralized; payload storage is stage-local.
- Retry policy is centrally governed but stage-overridable.
