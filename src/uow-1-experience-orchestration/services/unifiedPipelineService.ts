import { randomUUID } from "node:crypto";
import { RunStateView } from "../../shared-contracts/types";
import { ScriptArtifact } from "../../shared-contracts/contentIntelligenceTypes";
import { MediaAsset, TimelineArtifact } from "../../shared-contracts/mediaCompositionTypes";
import { PlatformPackage } from "../../shared-contracts/platformPackagingTypes";
import { ScriptGenerationService } from "../../uow-2-content-intelligence/services/scriptGenerationService";
import { MediaCompositionService } from "../../uow-3-media-composition/services/mediaCompositionService";
import { MultiPlatformPackagingService } from "../../uow-4-platform-packaging/services/multiPlatformOrchestrator";
import { PublishReceipt } from "../../uow-4-platform-packaging/providers/publishers";
import { CheckpointRepository, RunStateRepository, StatusCache } from "../repositories/interfaces";
import {
  InMemoryPipelineStatusStore,
  PipelineStatusStore
} from "./pipelineStatusStore";

interface PipelineStartInput {
  runId?: string;
  topic: string;
  title?: string;
  hashtags?: string[];
  platformProfile?: "tiktok" | "youtube-shorts" | "instagram-reels";
  platforms?: Array<"tiktok" | "youtube-shorts" | "instagram-reels">;
  enablePublishing?: boolean;
}

interface PipelineStartResponse {
  runId: string;
  runState: RunStateView["runState"];
  stageSubState: RunStateView["stageSubState"];
  summary?: {
    scriptId: string;
    timelineId: string;
    packagesBuilt: number;
  };
  reasonCode?: string;
}

export interface PipelineStageOutputs {
  script?: ScriptArtifact;
  selectedAssets?: MediaAsset[];
  timeline?: TimelineArtifact;
  packages?: PlatformPackage[];
  publishReceipt?: PublishReceipt;
}

export type PipelineStageKey = "script" | "mediaSelection" | "timeline" | "packaging" | "publish";

export interface PipelineStageTimestamps {
  startedAt?: string;
  completedAt?: string;
}

export interface RunStageProgress {
  script: PipelineStageTimestamps;
  mediaSelection: PipelineStageTimestamps;
  timeline: PipelineStageTimestamps;
  packaging: PipelineStageTimestamps;
  publish: PipelineStageTimestamps;
}

export interface UnifiedPipelineStatusResponse {
  runId: string;
  runState: RunStateView["runState"];
  stageSubState: RunStateView["stageSubState"];
  reasonCode?: string;
  updatedAt: string;
  stages: {
    script: { status: "pending" | "completed"; startedAt?: string; completedAt?: string; output?: ScriptArtifact };
    mediaSelection: { status: "pending" | "completed"; startedAt?: string; completedAt?: string; output?: MediaAsset[] };
    timeline: { status: "pending" | "completed"; startedAt?: string; completedAt?: string; output?: TimelineArtifact };
    packaging: { status: "pending" | "completed"; startedAt?: string; completedAt?: string; output?: PlatformPackage[] };
    publish: { status: "pending" | "completed"; startedAt?: string; completedAt?: string; output?: PublishReceipt };
  };
}

interface UnifiedPipelineDependencies {
  scriptService: ScriptGenerationService;
  mediaService: MediaCompositionService;
  packagingService: MultiPlatformPackagingService;
  runStateRepository: RunStateRepository;
  checkpointRepository: CheckpointRepository;
  statusCache: StatusCache;
  cacheTtlSeconds: number;
  pipelineStatusStore?: PipelineStatusStore;
  defaultEnablePublishing?: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function resolvePackagingPlatforms(
  requested: Array<"tiktok" | "youtube-shorts" | "instagram-reels"> | undefined,
  enablePublishing: boolean
): Array<"tiktok" | "youtube-shorts" | "instagram-reels"> {
  const base = requested ?? ["tiktok", "youtube-shorts", "instagram-reels"];
  if (enablePublishing && !base.includes("youtube-shorts")) {
    return [...base, "youtube-shorts"];
  }
  return base;
}

export class UnifiedPipelineService {
  private readonly outputs = new Map<string, PipelineStageOutputs>();
  private readonly stageProgress = new Map<string, RunStageProgress>();
  private readonly pipelineStatusStore: PipelineStatusStore;

  constructor(private readonly deps: UnifiedPipelineDependencies) {
    this.pipelineStatusStore = deps.pipelineStatusStore ?? new InMemoryPipelineStatusStore();
  }

  private async persistState(state: RunStateView): Promise<void> {
    await this.deps.runStateRepository.upsert(state);
    await this.deps.statusCache.put(state.runId, state, this.deps.cacheTtlSeconds);
  }

  private async persistPipelineSnapshot(runId: string): Promise<void> {
    await this.pipelineStatusStore.set(runId, {
      outputs: this.outputs.get(runId) ?? {},
      progress: this.getOrCreateStageProgress(runId)
    });
  }

  private async updateOutputs(runId: string, partial: Partial<PipelineStageOutputs>): Promise<void> {
    const existing = this.outputs.get(runId) ?? {};
    this.outputs.set(runId, {
      ...existing,
      ...partial
    });
    await this.persistPipelineSnapshot(runId);
  }

  private async ensurePipelineSnapshotLoaded(runId: string): Promise<void> {
    if (this.outputs.has(runId) && this.stageProgress.has(runId)) {
      return;
    }

    const snapshot = await this.pipelineStatusStore.get(runId);
    if (!snapshot) {
      return;
    }

    this.outputs.set(runId, snapshot.outputs ?? {});
    this.stageProgress.set(runId, snapshot.progress ?? this.getOrCreateStageProgress(runId));
  }

  private getOrCreateStageProgress(runId: string): RunStageProgress {
    const existing = this.stageProgress.get(runId);
    if (existing) {
      return existing;
    }

    const created: RunStageProgress = {
      script: {},
      mediaSelection: {},
      timeline: {},
      packaging: {},
      publish: {}
    };
    this.stageProgress.set(runId, created);
    return created;
  }

  private async markStageStarted(runId: string, stage: PipelineStageKey): Promise<void> {
    const progress = this.getOrCreateStageProgress(runId);
    if (!progress[stage].startedAt) {
      progress[stage].startedAt = nowIso();
      await this.persistPipelineSnapshot(runId);
    }
  }

  private async markStageCompleted(runId: string, stage: PipelineStageKey): Promise<void> {
    const progress = this.getOrCreateStageProgress(runId);
    progress[stage].completedAt = nowIso();
    await this.persistPipelineSnapshot(runId);
  }

  private async getRunState(runId: string): Promise<RunStateView | undefined> {
    const cached = await this.deps.statusCache.get(runId);
    if (cached) {
      return cached;
    }
    const stored = await this.deps.runStateRepository.get(runId);
    if (stored) {
      await this.deps.statusCache.put(runId, stored, this.deps.cacheTtlSeconds);
    }
    return stored;
  }

  async getPipelineStatus(runId: string): Promise<UnifiedPipelineStatusResponse | undefined> {
    await this.ensurePipelineSnapshotLoaded(runId);

    const runState = await this.getRunState(runId);
    if (!runState) {
      return undefined;
    }

    const stageOutputs = this.outputs.get(runId) ?? {};
    const progress = this.getOrCreateStageProgress(runId);

    return {
      runId,
      runState: runState.runState,
      stageSubState: runState.stageSubState,
      reasonCode: runState.reasonCode,
      updatedAt: runState.updatedAt,
      stages: {
        script: {
          status: progress.script.completedAt ? "completed" : "pending",
          startedAt: progress.script.startedAt,
          completedAt: progress.script.completedAt,
          output: stageOutputs.script
        },
        mediaSelection: {
          status: progress.mediaSelection.completedAt ? "completed" : "pending",
          startedAt: progress.mediaSelection.startedAt,
          completedAt: progress.mediaSelection.completedAt,
          output: stageOutputs.selectedAssets
        },
        timeline: {
          status: progress.timeline.completedAt ? "completed" : "pending",
          startedAt: progress.timeline.startedAt,
          completedAt: progress.timeline.completedAt,
          output: stageOutputs.timeline
        },
        packaging: {
          status: progress.packaging.completedAt ? "completed" : "pending",
          startedAt: progress.packaging.startedAt,
          completedAt: progress.packaging.completedAt,
          output: stageOutputs.packages
        },
        publish: {
          status: progress.publish.completedAt ? "completed" : "pending",
          startedAt: progress.publish.startedAt,
          completedAt: progress.publish.completedAt,
          output: stageOutputs.publishReceipt
        }
      }
    };
  }

  async startPipeline(input: PipelineStartInput): Promise<PipelineStartResponse> {
    const runId = input.runId ?? randomUUID();
    const profile = input.platformProfile ?? "tiktok";
    const hashtags = input.hashtags ?? [];
    const enablePublishing = input.enablePublishing ?? this.deps.defaultEnablePublishing ?? false;
    const packagingPlatforms = resolvePackagingPlatforms(input.platforms, enablePublishing);
    this.getOrCreateStageProgress(runId);
    await this.persistPipelineSnapshot(runId);

    await this.persistState({
      runId,
      runState: "Running",
      stageSubState: "InProgress",
      updatedAt: nowIso(),
      reasonCode: "PIPELINE_STARTED",
      recommendedAction: "Wait for pipeline completion"
    });

    await this.deps.checkpointRepository.write({
      checkpointId: randomUUID(),
      runId,
      stageId: "uow-1-unified-pipeline",
      checkpointType: "StageStart",
      stateSnapshotRef: `run/${runId}/pipeline-start`,
      createdAt: nowIso()
    });

    try {
      await this.markStageStarted(runId, "script");
      const generated = await this.deps.scriptService.generateScript({
        runId,
        input: {
          topic: input.topic,
          platformProfile: profile
        },
        preferredProviderOrder: []
      });
      await this.updateOutputs(runId, {
        script: generated.script
      });
      await this.markStageCompleted(runId, "script");

      await this.markStageStarted(runId, "mediaSelection");
      const discovery = await this.deps.mediaService.discoverAndSelectAssets({
        runId,
        scriptId: generated.script.scriptId,
        topic: input.topic,
        platformProfile: profile,
        visualStyle: "cinematic"
      });
      await this.updateOutputs(runId, {
        selectedAssets: discovery.selectedAssets
      });
      await this.markStageCompleted(runId, "mediaSelection");

      await this.markStageStarted(runId, "timeline");
      const timeline = await this.deps.mediaService.buildTimeline(
        runId,
        profile,
        generated.script.content
      );
      await this.updateOutputs(runId, {
        timeline
      });
      await this.markStageCompleted(runId, "timeline");

      await this.markStageStarted(runId, "packaging");
      const packaging = await this.deps.packagingService.buildMulti(
        runId,
        timeline.timelineId,
        input.title ?? `${input.topic} short`,
        hashtags,
        packagingPlatforms
      );
      await this.updateOutputs(runId, {
        packages: packaging.packages
      });
      await this.markStageCompleted(runId, "packaging");

      if (enablePublishing) {
        await this.markStageStarted(runId, "publish");
        const publishReceipt = await this.deps.packagingService.publishYouTubeShorts(runId);
        await this.updateOutputs(runId, {
          publishReceipt
        });
        await this.markStageCompleted(runId, "publish");
      }

      await this.deps.checkpointRepository.write({
        checkpointId: randomUUID(),
        runId,
        stageId: "uow-1-unified-pipeline",
        checkpointType: "StageComplete",
        stateSnapshotRef: `run/${runId}/pipeline-complete`,
        createdAt: nowIso()
      });

      await this.persistState({
        runId,
        runState: "Completed",
        stageSubState: "Succeeded",
        updatedAt: nowIso(),
        reasonCode: "PIPELINE_COMPLETED",
        recommendedAction: "Inspect output artifacts"
      });

      return {
        runId,
        runState: "Completed",
        stageSubState: "Succeeded",
        summary: {
          scriptId: generated.script.scriptId,
          timelineId: timeline.timelineId,
          packagesBuilt: packaging.packages.length
        }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pipeline execution failed";
      await this.persistState({
        runId,
        runState: "RecoverableFailed",
        stageSubState: "FailedRetryable",
        updatedAt: nowIso(),
        reasonCode: "PIPELINE_FAILED",
        recommendedAction: message
      });

      return {
        runId,
        runState: "RecoverableFailed",
        stageSubState: "FailedRetryable",
        reasonCode: message
      };
    }
  }
}
