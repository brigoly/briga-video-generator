import {
  ResumePlan,
  ResumePlanInput,
  RetryPolicyDecision,
  RetryPolicyInput
} from "../../shared-contracts/platformFoundationTypes";

export function decideRetry(input: RetryPolicyInput): RetryPolicyDecision {
  if (!input.retryable) {
    return {
      decisionType: "RetryExhausted",
      delayMs: 0,
      reasonCode: "NON_RETRYABLE",
      nextAttempt: input.attempt
    };
  }

  if (input.attempt >= input.maxAttempts) {
    return {
      decisionType: "RetryExhausted",
      delayMs: 0,
      reasonCode: "RETRY_EXHAUSTED",
      nextAttempt: input.attempt
    };
  }

  const nextAttempt = input.attempt + 1;
  const delay = Math.min(input.baseDelayMs * Math.pow(2, Math.max(0, input.attempt - 1)), input.maxDelayMs);

  return {
    decisionType: delay > 0 ? "RetryAfterDelay" : "RetryNow",
    delayMs: delay,
    reasonCode: "TRANSIENT_FAILURE",
    nextAttempt
  };
}

function detectFailedStage(input: ResumePlanInput): string | undefined {
  if (input.failedStageId) {
    return input.failedStageId;
  }

  for (const stageId of input.stageOrder) {
    const state = input.stageStates[stageId];
    if (state === "failed-retryable" || state === "failed-terminal") {
      return stageId;
    }
  }

  return undefined;
}

export function buildResumePlan(input: ResumePlanInput): ResumePlan {
  const failedStageId = detectFailedStage(input);
  if (!failedStageId) {
    return {
      stagesToExecute: [],
      reusedStages: input.stageOrder.filter((stageId) => input.stageStates[stageId] === "succeeded")
    };
  }

  const failedStageIndex = input.stageOrder.indexOf(failedStageId);
  if (failedStageIndex < 0) {
    return {
      stagesToExecute: [],
      reusedStages: [],
      blockedReason: "FAILED_STAGE_NOT_IN_PIPELINE"
    };
  }

  const failedState = input.stageStates[failedStageId];
  if (failedState === "failed-terminal") {
    return {
      stagesToExecute: [],
      reusedStages: input.stageOrder.slice(0, failedStageIndex),
      blockedReason: "TERMINAL_FAILURE_REQUIRES_MANUAL_INTERVENTION"
    };
  }

  return {
    stagesToExecute: input.stageOrder.slice(failedStageIndex),
    reusedStages: input.stageOrder
      .slice(0, failedStageIndex)
      .filter((stageId) => {
        const state = input.stageStates[stageId];
        return state === "succeeded" || state === "skipped-by-reuse";
      })
  };
}
