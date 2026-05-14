import { App, PluginSettingTab, Setting } from "obsidian";
import type MosaicLecturePlugin from "./main";
import type { MosaicSettings } from "./pipeline/types";

export const DEFAULT_SETTINGS: MosaicSettings = {
  provider: "openai",
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4o",
  outputRoot: "Mosaic/outputs",
  defaultLevel: "H1",
  defaultTargetGrade: "고등",
};

export const API_KEY_SECRET_ID = "mosaic-eng-lecture-api-key";

const PROVIDER_CONFIGS: Record<string, { name: string; endpoint: string; models: string[] }> = {
  openai: {
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    models: ["gpt-5.4-pro", "gpt-5.5-instant", "gpt-5.4-thinking"],
  },
  claude: {
    name: "Claude (via OpenRouter)",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    models: ["anthropic/claude-4.7-opus", "anthropic/claude-4.6-sonnet", "anthropic/claude-4-haiku"],
  },
  gemini: {
    name: "Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-3.1-pro", "gemini-3.1-flash", "gemini-3-pro"],
  },
  grok: {
    name: "Grok (xAI)",
    endpoint: "https://api.x.ai/v1/chat/completions",
    models: ["grok-4.3", "grok-4", "grok-4-fast"],
  },
  openrouter: {
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    models: ["anthropic/claude-4.7-opus", "google/gemini-3.1-pro", "openai/gpt-5.4-pro"],
  },
  custom: {
    name: "Custom (OpenAI-compatible)",
    endpoint: "",
    models: [],
  },
};

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
    header.createEl("h2", { text: "Mosaic Eng Lecture" });
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
      "API 제공자를 선택하고 인증 정보를 입력한다. API key는 Obsidian SecretStorage에 안전하게 저장된다.",
    );

    new Setting(containerEl)
      .setName("API Provider")
      .setDesc("사용할 LLM 서비스 제공자를 선택한다.")
      .addDropdown((dropdown) => {
        Object.keys(PROVIDER_CONFIGS).forEach((id) => {
          dropdown.addOption(id, PROVIDER_CONFIGS[id].name);
        });
        dropdown
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value;
            const config = PROVIDER_CONFIGS[value];
            if (config.endpoint) {
              this.plugin.settings.endpoint = config.endpoint;
            }
            if (config.models.length > 0) {
              this.plugin.settings.model = config.models[0];
            }
            await this.plugin.saveSettings();
            this.display(); // UI 새로고침
          });
      });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("인증을 위한 API Key를 입력한다. (보안상 저장 후에는 표시되지 않음)")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder(this.plugin.settings.apiKey ? "API key configured" : "Enter your key...")
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

    const isCustom = this.plugin.settings.provider === "custom";
    
    if (isCustom) {
      new Setting(containerEl)
        .setName("API Endpoint")
        .setDesc("OpenAI 호환 API 엔드포인트를 직접 입력한다.")
        .addText((text) => {
          text
            .setPlaceholder("https://api.example.com/v1/chat/completions")
            .setValue(this.plugin.settings.endpoint)
            .onChange(async (value) => {
              this.plugin.settings.endpoint = value.trim();
              await this.plugin.saveSettings();
            });
        });
    }

    const currentModels = PROVIDER_CONFIGS[this.plugin.settings.provider]?.models || [];
    
    const modelSetting = new Setting(containerEl)
      .setName("Model Selection")
      .setDesc("사용할 LLM 모델을 선택하거나 직접 입력한다.");

    if (currentModels.length > 0) {
      modelSetting.addDropdown((dropdown) => {
        currentModels.forEach((m) => dropdown.addOption(m, m));
        dropdown
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          });
      });
    }

    modelSetting.addText((text) => {
      text
        .setPlaceholder("Directly enter model name...")
        .setValue(this.plugin.settings.model)
        .onChange(async (value) => {
          this.plugin.settings.model = value.trim();
          await this.plugin.saveSettings();
        });
    });

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
      "기본 학년과 레벨을 설정한다. 프롬프트 생성 시 사용된다.",
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
