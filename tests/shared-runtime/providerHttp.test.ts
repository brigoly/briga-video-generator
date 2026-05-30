import { afterEach, describe, expect, it, vi } from "vitest";
import { ExternalProviderError, providerFetch } from "../../src/shared-runtime/providerHttp";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("providerFetch", () => {
  it("retries transient failures and succeeds", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "temporary"
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true })
      } as Response);

    const response = await providerFetch(
      "http://provider.local/api/test",
      { method: "GET" },
      { providerId: "test-provider", maxRetries: 1, initialBackoffMs: 1 }
    );

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws classified auth errors without retry", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "bad token"
    } as Response);

    await expect(
      providerFetch(
        "http://provider.local/api/test",
        { method: "GET" },
        { providerId: "auth-provider", maxRetries: 2, initialBackoffMs: 1 }
      )
    ).rejects.toEqual(
      expect.objectContaining<Partial<ExternalProviderError>>({
        name: "ExternalProviderError",
        providerId: "auth-provider",
        kind: "AUTH",
        retryable: false,
        statusCode: 401
      })
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
