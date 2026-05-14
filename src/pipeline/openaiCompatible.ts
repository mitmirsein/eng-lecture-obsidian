import { requestUrl } from "obsidian";
import type { DenseBundle, GenerationInput, GenerationOutput, KMasterMeta, MosaicSettings, TriageResult } from "./types";
import { buildDenseAnalysisPrompt, buildGenerationPrompt, buildKMasterPrompt, buildTriagePrompt } from "./prompt";
import { runSchemaGate } from "./schemaGate";
import { runForensicAudit } from "./audit";

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

async function runDenseAnalysis(
  settings: MosaicSettings,
  input: GenerationInput,
  triage?: TriageResult,
): Promise<DenseBundle | undefined> {
  console.log("Mosaic [Dense Analysis]: 8인 번들 분석 시작");
  try {
    const content = await callLLM(
      settings,
      "Return only valid JSON. Do not wrap the response in Markdown fences.",
      buildDenseAnalysisPrompt(input, triage),
      16384,
    );
    const parsed = extractJson(content) as Partial<DenseBundle>;
    if (!parsed.block_a || !parsed.instructors) {
      console.warn("Mosaic [Dense Analysis]: block_a 또는 instructors 누락 — 번들 실패");
      return undefined;
    }
    const inst = parsed.instructors;
    if (!inst.insight || !inst.ella || !inst.luna || !inst.sunny || !inst.miranda || !inst.lex || !inst.villanelle || !inst.quill) {
      console.warn("Mosaic [Dense Analysis]: 강사 데이터 불완전 — 번들 실패");
      return undefined;
    }
    const bundle = parsed as DenseBundle;
    const violations = runSchemaGate(bundle);
    if (violations.length > 0) {
      console.warn("Mosaic [Schema Gate]:", violations.map(v => `${v.path}: ${v.actual}`).join(", "));
      console.warn("Mosaic [Schema Gate]: 구조 위반 — fallback 사용");
      return undefined;
    }
    console.log("Mosaic [Schema Gate]: PASS");
    console.log("Mosaic [Dense Analysis]: 번들 생성 완료");
    return bundle;
  } catch (err) {
    console.warn("Mosaic [Dense Analysis]: 실패 — 단일 호출 fallback 사용", err);
    return undefined;
  }
}

async function runKMaster(
  settings: MosaicSettings,
  input: GenerationInput,
  triage: TriageResult | undefined,
  bundle: DenseBundle,
): Promise<GenerationOutput> {
  console.log("Mosaic [K-Master]: 교안 렌더링 시작");
  const content = await callLLM(
    settings,
    "Return only valid JSON. Do not wrap the response in Markdown fences.",
    buildKMasterPrompt(input, triage, bundle),
    8192,
  );
  const parsed = extractJson(content) as Partial<GenerationOutput & { kmaster_meta: KMasterMeta }>;
  if (typeof parsed.masterMarkdown !== "string") {
    throw new Error("K-Master JSON must include masterMarkdown.");
  }
  console.log("Mosaic [K-Master]: 교안 렌더링 완료");

  const kmaster_meta = parsed.kmaster_meta;
  const correctAnswer = parsed.metadata?.correct_answer;

  const auditResult = runForensicAudit(bundle, kmaster_meta, triage, correctAnswer);
  console.log(`Mosaic [Audit]: ${auditResult.score}/100 — ${auditResult.pass ? "PASS" : "FAIL"}`);

  return {
    masterMarkdown: parsed.masterMarkdown,
    metadata: parsed.metadata,
    triage,
    bundle,
    kmaster_meta,
    auditResult,
    raw: content,
  };
}

export async function generateLectureAssets(
  settings: MosaicSettings,
  input: GenerationInput,
): Promise<GenerationOutput> {
  if (!settings.apiKey.trim()) throw new Error("API key is not configured.");

  // Call 1: Triage
  const triage = await runTriage(settings, input);

  // Call 2: Dense Analysis
  const bundle = await runDenseAnalysis(settings, input, triage);

  // Call 3: K-Master (or fallback to single-call)
  if (bundle) {
    return await runKMaster(settings, input, triage, bundle);
  }

  console.warn("Mosaic: Dense Analysis 실패 — 단일 호출 fallback");
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
