/* Mosaic Eng Lecture Obsidian */
var T=Object.defineProperty;var O=Object.getOwnPropertyDescriptor;var _=Object.getOwnPropertyNames;var x=Object.prototype.hasOwnProperty;var G=(i,s)=>{for(var t in s)T(i,t,{get:s[t],enumerable:!0})},R=(i,s,t,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let r of _(s))!x.call(i,r)&&r!==t&&T(i,r,{get:()=>s[r],enumerable:!(o=O(s,r))||o.enumerable});return i};var N=i=>R(T({},"__esModule",{value:!0}),i);var V={};G(V,{default:()=>I});module.exports=N(V);var p=require("obsidian");var d=require("obsidian"),w={provider:"openai",endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-5.5-pro",outputRoot:"Mosaic_Eng/Outputs",defaultLevel:"H1",defaultTargetGrade:"\uACE0\uB4F1"},M="mosaic-eng-lecture-api-key",f={openai:{name:"OpenAI",endpoint:"https://api.openai.com/v1/chat/completions",models:["gpt-5.5","gpt-5.4","gpt-5.4-mini"]},claude:{name:"Claude",endpoint:"https://api.anthropic.com/v1/messages",models:["claude-4-7-opus","claude-4-6-sonnet","claude-4-5-haiku"]},gemini:{name:"Gemini",endpoint:"https://generativelanguage.googleapis.com/v1/openai/chat/completions",models:["gemini-3.1-pro-preview","gemini-3.1-flash-lite","gemini-3-flash-preview"]}};function S(i,s,t){let o=i.createDiv({cls:"mosaic-settings-section"});o.createEl("h3",{text:s}),o.createEl("p",{text:t,cls:"mosaic-settings-description"})}var v=class extends d.PluginSettingTab{constructor(s,t){super(s,t),this.plugin=t}display(){var m;let{containerEl:s}=this;s.empty(),s.addClass("mosaic-settings");let t=s.createDiv({cls:"mosaic-settings-header"});t.createEl("h2",{text:"Mosaic Eng Lecture"}),t.createEl("p",{text:"\uD604\uC7AC \uB178\uD2B8\uB098 \uC120\uD0DD \uC601\uC5ED\uC744 \uD55C\uAD6D\uC5B4 \uD1B5\uD569 \uAC15\uC758 \uC790\uC0B0(MOSAIC)\uC73C\uB85C \uC0DD\uC131\uD55C\uB2E4.",cls:"mosaic-settings-description"});let o=this.plugin.settings.apiKey?"API key configured":"API key missing";t.createDiv({cls:this.plugin.settings.apiKey?"mosaic-status mosaic-status-ok":"mosaic-status mosaic-status-warn",text:o}).setAttr("aria-label",o),S(s,"Connection","API \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD558\uACE0 \uC778\uC99D \uC815\uBCF4\uB97C \uC785\uB825\uD55C\uB2E4. API key\uB294 Obsidian SecretStorage\uC5D0 \uC548\uC804\uD558\uAC8C \uC800\uC7A5\uB41C\uB2E4."),new d.Setting(s).setName("API Provider").setDesc("\uC0AC\uC6A9\uD560 LLM \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD55C\uB2E4.").addDropdown(e=>{Object.keys(f).forEach(a=>{e.addOption(a,f[a].name)}),e.setValue(this.plugin.settings.provider).onChange(async a=>{this.plugin.settings.provider=a;let n=f[a];n.endpoint&&(this.plugin.settings.endpoint=n.endpoint),n.models.length>0&&(this.plugin.settings.model=n.models[0]),await this.plugin.saveSettings(),this.display()})}),new d.Setting(s).setName("API Key").setDesc("\uC778\uC99D\uC744 \uC704\uD55C API Key\uB97C \uC785\uB825\uD55C\uB2E4. (\uBCF4\uC548\uC0C1 \uC800\uC7A5 \uD6C4\uC5D0\uB294 \uD45C\uC2DC\uB418\uC9C0 \uC54A\uC74C)").addText(e=>{e.inputEl.type="password",e.setPlaceholder(this.plugin.settings.apiKey?"API key configured":"Enter your key...").setValue("").onChange(async a=>{let n=a.trim();n&&await this.plugin.saveApiKey(n)})}).addButton(e=>{e.setButtonText("Clear").setTooltip("Stored API key \uC0AD\uC81C").onClick(async()=>{await this.plugin.clearApiKey(),this.display()})}),this.plugin.settings.provider==="custom"&&new d.Setting(s).setName("API Endpoint").setDesc("OpenAI \uD638\uD658 API \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uB97C \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(e=>{e.setPlaceholder("https://api.example.com/v1/chat/completions").setValue(this.plugin.settings.endpoint).onChange(async a=>{this.plugin.settings.endpoint=a.trim(),await this.plugin.saveSettings()})});let l=((m=f[this.plugin.settings.provider])==null?void 0:m.models)||[],g=new d.Setting(s).setName("Model Selection").setDesc("\uC0AC\uC6A9\uD560 LLM \uBAA8\uB378\uC744 \uC120\uD0DD\uD558\uAC70\uB098 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.");l.length>0&&g.addDropdown(e=>{l.forEach(a=>e.addOption(a,a)),e.setValue(this.plugin.settings.model).onChange(async a=>{this.plugin.settings.model=a,await this.plugin.saveSettings()})}),g.addText(e=>{e.setPlaceholder("Directly enter model name...").setValue(this.plugin.settings.model).onChange(async a=>{this.plugin.settings.model=a.trim(),await this.plugin.saveSettings()})}),S(s,"Output","\uC0DD\uC131 \uACB0\uACFC\uB294 Vault \uB0B4\uBD80\uC5D0\uB9CC \uAE30\uB85D\uD55C\uB2E4. \uC678\uBD80 \uD30C\uC77C \uC2DC\uC2A4\uD15C\uC774\uB098 \uAE30\uC874 eng-lecture output \uD3F4\uB354\uC5D0\uB294 \uC4F0\uC9C0 \uC54A\uB294\uB2E4."),new d.Setting(s).setName("Output folder").setDesc("Vault \uAE30\uC900 \uC0C1\uB300 \uACBD\uB85C. \uAC01 \uC9C0\uBB38\uC740 \uC774 \uD3F4\uB354 \uC544\uB798 <slug> \uD558\uC704 \uD3F4\uB354\uB85C \uC800\uC7A5\uB41C\uB2E4.").addText(e=>e.setPlaceholder(w.outputRoot).setValue(this.plugin.settings.outputRoot).onChange(async a=>{this.plugin.settings.outputRoot=a.trim()||w.outputRoot,await this.plugin.saveSettings()})),S(s,"Passage Defaults","\uAE30\uBCF8 \uD559\uB144\uACFC \uB808\uBCA8\uC744 \uC124\uC815\uD55C\uB2E4. \uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC2DC \uC0AC\uC6A9\uB41C\uB2E4."),new d.Setting(s).setName("Default level").setDesc("\uC608: M3, H1, H2. \uC120\uD0DD \uC601\uC5ED\uC5D0 \uBCC4\uB3C4 \uBA54\uD0C0\uB370\uC774\uD130\uAC00 \uC5C6\uC744 \uB54C \uC0AC\uC6A9\uD55C\uB2E4.").addDropdown(e=>{let a={m1:"M1 (\uC9111)",m2:"M2 (\uC9112)",m3:"M3 (\uC9113)",h1:"H1 (\uACE01)",h2:"H2 (\uACE02)",h3:"H3 (\uACE03)",custom:"\uAE30\uD0C0 (\uC9C1\uC811 \uC785\uB825)"};Object.entries(a).forEach(([u,h])=>e.addOption(u,h));let n=this.plugin.settings.defaultLevel.toLowerCase();a[n]?e.setValue(n):e.setValue("custom"),e.onChange(async u=>{u!=="custom"&&(this.plugin.settings.defaultLevel=u.toUpperCase(),await this.plugin.saveSettings()),this.display()})}),["m1","m2","m3","h1","h2","h3"].includes(this.plugin.settings.defaultLevel.toLowerCase())||new d.Setting(s).setName("Custom level").setDesc("\uC6D0\uD558\uB294 \uB808\uBCA8\uC744 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(e=>{e.setPlaceholder("\uC608: University").setValue(this.plugin.settings.defaultLevel).onChange(async a=>{this.plugin.settings.defaultLevel=a.trim(),await this.plugin.saveSettings()})}),new d.Setting(s).setName("Default target grade").setDesc("\uC608: \uC911\uB4F1, \uACE0\uB4F1. \uD574\uC124\uC758 \uB09C\uC774\uB3C4\uC640 \uC5B4\uC870\uB97C \uACB0\uC815\uD558\uB294 \uAE30\uBCF8\uAC12\uC774\uB2E4.").addDropdown(e=>{let a={\uC911\uB4F1:"\uC911\uB4F1",\uACE0\uB4F1:"\uACE0\uB4F1",custom:"\uAE30\uD0C0 (\uC9C1\uC811 \uC785\uB825)"};Object.entries(a).forEach(([u,h])=>e.addOption(u,h));let n=this.plugin.settings.defaultTargetGrade;a[n]?e.setValue(n):e.setValue("custom"),e.onChange(async u=>{u!=="custom"&&(this.plugin.settings.defaultTargetGrade=u,await this.plugin.saveSettings()),this.display()})}),["\uC911\uB4F1","\uACE0\uB4F1"].includes(this.plugin.settings.defaultTargetGrade)||new d.Setting(s).setName("Custom target grade").setDesc("\uC6D0\uD558\uB294 \uB300\uC0C1 \uD559\uB144\uC744 \uC9C1\uC811 \uC785\uB825\uD55C\uB2E4.").addText(e=>{e.setPlaceholder("\uC608: \uCD08\uB4F1, \uC131\uC778").setValue(this.plugin.settings.defaultTargetGrade).onChange(async a=>{this.plugin.settings.defaultTargetGrade=a.trim(),await this.plugin.saveSettings()})}),new d.Setting(s).setName("Save Settings").setDesc("\uBAA8\uB4E0 \uC124\uC815\uC740 \uC790\uB3D9\uC73C\uB85C \uC800\uC7A5\uB418\uC9C0\uB9CC, \uBA85\uC2DC\uC801\uC73C\uB85C \uC800\uC7A5\uD558\uACE0 \uC2F6\uC744 \uB54C \uC0AC\uC6A9\uD55C\uB2E4.").addButton(e=>{e.setButtonText("Save All Settings").setCta().onClick(async()=>{await this.plugin.saveSettings(),new d.Notice("Mosaic settings saved successfully!"),e.setButtonText("Saved!"),e.setDisabled(!0),setTimeout(()=>{e.setButtonText("Save All Settings"),e.setDisabled(!1)},2e3)})}),S(s,"Run Checklist","\uB178\uD2B8\uC5D0\uC11C \uC9C0\uBB38 \uC804\uBB38 \uB610\uB294 \uD544\uC694\uD55C \uC120\uD0DD \uC601\uC5ED\uC744 \uC7A1\uC740 \uB4A4 Command Palette\uC5D0\uC11C Mosaic: Generate Lecture Asset\uC744 \uC2E4\uD589\uD55C\uB2E4.");let y=s.createEl("ul",{cls:"mosaic-checklist"});["API key\uAC00 configured \uC0C1\uD0DC\uC778\uC9C0 \uD655\uC778\uD55C\uB2E4.","\uC9C0\uBB38, \uBC1C\uBB38, \uC120\uC9C0, \uC815\uB2F5\uC774 \uAC00\uB2A5\uD55C \uD55C \uD55C \uB178\uD2B8\uC5D0 \uD568\uAED8 \uB4E4\uC5B4 \uC788\uC5B4\uC57C \uD55C\uB2E4.","\uC0DD\uC131 \uACB0\uACFC\uB294 Output folder \uC544\uB798 source.md, [MOSAIC]_.md, run-report.md\uB85C \uC800\uC7A5\uB41C\uB2E4.","\uC2E4\uD328 \uC2DC run-report.md\uC5D0 \uC2E4\uD328 \uC6D0\uC778\uC744 \uB0A8\uAE34\uB2E4."].forEach(e=>y.createEl("li",{text:e}))}};function k(i){return`\uB108\uB294 Mosaic Curriculum Pipeline\uC758 \uC804\uBB38 \uC601\uC5B4 \uAC15\uC0AC AI \uAD70\uB2E8\uC774\uB2E4.
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
\uB300\uC0C1 \uD30C\uC77C: ${i.sourcePath}
\uC9C0\uBB38 ID: ${i.slug}
\uB808\uBCA8: ${i.level}
\uB300\uC0C1 \uD559\uB144: ${i.targetGrade}

\uC6D0\uBB38:
${i.sourceText}

\uBC18\uB4DC\uC2DC \uC704 JSON \uAD6C\uC870\uB97C \uB530\uB974\uB294 \uC751\uB2F5\uB9CC \uBC18\uD658\uD558\uB77C.
`}function b(i){try{return JSON.parse(i)}catch(s){let t=i.match(/\{[\s\S]*\}/);if(!t)throw new Error("Model response did not contain JSON.");return JSON.parse(t[0])}}async function L(i,s){var m,e,a,n,u;if(!i.apiKey.trim())throw new Error("API key is not configured.");let t=i.provider==="claude",o={"Content-Type":"application/json"};t?(o["x-api-key"]=i.apiKey,o["anthropic-version"]="2023-06-01"):o.Authorization=`Bearer ${i.apiKey}`;let r=t?{model:i.model,messages:[{role:"user",content:k(s)}],max_tokens:8192,system:"Return only valid JSON. Do not wrap the response in Markdown fences.",temperature:.4}:{model:i.model,messages:[{role:"system",content:"Return only valid JSON. Do not wrap the response in Markdown fences."},{role:"user",content:k(s)}],temperature:.4,max_tokens:8192},c=await fetch(i.endpoint,{method:"POST",headers:o,body:JSON.stringify(r)});if(!c.ok)throw new Error(`LLM request failed: HTTP ${c.status}`);let l=await c.json(),g;if(t?g=(e=(m=l==null?void 0:l.content)==null?void 0:m[0])==null?void 0:e.text:g=(u=(n=(a=l==null?void 0:l.choices)==null?void 0:a[0])==null?void 0:n.message)==null?void 0:u.content,typeof g!="string")throw new Error("LLM response has no message content.");let y=b(g);if(typeof y.masterMarkdown!="string")throw new Error("LLM JSON must include masterMarkdown.");return{masterMarkdown:y.masterMarkdown,raw:l}}function K(i){return i.replace(/\.[^/.]+$/,"").trim().replace(/[^\w가-힣.-]+/g,"_").replace(/_+/g,"_").replace(/^_+|_+$/g,"")||"passage"}function A(i){return i instanceof Error?i.message:String(i)}var I=class extends p.Plugin{constructor(){super(...arguments);this.settings={...w}}async onload(){await this.loadSettings(),(this.settings.outputRoot==="Mosaic/outputs"||this.settings.outputRoot==="Mosaic_Eng")&&(this.settings.outputRoot="Mosaic_Eng/Outputs",await this.saveSettings()),await this.ensureFolder(this.settings.outputRoot),this.addSettingTab(new v(this.app,this)),this.addRibbonIcon("book-open-check","Mosaic: Generate Lecture Asset",async()=>{let t=this.app.workspace.getActiveViewOfType(p.MarkdownView);if(!t||!t.file){new p.Notice("Mosaic: \uD65C\uC131\uD654\uB41C \uB178\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");return}let r=t.editor.getValue().trim();if(!r){new p.Notice("Mosaic: \uBD84\uC11D\uD560 \uB0B4\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");return}try{await this.generateForSource(t.file,r)}catch(c){new p.Notice(`Mosaic: \uC0DD\uC131 \uC2E4\uD328 - ${A(c)}`)}}),this.registerEvent(this.app.workspace.on("editor-menu",(t,o,r)=>{t.addItem(c=>{c.setTitle("Generate Mosaic Lecture Asset").setIcon("book-open-check").onClick(async()=>{let l=r.file,g=o.getSelection().trim()||o.getValue().trim();if(!l||!g){new p.Notice("Mosaic: \uBD84\uC11D\uD560 \uB0B4\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");return}try{await this.generateForSource(l,g)}catch(y){new p.Notice(`Mosaic: \uC0DD\uC131 \uC2E4\uD328 - ${A(y)}`)}})})})),this.addCommand({id:"generate-lecture-asset",name:"Generate Lecture Asset",editorCallback:async(t,o)=>{let r=t.getSelection(),c=o.file,l=r.trim()||t.getValue().trim();if(!c||!l){new p.Notice("Mosaic: \uBD84\uC11D\uD560 \uB178\uD2B8 \uB610\uB294 \uC120\uD0DD \uC601\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");return}try{await this.generateForSource(c,l)}catch(g){new p.Notice(`Mosaic: \uC0DD\uC131 \uC2E4\uD328 - ${A(g)}`)}}})}async loadSettings(){this.settings=Object.assign({},w,await this.loadData()),this.settings.apiKey=this.app.secretStorage.getSecret(M)||""}async saveSettings(){let{apiKey:t,...o}=this.settings;await this.saveData(o)}async saveApiKey(t){this.app.secretStorage.setSecret(M,t),this.settings.apiKey=t,await this.saveSettings(),new p.Notice("Mosaic: API key \uC800\uC7A5 \uC644\uB8CC")}async clearApiKey(){this.app.secretStorage.setSecret(M,""),this.settings.apiKey="",await this.saveSettings(),new p.Notice("Mosaic: API key \uC0AD\uC81C \uC644\uB8CC")}async ensureFolder(t){let o=t.split("/").filter(Boolean),r="";for(let c of o)r=r?`${r}/${c}`:c,this.app.vault.getAbstractFileByPath(r)||await this.app.vault.createFolder(r)}async upsertText(t,o){let r=this.app.vault.getAbstractFileByPath(t);r instanceof p.TFile?await this.app.vault.modify(r,o):await this.app.vault.create(t,o)}async generateForSource(t,o){let r=this.app.metadataCache.getFileCache(t),c=(r==null?void 0:r.frontmatter)||{},l=c.level||c.Level||this.settings.defaultLevel,g=c.target_grade||c.Target_Grade||this.settings.defaultTargetGrade,m=c.passage_id||K(t.basename),e=`${this.settings.outputRoot}/${m}`,a={slug:m,sourcePath:t.path,sourceText:o,level:l,targetGrade:g};new p.Notice(`Mosaic: ${m} \uC0DD\uC131 \uC2DC\uC791 (Level: ${l}, Grade: ${g})`),await this.ensureFolder(e),await this.upsertText(`${e}/source.md`,o.endsWith(`
`)?o:`${o}
`);try{let n=await L(this.settings,a);n.metadata&&await this.app.fileManager.processFrontMatter(t,h=>{var C,P,E,$,D;(C=n.metadata)!=null&&C.passage_id&&!h.passage_id&&(h.passage_id=n.metadata.passage_id),(P=n.metadata)!=null&&P.level&&(!h.level||h.level==="H1")&&(h.level=n.metadata.level),(E=n.metadata)!=null&&E.problem_type&&(h.problem_type=n.metadata.problem_type),($=n.metadata)!=null&&$.topic&&(h.topic=n.metadata.topic),(D=n.metadata)!=null&&D.correct_answer&&(h.correct_answer=n.metadata.correct_answer)}),await this.upsertText(`${e}/[MOSAIC]_${m}.md`,n.masterMarkdown.trim()+`
`);let u=`---
type: mosaic-report
status: success
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${m}

- **Status**: \u2705 Success
- **Source**: [[${t.name}]]
- **Model**: \`${this.settings.model}\`
- **Generated At**: ${new Date().toLocaleString()}

> [!INFO]
> - **[MOSAIC]**: \uD559\uC0DD \uBC0F \uAC15\uC0AC\uC6A9 \uD1B5\uD569 \uAC15\uC758 \uC790\uC0B0\uC774 [[${e}/[MOSAIC]_${m}.md|\uC774\uACF3]]\uC5D0 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
`;await this.upsertText(`${e}/run-report.md`,u),new p.Notice(`Mosaic: ${m} \uC0DD\uC131 \uC644\uB8CC`)}catch(n){let u=`---
type: mosaic-report
status: failed
model: ${this.settings.model}
date: ${new Date().toLocaleString()}
---
# Mosaic Run Report - ${m}

- **Status**: \u274C Failed
- **Source**: [[${t.name}]]
- **Model**: \`${this.settings.model}\`
- **Failed At**: ${new Date().toLocaleString()}

## Error Message
\`\`\`
${A(n)}
\`\`\`
`;throw await this.upsertText(`${e}/run-report.md`,u),n}}};
