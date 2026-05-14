# Mosaic Eng Lecture Obsidian

Mosaic 커리큘럼 파이프라인의 Obsidian 네이티브 패키징 트랙입니다.

이 프로젝트는 의도적으로 `projects/eng-lecture`보다 작은 규모로 시작되었습니다. 대시보드, Antigravity 위임, Pandoc PDF 렌더링, Node 자식 프로세스 러너 기능은 기존 프로젝트에 유지됩니다. 본 플러그인 트랙은 다음 사항에 집중합니다:

- Obsidian 볼트 내의 활성 노트 또는 선택된 텍스트 읽기
- 사용자가 직접 API 키와 모델을 설정할 수 있는 환경 제공
- 볼트 내부에 학생용/교사용 마크다운 자산(assets) 생성
- 한국 학술적 톤과 포렌식 교수법 표준 유지

## MVP 범위

1. 노트에서 텍스트를 선택하거나, 지문 노트 내에 커서를 위치시킵니다.
2. `Mosaic: Generate MASTER/TEACHER` 명령을 실행합니다.
3. 플러그인이 설정된 LLM 제공자를 호출합니다.
4. 플러그인이 다음 파일들을 작성합니다:
   - `Mosaic/outputs/<slug>/source.md`
   - `Mosaic/outputs/<slug>/[MASTER]_<slug>.md`
   - `Mosaic/outputs/<slug>/[TEACHER]_<slug>.md`
   - `Mosaic/outputs/<slug>/run-log.json`

## MVP 제외 항목

- Antigravity 오케스트레이션
- Pandoc/PDF 생성
- 로컬 Node `core/run.js`
- 배치(Batch) 모드
- 볼트 외부 파일 시스템 쓰기

이러한 기능들은 볼트 네이티브 워크플로우가 검증된 이후에 추가될 수 있습니다.

## 보안 관련 참고 사항

API 키는 Obsidian의 `app.secretStorage`를 통해 안전하게 저장됩니다.
`data.json`의 일반 플러그인 설정에는 엔드포인트, 모델, 출력 폴더 및 기본값과 같은 비보안 값만 저장됩니다.

## 빌드

```bash
npm install
npm run build
```

빌드 결과물:

- `main.js`
- `manifest.json`
- `versions.json`

로컬 테스트를 위해 이 폴더를 다음 경로로 복사하거나 심볼릭 링크를 생성하세요:

```text
<Vault>/.obsidian/plugins/mosaic-eng-lecture/
```

## BRAT 설치

BRAT은 플러그인 저장소 루트에 빌드된 런타임 파일이 포함되어 있기를 기대합니다. 이 저장소에는 다음 파일들이 커밋됩니다:

- `manifest.json`
- `main.js`
- `styles.css`

비공개 GitHub 저장소를 사용할 수 있게 된 후:

1. Obsidian BRAT 플러그인을 설치하고 활성화합니다.
2. BRAT 설정을 엽니다.
3. `Add Beta plugin`을 선택합니다.
4. GitHub 저장소 경로를 입력합니다 (예: `owner/mosaic-eng-lecture-obsidian`).
5. 커뮤니티 플러그인에서 `Mosaic Eng Lecture`를 활성화합니다.

비공개 저장소의 경우, 사용자 머신에 BRAT/GitHub 접근 권한이 설정되어 있어야 합니다. BRAT이 비공개 저장소를 읽을 수 없는 경우, 테스트용으로 임시 공개 저장소를 사용하거나 개발 중에는 로컬 심볼릭 링크를 통해 설치하십시오.
