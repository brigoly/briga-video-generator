export type PackagingPlatform = "tiktok" | "youtube-shorts" | "instagram-reels";

export interface PackagingInput {
  runId: string;
  timelineId: string;
  platform: PackagingPlatform;
  title: string;
  hashtags: string[];
  caption?: string;
}

export interface PackageFile {
  fileName: string;
  fileType: "video" | "metadata" | "thumbnail";
  uri: string;
}

export interface PlatformPackage {
  packageId: string;
  runId: string;
  platform: PackagingPlatform;
  title: string;
  caption: string;
  hashtags: string[];
  aspectRatio: "9:16";
  maxDurationSeconds: number;
  files: PackageFile[];
  validation: {
    valid: boolean;
    warnings: string[];
  };
  createdAt: string;
}

export interface MultiPlatformPackageResult {
  runId: string;
  packages: PlatformPackage[];
}
