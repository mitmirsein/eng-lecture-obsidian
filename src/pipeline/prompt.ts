import type { DenseBundle, GenerationInput, TriageResult } from "./types";

export function buildTriagePrompt(input: GenerationInput): string {
  return `너는 Mosaic Curriculum Pipeline의 Triage Orchestrator다.
지문·문항을 분석하여 파이프라인 행동 규칙을 결정한다.

## 정적 매핑 (problem_type → trap_frame / persona_priority)

| problem_type | trap_frame | lead | reduce |
|---|---|---|---|
| 어법_선택형 | 비문/정상성 검증 — 오답 보기가 왜 어법상 맞는가 | ["Sunny"] | ["Miranda"] |
| 어법_서술형 | 수정 전/후 쌍 명시 + 나머지 보기 정상성 증명 | ["Sunny","Villanelle"] | ["Miranda"] |
| 빈칸추론 | 매력적 오답 프레임 — 반대 정보·부분 일치·범위 초과 | ["Miranda","Lex"] | ["Luna"] |
| 내용일치 | 부분 정보·일반화·세부 혼동 | ["Luna","Lex"] | ["Sunny"] |
| 순서삽입 | 응집 마커(연결사·지시어·대명사) 기반 단절점 분석 | ["Miranda"] | ["Ella"] |
| 주제_제목_요지 | 매력적 오답 프레임 — 지엽적 정보·반대 정보·범위 초과 | ["Ella","Miranda"] | ["Sunny"] |
| 기타 | 유형 미확정 — 전체 페르소나 균등 적용 | ["Insight"] | [] |

## confidence 계산
- 판정 신호 ≥ 2개 → 0.8 | 신호 1개 → 0.6 | 신호 0개 → 0.4 + target_grade 강제 "Ambiguous"

## anomaly detection
- 어법 문항 밑줄 영역 내 비문 → type: "출제_의도"
- 그 외 비표준 용법 → type: "원문_결함", note를 ⚠️로 시작

## 레벨 자체 추론 (inferred_level / inferred_target_grade)
사용자의 세팅 값(레벨 힌트, 학년 힌트)과는 별도로, 지문과 문항의 실제 내용을 분석하여 레벨과 대상 학년을 독자적으로 추론한다.
추론 근거:
1. 어휘 난이도 (고빈도 일상어 vs 저빈도 학술어)
2. 구문 복잡도 (단문/중문 비율, 종속절 깊이, 삽입구 빈도)
3. 지문 길이 및 선지 구성의 정교함
4. 출처 단서 (수능, 모의고사, 교육청, 내신 등의 출처 표시가 있으면 참고)
5. 추상적 사고 요구 수준

결과를 inferred_level (M1~M3, H1~H3), inferred_target_grade (중등/고등), level_rationale (1~2문장 근거)로 반환한다.

## 반환 JSON (additionalProperties 금지)
{
  "problem_type": "어법_선택형" | "어법_서술형" | "빈칸추론" | "내용일치" | "순서삽입" | "주제_제목_요지" | "기타",
  "target_grade": "중등" | "고등" | "Ambiguous",
  "inferred_level": "M1" | "M2" | "M3" | "H1" | "H2" | "H3",
  "inferred_target_grade": "중등" | "고등" | "Ambiguous",
  "level_rationale": "추론 근거 1~2문장",
  "trap_frame": "(위 표 해당 행 값 그대로)",
  "persona_priority": { "lead": ["..."], "reduce": ["..."] },
  "anomalies": [],
  "confidence": 0.0
}

사용자 세팅 — 레벨 힌트: ${input.level} | 학년 힌트: ${input.targetGrade}
(위 힌트는 참고용이다. 실제 문항 분석에 기반한 독자적 추론 결과를 inferred_level/inferred_target_grade에 기록한다.)

원문:
${input.sourceText}

반드시 위 JSON만 반환하라.`;
}

export function buildGenerationPrompt(input: GenerationInput, triage?: TriageResult): string {
  const triageBlock = triage ? `
## [Triage 행동 규칙 — 최우선 적용]
- 문항 유형: **${triage.problem_type}**
- 함정 프레임: ${triage.trap_frame}
- 리드 페르소나 (심층 집중): ${triage.persona_priority.lead.join(", ")}
- 축소 페르소나 (간결하게): ${triage.persona_priority.reduce.join(", ") || "없음"}${triage.anomalies?.length ? `\n- 이상 탐지: ${triage.anomalies.map(a => `[${a.type}] "${a.expression}" → ${a.note}`).join(" | ")}` : ""}

` : "";

  return `너는 Mosaic Curriculum Pipeline의 전문 영어 강사 AI 군단이다.
사용자가 제공한 지문을 분석하여, 대한민국 최상위권 수험생과 강사를 위한 '포렌식 교안'을 생성한다.
${triageBlock}
## [중요 지침]
1. 모든 해설은 한국어 평서문(~한다)으로 작성하며, 전문적인 교육 용어를 사용한다.
2. 지문의 논리적 구조를 해부하고, 출제자의 의도를 꿰뚫는 분석을 제공한다.
3. 사용자가 입력한 '원문'이 가공되지 않은 기출문제(지문+문항+선지)인 경우, 이를 정확히 파싱하여 구조화한다.
4. 분석 결과와 함께, 원본 노트를 분류하기 위한 메타데이터(metadata)도 함께 추출한다.
5. 이탤릭 문법을 사용하지 않는다. 단일 별표/언더스코어 강조(*text*, _text_)를 금지하고, 강조가 필요하면 굵게(**text**)만 사용한다.
${triage ? `6. Triage 리드 페르소나(${triage.persona_priority.lead.join(", ")})의 분석 관점을 BLOCK B의 핵심 섹션에 반영한다.` : ""}

## [반드시 반환해야 할 JSON 형식]

{
  "metadata": {
    "passage_id": "지문을 대표하는 영문 ID (예: Boredom_Workshop)",
    "level": "H1/H2/H3/M1/M2/M3 중 판단",
    "problem_type": "문항 유형 (예: 제목, 주제, 빈칸추론, 문장삽입, 글의순서 등)",
    "topic": "지문의 핵심 소재/주제 (한국어)",
    "correct_answer": "정답 번호 (숫자만)"
  },
  "masterMarkdown": "통합 분석 교안 마크다운 전문"
}

## [마크다운 교안 표준 구조]

---
title: "지문ID 포렌식 교안"
---

# 📖 **지문ID**
> **Mosaic Academy** 영어과 | **세팅 레벨:** Level | **세팅 대상:** Grade
> **LLM 추론 레벨:** InferredLevel | **LLM 추론 대상:** InferredGrade | **근거:** Rationale

---

# 📝 **BLOCK A — 풀기 전 (먼저 풀어보세요)**
### **[지문]**
(파싱된 지문 원문)
### **[문항]**
(파싱된 질문 내용)
### **[선지]**
(파싱된 1-5번 선지)

---

# 🔬 **BLOCK B — 포렌식 해부**
**🎯 정답: 정답번호**

... (이후 01~07 섹션 및 시그니처 분석 수행) ...

## [입력 데이터]
대상 파일: ${input.sourcePath}
지문 ID: ${input.slug}
레벨: ${input.level}
대상 학년: ${input.targetGrade}

원문:
${input.sourceText}

반드시 위 JSON 구조를 따르는 응답만 반환하라.
`;
}

export function buildDenseAnalysisPrompt(input: GenerationInput, triage?: TriageResult): string {
  const needsMasking = triage && ["어법_선택형", "어법_서술형", "빈칸추론"].includes(triage.problem_type);
  const maskingNote = needsMasking
    ? "어법/빈칸 문항 — 정답 영역을 [   ]로 마스킹한 block_a_masked 필수"
    : "block_a_masked 생략 가능";
  const leadNote = triage
    ? `리드 강사 (80% 집중): ${triage.persona_priority.lead.join(", ")} | 축소 강사: ${triage.persona_priority.reduce.join(", ") || "없음"}`
    : "";
  const trapNote = triage ? `함정 프레임: ${triage.trap_frame}` : "";

  return `너는 Mosaic Curriculum Pipeline Analyst-Line이다.
8인의 전문 강사가 동시에 지문을 해부하여 분석 번들 JSON을 생성한다.

## Triage 행동 규칙
- 문항 유형: ${triage?.problem_type ?? "미확정"}
- ${trapNote}
- ${leadNote}

## 8인 강사 역할
- Insight: 오답 선지 전체 분석 (distractor_intelligence 최소 3건 필수 — 미달 = 오류)
- Ella: 학술 주제·심층 요지 메타인지
- Luna: 문장별 청크 직독직해 + ${maskingNote}
- Sunny: 핵심 구문 정밀 분석 (grammar_deep_dive — 구문 항목 3개 이상, 각 항목 2문장 이상, reduce 지시 무관 항상 필수) + 5초 시각 판별법
- Miranda: 문장 간 응집성 고리 분석 (Why-So-How)
- Lex: 핵심 어휘 정의 + 3단계 재진술 DB
- Villanelle: 제목·핵심 메시지 topic_master
- Quill: 서술형 영작 과제 (Q→A→한국어)

## 반환 JSON 스키마
{
  "passage_id": "${input.slug}",
  "block_a": {
    "clean_passage": "마스킹/해설 없는 원문 지문 그대로",
    "questions": ["발문 1문장 (예: 위 글의 제목으로 가장 적절한 것은?)"],
    "choices": ["① ...", "② ...", "③ ...", "④ ...", "⑤ ..."]
  },
  "instructors": {
    "insight": {
      "key_points": ["출제 타격 포인트 1", "포인트 2"],
      "traps_summary": "함정 전략 전체 요약 (~한다체)",
      "distractor_intelligence": [
        {"distractor_no": 1, "trap_type": "Partial/Detail/Opposite/Scope/기타", "cognitive_reason": "인지적 낚임 원리 (~한다체)"},
        {"distractor_no": 3, "trap_type": "...", "cognitive_reason": "..."},
        {"distractor_no": 4, "trap_type": "...", "cognitive_reason": "..."}
      ]
    },
    "ella": {
      "theme_ko": "국문 학술 주제",
      "theme_en": "Academic theme in English",
      "main_idea_ko": "심층 요지 (~한다체, 50자 이상)",
      "coaching_tip": "강사 코칭 전략 (~한다체)"
    },
    "luna": {
      "chunks": [
        {"sentence_idx": 1, "chunk_text": "끊어읽기 단위 원문", "literal_translation": "직역 한국어"}
      ],
      "topic_sentence": {"sentence_idx": 1, "text": "주제문 원문"},
      "summary": "전체 요약 (~한다체)",
      "block_a_masked": "(어법/빈칸 문항일 때만) 정답 영역 [   ] 마스킹 지문 전문"
    },
    "sunny": {
      "grammar_deep_dive": "핵심 구문 정밀 분석 (~한다체, 구문 항목 3개 이상 / 각 항목 2문장 이상 — reduce 지시 무관 항상 필수)",
      "visual_cue": "5초 판별법 1-2문장 (어법/빈칸 필수, 그 외 생략 가능)"
    },
    "miranda": {
      "labeled_sentences": [
        {"sentence_idx": 1, "logic_label": "주제문/근거/예시/부연/결론/전환", "connector": "연결어 또는 없음"}
      ],
      "logic_route": "논리 경로 (예: 도입 → 문제제기 → 근거 → 결론)",
      "cohesion_bridges": [
        {"sentence_pair": "S1-S2", "bridge_type": "연결어/지시어/재진술/관사/인과(Q&A)/기타", "bridge_word": "핵심 연결 단어", "explanation": "응집 설명 (~한다체)"},
        {"sentence_pair": "S2-S3", "bridge_type": "...", "bridge_word": "...", "explanation": "..."},
        {"sentence_pair": "S3-S4", "bridge_type": "...", "bridge_word": "...", "explanation": "..."}
      ]
    },
    "lex": {
      "vocabulary_entries": [
        {"word": "원형1", "pos": "n.", "definition": "영영 정의", "korean": "한국어 뜻"},
        {"word": "원형2", "pos": "v.", "definition": "영영 정의", "korean": "한국어 뜻"},
        {"word": "원형3", "pos": "adj.", "definition": "영영 정의", "korean": "한국어 뜻"}
      ],
      "paraphrase_layers": [
        {"keyword": "핵심어1", "synonyms": ["동의어1", "동의어2"], "contextual_equivalents": ["문맥 대체어1"], "antonym_negation": "반의어 부정"},
        {"keyword": "핵심어2", "synonyms": ["동의어1"], "contextual_equivalents": ["문맥 대체어1", "문맥 대체어2"], "antonym_negation": "반의어 부정"}
      ]
    },
    "villanelle": {
      "topic_master": {"title_ko": "제목 변형 후보 (한국어)", "core_message": "핵심 메시지 1문장 (~한다체)"}
    },
    "quill": {
      "writing_tasks": [
        {"q": "영어 발문", "a": "모범 영어 답안", "a_ko": "한국어 해석"}
      ]
    }
  }
}

## 입력 데이터
지문 ID: ${input.slug} | 레벨: ${input.level} | 학년: ${input.targetGrade}

원문:
${input.sourceText}

반드시 위 JSON만 반환하라. 이탤릭(*text*, _text_) 금지. 강조는 **text**만.`;
}

export function buildKMasterPrompt(
  input: GenerationInput,
  triage: TriageResult | undefined,
  bundle: DenseBundle,
): string {
  const bundleJson = JSON.stringify(bundle, null, 2);
  const isMaskingTarget = triage && ["어법_선택형", "어법_서술형", "빈칸추론"].includes(triage.problem_type);

  return `너는 Mosaic Curriculum Pipeline K-Master (최종 교안 발행자)이다.
분석 번들을 바탕으로 포렌식 교안 전체를 마크다운으로 렌더링하고,
원본 문항과 다른 유형의 변형 문항 1-2개를 설계한다.

## Triage
- 유형: ${triage?.problem_type ?? "미확정"} | 함정 프레임: ${triage?.trap_frame ?? ""}

## 분석 번들
\`\`\`json
${bundleJson}
\`\`\`

## 반환 JSON
{
  "metadata": {
    "passage_id": "영문 ID",
    "level": "H1/H2/H3/M1/M2/M3",
    "problem_type": "문항 유형",
    "topic": "핵심 소재/주제 (한국어)",
    "correct_answer": "정답 번호"
  },
  "kmaster_meta": {
    "design_strategy": "변형 문항 출제 전략 (~한다체, 40자 이상)",
    "coaching_tip": "강사용 문항 해설 전략 (~한다체, 40자 이상)",
    "answer_recheck": {
      "kmaster_verdict": "정합" | "불일치",
      "discrepancy_note": "(불일치 시에만) 사유"
    },
    "variant_question_type": "설계한 변형 문항의 유형 (예: 빈칸추론)"
  },
  "masterMarkdown": "포렌식 교안 마크다운 전문"
}

## 교안 마크다운 필수 구조
---
title: "지문ID 포렌식 교안"
---

# 📖 **지문ID**
> **Mosaic Academy** 영어과 | **세팅 레벨:** ${input.level} | **세팅 대상:** ${input.targetGrade}
> **LLM 추론 레벨:** ${triage?.inferred_level ?? input.level} | **LLM 추론 대상:** ${triage?.inferred_target_grade ?? input.targetGrade}${triage?.level_rationale ? ` | **근거:** ${triage.level_rationale}` : ""}

---

# 📝 **BLOCK A — 풀기 전 (먼저 풀어보세요)**
### **[지문]**
${isMaskingTarget ? "(bundle.instructors.luna.block_a_masked 사용)" : "(bundle.block_a.clean_passage 사용)"}
### **[문항]**
(bundle.block_a.questions 사용)
### **[선지]**
(bundle.block_a.choices 사용)

---

# 🔬 **BLOCK B — 포렌식 해부**
**🎯 정답: {correct_answer}**

---

## 01. 인사이트: 출제 의도 및 함정 분석
### **🎯 출제 타격 지점**
(insight.key_points → 불릿)
### **🧠 오답의 인지적 해부**
| 번호 | 함정 유형 | 인지적 낚임 포인트 |
(insight.distractor_intelligence → 표)

---

## 02. 엘라 & 미란다: 거시 독해
### **🏷️ 주제 및 요지**
- **국문 주제:** ella.theme_ko 값 그대로
- **영문 주제:** ella.theme_en 값 그대로
- **심층 요지:** ella.main_idea_ko 값 그대로
### **🧩 논리 구조 및 응집성**
| 문장 쌍 | 연결 방식 | 핵심 단어 | 논리적 결속 원리 |
(miranda.cohesion_bridges 전체 → 표. 최소 3행 필수 — 행 누락 = 오류)
> **논리 경로:** (miranda.logic_route)

---

## 03. 루나: 직독직해 (전체 복원)
(luna.chunks 전체 → **[S{n}]** chunk_text (literal_translation) 형식. 문장 누락 금지)

---

## 04. 써니: 구문 정밀 해부
(sunny.grammar_deep_dive — 구조 항목별로 소제목 분리 권장)
${isMaskingTarget ? "**⚡ 5초 판별법:** (sunny.visual_cue)" : ""}

---

## 05. 렉스: 어휘 및 재진술 레이어
### **[핵심 어휘]**
(lex.vocabulary_entries 전체 → **word** (pos): definition — korean 형식. 누락 금지)
### **🔄 3단계 재진술 DB**
| 키워드 | 동의어 | 문맥적 대체어 | 반의어 부정 |
(lex.paraphrase_layers 전체 → 표. 최소 2행 필수. synonyms·contextual_equivalents 배열 값은 " / " 구분으로 셀 안에 나열 — JSON 대괄호 그대로 출력 금지. 행 누락 = 오류)

---

## 06. 빌라넬 & 퀼: 변형 대비 및 영작
### **[지문 변형 포인트]**
> (villanelle.topic_master.core_message 인용구)

(quill.writing_tasks → **Q{n}.** q / **Answer:** a / **Interpretation:** a_ko 형식)

---

## 07. K마스터: 변형 문항
### **🕵️ 출제 전략**
(kmaster_meta.design_strategy — 원본 유형 [${triage?.problem_type ?? ""}] 중복 금지)
(변형 문항 1-2개 설계 — 선지는 수능 실제 형식, ①②③④⑤ 사용. 문장삽입 유형은 반드시 ①~⑤ 위치 선지 5개 포함 — 선지 없으면 오류)
(각 변형 문항 끝에 반드시 **🔑 정답: N** 표기 + 해설 1문장 추가 — 누락 = 오류)

---

## 📌 **1타강사 시그니처**
### **⚡ 5초 판별법 (원본 기출문제 기준)**
(sunny.visual_cue 값. 없으면 insight.traps_summary에서 핵심 단서 1문장으로 도출)

### **📊 함정 피해자 통계 (원본 기출문제 기준)**
(원본 문항의 매력적 오답 1순위 선지에 대해 가공 피해자 통계 생성.
예: "대치동 수강생 43%가 ①번을 선택했다." — 반드시 원본 문항 오답 기준, 변형 문항 혼용 금지)

## 입력 데이터
지문 ID: ${input.slug} | 레벨: ${input.level} | 학년: ${input.targetGrade}

## 규칙
1. ~한다체 사용
2. 이탤릭(*text*, _text_) 금지. 굵게(**text**)만
3. 모든 섹션·모든 행 빠짐없이 렌더링 (누락 = 오류)
4. 변형 문항은 원본 유형과 반드시 다른 유형으로 설계
5. cohesion_bridges 최소 3행, paraphrase_layers 최소 2행 — 미달 시 임의 행 보완 후 출력
6. 문장삽입 변형 문항: ①~⑤ 위치 선지 5개 필수 (누락 = 오류)
7. 변형 문항마다 🔑 정답: N + 해설 1문장 필수 (누락 = 오류)

반드시 위 JSON만 반환하라.`;
}
