# Security Test Instructions

## Purpose
Validate authentication, authorization, and input-hardening baseline for orchestration and extension APIs.

## Security Tests

### 1. Authentication Tests
- Missing bearer token returns 401.
- Invalid bearer token returns 401.
- Valid bearer token allows request progression.

### 2. Authorization Tests
- Run-scope endpoints require runId path value.
- Requests without required run scope fail with expected error code.

### 3. Input Validation Tests
- Invalid command types rejected.
- Missing runId for resume/retry/status/inspect rejected.
- Invalid idempotency key rejected.
- Invalid platform package payloads rejected by service/API guards.
- Invalid foundation retry/resume payloads rejected by service/API guards.

### 4. Dependency and Supply Chain Scan
```bash
npm audit --production
```

### 5. Secret Handling Verification
- Ensure no hard-coded secrets in source files.
- Ensure env-template driven configuration only.

### 6. Filesystem Persistence Hardening
- Ensure artifact paths are sanitized before filesystem writes.
- Ensure run/stage isolation in persistence directory structure.
- Ensure manifest and telemetry files are written under run-scoped paths.

## Execution
```bash
npm test
```

PowerShell fallback:
```bash
cmd /c npm run test
```
