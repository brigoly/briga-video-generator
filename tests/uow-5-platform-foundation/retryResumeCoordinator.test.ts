import { describe, expect, it } from "vitest";
import {
  buildResumePlan,
  decideRetry
} from "../../src/uow-5-platform-foundation/services/retryResumeCoordinator";

describe("retry and resume coordinator", () => {
  it("returns delayed retry when transient failure is retryable", () => {
    const decision = decideRetry({
      attempt: 1,
      maxAttempts: 4,
      retryable: true,
      baseDelayMs: 250,
      maxDelayMs: 1000
    });

    expect(decision.decisionType).toBe("RetryAfterDelay");
    expect(decision.delayMs).toBe(250);
    expect(decision.nextAttempt).toBe(2);
  });

  it("exhausts non-retryable failures", () => {
    const decision = decideRetry({
      attempt: 1,
      maxAttempts: 4,
      retryable: false,
      baseDelayMs: 100,
      maxDelayMs: 1000
    });

    expect(decision.decisionType).toBe("RetryExhausted");
    expect(decision.reasonCode).toBe("NON_RETRYABLE");
  });

  it("creates resume plan from failed stage onward", () => {
    const plan = buildResumePlan({
      stageOrder: ["uow-1", "uow-2", "uow-3", "uow-4"],
      stageStates: {
        "uow-1": "succeeded",
        "uow-2": "failed-retryable",
        "uow-3": "pending",
        "uow-4": "pending"
      }
    });

    expect(plan.stagesToExecute).toEqual(["uow-2", "uow-3", "uow-4"]);
    expect(plan.reusedStages).toEqual(["uow-1"]);
  });
});
