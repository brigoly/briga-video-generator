import { MediaAsset, TimelineArtifact } from "../../shared-contracts/mediaCompositionTypes";

export interface CompositionRepository {
  saveSelectedAssets(runId: string, assets: MediaAsset[]): Promise<void>;
  getSelectedAssets(runId: string): Promise<MediaAsset[]>;
  saveTimeline(timeline: TimelineArtifact): Promise<void>;
  getTimeline(runId: string): Promise<TimelineArtifact | undefined>;
}

export class InMemoryCompositionRepository implements CompositionRepository {
  private readonly selectedAssets = new Map<string, MediaAsset[]>();
  private readonly timelines = new Map<string, TimelineArtifact>();

  async saveSelectedAssets(runId: string, assets: MediaAsset[]): Promise<void> {
    this.selectedAssets.set(runId, assets);
  }

  async getSelectedAssets(runId: string): Promise<MediaAsset[]> {
    return this.selectedAssets.get(runId) ?? [];
  }

  async saveTimeline(timeline: TimelineArtifact): Promise<void> {
    this.timelines.set(timeline.runId, timeline);
  }

  async getTimeline(runId: string): Promise<TimelineArtifact | undefined> {
    return this.timelines.get(runId);
  }
}
