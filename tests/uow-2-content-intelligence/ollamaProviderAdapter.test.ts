import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaProviderAdapter } from "../../src/uow-2-content-intelligence/providers/ollamaProviderAdapter";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("OllamaProviderAdapter", () => {
  it("returns generated content from Ollama API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: "hook line\nbeat\ncta" })
    } as Response);

    const provider = new OllamaProviderAdapter({
      baseUrl: "http://localhost:11434",
      model: "llama3"
    });

    const result = await provider.generateScript({
      prompt: "Generate short script",
      maxTokens: 200
    });

    expect(result.providerId).toBe("ollama-llama3");
    expect(result.content).toContain("hook");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws if Ollama returns empty content", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: "   " })
    } as Response);

    const provider = new OllamaProviderAdapter({
      baseUrl: "http://localhost:11434",
      model: "llama3"
    });

    await expect(
      provider.generateScript({
        prompt: "Generate short script",
        maxTokens: 200
      })
    ).rejects.toThrow("Ollama returned empty content");
  });

  it("falls back from local endpoint to cloud endpoint", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "local down"
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: "fallback result" })
      } as Response);

    const provider = new OllamaProviderAdapter({
      endpoints: [
        { baseUrl: "http://localhost:11434" },
        { baseUrl: "https://ollama.example.com", apiKey: "cloud-key" }
      ],
      model: "llama3"
    });

    const result = await provider.generateScript({
      prompt: "Generate short script",
      maxTokens: 200
    });

    expect(result.content).toContain("fallback");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("sends bearer auth header when api key is configured", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: "cloud result" })
    } as Response);

    const provider = new OllamaProviderAdapter({
      endpoints: [{ baseUrl: "https://ollama.example.com", apiKey: "abc123" }],
      model: "llama3"
    });

    await provider.generateScript({
      prompt: "Generate short script",
      maxTokens: 200
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://ollama.example.com/api/generate",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer abc123"
        })
      })
    );
  });
});
