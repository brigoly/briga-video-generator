# Component Methods

## Method Contract Notes
- Method signatures are high-level contracts for Application Design.
- Detailed business rules and validation logic are deferred to Functional Design.
- Strong contracts are mandatory for core stage I/O; provider edge contracts may stay adaptable.

## C1 CLI Gateway
- `parseCommand(argv) -> Command`
  - Parse raw command input into normalized command model.
- `executeCommand(command, context) -> CommandResult`
  - Dispatch validated command to orchestrator-facing services.

## C2 Run Orchestrator
- `startRun(command, profile) -> RunStartResult`
  - Initialize run context and execute stage graph.
- `resumeRun(runId, resumeOptions) -> ResumeResult`
  - Continue execution from computed checkpoint.
- `executeStage(runId, stageId, stageInput) -> StageResult`
  - Execute one stage and persist outputs.
- `finalizeRun(runId) -> RunSummary`
  - Build final status and artifact summary.

## C3 Topic and Script Component
- `generateScript(topicInput, platformProfiles) -> ScriptArtifact`
  - Produce initial scripts per platform profile.
- `regenerateScript(runId, styleDelta) -> ScriptVariantArtifact`
  - Produce variant scripts tied to previous lineage.

## C4 Asset Sourcing Component
- `discoverStockAssets(scriptArtifact, constraints) -> StockAssetSet`
  - Discover and rank stock assets.
- `generateAiAssets(gapSpec, constraints) -> AiAssetSet`
  - Generate AI assets for uncovered scenes.
- `selectAssets(stockSet, aiSet, policy) -> SelectedAssetSet`
  - Resolve final asset assignment by policy.

## C5 Timeline and Composition Component
- `buildTimeline(scriptArtifact, selectedAssets, platformProfile) -> TimelineArtifact`
  - Construct ordered scene timeline.
- `validateTiming(timelineArtifact, platformProfile) -> TimingValidationResult`
  - Verify duration and pacing constraints.

## C6 Packaging Component
- `packageForPlatform(renderedOutput, platformProfile, metadataInput) -> PackageArtifact`
  - Create platform package with metadata bundle.
- `validatePackage(packageArtifact, platformProfile) -> PackageValidationResult`
  - Validate format and metadata constraints.

## C7 Artifact Store Component
- `writeArtifact(runId, stageId, artifactType, payload, metadata) -> ArtifactRef`
  - Persist artifact and return stable reference.
- `readArtifact(artifactRef) -> ArtifactPayload`
  - Fetch persisted artifact payload.
- `listArtifacts(runId, filters) -> ArtifactRef[]`
  - Query artifacts in deterministic run/stage paths.

## C8 Run Manifest Component
- `recordManifestEntry(runId, stageId, artifactRef, lineage) -> ManifestEntry`
  - Add index entry for artifact discovery.
- `getRunManifest(runId) -> RunManifest`
  - Retrieve full run manifest.
- `findReusableArtifacts(reuseCriteria) -> ReuseCandidate[]`
  - Locate compatible prior artifacts.

## C9 Retry and Resume Coordinator
- `evaluateRetry(stageFailure, policy, stageOverrides) -> RetryDecision`
  - Determine retry action and delay.
- `computeResumePlan(runId, failedStage, invalidationRules) -> ResumePlan`
  - Compute minimal safe stage restart plan.

## C10 Telemetry Aggregator
- `emitEvent(runId, stageId, event) -> void`
  - Emit structured lifecycle event.
- `recordMetric(runId, stageId, metric) -> void`
  - Persist metric for diagnostics.
- `buildRunSummary(runId) -> TelemetrySummary`
  - Produce aggregate run-level telemetry summary.
