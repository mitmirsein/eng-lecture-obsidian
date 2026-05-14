import { Notice, Plugin, TFile, MarkdownView } from "obsidian";
import { API_KEY_SECRET_ID, DEFAULT_SETTINGS, MosaicSettingTab } from "./settings";
import { generateLectureAssets } from "./pipeline/openaiCompatible";
import type { GenerationInput, MosaicSettings } from "./pipeline/types";

function slugify(value: string): string {
  return value
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/[^\w가-힣.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "passage";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default class MosaicLecturePlugin extends Plugin {
  settings: MosaicSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MosaicSettingTab(this.app, this));

    // 사이드바 리본 아이콘 추가
    this.addRibbonIcon("book-open-check", "Mosaic: Generate Lecture Asset", async () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view || !view.file) {
        new Notice("Mosaic: 활성화된 노트가 없습니다.");
        return;
      }
      const editor = view.editor;
      const sourceText = editor.getValue().trim();
      if (!sourceText) {
        new Notice("Mosaic: 분석할 내용이 없습니다.");
        return;
      }
      try {
        await this.generateForSource(view.file, sourceText);
      } catch (error) {
        new Notice(`Mosaic: 생성 실패 - ${errorMessage(error)}`);
      }
    });

    // 마우스 우클릭 메뉴 추가
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        menu.addItem((item) => {
          item
            .setTitle("Generate Mosaic Lecture Asset")
            .setIcon("book-open-check")
            .onClick(async () => {
              const file = view.file;
              const sourceText = editor.getSelection().trim() || editor.getValue().trim();
              if (!file || !sourceText) {
                new Notice("Mosaic: 분석할 내용이 없습니다.");
                return;
              }
              try {
                await this.generateForSource(file, sourceText);
              } catch (error) {
                new Notice(`Mosaic: 생성 실패 - ${errorMessage(error)}`);
              }
            });
        });
      })
    );

    this.addCommand({
      id: "generate-lecture-asset",
      name: "Generate Lecture Asset",
      editorCallback: async (editor, view) => {
        const selected = editor.getSelection();
        const file = view.file;
        const sourceText = selected.trim() || editor.getValue().trim();
        if (!file || !sourceText) {
          new Notice("Mosaic: 분석할 노트 또는 선택 영역이 없습니다.");
          return;
        }
        try {
          await this.generateForSource(file, sourceText);
        } catch (error) {
          new Notice(`Mosaic: 생성 실패 - ${errorMessage(error)}`);
        }
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.apiKey = this.app.secretStorage.getSecret(API_KEY_SECRET_ID) || "";
  }

  async saveSettings() {
    const { apiKey: _apiKey, ...persisted } = this.settings;
    await this.saveData(persisted);
  }

  async saveApiKey(apiKey: string) {
    this.app.secretStorage.setSecret(API_KEY_SECRET_ID, apiKey);
    this.settings.apiKey = apiKey;
    await this.saveSettings();
    new Notice("Mosaic: API key 저장 완료");
  }

  async clearApiKey() {
    this.app.secretStorage.setSecret(API_KEY_SECRET_ID, "");
    this.settings.apiKey = "";
    await this.saveSettings();
    new Notice("Mosaic: API key 삭제 완료");
  }

  async ensureFolder(path: string) {
    const parts = path.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  async upsertText(path: string, content: string) {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(path, content);
    }
  }

  async generateForSource(file: TFile, sourceText: string) {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter || {};
    
    // YAML 설정이 있으면 우선, 없으면 전역 설정 사용
    const level = frontmatter.level || frontmatter.Level || this.settings.defaultLevel;
    const targetGrade = frontmatter.target_grade || frontmatter.Target_Grade || this.settings.defaultTargetGrade;
    const passageId = frontmatter.passage_id || slugify(file.basename);
    
    const slug = passageId;
    const folder = `${this.settings.outputRoot}/${slug}`;
    const input: GenerationInput = {
      slug,
      sourcePath: file.path,
      sourceText,
      level,
      targetGrade,
    };

    new Notice(`Mosaic: ${slug} 생성 시작 (Level: ${level}, Grade: ${targetGrade})`);
    await this.ensureFolder(folder);
    await this.upsertText(`${folder}/source.md`, sourceText.endsWith("\n") ? sourceText : `${sourceText}\n`);

    try {
      const result = await generateLectureAssets(this.settings, input);

      // 메타데이터가 있으면 원본 노트의 YAML 업데이트 (자동 분류 및 파싱)
      if (result.metadata) {
        await this.app.fileManager.processFrontMatter(file, (fm) => {
          if (result.metadata?.passage_id && !fm["passage_id"]) fm["passage_id"] = result.metadata.passage_id;
          if (result.metadata?.level && (!fm["level"] || fm["level"] === "H1")) fm["level"] = result.metadata.level;
          if (result.metadata?.problem_type) fm["problem_type"] = result.metadata.problem_type;
          if (result.metadata?.topic) fm["topic"] = result.metadata.topic;
          if (result.metadata?.correct_answer) fm["correct_answer"] = result.metadata.correct_answer;
        });
      }

      await this.upsertText(`${folder}/[MOSAIC]_${slug}.md`, result.masterMarkdown.trim() + "\n");
      
      const reportMd = `---
type: mosaic-report
status: success
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${slug}

- **Status**: ✅ Success
- **Source**: [[${file.name}]]
- **Model**: \`${this.settings.model}\`
- **Generated At**: ${new Date().toLocaleString()}

> [!INFO]
> - **[MOSAIC]**: 학생 및 강사용 통합 강의 자산이 [[${folder}/[MOSAIC]_${slug}.md|이곳]]에 생성되었습니다.
`;
      await this.upsertText(`${folder}/run-report.md`, reportMd);

      new Notice(`Mosaic: ${slug} 생성 완료`);
    } catch (error) {
      const errorMd = `---
type: mosaic-report
status: failed
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${slug}

- **Status**: ❌ Failed
- **Source**: [[${file.name}]]
- **Model**: \`${this.settings.model}\`
- **Failed At**: ${new Date().toLocaleString()}

## Error Message
\`\`\`
${errorMessage(error)}
\`\`\`
`;
      await this.upsertText(`${folder}/run-report.md`, errorMd);
      throw error;
    }
  }
}
