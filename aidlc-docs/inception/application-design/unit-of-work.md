# Unit of Work Definitions

## Decomposition Summary
- Strategy: Hybrid capability plus pipeline units
- Target unit count: 5 units (balanced)
- Dependency model: Mostly sequential with controlled parallel branches
- Persistence assignment: Hybrid with dedicated persistence unit plus unit-local adapters
- Code organization strategy (greenfield): Monorepo with app core plus unit modules

## Code Organization Strategy (Greenfield)
- Repository model: Monorepo
- App core package: run lifecycle, shared contracts, orchestration abstractions
- Unit modules:
  - modules/uow-1-experience-orchestration
  - modules/uow-2-content-intelligence
  - modules/uow-3-media-composition
  - modules/uow-4-platform-packaging
  - modules/uow-5-platform-foundation
- Shared interfaces:
  - modules/shared-contracts
  - modules/shared-types

## UOW-1 Experience and Orchestration
### Responsibility
Provide CLI command surface and orchestrated run lifecycle across stages with checkpoint-aware execution control.

### Scope
- CLI command parsing and invocation
- Run startup, status, inspect, retry, resume command handling
- Stage sequencing and progress status output

### Key Outputs
- Run command contracts
- Orchestration execution state transitions
- Stage execution events

## UOW-2 Content Intelligence
### Responsibility
Transform topic inputs into script artifacts and variants with LLM provider integration under shared contracts.

### Scope
- Topic normalization and prompt assembly
- Script generation and variant regeneration
- LLM adapter integration and fallback routing

### Key Outputs
- Script artifacts per platform profile
- Script variant lineage metadata

## UOW-3 Media Composition
### Responsibility
Resolve visual assets and build scene timelines for platform-targeted short-form output.

### Scope
- Stock and AI asset discovery and selection
- Scene timing, transitions, and composition models
- Composition validation against duration constraints

### Key Outputs
- Selected asset sets with attribution
- Timeline artifacts per target platform

## UOW-4 Platform Packaging
### Responsibility
Produce validated platform-ready packages using shared packaging core and thin platform extensions.

### Scope
- Shared package assembly pipeline
- Platform extensions for TikTok, YouTube Shorts, Instagram Reels
- Package validation and delivery bundle creation

### Key Outputs
- Platform-specific publish-ready bundles
- Package validation reports

## UOW-5 Platform Foundation
### Responsibility
Provide cross-cutting persistence, manifest indexing, telemetry, and policy controls for retry and reuse.

### Scope
- Artifact storage and retrieval
- Run manifest and lineage indexing
- Telemetry aggregation and diagnostics
- Retry and resume policy enforcement hooks

### Key Outputs
- Deterministic filesystem artifact structure
- Machine-readable run manifest
- Run telemetry and diagnostics summary

## Unit Boundary Validation
- Each unit has a single primary responsibility and clear ownership boundary.
- Cross-cutting behavior is centralized in UOW-5 while allowing unit-level hooks.
- Provider-specific volatility is isolated away from core orchestration contracts.
- Packaging remains separable from composition for independent iteration.
