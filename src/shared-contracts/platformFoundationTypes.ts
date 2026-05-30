export type ArtifactKind = "input" | "intermediate" | "output" | "log" | "metadata";

export interface ArtifactWriteRequest {
  runId: string;
  stageId: string;
  artifactKind: ArtifactKind;
  artifactName: string;
  payload: unknown;
  parentArtifactId?: string;
  reusedFromRunId?: string;
  parameters?: Record<string, unknown>;
}

export interface StoredArtifact {
  artifactId: string;
  runId: string;
  stageId: string;
  artifactKind: ArtifactKind;
  artifactName: string;
  version: number;
  path: string;
  checksum: string;
  createdAt: string;
  parentArtifactId?: string;
  reusedFromRunId?: string;
}

export interface ManifestLineageEdge {
  parentArtifactId: string;
  childArtifactId: string;
}

export interface StageParameterSnapshot {
  stageId: string;
  parameters: Record<string, unknown>;
  updatedAt: string;
}

export interface RunManifest {
  runId: string;
  updatedAt: string;
  artifacts: StoredArtifact[];
  lineage: ManifestLineageEdge[];
  stageParameters: StageParameterSnapshot[];
}

export interface ManifestComparison {
  baseRunId: string;
  candidateRunId: string;
  addedArtifacts: string[];
  removedArtifacts: string[];
  changedParameters: Array<{
    stageId: string;
    base: Record<string, unknown>;
    candidate: Record<string, unknown>;
  }>;
}

export type RetryDecisionType = "RetryNow" | "RetryAfterDelay" | "RetryExhausted";

export interface RetryPolicyInput {
  attempt: number;
  maxAttempts: number;
  retryable: boolean;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface RetryPolicyDecision {
  decisionType: RetryDecisionType;
  delayMs: number;
  reasonCode: string;
  nextAttempt: number;
}

export type ResumeStageState =
  | "succeeded"
  | "failed-retryable"
  | "failed-terminal"
  | "pending"
  | "skipped-by-reuse";

export interface ResumePlanInput {
  stageOrder: string[];
  stageStates: Record<string, ResumeStageState>;
  failedStageId?: string;
}

export interface ResumePlan {
  stagesToExecute: string[];
  reusedStages: string[];
  blockedReason?: string;
}

export type TelemetryEventType =
  | "RunStarted"
  | "RunCompleted"
  | "StageStarted"
  | "StageCompleted"
  | "StageFailed"
  | "ArtifactPersisted";

export interface TelemetryEvent {
  runId: string;
  stageId: string;
  eventType: TelemetryEventType;
  message?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySummary {
  runId: string;
  totalEvents: number;
  eventCounts: Partial<Record<TelemetryEventType, number>>;
  failedStages: string[];
  elapsedMs?: number;
}
