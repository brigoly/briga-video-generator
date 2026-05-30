import { LlmProviderAdapter, ProviderGenerationInput, ProviderGenerationOutput } from "../providers/providerAdapter";

export interface FallbackAttempt {
  providerId: string;
  success: boolean;
  errorMessage?: string;
}

export interface FallbackResult {
  output: ProviderGenerationOutput;
  attempts: FallbackAttempt[];
}

export async function generateWithFallback(
  providersInOrder: LlmProviderAdapter[],
  input: ProviderGenerationInput
): Promise<FallbackResult> {
  const attempts: FallbackAttempt[] = [];
  let lastError: Error | undefined;

  for (const provider of providersInOrder) {
    try {
      const output = await provider.generateScript(input);
      attempts.push({ providerId: provider.providerId, success: true });
      return { output, attempts };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown provider failure");
      attempts.push({ providerId: provider.providerId, success: false, errorMessage: error.message });
      lastError = error;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message ?? "n/a"}`);
}
