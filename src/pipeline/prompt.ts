import type { GenerationInput } from "./types";

export function buildGenerationPrompt(input: GenerationInput): string {
  return `너는 Mosaic Curriculum Pipeline의 Obsidian 플러그인 실행기다.

모든 교수학습 해설은 한국어 평서문(~한다)으로 작성한다.
존댓말을 쓰지 않는다.
단순한 문제 풀이가 아니라 지문의 논리 구조, 응집성, 오답 설계, 교수 전략을 포렌식으로 조립한다.

대상 파일: ${input.sourcePath}
지문 ID: ${input.slug}
레벨: ${input.level}
대상 학년: ${input.targetGrade}

반드시 다음 JSON 형식만 반환한다.

{
  "masterMarkdown": "학생용 마크다운 전문",
  "teacherMarkdown": "강사용 마크다운 전문"
}

[MASTER]에는 학생에게 제공할 개념, 논리 구조, 핵심 구문, 어휘, 문제 접근 전략을 담는다.
[TEACHER]에는 강사용 판서 구조, 오답 유도 방식, 문장 간 응집성, 수업 질문, 확장 활동을 담는다.

원문:

${input.sourceText}
`;
}

