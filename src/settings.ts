import { App, PluginSettingTab, Setting } from "obsidian";
import type MosaicLecturePlugin from "./main";
import type { MosaicSettings } from "./pipeline/types";

export const DEFAULT_SETTINGS: MosaicSettings = {
  provider: "openai-compatible",
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4.1",
  outputRoot: "Mosaic/outputs",
  defaultLevel: "H1",
  defaultTargetGrade: "고등",
};

export const API_KEY_SECRET_ID = "mosaic-lecture-api-key";

function section(containerEl: HTMLElement, title: string, desc: string): void {
  const el = containerEl.createDiv({ cls: "mosaic-settings-section" });
  el.createEl("h3", { text: title });
  el.createEl("p", { text: desc, cls: "mosaic-settings-description" });
}

export class MosaicSettingTab extends PluginSettingTab {
  plugin: MosaicLecturePlugin;

  constructor(app: App, plugin: MosaicLecturePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.addClass("mosaic-settings");

    const header = containerEl.createDiv({ cls: "mosaic-settings-header" });
    header.createEl("h2", { text: "Mosaic Lecture" });
    header.createEl("p", {
      text: "현재 노트나 선택 영역을 한국어 MASTER/TEACHER 강의 자산으로 생성한다.",
      cls: "mosaic-settings-description",
    });

    const status = this.plugin.settings.apiKey ? "API key configured" : "API key missing";
    const statusEl = header.createDiv({
      cls: this.plugin.settings.apiKey ? "mosaic-status mosaic-status-ok" : "mosaic-status mosaic-status-warn",
      text: status,
    });
    statusEl.setAttr("aria-label", status);

    section(
      containerEl,
      "Connection",
      "OpenAI-compatible chat completions endpoint를 사용한다. API key는 Obsidian SecretStorage에 저장되며 data.json에는 남기지 않는다.",
    );

    new Setting(containerEl)
      .setName("API endpoint")
      .setDesc("예: https://api.openai.com/v1/chat/completions")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.endpoint)
        .setValue(this.plugin.settings.endpoint)
        .onChange(async (value) => {
          this.plugin.settings.endpoint = value.trim() || DEFAULT_SETTINGS.endpoint;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("API key")
      .setDesc("값을 입력하면 즉시 SecretStorage에 저장된다. 보안상 저장된 값은 다시 표시하지 않는다.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder(this.plugin.settings.apiKey ? "API key configured" : "sk-...")
          .setValue("")
          .onChange(async (value) => {
            const apiKey = value.trim();
            if (!apiKey) return;
            await this.plugin.saveApiKey(apiKey);
          });
      })
      .addButton((button) => {
        button
          .setButtonText("Clear")
          .setTooltip("Stored API key 삭제")
          .onClick(async () => {
            await this.plugin.clearApiKey();
            this.display();
          });
      });

    new Setting(containerEl)
      .setName("Model")
      .setDesc("강의 자산 생성에 사용할 모델명. endpoint가 OpenAI-compatible이면 해당 provider의 모델명을 그대로 입력한다.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.model)
        .setValue(this.plugin.settings.model)
        .onChange(async (value) => {
          this.plugin.settings.model = value.trim() || DEFAULT_SETTINGS.model;
          await this.plugin.saveSettings();
        }));

    section(
      containerEl,
      "Output",
      "생성 결과는 Vault 내부에만 기록한다. 외부 파일 시스템이나 기존 eng-lecture output 폴더에는 쓰지 않는다.",
    );

    new Setting(containerEl)
      .setName("Output folder")
      .setDesc("Vault 기준 상대 경로. 각 지문은 이 폴더 아래 <slug> 하위 폴더로 저장된다.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.outputRoot)
        .setValue(this.plugin.settings.outputRoot)
        .onChange(async (value) => {
          this.plugin.settings.outputRoot = value.trim() || DEFAULT_SETTINGS.outputRoot;
          await this.plugin.saveSettings();
        }));

    section(
      containerEl,
      "Passage Defaults",
      "현재 MVP는 노트 본문을 우선 처리한다. 세부 기출 메타데이터 UI는 다음 단계에서 붙이고, 지금은 기본 학년값을 생성 프롬프트에 주입한다.",
    );

    new Setting(containerEl)
      .setName("Default level")
      .setDesc("예: M3, H1, H2. 선택 영역에 별도 메타데이터가 없을 때 사용한다.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.defaultLevel)
        .setValue(this.plugin.settings.defaultLevel)
        .onChange(async (value) => {
          this.plugin.settings.defaultLevel = value.trim() || DEFAULT_SETTINGS.defaultLevel;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default target grade")
      .setDesc("예: 중등, 고등. 해설의 난도와 어조를 결정하는 기본값이다.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.defaultTargetGrade)
        .setValue(this.plugin.settings.defaultTargetGrade)
        .onChange(async (value) => {
          this.plugin.settings.defaultTargetGrade = value.trim() || DEFAULT_SETTINGS.defaultTargetGrade;
          await this.plugin.saveSettings();
        }));

    section(
      containerEl,
      "Run Checklist",
      "노트에서 지문 전문 또는 필요한 선택 영역을 잡은 뒤 Command Palette에서 Mosaic: Generate MASTER/TEACHER를 실행한다.",
    );

    const checklist = containerEl.createEl("ul", { cls: "mosaic-checklist" });
    [
      "API key가 configured 상태인지 확인한다.",
      "지문, 발문, 선지, 정답이 가능한 한 한 노트에 함께 들어 있어야 한다.",
      "생성 결과는 Output folder 아래 source.md, [MASTER], [TEACHER], run-log.json으로 저장된다.",
      "실패 시 run-log.json에 실패 원인을 남긴다.",
    ].forEach((item) => checklist.createEl("li", { text: item }));
  }
}
