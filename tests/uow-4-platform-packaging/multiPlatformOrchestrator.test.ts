import { describe, expect, it } from "vitest";
import { MultiPlatformPackagingService } from "../../src/uow-4-platform-packaging/services/multiPlatformOrchestrator";
import { InMemoryPackageRepository } from "../../src/uow-4-platform-packaging/repositories/packageRepository";
import { MockYouTubeShortsPublisher } from "../../src/uow-4-platform-packaging/providers/publishers";
import { DeterministicArtifactProvider } from "../../src/uow-4-platform-packaging/providers/artifactProviders";

describe("multi platform orchestrator", () => {
  it("builds packages for multiple platforms", async () => {
    const service = new MultiPlatformPackagingService(new InMemoryPackageRepository());

    const result = await service.buildMulti(
      "run-4",
      "timeline-1",
      "Future tech",
      ["AI", "Shorts"],
      ["tiktok", "youtube-shorts", "instagram-reels"]
    );

    expect(result.packages).toHaveLength(3);
    expect(result.packages.map((p) => p.platform)).toEqual([
      "tiktok",
      "youtube-shorts",
      "instagram-reels"
    ]);
  });

  it("publishes latest youtube-shorts package", async () => {
    const service = new MultiPlatformPackagingService(
      new InMemoryPackageRepository(),
      new DeterministicArtifactProvider(),
      undefined,
      new Map([["youtube-shorts", new MockYouTubeShortsPublisher("mock-publisher")]])
    );

    await service.buildMulti("run-yt", "timeline-1", "Future tech", ["AI"], ["youtube-shorts"]);
    const receipt = await service.publishYouTubeShorts("run-yt");

    expect(receipt.platform).toBe("youtube-shorts");
    expect(receipt.status).toBe("published");
    expect(receipt.providerId).toBe("mock-publisher");
  });
});
