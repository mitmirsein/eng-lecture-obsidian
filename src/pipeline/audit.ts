import type { AuditItem, AuditResult, DenseBundle, KMasterMeta, TriageResult } from "./types";

const TRAP_KEYWORDS: Record<string, string[]> = {
  "어법_선택형": ["정상성", "비문", "어법"],
  "어법_서술형": ["수정",   "정상성", "병렬"],
  "빈칸추론":    ["반대",   "부분", "범위", "매력"],
  "내용일치":    ["부분",   "일반화", "세부"],
  "순서삽입":    ["연결사", "지시어", "단절", "응집"],
};

function koreanRatio(text: string): number {
  if (!text || text.length === 0) return 1;
  const kor = (text.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g) || []).length;
  return kor / text.length;
}

export function runForensicAudit(
  bundle: DenseBundle,
  kmaster_meta: KMasterMeta | undefined,
  triage: TriageResult | undefined,
  correctAnswer: string | undefined,
): AuditResult {
  const items: AuditItem[] = [];
  let score = 100;
  const inst = bundle.instructors;
  const problemType = triage?.problem_type ?? "";
  const isMaskingRequired = ["어법_선택형", "어법_서술형", "빈칸추론"].includes(problemType);

  // ── 항목 1: 정답·마스킹·정합 (30점) ─────────────────────────────────────
  const hasAnswer     = !!correctAnswer;
  const masked        = inst.luna?.block_a_masked ?? "";
  const maskingPass   = !isMaskingRequired || (masked.length > 0 && masked.includes("[   ]"));
  const recheckVerdict = kmaster_meta?.answer_recheck?.kmaster_verdict;
  const recheckPass   = recheckVerdict === "정합";
  const item1Pass     = hasAnswer && maskingPass && recheckPass;
  const item1Reasons  = [
    !hasAnswer    && "correct_answer 누락",
    !maskingPass  && "Luna block_a_masked 누락 또는 [   ] 마커 부재",
    !recheckPass  && `K-Master verdict: ${recheckVerdict ?? "없음"}`,
  ].filter(Boolean) as string[];

  score -= item1Pass ? 0 : 30;
  items.push({
    item:   "1. 정답·마스킹·정합",
    code:   item1Pass ? "ITEM1_PASS" : "ITEM1_FAIL",
    score:  item1Pass ? 30 : 0,
    status: item1Pass ? "✅ PASS" : `❌ FAIL — ${item1Reasons.join(" / ")}`,
  });

  // ── 항목 2: 함정 프레임 정합 (25점) ─────────────────────────────────────
  const di              = inst.insight?.distractor_intelligence ?? [];
  const expectedKw      = TRAP_KEYWORDS[problemType] ?? [];
  const diText          = di.map(d => `${d.trap_type ?? ""} ${d.cognitive_reason ?? ""}`).join(" ");
  const matchedKw       = expectedKw.filter(kw => diText.includes(kw));
  const item2Pass       = di.length >= 3 && (expectedKw.length === 0 || matchedKw.length >= 1);

  score -= item2Pass ? 0 : 25;
  items.push({
    item:   "2. 함정 프레임 정합",
    code:   item2Pass ? "ITEM2_PASS" : di.length < 3 ? "ITEM2_FAIL_DI_COUNT" : "ITEM2_FAIL_KEYWORD",
    score:  item2Pass ? 25 : 0,
    status: item2Pass
      ? `✅ PASS (DI ${di.length}건, 키워드: ${matchedKw.join(",")||"전체유형"} 일치)`
      : `❌ FAIL — DI ${di.length}/3건, 키워드 일치 ${matchedKw.length}건`,
  });

  // ── 항목 3: 페르소나 역할 정합 (20점) ───────────────────────────────────
  let p3score = 20;
  const p3fails: string[] = [];

  const cohesionCount   = inst.miranda?.cohesion_bridges?.length ?? 0;
  const paraphraseCount = inst.lex?.paraphrase_layers?.length ?? 0;
  if (cohesionCount  < 1) { p3score -= 6; p3fails.push("Miranda cohesion_bridges < 1"); }
  if (paraphraseCount < 2) { p3score -= 6; p3fails.push("Lex paraphrase_layers < 2"); }

  const checkKorean = (id: string, field: string, text: string | undefined) => {
    if (!text || text.length === 0) return;
    const r = koreanRatio(text);
    if (r < 0.30) {
      p3score -= 4;
      p3fails.push(`${id}.${field} 한글 비율 ${(r * 100).toFixed(0)}% < 30%`);
    }
  };
  checkKorean("ella",  "theme_ko",         inst.ella?.theme_ko);
  checkKorean("ella",  "main_idea_ko",      inst.ella?.main_idea_ko);
  checkKorean("sunny", "grammar_deep_dive", inst.sunny?.grammar_deep_dive);

  p3score = Math.max(0, p3score);
  score  -= (20 - p3score);
  items.push({
    item:   "3. 페르소나 역할 정합",
    code:   p3fails.length === 0 ? "ITEM3_PASS" : "ITEM3_PARTIAL",
    score:  p3score,
    status: p3fails.length === 0 ? "✅ PASS" : `⚠️ ${p3fails.join(" / ")}`,
  });

  // ── 항목 4: 변형 문항 변별력 (15점) ─────────────────────────────────────
  let p4score = 15;
  const p4fails: string[] = [];
  const variantType     = kmaster_meta?.variant_question_type ?? "";
  const designStrategy  = kmaster_meta?.design_strategy ?? "";
  const coachingTip     = kmaster_meta?.coaching_tip ?? "";

  if (problemType && variantType &&
      (variantType.includes(problemType) || problemType.includes(variantType))) {
    p4score -= 7;
    p4fails.push(`유형 중복 (원본: ${problemType} / 변형: ${variantType})`);
  }
  if (designStrategy.length < 40) { p4score -= 4; p4fails.push(`design_strategy < 40자 (${designStrategy.length}자)`); }
  if (coachingTip.length   < 40)  { p4score -= 4; p4fails.push(`coaching_tip < 40자 (${coachingTip.length}자)`); }

  p4score = Math.max(0, p4score);
  score  -= (15 - p4score);
  items.push({
    item:   "4. 변형 문항 변별력",
    code:   p4fails.length === 0 ? "ITEM4_PASS" : "ITEM4_PARTIAL",
    score:  p4score,
    status: p4fails.length === 0 ? "✅ PASS" : `⚠️ ${p4fails.join(" / ")}`,
  });

  // ── 항목 5: 원문 결함 주석 (10점) ───────────────────────────────────────
  const rawAnomalies  = (triage?.anomalies ?? []).filter(a => a.type === "원문_결함");
  const sunnyText     = inst.sunny?.grammar_deep_dive ?? "";
  const annotated     = rawAnomalies.length === 0 ||
    rawAnomalies.every(a => sunnyText.includes(a.expression.slice(0, 10)));

  score -= annotated ? 0 : 10;
  items.push({
    item:   "5. 원문 결함 주석",
    code:   annotated
      ? (rawAnomalies.length === 0 ? "ITEM5_PASS_NO_ANOMALY" : "ITEM5_PASS")
      : "ITEM5_FAIL_UNANNOTATED",
    score:  annotated ? 10 : 0,
    status: annotated
      ? (rawAnomalies.length === 0 ? "✅ PASS (anomaly 없음)" : `✅ PASS (${rawAnomalies.length}건 처리)`)
      : `❌ FAIL — 원문_결함 ${rawAnomalies.length}건 미주석`,
  });

  score = Math.max(0, score);
  return { pass: score >= 80, score, items };
}
