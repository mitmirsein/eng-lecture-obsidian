import type { DenseBundle } from "./types";

export interface SchemaViolation {
  path: string;
  expected: string;
  actual: string;
}

type CheckType = "non-empty string" | "non-empty array" | "array";

export function runSchemaGate(bundle: DenseBundle): SchemaViolation[] {
  const violations: SchemaViolation[] = [];
  const inst = bundle.instructors;

  function check(path: string, val: unknown, type: CheckType) {
    if (val === undefined || val === null) {
      violations.push({ path, expected: type, actual: "missing" });
      return;
    }
    if (type === "non-empty string") {
      if (typeof val !== "string" || val.trim() === "") {
        violations.push({ path, expected: type, actual: JSON.stringify(val).slice(0, 40) });
      }
    } else if (type === "non-empty array") {
      if (!Array.isArray(val) || val.length === 0) {
        violations.push({ path, expected: type, actual: Array.isArray(val) ? "[]" : typeof val });
      }
    } else if (type === "array") {
      if (!Array.isArray(val)) {
        violations.push({ path, expected: type, actual: typeof val });
      }
    }
  }

  check("insight.distractor_intelligence", inst.insight?.distractor_intelligence, "non-empty array");
  check("miranda.cohesion_bridges",        inst.miranda?.cohesion_bridges,        "array");
  check("lex.vocabulary_entries",          inst.lex?.vocabulary_entries,          "non-empty array");
  check("lex.paraphrase_layers",           inst.lex?.paraphrase_layers,           "array");
  check("luna.chunks",                     inst.luna?.chunks,                     "non-empty array");
  check("luna.full_translation",           inst.luna?.full_translation,           "non-empty string");
  check("sunny.grammar_points",            inst.sunny?.grammar_points,            "non-empty array");
  check("ella.theme_ko",                   inst.ella?.theme_ko,                   "non-empty string");
  check("ella.main_idea_ko",               inst.ella?.main_idea_ko,               "non-empty string");

  return violations;
}
