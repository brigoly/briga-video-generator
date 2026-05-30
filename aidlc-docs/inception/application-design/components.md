# Components

## Design Basis
- Boundary style: Hybrid (stage-oriented domain components with layered internals)
- Provider integration style: Separate adapter per provider type with shared interfaces
- Persistence style: Stage-local writes + centralized manifest/index service

## Component Catalog

## C1 CLI Gateway
### Purpose
Single entry point for creator commands and run lifecycle control.

### Responsibilities
- Parse and validate CLI commands/options
- Resolve run profiles and overrides
- Trigger orchestrator operations
- Present status and summary output

### Interfaces
- `run start`
- `run resume`
- `run retry --stage <stage>`
- `run inspect --run-id <id>`

## C2 Run Orchestrator
### Purpose
Coordinate stage execution, checkpointing, retry policy invocation, and resume behavior.

### Responsibilities
- Execute stage graph in order
- Manage run state transitions
- Emit stage lifecycle events
- Coordinate retry/resume decisions

### Interfaces
- `startRun(command)`
- `resumeRun(runId, options)`
- `retryStage(runId, stageId, options)`

## C3 Topic and Script Component
### Purpose
Convert topic input into script artifacts and controlled variants.

### Responsibilities
- Generate initial scripts
- Generate script variants
- Persist script artifacts and metadata

### Interfaces
- `generateScript(request)`
- `regenerateScript(request)`

## C4 Asset Sourcing Component
### Purpose
Produce scene-ready visual assets from stock and AI sources.

### Responsibilities
- Query stock providers
- Generate AI assets when gaps remain
- Select best asset candidates via policy
- Persist asset manifests and attribution

### Interfaces
- `discoverStockAssets(request)`
- `generateAiAssets(request)`
- `selectAssets(request)`

## C5 Timeline and Composition Component
### Purpose
Assemble script and assets into structured scene timelines.

### Responsibilities
- Build per-platform scene plans
- Enforce duration constraints
- Persist composition descriptors

### Interfaces
- `buildTimeline(request)`
- `validateTiming(request)`

## C6 Packaging Component
### Purpose
Build platform-ready output packages from rendered artifacts.

### Responsibilities
- Apply shared packaging core logic
- Apply thin platform extensions for TikTok/Shorts/Reels
- Validate package constraints
- Persist package bundles and metadata

### Interfaces
- `packageForPlatform(request)`
- `validatePackage(request)`

## C7 Artifact Store Component
### Purpose
Provide stage-local durable filesystem writes and reads for all artifacts.

### Responsibilities
- Write/read artifacts by run and stage
- Version artifacts within runs
- Enforce deterministic directory schema

### Interfaces
- `writeArtifact(request)`
- `readArtifact(request)`
- `listArtifacts(request)`

## C8 Run Manifest Component
### Purpose
Maintain centralized machine-readable index for artifact discovery and lineage.

### Responsibilities
- Record artifact metadata and lineage links
- Provide run-level and stage-level manifest queries
- Support reuse lookup between runs

### Interfaces
- `recordManifestEntry(entry)`
- `getRunManifest(runId)`
- `findReusableArtifacts(criteria)`

## C9 Retry and Resume Coordinator
### Purpose
Apply central retry policy while allowing stage overrides.

### Responsibilities
- Classify failures as retryable/non-retryable
- Execute policy backoff strategy
- Determine resume start stage

### Interfaces
- `evaluateRetry(context)`
- `computeResumePlan(runId, failureContext)`

## C10 Telemetry Aggregator
### Purpose
Collect stage telemetry, logs, and metrics for observability.

### Responsibilities
- Ingest component-level logs/events
- Produce run summaries and stage diagnostics
- Export structured diagnostics for inspection

### Interfaces
- `emitEvent(event)`
- `recordMetric(metric)`
- `buildRunSummary(runId)`
