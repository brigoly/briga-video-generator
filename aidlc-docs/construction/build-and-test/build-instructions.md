# Build Instructions

## Prerequisites
- Build Tool: Node.js 20.x + npm 10.x (or newer)
- Dependencies: package.json dependencies and devDependencies
- Environment Variables:
  - NODE_ENV
  - PORT
  - ORCH_BEARER_TOKEN
  - STATUS_CACHE_TTL_SECONDS
- System Requirements:
  - OS: Windows/macOS/Linux
  - Memory: >= 4 GB
  - Disk: >= 1 GB free

## Windows PowerShell Note
- If PowerShell execution policy blocks npm script shims, execute npm via cmd:
```bash
cmd /c npm run <script>
```

## Build Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp config/env.template .env
# On Windows PowerShell, copy manually if cp alias is unavailable:
# Copy-Item config/env.template .env
```

### 3. Build All Units
```bash
npm run build
```

### 4. Verify Build Success
- Expected Output:
  - TypeScript compilation completes without errors.
  - Dist output folder is generated.
- Build Artifacts:
  - dist/src/uow-1-experience-orchestration/**
  - dist/src/uow-2-content-intelligence/**
  - dist/src/uow-3-media-composition/**
  - dist/src/uow-4-platform-packaging/**
  - dist/src/uow-5-platform-foundation/**
  - dist/src/shared-contracts/**
- Common Warnings:
  - Vite CJS API deprecation warning may appear in test runs; build remains valid.

## Troubleshooting

### Build Fails with Dependency Errors
- Cause:
  - Node.js/npm not installed or not in PATH.
  - Corrupted local dependency tree.
- Solution:
  1. Verify Node/npm availability (`node -v`, `npm -v`).
  2. Remove node_modules and lockfile if needed.
  3. Re-run npm install.

### Build Fails with Compilation Errors
- Cause:
  - Type mismatch from local changes.
  - Missing environment assumptions in new code.
- Solution:
  1. Run editor diagnostics and fix reported files.
  2. Re-run npm run build.
  3. If failures persist, run tests to isolate regressions.

## Verified Post-UOW-5 Result
- Latest successful compile: 2026-05-26T20:18:23Z
- Command used: `npm run build`
