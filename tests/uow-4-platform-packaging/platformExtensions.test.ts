import { describe, expect, it } from "vitest";
import { getPlatformRules, normalizeHashtags } from "../../src/uow-4-platform-packaging/services/platformExtensions";

describe("platform extensions", () => {
  it("returns rules for tiktok", () => {
    const rules = getPlatformRules("tiktok");
    expect(rules.maxDurationSeconds).toBe(60);
  });

  it("normalizes hashtags", () => {
    const tags = normalizeHashtags(["#AI", "VideoTips"], "youtube-shorts");
    expect(tags).toEqual(["#ai", "#videotips"]);
  });
});
