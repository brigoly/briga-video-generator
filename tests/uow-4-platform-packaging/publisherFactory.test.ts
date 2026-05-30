import { afterEach, describe, expect, it } from "vitest";
import {
  buildDefaultPublishers,
  buildRuntimePublishers,
  PublisherConfigurationError
} from "../../src/uow-4-platform-packaging/providers/publisherFactory";

const ENV_KEYS = [
  "UOW4_YOUTUBE_PUBLISH_BASE_URL",
  "UOW4_YOUTUBE_PUBLISH_API_KEY",
  "UOW4_YOUTUBE_OAUTH_TOKEN_URL",
  "UOW4_YOUTUBE_OAUTH_CLIENT_ID",
  "UOW4_YOUTUBE_OAUTH_CLIENT_SECRET",
  "UOW4_YOUTUBE_OAUTH_REFRESH_TOKEN",
  "UOW4_YOUTUBE_OAUTH_SCOPE",
  "UOW4_YOUTUBE_PUBLISH_TIMEOUT_MS"
] as const;

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe("uow4 publisherFactory", () => {
  it("builds default publisher with api key", () => {
    const publishers = buildDefaultPublishers({
      youtubeBaseUrl: "http://localhost:8080",
      youtubeApiKey: "api-key"
    });

    expect(publishers.get("youtube-shorts")).toBeDefined();
  });

  it("builds default publisher with oauth config", () => {
    const publishers = buildDefaultPublishers({
      youtubeBaseUrl: "http://localhost:8080",
      youtubeOAuthClientId: "client-id",
      youtubeOAuthClientSecret: "client-secret",
      youtubeOAuthRefreshToken: "refresh-token",
      youtubeOAuthTokenUrl: "https://oauth2.googleapis.com/token"
    });

    expect(publishers.get("youtube-shorts")).toBeDefined();
  });

  it("throws in strict mode when auth is missing", () => {
    expect(() =>
      buildRuntimePublishers(
        {
          youtubeBaseUrl: "http://localhost:8080"
        },
        { requireRealPublisher: true }
      )
    ).toThrow(PublisherConfigurationError);
  });
});
