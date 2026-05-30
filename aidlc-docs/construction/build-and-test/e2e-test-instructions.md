# End-to-End Test Instructions

## Purpose
Validate complete workflow from run start through script generation, composition, packaging, and persistent foundation outputs.

## Workflow Scenarios

### Scenario 1: Start -> Status -> Inspect (Run Control)
1. Start API service.
2. Submit start command with bearer token and idempotency key.
3. Poll status endpoint for runId.
4. Call inspect endpoint for same runId.
5. Validate response fields and state consistency.

### Scenario 2: Packaging Fan-out
1. Submit a multi-platform packaging request.
2. Validate package outputs include TikTok, YouTube Shorts, and Instagram Reels.
3. Validate partial-success behavior preserves successful platform packages.

### Scenario 3: Foundation Persistence and Recovery Controls
1. Persist stage artifacts through foundation API.
2. Query run manifest and validate artifact lineage entries.
3. Submit retry-decision and resume-plan requests.
4. Validate returned decisions align with retryability and failed-stage positions.

### Scenario 4: Idempotent Replay
1. Submit start command.
2. Re-submit identical command with same idempotency key.
3. Validate replay response returns same runId and 200 status.

## Execution
```bash
npm run dev
# then run API-driven e2e script or manual curl/postman flow
```

## Expected Outcomes
- Endpoints enforce auth and validation rules.
- State remains deterministic across retries/replays.
- Status and inspect reflect current orchestration view.
- Packaging outputs and foundation manifest/telemetry data remain consistent for the same run.
