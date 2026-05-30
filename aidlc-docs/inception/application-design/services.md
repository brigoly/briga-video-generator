# Services

## Service Layer Overview
The service layer follows a hybrid orchestration model: a central orchestrator core controls deterministic stage progression while event hooks support observability and extensibility.

## SVC1 Run Lifecycle Service
### Responsibilities
- Start, stop, retry, and resume run lifecycles
- Validate transitions between run states
- Provide run summary outputs

### Collaborators
- Run Orchestrator
- Retry and Resume Coordinator
- Run Manifest Service

## SVC2 Stage Execution Service
### Responsibilities
- Execute stage contracts in sequence
- Marshal stage inputs/outputs
- Trigger stage-local persistence actions

### Collaborators
- Topic and Script Component
- Asset Sourcing Component
- Timeline and Composition Component
- Packaging Component
- Artifact Store Component

## SVC3 Provider Integration Service
### Responsibilities
- Route requests to provider-specific adapters
- Enforce shared integration contracts
- Handle provider capability and fallback selection

### Collaborators
- Script provider adapters
- Stock media adapters
- AI media adapters

## SVC4 Artifact Persistence Service
### Responsibilities
- Perform deterministic stage-local writes
- Manage artifact metadata and references
- Serve artifact inspection and retrieval requests

### Collaborators
- Artifact Store Component
- Run Manifest Service

## SVC5 Run Manifest Service
### Responsibilities
- Maintain machine-readable run and stage index
- Track lineage and reuse links
- Resolve artifact discovery queries

### Collaborators
- Artifact Persistence Service
- Run Reuse Service

## SVC6 Run Reuse Service
### Responsibilities
- Evaluate reuse eligibility across prior runs
- Build reuse plans for unchanged stages
- Link reused artifacts into current run summary

### Collaborators
- Run Manifest Service
- Run Orchestrator

## SVC7 Packaging Service
### Responsibilities
- Apply shared packaging core
- Apply platform-specific extension logic
- Run platform package validation

### Collaborators
- Packaging Component
- Telemetry Service

## SVC8 Telemetry Service
### Responsibilities
- Aggregate component logs/events/metrics
- Publish stage and run diagnostics
- Provide audit-oriented operational summaries

### Collaborators
- Telemetry Aggregator
- Run Lifecycle Service

## Orchestration Pattern
- Command enters through CLI Gateway to Run Lifecycle Service.
- Run Lifecycle Service invokes Stage Execution Service via Run Orchestrator.
- Stage Execution Service calls domain components and writes artifacts through Artifact Persistence Service.
- Run Manifest Service indexes outputs and lineage.
- Retry/Resume decisions are made centrally via Retry and Resume Coordinator.
- Telemetry Service continuously records lifecycle and stage events.
