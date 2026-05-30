# UOW-1 Code Generation Plan - Experience and Orchestration

## Plan Purpose
Single source of truth for UOW-1 implementation sequencing, story traceability, and code/test artifact generation.

## Unit Context
- Unit: UOW-1 Experience and Orchestration
- Primary stories owned by unit:
  - S1 Topic Intake Command
  - S12 Stage-Level Progress Visibility
  - S14 Repeatable Run Profiles
- Supporting responsibilities:
  - Orchestration control contracts consumed by UOW-2/UOW-3/UOW-4
  - Integration points with UOW-5 for persistence, manifest, and telemetry
- Unit dependencies:
  - Hard dependency on UOW-5 shared contracts and adapters

## Workspace and Code Location
- Workspace root: c:/Users/brigpa01/workspaces/briga-video-generator
- Project type: Greenfield, multi-unit monorepo style
- Application code target (never in aidlc-docs):
  - src/uow-1-experience-orchestration/
  - tests/uow-1-experience-orchestration/
  - src/shared-contracts/
  - config/

## Database Entities Owned by UOW-1
- UOW-1 owned logical entities:
  - RunControlCommand
  - OrchestrationRunStateView
  - RunProfileSnapshot
  - CommandIdempotencyRecord
- Shared or externally owned entities:
  - Artifact manifest and artifact persistence records (owned by UOW-5 interfaces)

## Interfaces and Contracts
- Inbound:
  - CLI/API run-control requests for start/resume/retry/status/inspect
- Outbound:
  - Stage invocation contracts toward UOW-2/UOW-3/UOW-4
  - Shared persistence/manifest/telemetry interfaces toward UOW-5

## Detailed Execution Steps

### Step 1: Project Structure Setup (Greenfield)
- [x] Create unit source and test folders under workspace root
- [x] Create base module entrypoints for UOW-1
- [x] Create shared contract stubs required by UOW-1 orchestration control
- Story mapping: S1, S12, S14

### Step 2: Business Logic Generation - Command Intake and Orchestration Core
- [x] Implement command envelope validation and normalization
- [x] Implement orchestration lifecycle state transition service
- [x] Implement idempotency resolver abstractions and command replay protection hooks
- Story mapping: S1, S12

### Step 3: Business Logic Unit Testing - Core Orchestration
- [x] Add unit tests for command validation and transition guards
- [x] Add property-based tests for idempotency and transition invariants
- [x] Add retry policy and recoverable-failure decision tests
- Story mapping: S1, S12

### Step 4: Business Logic Summary
- [x] Create markdown summary of generated orchestration logic in aidlc-docs/construction/uow-1-experience-orchestration/code/
- [x] Include traceability to S1/S12/S14 and NFR constraints

### Step 5: API Layer Generation
- [x] Implement REST handlers for start/resume/retry/status/inspect
- [x] Implement request authn/authz middleware integration points
- [x] Implement fast-ack command submission and async dispatch contract
- Story mapping: S1, S12

### Step 6: API Layer Unit Testing
- [x] Add handler tests for status codes, validation failures, and idempotent replay responses
- [x] Add authorization boundary tests for run-level permissions
- Story mapping: S1, S12

### Step 7: API Layer Summary
- [x] Create API generation summary in aidlc-docs/construction/uow-1-experience-orchestration/code/
- [x] Include contract surfaces and dependency expectations

### Step 8: Repository Layer Generation
- [x] Implement run state repository interfaces and PostgreSQL adapter skeleton
- [x] Implement checkpoint repository interface with pluggable backend abstraction
- [x] Implement status cache abstraction and invalidation hooks
- Story mapping: S12, S14

### Step 9: Repository Layer Unit Testing
- [x] Add repository contract tests and in-memory adapter tests
- [x] Add cache invalidation and read-through behavior tests
- Story mapping: S12, S14

### Step 10: Repository Layer Summary
- [x] Create repository generation summary in aidlc-docs/construction/uow-1-experience-orchestration/code/
- [x] Document UOW-5 integration assumptions

### Step 11: Run Profiles and Configuration Generation
- [x] Implement run profile baseline loader and override merger
- [x] Implement effective configuration hashing and provenance capture
- [x] Add configuration validation rules and error taxonomy mapping
- Story mapping: S14

### Step 12: Run Profiles Testing and Summary
- [x] Add tests for immutable baseline profile behavior and override auditability
- [x] Add summary markdown for profile subsystem in aidlc-docs/construction/uow-1-experience-orchestration/code/
- Story mapping: S14

### Step 13: Documentation Generation
- [x] Create UOW-1 README with usage examples and contracts
- [x] Create API contract docs for run-control operations
- [x] Create operational runbook stub for common failure/recovery scenarios

### Step 14: Deployment Artifacts Generation
- [x] Create local Docker Compose service definitions for API and worker stubs
- [x] Create environment variable template and configuration docs
- [x] Create CI-friendly test execution script definitions

### Step 15: Plan Completion and Readiness Check
- [x] Verify all prior steps are complete and checkboxes marked
- [x] Verify story coverage (S1/S12/S14) and contract boundaries
- [x] Confirm unit readiness for Build and Test stage integration

## Story Traceability Matrix
- S1 -> Steps 1, 2, 3, 5, 6
- S12 -> Steps 1, 2, 3, 5, 6, 8, 9
- S14 -> Steps 1, 8, 9, 11, 12

## Approval and Execution Status
- [x] Part 1 planning completed
- [x] Approval prompt and approval response recorded via autonomous continuation directive
- [x] Part 2 implementation completed for UOW-1 (tests/build execution pending local Node.js/npm availability)

## Estimated Scope
- 15 execution steps
- Source/test/documentation/deployment artifacts all covered
- Ready to begin implementation immediately from Step 1
