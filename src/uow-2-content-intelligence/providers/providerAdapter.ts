export interface ProviderGenerationInput {
  prompt: string;
  maxTokens: number;
}

export interface ProviderGenerationOutput {
  providerId: string;
  content: string;
}

export interface LlmProviderAdapter {
  readonly providerId: string;
  generateScript(input: ProviderGenerationInput): Promise<ProviderGenerationOutput>;
}

export class MockProviderAdapter implements LlmProviderAdapter {
  constructor(
    public readonly providerId: string,
    private readonly behavior: (input: ProviderGenerationInput) => Promise<string>
  ) {}

  async generateScript(input: ProviderGenerationInput): Promise<ProviderGenerationOutput> {
    return {
      providerId: this.providerId,
      content: await this.behavior(input)
    };
  }
}
