import { describe, expect, it } from "vitest";
import { decideRetry } from "../../src/uow-1-experience-orchestration/orchestration/retryPolicy";

describe("decideRetry", () => {
  it("returns exhausted for non transient", () => {
    const decision = decideRetry({ attemptCount: 1, maxAttempts: 3, transient: false });
    expect(decision.decisionType).toBe("RetryExhausted");
  });

  it("returns retry for transient before max", () => {
    const decision = decideRetry({ attemptCount: 1, maxAttempts: 3, transient: true });
    expect(decision.decisionType).toBe("RetryAfterDelay");
  });
});
