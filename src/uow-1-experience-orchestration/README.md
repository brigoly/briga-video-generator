# UOW-1 Experience and Orchestration

## Purpose
UOW-1 owns run-control command handling and orchestration lifecycle transitions for the video-generation workflow.

## Commands
- start
- resume
- retry
- status
- inspect

## Local Run
1. Copy config/env.template to .env and adjust values.
2. Install dependencies: npm install
3. Start API: npm run dev

## Example Request
POST /v1/runs/start
- Header: Authorization: Bearer <token>
- Header: x-idempotency-key: <key>
- Body:
  {
    "payload": {
      "topic": "AI movie trailers"
    }
  }

## Contracts
- Input contract: CommandEnvelope
- Output contract: RunStateView and command response payload
- Shared contracts location: src/shared-contracts/
