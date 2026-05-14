export type ProblemType = "어법_선택형" | "어법_서술형" | "빈칸추론" | "내용일치" | "순서삽입" | "기타";
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
}

export interface MosaicSettings {
  provider: string;
  endpoint: string;
  apiKey: string;
  model: string;
  outputRoot: string;
  defaultLevel: string;
  defaultTargetGrade: string;
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
      topic_sentence: { sentence_idx: number; text: string };
      summary: string;
      block_a_masked?: string;
    };
    sunny: {
      grammar_deep_dive: string;
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
    };
    villanelle: {
      topic_master: { title_ko: string; core_message: string };
    };
    quill: {
      writing_tasks: Array<{ q: string; a: string; a_ko: string }>;
    };
  };
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
  raw: unknown;
}
