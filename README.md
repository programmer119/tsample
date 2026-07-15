# 유아동 기질검사 - Google Form + Serverless Puppeteer PDF

이 버전은 Google Form 제출 후 Apps Script가 채점 데이터를 정리하고, Google Cloud Run의 Puppeteer/Chromium 렌더러가 10페이지 고품질 PDF를 자동 생성해 Google Drive에 저장합니다.

## 구조

```text
Google Form 제출
  -> Apps Script 제출 트리거
  -> 검증 / 역채점 / 규준 환산 / 유형 판별
  -> Cloud Run Puppeteer 렌더러 호출
  -> HTML/CSS 10페이지 PDF 생성
  -> Google Drive 저장
  -> 공개 처리결과 시트와 GitHub Pages에서 조회
```

Cloud Run은 요청이 있을 때만 자동 실행되므로 사용자가 별도 Node 백엔드 프로세스를 계속 켜둘 필요가 없습니다.

## 현재 설정 유지 항목

기존에 생성된 아래 자료는 새로 만들지 않고 그대로 사용합니다.

- Google Form
- 응답 Spreadsheet
- `처리결과` 시트
- PDF 저장 폴더
- 설치형 Form 제출 트리거
- GitHub Pages용 공개 시트 설정

## 적용 순서

### 1. Cloud Run PDF 렌더러 배포

Windows에서 프로젝트 최상단의 다음 파일을 실행합니다.

```text
DEPLOY_CLOUD_RUN.bat
```

Google Cloud CLI 로그인과 결제가 연결된 프로젝트가 필요합니다. 스크립트가 다음 작업을 자동으로 수행합니다.

- Cloud Run / Cloud Build / Artifact Registry API 활성화
- `pdf_renderer` 소스 빌드 및 배포
- 공개 호출 허용
- 렌더러 키 환경변수 설정
- `/health` 상태 확인
- 실제 Cloud Run URL을 `apps_script/Code.gs`에 자동 입력

배포 후 `DEPLOY_RESULT.txt`가 생성됩니다.

### 2. Apps Script 코드 교체

1. `apps_script/Code.gs` 전체 복사
2. 기존 Apps Script 편집기의 `Code.gs` 전체를 덮어쓰기
3. 저장
4. 함수 목록에서 `configurePdfRenderer` 실행
5. `testPdfRenderer` 실행
6. 이때 요청되는 외부 HTTP 접근 권한 허용

정상이면 기존 PDF 폴더에 Puppeteer로 만든 10페이지 샘플 PDF가 저장됩니다.

기존 제출 결과를 새 방식으로 다시 만들려면:

```text
regenerateLatestPdf
```

를 실행합니다.

> Apps Script 웹 앱 `/exec` 재배포는 필요하지 않습니다. Form 제출 트리거는 저장된 최신 스크립트를 실행합니다.

### 3. GitHub Pages 업데이트

`frontend` 폴더 안의 파일과 폴더를 GitHub 저장소 루트에 올립니다.

```text
index.html
app.js
config.js
styles.css
report.html
report.js
report.css
assets/
sample_reports/
```

기존 `config.js`에는 현재 테스트용 Spreadsheet ID와 Google Form URL이 이미 들어 있습니다.

## 자동 PDF 확인

Google Form을 새로 제출하면:

1. Apps Script 실행
2. Cloud Run Puppeteer 호출
3. PDF 폴더에 10페이지 PDF 생성
4. `처리결과` 시트의 `pdf_url`, `pdf_file_id` 기록
5. GitHub Pages 목록에 `PDF 열기` 표시

## 테스트된 결과

- Puppeteer/Chromium 렌더링 성공
- A4 10페이지 생성 확인
- SVG 방사형 차트 및 막대 차트 포함
- 8가지 동물 유형용 SVG 일러스트 포함
- 한국어 글꼴 렌더링 확인
- 샘플 PDF: `sample_output/sample_puppeteer.pdf`

## 운영 전 교체해야 하는 더미 데이터

현재 아래 데이터는 테스트용입니다.

- 실제 검사 문항
- 문항별 가중치
- 역채점 문항
- 연령 및 성별 규준표
- T점수 및 백분위 환산표
- 8개 유형 판별 조건
- 유형별 해석문과 양육 안내문

실제 클라이언트 원자료를 받은 뒤 교체해야 합니다.


## 동물 일러스트 에셋

결과지의 8개 동물 이미지는 Microsoft 공식 Fluent Emoji 3D PNG 원본을 로컬에 포함해 사용합니다. 출처와 파일 무결성은 `ASSET_SOURCES.md`, 라이선스 전문은 `licenses/Microsoft-Fluent-Emoji-MIT.txt`를 확인하세요.
