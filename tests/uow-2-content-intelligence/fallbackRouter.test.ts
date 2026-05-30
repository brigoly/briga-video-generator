import { describe, expect, it } from "vitest";
import { MockProviderAdapter } from "../../src/uow-2-content-intelligence/providers/providerAdapter";
import { generateWithFallback } from "../../src/uow-2-content-intelligence/services/fallbackRouter";

describe("fallback router", () => {
  it("falls back to second provider after first fails", async () => {
    const failing = new MockProviderAdapter("p1", async () => {
      throw new Error("provider unavailable");
    });

    const success = new MockProviderAdapter("p2", async () => "script content");

    const result = await generateWithFallback([failing, success], {
      prompt: "x",
      maxTokens: 200
    });

    expect(result.output.providerId).toBe("p2");
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].success).toBe(false);
    expect(result.attempts[1].success).toBe(true);
  });
});
