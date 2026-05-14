import type { GenerationInput, TriageResult } from "./types";

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
| 기타 | 유형 미확정 — 전체 페르소나 균등 적용 | ["Insight"] | [] |

## confidence 계산
- 판정 신호 ≥ 2개 → 0.8 | 신호 1개 → 0.6 | 신호 0개 → 0.4 + target_grade 강제 "Ambiguous"

## anomaly detection
- 어법 문항 밑줄 영역 내 비문 → type: "출제_의도"
- 그 외 비표준 용법 → type: "원문_결함", note를 ⚠️로 시작

## 반환 JSON (additionalProperties 금지)
{
  "problem_type": "어법_선택형" | "어법_서술형" | "빈칸추론" | "내용일치" | "순서삽입" | "기타",
  "target_grade": "중등" | "고등" | "Ambiguous",
  "trap_frame": "(위 표 해당 행 값 그대로)",
  "persona_priority": { "lead": ["..."], "reduce": ["..."] },
  "anomalies": [],
  "confidence": 0.0
}

레벨 힌트: ${input.level} | 학년 힌트: ${input.targetGrade}

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
> **Mosaic Academy** 영어과 | **레벨:** Level | **대상:** Grade

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
