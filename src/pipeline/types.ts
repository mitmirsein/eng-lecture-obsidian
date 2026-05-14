export interface MosaicSettings {
  provider: "openai-compatible";
  endpoint: string;
  apiKey: string;
  model: string;
  outputRoot: string;
  defaultLevel: string;
  defaultTargetGrade: string;
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
  teacherMarkdown: string;
  raw: unknown;
}

