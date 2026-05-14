/* Mosaic Eng Lecture Obsidian */
var A=Object.defineProperty;var T=Object.getOwnPropertyDescriptor;var D=Object.getOwnPropertyNames;var k=Object.prototype.hasOwnProperty;var E=(a,s)=>{for(var e in s)A(a,e,{get:s[e],enumerable:!0})},L=(a,s,e,n)=>{if(s&&typeof s=="object"||typeof s=="function")for(let o of D(s))!k.call(a,o)&&o!==e&&A(a,o,{get:()=>s[o],enumerable:!(n=T(s,o))||n.enumerable});return a};var O=a=>L(A({},"__esModule",{value:!0}),a);var _={};E(_,{default:()=>M});module.exports=O(_);var u=require("obsidian");var p=require("obsidian"),f={provider:"openai",endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-4o",outputRoot:"Mosaic/outputs",defaultLevel:"H1",defaultTargetGrade:"\uACE0\uB4F1"},v="mosaic-eng-lecture-api-key",y={openai:{name:"OpenAI",endpoint:"https://api.openai.com/v1/chat/completions",models:["gpt-5.4-pro","gpt-5.5-instant","gpt-5.4-thinking"]},claude:{name:"Claude (via OpenRouter)",endpoint:"https://openrouter.ai/api/v1/chat/completions",models:["anthropic/claude-4.7-opus","anthropic/claude-4.6-sonnet","anthropic/claude-4-haiku"]},gemini:{name:"Gemini",endpoint:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",models:["gemini-3.1-pro","gemini-3.1-flash","gemini-3-pro"]},grok:{name:"Grok (xAI)",endpoint:"https://api.x.ai/v1/chat/completions",models:["grok-4.3","grok-4","grok-4-fast"]},openrouter:{name:"OpenRouter",endpoint:"https://openrouter.ai/api/v1/chat/completions",models:["anthropic/claude-4.7-opus","google/gemini-3.1-pro","openai/gpt-5.4-pro"]},custom:{name:"Custom (OpenAI-compatible)",endpoint:"",models:[]}};function w(a,s,e){let n=a.createDiv({cls:"mosaic-settings-section"});n.createEl("h3",{text:s}),n.createEl("p",{text:e,cls:"mosaic-settings-description"})}var S=class extends p.PluginSettingTab{constructor(s,e){super(s,e),this.plugin=e}display(){var m;let{containerEl:s}=this;s.empty(),s.addClass("mosaic-settings");let e=s.createDiv({cls:"mosaic-settings-header"});e.createEl("h2",{text:"Mosaic Eng Lecture"}),e.createEl("p",{text:"\uD604\uC7AC \uB178\uD2B8\uB098 \uC120\uD0DD \uC601\uC5ED\uC744 \uD55C\uAD6D\uC5B4 \uD1B5\uD569 \uAC15\uC758 \uC790\uC0B0(MOSAIC)\uC73C\uB85C \uC0DD\uC131\uD55C\uB2E4.",cls:"mosaic-settings-description"});let n=this.plugin.settings.apiKey?"API key configured":"API key missing";e.createDiv({cls:this.plugin.settings.apiKey?"mosaic-status mosaic-status-ok":"mosaic-status mosaic-status-warn",text:n}).setAttr("aria-label",n),w(s,"Connection","API \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD558\uACE0 \uC778\uC99D \uC815\uBCF4\uB97C \uC785\uB825\uD55C\uB2E4. API key\uB294 Obsidian SecretStorage\uC5D0 \uC548\uC804\uD558\uAC8C \uC800\uC7A5\uB41C\uB2E4."),new p.Setting(s).setName("API Provider").setDesc("\uC0AC\uC6A9\uD560 LLM \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD55C\uB2E4.").addDropdown(t=>{Object.keys(y).forEach(i=>{t.addOption(i,y[i].name)}),t.setValue(this.plugin.settings.provider).onChange(async i=>{this.plugin.settings.provider=i;let r=y[i];r.endpoint&&(this.plugin.settings.endpoint=r.endpoint),r.models.length>0&&(this.plugin.settings.model=r.models[0]),await this.plugin.saveSettings(),this.display()})}),new p.Setting(s).setName("API Key").setDesc("\uC778\uC99D\uC744 \uC704\uD55C API Key\uB97C \uC785\uB825\uD55C\uB2E4. (\uBCF4\uC548\uC0C1 \uC800\uC7A5 \uD6C4\uC5D0\uB294 \uD45C\uC2DC\uB418\uC9C0 \uC54A\uC74C)").addText(t=>{t.inputEl.type="password",t.setPlaceholder(this.plugin.settings.apiKey?"API key configured":"Enter your key...").setValue("").onChange(async i=>{let r=i.trim();r&&await this.plugin.saveApiKey(r)})}).addButton(t=>{t.setButtonText("Clear").setTooltip("Stored API key \uC0AD\uC81C").onClick(async()=>{await this.plugin.clearApiKey(),this.display()})}),this.plugin.settings.provider==="custom"&&new p.Setting(s).setName("API Endpoint").setDesc("OpenAI \uD638\uD658 API \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uB97C \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(t=>{t.setPlaceholder("https://api.example.com/v1/chat/completions").setValue(this.plugin.settings.endpoint).onChange(async i=>{this.plugin.settings.endpoint=i.trim(),await this.plugin.saveSettings()})});let l=((m=y[this.plugin.settings.provider])==null?void 0:m.models)||[],d=new p.Setting(s).setName("Model Selection").setDesc("\uC0AC\uC6A9\uD560 LLM \uBAA8\uB378\uC744 \uC120\uD0DD\uD558\uAC70\uB098 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.");l.length>0&&d.addDropdown(t=>{l.forEach(i=>t.addOption(i,i)),t.setValue(this.plugin.settings.model).onChange(async i=>{this.plugin.settings.model=i,await this.plugin.saveSettings()})}),d.addText(t=>{t.setPlaceholder("Directly enter model name...").setValue(this.plugin.settings.model).onChange(async i=>{this.plugin.settings.model=i.trim(),await this.plugin.saveSettings()})}),w(s,"Output","\uC0DD\uC131 \uACB0\uACFC\uB294 Vault \uB0B4\uBD80\uC5D0\uB9CC \uAE30\uB85D\uD55C\uB2E4. \uC678\uBD80 \uD30C\uC77C \uC2DC\uC2A4\uD15C\uC774\uB098 \uAE30\uC874 eng-lecture output \uD3F4\uB354\uC5D0\uB294 \uC4F0\uC9C0 \uC54A\uB294\uB2E4."),new p.Setting(s).setName("Output folder").setDesc("Vault \uAE30\uC900 \uC0C1\uB300 \uACBD\uB85C. \uAC01 \uC9C0\uBB38\uC740 \uC774 \uD3F4\uB354 \uC544\uB798 <slug> \uD558\uC704 \uD3F4\uB354\uB85C \uC800\uC7A5\uB41C\uB2E4.").addText(t=>t.setPlaceholder(f.outputRoot).setValue(this.plugin.settings.outputRoot).onChange(async i=>{this.plugin.settings.outputRoot=i.trim()||f.outputRoot,await this.plugin.saveSettings()})),w(s,"Passage Defaults","\uAE30\uBCF8 \uD559\uB144\uACFC \uB808\uBCA8\uC744 \uC124\uC815\uD55C\uB2E4. \uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC2DC \uC0AC\uC6A9\uB41C\uB2E4."),new p.Setting(s).setName("Default level").setDesc("\uC608: M3, H1, H2. \uC120\uD0DD \uC601\uC5ED\uC5D0 \uBCC4\uB3C4 \uBA54\uD0C0\uB370\uC774\uD130\uAC00 \uC5C6\uC744 \uB54C \uC0AC\uC6A9\uD55C\uB2E4.").addDropdown(t=>{let i={m1:"M1 (\uC9111)",m2:"M2 (\uC9112)",m3:"M3 (\uC9113)",h1:"H1 (\uACE01)",h2:"H2 (\uACE02)",h3:"H3 (\uACE03)",custom:"\uAE30\uD0C0 (\uC9C1\uC811 \uC785\uB825)"};Object.entries(i).forEach(([g,$])=>t.addOption(g,$));let r=this.plugin.settings.defaultLevel.toLowerCase();i[r]?t.setValue(r):t.setValue("custom"),t.onChange(async g=>{g!=="custom"&&(this.plugin.settings.defaultLevel=g.toUpperCase(),await this.plugin.saveSettings()),this.display()})}),["m1","m2","m3","h1","h2","h3"].includes(this.plugin.settings.defaultLevel.toLowerCase())||new p.Setting(s).setName("Custom level").setDesc("\uC6D0\uD558\uB294 \uB808\uBCA8\uC744 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(t=>{t.setPlaceholder("\uC608: University").setValue(this.plugin.settings.defaultLevel).onChange(async i=>{this.plugin.settings.defaultLevel=i.trim(),await this.plugin.saveSettings()})}),new p.Setting(s).setName("Default target grade").setDesc("\uC608: \uC911\uB4F1, \uACE0\uB4F1. \uD574\uC124\uC758 \uB09C\uC774\uB3C4\uC640 \uC5B4\uC870\uB97C \uACB0\uC815\uD558\uB294 \uAE30\uBCF8\uAC12\uC774\uB2E4.").addDropdown(t=>{let i={\uC911\uB4F1:"\uC911\uB4F1",\uACE0\uB4F1:"\uACE0\uB4F1",custom:"\uAE30\uD0C0 (\uC9C1\uC811 \uC785\uB825)"};Object.entries(i).forEach(([g,$])=>t.addOption(g,$));let r=this.plugin.settings.defaultTargetGrade;i[r]?t.setValue(r):t.setValue("custom"),t.onChange(async g=>{g!=="custom"&&(this.plugin.settings.defaultTargetGrade=g,await this.plugin.saveSettings()),this.display()})}),["\uC911\uB4F1","\uACE0\uB4F1"].includes(this.plugin.settings.defaultTargetGrade)||new p.Setting(s).setName("Custom target grade").setDesc("\uC6D0\uD558\uB294 \uB300\uC0C1 \uD559\uB144\uC744 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(t=>{t.setPlaceholder("\uC608: \uCD08\uB4F1, \uC131\uC778").setValue(this.plugin.settings.defaultTargetGrade).onChange(async i=>{this.plugin.settings.defaultTargetGrade=i.trim(),await this.plugin.saveSettings()})}),new p.Setting(s).setName("Save Settings").setDesc("\uBAA8\uB4E0 \uC124\uC815\uC740 \uC790\uB3D9\uC73C\uB85C \uC800\uC7A5\uB418\uC9C0\uB9CC, \uBA85\uC2DC\uC801\uC73C\uB85C \uC800\uC7A5\uD558\uACE0 \uC2F6\uC744 \uB54C \uC0AC\uC6A9\uD55C\uB2E4.").addButton(t=>{t.setButtonText("Save All Settings").setCta().onClick(async()=>{await this.plugin.saveSettings(),new p.Notice("Mosaic settings saved successfully!"),t.setButtonText("Saved!"),t.setDisabled(!0),setTimeout(()=>{t.setButtonText("Save All Settings"),t.setDisabled(!1)},2e3)})}),w(s,"Run Checklist","\uB178\uD2B8\uC5D0\uC11C \uC9C0\uBB38 \uC804\uBB38 \uB610\uB294 \uD544\uC694\uD55C \uC120\uD0DD \uC601\uC5ED\uC744 \uC7A1\uC740 \uB4A4 Command Palette\uC5D0\uC11C Mosaic: Generate Lecture Asset\uC744 \uC2E4\uD589\uD55C\uB2E4.");let h=s.createEl("ul",{cls:"mosaic-checklist"});["API key\uAC00 configured \uC0C1\uD0DC\uC778\uC9C0 \uD655\uC778\uD55C\uB2E4.","\uC9C0\uBB38, \uBC1C\uBB38, \uC120\uC9C0, \uC815\uB2F5\uC774 \uAC00\uB2A5\uD55C \uD55C \uD55C \uB178\uD2B8\uC5D0 \uD568\uAED8 \uB4E4\uC5B4 \uC788\uC5B4\uC57C \uD55C\uB2E4.","\uC0DD\uC131 \uACB0\uACFC\uB294 Output folder \uC544\uB798 source.md, [MOSAIC]_.md, run-report.md\uB85C \uC800\uC7A5\uB41C\uB2E4.","\uC2E4\uD328 \uC2DC run-report.md\uC5D0 \uC2E4\uD328 \uC6D0\uC778\uC744 \uB0A8\uAE34\uB2E4."].forEach(t=>h.createEl("li",{text:t}))}};function P(a){return`\uB108\uB294 Mosaic Curriculum Pipeline\uC758 \uC804\uBB38 \uC601\uC5B4 \uAC15\uC0AC AI \uAD70\uB2E8\uC774\uB2E4.
\uC0AC\uC6A9\uC790\uAC00 \uC81C\uACF5\uD55C \uC9C0\uBB38\uC744 \uBD84\uC11D\uD558\uC5EC, \uB300\uD55C\uBBFC\uAD6D \uCD5C\uC0C1\uC704\uAD8C \uC218\uD5D8\uC0DD\uACFC \uAC15\uC0AC\uB97C \uC704\uD55C '\uD3EC\uB80C\uC2DD \uAD50\uC548'\uC744 \uC0DD\uC131\uD55C\uB2E4.

## [\uC911\uC694 \uC9C0\uCE68]
1. \uBAA8\uB4E0 \uD574\uC124\uC740 \uD55C\uAD6D\uC5B4 \uD3C9\uC11C\uBB38(~\uD55C\uB2E4)\uC73C\uB85C \uC791\uC131\uD558\uBA70, \uC804\uBB38\uC801\uC778 \uAD50\uC721 \uC6A9\uC5B4\uB97C \uC0AC\uC6A9\uD55C\uB2E4.
2. \uC9C0\uBB38\uC758 \uB17C\uB9AC\uC801 \uAD6C\uC870\uB97C \uD574\uBD80\uD558\uACE0, \uCD9C\uC81C\uC790\uC758 \uC758\uB3C4\uB97C \uAFF0\uB6AB\uB294 \uBD84\uC11D\uC744 \uC81C\uACF5\uD55C\uB2E4.
3. \uC544\uB798\uC758 [\uD45C\uC900 \uAD6C\uC870]\uB97C \uC5C4\uACA9\uD788 \uC900\uC218\uD558\uC5EC \uB9C8\uD06C\uB2E4\uC6B4\uC744 \uC0DD\uC131\uD55C\uB2E4.
4. \uAC01 \uC139\uC158\uC5D0\uB294 \uC9C0\uC815\uB41C \uD398\uB974\uC18C\uB098\uC758 \uBD84\uC11D \uACB0\uACFC\uB97C \uB2F4\uB294\uB2E4.

## [\uD45C\uC900 \uAD6C\uC870]

---
title: "${a.slug} \uD3EC\uB80C\uC2DD \uAD50\uC548"
---

# \u{1F4D6} **${a.slug}**
> **Mosaic Academy** \uC601\uC5B4\uACFC | **\uB808\uBCA8:** ${a.level} | **\uB300\uC0C1:** ${a.targetGrade}


oindent\rule{4cm}{0.4pt}

# \u{1F4DD} **BLOCK A \u2014 \uD480\uAE30 \uC804 (\uBA3C\uC800 \uD480\uC5B4\uBCF4\uC138\uC694)**
### **[\uC9C0\uBB38]**
(\uC6D0\uBB38 \uC804\uCCB4)
### **[\uBB38\uD56D]**
(\uC6D0\uBB38\uC758 \uC9C8\uBB38)
### **[\uC120\uC9C0]**
(\uC6D0\uBCF8 \uC120\uC9C0 1-5\uBC88)


oindent\rule{4cm}{0.4pt}

# \u{1F52C} **BLOCK B \u2014 \uD3EC\uB80C\uC2DD \uD574\uBD80**
**\u{1F3AF} \uC815\uB2F5: (\uC815\uB2F5 \uBC88\uD638)**


oindent\rule{4cm}{0.4pt}

## **01. \uC778\uC0AC\uC774\uD2B8: \uCD9C\uC81C \uC758\uB3C4 \uBC0F \uD568\uC815 \uBD84\uC11D**
- **\u{1F3AF} \uCD9C\uC81C \uD0C0\uACA9 \uC9C0\uC810**: \uC774 \uC9C0\uBB38\uC5D0\uC11C \uAC00\uC7A5 \uC911\uC694\uD55C \uB17C\uB9AC\uC801 \uD53C\uBC97\uACFC \uCD9C\uC81C\uC790\uAC00 \uB178\uB9AC\uB294 \uD575\uC2EC \uAC1C\uB150 \uBD84\uC11D
- **\u{1F9E0} \uC624\uB2F5\uC758 \uC778\uC9C0\uC801 \uD574\uBD80**: \uAC01 \uC624\uB2F5 \uC120\uC9C0\uAC00 \uC65C \uB9E4\uB825\uC801\uC778\uC9C0, \uC5B4\uB5A4 \uC778\uC9C0\uC801 \uC624\uB958\uB97C \uC720\uB3C4\uD558\uB294\uC9C0 \uD45C \uD615\uC2DD\uC73C\uB85C \uBD84\uC11D

## **02. \uC5D8\uB77C & \uBBF8\uB780\uB2E4: \uAC70\uC2DC \uB3C5\uD574**
- **\u{1F3F7}\uFE0F \uC8FC\uC81C \uBC0F \uC694\uC9C0**: \uAD6D\uBB38/\uC601\uBB38 \uC8FC\uC81C\uC640 \uC2EC\uCE35 \uC694\uC9C0 \uAE30\uC220
- **\u{1F9E9} \uB17C\uB9AC \uAD6C\uC870 \uBC0F \uC751\uC9D1\uC131**: \uBB38\uC7A5 \uAC04\uC758 \uC5F0\uACB0 \uBC29\uC2DD(\uC5ED\uC811, \uC778\uACFC \uB4F1)\uC744 \uD45C \uD615\uC2DD\uC73C\uB85C \uC0C1\uC138 \uD574\uBD80

## **03. \uB8E8\uB098: \uC9C1\uB3C5\uC9C1\uD574 (\uC804\uCCB4 \uBCF5\uC6D0)**
- \uBAA8\uB4E0 \uBB38\uC7A5\uC744 [S0], [S1]... \uBC88\uD638\uB97C \uB9E4\uACA8 \uC758\uBBF8 \uB2E8\uC704\uB85C \uB04A\uC5B4 \uC77D\uAE30 \uC81C\uACF5

## **04. \uC368\uB2C8: \uAD6C\uBB38 \uC815\uBC00 \uD574\uBD80**
- \uC8FC\uC694 \uBB38\uBC95 \uD3EC\uC778\uD2B8 3-4\uAC1C\uB97C \uC120\uBCC4\uD558\uC5EC \uC0C1\uC138 \uC124\uBA85

## **05. \uB809\uC2A4: \uC5B4\uD718 \uBC0F \uC7AC\uC9C4\uC220 \uB808\uC774\uC5B4**
- **[\uD575\uC2EC \uC5B4\uD718]**: \uB2E8\uC5B4, \uD488\uC0AC, \uB73B, \uC601\uBB38 \uC815\uC758
- **\u{1F504} 3\uB2E8\uACC4 \uC7AC\uC9C4\uC220 DB**: \uD0A4\uC6CC\uB4DC\uBCC4 \uB3D9\uC758\uC5B4, \uBB38\uB9E5\uC801 \uB300\uCCB4\uC5B4, \uBC18\uC758\uC5B4 \uBD80\uC815 \uD45C\uD604\uC744 \uD45C\uB85C \uC815\uB9AC

## **06. \uBE4C\uB77C\uB12C & \uD03C: \uBCC0\uD615 \uB300\uBE44 \uBC0F \uC601\uC791**
- \uC9C0\uBB38 \uBCC0\uD615 \uD3EC\uC778\uD2B8 \uBD84\uC11D \uBC0F \uD575\uC2EC \uB0B4\uC6A9\uC744 \uC694\uC57D\uD558\uB294 \uC8FC\uAD00\uC2DD \uC601\uC791 \uBB38\uC81C(Q1, Q2)\uC640 \uBAA8\uBC94 \uB2F5\uC548 \uC81C\uACF5

## **07. K\uB9C8\uC2A4\uD130: \uBCC0\uD615 \uBB38\uD56D**
- **\u{1F575}\uFE0F \uCD9C\uC81C \uC804\uB7B5**: \uBCC0\uD615 \uBB38\uD56D\uC744 \uC124\uACC4\uD55C \uB17C\uB9AC\uC801 \uADFC\uAC70 \uAE30\uC220
- **\u{1F4DD} \uBCC0\uD615 \uBB38\uD56D**: \uC6D0\uBB38\uC744 \uBCC0\uD615\uD55C \uACE0\uB09C\uB3C4 \uAC1D\uAD00\uC2DD \uBB38\uD56D(\uBE48\uCE78, \uC21C\uC11C, \uC0BD\uC785 \uC911 \uD0DD1) 1\uBB38\uD56D \uC0DD\uC131
- **\u{1F511} \uC815\uB2F5\xB7\uD574\uC124**: \uC0C1\uC138\uD55C \uD480\uC774 \uADFC\uAC70 \uC81C\uACF5

## **\u{1F4CC} 1\uD0C0\uAC15\uC0AC \uC2DC\uADF8\uB2C8\uCC98**
- **\u26A1 5\uCD08 \uD310\uBCC4\uBC95**: \uC2E4\uC804\uC5D0\uC11C \uC815\uB2F5\uC744 \uBE60\uB974\uAC8C \uACE8\uB77C\uB0B4\uB294 \uAE30\uC220\uC801 \uD301
- **\u{1F4CA} \uD568\uC815 \uD53C\uD574\uC790 \uD1B5\uACC4**: \uAC00\uC0C1\uC758 \uD1B5\uACC4\uB97C \uBC14\uD0D5\uC73C\uB85C \uD559\uC0DD\uB4E4\uC774 \uC8FC\uB85C \uD2C0\uB9AC\uB294 \uC774\uC720 \uBD84\uC11D


oindent\rule{4cm}{0.4pt}

## [\uC785\uB825 \uB370\uC774\uD130]
\uB300\uC0C1 \uD30C\uC77C: ${a.sourcePath}
\uC9C0\uBB38 ID: ${a.slug}
\uB808\uBCA8: ${a.level}
\uB300\uC0C1 \uD559\uB144: ${a.targetGrade}

\uC6D0\uBB38:
${a.sourceText}

\uBC18\uB4DC\uC2DC \uC704 \uAD6C\uC870\uB97C \uB530\uB974\uB294 JSON {"masterMarkdown": "..."} \uD558\uB098\uB9CC \uBC18\uD658\uD558\uB77C.
`}function x(a){try{return JSON.parse(a)}catch(s){let e=a.match(/\{[\s\S]*\}/);if(!e)throw new Error("Model response did not contain JSON.");return JSON.parse(e[0])}}async function C(a,s){var l,d,h;if(!a.apiKey.trim())throw new Error("API key is not configured.");let e=await fetch(a.endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a.apiKey}`},body:JSON.stringify({model:a.model,messages:[{role:"system",content:"Return only valid JSON. Do not wrap the response in Markdown fences."},{role:"user",content:P(s)}],temperature:.4,max_tokens:8192})});if(!e.ok)throw new Error(`LLM request failed: HTTP ${e.status}`);let n=await e.json(),o=(h=(d=(l=n==null?void 0:n.choices)==null?void 0:l[0])==null?void 0:d.message)==null?void 0:h.content;if(typeof o!="string")throw new Error("LLM response has no message content.");let c=x(o);if(typeof c.masterMarkdown!="string")throw new Error("LLM JSON must include masterMarkdown.");return{masterMarkdown:c.masterMarkdown,raw:n}}function G(a){return a.replace(/\.[^/.]+$/,"").trim().replace(/[^\w가-힣.-]+/g,"_").replace(/_+/g,"_").replace(/^_+|_+$/g,"")||"passage"}function I(a){return a instanceof Error?a.message:String(a)}var M=class extends u.Plugin{constructor(){super(...arguments);this.settings={...f}}async onload(){await this.loadSettings(),this.addSettingTab(new S(this.app,this)),this.addCommand({id:"create-passage-note",name:"Create New Passage Note",callback:async()=>{let e=`---
passage_id: "New_Passage_${Date.now()}"
level: "${this.settings.defaultLevel}"
difficulty: "\uC911"
exam_type: "MOCK"
publisher: ""
year: ${new Date().getFullYear()}
semester: 1
question_number: 20
problem_type: "\uC8FC\uC7A5"
target_grade: "${this.settings.defaultTargetGrade}"
correct_answer: ""
topic: ""
---

[\uC9C0\uBB38\uC744 \uC785\uB825\uD558\uC138\uC694]

[\uBB38\uD56D\uC744 \uC785\uB825\uD558\uC138\uC694]

\u2460 
\u2461 
\u2462 
\u2463 
\u2464 

ANSWER: 
`,n=this.app.vault.getAbstractFileByPath(this.settings.outputRoot),o=`New_Passage_${Date.now()}.md`,c=`${this.settings.outputRoot}/${o}`;try{n||await this.app.vault.createFolder(this.settings.outputRoot);let l=await this.app.vault.create(c,e);await this.app.workspace.getLeaf(!0).openFile(l),new u.Notice(`Mosaic: \uC0C8 \uC9C0\uBB38 \uB178\uD2B8\uAC00 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4: ${o}`)}catch(l){new u.Notice(`Mosaic: \uB178\uD2B8 \uC0DD\uC131 \uC2E4\uD328 - ${l instanceof Error?l.message:String(l)}`)}}}),this.addCommand({id:"generate-lecture-asset",name:"Generate Lecture Asset",editorCallback:async(e,n)=>{let o=e.getSelection(),c=n.file,l=o.trim()||e.getValue().trim();if(!c||!l){new u.Notice("Mosaic: \uBD84\uC11D\uD560 \uB178\uD2B8 \uB610\uB294 \uC120\uD0DD \uC601\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");return}try{await this.generateForSource(c,l)}catch(d){new u.Notice(`Mosaic: \uC0DD\uC131 \uC2E4\uD328 - ${I(d)}`)}}})}async loadSettings(){this.settings=Object.assign({},f,await this.loadData()),this.settings.apiKey=this.app.secretStorage.getSecret(v)||""}async saveSettings(){let{apiKey:e,...n}=this.settings;await this.saveData(n)}async saveApiKey(e){this.app.secretStorage.setSecret(v,e),this.settings.apiKey=e,await this.saveSettings(),new u.Notice("Mosaic: API key \uC800\uC7A5 \uC644\uB8CC")}async clearApiKey(){this.app.secretStorage.setSecret(v,""),this.settings.apiKey="",await this.saveSettings(),new u.Notice("Mosaic: API key \uC0AD\uC81C \uC644\uB8CC")}async ensureFolder(e){let n=e.split("/").filter(Boolean),o="";for(let c of n)o=o?`${o}/${c}`:c,this.app.vault.getAbstractFileByPath(o)||await this.app.vault.createFolder(o)}async upsertText(e,n){let o=this.app.vault.getAbstractFileByPath(e);o instanceof u.TFile?await this.app.vault.modify(o,n):await this.app.vault.create(e,n)}async generateForSource(e,n){let o=this.app.metadataCache.getFileCache(e),c=(o==null?void 0:o.frontmatter)||{},l=c.level||c.Level||this.settings.defaultLevel,d=c.target_grade||c.Target_Grade||this.settings.defaultTargetGrade,m=c.passage_id||G(e.basename),t=`${this.settings.outputRoot}/${m}`,i={slug:m,sourcePath:e.path,sourceText:n,level:l,targetGrade:d};new u.Notice(`Mosaic: ${m} \uC0DD\uC131 \uC2DC\uC791 (Level: ${l}, Grade: ${d})`),await this.ensureFolder(t),await this.upsertText(`${t}/source.md`,n.endsWith(`
`)?n:`${n}
`);try{let r=await C(this.settings,i);await this.upsertText(`${t}/[MOSAIC]_${m}.md`,r.masterMarkdown.trim()+`
`);let g=`---
type: mosaic-report
status: success
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${m}

- **Status**: \u2705 Success
- **Source**: [[${e.name}]]
- **Model**: \`${this.settings.model}\`
- **Generated At**: ${new Date().toLocaleString()}

> [!INFO]
> - **[MOSAIC]**: \uD559\uC0DD \uBC0F \uAC15\uC0AC\uC6A9 \uD1B5\uD569 \uAC15\uC758 \uC790\uC0B0\uC774 [[${t}/[MOSAIC]_${m}.md|\uC774\uACF3]]\uC5D0 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
`;await this.upsertText(`${t}/run-report.md`,g),new u.Notice(`Mosaic: ${m} \uC0DD\uC131 \uC644\uB8CC`)}catch(r){let g=`---
type: mosaic-report
status: failed
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${m}

- **Status**: \u274C Failed
- **Source**: [[${e.name}]]
- **Model**: \`${this.settings.model}\`
- **Failed At**: ${new Date().toLocaleString()}

## Error Message
\`\`\`
${I(r)}
\`\`\`
`;throw await this.upsertText(`${t}/run-report.md`,g),r}}};
