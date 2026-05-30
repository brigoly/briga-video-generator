import { describe, expect, it } from "vitest";
import {
  normalizeTopic,
  buildScriptPrompt,
  buildVariantPrompt
} from "../../src/uow-2-content-intelligence/services/promptBuilder";

describe("promptBuilder", () => {
  it("normalizes topic", () => {
    expect(normalizeTopic("  AI   Movie   Trailers  ")).toBe("ai movie trailers");
  });

  it("builds script prompt", () => {
    const prompt = buildScriptPrompt({
      topic: "AI trailers",
      platformProfile: "tiktok",
      tone: "dramatic"
    });

    expect(prompt).toContain("Platform: tiktok");
    expect(prompt).toContain("Tone: dramatic");
  });

  it("builds variant prompt", () => {
    const prompt = buildVariantPrompt("old script", "make it funnier");
    expect(prompt).toContain("make it funnier");
    expect(prompt).toContain("old script");
  });
});
