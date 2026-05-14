import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type MosaicLecturePlugin from "./main";
import type { MosaicSettings } from "./pipeline/types";

export const DEFAULT_SETTINGS: MosaicSettings = {
  provider: "openai",
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-5.5",
  outputRoot: "Mosaic_Eng/Outputs",
  defaultLevel: "H1",
  defaultTargetGrade: "고등",
};

export const API_KEY_SECRET_ID = "mosaic-eng-lecture-api-key";

const PROVIDER_CONFIGS: Record<string, { name: string; endpoint: string; models: string[] }> = {
  openai: {
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    models: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"],
  },
  claude: {
    name: "Claude",
    endpoint: "https://api.anthropic.com/v1/messages",
    models: ["claude-4-7-opus", "claude-4-6-sonnet", "claude-4-5-haiku"],
  },
  gemini: {
    name: "Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1/openai/chat/completions",
    models: ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-3-flash-preview"],
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
      text: "현재 노트나 선택 영역을 한국어 통합 강의 자산(MOSAIC)으로 생성한다.",
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
      .addDropdown((dropdown) => {
        const options: Record<string, string> = {
          "m1": "M1 (중1)",
          "m2": "M2 (중2)",
          "m3": "M3 (중3)",
          "h1": "H1 (고1)",
          "h2": "H2 (고2)",
          "h3": "H3 (고3)",
          "custom": "기타 (직접 입력)"
        };
        Object.entries(options).forEach(([k, v]) => dropdown.addOption(k, v));
        
        // 초기값 설정: 기존 값이 리스트에 없으면 custom으로 처리
        const currentVal = this.plugin.settings.defaultLevel.toLowerCase();
        if (options[currentVal]) {
          dropdown.setValue(currentVal);
        } else {
          dropdown.setValue("custom");
        }

        dropdown.onChange(async (value) => {
          if (value !== "custom") {
            this.plugin.settings.defaultLevel = value.toUpperCase();
            await this.plugin.saveSettings();
          }
          this.display();
        });
      });

    if (!["m1", "m2", "m3", "h1", "h2", "h3"].includes(this.plugin.settings.defaultLevel.toLowerCase())) {
      new Setting(containerEl)
        .setName("Custom level")
        .setDesc("원하는 레벨을 직접 입력한다.")
        .addText((text) => {
          text
            .setPlaceholder("예: University")
            .setValue(this.plugin.settings.defaultLevel)
            .onChange(async (value) => {
              this.plugin.settings.defaultLevel = value.trim();
              await this.plugin.saveSettings();
            });
        });
    }

    new Setting(containerEl)
      .setName("Default target grade")
      .setDesc("예: 중등, 고등. 해설의 난이도와 어조를 결정하는 기본값이다.")
      .addDropdown((dropdown) => {
        const options: Record<string, string> = {
          "중등": "중등",
          "고등": "고등",
          "custom": "기타 (직접 입력)"
        };
        Object.entries(options).forEach(([k, v]) => dropdown.addOption(k, v));

        const currentVal = this.plugin.settings.defaultTargetGrade;
        if (options[currentVal]) {
          dropdown.setValue(currentVal);
        } else {
          dropdown.setValue("custom");
        }

        dropdown.onChange(async (value) => {
          if (value !== "custom") {
            this.plugin.settings.defaultTargetGrade = value;
            await this.plugin.saveSettings();
          }
          this.display();
        });
      });

    if (!["중등", "고등"].includes(this.plugin.settings.defaultTargetGrade)) {
      new Setting(containerEl)
        .setName("Custom target grade")
        .setDesc("원하는 대상 학년을 직접 입력한다.")
        .addText((text) => {
          text
            .setPlaceholder("예: 초등, 성인")
            .setValue(this.plugin.settings.defaultTargetGrade)
            .onChange(async (value) => {
              this.plugin.settings.defaultTargetGrade = value.trim();
              await this.plugin.saveSettings();
            });
        });
    }

    new Setting(containerEl)
      .setName("Save Settings")
      .setDesc("모든 설정은 자동으로 저장되지만, 명시적으로 저장하고 싶을 때 사용한다.")
      .addButton((button) => {
        button
          .setButtonText("Save All Settings")
          .setCta()
          .onClick(async () => {
            await this.plugin.saveSettings();
            // @ts-ignore
            new Notice("Mosaic settings saved successfully!");
            button.setButtonText("Saved!");
            button.setDisabled(true);
            setTimeout(() => {
              button.setButtonText("Save All Settings");
              button.setDisabled(false);
            }, 2000);
          });
      });

    section(
      containerEl,
      "Run Checklist",
      "노트에서 지문 전문 또는 필요한 선택 영역을 잡은 뒤 Command Palette에서 Mosaic: Generate Lecture Asset을 실행한다.",
    );

    const checklist = containerEl.createEl("ul", { cls: "mosaic-checklist" });
    [
      "API key가 configured 상태인지 확인한다.",
      "지문, 발문, 선지, 정답이 가능한 한 한 노트에 함께 들어 있어야 한다.",
      "생성 결과는 Output folder 아래 source.md, [MOSAIC]_.md, run-report.md로 저장된다.",
      "실패 시 run-report.md에 실패 원인을 남긴다.",
    ].forEach((item) => checklist.createEl("li", { text: item }));
  }
}
