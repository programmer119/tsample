# 기존 테스트 프로젝트에 적용할 파일

## Apps Script

기존 Apps Script의 `Code.gs`를 다음 파일로 전체 교체합니다.

```text
apps_script/Code.gs
```

Cloud Run 배포 스크립트를 먼저 실행하면 URL이 자동 입력됩니다.

교체 후 실행 순서:

```text
configurePdfRenderer
-> testPdfRenderer
-> 필요 시 regenerateLatestPdf
```

`setupTestSystem`을 다시 실행하지 마세요. 기존 Form, Spreadsheet, PDF 폴더와 제출 트리거를 그대로 사용합니다.

## GitHub Pages

기존 GitHub 저장소의 프론트 파일을 `frontend` 폴더 내용으로 교체합니다. `frontend` 폴더 자체가 아니라 내부 파일을 저장소 루트에 올립니다.

## 달라진 PDF 방식

이전:

```text
Apps Script DocumentApp -> Google Docs -> 단순 PDF
```

현재:

```text
Apps Script -> Cloud Run Puppeteer/Chromium -> HTML/CSS 10페이지 PDF -> Drive
```
