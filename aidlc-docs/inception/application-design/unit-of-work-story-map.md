# Unit of Work Story Map

## Mapping Rules
- Every story maps to exactly one primary unit owner
- Supporting dependencies are noted where cross-unit collaboration is required
- All stories S1-S17 are mapped

## Story-to-Unit Assignment

| Story ID | Story Name | Primary Unit | Supporting Units |
|---|---|---|---|
| S1 | Topic Intake Command | UOW-1 Experience and Orchestration | UOW-5 |
| S2 | Script Generation from Topic | UOW-2 Content Intelligence | UOW-1, UOW-5 |
| S3 | Script Variant Regeneration | UOW-2 Content Intelligence | UOW-1, UOW-5 |
| S4 | Free Stock Asset Discovery | UOW-3 Media Composition | UOW-5 |
| S5 | Free AI Asset Generation | UOW-3 Media Composition | UOW-5 |
| S6 | Hybrid Asset Selection Policy | UOW-3 Media Composition | UOW-5 |
| S7 | Scene Timeline Assembly | UOW-3 Media Composition | UOW-5 |
| S8 | TikTok Export Package | UOW-4 Platform Packaging | UOW-3, UOW-5 |
| S9 | YouTube Shorts Export Package | UOW-4 Platform Packaging | UOW-3, UOW-5 |
| S10 | Instagram Reels Export Package | UOW-4 Platform Packaging | UOW-3, UOW-5 |
| S11 | Multi-Platform Packaging Orchestration | UOW-4 Platform Packaging | UOW-1, UOW-3, UOW-5 |
| S12 | Stage-Level Progress Visibility | UOW-1 Experience and Orchestration | UOW-5 |
| S13 | Artifact Manifest and Traceability | UOW-5 Platform Foundation | UOW-1, UOW-2, UOW-3, UOW-4 |
| S14 | Repeatable Run Profiles | UOW-1 Experience and Orchestration | UOW-5 |
| S15 | Stage Retry for Transient Failures | UOW-5 Platform Foundation | UOW-1, UOW-2, UOW-3, UOW-4 |
| S16 | Partial Success and Recovery Resume | UOW-5 Platform Foundation | UOW-1, UOW-2, UOW-3, UOW-4 |
| S17 | Full Stage Outcome Persistence and Reuse | UOW-5 Platform Foundation | UOW-1, UOW-2, UOW-3, UOW-4 |

## Coverage Validation
- Stories mapped: 17 of 17
- Unmapped stories: none
- Unit utilization:
  - UOW-1 primary stories: S1, S12, S14
  - UOW-2 primary stories: S2, S3
  - UOW-3 primary stories: S4, S5, S6, S7
  - UOW-4 primary stories: S8, S9, S10, S11
  - UOW-5 primary stories: S13, S15, S16, S17

## Generation Readiness
- Mapping supports unit-first execution with clear ownership
- Cross-unit dependencies are explicit and traceable
- Ready for transition to construction-phase per-unit design
