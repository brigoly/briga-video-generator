export type CommandType = "start" | "resume" | "retry" | "status" | "inspect";

export type RunState =
  | "Created"
  | "Validating"
  | "Running"
  | "Paused"
  | "RecoverableFailed"
  | "Completed"
  | "Cancelled";

export type StageSubState =
  | "Pending"
  | "Ready"
  | "InProgress"
  | "Succeeded"
  | "FailedRetryable"
  | "FailedTerminal"
  | "SkippedByReuse";

export interface CommandEnvelope {
  commandType: CommandType;
  idempotencyKey: string;
  runId?: string;
  payload: Record<string, unknown>;
  requestedAt: string;
}

export interface RunStateView {
  runId: string;
  runState: RunState;
  stageSubState: StageSubState;
  updatedAt: string;
  reasonCode?: string;
  recommendedAction?: string;
}

export interface RetryDecision {
  decisionType: "RetryNow" | "RetryAfterDelay" | "RetryExhausted";
  delayMs: number;
  reasonCode: string;
  severity: "low" | "medium" | "high";
}

export interface EffectiveConfiguration {
  baselineProfileRef: string;
  overridePatchRef?: string;
  effectiveConfigHash: string;
  mergeProvenance: string;
}

export interface CheckpointRecord {
  checkpointId: string;
  runId: string;
  stageId: string;
  checkpointType: "StageStart" | "StageComplete";
  stateSnapshotRef: string;
  createdAt: string;
}
