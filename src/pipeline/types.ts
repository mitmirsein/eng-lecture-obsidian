export type ProblemType = "어법_선택형" | "어법_서술형" | "빈칸추론" | "내용일치" | "순서삽입" | "주제_제목_요지" | "기타";
export type TargetGrade = "중등" | "고등" | "Ambiguous";
export type InstructorName = "Insight" | "Ella" | "Miranda" | "Luna" | "Sunny" | "Lex" | "Villanelle" | "Quill";

export interface TriageResult {
  problem_type: ProblemType;
  target_grade: TargetGrade;
  trap_frame: string;
  persona_priority: {
    lead: InstructorName[];
    reduce: InstructorName[];
  };
  anomalies: Array<{
    type: "출제_의도" | "원문_결함";
    expression: string;
    note: string;
  }>;
  confidence: number;
  /** LLM이 문제 난이도·어휘·구문 복잡도를 기반으로 추론한 레벨 */
  inferred_level?: string;
  /** LLM이 문제 특성을 기반으로 추론한 대상 학년 */
  inferred_target_grade?: TargetGrade;
  /** 레벨/학년 추론의 근거 요약 (1~2문장) */
  level_rationale?: string;
}

export interface MosaicSettings {
  provider: string;
  endpoint: string;
  apiKey: string;
  model: string;
  outputRoot: string;
  defaultLevel: string;
  defaultTargetGrade: string;
  /** 무거운 LLM 호출(Dense·K-Master·fallback)의 출력 토큰 상한. Triage는 별도 고정. */
  maxTokens: number;
  generatePdf: boolean;
  pandocPath: string;
  xelatexPath: string;
  pdfMainFont: string;
}

export interface GenerationInput {
  slug: string;
  sourcePath: string;
  sourceText: string;
  level: string;
  targetGrade: string;
}

export interface DenseBundle {
  passage_id: string;
  block_a: {
    clean_passage: string;
    questions: string[];
    choices?: string[];
    insertion_sentence?: string;
  };
  instructors: {
    insight: {
      key_points: string[];
      traps_summary: string;
      distractor_intelligence: Array<{ distractor_no: number; trap_type: string; cognitive_reason: string }>;
    };
    ella: {
      theme_ko: string;
      theme_en: string;
      main_idea_ko: string;
      coaching_tip: string;
    };
    luna: {
      chunks: Array<{ sentence_idx: number; chunk_text: string; literal_translation: string }>;
      /** 끊어읽기 기호 없이 통독 가능한 자연스러운 한국어 전체 해석 (초보 자습용) */
      full_translation: string;
      topic_sentence: { sentence_idx: number; text: string };
      summary: string;
      block_a_masked?: string;
    };
    sunny: {
      grammar_points: Array<{
        concept: string;
        definition: string;
        why_here: string;
        examples: Array<{ en: string; ko: string }>;
      }>;
      visual_cue?: string;
    };
    miranda: {
      labeled_sentences: Array<{ sentence_idx: number; logic_label: string; connector: string }>;
      logic_route: string;
      cohesion_bridges: Array<{ sentence_pair: string; bridge_type: string; bridge_word: string; explanation: string }>;
    };
    lex: {
      vocabulary_entries: Array<{ word: string; pos?: string; definition: string; korean: string }>;
      paraphrase_layers: Array<{ keyword: string; synonyms: string[]; contextual_equivalents: string[]; antonym_negation: string }>;
      /** 초보 자습용 간단 단어 테스트 (빈칸 문장 또는 영영 정의 → 정답 단어) */
      vocab_quiz: Array<{ question: string; answer: string }>;
    };
    villanelle: {
      topic_master: { title_ko: string; core_message: string };
    };
    quill: {
      writing_tasks: Array<{ q: string; a: string; a_ko: string }>;
    };
  };
}

export interface KMasterMeta {
  design_strategy: string;
  coaching_tip: string;
  answer_recheck: {
    kmaster_verdict: "정합" | "불일치";
    discrepancy_note?: string;
  };
  variant_question_type: string;
}

export interface AuditItem {
  item: string;
  code: string;
  score: number;
  status: string;
}

export interface AuditResult {
  pass: boolean;
  score: number;
  items: AuditItem[];
}

export interface GenerationOutput {
  masterMarkdown: string;
  metadata?: {
    passage_id?: string;
    level?: string;
    problem_type?: string;
    topic?: string;
    correct_answer?: string;
  };
  triage?: TriageResult;
  bundle?: DenseBundle;
  kmaster_meta?: KMasterMeta;
  auditResult?: AuditResult;
  raw: unknown;
}
