import { MediaDiscoveryInput, MediaAsset, TimelineArtifact } from "../../shared-contracts/mediaCompositionTypes";
import { CompositionRepository, InMemoryCompositionRepository } from "../repositories/compositionRepository";
import { AiAssetProvider, StockAssetProvider } from "../providers/assetProviders";
import { selectHybridAssets } from "./assetSelectionPolicy";
import { assembleTimeline } from "./timelineAssembler";
import { PlatformFoundationService } from "../../uow-5-platform-foundation/services/platformFoundationService";

export class MediaCompositionService {
  constructor(
    private readonly stockProvider: StockAssetProvider,
    private readonly aiProvider: AiAssetProvider,
    private readonly repository: CompositionRepository = new InMemoryCompositionRepository(),
    private readonly foundationService?: PlatformFoundationService
  ) {}

  async discoverAndSelectAssets(input: MediaDiscoveryInput): Promise<{ selectedAssets: MediaAsset[] }> {
    const style = input.visualStyle ?? "cinematic";
    const stockAssets = await this.stockProvider.discover(input.topic, 6);
    const aiAssets = await this.aiProvider.generate(`${input.topic} ${style}`, 4);

    const selectedAssets = selectHybridAssets({
      stockAssets,
      aiAssets,
      preferredMixRatio: {
        stockWeight: 0.6,
        aiWeight: 0.4
      },
      maxAssets: 8
    });

    await this.repository.saveSelectedAssets(input.runId, selectedAssets);

    if (this.foundationService) {
      await this.foundationService.persistStageArtifact({
        runId: input.runId,
        stageId: "uow-3-media-composition",
        artifactKind: "output",
        artifactName: "selected-assets",
        payload: selectedAssets,
        parameters: {
          topic: input.topic,
          platformProfile: input.platformProfile,
          visualStyle: style
        }
      });
      await this.foundationService.recordTelemetryEvent({
        runId: input.runId,
        stageId: "uow-3-media-composition",
        eventType: "StageCompleted",
        message: "Asset discovery and selection completed",
        metadata: {
          selectedAssets: selectedAssets.length,
          stockProviderId: this.stockProvider.providerId,
          aiProviderId: this.aiProvider.providerId
        }
      });
    }

    return { selectedAssets };
  }

  async buildTimeline(runId: string, platformProfile: MediaDiscoveryInput["platformProfile"], scriptContent: string): Promise<TimelineArtifact> {
    const assets = await this.repository.getSelectedAssets(runId);
    if (assets.length === 0) {
      throw new Error(`No selected assets available for run ${runId}`);
    }

    const timeline = assembleTimeline({
      runId,
      platformProfile,
      scriptContent,
      assets
    });

    await this.repository.saveTimeline(timeline);

    if (this.foundationService) {
      await this.foundationService.persistStageArtifact({
        runId,
        stageId: "uow-3-media-composition",
        artifactKind: "output",
        artifactName: "timeline",
        payload: timeline,
        parameters: {
          platformProfile,
          scriptLength: scriptContent.length
        }
      });
      await this.foundationService.recordTelemetryEvent({
        runId,
        stageId: "uow-3-media-composition",
        eventType: "StageCompleted",
        message: "Timeline assembly completed",
        metadata: {
          scenes: timeline.scenes.length,
          durationSeconds: timeline.totalDurationSeconds
        }
      });
    }

    return timeline;
  }
}
