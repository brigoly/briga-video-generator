# Performance Test Instructions

## Purpose
Validate pipeline API performance and foundation-service behavior against non-functional targets.

## Performance Requirements
- Run-control Response Time: p95 < 500 ms.
- Packaging/Foundation API Response Time: p95 < 800 ms.
- Throughput: >= 120 requests/min steady, >= 300 requests/min burst.
- Concurrent Runs: support 100 steady concurrent runs, burst to 150.
- Error Rate: < 1% during normal load.

## Setup Performance Test Environment

### 1. Prepare Test Environment
```bash
docker compose up -d
npm run dev
```

### 2. Configure Test Parameters
- Test Duration: 10 minutes steady load.
- Ramp-up Time: 120 seconds.
- Virtual Users: start at 20, scale to 120.

## Run Performance Tests

### 1. Execute Load Tests
```bash
# Example using k6 profiles
k6 run perf/pipeline-load.js
```

### 2. Execute Stress Tests
```bash
# Example stress profile
k6 run perf/pipeline-stress.js
```

### 3. Analyze Performance Results
- Compare p95 latency against 500 ms target.
- Compare packaging/foundation endpoints against 800 ms target.
- Compare throughput against steady/burst targets.
- Review non-2xx error rates.
- Identify bottlenecks in idempotency lookup, artifact persistence, manifest writes, and telemetry emission.

## Performance Optimization
If targets are missed:
1. Profile API endpoints for hot paths.
2. Optimize state/cache lookups, manifest I/O, and payload handling.
3. Re-run load and stress suites.
