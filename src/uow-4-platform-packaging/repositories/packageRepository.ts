import { PlatformPackage } from "../../shared-contracts/platformPackagingTypes";

export interface PackageRepository {
  save(platformPackage: PlatformPackage): Promise<void>;
  getByRun(runId: string): Promise<PlatformPackage[]>;
}

export class InMemoryPackageRepository implements PackageRepository {
  private readonly packages = new Map<string, PlatformPackage[]>();

  async save(platformPackage: PlatformPackage): Promise<void> {
    const list = this.packages.get(platformPackage.runId) ?? [];
    list.push(platformPackage);
    this.packages.set(platformPackage.runId, list);
  }

  async getByRun(runId: string): Promise<PlatformPackage[]> {
    return this.packages.get(runId) ?? [];
  }
}
