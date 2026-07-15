const cfg = window.TEMPERAMENT_CONFIG || {};
const root = document.getElementById('reportRoot');
const stateLabel = document.getElementById('viewerState');
const printBtn = document.getElementById('printBtn');
const drivePdfBtn = document.getElementById('drivePdfBtn');

const INTERPRETATIONS = {
  activity: {
    low: '활동성이 낮은 편으로, 차분하고 예측 가능한 환경에서 안정감을 느낄 가능성이 큽니다.',
    mid: '활동성이 평균 범위로, 상황과 흥미에 따라 움직임과 휴식의 균형을 보일 수 있습니다.',
    high: '활동성이 높은 편으로, 충분한 신체 활동과 명확한 전환 안내가 도움이 됩니다.',
  },
  adaptability: {
    low: '적응성이 낮은 편으로, 새로운 상황에 들어가기 전 예고와 반복 노출이 필요할 수 있습니다.',
    mid: '적응성이 평균 범위로, 익숙한 구조 안에서는 비교적 안정적으로 변화에 대응합니다.',
    high: '적응성이 높은 편으로, 일정이나 환경 변화에 비교적 유연하게 반응할 수 있습니다.',
  },
  sensitivity: {
    low: '민감성이 낮은 편으로, 작은 자극에는 크게 흔들리지 않지만 세부 신호를 놓칠 수 있습니다.',
    mid: '민감성이 평균 범위로, 자극 강도와 피로도에 따라 반응이 달라질 수 있습니다.',
    high: '민감성이 높은 편으로, 소리·빛·표정 같은 자극을 세밀하게 받아들일 수 있습니다.',
  },
  persistence: {
    low: '지속성이 낮은 편으로, 짧은 과제와 즉각적인 피드백이 참여 유지에 도움이 됩니다.',
    mid: '지속성이 평균 범위로, 흥미와 난이도가 적절할 때 과제 지속이 안정적으로 나타납니다.',
    high: '지속성이 높은 편으로, 관심 과제에 오래 몰입하지만 전환이 어려울 수 있습니다.',
  },
  sociability: {
    low: '사회성이 낮은 편으로, 혼자 탐색하는 시간과 작은 규모의 상호작용이 편안할 수 있습니다.',
    mid: '사회성이 평균 범위로, 친숙도와 상황에 따라 관계 참여가 달라질 수 있습니다.',
    high: '사회성이 높은 편으로, 사람과 함께하는 활동에서 동기와 표현이 살아날 수 있습니다.',
  },
  emotionality: {
    low: '정서성이 낮은 편으로, 감정 표현이 차분하지만 내적 감정 확인이 필요할 수 있습니다.',
    mid: '정서성이 평균 범위로, 피로와 상황에 따라 감정 표현의 강도가 달라질 수 있습니다.',
    high: '정서성이 높은 편으로, 감정 반응이 선명하며 진정 루틴과 공감적 언어가 도움이 됩니다.',
  },
};


const SAMPLE_RECORDS = {
  '1': {
    record: {submitted_at:'2026-07-13T10:00:00+09:00',response_id:'R-0001',examiner_code:'T-0001',child_name:'김하늘',child_name_masked:'김*늘',birth_year:2021,birth_month:5,gender:'F',age_group:'5-6',type_id:'type_01',type_name:'활기찬 돌고래형',status:'PDF 완료',error_message:''},
    score: {age_years:5,age_group:'5-6',factors:[
      {id:'activity',name:'활동성',raw:26,t_score:56,percentile:74,level:'high'},
      {id:'adaptability',name:'적응성',raw:25,t_score:56,percentile:74,level:'high'},
      {id:'sensitivity',name:'민감성',raw:26,t_score:56,percentile:74,level:'high'},
      {id:'persistence',name:'지속성',raw:22,t_score:56,percentile:74,level:'high'},
      {id:'sociability',name:'사회성',raw:26,t_score:56,percentile:74,level:'high'},
      {id:'emotionality',name:'정서성',raw:22,t_score:56,percentile:74,level:'high'}],
      type:{id:'type_01',name:'활기찬 돌고래형',animal:'돌고래',summary:'새로운 자극과 관계 속에서 에너지가 잘 살아나는 유형입니다.',strengths:['시도와 참여가 빠릅니다.','또래 상호작용에서 표현력이 좋습니다.'],careTips:['활동 전후의 전환 시간을 예고해 주세요.','충분히 움직인 뒤 차분한 과제로 연결해 주세요.'],confidence:1}}
  },
  '2': {
    record: {submitted_at:'2026-07-13T10:03:00+09:00',response_id:'R-0002',examiner_code:'T-0002',child_name:'이도윤',child_name_masked:'이*윤',birth_year:2020,birth_month:9,gender:'M',age_group:'5-6',type_id:'type_02',type_name:'신중한 고슴도치형',status:'PDF 완료',error_message:''},
    score: {age_years:5,age_group:'5-6',factors:[
      {id:'activity',name:'활동성',raw:13,t_score:44,percentile:30,level:'low'},
      {id:'adaptability',name:'적응성',raw:16,t_score:44,percentile:30,level:'low'},
      {id:'sensitivity',name:'민감성',raw:28,t_score:63,percentile:90,level:'high'},
      {id:'persistence',name:'지속성',raw:27,t_score:63,percentile:90,level:'high'},
      {id:'sociability',name:'사회성',raw:14,t_score:44,percentile:30,level:'low'},
      {id:'emotionality',name:'정서성',raw:28,t_score:63,percentile:90,level:'high'}],
      type:{id:'type_02',name:'신중한 고슴도치형',animal:'고슴도치',summary:'환경을 세밀하게 살피고 천천히 익숙해지는 유형입니다.',strengths:['작은 변화와 감각 정보를 잘 포착합니다.','낯선 상황에서 신중하게 판단합니다.'],careTips:['새로운 장소와 사람을 미리 설명해 주세요.','적응 속도를 비교하지 말고 충분한 시간을 주세요.'],confidence:1}}
  },
  '3': {
    record: {submitted_at:'2026-07-13T10:08:00+09:00',response_id:'R-0003',examiner_code:'T-0003',child_name:'박서아',child_name_masked:'박*아',birth_year:2019,birth_month:2,gender:'F',age_group:'7-8',type_id:'type_04',type_name:'유연한 수달형',status:'PDF 완료',error_message:''},
    score: {age_years:7,age_group:'7-8',factors:[
      {id:'activity',name:'활동성',raw:18,t_score:50,percentile:50,level:'mid'},
      {id:'adaptability',name:'적응성',raw:28,t_score:62,percentile:88,level:'high'},
      {id:'sensitivity',name:'민감성',raw:18,t_score:50,percentile:50,level:'mid'},
      {id:'persistence',name:'지속성',raw:28,t_score:62,percentile:88,level:'high'},
      {id:'sociability',name:'사회성',raw:28,t_score:62,percentile:88,level:'high'},
      {id:'emotionality',name:'정서성',raw:13,t_score:44,percentile:29,level:'low'}],
      type:{id:'type_04',name:'유연한 수달형',animal:'수달',summary:'변화에 비교적 편안하게 반응하며 상황에 맞춰 행동을 조절하는 유형입니다.',strengths:['일정 변경이나 새 규칙에 적응이 빠릅니다.','감정 반응이 안정적으로 나타납니다.'],careTips:['스스로 선택할 수 있는 작은 역할을 주세요.','잘 적응한 장면을 구체적으로 칭찬해 주세요.'],confidence:1}}
  }
};

printBtn.addEventListener('click', () => window.print());

function readResultSheet() {
  if (!cfg.spreadsheetId || String(cfg.spreadsheetId).includes('PASTE_')) {
    return Promise.reject(new Error('cfg.js에 스프레드시트 ID가 없습니다.'));
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__temperamentGviz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('공개 Google Sheet 응답 시간이 초과되었습니다. 시트 공유 상태를 확인하세요.'));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      script.remove();
    };

    window[callbackName] = (payload) => {
      try {
        if (!payload || payload.status !== 'ok' || !payload.table) {
          const message = payload?.errors?.map((item) => item.detailed_message || item.message).filter(Boolean).join(' / ')
            || '공개 Google Sheet를 읽지 못했습니다.';
          throw new Error(message);
        }

        const headers = (payload.table.cols || []).map((column) => String(column.label || column.id || '').trim());
        const rows = (payload.table.rows || []).map((row) => (row.c || []).map((cell) => {
          if (!cell) return '';
          if (cell.v === null || cell.v === undefined) return cell.f ?? '';
          return cell.v;
        }));
        resolve([headers, ...rows]);
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('공개 Google Sheet 연결에 실패했습니다. 공유 권한 또는 네트워크를 확인하세요.'));
    };

    const sheetName = cfg.resultSheetName || '처리결과';
    const tqx = `out:json;responseHandler:${callbackName}`;
    script.src = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(String(cfg.spreadsheetId).trim())}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&headers=1&tqx=${encodeURIComponent(tqx)}&_=${Date.now()}`;
    document.head.appendChild(script);
  });
}
function rowsToRecords(values) {
  if (!Array.isArray(values) || !values.length) return [];
  const headers = values[0].map((value) => String(value || '').trim());
  return values.slice(1).filter((row) => row.some((value) => String(value ?? '').trim())).map((row) => {
    const record = {};
    headers.forEach((header, index) => { if (header) record[header] = row[index] ?? ''; });
    return record;
  });
}

async function init() {
  const params = new URLSearchParams(location.search);
  const sampleId = params.get('sample');
  const responseId = params.get('response');
  if (sampleId && SAMPLE_RECORDS[sampleId]) {
    const demo = SAMPLE_RECORDS[sampleId];
    renderReport(demo.record, demo.score);
    document.title = `기질검사 결과지 - ${demo.record.child_name}`;
    stateLabel.textContent = `${demo.record.child_name_masked} · 디자인 샘플`;
    printBtn.disabled = false;
    drivePdfBtn.href = `sample_reports/sample_puppeteer_0${sampleId}.pdf`; drivePdfBtn.classList.remove('hidden');
    return;
  }
  if (!responseId) return showError('응답 ID가 없습니다. 대시보드의 결과지 보기 버튼으로 열어 주세요.');
  try {
    const records = rowsToRecords(await readResultSheet());
    const record = records.find((item) => String(item.response_id) === responseId);
    if (!record) throw new Error(`응답 ${responseId}을 처리결과 시트에서 찾지 못했습니다.`);
    const score = JSON.parse(String(record.score_json || '{}'));
    if (!Array.isArray(score.factors) || !score.factors.length) throw new Error('채점 결과 JSON에 요인 점수가 없습니다.');
    renderReport(record, score);
    document.title = `기질검사 결과지 - ${record.child_name || record.child_name_masked || responseId}`;
    stateLabel.textContent = `${record.child_name_masked || maskName(record.child_name)} · ${responseId}`;
    printBtn.disabled = false;
    if (String(record.pdf_url || '').trim()) {
      drivePdfBtn.href = String(record.pdf_url);
      drivePdfBtn.classList.remove('hidden');
    }
  } catch (error) {
    showError(error.message);
  }
}

function renderReport(record, score) {
  const childName = String(record.child_name || record.child_name_masked || '아동');
  const code = String(record.examiner_code || '-');
  const responseId = String(record.response_id || '-');
  const ageYears = Number(score.age_years || 0);
  const ageGroup = String(score.age_group || record.age_group || '-');
  const gender = record.gender === 'M' ? '남아' : record.gender === 'F' ? '여아' : '-';
  const type = score.type || {};
  const factors = score.factors || [];
  const strengths = type.strengths || [];
  const careTips = type.careTips || type.care_tips || [];
  const confidenceRaw = Number(type.confidence || 0);
  const confidence = confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw;
  const typeId = String(type.id || record.type_id || 'type_08');
  const warning = String(record.error_message || '').trim();
  const factorCards = factors.map((factor) => `
    <article class="factor-card">
      <div class="factor-title"><strong>${esc(factor.name)}</strong><em>${levelLabel(factor.level)}</em></div>
      <div class="factor-score"><b>${num(factor.t_score)}</b> T점수</div>
      <span>원점수 ${num(factor.raw)} · 백분위 ${num(factor.percentile)}%</span>
    </article>`).join('');
  const scoreRows = factors.map((factor) => `<tr><td>${esc(factor.name)}</td><td>${num(factor.raw)}</td><td>${num(factor.t_score)}</td><td>${num(factor.percentile)}%</td><td>${levelLabel(factor.level)}</td></tr>`).join('');
  const interpretationCards = factors.map((factor) => `
    <article class="interpret-card">
      <div class="interpret-head"><h3>${esc(factor.name)}</h3><span>${levelLabel(factor.level)}</span></div>
      <p>${esc(INTERPRETATIONS[factor.id]?.[factor.level] || `${factor.name}은 또래 규준에서 ${levelLabel(factor.level)} 범위로 나타났습니다.`)}</p>
    </article>`);

  root.innerHTML = `
  <section class="page cover">
    <div class="cover-orbit orbit-a"></div><div class="cover-orbit orbit-b"></div>
    <div class="brand">CHILD TEMPERAMENT PROFILE</div>
    <div class="cover-body"><div class="eyebrow">개별 맞춤형 결과 보고서</div><h1>유아동<br>기질검사 결과지</h1><p class="lead">${esc(childName)} 아동의 일상 반응 패턴을<br>6가지 기질 요인으로 살펴보았습니다.</p></div>
    <div class="cover-meta"><div><span>검사 코드</span><strong>${esc(code)}</strong></div><div><span>응답 ID</span><strong>${esc(responseId)}</strong></div></div>
  </section>

  <section class="page">
    <div class="page-kicker">01 · BASIC INFORMATION</div><h2>검사 기본 정보</h2>
    <table class="info-table">
      <tr><th>아동명</th><td>${esc(childName)}</td><th>연령</th><td>${ageYears || '-'}세</td></tr>
      <tr><th>생년월</th><td>${esc(`${record.birth_year || '-'}년 ${record.birth_month || '-'}월`)}</td><th>성별</th><td>${gender}</td></tr>
      <tr><th>보호자</th><td>-</td><th>규준 집단</th><td>${esc(ageGroup)}세</td></tr>
      <tr><th>검사 코드</th><td>${esc(code)}</td><th>제출 일시</th><td>${esc(formatDate(record.submitted_at))}</td></tr>
    </table>
    <div class="method-grid">
      <article><b>원점수</b><p>문항별 가중치와 역채점 규칙을 적용해 6개 요인의 합산 점수를 계산합니다.</p></article>
      <article><b>T점수</b><p>연령·성별 규준표와 매칭하여 평균 50을 중심으로 표준화된 점수로 환산합니다.</p></article>
      <article><b>백분위</b><p>동일 규준 집단에서 상대적인 위치를 백분율로 표시합니다.</p></article>
      <article><b>유형</b><p>요인별 높음·보통·낮음 조합을 8개 유형 규칙과 비교해 대표 유형을 정합니다.</p></article>
    </div>
    <div class="notice">본 결과는 기질의 우열을 판단하기 위한 것이 아니라, 아동에게 맞는 환경과 상호작용 방식을 찾기 위한 참고 자료입니다.</div>
  </section>

  <section class="page">
    <div class="page-kicker">02 · OVERVIEW</div><h2>종합 요약</h2>
    <div class="summary-grid">${factorCards}</div>
    <div class="type-box"><div class="type-chip">대표 유형</div><div><h3>${esc(type.name || record.type_name || '-')}</h3><p>${esc(type.summary || '')}</p><small>규칙 일치도 ${Math.round(confidence)}%</small></div></div>
    <div class="reading-tip"><strong>읽는 방법</strong><p>T점수 45 미만은 낮음, 45~55는 보통, 55 초과는 높음으로 표시했습니다. 높고 낮음은 장점과 지원 필요성이 함께 존재할 수 있습니다.</p></div>
  </section>

  <section class="page chart-page">
    <div class="page-kicker">03 · RADAR PROFILE</div><h2>6요인 프로파일</h2><div class="chart-wrap">${buildRadarSvg(factors)}</div>
    <p class="chart-note">도형이 바깥쪽으로 갈수록 해당 요인의 T점수가 높습니다. 한 요인만 보지 말고 전체 모양과 요인 간 균형을 함께 살펴보세요.</p>
  </section>

  <section class="page chart-page">
    <div class="page-kicker">04 · SCORE DETAILS</div><h2>요인별 T점수 및 백분위</h2><div class="chart-wrap wide">${buildBarSvg(factors)}</div>
    <table class="score-table"><thead><tr><th>요인</th><th>원점수</th><th>T점수</th><th>백분위</th><th>수준</th></tr></thead><tbody>${scoreRows}</tbody></table>
  </section>

  <section class="page">
    <div class="page-kicker">05 · TEMPERAMENT TYPE</div><h2>대표 기질 유형</h2>
    <div class="type-hero"><div class="type-illustration">${buildTypeIllustration(typeId, type.animal || type.name || '대표 유형')}</div><div class="type-copy"><div class="type-chip">${esc(type.name || '-')}</div><h3>${esc(type.name || '-')}</h3><p>${esc(type.summary || '')}</p></div></div>
    <div class="two-column"><article class="list-card strength"><h3>잘 드러나는 강점</h3><ul>${listItems(strengths)}</ul></article><article class="list-card care"><h3>도움이 되는 양육 팁</h3><ul>${listItems(careTips)}</ul></article></div>
    <div class="notice soft">유형은 아동을 고정된 틀에 넣는 진단명이 아닙니다. 상황, 발달 단계, 피로도에 따라 표현 방식은 달라질 수 있습니다.</div>
  </section>

  <section class="page"><div class="page-kicker">06 · FACTOR INTERPRETATION</div><h2>요인별 상세 해석 Ⅰ</h2><div class="interpret-list">${interpretationCards.slice(0,3).join('')}</div></section>
  <section class="page"><div class="page-kicker">07 · FACTOR INTERPRETATION</div><h2>요인별 상세 해석 Ⅱ</h2><div class="interpret-list">${interpretationCards.slice(3,6).join('')}</div></section>

  <section class="page">
    <div class="page-kicker">08 · CAREGIVER GUIDE</div><h2>보호자 실천 가이드</h2>
    <div class="guide-timeline">
      <article><span>1</span><div><h3>먼저 관찰하기</h3><p>점수보다 일상에서 반복되는 반응과 그 직전 상황을 함께 기록합니다.</p></div></article>
      <article><span>2</span><div><h3>기질을 말로 확인하기</h3><p>“왜 그래?”보다 “갑자기 바뀌어서 어려웠구나”처럼 반응의 맥락을 언어로 짚어 줍니다.</p></div></article>
      <article><span>3</span><div><h3>환경을 조절하기</h3><p>아동을 억지로 바꾸기보다 예고, 선택지, 휴식, 활동량 등 환경 조건을 조정합니다.</p></div></article>
      <article><span>4</span><div><h3>작은 성공을 반복하기</h3><p>짧고 성공 가능한 목표부터 시작해 적응과 자기조절 경험을 축적합니다.</p></div></article>
    </div>
    <div class="home-note"><strong>가정에서 한 주간 확인할 것</strong><p>잘 적응한 장면 1개, 어려웠던 장면 1개, 도움이 되었던 보호자 반응 1개를 간단히 적어 다음 관찰에 활용하세요.</p></div>
  </section>

  <section class="page last-page">
    <div class="page-kicker">09 · APPENDIX</div><h2>데이터 검증 및 주의사항</h2>
    <div class="warning-box">${warning ? `<p>${esc(warning)}</p>` : '<div class="ok-message">입력 데이터 검증 경고 없음</div>'}</div>
    <div class="appendix-grid">
      <article><h3>자동 채점 범위</h3><p>문항 가중치, 역채점, 규준표 매칭, T점수·백분위, 유형 판별, 해석문 바인딩을 자동 수행합니다.</p></article>
      <article><h3>검수 필요 항목</h3><p>실제 문항·규준표·해석문·유형 기준은 발주처 최종 원자료로 교체하고 전문가 검수를 거쳐야 합니다.</p></article>
      <article><h3>개인정보</h3><p>운영 환경에서는 공개 시트가 아닌 인증된 저장소, HTTPS, 접근 로그와 백업 정책이 필요합니다.</p></article>
      <article><h3>의학적 진단 아님</h3><p>본 결과지는 의료적·임상적 진단을 대체하지 않습니다. 필요한 경우 관련 전문가와 상담하세요.</p></article>
    </div>
    <div class="closing"><span>${esc(childName)} 아동 결과지</span><strong>${esc(code)}</strong></div>
  </section>`;
}

function buildRadarSvg(factors) {
  const size = 420, center = 210, radius = 138, count = Math.max(3, factors.length);
  const point = (r, i) => {
    const angle = -Math.PI / 2 + 2 * Math.PI * i / count;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };
  const polygon = (r) => Array.from({length: count}, (_, i) => point(r, i).map((n) => n.toFixed(1)).join(',')).join(' ');
  const grids = Array.from({length: 5}, (_, i) => `<polygon points="${polygon(radius * (i + 1) / 5)}" fill="none" stroke="#d8e2ea" stroke-width="1"/>`).join('');
  const axes = factors.map((_, i) => { const [x,y] = point(radius,i); return `<line x1="210" y1="210" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#b4c4cf"/>`; }).join('');
  const values = factors.map((factor, i) => point(radius * clamp((Number(factor.t_score)-20)/60,0,1),i));
  const valuePolygon = values.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const dots = values.map(([x,y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#ff785a"/>`).join('');
  const labels = factors.map((factor,i) => { const [x,y] = point(radius+43,i); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#29384a">${esc(factor.name)}</text>`; }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="chart chart-radar" role="img" aria-label="6요인 방사형 차트">${grids}${axes}<polygon points="${valuePolygon}" fill="rgba(255,120,90,0.22)" stroke="#ff785a" stroke-width="3"/>${dots}${labels}</svg>`;
}

function buildBarSvg(factors) {
  const width = 760, rowH = 52, height = 55 + rowH * factors.length;
  let out = '<line x1="150" y1="24" x2="650" y2="24" stroke="#d8e2ea"/>';
  [30,40,50,60,70].forEach((tick) => { const x = 150 + (tick-20)/60*500; out += `<text x="${x.toFixed(1)}" y="17" text-anchor="middle" font-size="11" fill="#708090">${tick}</text>`; });
  factors.forEach((factor,index) => {
    const y = 39 + index*rowH, score = clamp(Number(factor.t_score),20,80), barW = (score-20)/60*500;
    const color = score < 45 ? '#54bca3' : score > 55 ? '#ff8f70' : '#6b9bd2';
    out += `<text x="0" y="${y+19}" font-size="15" font-weight="700" fill="#29384a">${esc(factor.name)}</text><rect x="150" y="${y}" width="500" height="27" rx="7" fill="#edf2f5"/><rect x="150" y="${y}" width="${barW.toFixed(1)}" height="27" rx="7" fill="${color}"/><text x="670" y="${y+19}" font-size="13" fill="#29384a">T ${Math.round(score)} · ${Math.round(Number(factor.percentile)||0)}%</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${height}" class="chart chart-bar" role="img" aria-label="요인별 막대 차트">${out}</svg>`;
}

function showError(message) {
  stateLabel.textContent = '결과지 불러오기 실패';
  root.innerHTML = `<div class="loading-card error-card"><strong>결과지를 열 수 없습니다.</strong><p>${esc(message)}</p></div>`;
}

const TYPE_ILLUST_META = {
  type_01: {kind: 'image', src: 'assets/type_images_png/type_01.png', bg: '#eaf7ff'},
  type_02: {kind: 'image', src: 'assets/type_images_png/type_02.png', bg: '#fff4e5'},
  type_03: {kind: 'image', src: 'assets/type_images_png/type_03.png', bg: '#edf8e7'},
  type_04: {kind: 'image', src: 'assets/type_images_png/type_04.png', bg: '#eaf8f5'},
  type_05: {kind: 'image', src: 'assets/type_images_png/type_05.png', bg: '#fff1f5'},
  type_06: {kind: 'image', src: 'assets/type_images_png/type_06.png', bg: '#fff5e7'},
  type_07: {kind: 'image', src: 'assets/type_images_png/type_07.png', bg: '#eef1fd'},
  type_08: {kind: 'image', src: 'assets/type_images_png/type_08.png', bg: '#f1f4f5'},
};

function buildTypeIllustration(typeId, altText) {
  const meta = TYPE_ILLUST_META[typeId] || TYPE_ILLUST_META.type_08;
  const label = escAttr(altText || '대표 유형');
  if (meta.kind === 'image') {
    return `<div class="type-animal-card" style="background:${meta.bg}"><img src="${meta.src}" alt="${label}"></div>`;
  }
  return `<div class="type-animal-card" style="background:${meta.bg}"><span class="type-animal-emoji" role="img" aria-label="${label}">${meta.value}</span></div>`;
}

function listItems(items) { return (items && items.length ? items : ['실제 유형별 문구로 교체됩니다.']).map((item) => `<li>${esc(item)}</li>`).join(''); }
function levelLabel(level) { return ({low:'낮음',mid:'보통',high:'높음'})[level] || level || '-'; }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
function num(value) { const n=Number(value); return Number.isFinite(n) ? (Number.isInteger(n)?String(n):n.toFixed(1)) : '-'; }
function formatDate(value) { const d=new Date(value); return Number.isNaN(d.getTime()) ? String(value||'-') : new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short'}).format(d); }
function maskName(name) { const t=String(name||'').trim(); if(!t)return '-'; if(t.length===1)return `${t}*`; if(t.length===2)return `${t[0]}*`; return `${t[0]}${'*'.repeat(t.length-2)}${t[t.length-1]}`; }
function esc(value) { return String(value??'').replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function escAttr(value) { return esc(value).replace(/`/g,'&#96;'); }

init();
