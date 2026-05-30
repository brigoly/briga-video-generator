import {
  MultiPlatformPackageResult,
  PackagingInput,
  PackagingPlatform,
  PlatformPackage
} from "../../shared-contracts/platformPackagingTypes";
import { InMemoryPackageRepository, PackageRepository } from "../repositories/packageRepository";
import { buildPlatformPackage } from "./packagingCore";
import { DeterministicArtifactProvider, PackageArtifactProvider } from "../providers/artifactProviders";
import { PlatformFoundationService } from "../../uow-5-platform-foundation/services/platformFoundationService";
import { PlatformPublisher, PublishReceipt } from "../providers/publishers";

export class MultiPlatformPackagingService {
  constructor(
    private readonly repository: PackageRepository = new InMemoryPackageRepository(),
    private readonly artifactProvider: PackageArtifactProvider = new DeterministicArtifactProvider(),
    private readonly foundationService?: PlatformFoundationService,
    private readonly publishers: Map<string, PlatformPublisher> = new Map()
  ) {}

  async buildSingle(input: PackagingInput): Promise<PlatformPackage> {
    const basePackage = buildPlatformPackage(input);
    const resolvedFiles = await this.artifactProvider.resolveFiles(input, basePackage);
    const platformPackage: PlatformPackage = {
      ...basePackage,
      files: resolvedFiles
    };
    await this.repository.save(platformPackage);

    if (this.foundationService) {
      await this.foundationService.persistStageArtifact({
        runId: input.runId,
        stageId: "uow-4-platform-packaging",
        artifactKind: "output",
        artifactName: `package-${input.platform}`,
        payload: platformPackage,
        parameters: {
          platform: input.platform,
          timelineId: input.timelineId,
          title: input.title
        }
      });
      await this.foundationService.recordTelemetryEvent({
        runId: input.runId,
        stageId: "uow-4-platform-packaging",
        eventType: "StageCompleted",
        message: "Platform package build completed",
        metadata: {
          platform: input.platform,
          files: platformPackage.files.length,
          providerId: this.artifactProvider.providerId
        }
      });
    }

    return platformPackage;
  }

  async buildMulti(
    runId: string,
    timelineId: string,
    title: string,
    hashtags: string[],
    platforms: PackagingPlatform[]
  ): Promise<MultiPlatformPackageResult> {
    const packages: PlatformPackage[] = [];

    for (const platform of platforms) {
      const generated = await this.buildSingle({
        runId,
        timelineId,
        platform,
        title,
        hashtags
      });
      packages.push(generated);
    }

    return {
      runId,
      packages
    };
  }

  async publishYouTubeShorts(runId: string): Promise<PublishReceipt> {
    const publisher = this.publishers.get("youtube-shorts");
    if (!publisher) {
      throw new Error("YouTube Shorts publisher is not configured");
    }

    const packages = await this.repository.getByRun(runId);
    const target = [...packages].reverse().find((pkg) => pkg.platform === "youtube-shorts");
    if (!target) {
      throw new Error(`No YouTube Shorts package found for run ${runId}`);
    }

    const receipt = await publisher.publish(target);

    if (this.foundationService) {
      await this.foundationService.persistStageArtifact({
        runId,
        stageId: "uow-4-platform-packaging",
        artifactKind: "output",
        artifactName: "youtube-shorts-publish-receipt",
        payload: receipt,
        parameters: {
          packageId: target.packageId,
          publisherId: publisher.providerId
        }
      });
      await this.foundationService.recordTelemetryEvent({
        runId,
        stageId: "uow-4-platform-packaging",
        eventType: "StageCompleted",
        message: "YouTube Shorts publish completed",
        metadata: {
          destinationId: receipt.destinationId,
          publisherId: publisher.providerId
        }
      });
    }

    return receipt;
  }
}
