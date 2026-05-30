import { DomainError } from "./errors";
import { RunState } from "../../shared-contracts/types";

const allowedTransitions: Record<RunState, RunState[]> = {
  Created: ["Validating", "Cancelled"],
  Validating: ["Running", "RecoverableFailed", "Cancelled"],
  Running: ["Paused", "RecoverableFailed", "Completed", "Cancelled"],
  Paused: ["Running", "RecoverableFailed", "Cancelled"],
  RecoverableFailed: ["Running", "Cancelled"],
  Completed: [],
  Cancelled: []
};

export function transitionRunState(from: RunState, to: RunState): RunState {
  if (!allowedTransitions[from].includes(to)) {
    throw new DomainError(
      "RUN_ILLEGAL_TRANSITION",
      `Illegal run state transition from ${from} to ${to}`,
      409
    );
  }

  return to;
}
