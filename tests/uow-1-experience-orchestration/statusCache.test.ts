import { describe, expect, it } from "vitest";
import { InMemoryStatusCache } from "../../src/uow-1-experience-orchestration/repositories/statusCache";

describe("status cache", () => {
  it("puts and gets state", async () => {
    const cache = new InMemoryStatusCache();
    await cache.put(
      "r1",
      {
        runId: "r1",
        runState: "Running",
        stageSubState: "InProgress",
        updatedAt: new Date().toISOString()
      },
      10
    );

    const found = await cache.get("r1");
    expect(found?.runId).toBe("r1");
  });

  it("invalidates state", async () => {
    const cache = new InMemoryStatusCache();
    await cache.put(
      "r1",
      {
        runId: "r1",
        runState: "Running",
        stageSubState: "InProgress",
        updatedAt: new Date().toISOString()
      },
      10
    );

    await cache.invalidate("r1");
    expect(await cache.get("r1")).toBeUndefined();
  });
});
