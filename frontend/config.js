window.TEMPERAMENT_CONFIG = Object.freeze({
  // setupTestSystem()이 만든 공개 테스트용 처리결과 스프레드시트
  spreadsheetId: "1dUfs1A1hTYRHZO2akYSh2AcFpcMHmP9miMIJNVhkkwA",

  // Apps Script가 처리 결과를 기록하는 시트 이름
  resultSheetName: "처리결과",

  // 학부모가 실제로 응답하는 Google Form 주소
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfOuP57jiBQ110twhNKKLbeJP9d_igdTmS76ptxkiB8Vu1h9w/viewform",

  // 10초마다 공개 Google Sheet의 최신 처리 결과 조회
  refreshMs: 10000,
});
