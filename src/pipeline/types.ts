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
  raw: unknown;
}
