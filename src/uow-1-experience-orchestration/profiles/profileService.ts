import { createHash } from "node:crypto";
import { DomainError } from "../orchestration/errors";
import { EffectiveConfiguration } from "../../shared-contracts/types";

export interface ProfileInput {
  baselineProfileRef: string;
  baseline: Record<string, unknown>;
  overrides?: Record<string, unknown>;
}

export interface ProfileResolutionResult {
  effectiveConfiguration: EffectiveConfiguration;
  merged: Record<string, unknown>;
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (
      typeof baseValue === "object" &&
      baseValue !== null &&
      !Array.isArray(baseValue) &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = deepMerge(baseValue as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function resolveProfile(input: ProfileInput): ProfileResolutionResult {
  if (!input.baselineProfileRef.trim()) {
    throw new DomainError("PROFILE_BASELINE_REQUIRED", "baselineProfileRef is required", 422);
  }

  const merged = input.overrides ? deepMerge(input.baseline, input.overrides) : { ...input.baseline };
  const serialized = JSON.stringify(merged);
  const hash = createHash("sha256").update(serialized).digest("hex");

  return {
    merged,
    effectiveConfiguration: {
      baselineProfileRef: input.baselineProfileRef,
      overridePatchRef: input.overrides ? "inline-override" : undefined,
      effectiveConfigHash: hash,
      mergeProvenance: input.overrides ? "deep-merge-overlay" : "baseline-only"
    }
  };
}
