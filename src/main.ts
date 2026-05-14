import { Notice, Plugin, TFile, MarkdownView, FileSystemAdapter } from "obsidian";
import { execFileSync } from "child_process";
import { dirname } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { API_KEY_SECRET_ID, DEFAULT_SETTINGS, MosaicSettingTab } from "./settings";
import { generateLectureAssets } from "./pipeline/openaiCompatible";
import type { GenerationInput, MosaicSettings } from "./pipeline/types";
import pretendardRegularDataUrl from "../assets/fonts/pretendard/Pretendard-Regular.otf";
import pretendardBoldDataUrl from "../assets/fonts/pretendard/Pretendard-Bold.otf";

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

function commandWorks(command: string, args: string[] = ["--version"]): boolean {
  try {
    execFileSync(command, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function findExecutable(configuredPath: string, candidates: string[]): string | undefined {
  const configured = configuredPath.trim();
  return [configured, ...candidates].filter(Boolean).find((candidate) => {
    if (candidate.includes("/")) {
      return existsSync(candidate) && commandWorks(candidate);
    }
    return commandWorks(candidate);
  });
}

function dataUrlToBytes(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",", 2)[1];
  if (!base64) {
    throw new Error("Bundled font data is invalid.");
  }
  return Buffer.from(base64, "base64");
}

function texEscapePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/([#$%&_{}])/g, "\\$1");
}

function stripSingleMarkerEmphasis(text: string, marker: "*" | "_"): string {
  let output = "";
  let index = 0;

  while (index < text.length) {
    const current = text[index];
    const previous = index > 0 ? text[index - 1] : "";
    const next = index + 1 < text.length ? text[index + 1] : "";
    const isSingleMarker = current === marker && previous !== marker && next !== marker && next !== " ";

    if (!isSingleMarker) {
      output += current;
      index += 1;
      continue;
    }

    let closing = index + 1;
    while (closing < text.length) {
      const closeCurrent = text[closing];
      const closePrevious = closing > 0 ? text[closing - 1] : "";
      const closeNext = closing + 1 < text.length ? text[closing + 1] : "";
      if (closeCurrent === "\n") break;
      if (closeCurrent === marker && closePrevious !== marker && closeNext !== marker) break;
      closing += 1;
    }

    if (closing >= text.length || text[closing] !== marker) {
      output += current;
      index += 1;
      continue;
    }

    output += text.slice(index + 1, closing);
    index = closing + 1;
  }

  return output;
}

function normalizeGeneratedMarkdown(markdown: string): string {
  return stripSingleMarkerEmphasis(stripSingleMarkerEmphasis(markdown, "*"), "_");
}

export default class MosaicLecturePlugin extends Plugin {
  settings: MosaicSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();
    
    let changed = false;
    // 이전 설정 마이그레이션 (Mosaic 관련 모든 경로를 Mosaic_Eng/Outputs로 통합)
    if (this.settings.outputRoot.includes("Mosaic/") && !this.settings.outputRoot.includes("Mosaic_Eng")) {
      this.settings.outputRoot = "Mosaic_Eng/Outputs";
      changed = true;
    }
    // 예외적인 이전 표준명들 처리
    if (this.settings.outputRoot === "Mosaic" || this.settings.outputRoot === "Mosaic_Eng") {
      this.settings.outputRoot = "Mosaic_Eng/Outputs";
      changed = true;
    }

    // Gemini 엔드포인트 마이그레이션 (v1beta/openai 표준으로 일원화)
    if (this.settings.provider === "gemini" && (!this.settings.endpoint.includes("v1beta") || !this.settings.endpoint.includes("openai"))) {
      this.settings.endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      this.settings.model = "gemini-3.1-flash-lite"; // 2026 GA 모델 권장
      changed = true;
    }

    if (changed) {
      await this.saveSettings();
      console.log("Mosaic: Settings migrated and saved.");
    }

    console.log("Mosaic Plugin Loaded", {
      provider: this.settings.provider,
      endpoint: this.settings.endpoint,
      model: this.settings.model,
      outputRoot: this.settings.outputRoot
    });

    await this.ensureFolder(this.settings.outputRoot);
    await this.ensureFolder("Mosaic_Eng/Inbox");
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

    this.addCommand({
      id: "create-new-draft",
      name: "Mosaic: Create New Draft",
      callback: async () => {
        const inboxPath = "Mosaic_Eng/Inbox";
        await this.ensureFolder(inboxPath);
        const fileName = `draft_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.md`;
        const filePath = `${inboxPath}/${fileName}`;
        const template = "---\nlevel: H1\ntarget_grade: 고등\npassage_id: \n---\n\n 여기에 지문을 입력하세요.";
        await this.upsertText(filePath, template);
        const newFile = this.app.vault.getAbstractFileByPath(filePath);
        if (newFile instanceof TFile) {
          const leaf = this.app.workspace.getLeaf(true);
          await leaf.openFile(newFile);
        }
      },
    });

    this.addCommand({
      id: "export-to-pdf",
      name: "Mosaic: Export Current File to PDF",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.file) {
          if (!checking) {
            this.exportToPdf(view.file);
          }
          return true;
        }
        return false;
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

  getPluginFullPath(relativePath: string): string | undefined {
    if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
      return undefined;
    }

    const pluginDir = this.manifest.dir || `${this.app.vault.configDir}/plugins/${this.manifest.id}`;
    return this.app.vault.adapter.getFullPath(`${pluginDir}/${relativePath}`);
  }

  ensureBundledPretendardFonts(): { regular: string; bold: string } | undefined {
    const regular = this.getPluginFullPath("assets/fonts/pretendard/Pretendard-Regular.otf");
    const bold = this.getPluginFullPath("assets/fonts/pretendard/Pretendard-Bold.otf");
    if (!regular || !bold) {
      return undefined;
    }

    const fonts = [
      { path: regular, dataUrl: pretendardRegularDataUrl },
      { path: bold, dataUrl: pretendardBoldDataUrl },
    ];

    for (const font of fonts) {
      if (!existsSync(font.path)) {
        mkdirSync(dirname(font.path), { recursive: true });
        writeFileSync(font.path, dataUrlToBytes(font.dataUrl));
      }
    }

    return { regular, bold };
  }

  ensureBundledPretendardHeader(fonts: { regular: string; bold: string }): string | undefined {
    const header = this.getPluginFullPath("assets/fonts/pretendard/pretendard-fontspec.tex");
    if (!header) {
      return undefined;
    }

    const fontDir = `${dirname(fonts.regular).replace(/\\/g, "/")}/`;
    const content = [
      "\\setmainfont{Pretendard-Regular.otf}[",
      `  Path={${texEscapePath(fontDir)}},`,
      "  BoldFont={Pretendard-Bold.otf},",
      "  ItalicFont={Pretendard-Regular.otf},",
      "  BoldItalicFont={Pretendard-Bold.otf}",
      "]",
      "",
    ].join("\n");

    mkdirSync(dirname(header), { recursive: true });
    writeFileSync(header, content, "utf8");
    return header;
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

      const masterMarkdown = normalizeGeneratedMarkdown(result.masterMarkdown.trim());
      await this.upsertText(`${folder}/[MOSAIC]_${slug}.md`, masterMarkdown + "\n");
      
      if (this.settings.generatePdf) {
        // 방금 생성한 파일을 가져오자.
        const pdfSource = this.app.vault.getAbstractFileByPath(`${folder}/[MOSAIC]_${slug}.md`);
        if (pdfSource instanceof TFile) {
          await this.exportToPdf(pdfSource);
        }
      }

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
  async exportToPdf(file: TFile) {
    if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
      new Notice("Mosaic: FileSystemAdapter가 필요합니다.");
      return;
    }

    const adapter = this.app.vault.adapter as FileSystemAdapter;
    const mdPath = adapter.getFullPath(file.path);
    const pdfPath = mdPath.replace(/\.md$/, ".pdf");
    const pandoc = findExecutable(this.settings.pandocPath, [
      "pandoc",
      "/opt/homebrew/bin/pandoc",
      "/usr/local/bin/pandoc",
      "/usr/bin/pandoc",
    ]);

    if (!pandoc) {
      const configuredPandoc = this.settings.pandocPath.trim();
      const hint = configuredPandoc
        ? `설정된 Pandoc 경로를 확인하세요: ${configuredPandoc}`
        : "Pandoc을 설치하거나 Settings > Mosaic Eng Lecture > Pandoc path에 절대경로를 입력하세요.";
      console.warn("Mosaic PDF skipped: pandoc executable not found.", { configuredPandoc });
      new Notice(`Mosaic: PDF 생성 건너뜀 - ${hint}`);
      return;
    }

    const xelatex = findExecutable(this.settings.xelatexPath, [
      "xelatex",
      "/Library/TeX/texbin/xelatex",
      "/opt/homebrew/bin/xelatex",
      "/usr/local/bin/xelatex",
    ]);

    if (!xelatex) {
      const configuredXelatex = this.settings.xelatexPath.trim();
      const hint = configuredXelatex
        ? `설정된 XeLaTeX 경로를 확인하세요: ${configuredXelatex}`
        : "MacTeX 또는 BasicTeX를 설치하거나 Settings > Mosaic Eng Lecture > XeLaTeX path에 절대경로를 입력하세요.";
      console.warn("Mosaic PDF skipped: xelatex executable not found.", { configuredXelatex });
      new Notice(`Mosaic: PDF 생성 건너뜀 - ${hint}`);
      return;
    }

    new Notice(`Mosaic: PDF 변환 중... (${file.basename})`);

    try {
      const args = [
        mdPath,
        `--pdf-engine=${xelatex}`,
        "-V",
        "geometry:a4paper,margin=3cm",
        "-V",
        "linestretch=1.5",
      ];
      const pdfFont = this.settings.pdfMainFont.trim() || DEFAULT_SETTINGS.pdfMainFont;
      const useBundledPretendard = pdfFont === DEFAULT_SETTINGS.pdfMainFont;
      const bundledFonts = useBundledPretendard ? this.ensureBundledPretendardFonts() : undefined;

      if (bundledFonts) {
        const header = this.ensureBundledPretendardHeader(bundledFonts);
        if (header) {
          args.push("--include-in-header", header);
        } else {
          args.push("-V", "mainfont=Apple SD Gothic Neo");
        }
      } else {
        args.push("-V", `mainfont=${pdfFont}`);
      }

      args.push("-o", pdfPath);

      execFileSync(pandoc, [
        ...args,
      ]);
      new Notice(`Mosaic: PDF 생성 완료: ${file.basename}.pdf`);
    } catch (error) {
      console.warn("Mosaic PDF failed:", errorMessage(error));
      new Notice(`Mosaic: PDF 변환 실패 - ${errorMessage(error)}`);
    }
  }
}
