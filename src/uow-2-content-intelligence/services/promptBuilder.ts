import { TopicInput } from "../../shared-contracts/contentIntelligenceTypes";

export function normalizeTopic(rawTopic: string): string {
  return rawTopic
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function buildScriptPrompt(input: TopicInput): string {
  const normalized = normalizeTopic(input.topic);
  const tone = input.tone ?? "cinematic";

  return [
    "You are a short-form video script writer.",
    `Topic: ${normalized}`,
    `Platform: ${input.platformProfile}`,
    `Tone: ${tone}`,
    "Output a concise hook, 3 core beats, and a closing CTA."
  ].join("\n");
}

export function buildVariantPrompt(previousScript: string, changeRequest: string): string {
  return [
    "Regenerate the following short-form script with requested changes.",
    `Change request: ${changeRequest}`,
    "Original script:",
    previousScript,
    "Return only the regenerated script text."
  ].join("\n");
}
