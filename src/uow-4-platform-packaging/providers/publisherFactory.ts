import {
  MockYouTubeShortsPublisher,
  PlatformPublisher,
  YouTubeShortsPublisher
} from "./publishers";

export interface PublisherFactoryConfig {
  youtubeBaseUrl?: string;
  youtubeApiKey?: string;
  youtubeOAuthTokenUrl?: string;
  youtubeOAuthClientId?: string;
  youtubeOAuthClientSecret?: string;
  youtubeOAuthRefreshToken?: string;
  youtubeOAuthScope?: string;
  youtubeTimeoutMs?: number;
}

export interface RuntimePublisherOptions {
  requireRealPublisher?: boolean;
}

export class PublisherConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublisherConfigurationError";
  }
}

function fromEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildDefaultPublishers(config: PublisherFactoryConfig = {}): Map<string, PlatformPublisher> {
  const youtubeBaseUrl = config.youtubeBaseUrl ?? fromEnv("UOW4_YOUTUBE_PUBLISH_BASE_URL");
  const youtubeApiKey = config.youtubeApiKey ?? fromEnv("UOW4_YOUTUBE_PUBLISH_API_KEY");
  const youtubeOAuthTokenUrl =
    config.youtubeOAuthTokenUrl ??
    fromEnv("UOW4_YOUTUBE_OAUTH_TOKEN_URL") ??
    "https://oauth2.googleapis.com/token";
  const youtubeOAuthClientId =
    config.youtubeOAuthClientId ?? fromEnv("UOW4_YOUTUBE_OAUTH_CLIENT_ID");
  const youtubeOAuthClientSecret =
    config.youtubeOAuthClientSecret ?? fromEnv("UOW4_YOUTUBE_OAUTH_CLIENT_SECRET");
  const youtubeOAuthRefreshToken =
    config.youtubeOAuthRefreshToken ?? fromEnv("UOW4_YOUTUBE_OAUTH_REFRESH_TOKEN");
  const youtubeOAuthScope = config.youtubeOAuthScope ?? fromEnv("UOW4_YOUTUBE_OAUTH_SCOPE");

  const timeoutFromConfig = config.youtubeTimeoutMs;
  const timeoutFromEnv = fromEnv("UOW4_YOUTUBE_PUBLISH_TIMEOUT_MS");
  const timeoutMs =
    timeoutFromConfig ??
    (timeoutFromEnv && Number.isFinite(Number(timeoutFromEnv)) ? Number(timeoutFromEnv) : undefined);

  const hasOAuthConfig =
    !!youtubeOAuthTokenUrl &&
    !!youtubeOAuthClientId &&
    !!youtubeOAuthClientSecret &&
    !!youtubeOAuthRefreshToken;

  const oauthConfig = hasOAuthConfig
    ? {
        tokenUrl: youtubeOAuthTokenUrl,
        clientId: youtubeOAuthClientId,
        clientSecret: youtubeOAuthClientSecret,
        refreshToken: youtubeOAuthRefreshToken,
        scope: youtubeOAuthScope
      }
    : undefined;

  const publishers = new Map<string, PlatformPublisher>();
  if (youtubeBaseUrl) {
    publishers.set(
      "youtube-shorts",
      new YouTubeShortsPublisher({
        baseUrl: youtubeBaseUrl,
        apiKey: youtubeApiKey,
        oauth: oauthConfig,
        timeoutMs
      })
    );
  }

  return publishers;
}

export function buildRuntimePublishers(
  config: PublisherFactoryConfig = {},
  options: RuntimePublisherOptions = {}
): Map<string, PlatformPublisher> {
  const youtubeBaseUrl = config.youtubeBaseUrl ?? fromEnv("UOW4_YOUTUBE_PUBLISH_BASE_URL");
  const youtubeApiKey = config.youtubeApiKey ?? fromEnv("UOW4_YOUTUBE_PUBLISH_API_KEY");
  const oauthClientId = config.youtubeOAuthClientId ?? fromEnv("UOW4_YOUTUBE_OAUTH_CLIENT_ID");
  const oauthClientSecret = config.youtubeOAuthClientSecret ?? fromEnv("UOW4_YOUTUBE_OAUTH_CLIENT_SECRET");
  const oauthRefreshToken =
    config.youtubeOAuthRefreshToken ?? fromEnv("UOW4_YOUTUBE_OAUTH_REFRESH_TOKEN");

  const configured = buildDefaultPublishers(config);
  if (configured.size > 0) {
    if (
      options.requireRealPublisher &&
      (!youtubeBaseUrl || (!youtubeApiKey && !(oauthClientId && oauthClientSecret && oauthRefreshToken)))
    ) {
      throw new PublisherConfigurationError(
        "Real publisher mode is enabled but YouTube Shorts auth is not configured. Set UOW4_YOUTUBE_PUBLISH_API_KEY, or configure OAuth with UOW4_YOUTUBE_OAUTH_CLIENT_ID, UOW4_YOUTUBE_OAUTH_CLIENT_SECRET, and UOW4_YOUTUBE_OAUTH_REFRESH_TOKEN."
      );
    }
    return configured;
  }

  if (options.requireRealPublisher) {
    throw new PublisherConfigurationError(
      "Real publisher mode is enabled but YouTube Shorts publisher is not configured. Set UOW4_YOUTUBE_PUBLISH_BASE_URL with either UOW4_YOUTUBE_PUBLISH_API_KEY, or OAuth credentials UOW4_YOUTUBE_OAUTH_CLIENT_ID/UOW4_YOUTUBE_OAUTH_CLIENT_SECRET/UOW4_YOUTUBE_OAUTH_REFRESH_TOKEN."
    );
  }

  return new Map<string, PlatformPublisher>([["youtube-shorts", new MockYouTubeShortsPublisher()]]);
}
