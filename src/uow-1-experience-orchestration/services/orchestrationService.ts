import { randomUUID } from "node:crypto";
import {
  CommandEnvelope,
  RunState,
  RunStateView,
  StageSubState,
  CheckpointRecord
} from "../../shared-contracts/types";
import { validateAndNormalizeCommand } from "../orchestration/commandValidator";
import { transitionRunState } from "../orchestration/stateMachine";
import {
  resolveIdempotency,
  IdempotencyStore
} from "../orchestration/idempotencyResolver";
import {
  CheckpointRepository,
  RunStateRepository,
  StatusCache
} from "../repositories/interfaces";

export interface OrchestrationDependencies {
  idempotencyStore: IdempotencyStore;
  runStateRepository: RunStateRepository;
  checkpointRepository: CheckpointRepository;
  statusCache: StatusCache;
  cacheTtlSeconds: number;
}

interface CommandResponse {
  runId: string;
  replayed: boolean;
  runState: RunState;
  stageSubState: StageSubState;
}

function nowIso(): string {
  return new Date().toISOString();
}

function commandToTargetState(commandType: CommandEnvelope["commandType"]): RunState {
  switch (commandType) {
    case "start":
      return "Validating";
    case "resume":
    case "retry":
      return "Running";
    case "status":
    case "inspect":
      return "Running";
    default:
      return "Running";
  }
}

function commandToStageSubState(commandType: CommandEnvelope["commandType"]): StageSubState {
  if (commandType === "status" || commandType === "inspect") {
    return "InProgress";
  }
  return "Ready";
}

export class OrchestrationService {
  constructor(private readonly deps: OrchestrationDependencies) {}

  async handleCommand(input: unknown): Promise<CommandResponse> {
    const command = validateAndNormalizeCommand(input);
    const idem = await resolveIdempotency(this.deps.idempotencyStore, command);
    if (idem.replayed && idem.response) {
      const replayResponse = idem.response as CommandResponse;
      return {
        ...replayResponse,
        replayed: true
      };
    }

    const runId = command.runId ?? randomUUID();
    const current = await this.deps.runStateRepository.get(runId);
    const fromState = current?.runState ?? "Created";
    const toState = commandToTargetState(command.commandType);
    const nextRunState = transitionRunState(fromState, toState);

    const nextView: RunStateView = {
      runId,
      runState: nextRunState,
      stageSubState: commandToStageSubState(command.commandType),
      updatedAt: nowIso(),
      reasonCode: "COMMAND_ACCEPTED",
      recommendedAction: "Check status for progress"
    };

    await this.deps.runStateRepository.upsert(nextView);
    await this.deps.statusCache.put(runId, nextView, this.deps.cacheTtlSeconds);

    const checkpoint: CheckpointRecord = {
      checkpointId: randomUUID(),
      runId,
      stageId: "uow-1-control",
      checkpointType: "StageStart",
      stateSnapshotRef: `run/${runId}/${nextView.updatedAt}`,
      createdAt: nowIso()
    };

    await this.deps.checkpointRepository.write(checkpoint);

    const response: CommandResponse = {
      runId,
      replayed: false,
      runState: nextView.runState,
      stageSubState: nextView.stageSubState
    };

    await this.deps.idempotencyStore.set({
      idempotencyKey: command.idempotencyKey,
      commandSignature: JSON.stringify({
        commandType: command.commandType,
        runId: command.runId ?? null,
        payload: command.payload
      }),
      response
    });

    return response;
  }

  async getStatus(runId: string): Promise<RunStateView | undefined> {
    const cached = await this.deps.statusCache.get(runId);
    if (cached) {
      return cached;
    }

    const state = await this.deps.runStateRepository.get(runId);
    if (state) {
      await this.deps.statusCache.put(runId, state, this.deps.cacheTtlSeconds);
    }
    return state;
  }
}
