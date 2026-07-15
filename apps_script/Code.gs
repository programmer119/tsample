/**
 * 유아동 기질검사 - Google Forms + Apps Script 테스트 통합
 *
 * 최초 실행 순서
 * 1) setupTestSystem() 실행 및 권한 승인
 * 2) 실행 로그에서 formUrl 확인 후 실제 폼 제출
 * 3) Cloud Run PDF 렌더러를 배포하고 PDF_RENDERER_SETUP.URL을 입력
 * 4) configurePdfRenderer()를 1회 실행
 * 5) enablePublicSheetReadForTest()를 1회 실행
 *
 * 주의: 문항/규준/유형 규칙은 테스트용 더미이며 실제 자료 수령 후 교체해야 합니다.
 */

const APP = Object.freeze({
  VERSION: '2026.07.15-122309-KST',
  FORM_TITLE: '유아동 기질검사 테스트',
  SPREADSHEET_TITLE: '유아동 기질검사 테스트 응답 및 처리결과',
  RESULT_SHEET: '처리결과',
  PDF_FOLDER: '유아동 기질검사 테스트 PDF',
  CHOICES: ['1 전혀 그렇지 않다', '2 그렇지 않은 편이다', '3 보통이다', '4 그런 편이다', '5 매우 그렇다'],
  FACTORS: [
    {id: 'activity', name: '활동성'},
    {id: 'adaptability', name: '적응성'},
    {id: 'sensitivity', name: '민감성'},
    {id: 'persistence', name: '지속성'},
    {id: 'sociability', name: '사회성'},
    {id: 'emotionality', name: '정서성'},
  ],
  REVERSE_ITEMS: [3, 5, 8, 11, 15, 17, 20, 23, 27, 29, 32, 35],
});

const TYPE_RULES = Object.freeze([
  {
    id: 'type_01', name: '활기찬 돌고래형', animal: '돌고래',
    conditions: {activity: 'high', sociability: 'high'},
    summary: '새로운 자극과 관계 속에서 에너지가 잘 살아나는 유형입니다.',
    strengths: ['시도와 참여가 빠릅니다.', '또래 상호작용에서 표현력이 좋습니다.'],
    careTips: ['활동 전후의 전환 시간을 예고해 주세요.', '충분히 움직인 뒤 차분한 과제로 연결해 주세요.'],
  },
  {
    id: 'type_02', name: '신중한 고슴도치형', animal: '고슴도치',
    conditions: {activity: 'low', sensitivity: 'high'},
    summary: '환경을 세밀하게 살피고 천천히 익숙해지는 유형입니다.',
    strengths: ['작은 변화와 감각 정보를 잘 포착합니다.', '낯선 상황에서 신중하게 판단합니다.'],
    careTips: ['새로운 장소와 사람을 미리 설명해 주세요.', '적응 속도를 비교하지 말고 충분한 시간을 주세요.'],
  },
  {
    id: 'type_03', name: '꾸준한 거북이형', animal: '거북이',
    conditions: {persistence: 'high', emotionality: 'mid'},
    summary: '관심 과제에 오래 머물며 반복과 연습을 통해 안정감을 얻는 유형입니다.',
    strengths: ['한 과제를 오래 지속할 수 있습니다.', '정해진 루틴에서 성취감이 큽니다.'],
    careTips: ['중단이 필요할 때는 남은 시간을 구체적으로 알려 주세요.', '완성 경험을 자주 확인해 주세요.'],
  },
  {
    id: 'type_04', name: '유연한 수달형', animal: '수달',
    conditions: {adaptability: 'high', emotionality: 'low'},
    summary: '변화에 비교적 편안하게 반응하며 상황에 맞춰 행동을 조절하는 유형입니다.',
    strengths: ['일정 변경이나 새 규칙에 적응이 빠릅니다.', '감정 반응이 안정적으로 나타납니다.'],
    careTips: ['스스로 선택할 수 있는 작은 역할을 주세요.', '잘 적응한 장면을 구체적으로 칭찬해 주세요.'],
  },
  {
    id: 'type_05', name: '감성 토끼형', animal: '토끼',
    conditions: {emotionality: 'high', sensitivity: 'high'},
    summary: '느낌과 반응이 선명하게 드러나며 정서적 공감이 중요한 유형입니다.',
    strengths: ['자기 감정을 풍부하게 표현합니다.', '타인의 분위기에도 민감하게 반응합니다.'],
    careTips: ['감정 이름을 붙여 주고 진정 시간을 확보해 주세요.', '반응을 억누르기보다 표현 방법을 안내해 주세요.'],
  },
  {
    id: 'type_06', name: '친화적인 강아지형', animal: '강아지',
    conditions: {sociability: 'high', adaptability: 'high'},
    summary: '사람과 함께할 때 동기가 높아지고 협력 상황에서 강점이 나타나는 유형입니다.',
    strengths: ['상호작용을 즐기고 협력 과제에 잘 참여합니다.', '낯선 사람과도 비교적 빨리 가까워집니다.'],
    careTips: ['또래 활동 뒤 혼자 정리하는 시간을 함께 연습하세요.', '사회적 단서와 경계를 부드럽게 알려 주세요.'],
  },
  {
    id: 'type_07', name: '독립적인 고양이형', animal: '고양이',
    conditions: {sociability: 'low', persistence: 'high'},
    summary: '혼자 탐색하고 생각할 때 집중력이 살아나는 유형입니다.',
    strengths: ['자기만의 방식으로 문제를 살펴봅니다.', '개별 활동에서 깊은 몰입을 보입니다.'],
    careTips: ['혼자 있는 시간을 부정적으로 해석하지 마세요.', '관계 활동은 짧고 예측 가능하게 시작하세요.'],
  },
  {
    id: 'type_08', name: '균형 잡힌 판다형', animal: '판다',
    conditions: {activity: 'mid', adaptability: 'mid', emotionality: 'mid'},
    summary: '대부분의 상황에서 평균적인 반응 범위를 보이며 환경에 따라 장점이 달라지는 유형입니다.',
    strengths: ['상황 변화에 큰 흔들림 없이 반응합니다.', '여러 활동에서 균형 있게 참여할 수 있습니다.'],
    careTips: ['특정 강점이 드러나는 상황을 꾸준히 관찰하세요.', '선택지를 주어 자기 선호를 표현하게 도와주세요.'],
  },
]);

/** 실제 Google Form, 응답 Spreadsheet, 결과 PDF 폴더, 제출 트리거를 한 번에 만듭니다. */
function setupTestSystem() {
  const props = PropertiesService.getScriptProperties();
  const existingFormId = props.getProperty('FORM_ID');
  if (existingFormId) {
    throw new Error('이미 설정되어 있습니다. getSetupInfo()로 기존 주소를 확인하세요. 새로 만들려면 resetSetupProperties()를 먼저 실행하세요.');
  }

  const form = FormApp.create(APP.FORM_TITLE, true);
  form
    .setDescription('테스트용 유아동 기질검사입니다. 실제 문항·규준표·해석문은 클라이언트 자료 수령 후 교체됩니다.')
    .setConfirmationMessage('응답이 제출되었습니다. 자동 채점 및 결과지 생성이 진행됩니다.')
    .setProgressBar(true)
    .setShuffleQuestions(false);

  addFormItems_(form);

  const spreadsheet = SpreadsheetApp.create(APP.SPREADSHEET_TITLE);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  const resultSheet = spreadsheet.insertSheet(APP.RESULT_SHEET);
  initializeResultSheet_(resultSheet);

  const pdfFolder = DriveApp.createFolder(APP.PDF_FOLDER);

  deleteSubmitTriggers_();
  ScriptApp.newTrigger('handleFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  const setup = {
    version: APP.VERSION,
    formId: form.getId(),
    formUrl: form.getPublishedUrl(),
    formEditUrl: form.getEditUrl(),
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    resultSheetName: APP.RESULT_SHEET,
    pdfFolderId: pdfFolder.getId(),
    pdfFolderUrl: pdfFolder.getUrl(),
  };

  props.setProperties({
    FORM_ID: setup.formId,
    FORM_URL: setup.formUrl,
    FORM_EDIT_URL: setup.formEditUrl,
    SPREADSHEET_ID: setup.spreadsheetId,
    PDF_FOLDER_ID: setup.pdfFolderId,
    VERSION: APP.VERSION,
  }, true);

  console.log(JSON.stringify(setup, null, 2));
  return setup;
}

/** 설정된 URL과 ID를 다시 확인합니다. */
function getSetupInfo() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const result = {
    version: props.VERSION || APP.VERSION,
    formId: props.FORM_ID || '',
    formUrl: props.FORM_URL || '',
    formEditUrl: props.FORM_EDIT_URL || '',
    spreadsheetId: props.SPREADSHEET_ID || '',
    spreadsheetUrl: props.SPREADSHEET_ID ? `https://docs.google.com/spreadsheets/d/${props.SPREADSHEET_ID}/edit` : '',
    pdfFolderId: props.PDF_FOLDER_ID || '',
    pdfFolderUrl: props.PDF_FOLDER_ID ? `https://drive.google.com/drive/folders/${props.PDF_FOLDER_ID}` : '',
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * 새 시스템을 다시 만들 때만 실행합니다.
 * 기존 Form/Sheet/PDF 파일은 지우지 않고 Script Properties와 제출 트리거만 초기화합니다.
 */
function resetSetupProperties() {
  deleteSubmitTriggers_();
  PropertiesService.getScriptProperties().deleteAllProperties();
  console.log('설정 속성과 제출 트리거를 초기화했습니다. 기존 Google 파일은 보존됩니다.');
}

/** Google Form 제출 즉시 실행되는 설치형 트리거 핸들러입니다. */
function handleFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!e || !e.response) {
      throw new Error('Form submit 이벤트 객체가 없습니다. 편집기에서 직접 실행하지 말고 실제 폼을 제출하세요.');
    }

    const response = parseFormResponse_(e.response);
    const validation = validateResponse_(response);
    let score = null;
    let pdf = null;
    let status = '검증 실패';
    let errorMessage = validation.join(' | ');

    if (!validation.length) {
      try {
        score = scoreResponse_(response);
        pdf = generateResultPdf_(response, score);
        status = 'PDF 완료';
        errorMessage = '';
      } catch (error) {
        status = '처리 실패';
        errorMessage = error && error.stack ? error.stack : String(error);
      }
    }

    appendResult_(response, score, pdf, status, errorMessage);
  } finally {
    lock.releaseLock();
  }
}

/** GitHub Pages 프론트가 읽는 공개 읽기 전용 JSON/JSONP 엔드포인트입니다. */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const token = params.token || '';
  const expected = PropertiesService.getScriptProperties().getProperty('PUBLIC_TOKEN') || 'temperament-test-public';

  let payload;
  if (token !== expected) {
    payload = {ok: false, error: 'invalid_token', message: '공개 토큰이 일치하지 않습니다.'};
  } else {
    try {
      payload = buildDashboardPayload_();
    } catch (error) {
      payload = {ok: false, error: 'server_error', message: String(error)};
    }
  }

  const prefix = String(params.prefix || '').trim();
  if (prefix) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(prefix)) {
      return ContentService.createTextOutput('invalid callback').setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService
      .createTextOutput(`${prefix}(${JSON.stringify(payload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function addFormItems_(form) {
  form.addSectionHeaderItem().setTitle('기본 정보');

  form.addTextItem()
    .setTitle('검사자 고유 코드')
    .setHelpText('테스트 예: TEST-001')
    .setRequired(true);

  form.addTextItem().setTitle('아동 이름').setRequired(true);

  const yearValidation = FormApp.createTextValidation()
    .requireNumberBetween(2015, 2026)
    .setHelpText('2015~2026 사이의 연도를 숫자로 입력하세요.')
    .build();
  form.addTextItem().setTitle('출생연도').setValidation(yearValidation).setRequired(true);

  const monthValidation = FormApp.createTextValidation()
    .requireNumberBetween(1, 12)
    .setHelpText('1~12 사이의 월을 숫자로 입력하세요.')
    .build();
  form.addTextItem().setTitle('출생월').setValidation(monthValidation).setRequired(true);

  const gender = form.addMultipleChoiceItem().setTitle('성별').setRequired(true);
  gender.setChoices([gender.createChoice('여아'), gender.createChoice('남아')]);

  form.addTextItem().setTitle('보호자 이름').setRequired(false);

  form.addSectionHeaderItem()
    .setTitle('기질검사 문항')
    .setHelpText('최근 아동의 모습을 떠올리며 1~5점으로 응답해 주세요. 현재 문항 문구는 테스트용입니다.');

  for (let index = 1; index <= 36; index += 1) {
    const factor = APP.FACTORS[Math.floor((index - 1) / 6)];
    form.addScaleItem()
      .setTitle(`Q${String(index).padStart(2, '0')}. ${factor.name} 관련 테스트 문항 ${index}`)
      .setBounds(1, 5)
      .setLabels('전혀 그렇지 않다', '매우 그렇다')
      .setRequired(true);
  }
}

function initializeResultSheet_(sheet) {
  const headers = [
    'submitted_at', 'response_id', 'examiner_code', 'child_name', 'child_name_masked',
    'birth_year', 'birth_month', 'gender', 'age_group', 'type_id', 'type_name',
    'status', 'pdf_url', 'pdf_file_id', 'error_message', 'score_json'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#eef3f5');
  sheet.autoResizeColumns(1, headers.length);
}

function parseFormResponse_(formResponse) {
  const data = {
    submitted_at: formResponse.getTimestamp().toISOString(),
    response_id: makeResponseId_(formResponse.getTimestamp()),
    examiner_code: '',
    child_name: '',
    birth_year: '',
    birth_month: '',
    gender: '',
    guardian_name: '',
  };

  formResponse.getItemResponses().forEach((itemResponse) => {
    const title = itemResponse.getItem().getTitle();
    const value = itemResponse.getResponse();

    if (title === '검사자 고유 코드') data.examiner_code = String(value).trim();
    else if (title === '아동 이름') data.child_name = String(value).trim();
    else if (title === '출생연도') data.birth_year = Number(value);
    else if (title === '출생월') data.birth_month = Number(value);
    else if (title === '성별') data.gender = String(value) === '남아' ? 'M' : 'F';
    else if (title === '보호자 이름') data.guardian_name = String(value).trim();
    else {
      const match = /^Q(\d{2})\./.exec(title);
      if (match) data[`q${Number(match[1])}`] = Number(value);
    }
  });

  return data;
}

function validateResponse_(response) {
  const errors = [];
  ['examiner_code', 'child_name', 'birth_year', 'birth_month', 'gender'].forEach((field) => {
    if (response[field] === '' || response[field] === null || response[field] === undefined) {
      errors.push(`필수값 누락: ${field}`);
    }
  });

  if (!Number.isInteger(Number(response.birth_year))) errors.push('출생연도 숫자 오류');
  if (!Number.isInteger(Number(response.birth_month)) || response.birth_month < 1 || response.birth_month > 12) {
    errors.push('출생월 범위 오류');
  }
  if (!['M', 'F'].includes(response.gender)) errors.push('성별 코드 오류');

  for (let index = 1; index <= 36; index += 1) {
    const value = Number(response[`q${index}`]);
    if (!Number.isFinite(value) || value < 1 || value > 5) errors.push(`Q${index} 응답 오류`);
  }
  return errors;
}

function scoreResponse_(response) {
  const rawByFactor = {};
  APP.FACTORS.forEach((factor) => { rawByFactor[factor.id] = 0; });

  for (let index = 1; index <= 36; index += 1) {
    const factor = APP.FACTORS[Math.floor((index - 1) / 6)];
    let value = Number(response[`q${index}`]);
    if (APP.REVERSE_ITEMS.includes(index)) value = 6 - value;
    rawByFactor[factor.id] += value;
  }

  const ageYears = calculateAge_(response.birth_year, response.birth_month, new Date(response.submitted_at));
  const ageGroup = ageYears <= 4 ? '3-4' : ageYears <= 6 ? '5-6' : '7-8';
  const factors = APP.FACTORS.map((factor) => {
    const raw = rawByFactor[factor.id];
    const norm = convertNorm_(ageGroup, raw);
    return {
      id: factor.id,
      name: factor.name,
      raw,
      t_score: norm.tScore,
      percentile: norm.percentile,
      level: level_(norm.tScore),
    };
  });

  const tScores = {};
  factors.forEach((factor) => { tScores[factor.id] = factor.t_score; });
  const type = classifyType_(tScores);

  return {
    age_years: ageYears,
    age_group: ageGroup,
    factors,
    raw_by_factor: rawByFactor,
    t_scores: tScores,
    type,
  };
}

function calculateAge_(birthYear, birthMonth, referenceDate) {
  let age = referenceDate.getFullYear() - Number(birthYear);
  if ((referenceDate.getMonth() + 1) < Number(birthMonth)) age -= 1;
  return Math.max(1, age);
}

function convertNorm_(ageGroup, raw) {
  const ranges = [
    {min: 6, max: 11, index: 0},
    {min: 12, max: 16, index: 1},
    {min: 17, max: 21, index: 2},
    {min: 22, max: 26, index: 3},
    {min: 27, max: 30, index: 4},
  ];
  const tables = {
    '3-4': {t: [38, 45, 50, 57, 64], p: [12, 32, 50, 76, 91]},
    '5-6': {t: [37, 44, 50, 56, 63], p: [10, 30, 50, 74, 90]},
    '7-8': {t: [36, 44, 50, 56, 62], p: [8, 29, 50, 73, 88]},
  };
  const range = ranges.find((candidate) => raw >= candidate.min && raw <= candidate.max) || ranges[2];
  const table = tables[ageGroup] || tables['5-6'];
  return {tScore: table.t[range.index], percentile: table.p[range.index]};
}

function level_(tScore) {
  if (tScore < 45) return 'low';
  if (tScore > 55) return 'high';
  return 'mid';
}

function classifyType_(tScores) {
  const ranked = TYPE_RULES.map((rule, index) => {
    const keys = Object.keys(rule.conditions);
    const matched = keys.filter((factorId) => level_(tScores[factorId] || 50) === rule.conditions[factorId]).length;
    return {rule, index, matched, confidence: matched / Math.max(1, keys.length)};
  });
  ranked.sort((a, b) => b.matched - a.matched || a.index - b.index);
  const best = ranked[0];
  return Object.assign({}, best.rule, {
    matched_conditions: best.matched,
    confidence: Math.round(best.confidence * 100) / 100,
  });
}

/**
 * Cloud Run 배포 후 URL만 입력하고 configurePdfRenderer()를 한 번 실행하세요.
 * KEY는 DEPLOY_CLOUD_RUN.ps1의 기본값과 동일합니다.
 */
const PDF_RENDERER_SETUP = Object.freeze({
  URL: 'PASTE_CLOUD_RUN_URL_HERE',
  KEY: 'temperament-test-renderer',
});

/** Cloud Run Puppeteer 렌더러 주소와 키를 Script Properties에 저장합니다. */
function configurePdfRenderer() {
  const url = String(PDF_RENDERER_SETUP.URL || '').trim().replace(/\/$/, '');
  const key = String(PDF_RENDERER_SETUP.KEY || '').trim();
  if (!/^https:\/\/.+/.test(url) || url.includes('PASTE_CLOUD_RUN_URL_HERE')) {
    throw new Error('Code.gs 상단 PDF_RENDERER_SETUP.URL에 Cloud Run URL을 입력하세요.');
  }
  if (!key) throw new Error('PDF_RENDERER_SETUP.KEY가 비어 있습니다.');
  PropertiesService.getScriptProperties().setProperties({
    PDF_RENDERER_URL: url,
    PDF_RENDERER_KEY: key,
  }, false);
  const result = {rendererUrl: url, rendererKeyConfigured: true};
  console.log(JSON.stringify(result, null, 2));
  return result;
}

/** 현재 저장된 렌더러 설정을 확인합니다. 키 값 자체는 노출하지 않습니다. */
function getPdfRendererConfig() {
  const props = PropertiesService.getScriptProperties();
  const result = {
    rendererUrl: props.getProperty('PDF_RENDERER_URL') || '',
    rendererKeyConfigured: Boolean(props.getProperty('PDF_RENDERER_KEY')),
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Puppeteer/Chromium 렌더러에 채점 데이터를 보내 고품질 PDF를 생성하고
 * setupTestSystem()이 만든 Google Drive 폴더에 저장합니다.
 */
function generateResultPdf_(response, score) {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty('PDF_FOLDER_ID');
  if (!folderId) throw new Error('PDF_FOLDER_ID가 없습니다. setupTestSystem()을 먼저 실행하세요.');

  const rendererUrl = String(props.getProperty('PDF_RENDERER_URL') || '').replace(/\/$/, '');
  const rendererKey = String(props.getProperty('PDF_RENDERER_KEY') || '');
  if (!rendererUrl || !rendererKey) {
    throw new Error('PDF 렌더러가 설정되지 않았습니다. URL 입력 후 configurePdfRenderer()를 실행하세요.');
  }

  const rendererResponse = UrlFetchApp.fetch(`${rendererUrl}/render`, {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: {'X-Render-Key': rendererKey},
    payload: JSON.stringify({
      response: buildRendererResponse_(response, score),
      score,
      warnings: [],
    }),
    followRedirects: true,
    muteHttpExceptions: true,
  });

  const statusCode = rendererResponse.getResponseCode();
  const contentType = String(rendererResponse.getHeaders()['Content-Type'] || rendererResponse.getHeaders()['content-type'] || '');
  if (statusCode !== 200 || !contentType.toLowerCase().includes('application/pdf')) {
    const errorText = rendererResponse.getContentText().slice(0, 2000);
    throw new Error(`Puppeteer PDF 생성 실패 (${statusCode}): ${errorText}`);
  }

  const bytes = rendererResponse.getContent();
  if (bytes.length < 5 || bytes[0] !== 37 || bytes[1] !== 80 || bytes[2] !== 68 || bytes[3] !== 70) {
    throw new Error('렌더러 응답이 정상 PDF 형식이 아닙니다.');
  }

  const fileBase = `${response.examiner_code}_${response.response_id}`.replace(/[^0-9A-Za-z가-힣_-]/g, '_');
  const pdfBlob = rendererResponse.getBlob().setName(`${fileBase}.pdf`);
  const pdfFile = DriveApp.getFolderById(folderId).createFile(pdfBlob);
  try {
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    console.warn(`PDF 공개 링크 설정 실패: ${error}`);
  }

  return {
    id: pdfFile.getId(),
    url: `https://drive.google.com/file/d/${pdfFile.getId()}/view`,
    name: pdfFile.getName(),
  };
}

function buildRendererResponse_(response, score) {
  return {
    submitted_at: response.submitted_at,
    response_id: response.response_id,
    examiner_code: response.examiner_code,
    child_name: response.child_name,
    child_name_masked: maskName_(response.child_name),
    birth_year: response.birth_year,
    birth_month: response.birth_month,
    gender: response.gender,
    age_group: score ? score.age_group : '',
    type_id: score && score.type ? score.type.id : '',
    type_name: score && score.type ? score.type.name : '',
  };
}

/** 배포 직후 렌더러와 Drive 저장까지 한 번에 확인하는 샘플 테스트입니다. */
function testPdfRenderer() {
  const response = {
    submitted_at: new Date().toISOString(),
    response_id: `R-RENDER-TEST-${Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd-HHmmss')}`,
    examiner_code: 'TEST-RENDERER',
    child_name: '김하늘',
    birth_year: 2021,
    birth_month: 5,
    gender: 'F',
  };
  const score = {
    age_years: 5,
    age_group: '5-6',
    factors: [
      {id:'activity',name:'활동성',raw:26,t_score:63,percentile:90,level:'high'},
      {id:'adaptability',name:'적응성',raw:25,t_score:56,percentile:74,level:'high'},
      {id:'sensitivity',name:'민감성',raw:18,t_score:50,percentile:50,level:'mid'},
      {id:'persistence',name:'지속성',raw:22,t_score:56,percentile:74,level:'high'},
      {id:'sociability',name:'사회성',raw:27,t_score:63,percentile:90,level:'high'},
      {id:'emotionality',name:'정서성',raw:14,t_score:44,percentile:30,level:'low'},
    ],
    type: {
      id:'type_01', name:'활기찬 돌고래형', animal:'돌고래',
      summary:'새로운 자극과 관계 속에서 에너지가 잘 살아나며, 사람과 함께 움직이고 표현할 때 강점이 돋보이는 유형입니다.',
      strengths:['새로운 활동에 빠르게 참여합니다.','또래 상호작용에서 표현력이 좋습니다.','활동적인 환경에서 긍정적인 에너지를 나눕니다.'],
      careTips:['활동 전후의 전환 시간을 미리 예고해 주세요.','충분히 움직인 뒤 차분한 과제로 연결해 주세요.','차례와 경계를 구체적인 말로 안내해 주세요.'],
      confidence:1,
    },
  };
  const result = generateResultPdf_(response, score);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

/** 기존 처리결과 시트의 마지막 응답을 새 Puppeteer PDF로 다시 생성합니다. */
function regenerateLatestPdf() {
  const sheet = getResultSheet_();
  if (sheet.getLastRow() < 2) throw new Error('처리결과 시트에 재생성할 응답이 없습니다.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowNumber = sheet.getLastRow();
  const row = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const record = {};
  headers.forEach((header, index) => { record[String(header)] = row[index]; });
  const score = JSON.parse(String(record.score_json || '{}'));
  if (!Array.isArray(score.factors) || score.factors.length !== 6) throw new Error('마지막 행의 score_json이 유효하지 않습니다.');
  const response = {
    submitted_at: toIsoString_(record.submitted_at),
    response_id: String(record.response_id || ''),
    examiner_code: String(record.examiner_code || ''),
    child_name: String(record.child_name || ''),
    birth_year: Number(record.birth_year),
    birth_month: Number(record.birth_month),
    gender: String(record.gender || ''),
  };
  const pdf = generateResultPdf_(response, score);
  const index = (name) => headers.indexOf(name) + 1;
  sheet.getRange(rowNumber, index('status')).setValue('PDF 완료');
  sheet.getRange(rowNumber, index('pdf_url')).setValue(pdf.url);
  sheet.getRange(rowNumber, index('pdf_file_id')).setValue(pdf.id);
  sheet.getRange(rowNumber, index('error_message')).setValue('');
  const result = {rowNumber, responseId: response.response_id, pdf};
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function appendResult_(response, score, pdf, status, errorMessage) {
  const sheet = getResultSheet_();
  sheet.appendRow([
    response.submitted_at,
    response.response_id,
    response.examiner_code,
    response.child_name,
    maskName_(response.child_name),
    response.birth_year,
    response.birth_month,
    response.gender,
    score ? score.age_group : '',
    score ? score.type.id : '',
    score ? score.type.name : '',
    status,
    pdf ? pdf.url : '',
    pdf ? pdf.id : '',
    errorMessage || '',
    score ? JSON.stringify(score) : '',
  ]);
}

function buildDashboardPayload_() {
  const props = PropertiesService.getScriptProperties();
  const sheet = getResultSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];
  const rows = values.filter((row) => row.some((value) => value !== ''));
  const records = rows.map((row) => {
    const record = {};
    headers.forEach((header, index) => { record[header] = row[index]; });
    return record;
  });

  records.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  const total = records.length;
  const completed = records.filter((record) => record.status === 'PDF 완료').length;
  const failed = records.filter((record) => record.status !== 'PDF 완료').length;

  return {
    ok: true,
    version: props.getProperty('VERSION') || APP.VERSION,
    generatedAt: new Date().toISOString(),
    formUrl: props.getProperty('FORM_URL') || '',
    dashboard: {
      responsesTotal: total,
      scoredTotal: records.filter((record) => record.type_name).length,
      reportsTotal: completed,
      failedTotal: failed,
    },
    results: records.slice(0, 100).map((record) => ({
      submittedAt: toIsoString_(record.submitted_at),
      responseId: String(record.response_id || ''),
      examinerCode: String(record.examiner_code || ''),
      childName: String(record.child_name_masked || maskName_(record.child_name || '')),
      birthYear: record.birth_year,
      birthMonth: record.birth_month,
      gender: String(record.gender || ''),
      ageGroup: String(record.age_group || ''),
      typeName: String(record.type_name || ''),
      status: String(record.status || ''),
      pdfUrl: String(record.pdf_url || ''),
      error: record.status === 'PDF 완료' ? '' : String(record.error_message || ''),
    })),
  };
}

function getResultSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID가 없습니다. setupTestSystem()을 먼저 실행하세요.');
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(APP.RESULT_SHEET);
  if (!sheet) throw new Error(`${APP.RESULT_SHEET} 시트를 찾을 수 없습니다.`);
  return sheet;
}

function makeResponseId_(timestamp) {
  const time = Utilities.formatDate(timestamp, 'Asia/Seoul', 'yyyyMMdd-HHmmss');
  return `R-${time}-${Utilities.getUuid().slice(0, 6).toUpperCase()}`;
}

function maskName_(name) {
  const text = String(name || '').trim();
  if (!text) return '-';
  if (text.length === 1) return `${text}*`;
  if (text.length === 2) return `${text[0]}*`;
  return `${text[0]}${'*'.repeat(text.length - 2)}${text[text.length - 1]}`;
}

function toIsoString_(value) {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toISOString();
}

function deleteSubmitTriggers_() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'handleFormSubmit')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}


/**
 * 테스트용 공개 프론트가 gviz JSONP로 읽을 수 있도록
 * 처리결과 스프레드시트를 "링크가 있는 모든 사용자: 뷰어"로 설정합니다.
 * 실제 개인정보를 쓰는 운영 환경에서는 공개 공유를 사용하지 마세요.
 */
function enablePublicSheetReadForTest() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID가 없습니다. setupTestSystem()을 먼저 실행하세요.');
  }
  const file = DriveApp.getFileById(spreadsheetId);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const result = {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sharing: 'ANYONE_WITH_LINK / VIEW',
    formUrl: PropertiesService.getScriptProperties().getProperty('FORM_URL') || '',
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
