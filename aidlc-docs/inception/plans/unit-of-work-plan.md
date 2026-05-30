# Unit of Work Plan

## Purpose
Decompose the system into manageable units of work with clear boundaries, dependencies, and story ownership so construction can proceed predictably.

## Planning Checklist
- [x] Analyze requirements, user stories, and application design context
- [x] Define unit decomposition objectives and assumptions
- [x] Include mandatory unit artifacts in this plan
- [x] Add context-appropriate decomposition questions with [Answer] tags
- [x] Store plan in aidlc-docs/inception/plans/unit-of-work-plan.md
- [x] Collect and validate all [Answer] entries
- [x] Analyze answers for ambiguity and contradictions
- [x] Add follow-up questions if needed and resolve all ambiguity
- [x] Log plan approval prompt in audit
- [x] Obtain explicit approval to proceed to units generation
- [x] Record approval response in audit

## Decomposition Assumptions
- Greenfield product with no pre-existing code
- Single creator persona in v1
- CLI-first operation model
- Artifact persistence and reuse are mandatory
- Multi-platform packaging targets TikTok, YouTube Shorts, Instagram Reels

## Mandatory Unit Artifact Plan
- [x] Generate aidlc-docs/inception/application-design/unit-of-work.md with unit definitions and responsibilities
- [x] Generate aidlc-docs/inception/application-design/unit-of-work-dependency.md with dependency matrix
- [x] Generate aidlc-docs/inception/application-design/unit-of-work-story-map.md mapping stories to units
- [x] Document greenfield code organization strategy in unit-of-work.md
- [x] Validate unit boundaries and dependency consistency
- [x] Ensure all stories are mapped to units

## Units Planning Questions

## Question 1
What primary unit decomposition strategy should we use?

A) Capability-based units (ingestion, generation, packaging, persistence)
B) Pipeline-stage units (topic, script, assets, timeline, packaging, persistence)
C) Hybrid capability + pipeline units
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 2
How many units should v1 target for delivery?

A) 3 units (coarse-grained)
B) 4-5 units (balanced)
C) 6+ units (fine-grained)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
How should persistence/reuse responsibilities be assigned?

A) Dedicated persistence unit only
B) Embedded in each unit only
C) Hybrid: dedicated persistence unit + unit-local adapters
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
What dependency shape should unit design prefer?

A) Strict sequential dependencies only
B) Mostly sequential with controlled parallel branches
C) Event-oriented dependencies with checkpoint orchestration
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 5
How should provider integrations be grouped into units?

A) One shared integration unit for all providers
B) Split by provider type (LLM, stock media, AI media)
C) Split by owning domain unit with shared adapter contracts
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 6
How should platform packaging work be decomposed?

A) Single packaging unit with strategy extensions
B) One packaging unit per platform
C) Shared core packaging unit + separate platform extension unit
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 7
What team/ownership model should units assume?

A) Single team owns all units
B) Core pipeline team + integration specialist ownership split
C) Unit-by-unit ownership ready for multiple teams later
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
How should code organization be documented for greenfield implementation?

A) Monorepo with one package per unit
B) Monorepo with app core + unit modules
C) Single package with logical unit folders and strict boundaries
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 9
How should cross-cutting concerns (retry, telemetry, validation) be represented?

A) Dedicated cross-cutting unit only
B) Duplicated in each unit
C) Shared cross-cutting unit plus unit-level hooks
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 10
What readiness level should units planning target before generation?

A) Unit names and rough scope only
B) Unit scope + dependencies + full story mapping
C) Unit scope + dependencies + story mapping + initial code organization guidance
X) Other (please describe after [Answer]: tag below)

[Answer]: C
