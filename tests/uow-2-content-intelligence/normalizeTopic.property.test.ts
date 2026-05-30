import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { normalizeTopic } from "../../src/uow-2-content-intelligence/services/promptBuilder";

describe("normalizeTopic properties", () => {
  it("is idempotent", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (topic) => {
        const once = normalizeTopic(topic);
        const twice = normalizeTopic(once);
        expect(twice).toBe(once);
      })
    );
  });
});
