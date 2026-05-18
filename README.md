# Mosaic Eng Lecture Obsidian

Mosaic 커리큘럼 파이프라인의 Obsidian 네이티브 패키징 트랙입니다.
지문 노트를 분석하여 고품질의 한국어 영어 강의 자산(MOSAIC)을 단 한 번의 클릭으로 생성합니다.

## 📥 설치 방법

### BRAT을 통한 설치 (추천)
1. Obsidian 설정에서 **BRAT** 플러그인을 설치하고 활성화합니다.
2. BRAT 설정에서 **Add Beta plugin**을 클릭합니다.
3. 다음 GitHub 저장소 주소를 입력합니다: `https://github.com/mitmirsein/mosaic-eng-lecture-obsidian`
4. **Add Plugin**을 클릭하면 즉시 설치됩니다.

### 수동 설치
1. [Releases](https://github.com/mitmirsein/mosaic-eng-lecture-obsidian/releases)에서 `main.js`, `manifest.json`, `styles.css`를 다운로드합니다.
2. 볼트의 `.obsidian/plugins/mosaic-eng-lecture/` 폴더에 넣습니다.
3. 플러그인을 활성화합니다.

## ✨ 주요 기능
- **스마트 파싱(Smart Ingest)**: 지문을 복붙만 하면 AI가 유형, 주제, 레벨을 파악하고 YAML을 자동 업데이트합니다.
- **포렌식 통합 교안 생성**: 8인의 전문 AI 페르소나가 분석한 고품질 강의 자산(MOSAIC)을 생성합니다.
- **초보 자습 지원 (v0.4.0)**: 기초 레벨 학생이 스스로 학습할 수 있도록 교안을 구체화했습니다.
  - **전체 해석 분리**: 직독직해와 별개로, 끊어읽기 없는 자연스러운 한국어 통독 번역을 따로 제공합니다.
  - **구조 라벨 본문**: 각 문장 앞에 `[주제문]`·`[근거]`·`[예시]` 배지가 붙어 글의 논리 뼈대가 한눈에 보입니다.
  - **구문 정밀 해부**: 핵심 문법을 개념·상세 정의·예문 표(원문+응용)로 구조화합니다.
  - **어휘 + 셀프 테스트**: 핵심 어휘 10개 이상과 간단 단어 테스트(정답 펼치기)를 제공합니다.
  - **내용 확인 Q&A**: 이해도를 스스로 점검하는 질문과 근거 문장을 제공합니다.
- **직관적인 UI**: 사이드바 아이콘 및 마우스 우클릭 메뉴를 통해 즉시 실행할 수 있습니다.
- **멀티 모델 지원**: OpenAI, Gemini 등 최신 LLM을 지원합니다.
- **보안**: API 키는 Obsidian의 `app.secretStorage`를 통해 안전하게 저장됩니다.

## 🚀 사용 방법
1. **지문 준비**: 새 노트를 만들고 분석할 영어 지문(문항, 선지 포함)을 복사해서 붙여넣습니다.
2. **분석 실행**:
   - 사이드바의 **Mosaic 아이콘**(책 모양)을 클릭하거나,
   - 에디터에서 **마우스 우클릭** 후 `Generate Mosaic Lecture Asset`을 선택합니다.
3. **결과 확인**: 설정된 출력 폴더(기본: `Mosaic/outputs`)에 분석 리포트와 교안이 생성됩니다. 원본 노트의 YAML도 자동으로 채워집니다.

## ⚙️ 출력 토큰 설정 (Max output tokens)
v0.4.0부터 교안 분량이 늘어, 설정에 **Max output tokens**(기본 32768)를 노출합니다. 교안 말미가 잘리거나 분석 품질이 떨어지면 이 값을 상향하세요. 개발자 콘솔의 `Mosaic [Dense]: 토큰 usage` 로그로 실제 사용량을 확인할 수 있으며, 출력이 상한에 도달하면 ⚠️ 절단 경고가 표시됩니다.

## PDF 자동 생성
PDF 자동 생성은 선택 기능입니다. 사용하려면 Pandoc CLI와 XeLaTeX(MacTeX 또는 BasicTeX)를 별도로 설치해야 합니다. PDF 기본 글꼴은 플러그인에 내장된 Pretendard이며, Obsidian Pandoc 플러그인만으로는 충분하지 않습니다.

---

### 라이선스
Mosaic Curriculum Pipeline
