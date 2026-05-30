import {
  DeterministicArtifactProvider,
  HttpArtifactProvider,
  PackageArtifactProvider,
  SequentialArtifactProvider
} from "./artifactProviders";

export interface PackagingProviderFactoryConfig {
  localArtifactBaseUrl?: string;
  cloudArtifactBaseUrl?: string;
  cloudArtifactApiKey?: string;
  artifactTimeoutMs?: number;
}

export interface PackagingRuntimeProviderOptions {
  requireRealProvider?: boolean;
}

export class PackagingProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackagingProviderConfigurationError";
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

export function buildDefaultPackagingProvider(
  config: PackagingProviderFactoryConfig = {}
): PackageArtifactProvider | undefined {
  const localArtifactBaseUrl =
    config.localArtifactBaseUrl ?? fromEnv("UOW4_ARTIFACT_PROVIDER_LOCAL_BASE_URL");
  const cloudArtifactBaseUrl =
    config.cloudArtifactBaseUrl ?? fromEnv("UOW4_ARTIFACT_PROVIDER_CLOUD_BASE_URL");
  const cloudArtifactApiKey =
    config.cloudArtifactApiKey ?? fromEnv("UOW4_ARTIFACT_PROVIDER_CLOUD_API_KEY");

  const timeoutMsFromConfig = config.artifactTimeoutMs;
  const timeoutMsFromEnv = fromEnv("UOW4_ARTIFACT_PROVIDER_TIMEOUT_MS");
  const timeoutMs =
    timeoutMsFromConfig ??
    (timeoutMsFromEnv && Number.isFinite(Number(timeoutMsFromEnv)) ? Number(timeoutMsFromEnv) : undefined);

  const providers = [
    ...(localArtifactBaseUrl
      ? [
          new HttpArtifactProvider({
            baseUrl: localArtifactBaseUrl,
            providerId: "artifact-local",
            timeoutMs
          })
        ]
      : []),
    ...(cloudArtifactBaseUrl
      ? [
          new HttpArtifactProvider({
            baseUrl: cloudArtifactBaseUrl,
            apiKey: cloudArtifactApiKey,
            providerId: "artifact-cloud",
            timeoutMs
          })
        ]
      : [])
  ];

  if (providers.length === 0) {
    return undefined;
  }

  return providers.length === 1
    ? providers[0]
    : new SequentialArtifactProvider("artifact-provider-chain", providers);
}

export function buildRuntimePackagingProvider(
  config: PackagingProviderFactoryConfig = {},
  options: PackagingRuntimeProviderOptions = {}
): PackageArtifactProvider {
  const provider = buildDefaultPackagingProvider(config);
  if (provider) {
    return provider;
  }

  if (options.requireRealProvider) {
    throw new PackagingProviderConfigurationError(
      "Real packaging provider mode is enabled but no artifact provider endpoint is configured. Set UOW4_ARTIFACT_PROVIDER_LOCAL_BASE_URL for local-first routing, or set UOW4_ARTIFACT_PROVIDER_CLOUD_BASE_URL and UOW4_ARTIFACT_PROVIDER_CLOUD_API_KEY for cloud fallback."
    );
  }

  return new DeterministicArtifactProvider();
}
