import { PlatformPackage } from "../../shared-contracts/platformPackagingTypes";
import { providerFetch } from "../../shared-runtime/providerHttp";

export interface PublishReceipt {
  providerId: string;
  platform: string;
  status: "published" | "failed";
  destinationId: string;
  destinationUrl?: string;
  publishedAt: string;
}

export interface PlatformPublisher {
  readonly providerId: string;
  readonly platform: string;
  publish(platformPackage: PlatformPackage): Promise<PublishReceipt>;
}

export class MockYouTubeShortsPublisher implements PlatformPublisher {
  public readonly providerId: string;
  public readonly platform = "youtube-shorts";

  constructor(providerId = "mock-youtube-shorts") {
    this.providerId = providerId;
  }

  async publish(platformPackage: PlatformPackage): Promise<PublishReceipt> {
    return {
      providerId: this.providerId,
      platform: this.platform,
      status: "published",
      destinationId: `${platformPackage.runId}-${platformPackage.packageId}`,
      destinationUrl: `https://youtube.example/shorts/${platformPackage.runId}-${platformPackage.packageId}`,
      publishedAt: new Date().toISOString()
    };
  }
}

export interface YouTubeShortsPublisherConfig {
  baseUrl: string;
  apiKey?: string;
  oauth?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    scope?: string;
  };
  providerId?: string;
  timeoutMs?: number;
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

interface PublishResponse {
  id?: string;
  url?: string;
  status?: string;
}

interface OAuthTokenResponse {
  access_token?: string;
  expires_in?: number;
}

interface CachedOAuthToken {
  token: string;
  expiresAt: number;
}

export class YouTubeShortsPublisher implements PlatformPublisher {
  public readonly providerId: string;
  public readonly platform = "youtube-shorts";
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly oauth?: YouTubeShortsPublisherConfig["oauth"];
  private cachedToken?: CachedOAuthToken;

  constructor(config: YouTubeShortsPublisherConfig) {
    this.providerId = config.providerId ?? "youtube-shorts-publisher";
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.oauth = config.oauth;
    this.timeoutMs = config.timeoutMs ?? 45000;
  }

  private async getAuthorizationHeader(): Promise<string | undefined> {
    if (this.apiKey) {
      return `Bearer ${this.apiKey}`;
    }

    if (!this.oauth) {
      return undefined;
    }

    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return `Bearer ${this.cachedToken.token}`;
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.oauth.refreshToken,
      client_id: this.oauth.clientId,
      client_secret: this.oauth.clientSecret
    });

    if (this.oauth.scope) {
      body.set("scope", this.oauth.scope);
    }

    const response = await providerFetch(
      this.oauth.tokenUrl,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      },
      {
        providerId: `${this.providerId}-oauth`,
        timeoutMs: this.timeoutMs,
        maxRetries: 2,
        initialBackoffMs: 300,
        circuitFailureThreshold: 3,
        circuitOpenMs: 10000
      }
    );

    const parsed = (await response.json()) as OAuthTokenResponse;
    const token = parsed.access_token?.trim();
    if (!token) {
      throw new Error("YouTube OAuth token exchange returned empty access token");
    }

    const expiresInSeconds = parsed.expires_in && Number.isFinite(parsed.expires_in)
      ? parsed.expires_in
      : 3600;
    this.cachedToken = {
      token,
      expiresAt: Date.now() + Math.max(30000, (expiresInSeconds - 60) * 1000)
    };
    return `Bearer ${token}`;
  }

  async publish(platformPackage: PlatformPackage): Promise<PublishReceipt> {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };

    const authorization = await this.getAuthorizationHeader();
    if (authorization) {
      headers.authorization = authorization;
    }

    const response = await providerFetch(
      `${this.baseUrl}/api/youtube-shorts/publish`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          runId: platformPackage.runId,
          packageId: platformPackage.packageId,
          title: platformPackage.title,
          caption: platformPackage.caption,
          hashtags: platformPackage.hashtags,
          files: platformPackage.files
        })
      },
      {
        providerId: this.providerId,
        timeoutMs: this.timeoutMs,
        maxRetries: 2,
        initialBackoffMs: 300,
        circuitFailureThreshold: 3,
        circuitOpenMs: 10000
      }
    );

    const parsed = (await response.json()) as PublishResponse;
    const destinationId = parsed.id?.trim();
    if (!destinationId) {
      throw new Error("YouTube Shorts publisher returned empty destination id");
    }

    return {
      providerId: this.providerId,
      platform: this.platform,
      status: "published",
      destinationId,
      destinationUrl: parsed.url,
      publishedAt: new Date().toISOString()
    };
  }
}
