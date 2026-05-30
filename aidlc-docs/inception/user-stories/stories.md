# User Stories

## Story Organization
- **Approach**: Feature-based (approved)
- **Granularity**: Fine-grained
- **Acceptance Criteria Format**: Given-When-Then
- **Primary Success Metric**: End-to-end automation completion rate

## Story Index
- S1-S3: Topic and script generation
- S4-S7: Asset sourcing and scene composition
- S8-S11: Platform-specific packaging
- S12-S14: Observability and run control
- S15-S16: Failure handling and retry resilience
- S17: Filesystem persistence and artifact reuse

## S1 Topic Intake Command
**Persona**: P1 (Solo Video Creator)
**As a** solo creator, **I want** to submit a high-level topic and run profile via CLI, **so that** I can start generation with one command.

### Acceptance Criteria (Given-When-Then)
1. **Given** a valid topic and selected profile, **when** I run the intake command, **then** the system creates a new run with a unique run ID.
2. **Given** missing required inputs, **when** I execute the command, **then** the system fails fast with actionable validation messages.
3. **Given** a run is created, **when** intake completes, **then** all run inputs are persisted for reproducibility.

## S2 Script Generation from Topic
**Persona**: P1
**As a** solo creator, **I want** AI to generate a short-form script from my topic, **so that** I avoid manual drafting.

### Acceptance Criteria (Given-When-Then)
1. **Given** a run with topic and target audience constraints, **when** script generation executes, **then** a script draft is produced within platform duration constraints.
2. **Given** multiple target platforms, **when** script generation completes, **then** script variants are compatible with each platform profile.
3. **Given** generation succeeds, **when** I inspect artifacts, **then** prompt settings and model metadata are captured.

## S3 Script Variant Regeneration
**Persona**: P1
**As a** solo creator, **I want** to regenerate script variants with adjusted style parameters, **so that** I can test creative alternatives quickly.

### Acceptance Criteria (Given-When-Then)
1. **Given** an existing run, **when** I request regeneration with style deltas, **then** the system produces a new version without deleting the prior one.
2. **Given** deterministic mode is enabled, **when** I rerun with identical parameters, **then** outputs are reproducible within defined tolerance.
3. **Given** regeneration completes, **when** I list artifacts, **then** version lineage is clearly linked.

## S4 Free Stock Asset Discovery
**Persona**: P1
**As a** solo creator, **I want** the system to gather relevant free stock assets, **so that** visual assembly stays cost-efficient.

### Acceptance Criteria (Given-When-Then)
1. **Given** a script segment, **when** asset discovery runs, **then** candidate free stock assets are retrieved and ranked.
2. **Given** provider quotas are limited, **when** discovery executes, **then** fallback providers are attempted automatically.
3. **Given** assets are selected, **when** discovery ends, **then** source attribution metadata is stored with each asset.

## S5 Free AI Asset Generation
**Persona**: P1
**As a** solo creator, **I want** free AI generation to supplement missing visuals, **so that** each scene can be completed without paid tools.

### Acceptance Criteria (Given-When-Then)
1. **Given** insufficient stock coverage for a scene, **when** AI asset generation runs, **then** generated assets are created using configured free-tier providers.
2. **Given** generation constraints (style, aspect), **when** assets are generated, **then** outputs conform to requested visual constraints.
3. **Given** provider failure, **when** generation retries exhaust, **then** the run records unresolved scene gaps for recovery.

## S6 Hybrid Asset Selection Policy
**Persona**: P1
**As a** solo creator, **I want** automatic selection across stock and AI assets, **so that** final scene quality remains consistent.

### Acceptance Criteria (Given-When-Then)
1. **Given** both stock and generated candidates, **when** selection executes, **then** the system applies a quality-and-relevance scoring policy.
2. **Given** quality ties, **when** ranking is equal, **then** lower-cost/free-first preference is applied deterministically.
3. **Given** selection completes, **when** scene plans are generated, **then** chosen assets and rejection reasons are recorded.

## S7 Scene Timeline Assembly
**Persona**: P1
**As a** solo creator, **I want** scene sequencing and timing generated automatically, **so that** I receive coherent short-form pacing.

### Acceptance Criteria (Given-When-Then)
1. **Given** script and selected assets, **when** timeline assembly runs, **then** scene order aligns with script narrative flow.
2. **Given** platform duration limits, **when** assembly completes, **then** total scene timing stays within each platform budget.
3. **Given** assembly output, **when** I inspect run artifacts, **then** per-scene timings and transitions are visible.

## S8 TikTok Export Package
**Persona**: P1
**As a** solo creator, **I want** a TikTok-ready package, **so that** I can upload quickly with minimal edits.

### Acceptance Criteria (Given-When-Then)
1. **Given** render completes, **when** TikTok packaging runs, **then** output meets TikTok format constraints.
2. **Given** packaging succeeds, **when** artifacts are exported, **then** title, caption, and hashtag suggestions are included.
3. **Given** package validation fails, **when** checks run, **then** the system reports exact non-compliant fields.

## S9 YouTube Shorts Export Package
**Persona**: P1
**As a** solo creator, **I want** a YouTube Shorts-ready package, **so that** I can publish to Shorts without rework.

### Acceptance Criteria (Given-When-Then)
1. **Given** render completes, **when** Shorts packaging runs, **then** output matches Shorts video and metadata requirements.
2. **Given** packaging completes, **when** export finishes, **then** platform-specific metadata templates are generated.
3. **Given** invalid settings, **when** package validation runs, **then** corrections are suggested.

## S10 Instagram Reels Export Package
**Persona**: P1
**As a** solo creator, **I want** an Instagram Reels-ready package, **so that** manual upload is immediate.

### Acceptance Criteria (Given-When-Then)
1. **Given** render completes, **when** Reels packaging runs, **then** output meets Reels format constraints.
2. **Given** packaging succeeds, **when** export is generated, **then** caption variants include CTA-ready options.
3. **Given** validation issues, **when** checks run, **then** the system flags format mismatches before finalization.

## S11 Multi-Platform Packaging Orchestration
**Persona**: P1
**As a** solo creator, **I want** all platform packages generated in one run, **so that** distribution prep is consolidated.

### Acceptance Criteria (Given-When-Then)
1. **Given** selected platforms include TikTok, Shorts, and Reels, **when** packaging orchestration runs, **then** all three packages are generated in one workflow.
2. **Given** one platform fails packaging, **when** orchestration completes, **then** successful platform artifacts are still preserved.
3. **Given** packaging summary output, **when** I review run status, **then** pass/fail by platform is clearly reported.

## S12 Stage-Level Progress Visibility
**Persona**: P1
**As a** solo creator, **I want** real-time stage status in CLI output, **so that** I can track pipeline health.

### Acceptance Criteria (Given-When-Then)
1. **Given** a run in progress, **when** each stage starts and ends, **then** CLI status updates are emitted with timestamps.
2. **Given** a stage error, **when** failure occurs, **then** status output includes failed stage, reason code, and next recovery action.
3. **Given** run completion, **when** summary prints, **then** total completion ratio and elapsed duration are displayed.

## S13 Artifact Manifest and Traceability
**Persona**: P1
**As a** solo creator, **I want** a complete artifact manifest for each run, **so that** I can audit and reproduce outcomes.

### Acceptance Criteria (Given-When-Then)
1. **Given** any completed stage, **when** artifacts are written, **then** they are indexed in a run manifest.
2. **Given** versioned outputs, **when** I query manifest data, **then** artifact lineage links parent/child versions.
3. **Given** reruns, **when** manifests are compared, **then** parameter differences are recorded.

## S14 Repeatable Run Profiles
**Persona**: P1
**As a** solo creator, **I want** reusable run profiles, **so that** I can execute repeatable workflows at scale.

### Acceptance Criteria (Given-When-Then)
1. **Given** a saved profile, **when** I launch a new run, **then** profile defaults are applied automatically.
2. **Given** profile overrides, **when** command executes, **then** overrides are applied and logged without mutating the base profile.
3. **Given** repeated execution, **when** I compare outputs, **then** run settings explain expected variation or reproducibility.

## S15 Stage Retry for Transient Failures
**Persona**: P1
**As a** solo creator, **I want** automatic and manual retry controls, **so that** transient provider errors do not kill full runs.

### Acceptance Criteria (Given-When-Then)
1. **Given** a transient external provider failure, **when** retry policy is enabled, **then** the stage retries with backoff up to configured limits.
2. **Given** retries are exhausted, **when** stage ends, **then** the run transitions to recoverable-failed state.
3. **Given** manual retry command, **when** I target the failed stage, **then** rerun starts from that stage rather than from topic intake.

## S16 Partial Success and Recovery Resume
**Persona**: P1
**As a** solo creator, **I want** partial-success preservation and resume support, **so that** I never lose successful outputs from unaffected stages.

### Acceptance Criteria (Given-When-Then)
1. **Given** multi-platform packaging where one platform fails, **when** run ends, **then** successful platform packages remain accessible.
2. **Given** a recoverable failure, **when** resume is invoked, **then** only failed or downstream-invalidated stages are re-executed.
3. **Given** resumed completion, **when** final summary is generated, **then** it distinguishes original outputs from recovered outputs.

## S17 Full Stage Outcome Persistence and Reuse
**Persona**: P1
**As a** solo creator, **I want** every stage outcome persisted with a stable structure and manifest, **so that** I can inspect, reuse, and resume work without regeneration of unchanged stages.

### Acceptance Criteria (Given-When-Then)
1. **Given** any stage completes, **when** outputs are written, **then** inputs, intermediate artifacts, outputs, logs, and metadata are persisted to filesystem paths associated with the run ID and stage ID.
2. **Given** persisted artifacts exist, **when** I request inspection, **then** the system provides a machine-readable manifest that resolves artifact locations and lineage.
3. **Given** a new run can reuse compatible prior artifacts, **when** reuse mode is enabled, **then** unchanged stages are skipped and reused artifacts are linked in the new run summary.

## INVEST Compliance Summary
- **Independent**: Stories are sliceable by capability and can be implemented incrementally.
- **Negotiable**: Acceptance criteria focus on outcomes and constraints rather than hardcoded internals.
- **Valuable**: Each story delivers creator-visible value or reliability improvements.
- **Estimable**: Fine-grained scope supports practical effort estimation.
- **Small**: Stories are narrowly scoped to a single behavior/capability.
- **Testable**: Each story includes explicit Given-When-Then acceptance criteria.

## Persona Mapping Summary
- All stories S1-S17 map to Persona P1 (Solo Video Creator).
