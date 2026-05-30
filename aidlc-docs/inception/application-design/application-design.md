# Application Design Summary

## Scope
This document consolidates high-level application design for the CLI-first, multi-stage short-video generation system.

## Inputs
- Requirements: persistence/reuse, reliability, free-tier-first, multi-platform packaging
- User stories: S1-S17 with emphasis on automation completion, retry/resume, and artifact discoverability
- Approved design choices in application-design-plan.md

## Approved Design Decisions
- Component boundary style: hybrid stage-oriented domain components with layered internals
- Provider integration: separate adapter by provider type with shared contracts
- Persistence model: stage-local writes with centralized manifest/index service
- Orchestration model: orchestrator core with event hooks and checkpoint resumes
- Packaging model: shared core packaging with thin platform-specific extensions
- Contract strictness: strong contracts for core stages, flexible integration edges
- Retry/resume model: central coordinator with stage-overridable retry policies
- Canonical data flow: artifact-centric manifest-driven stage handoff
- Observability model: local logs + centralized telemetry aggregation
- Design readiness target: ready for units planning and immediate functional-design kickoff

## Component Set
- CLI Gateway
- Run Orchestrator
- Topic and Script Component
- Asset Sourcing Component
- Timeline and Composition Component
- Packaging Component
- Artifact Store Component
- Run Manifest Component
- Retry and Resume Coordinator
- Telemetry Aggregator

See details in [components.md](components.md).

## Service Layer
- Run Lifecycle Service
- Stage Execution Service
- Provider Integration Service
- Artifact Persistence Service
- Run Manifest Service
- Run Reuse Service
- Packaging Service
- Telemetry Service

See details in [services.md](services.md).

## Interface and Method Contracts
High-level contracts are defined for all components, with deeper business-rule detail deferred to Functional Design.

See [component-methods.md](component-methods.md).

## Dependency and Data Flow
The architecture combines deterministic request-response orchestration with artifact-centric handoff and manifest indexing for inspectability and reuse.

See [component-dependency.md](component-dependency.md).

## Consistency Validation
- Requirements alignment:
  - FR-10/NFR-7 addressed by Artifact Store + Run Manifest + deterministic path conventions
  - NFR-2 addressed by Retry and Resume Coordinator
  - FR-5/FR-6 addressed by Packaging Component and platform extensions
- User story alignment:
  - S13/S17 addressed by manifest and artifact lineage model
  - S15/S16 addressed by central retry/resume coordination
- Design readiness:
  - Sufficiently specified for units planning and functional design handoff
