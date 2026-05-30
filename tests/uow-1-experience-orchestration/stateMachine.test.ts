import { describe, expect, it } from "vitest";
import { transitionRunState } from "../../src/uow-1-experience-orchestration/orchestration/stateMachine";

describe("transitionRunState", () => {
  it("allows Created -> Validating", () => {
    expect(transitionRunState("Created", "Validating")).toBe("Validating");
  });

  it("rejects Completed -> Running", () => {
    expect(() => transitionRunState("Completed", "Running")).toThrowError(/Illegal run state transition/);
  });
});
