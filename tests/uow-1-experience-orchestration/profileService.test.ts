import { describe, expect, it } from "vitest";
import { resolveProfile } from "../../src/uow-1-experience-orchestration/profiles/profileService";

describe("profile resolution", () => {
  it("creates deterministic hash for merged profile", () => {
    const first = resolveProfile({
      baselineProfileRef: "baseline-a",
      baseline: { voice: "default", pacing: { speed: 1 } },
      overrides: { pacing: { speed: 2 } }
    });

    const second = resolveProfile({
      baselineProfileRef: "baseline-a",
      baseline: { voice: "default", pacing: { speed: 1 } },
      overrides: { pacing: { speed: 2 } }
    });

    expect(first.effectiveConfiguration.effectiveConfigHash).toBe(second.effectiveConfiguration.effectiveConfigHash);
    expect(first.merged.pacing).toEqual({ speed: 2 });
  });
});
