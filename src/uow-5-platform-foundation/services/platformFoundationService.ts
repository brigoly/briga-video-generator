import {
  ArtifactWriteRequest,
  ManifestComparison,
  ResumePlan,
  ResumePlanInput,
  RetryPolicyDecision,
  RetryPolicyInput,
  RunManifest,
  StoredArtifact,
  TelemetryEvent,
  TelemetrySummary
} from "../../shared-contracts/platformFoundationTypes";
import { ArtifactStore } from "./artifactStore";
import { ManifestIndexService } from "./manifestIndexService";
import { buildResumePlan, decideRetry } from "./retryResumeCoordinator";
import { TelemetryService } from "./telemetryService";

export interface PlatformFoundationDependencies {
  artifactStore: ArtifactStore;
  manifestIndexService: ManifestIndexService;
  telemetryService: TelemetryService;
}

export class PlatformFoundationService {
  constructor(private readonly deps: PlatformFoundationDependencies) {}

  async persistStageArtifact(request: ArtifactWriteRequest): Promise<StoredArtifact> {
    const stored = await this.deps.artifactStore.persist(request);
    await this.deps.manifestIndexService.recordArtifact(stored, request);
    await this.deps.telemetryService.record({
      runId: request.runId,
      stageId: request.stageId,
      eventType: "ArtifactPersisted",
      metadata: {
        artifactId: stored.artifactId,
        artifactKind: request.artifactKind,
        artifactName: request.artifactName,
        version: stored.version
      }
    });

    return stored;
  }

  async getRunManifest(runId: string): Promise<RunManifest | undefined> {
    return this.deps.manifestIndexService.getManifest(runId);
  }

  async compareRunManifests(baseRunId: string, candidateRunId: string): Promise<ManifestComparison> {
    return this.deps.manifestIndexService.compareManifests(baseRunId, candidateRunId);
  }

  async recordTelemetryEvent(event: Omit<TelemetryEvent, "timestamp"> & { timestamp?: string }): Promise<TelemetryEvent> {
    return this.deps.telemetryService.record(event);
  }

  getTelemetrySummary(runId: string): TelemetrySummary {
    return this.deps.telemetryService.getSummary(runId);
  }

  decideRetry(policy: RetryPolicyInput): RetryPolicyDecision {
    return decideRetry(policy);
  }

  buildResumePlan(input: ResumePlanInput): ResumePlan {
    return buildResumePlan(input);
  }
}
