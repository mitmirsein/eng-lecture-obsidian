import { requestUrl } from "obsidian";
import type { GenerationInput, GenerationOutput, MosaicSettings, TriageResult } from "./types";
import { buildTriagePrompt, buildGenerationPrompt } from "./prompt";

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

async function callLLM(
  settings: MosaicSettings,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 8192,
): Promise<string> {
  const isAnthropic = settings.provider === "claude";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isAnthropic) {
    headers["x-api-key"] = settings.apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `Bearer ${settings.apiKey}`;
  }

  const body = isAnthropic
    ? {
        model: settings.model,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: maxTokens,
        system: systemPrompt,
        temperature: 0.1,
      }
    : {
        model: settings.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: maxTokens,
      };

  const response = await requestUrl({
    url: settings.endpoint,
    method: "POST",
    headers,
    body: JSON.stringify(body),
    throw: false,
  });

  if (response.status !== 200) {
    throw new Error(`LLM request failed: HTTP ${response.status} - ${response.text}`);
  }

  const data = response.json;
  const content: string | undefined = isAnthropic
    ? data?.content?.[0]?.text
    : data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") throw new Error("LLM response has no message content.");
  return content;
}

export async function runTriage(
  settings: MosaicSettings,
  input: GenerationInput,
): Promise<TriageResult | undefined> {
  console.log("Mosaic [Triage]: 문항 DNA 판독 시작");
  try {
    const content = await callLLM(
      settings,
      "Return only valid JSON. Do not wrap the response in Markdown fences.",
      buildTriagePrompt(input),
      1024,
    );
    const parsed = extractJson(content) as Partial<TriageResult>;
    if (!parsed.problem_type || !parsed.trap_frame || !parsed.persona_priority) {
      console.warn("Mosaic [Triage]: 필수 필드 누락 — triage 건너뜀");
      return undefined;
    }
    console.log(`Mosaic [Triage]: ${parsed.problem_type} | confidence=${parsed.confidence ?? "?"}`);
    return {
      problem_type: parsed.problem_type,
      target_grade: parsed.target_grade ?? "Ambiguous",
      trap_frame: parsed.trap_frame,
      persona_priority: parsed.persona_priority,
      anomalies: parsed.anomalies ?? [],
      confidence: parsed.confidence ?? 0.6,
    };
  } catch (err) {
    console.warn("Mosaic [Triage]: 실패 — 기본값으로 계속", err);
    return undefined;
  }
}

export async function generateLectureAssets(
  settings: MosaicSettings,
  input: GenerationInput,
): Promise<GenerationOutput> {
  if (!settings.apiKey.trim()) throw new Error("API key is not configured.");

  const triage = await runTriage(settings, input);

  console.log(`Mosaic [Generate]: ${settings.provider} -> ${settings.endpoint} (${settings.model})`);

  const content = await callLLM(
    settings,
    "Return only valid JSON. Do not wrap the response in Markdown fences.",
    buildGenerationPrompt(input, triage),
    8192,
  );

  const parsed = extractJson(content) as Partial<GenerationOutput>;
  if (typeof parsed.masterMarkdown !== "string") {
    throw new Error("LLM JSON must include masterMarkdown.");
  }

  return {
    masterMarkdown: parsed.masterMarkdown,
    metadata: parsed.metadata,
    triage,
    raw: content,
  };
}
