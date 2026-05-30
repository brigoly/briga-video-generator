import express, { Request, Response } from "express";
import { InMemoryPackageRepository } from "../repositories/packageRepository";
import { MultiPlatformPackagingService } from "../services/multiPlatformOrchestrator";
import { buildPlatformPackagingRouter } from "./router";
import {
  buildRuntimePackagingProvider,
  PackagingProviderConfigurationError,
  PackagingProviderFactoryConfig
} from "../providers/providerFactory";
import {
  buildRuntimePublishers,
  PublisherConfigurationError,
  PublisherFactoryConfig
} from "../providers/publisherFactory";
import { createRuntimeFoundationService } from "../../shared-runtime/foundationRuntime";

export interface PlatformPackagingAppOptions {
  service?: MultiPlatformPackagingService;
  providerConfig?: PackagingProviderFactoryConfig;
  publisherConfig?: PublisherFactoryConfig;
  requireRealProvider?: boolean;
  requireRealPublisher?: boolean;
}

function envFlag(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function createRuntimePlatformPackagingService(
  providerConfig?: PackagingProviderFactoryConfig,
  options: { requireRealProvider?: boolean; requireRealPublisher?: boolean } = {},
  publisherConfig?: PublisherFactoryConfig
): MultiPlatformPackagingService {
  const artifactProvider = buildRuntimePackagingProvider(providerConfig, {
    requireRealProvider: options.requireRealProvider
  });
  const publishers = buildRuntimePublishers(publisherConfig, {
    requireRealPublisher: options.requireRealPublisher
  });
  const foundationService = createRuntimeFoundationService();

  return new MultiPlatformPackagingService(
    new InMemoryPackageRepository(),
    artifactProvider,
    foundationService,
    publishers
  );
}

export function buildPlatformPackagingApp(options: PlatformPackagingAppOptions = {}) {
  const app = express();
  app.use(express.json());

  try {
    const service =
      options.service ??
      createRuntimePlatformPackagingService(
        options.providerConfig,
        {
          requireRealProvider: options.requireRealProvider ?? envFlag("UOW4_REQUIRE_REAL_PROVIDER", false),
          requireRealPublisher: options.requireRealPublisher ?? envFlag("UOW4_REQUIRE_REAL_PUBLISHER", false)
        },
        options.publisherConfig
      );
    app.use("/v1", buildPlatformPackagingRouter(service));
  } catch (err) {
    if (err instanceof PackagingProviderConfigurationError) {
      app.use("/v1", (_req, res) => {
        res.status(503).json({
          code: "PACKAGING_PROVIDER_CONFIGURATION_ERROR",
          message: err.message
        });
      });
    } else if (err instanceof PublisherConfigurationError) {
      app.use("/v1", (_req, res) => {
        res.status(503).json({
          code: "PUBLISHER_CONFIGURATION_ERROR",
          message: err.message
        });
      });
    } else {
      throw err;
    }
  }

  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    if (err instanceof PackagingProviderConfigurationError) {
      res.status(503).json({ code: "PACKAGING_PROVIDER_CONFIGURATION_ERROR", message: err.message });
      return;
    }
    if (err instanceof PublisherConfigurationError) {
      res.status(503).json({ code: "PUBLISHER_CONFIGURATION_ERROR", message: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ code: "UNEXPECTED", message });
  });

  return app;
}
