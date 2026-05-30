import { PackagingPlatform } from "../../shared-contracts/platformPackagingTypes";

export interface PlatformRules {
  maxDurationSeconds: number;
  maxCaptionLength: number;
  hashtagPrefix: string;
}

const rules: Record<PackagingPlatform, PlatformRules> = {
  "tiktok": {
    maxDurationSeconds: 60,
    maxCaptionLength: 150,
    hashtagPrefix: "#"
  },
  "youtube-shorts": {
    maxDurationSeconds: 60,
    maxCaptionLength: 100,
    hashtagPrefix: "#"
  },
  "instagram-reels": {
    maxDurationSeconds: 90,
    maxCaptionLength: 2200,
    hashtagPrefix: "#"
  }
};

export function getPlatformRules(platform: PackagingPlatform): PlatformRules {
  return rules[platform];
}

export function normalizeHashtags(hashtags: string[], platform: PackagingPlatform): string[] {
  const prefix = rules[platform].hashtagPrefix;
  return hashtags.map((tag) => {
    const cleaned = tag.replace(/^#+/, "").trim().toLowerCase();
    return `${prefix}${cleaned}`;
  });
}
