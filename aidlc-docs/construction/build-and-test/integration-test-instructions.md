# Integration Test Instructions

## Purpose
Validate interactions across orchestration, content generation, composition, packaging, and platform-foundation services.

## Test Scenarios

### Scenario 1: Orchestration -> Content Intelligence
- Description: verify accepted start command progresses to script-generation invocation contract.
- Expected Results:
  - Run command accepted with deterministic idempotency replay semantics.
  - Script artifact references can be persisted for downstream stages.

### Scenario 2: Content Intelligence -> Media Composition
- Description: verify generated scripts drive timeline assembly inputs.
- Expected Results:
  - Composition service consumes script content and produces timeline outputs.
  - Output is compatible with packaging input requirements.

### Scenario 3: Media Composition -> Platform Packaging
- Description: verify timeline artifacts flow into single and multi-platform packaging.
- Expected Results:
  - Platform bundles are produced for configured targets.
  - Partial platform failure does not invalidate successful packages.

### Scenario 4: Pipeline Units -> Platform Foundation (UOW-5)
- Description: verify each stage can persist artifacts and register manifest/telemetry data.
- Expected Results:
  - Persisted artifacts are versioned and queryable by run/stage.
  - Run manifest contains lineage and stage-parameter snapshots.
  - Telemetry summary reflects stage and artifact events.

## Setup Integration Test Environment

### 1. Start Required Services
```bash
docker compose up -d postgres redis
npm run dev
```

### 2. Configure Service Endpoints
```bash
# Example PowerShell
$env:API_URL = "http://localhost:3000"
$env:ORCH_BEARER_TOKEN = "dev-local-token"
```

## Run Integration Tests

### 1. Execute Integration Test Suite
```bash
# Current project keeps integration-like checks inside Vitest suites
npm test
```

### 2. Verify Service Interactions
- Validate cross-unit handoff contracts from UOW-1 through UOW-5.
- Validate idempotent replay and retry/resume decisioning.
- Validate artifact-manifest-telemetry consistency.

### 3. Cleanup
```bash
docker compose down
```
