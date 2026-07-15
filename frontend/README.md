# GitHub Pages 프론트

이 폴더 안의 파일과 폴더를 GitHub 저장소 루트에 올립니다.

현재 연결값:

- Google Form: `https://docs.google.com/forms/d/e/1FAIpQLSfOuP57jiBQ110twhNKKLbeJP9d_igdTmS76ptxkiB8Vu1h9w/viewform`
- Spreadsheet ID: `1dUfs1A1hTYRHZO2akYSh2AcFpcMHmP9miMIJNVhkkwA`
- 결과 시트: `처리결과`
- 조회 방식: 공개 Google Sheet gviz JSONP

동작 흐름:

1. Google Form 제출
2. Apps Script 채점
3. Cloud Run Puppeteer가 10페이지 PDF 자동 생성
4. PDF를 Google Drive에 저장
5. `처리결과` 시트에 PDF URL 기록
6. GitHub Pages에서 `PDF 열기` 제공

`sample_reports`에는 Puppeteer/Chromium으로 실제 생성한 10페이지 샘플 PDF 3개가 들어 있습니다.
