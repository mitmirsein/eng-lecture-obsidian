import { Notice, Plugin, TFile, MarkdownView, FileSystemAdapter } from "obsidian";
import { execFileSync } from "child_process";
import { homedir } from "os";
import { basename, dirname } from "path";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { API_KEY_SECRET_ID, DEFAULT_SETTINGS, MosaicSettingTab } from "./settings";
import { generateLectureAssets } from "./pipeline/openaiCompatible";
import type { GenerationInput, MosaicSettings } from "./pipeline/types";
import { ProgressModal } from "./ui/ProgressModal";
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

const FONT_CACHE_DIR = "/private/tmp/mosaic-pretendard";

const EMOJI_FONT_CANDIDATES = [
  `${homedir()}/Library/Fonts/NotoColorEmoji-Regular.ttf`,
  "/Library/Fonts/NotoColorEmoji-Regular.ttf",
  `${homedir()}/Library/Fonts/NotoEmoji-Regular.ttf`,
  "/Library/Fonts/NotoEmoji-Regular.ttf",
];

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
        try {
          await this.app.vault.createFolder(current);
        } catch {
          // 이미 존재하면 무시
        }
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

  ensureBundledPretendardFonts(): { regular: string; bold: string; emoji?: string } | undefined {
    const regular = `${FONT_CACHE_DIR}/Pretendard-Regular.otf`;
    const bold = `${FONT_CACHE_DIR}/Pretendard-Bold.otf`;

    try {
      mkdirSync(FONT_CACHE_DIR, { recursive: true });
      if (!existsSync(regular)) {
        writeFileSync(regular, dataUrlToBytes(pretendardRegularDataUrl));
      }
      if (!existsSync(bold)) {
        writeFileSync(bold, dataUrlToBytes(pretendardBoldDataUrl));
      }
    } catch {
      return undefined;
    }

    let emoji: string | undefined;
    for (const candidate of EMOJI_FONT_CANDIDATES) {
      if (existsSync(candidate)) {
        const dest = `${FONT_CACHE_DIR}/${basename(candidate)}`;
        try {
          if (!existsSync(dest)) copyFileSync(candidate, dest);
          emoji = dest;
        } catch { /* ignore */ }
        break;
      }
    }

    return { regular, bold, emoji };
  }

  ensureBundledPretendardHeader(fonts: { regular: string; bold: string; emoji?: string }): string | undefined {
    const header = this.getPluginFullPath("assets/fonts/pretendard/pretendard-fontspec.tex");
    if (!header) {
      return undefined;
    }

    const fontDir = `${dirname(fonts.regular).replace(/\\/g, "/")}/`;
    const lines = [
      "\\usepackage{fontspec}",
      "\\setmainfont[",
      `  Path={${texEscapePath(fontDir)}},`,
      "  UprightFont={Pretendard-Regular.otf},",
      "  BoldFont={Pretendard-Bold.otf},",
      "  ItalicFont={Pretendard-Regular.otf},",
      "  BoldItalicFont={Pretendard-Bold.otf}",
      "]{Pretendard}",
    ];

    if (fonts.emoji) {
      lines.push(
        "\\usepackage{ucharclasses}",
        "\\newfontfamily\\EmojiFont[",
        `  Path={${texEscapePath(fontDir)}},`,
        `  UprightFont={${basename(fonts.emoji)}}`,
        "]{EmojiFont}",
        "\\setTransitionsFor{Emoticons}{\\EmojiFont}{\\normalfont}",
        "\\setTransitionsFor{MiscellaneousSymbolsAndPictographs}{\\EmojiFont}{\\normalfont}",
        "\\setTransitionsFor{TransportAndMapSymbols}{\\EmojiFont}{\\normalfont}",
        "\\setTransitionsFor{SupplementalSymbolsAndPictographs}{\\EmojiFont}{\\normalfont}",
      );
    }

    lines.push("");
    mkdirSync(dirname(header), { recursive: true });
    writeFileSync(header, lines.join("\n"), "utf8");
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

    await this.ensureFolder(folder);
    await this.upsertText(`${folder}/source.md`, sourceText.endsWith("\n") ? sourceText : `${sourceText}\n`);

    const modal = new ProgressModal(this.app, slug, this.settings.model);
    modal.open();

    try {
      const result = await generateLectureAssets(this.settings, input, () => modal.advance());

      // triage 결과를 파일로 저장
      if (result.triage) {
        await this.upsertText(
          `${folder}/02t.triage.json`,
          JSON.stringify(result.triage, null, 2) + "\n",
        );
      }

      // dense analysis 번들 저장
      if (result.bundle) {
        await this.upsertText(
          `${folder}/03.analysis-bundle.json`,
          JSON.stringify(result.bundle, null, 2) + "\n",
        );
      }

      // 메타데이터가 있으면 원본 노트의 YAML 업데이트 (triage 우선, 메타데이터 보완)
      if (result.metadata || result.triage) {
        await this.app.fileManager.processFrontMatter(file, (fm) => {
          // triage가 있으면 problem_type은 triage 값 우선
          const problemType = result.triage?.problem_type || result.metadata?.problem_type;
          if (problemType) fm["problem_type"] = problemType;
          if (result.metadata?.passage_id && !fm["passage_id"]) fm["passage_id"] = result.metadata.passage_id;
          if (result.metadata?.level && (!fm["level"] || fm["level"] === "H1")) fm["level"] = result.metadata.level;
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

      const pipelineMode = result.bundle ? "3-Call (Triage → Dense → K-Master)" : result.triage ? "2-Call (Triage → Generation)" : "1-Call (Fallback)";

      modal.complete(result.auditResult?.score);

      // Audit 점수 < 80이면 경고 Notice
      if (result.auditResult && !result.auditResult.pass) {
        new Notice(`Mosaic: ⚠️ Audit ${result.auditResult.score}/100 — 품질 기준 미달 (80점 미만). run-report.md 확인.`);
      }

      const auditSection = result.auditResult
        ? `\n## Audit (${result.auditResult.score}/100 — ${result.auditResult.pass ? "✅ PASS" : "❌ FAIL"})\n` +
          result.auditResult.items.map(i => `- **${i.item}** (${i.score}점): ${i.status}`).join("\n")
        : "";

      const triageSection = result.triage
        ? `\n## Pipeline\n- **모드**: ${pipelineMode}\n\n## Triage\n- **유형**: ${result.triage.problem_type}\n- **함정 프레임**: ${result.triage.trap_frame}\n- **리드 페르소나**: ${result.triage.persona_priority.lead.join(", ")}\n- **신뢰도**: ${result.triage.confidence}${auditSection}`
        : `\n## Pipeline\n- **모드**: ${pipelineMode}${auditSection}`;

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
${triageSection}

> [!INFO]
> - **[MOSAIC]**: 학생 및 강사용 통합 강의 자산이 [[${folder}/[MOSAIC]_${slug}.md|이곳]]에 생성되었습니다.
`;
      await this.upsertText(`${folder}/run-report.md`, reportMd);
    } catch (error) {
      modal.close();
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
