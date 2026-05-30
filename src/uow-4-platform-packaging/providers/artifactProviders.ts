import { PackageFile, PackagingInput, PlatformPackage } from "../../shared-contracts/platformPackagingTypes";
import { providerFetch } from "../../shared-runtime/providerHttp";

export interface PackageArtifactProvider {
  readonly providerId: string;
  resolveFiles(input: PackagingInput, platformPackage: PlatformPackage): Promise<PackageFile[]>;
}

export class DeterministicArtifactProvider implements PackageArtifactProvider {
  public readonly providerId: string;

  constructor(providerId = "deterministic-artifacts") {
    this.providerId = providerId;
  }

  async resolveFiles(_input: PackagingInput, platformPackage: PlatformPackage): Promise<PackageFile[]> {
    return platformPackage.files;
  }
}

interface ResolveResponse {
  files?: PackageFile[];
}

export interface HttpArtifactProviderConfig {
  baseUrl: string;
  apiKey?: string;
  providerId?: string;
  timeoutMs?: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export class HttpArtifactProvider implements PackageArtifactProvider {
  public readonly providerId: string;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(config: HttpArtifactProviderConfig) {
    this.providerId = config.providerId ?? `http-artifacts-${normalizeBaseUrl(config.baseUrl)}`;
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  async resolveFiles(input: PackagingInput, platformPackage: PlatformPackage): Promise<PackageFile[]> {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };

    if (this.apiKey) {
      headers.authorization = `Bearer ${this.apiKey}`;
    }

    const response = await providerFetch(
      `${this.baseUrl}/api/packages/resolve`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          runId: input.runId,
          timelineId: input.timelineId,
          platform: input.platform,
          title: input.title,
          hashtags: input.hashtags,
          packageId: platformPackage.packageId,
          files: platformPackage.files
        })
      },
      {
        providerId: this.providerId,
        timeoutMs: this.timeoutMs,
        maxRetries: 2,
        initialBackoffMs: 200,
        circuitFailureThreshold: 3,
        circuitOpenMs: 10000
      }
    );

    const parsed = (await response.json()) as ResolveResponse;
    if (!parsed.files || parsed.files.length === 0) {
      throw new Error("Artifact provider returned empty files list");
    }

    return parsed.files;
  }
}

export class SequentialArtifactProvider implements PackageArtifactProvider {
  constructor(
    public readonly providerId: string,
    private readonly providers: PackageArtifactProvider[]
  ) {}

  async resolveFiles(input: PackagingInput, platformPackage: PlatformPackage): Promise<PackageFile[]> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        const files = await provider.resolveFiles(input, platformPackage);
        if (files.length > 0) {
          return files;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown provider error";
        errors.push(`${provider.providerId}: ${message}`);
      }
    }

    throw new Error(`All artifact providers failed. ${errors.join(" | ")}`);
  }
}
