type ProviderErrorKind =
  | "CIRCUIT_OPEN"
  | "TIMEOUT"
  | "AUTH"
  | "RATE_LIMIT"
  | "UPSTREAM"
  | "BAD_RESPONSE"
  | "NETWORK";

export class ExternalProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly kind: ProviderErrorKind,
    public readonly retryable: boolean,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ExternalProviderError";
  }
}

interface CircuitState {
  failures: number;
  openUntil?: number;
}

interface ProviderFetchOptions {
  providerId: string;
  timeoutMs?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
  circuitFailureThreshold?: number;
  circuitOpenMs?: number;
}

const circuitByProvider = new Map<string, CircuitState>();

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCircuit(providerId: string): CircuitState {
  const existing = circuitByProvider.get(providerId);
  if (existing) {
    return existing;
  }
  const created: CircuitState = { failures: 0 };
  circuitByProvider.set(providerId, created);
  return created;
}

function classifyHttpError(providerId: string, status: number, message: string): ExternalProviderError {
  if (status === 401 || status === 403) {
    return new ExternalProviderError(message, providerId, "AUTH", false, status);
  }
  if (status === 429) {
    return new ExternalProviderError(message, providerId, "RATE_LIMIT", true, status);
  }
  if (status >= 500) {
    return new ExternalProviderError(message, providerId, "UPSTREAM", true, status);
  }
  return new ExternalProviderError(message, providerId, "BAD_RESPONSE", false, status);
}

export async function providerFetch(
  url: string,
  init: RequestInit,
  options: ProviderFetchOptions
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const maxRetries = options.maxRetries ?? 2;
  const initialBackoffMs = options.initialBackoffMs ?? 200;
  const circuitFailureThreshold = options.circuitFailureThreshold ?? 3;
  const circuitOpenMs = options.circuitOpenMs ?? 10000;

  const circuit = getCircuit(options.providerId);
  const now = Date.now();
  if (circuit.openUntil && now < circuit.openUntil) {
    throw new ExternalProviderError(
      `Circuit open for provider ${options.providerId}`,
      options.providerId,
      "CIRCUIT_OPEN",
      true
    );
  }

  let lastError: ExternalProviderError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });

      if (response.ok) {
        circuit.failures = 0;
        circuit.openUntil = undefined;
        return response;
      }

      const body = await response.text().catch(() => "");
      const error = classifyHttpError(
        options.providerId,
        response.status,
        `${options.providerId} request failed (${response.status}): ${body || response.statusText}`
      );
      lastError = error;

      if (error.retryable && attempt < maxRetries) {
        const backoffMs = initialBackoffMs * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }

      lastError = error;
      break;
    } catch (err) {
      if (err instanceof ExternalProviderError) {
        lastError = err;
        if (err.retryable && attempt < maxRetries) {
          const backoffMs = initialBackoffMs * Math.pow(2, attempt);
          await sleep(backoffMs);
          continue;
        }
        break;
      }

      const normalized =
        err instanceof Error && err.name === "AbortError"
          ? new ExternalProviderError(
              `${options.providerId} request timed out after ${timeoutMs}ms`,
              options.providerId,
              "TIMEOUT",
              true
            )
          : new ExternalProviderError(
              err instanceof Error ? err.message : "Unknown network error",
              options.providerId,
              "NETWORK",
              true
            );

      lastError = normalized;
      if (attempt < maxRetries) {
        const backoffMs = initialBackoffMs * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }

      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  const failure = lastError ??
    new ExternalProviderError("External provider request failed", options.providerId, "NETWORK", true);

  circuit.failures += 1;
  if (circuit.failures >= circuitFailureThreshold) {
    circuit.openUntil = Date.now() + circuitOpenMs;
    circuit.failures = 0;
  }

  throw failure;
}
