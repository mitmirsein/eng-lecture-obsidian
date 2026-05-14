import { Notice, Plugin, TFile } from "obsidian";
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

    this.addCommand({
      id: "generate-master-teacher",
      name: "Generate MASTER/TEACHER",
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
    const slug = slugify(file.basename);
    const folder = `${this.settings.outputRoot}/${slug}`;
    const input: GenerationInput = {
      slug,
      sourcePath: file.path,
      sourceText,
      level: this.settings.defaultLevel,
      targetGrade: this.settings.defaultTargetGrade,
    };

    new Notice(`Mosaic: ${slug} 생성 시작`);
    await this.ensureFolder(folder);
    await this.upsertText(`${folder}/source.md`, sourceText.endsWith("\n") ? sourceText : `${sourceText}\n`);

    try {
      const result = await generateLectureAssets(this.settings, input);

      await this.upsertText(`${folder}/[MASTER]_${slug}.md`, result.masterMarkdown.trim() + "\n");
      await this.upsertText(`${folder}/[TEACHER]_${slug}.md`, result.teacherMarkdown.trim() + "\n");
      
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

> [!TIP]
> - **[MASTER]**: 학생용 배포를 위한 핵심 강의 자산입니다.
> - **[TEACHER]**: 정답, 해설, 그리고 교수용 팁이 포함된 확장 버전입니다.
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
