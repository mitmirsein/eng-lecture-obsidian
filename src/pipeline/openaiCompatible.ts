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

  const isAnthropic = settings.provider === "claude";
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (isAnthropic) {
    headers["x-api-key"] = settings.apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `Bearer ${settings.apiKey}`;
  }

  const body = isAnthropic 
    ? {
        model: settings.model,
        messages: [
          {
            role: "user",
            content: buildGenerationPrompt(input),
          },
        ],
        max_tokens: 8192,
        system: "Return only valid JSON. Do not wrap the response in Markdown fences.",
        temperature: 0.4,
      }
    : {
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
      };

  const response = await fetch(settings.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  let content: string | undefined;

  if (isAnthropic) {
    content = data?.content?.[0]?.text;
  } else {
    content = data?.choices?.[0]?.message?.content;
  }

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

