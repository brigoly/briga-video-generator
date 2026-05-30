export interface TopicInput {
  topic: string;
  platformProfile: "tiktok" | "youtube-shorts" | "instagram-reels";
  tone?: "cinematic" | "educational" | "playful" | "dramatic";
}

export interface ScriptArtifact {
  scriptId: string;
  runId: string;
  providerId: string;
  platformProfile: TopicInput["platformProfile"];
  topicNormalized: string;
  content: string;
  createdAt: string;
}

export interface ScriptVariant {
  variantId: string;
  parentScriptId: string;
  changeRequest: string;
  content: string;
  createdAt: string;
}

export interface ScriptGenerationRequest {
  runId: string;
  input: TopicInput;
  preferredProviderOrder: string[];
}
