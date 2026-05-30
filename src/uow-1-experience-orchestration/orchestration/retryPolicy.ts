import { RetryDecision } from "../../shared-contracts/types";

export interface RetryPolicyInput {
  attemptCount: number;
  maxAttempts: number;
  transient: boolean;
}

export function decideRetry(input: RetryPolicyInput): RetryDecision {
  if (!input.transient) {
    return {
      decisionType: "RetryExhausted",
      delayMs: 0,
      reasonCode: "NON_RETRYABLE",
      severity: "high"
    };
  }

  if (input.attemptCount >= input.maxAttempts) {
    return {
      decisionType: "RetryExhausted",
      delayMs: 0,
      reasonCode: "RETRY_EXHAUSTED",
      severity: "high"
    };
  }

  const jitter = Math.floor(Math.random() * 100);
  const delayMs = Math.min(30_000, 2 ** input.attemptCount * 100 + jitter);
  return {
    decisionType: "RetryAfterDelay",
    delayMs,
    reasonCode: "TRANSIENT_RETRY",
    severity: "medium"
  };
}
