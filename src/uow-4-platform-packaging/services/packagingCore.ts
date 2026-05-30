import { randomUUID } from "node:crypto";
import { PackagingInput, PlatformPackage } from "../../shared-contracts/platformPackagingTypes";
import { getPlatformRules, normalizeHashtags } from "./platformExtensions";

export function buildPlatformPackage(input: PackagingInput): PlatformPackage {
  const platformRules = getPlatformRules(input.platform);
  const captionBase = input.caption ?? `${input.title} ${input.hashtags.join(" ")}`.trim();
  const normalizedHashtags = normalizeHashtags(input.hashtags, input.platform);
  const warnings: string[] = [];

  if (captionBase.length > platformRules.maxCaptionLength) {
    warnings.push("Caption truncated to platform limit");
  }

  const caption = captionBase.slice(0, platformRules.maxCaptionLength);

  return {
    packageId: randomUUID(),
    runId: input.runId,
    platform: input.platform,
    title: input.title,
    caption,
    hashtags: normalizedHashtags,
    aspectRatio: "9:16",
    maxDurationSeconds: platformRules.maxDurationSeconds,
    files: [
      {
        fileName: `${input.runId}-${input.platform}.mp4`,
        fileType: "video",
        uri: `artifacts/${input.runId}/${input.platform}/video.mp4`
      },
      {
        fileName: `${input.runId}-${input.platform}.json`,
        fileType: "metadata",
        uri: `artifacts/${input.runId}/${input.platform}/metadata.json`
      }
    ],
    validation: {
      valid: true,
      warnings
    },
    createdAt: new Date().toISOString()
  };
}
