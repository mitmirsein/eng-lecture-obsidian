/**
 * Pre-flight Ambiguity Gate — v0.5
 *
 * LLM 호출 전에 정적으로(코드 수준) 판단 가능한 입력 품질 체크를 수행한다.
 * 토큰 낭비를 사전 차단하는 것이 목적이므로, LLM 호출 비용은 0이다.
 *
 * 설계 원천: Ouroboros Ambiguity Score (≤ 0.2) 패턴을
 * LLM 불필요 정적 검사로 재설계한 것.
 */

export interface PreflightResult {
  pass: boolean;
  warnings: string[];
  errors: string[];
}

const MIN_TEXT_LENGTH = 100;
const MIN_ENGLISH_RATIO = 0.3;

/**
 * 영문 문자(a-z, A-Z) 비율을 계산한다.
 * 공백·숫자·특수문자를 제외한 알파벳 문자 기준.
 */
function englishRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z가-힣]/g, "");
  if (letters.length === 0) return 0;
  const english = text.replace(/[^a-zA-Z]/g, "").length;
  return english / letters.length;
}

/**
 * 선지 패턴(①②③④⑤ 또는 (1)(2)(3) 또는 1. 2. 3.)이 존재하는지 탐지한다.
 */
function hasChoicePattern(text: string): boolean {
  return /[①②③④⑤]/.test(text)
    || /\(\d\)/.test(text)
    || /^\d\.\s/m.test(text);
}

/**
 * Pre-flight Gate를 실행한다.
 * errors가 1건 이상이면 pass=false.
 * warnings는 경고만 표시하고 파이프라인은 계속 진행한다.
 */
export function runPreflight(
  sourceText: string,
  level?: string,
  targetGrade?: string,
): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 텍스트 길이 체크
  const trimmed = sourceText.trim();
  if (trimmed.length < MIN_TEXT_LENGTH) {
    errors.push(
      `지문이 너무 짧습니다 (${trimmed.length}자). 최소 ${MIN_TEXT_LENGTH}자 이상의 영어 지문을 입력해 주세요.`,
    );
  }

  // 2. 영어 비율 체크
  const ratio = englishRatio(trimmed);
  if (ratio < MIN_ENGLISH_RATIO) {
    errors.push(
      `영어 비율이 ${(ratio * 100).toFixed(0)}%로 너무 낮습니다 (최소 ${MIN_ENGLISH_RATIO * 100}%). 영어 기출 지문이 맞는지 확인해 주세요.`,
    );
  }

  // 3. 선지 패턴 탐지 (경고만)
  if (!hasChoicePattern(trimmed)) {
    warnings.push(
      "선지 패턴(①~⑤)이 감지되지 않았습니다. 서술형 문항이 아니라면 선지를 포함해 주세요.",
    );
  }

  // 4. Level 설정 체크 (경고만)
  if (!level || level === "H1") {
    warnings.push(
      `레벨이 기본값(${level || "미설정"})입니다. 정확한 분석을 위해 frontmatter에 level을 설정하는 것을 권장합니다.`,
    );
  }
  if (!targetGrade) {
    warnings.push(
      "대상 학년(target_grade)이 설정되지 않았습니다. 기본값으로 진행합니다.",
    );
  }

  return {
    pass: errors.length === 0,
    warnings,
    errors,
  };
}
