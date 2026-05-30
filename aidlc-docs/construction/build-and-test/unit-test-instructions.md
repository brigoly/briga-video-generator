# Unit Test Execution

## Run Unit Tests

### 1. Execute All Unit Tests
```bash
npm test
```

PowerShell fallback when npm script policy is restricted:
```bash
cmd /c npm run test
```

### 2. Review Test Results
- Expected: all discovered tests pass, 0 failures.
- Test Coverage:
  - Target threshold for core orchestration/foundation modules: >= 85%.
  - Property-based tests present for idempotency invariants.
- Test Report Location:
  - Console output (Vitest default)
  - Optional coverage outputs if coverage is enabled in config.

### 3. Fix Failing Tests
If tests fail:
1. Review test output and identify failing suites.
2. Fix implementation or test assumptions.
3. Re-run npm test until all pass.

## Focus Areas for UOW-1
- Command validation and transition guards.
- Idempotency replay behavior.
- Retry policy outcomes.
- API auth boundaries and handler behavior.
- Repository and cache contract behavior.

## Additional Focus Areas (UOW-2 to UOW-5)
- UOW-2: prompt construction, provider fallback routing, script variant lineage.
- UOW-3: asset selection policy, timeline assembly, composition persistence.
- UOW-4: platform packaging rules and multi-platform orchestration.
- UOW-5: artifact persistence/versioning, manifest lineage/comparison, retry/resume planning, telemetry summary.

## Verified Post-UOW-5 Result
- Latest test run: 2026-05-26T20:18:23Z
- Result: 23 test files passed, 39 tests passed, 0 failed.
