import { App, Modal } from "obsidian";

const LABELS  = ["Triage", "Dense Analysis", "K-Master"];
const EMOJIS  = ["🔍", "⚙️", "✍️"];
const SPINNERS = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

export class ProgressModal extends Modal {
  private stage = 0;
  private done  = false;
  private durations: (number | null)[] = [null, null, null];
  private stageStart = Date.now();
  private totalStart = Date.now();
  private auditScore?: number;

  private iconEls: HTMLElement[] = [];
  private timeEls: HTMLElement[] = [];
  private rowEls:  HTMLElement[] = [];
  private barFill!: HTMLElement;
  private timerEl!: HTMLElement;
  private stepEl!:  HTMLElement;
  private auditEl!: HTMLElement;

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private spinHandle:  ReturnType<typeof setInterval> | null = null;
  private spinIdx = 0;

  constructor(app: App, private passageId: string, private model: string) {
    super(app);
    this.modalEl.addClass("mosaic-progress-modal");
  }

  onOpen() {
    this.buildUI();
    this.renderStages();
    this.timerHandle = setInterval(() => this.tickTimer(), 1000);
    this.spinHandle  = setInterval(() => this.tickSpinner(), 120);
  }

  onClose() {
    if (this.timerHandle) clearInterval(this.timerHandle);
    if (this.spinHandle)  clearInterval(this.spinHandle);
  }

  advance() {
    this.durations[this.stage] = (Date.now() - this.stageStart) / 1000;
    this.stage++;
    this.stageStart = Date.now();
    this.renderStages();
  }

  complete(auditScore?: number) {
    if (this.stage < 3) {
      this.durations[this.stage] = (Date.now() - this.stageStart) / 1000;
    }
    this.auditScore = auditScore;
    this.done = true;
    this.renderStages();
    setTimeout(() => this.close(), 2000);
  }

  private buildUI() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mosaic-prog-content");

    // Header
    const hdr = contentEl.createDiv("mosaic-prog-header");
    hdr.createDiv({ cls: "mosaic-prog-title", text: "📐 MOSAIC 교안 생성 중" });
    hdr.createDiv({ cls: "mosaic-prog-meta",  text: `${this.passageId}  ·  ${this.model}` });

    contentEl.createDiv("mosaic-prog-divider");

    // Stage rows
    const wrap = contentEl.createDiv("mosaic-prog-stages");
    for (let i = 0; i < 3; i++) {
      const row  = wrap.createDiv("mosaic-prog-row");
      const icon = row.createSpan("mosaic-prog-icon");
      row.createSpan({ cls: "mosaic-prog-label", text: `${EMOJIS[i]}  ${LABELS[i]}` });
      const time = row.createSpan("mosaic-prog-time");
      this.iconEls.push(icon);
      this.timeEls.push(time);
      this.rowEls.push(row);
    }

    // Progress bar
    const barWrap = contentEl.createDiv("mosaic-prog-bar-wrap");
    this.barFill  = barWrap.createDiv("mosaic-prog-bar-fill");

    // Footer
    const footer  = contentEl.createDiv("mosaic-prog-footer");
    this.stepEl   = footer.createSpan("mosaic-prog-step");
    this.timerEl  = footer.createSpan("mosaic-prog-elapsed");

    // Audit result (hidden until done)
    this.auditEl = contentEl.createDiv("mosaic-prog-audit");
  }

  private renderStages() {
    for (let i = 0; i < 3; i++) {
      const row  = this.rowEls[i];
      const icon = this.iconEls[i];
      const time = this.timeEls[i];
      row.className = "mosaic-prog-row";

      const isDone   = i < this.stage || (this.done && i === this.stage);
      const isActive = i === this.stage && !this.done;

      if (isDone) {
        row.addClass("mosaic-prog-done");
        icon.setText("✅");
        const d = this.durations[i];
        time.setText(d != null ? `${d.toFixed(1)}s` : "");
      } else if (isActive) {
        row.addClass("mosaic-prog-active");
        icon.setText(SPINNERS[this.spinIdx]);
        time.setText("진행 중...");
      } else {
        row.addClass("mosaic-prog-pending");
        icon.setText("○");
        time.setText("");
      }
    }

    // Bar
    const pct = this.done ? 100 : Math.round((this.stage / 3) * 100);
    this.barFill.style.width = `${pct}%`;
    if (this.done) this.barFill.addClass("mosaic-prog-bar-done");

    // Footer step label
    this.stepEl.setText(this.done ? "✅ 완료" : `${this.stage + 1} / 3 단계`);

    // Audit badge
    if (this.done && this.auditScore != null) {
      this.auditEl.empty();
      const pass = this.auditScore >= 80;
      this.auditEl.removeClass("mosaic-prog-audit-pass", "mosaic-prog-audit-fail");
      this.auditEl.addClass(pass ? "mosaic-prog-audit-pass" : "mosaic-prog-audit-fail");
      this.auditEl.setText(
        `Audit  ${this.auditScore} / 100 — ${pass ? "PASS ✅" : "FAIL ❌"}`
      );
    }
  }

  private tickTimer() {
    const s = Math.round((Date.now() - this.totalStart) / 1000);
    this.timerEl.setText(`${s}s`);
  }

  private tickSpinner() {
    if (this.done || this.stage >= 3) return;
    this.spinIdx = (this.spinIdx + 1) % SPINNERS.length;
    this.iconEls[this.stage]?.setText(SPINNERS[this.spinIdx]);
  }
}
