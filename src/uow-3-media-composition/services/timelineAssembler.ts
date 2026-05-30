import { randomUUID } from "node:crypto";
import { MediaAsset, TimelineArtifact, TimelineScene, PlatformProfile } from "../../shared-contracts/mediaCompositionTypes";

export interface TimelineAssemblyInput {
  runId: string;
  platformProfile: PlatformProfile;
  scriptContent: string;
  assets: MediaAsset[];
}

function durationBudget(platform: PlatformProfile): number {
  if (platform === "youtube-shorts") {
    return 58;
  }
  if (platform === "instagram-reels") {
    return 55;
  }
  return 45;
}

export function assembleTimeline(input: TimelineAssemblyInput): TimelineArtifact {
  const beats = input.scriptContent
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, Math.max(1, input.assets.length));

  const totalDuration = durationBudget(input.platformProfile);
  const sceneDuration = Math.max(4, Math.floor(totalDuration / Math.max(1, beats.length)));

  const scenes: TimelineScene[] = beats.map((beat, index) => ({
    sceneId: randomUUID(),
    order: index + 1,
    narrationText: beat,
    assetId: input.assets[index % input.assets.length].assetId,
    durationSeconds: sceneDuration,
    transition: index === 0 ? "cut" : index % 2 === 0 ? "fade" : "zoom"
  }));

  const usedDuration = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

  return {
    timelineId: randomUUID(),
    runId: input.runId,
    platformProfile: input.platformProfile,
    totalDurationSeconds: usedDuration,
    scenes,
    createdAt: new Date().toISOString()
  };
}
