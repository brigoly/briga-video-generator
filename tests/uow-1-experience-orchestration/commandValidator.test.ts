import { describe, expect, it } from "vitest";
import { validateAndNormalizeCommand } from "../../src/uow-1-experience-orchestration/orchestration/commandValidator";

describe("validateAndNormalizeCommand", () => {
  it("accepts a start command", () => {
    const result = validateAndNormalizeCommand({
      commandType: "start",
      idempotencyKey: "idem-1",
      payload: { topic: "ai" },
      requestedAt: new Date().toISOString()
    });

    expect(result.commandType).toBe("start");
  });

  it("rejects resume without runId", () => {
    expect(() =>
      validateAndNormalizeCommand({
        commandType: "resume",
        idempotencyKey: "idem-2",
        payload: {},
        requestedAt: new Date().toISOString()
      })
    ).toThrowError(/runId is required/);
  });
});
