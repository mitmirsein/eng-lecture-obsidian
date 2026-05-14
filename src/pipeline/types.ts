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
  raw: unknown;
}
