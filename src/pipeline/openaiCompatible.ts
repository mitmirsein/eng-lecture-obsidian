import type { GenerationInput, GenerationOutput, MosaicSettings } from "./types";
import { buildGenerationPrompt } from "./prompt";

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

export async function generateLectureAssets(
  settings: MosaicSettings,
  input: GenerationInput,
): Promise<GenerationOutput> {
  if (!settings.apiKey.trim()) {
    throw new Error("API key is not configured.");
  }

  const response = await fetch(settings.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: "Return only valid JSON. Do not wrap the response in Markdown fences.",
        },
        {
          role: "user",
          content: buildGenerationPrompt(input),
        },
      ],
      temperature: 0.4,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM response has no message content.");
  }

  const parsed = extractJson(content) as Partial<GenerationOutput>;
  if (typeof parsed.masterMarkdown !== "string") {
    throw new Error("LLM JSON must include masterMarkdown.");
  }

  return {
    masterMarkdown: parsed.masterMarkdown,
    raw: data,
  };
}

