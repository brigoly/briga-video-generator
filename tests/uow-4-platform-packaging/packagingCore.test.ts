import { describe, expect, it } from "vitest";
import { buildPlatformPackage } from "../../src/uow-4-platform-packaging/services/packagingCore";

describe("packaging core", () => {
  it("builds a platform package", () => {
    const platformPackage = buildPlatformPackage({
      runId: "run-4",
      timelineId: "timeline-1",
      platform: "tiktok",
      title: "AI city short",
      hashtags: ["AI", "City"]
    });

    expect(platformPackage.platform).toBe("tiktok");
    expect(platformPackage.files.length).toBeGreaterThan(0);
    expect(platformPackage.hashtags[0]).toBe("#ai");
  });
});
