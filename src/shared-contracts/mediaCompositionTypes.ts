export type PlatformProfile = "tiktok" | "youtube-shorts" | "instagram-reels";

export interface MediaDiscoveryInput {
  runId: string;
  scriptId: string;
  topic: string;
  platformProfile: PlatformProfile;
  visualStyle?: "cinematic" | "minimal" | "documentary" | "vibrant";
}

export interface MediaAsset {
  assetId: string;
  sourceType: "stock" | "ai-generated";
  providerId: string;
  uri: string;
  previewUri: string;
  attributionRequired: boolean;
  license: string;
  score: number;
  tags: string[];
}

export interface SelectionPolicyInput {
  stockAssets: MediaAsset[];
  aiAssets: MediaAsset[];
  preferredMixRatio: {
    stockWeight: number;
    aiWeight: number;
  };
  maxAssets: number;
}

export interface TimelineScene {
  sceneId: string;
  order: number;
  narrationText: string;
  assetId: string;
  durationSeconds: number;
  transition: "cut" | "fade" | "zoom";
}

export interface TimelineArtifact {
  timelineId: string;
  runId: string;
  platformProfile: PlatformProfile;
  totalDurationSeconds: number;
  scenes: TimelineScene[];
  createdAt: string;
}
