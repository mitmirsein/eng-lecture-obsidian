/* Mosaic Eng Lecture Obsidian */
var I=Object.defineProperty;var E=Object.getOwnPropertyDescriptor;var _=Object.getOwnPropertyNames;var x=Object.prototype.hasOwnProperty;var G=(a,s)=>{for(var e in s)I(a,e,{get:s[e],enumerable:!0})},N=(a,s,e,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let r of _(s))!x.call(a,r)&&r!==e&&I(a,r,{get:()=>s[r],enumerable:!(o=E(s,r))||o.enumerable});return a};var K=a=>N(I({},"__esModule",{value:!0}),a);var V={};G(V,{default:()=>A});module.exports=K(V);var m=require("obsidian");var l=require("obsidian"),f={provider:"openai",endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-4o",outputRoot:"Mosaic/outputs",defaultLevel:"H1",defaultTargetGrade:"\uACE0\uB4F1"},M="mosaic-eng-lecture-api-key",w={openai:{name:"OpenAI",endpoint:"https://api.openai.com/v1/chat/completions",models:["gpt-5.4-pro","gpt-5.5-instant","gpt-5.4-thinking"]},claude:{name:"Claude (via OpenRouter)",endpoint:"https://openrouter.ai/api/v1/chat/completions",models:["anthropic/claude-4.7-opus","anthropic/claude-4.6-sonnet","anthropic/claude-4-haiku"]},gemini:{name:"Gemini",endpoint:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",models:["gemini-3.1-pro","gemini-3.1-flash","gemini-3-pro"]},grok:{name:"Grok (xAI)",endpoint:"https://api.x.ai/v1/chat/completions",models:["grok-4.3","grok-4","grok-4-fast"]},openrouter:{name:"OpenRouter",endpoint:"https://openrouter.ai/api/v1/chat/completions",models:["anthropic/claude-4.7-opus","google/gemini-3.1-pro","openai/gpt-5.4-pro"]},custom:{name:"Custom (OpenAI-compatible)",endpoint:"",models:[]}};function S(a,s,e){let o=a.createDiv({cls:"mosaic-settings-section"});o.createEl("h3",{text:s}),o.createEl("p",{text:e,cls:"mosaic-settings-description"})}var v=class extends l.PluginSettingTab{constructor(s,e){super(s,e),this.plugin=e}display(){var d;let{containerEl:s}=this;s.empty(),s.addClass("mosaic-settings");let e=s.createDiv({cls:"mosaic-settings-header"});e.createEl("h2",{text:"Mosaic Eng Lecture"}),e.createEl("p",{text:"\uD604\uC7AC \uB178\uD2B8\uB098 \uC120\uD0DD \uC601\uC5ED\uC744 \uD55C\uAD6D\uC5B4 \uD1B5\uD569 \uAC15\uC758 \uC790\uC0B0(MOSAIC)\uC73C\uB85C \uC0DD\uC131\uD55C\uB2E4.",cls:"mosaic-settings-description"});let o=this.plugin.settings.apiKey?"API key configured":"API key missing";e.createDiv({cls:this.plugin.settings.apiKey?"mosaic-status mosaic-status-ok":"mosaic-status mosaic-status-warn",text:o}).setAttr("aria-label",o),S(s,"Connection","API \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD558\uACE0 \uC778\uC99D \uC815\uBCF4\uB97C \uC785\uB825\uD55C\uB2E4. API key\uB294 Obsidian SecretStorage\uC5D0 \uC548\uC804\uD558\uAC8C \uC800\uC7A5\uB41C\uB2E4."),new l.Setting(s).setName("API Provider").setDesc("\uC0AC\uC6A9\uD560 LLM \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD55C\uB2E4.").addDropdown(t=>{Object.keys(w).forEach(i=>{t.addOption(i,w[i].name)}),t.setValue(this.plugin.settings.provider).onChange(async i=>{this.plugin.settings.provider=i;let n=w[i];n.endpoint&&(this.plugin.settings.endpoint=n.endpoint),n.models.length>0&&(this.plugin.settings.model=n.models[0]),await this.plugin.saveSettings(),this.display()})}),new l.Setting(s).setName("API Key").setDesc("\uC778\uC99D\uC744 \uC704\uD55C API Key\uB97C \uC785\uB825\uD55C\uB2E4. (\uBCF4\uC548\uC0C1 \uC800\uC7A5 \uD6C4\uC5D0\uB294 \uD45C\uC2DC\uB418\uC9C0 \uC54A\uC74C)").addText(t=>{t.inputEl.type="password",t.setPlaceholder(this.plugin.settings.apiKey?"API key configured":"Enter your key...").setValue("").onChange(async i=>{let n=i.trim();n&&await this.plugin.saveApiKey(n)})}).addButton(t=>{t.setButtonText("Clear").setTooltip("Stored API key \uC0AD\uC81C").onClick(async()=>{await this.plugin.clearApiKey(),this.display()})}),this.plugin.settings.provider==="custom"&&new l.Setting(s).setName("API Endpoint").setDesc("OpenAI \uD638\uD658 API \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uB97C \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(t=>{t.setPlaceholder("https://api.example.com/v1/chat/completions").setValue(this.plugin.settings.endpoint).onChange(async i=>{this.plugin.settings.endpoint=i.trim(),await this.plugin.saveSettings()})});let u=((d=w[this.plugin.settings.provider])==null?void 0:d.models)||[],h=new l.Setting(s).setName("Model Selection").setDesc("\uC0AC\uC6A9\uD560 LLM \uBAA8\uB378\uC744 \uC120\uD0DD\uD558\uAC70\uB098 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.");u.length>0&&h.addDropdown(t=>{u.forEach(i=>t.addOption(i,i)),t.setValue(this.plugin.settings.model).onChange(async i=>{this.plugin.settings.model=i,await this.plugin.saveSettings()})}),h.addText(t=>{t.setPlaceholder("Directly enter model name...").setValue(this.plugin.settings.model).onChange(async i=>{this.plugin.settings.model=i.trim(),await this.plugin.saveSettings()})}),S(s,"Output","\uC0DD\uC131 \uACB0\uACFC\uB294 Vault \uB0B4\uBD80\uC5D0\uB9CC \uAE30\uB85D\uD55C\uB2E4. \uC678\uBD80 \uD30C\uC77C \uC2DC\uC2A4\uD15C\uC774\uB098 \uAE30\uC874 eng-lecture output \uD3F4\uB354\uC5D0\uB294 \uC4F0\uC9C0 \uC54A\uB294\uB2E4."),new l.Setting(s).setName("Output folder").setDesc("Vault \uAE30\uC900 \uC0C1\uB300 \uACBD\uB85C. \uAC01 \uC9C0\uBB38\uC740 \uC774 \uD3F4\uB354 \uC544\uB798 <slug> \uD558\uC704 \uD3F4\uB354\uB85C \uC800\uC7A5\uB41C\uB2E4.").addText(t=>t.setPlaceholder(f.outputRoot).setValue(this.plugin.settings.outputRoot).onChange(async i=>{this.plugin.settings.outputRoot=i.trim()||f.outputRoot,await this.plugin.saveSettings()})),S(s,"Passage Defaults","\uAE30\uBCF8 \uD559\uB144\uACFC \uB808\uBCA8\uC744 \uC124\uC815\uD55C\uB2E4. \uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC2DC \uC0AC\uC6A9\uB41C\uB2E4."),new l.Setting(s).setName("Default level").setDesc("\uC608: M3, H1, H2. \uC120\uD0DD \uC601\uC5ED\uC5D0 \uBCC4\uB3C4 \uBA54\uD0C0\uB370\uC774\uD130\uAC00 \uC5C6\uC744 \uB54C \uC0AC\uC6A9\uD55C\uB2E4.").addDropdown(t=>{let i={m1:"M1 (\uC9111)",m2:"M2 (\uC9112)",m3:"M3 (\uC9113)",h1:"H1 (\uACE01)",h2:"H2 (\uACE02)",h3:"H3 (\uACE03)",custom:"\uAE30\uD0C0 (\uC9C1\uC811 \uC785\uB825)"};Object.entries(i).forEach(([p,g])=>t.addOption(p,g));let n=this.plugin.settings.defaultLevel.toLowerCase();i[n]?t.setValue(n):t.setValue("custom"),t.onChange(async p=>{p!=="custom"&&(this.plugin.settings.defaultLevel=p.toUpperCase(),await this.plugin.saveSettings()),this.display()})}),["m1","m2","m3","h1","h2","h3"].includes(this.plugin.settings.defaultLevel.toLowerCase())||new l.Setting(s).setName("Custom level").setDesc("\uC6D0\uD558\uB294 \uB808\uBCA8\uC744 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(t=>{t.setPlaceholder("\uC608: University").setValue(this.plugin.settings.defaultLevel).onChange(async i=>{this.plugin.settings.defaultLevel=i.trim(),await this.plugin.saveSettings()})}),new l.Setting(s).setName("Default target grade").setDesc("\uC608: \uC911\uB4F1, \uACE0\uB4F1. \uD574\uC124\uC758 \uB09C\uC774\uB3C4\uC640 \uC5B4\uC870\uB97C \uACB0\uC815\uD558\uB294 \uAE30\uBCF8\uAC12\uC774\uB2E4.").addDropdown(t=>{let i={\uC911\uB4F1:"\uC911\uB4F1",\uACE0\uB4F1:"\uACE0\uB4F1",custom:"\uAE30\uD0C0 (\uC9C1\uC811 \uC785\uB825)"};Object.entries(i).forEach(([p,g])=>t.addOption(p,g));let n=this.plugin.settings.defaultTargetGrade;i[n]?t.setValue(n):t.setValue("custom"),t.onChange(async p=>{p!=="custom"&&(this.plugin.settings.defaultTargetGrade=p,await this.plugin.saveSettings()),this.display()})}),["\uC911\uB4F1","\uACE0\uB4F1"].includes(this.plugin.settings.defaultTargetGrade)||new l.Setting(s).setName("Custom target grade").setDesc("\uC6D0\uD558\uB294 \uB300\uC0C1 \uD559\uB144\uC744 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(t=>{t.setPlaceholder("\uC608: \uCD08\uB4F1, \uC131\uC778").setValue(this.plugin.settings.defaultTargetGrade).onChange(async i=>{this.plugin.settings.defaultTargetGrade=i.trim(),await this.plugin.saveSettings()})}),new l.Setting(s).setName("Save Settings").setDesc("\uBAA8\uB4E0 \uC124\uC815\uC740 \uC790\uB3D9\uC73C\uB85C \uC800\uC7A5\uB418\uC9C0\uB9CC, \uBA85\uC2DC\uC801\uC73C\uB85C \uC800\uC7A5\uD558\uACE0 \uC2F6\uC744 \uB54C \uC0AC\uC6A9\uD55C\uB2E4.").addButton(t=>{t.setButtonText("Save All Settings").setCta().onClick(async()=>{await this.plugin.saveSettings(),new l.Notice("Mosaic settings saved successfully!"),t.setButtonText("Saved!"),t.setDisabled(!0),setTimeout(()=>{t.setButtonText("Save All Settings"),t.setDisabled(!1)},2e3)})}),S(s,"Run Checklist","\uB178\uD2B8\uC5D0\uC11C \uC9C0\uBB38 \uC804\uBB38 \uB610\uB294 \uD544\uC694\uD55C \uC120\uD0DD \uC601\uC5ED\uC744 \uC7A1\uC740 \uB4A4 Command Palette\uC5D0\uC11C Mosaic: Generate Lecture Asset\uC744 \uC2E4\uD589\uD55C\uB2E4.");let y=s.createEl("ul",{cls:"mosaic-checklist"});["API key\uAC00 configured \uC0C1\uD0DC\uC778\uC9C0 \uD655\uC778\uD55C\uB2E4.","\uC9C0\uBB38, \uBC1C\uBB38, \uC120\uC9C0, \uC815\uB2F5\uC774 \uAC00\uB2A5\uD55C \uD55C \uD55C \uB178\uD2B8\uC5D0 \uD568\uAED8 \uB4E4\uC5B4 \uC788\uC5B4\uC57C \uD55C\uB2E4.","\uC0DD\uC131 \uACB0\uACFC\uB294 Output folder \uC544\uB798 source.md, [MOSAIC]_.md, run-report.md\uB85C \uC800\uC7A5\uB41C\uB2E4.","\uC2E4\uD328 \uC2DC run-report.md\uC5D0 \uC2E4\uD328 \uC6D0\uC778\uC744 \uB0A8\uAE34\uB2E4."].forEach(t=>y.createEl("li",{text:t}))}};function $(a){return`\uB108\uB294 Mosaic Curriculum Pipeline\uC758 \uC804\uBB38 \uC601\uC5B4 \uAC15\uC0AC AI \uAD70\uB2E8\uC774\uB2E4.
\uC0AC\uC6A9\uC790\uAC00 \uC81C\uACF5\uD55C \uC9C0\uBB38\uC744 \uBD84\uC11D\uD558\uC5EC, \uB300\uD55C\uBBFC\uAD6D \uCD5C\uC0C1\uC704\uAD8C \uC218\uD5D8\uC0DD\uACFC \uAC15\uC0AC\uB97C \uC704\uD55C '\uD3EC\uB80C\uC2DD \uAD50\uC548'\uC744 \uC0DD\uC131\uD55C\uB2E4.

## [\uC911\uC694 \uC9C0\uCE68]
1. \uBAA8\uB4E0 \uD574\uC124\uC740 \uD55C\uAD6D\uC5B4 \uD3C9\uC11C\uBB38(~\uD55C\uB2E4)\uC73C\uB85C \uC791\uC131\uD558\uBA70, \uC804\uBB38\uC801\uC778 \uAD50\uC721 \uC6A9\uC5B4\uB97C \uC0AC\uC6A9\uD55C\uB2E4.
2. \uC9C0\uBB38\uC758 \uB17C\uB9AC\uC801 \uAD6C\uC870\uB97C \uD574\uBD80\uD558\uACE0, \uCD9C\uC81C\uC790\uC758 \uC758\uB3C4\uB97C \uAFF0\uB6AB\uB294 \uBD84\uC11D\uC744 \uC81C\uACF5\uD55C\uB2E4.
3. \uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C '\uC6D0\uBB38'\uC774 \uAC00\uACF5\uB418\uC9C0 \uC54A\uC740 \uAE30\uCD9C\uBB38\uC81C(\uC9C0\uBB38+\uBB38\uD56D+\uC120\uC9C0)\uC778 \uACBD\uC6B0, \uC774\uB97C \uC815\uD655\uD788 \uD30C\uC2F1\uD558\uC5EC \uAD6C\uC870\uD654\uD55C\uB2E4.
4. \uBD84\uC11D \uACB0\uACFC\uC640 \uD568\uAED8, \uC6D0\uBCF8 \uB178\uD2B8\uB97C \uBD84\uB958\uD558\uAE30 \uC704\uD55C \uBA54\uD0C0\uB370\uC774\uD130(metadata)\uB3C4 \uD568\uAED8 \uCD94\uCD9C\uD55C\uB2E4.

## [\uBC18\uB4DC\uC2DC \uBC18\uD658\uD574\uC57C \uD560 JSON \uD615\uC2DD]

{
  "metadata": {
    "passage_id": "\uC9C0\uBB38\uC744 \uB300\uD45C\uD558\uB294 \uC601\uBB38 ID (\uC608: Boredom_Workshop)",
    "level": "H1/H2/H3/M1/M2/M3 \uC911 \uD310\uB2E8",
    "problem_type": "\uBB38\uD56D \uC720\uD615 (\uC608: \uC81C\uBAA9, \uC8FC\uC81C, \uBE48\uCE78\uCD94\uB860, \uBB38\uC7A5\uC0BD\uC785, \uAE00\uC758\uC21C\uC11C \uB4F1)",
    "topic": "\uC9C0\uBB38\uC758 \uD575\uC2EC \uC18C\uC7AC/\uC8FC\uC81C (\uD55C\uAD6D\uC5B4)",
    "correct_answer": "\uC815\uB2F5 \uBC88\uD638 (\uC22B\uC790\uB9CC)"
  },
  "masterMarkdown": "\uD1B5\uD569 \uBD84\uC11D \uAD50\uC548 \uB9C8\uD06C\uB2E4\uC6B4 \uC804\uBB38"
}

## [\uB9C8\uD06C\uB2E4\uC6B4 \uAD50\uC548 \uD45C\uC900 \uAD6C\uC870]

---
title: "\uC9C0\uBB38ID \uD3EC\uB80C\uC2DD \uAD50\uC548"
---

# \u{1F4D6} **\uC9C0\uBB38ID**
> **Mosaic Academy** \uC601\uC5B4\uACFC | **\uB808\uBCA8:** Level | **\uB300\uC0C1:** Grade


oindent\rule{4cm}{0.4pt}

# \u{1F4DD} **BLOCK A \u2014 \uD480\uAE30 \uC804 (\uBA3C\uC800 \uD480\uC5B4\uBCF4\uC138\uC694)**
### **[\uC9C0\uBB38]**
(\uD30C\uC2F1\uB41C \uC9C0\uBB38 \uC6D0\uBB38)
### **[\uBB38\uD56D]**
(\uD30C\uC2F1\uB41C \uC9C8\uBB38 \uB0B4\uC6A9)
### **[\uC120\uC9C0]**
(\uD30C\uC2F1\uB41C 1-5\uBC88 \uC120\uC9C0)


oindent\rule{4cm}{0.4pt}

# \u{1F52C} **BLOCK B \u2014 \uD3EC\uB80C\uC2DD \uD574\uBD80**
**\u{1F3AF} \uC815\uB2F5: \uC815\uB2F5\uBC88\uD638**

... (\uC774\uD6C4 01~07 \uC139\uC158 \uBC0F \uC2DC\uADF8\uB2C8\uCC98 \uBD84\uC11D \uC218\uD589) ...

## [\uC785\uB825 \uB370\uC774\uD130]
\uB300\uC0C1 \uD30C\uC77C: ${a.sourcePath}
\uC9C0\uBB38 ID: ${a.slug}
\uB808\uBCA8: ${a.level}
\uB300\uC0C1 \uD559\uB144: ${a.targetGrade}

\uC6D0\uBB38:
${a.sourceText}

\uBC18\uB4DC\uC2DC \uC704 JSON \uAD6C\uC870\uB97C \uB530\uB974\uB294 \uC751\uB2F5\uB9CC \uBC18\uD658\uD558\uB77C.
`}function R(a){try{return JSON.parse(a)}catch(s){let e=a.match(/\{[\s\S]*\}/);if(!e)throw new Error("Model response did not contain JSON.");return JSON.parse(e[0])}}async function k(a,s){var u,h,y;if(!a.apiKey.trim())throw new Error("API key is not configured.");let e=await fetch(a.endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a.apiKey}`},body:JSON.stringify({model:a.model,messages:[{role:"system",content:"Return only valid JSON. Do not wrap the response in Markdown fences."},{role:"user",content:$(s)}],temperature:.4,max_tokens:8192})});if(!e.ok)throw new Error(`LLM request failed: HTTP ${e.status}`);let o=await e.json(),r=(y=(h=(u=o==null?void 0:o.choices)==null?void 0:u[0])==null?void 0:h.message)==null?void 0:y.content;if(typeof r!="string")throw new Error("LLM response has no message content.");let c=R(r);if(typeof c.masterMarkdown!="string")throw new Error("LLM JSON must include masterMarkdown.");return{masterMarkdown:c.masterMarkdown,raw:o}}function b(a){return a.replace(/\.[^/.]+$/,"").trim().replace(/[^\w가-힣.-]+/g,"_").replace(/_+/g,"_").replace(/^_+|_+$/g,"")||"passage"}function L(a){return a instanceof Error?a.message:String(a)}var A=class extends m.Plugin{constructor(){super(...arguments);this.settings={...f}}async onload(){await this.loadSettings(),this.addSettingTab(new v(this.app,this)),this.addCommand({id:"generate-lecture-asset",name:"Generate Lecture Asset",editorCallback:async(e,o)=>{let r=e.getSelection(),c=o.file,u=r.trim()||e.getValue().trim();if(!c||!u){new m.Notice("Mosaic: \uBD84\uC11D\uD560 \uB178\uD2B8 \uB610\uB294 \uC120\uD0DD \uC601\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");return}try{await this.generateForSource(c,u)}catch(h){new m.Notice(`Mosaic: \uC0DD\uC131 \uC2E4\uD328 - ${L(h)}`)}}})}async loadSettings(){this.settings=Object.assign({},f,await this.loadData()),this.settings.apiKey=this.app.secretStorage.getSecret(M)||""}async saveSettings(){let{apiKey:e,...o}=this.settings;await this.saveData(o)}async saveApiKey(e){this.app.secretStorage.setSecret(M,e),this.settings.apiKey=e,await this.saveSettings(),new m.Notice("Mosaic: API key \uC800\uC7A5 \uC644\uB8CC")}async clearApiKey(){this.app.secretStorage.setSecret(M,""),this.settings.apiKey="",await this.saveSettings(),new m.Notice("Mosaic: API key \uC0AD\uC81C \uC644\uB8CC")}async ensureFolder(e){let o=e.split("/").filter(Boolean),r="";for(let c of o)r=r?`${r}/${c}`:c,this.app.vault.getAbstractFileByPath(r)||await this.app.vault.createFolder(r)}async upsertText(e,o){let r=this.app.vault.getAbstractFileByPath(e);r instanceof m.TFile?await this.app.vault.modify(r,o):await this.app.vault.create(e,o)}async generateForSource(e,o){let r=this.app.metadataCache.getFileCache(e),c=(r==null?void 0:r.frontmatter)||{},u=c.level||c.Level||this.settings.defaultLevel,h=c.target_grade||c.Target_Grade||this.settings.defaultTargetGrade,d=c.passage_id||b(e.basename),t=`${this.settings.outputRoot}/${d}`,i={slug:d,sourcePath:e.path,sourceText:o,level:u,targetGrade:h};new m.Notice(`Mosaic: ${d} \uC0DD\uC131 \uC2DC\uC791 (Level: ${u}, Grade: ${h})`),await this.ensureFolder(t),await this.upsertText(`${t}/source.md`,o.endsWith(`
`)?o:`${o}
`);try{let n=await k(this.settings,i);n.metadata&&await this.app.fileManager.processFrontMatter(e,g=>{var C,P,T,D,O;(C=n.metadata)!=null&&C.passage_id&&!g.passage_id&&(g.passage_id=n.metadata.passage_id),(P=n.metadata)!=null&&P.level&&(!g.level||g.level==="H1")&&(g.level=n.metadata.level),(T=n.metadata)!=null&&T.problem_type&&(g.problem_type=n.metadata.problem_type),(D=n.metadata)!=null&&D.topic&&(g.topic=n.metadata.topic),(O=n.metadata)!=null&&O.correct_answer&&(g.correct_answer=n.metadata.correct_answer)}),await this.upsertText(`${t}/[MOSAIC]_${d}.md`,n.masterMarkdown.trim()+`
`);let p=`---
type: mosaic-report
status: success
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${d}

- **Status**: \u2705 Success
- **Source**: [[${e.name}]]
- **Model**: \`${this.settings.model}\`
- **Generated At**: ${new Date().toLocaleString()}

> [!INFO]
> - **[MOSAIC]**: \uD559\uC0DD \uBC0F \uAC15\uC0AC\uC6A9 \uD1B5\uD569 \uAC15\uC758 \uC790\uC0B0\uC774 [[${t}/[MOSAIC]_${d}.md|\uC774\uACF3]]\uC5D0 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
`;await this.upsertText(`${t}/run-report.md`,p),new m.Notice(`Mosaic: ${d} \uC0DD\uC131 \uC644\uB8CC`)}catch(n){let p=`---
type: mosaic-report
status: failed
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${d}

- **Status**: \u274C Failed
- **Source**: [[${e.name}]]
- **Model**: \`${this.settings.model}\`
- **Failed At**: ${new Date().toLocaleString()}

## Error Message
\`\`\`
${L(n)}
\`\`\`
`;throw await this.upsertText(`${t}/run-report.md`,p),n}}};
