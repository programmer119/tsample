import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

const INTERPRETATIONS = Object.freeze({
  activity: {
    low: '활동성이 낮은 편으로, 차분하고 예측 가능한 환경에서 안정감을 느낄 가능성이 큽니다. 서두르기보다 준비 시간을 충분히 주면 참여가 자연스럽게 이어집니다.',
    mid: '활동성이 평균 범위로, 상황과 흥미에 따라 움직임과 휴식의 균형을 보일 수 있습니다. 활동 강도와 회복 시간을 함께 살펴보세요.',
    high: '활동성이 높은 편으로, 충분한 신체 활동과 명확한 전환 안내가 도움이 됩니다. 움직임을 억제하기보다 안전한 활동 경로를 마련하는 것이 좋습니다.',
  },
  adaptability: {
    low: '적응성이 낮은 편으로, 새로운 상황에 들어가기 전 예고와 반복 노출이 필요할 수 있습니다. 익숙한 물건이나 순서를 연결하면 부담을 줄일 수 있습니다.',
    mid: '적응성이 평균 범위로, 익숙한 구조 안에서는 비교적 안정적으로 변화에 대응합니다. 큰 변화는 단계별로 안내해 주세요.',
    high: '적응성이 높은 편으로, 일정이나 환경 변화에 비교적 유연하게 반응할 수 있습니다. 스스로 선택하고 조정할 기회를 주면 강점이 더 잘 드러납니다.',
  },
  sensitivity: {
    low: '민감성이 낮은 편으로, 작은 자극에는 크게 흔들리지 않지만 세부 신호를 놓칠 수 있습니다. 표정과 상황 단서를 구체적으로 설명해 주세요.',
    mid: '민감성이 평균 범위로, 자극 강도와 피로도에 따라 반응이 달라질 수 있습니다. 하루 중 반응이 달라지는 시간을 관찰해 보세요.',
    high: '민감성이 높은 편으로, 소리·빛·표정 같은 자극을 세밀하게 받아들일 수 있습니다. 자극을 줄이고 회복할 수 있는 공간이 도움이 됩니다.',
  },
  persistence: {
    low: '지속성이 낮은 편으로, 짧은 과제와 즉각적인 피드백이 참여 유지에 도움이 됩니다. 과제를 작은 단계로 나누고 완료 경험을 자주 제공하세요.',
    mid: '지속성이 평균 범위로, 흥미와 난이도가 적절할 때 과제 지속이 안정적으로 나타납니다. 목표와 종료 시점을 명확히 알려 주세요.',
    high: '지속성이 높은 편으로, 관심 과제에 오래 몰입하지만 전환이 어려울 수 있습니다. 끝내기 예고와 다음 활동의 연결 고리를 마련해 주세요.',
  },
  sociability: {
    low: '사회성이 낮은 편으로, 혼자 탐색하는 시간과 작은 규모의 상호작용이 편안할 수 있습니다. 관계 참여를 강요하기보다 예측 가능한 만남부터 시작하세요.',
    mid: '사회성이 평균 범위로, 친숙도와 상황에 따라 관계 참여가 달라질 수 있습니다. 편안한 역할을 먼저 맡기면 참여가 쉬워집니다.',
    high: '사회성이 높은 편으로, 사람과 함께하는 활동에서 동기와 표현이 살아날 수 있습니다. 관계의 경계와 차례를 함께 연습해 주세요.',
  },
  emotionality: {
    low: '정서성이 낮은 편으로, 감정 표현이 차분하지만 내적 감정 확인이 필요할 수 있습니다. 표정이 크지 않더라도 마음 상태를 천천히 물어보세요.',
    mid: '정서성이 평균 범위로, 피로와 상황에 따라 감정 표현의 강도가 달라질 수 있습니다. 감정의 원인과 회복 방법을 함께 찾아보세요.',
    high: '정서성이 높은 편으로, 감정 반응이 선명하며 진정 루틴과 공감적 언어가 도움이 됩니다. 감정을 억누르기보다 안전하게 표현하는 방법을 안내하세요.',
  },
});

export function buildReportHtml(payload) {
  const response = payload?.response || {};
  const score = payload?.score || {};
  const factors = normalizeFactors(score.factors);
  const type = normalizeType(score.type, response);
  const childName = String(response.child_name || response.child_name_masked || '아동');
  const gender = response.gender === 'M' ? '남아' : response.gender === 'F' ? '여아' : '-';
  const ageYears = Number(score.age_years || 0);
  const ageGroup = String(score.age_group || response.age_group || '-');
  const confidenceRaw = Number(type.confidence || 0);
  const confidence = confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw;
  const warnings = Array.isArray(payload?.warnings) ? payload.warnings : [];

  const factorCards = factors.map((factor) => `
    <article class="factor-card">
      <div class="factor-head"><strong>${esc(factor.name)}</strong><span class="level ${escAttr(factor.level)}">${levelLabel(factor.level)}</span></div>
      <div class="score-line"><b>${num(factor.t_score)}</b><small>T점수</small></div>
      <p>원점수 ${num(factor.raw)} · 백분위 ${num(factor.percentile)}%</p>
    </article>`).join('');

  const scoreRows = factors.map((factor) => `
    <tr><td>${esc(factor.name)}</td><td>${num(factor.raw)}</td><td><strong>${num(factor.t_score)}</strong></td><td>${num(factor.percentile)}%</td><td><span class="table-level ${escAttr(factor.level)}">${levelLabel(factor.level)}</span></td></tr>`).join('');

  const interpretationCards = factors.map((factor) => `
    <article class="interpret-card">
      <div class="interpret-top"><div><span class="factor-index">${String(factor.index).padStart(2, '0')}</span><h3>${esc(factor.name)}</h3></div><span class="level ${escAttr(factor.level)}">${levelLabel(factor.level)}</span></div>
      <div class="interpret-score"><b>T ${num(factor.t_score)}</b><span>백분위 ${num(factor.percentile)}%</span></div>
      <p>${esc(INTERPRETATIONS[factor.id]?.[factor.level] || `${factor.name}은 또래 규준에서 ${levelLabel(factor.level)} 범위로 나타났습니다.`)}</p>
    </article>`);

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>유아동 기질검사 결과지 - ${esc(childName)}</title>
  <style>${STYLES}</style>
</head>
<body>
  <section class="page cover">
    <div class="cover-ribbon"></div>
    <div class="cover-deco deco-a"></div><div class="cover-deco deco-b"></div><div class="cover-deco deco-c"></div>
    <header class="cover-brand"><span class="brand-dot"></span><b>CHILD TEMPERAMENT PROFILE</b></header>
    <main class="cover-main">
      <span class="eyebrow">개별 맞춤형 결과 보고서</span>
      <h1>유아동<br>기질검사 결과지</h1>
      <p>${esc(childName)} 아동의 일상 반응 패턴을<br>6가지 기질 요인으로 살펴보았습니다.</p>
      <div class="cover-type">
        <div class="animal-small">${animalIllustration(type.id, type.animal)}</div>
        <div><span>대표 기질 유형</span><strong>${esc(type.name)}</strong></div>
      </div>
    </main>
    <footer class="cover-meta">
      <div><span>검사 코드</span><strong>${esc(response.examiner_code || '-')}</strong></div>
      <div><span>응답 ID</span><strong>${esc(response.response_id || '-')}</strong></div>
      <div><span>검사 일시</span><strong>${esc(formatDate(response.submitted_at))}</strong></div>
    </footer>
  </section>

  <section class="page">
    ${pageHeader('01', 'BASIC INFORMATION', '검사 기본 정보')}
    <table class="info-table">
      <tr><th>아동명</th><td>${esc(childName)}</td><th>연령</th><td>${ageYears || '-'}세</td></tr>
      <tr><th>생년월</th><td>${esc(`${response.birth_year || '-'}년 ${response.birth_month || '-'}월`)}</td><th>성별</th><td>${gender}</td></tr>
      <tr><th>검사 코드</th><td>${esc(response.examiner_code || '-')}</td><th>규준 집단</th><td>${esc(ageGroup)}세</td></tr>
      <tr><th>응답 ID</th><td>${esc(response.response_id || '-')}</td><th>제출 일시</th><td>${esc(formatDate(response.submitted_at))}</td></tr>
    </table>
    <div class="method-grid">
      ${methodCard('01', '원점수', '문항별 가중치와 역채점 규칙을 적용해 6개 요인의 합산 점수를 계산합니다.')}
      ${methodCard('02', 'T점수', '연령·성별 규준표와 매칭하여 평균 50을 중심으로 표준화된 점수로 환산합니다.')}
      ${methodCard('03', '백분위', '동일 규준 집단에서 상대적인 위치를 백분율로 표시합니다.')}
      ${methodCard('04', '유형 판별', '요인별 높음·보통·낮음 조합을 유형 규칙과 비교해 대표 유형을 정합니다.')}
    </div>
    <div class="notice coral"><b>결과를 읽을 때</b><p>기질은 좋고 나쁨의 평가가 아니라, 아동이 환경에 반응하는 고유한 방식입니다. 점수 하나보다 전체 프로파일과 생활 장면을 함께 살펴보세요.</p></div>
    ${pageFooter('01')}
  </section>

  <section class="page">
    ${pageHeader('02', 'OVERVIEW', '종합 요약')}
    <div class="summary-grid">${factorCards}</div>
    <div class="type-summary-card">
      <div class="type-badge">대표 유형</div>
      <div class="type-summary-copy"><h3>${esc(type.name)}</h3><p>${esc(type.summary)}</p><small>규칙 일치도 ${Math.round(confidence)}%</small></div>
      <div class="animal-medium">${animalIllustration(type.id, type.animal)}</div>
    </div>
    <div class="reading-guide"><b>점수 구간</b><div><span class="dot low"></span>낮음 T 45 미만</div><div><span class="dot mid"></span>보통 T 45~55</div><div><span class="dot high"></span>높음 T 55 초과</div></div>
    ${pageFooter('02')}
  </section>

  <section class="page chart-page">
    ${pageHeader('03', 'RADAR PROFILE', '6요인 프로파일')}
    <div class="radar-stage">${buildRadarSvg(factors)}</div>
    <div class="chart-caption"><b>프로파일 읽기</b><p>도형이 바깥쪽으로 갈수록 해당 요인의 T점수가 높습니다. 한 요인만 보지 말고 전체 모양과 요인 간 균형을 함께 살펴보세요.</p></div>
    ${pageFooter('03')}
  </section>

  <section class="page chart-page">
    ${pageHeader('04', 'SCORE DETAILS', '요인별 T점수 및 백분위')}
    <div class="bar-stage">${buildBarSvg(factors)}</div>
    <table class="score-table"><thead><tr><th>요인</th><th>원점수</th><th>T점수</th><th>백분위</th><th>수준</th></tr></thead><tbody>${scoreRows}</tbody></table>
    ${pageFooter('04')}
  </section>

  <section class="page type-page">
    ${pageHeader('05', 'TEMPERAMENT TYPE', '대표 기질 유형')}
    <div class="type-hero">
      <div class="animal-hero">${animalIllustration(type.id, type.animal)}</div>
      <div class="type-copy"><span class="eyebrow">${esc(type.animal || '대표 유형')}</span><h2>${esc(type.name)}</h2><p>${esc(type.summary)}</p></div>
    </div>
    <div class="two-column">
      <article class="list-card strength"><span class="card-icon">+</span><h3>잘 드러나는 강점</h3><ul>${listItems(type.strengths)}</ul></article>
      <article class="list-card care"><span class="card-icon">✓</span><h3>도움이 되는 양육 팁</h3><ul>${listItems(type.careTips)}</ul></article>
    </div>
    <div class="notice mint"><b>유형은 고정된 진단명이 아닙니다.</b><p>상황, 발달 단계, 피로도에 따라 표현 방식은 달라질 수 있습니다. 유형은 현재 관찰된 반응 패턴을 이해하기 위한 안내 지도입니다.</p></div>
    ${pageFooter('05')}
  </section>

  <section class="page">
    ${pageHeader('06', 'FACTOR INTERPRETATION', '요인별 상세 해석 Ⅰ')}
    <div class="interpret-list">${interpretationCards.slice(0, 3).join('')}</div>
    ${pageFooter('06')}
  </section>

  <section class="page">
    ${pageHeader('07', 'FACTOR INTERPRETATION', '요인별 상세 해석 Ⅱ')}
    <div class="interpret-list">${interpretationCards.slice(3, 6).join('')}</div>
    ${pageFooter('07')}
  </section>

  <section class="page">
    ${pageHeader('08', 'CAREGIVER GUIDE', '보호자 실천 가이드')}
    <div class="guide-list">
      ${guideItem('1', '먼저 관찰하기', '점수보다 일상에서 반복되는 반응과 그 직전 상황을 함께 기록합니다.')}
      ${guideItem('2', '기질을 말로 확인하기', '“왜 그래?”보다 “갑자기 바뀌어서 어려웠구나”처럼 반응의 맥락을 언어로 짚어 줍니다.')}
      ${guideItem('3', '환경을 조절하기', '아동을 억지로 바꾸기보다 예고, 선택지, 휴식, 활동량 등 환경 조건을 조정합니다.')}
      ${guideItem('4', '작은 성공을 반복하기', '짧고 성공 가능한 목표부터 시작해 적응과 자기조절 경험을 축적합니다.')}
    </div>
    <div class="weekly-note"><span>WEEKLY NOTE</span><h3>가정에서 한 주간 확인할 것</h3><p>잘 적응한 장면 1개, 어려웠던 장면 1개, 도움이 되었던 보호자 반응 1개를 간단히 적어 다음 관찰에 활용하세요.</p></div>
    ${pageFooter('08')}
  </section>

  <section class="page last-page">
    ${pageHeader('09', 'APPENDIX', '데이터 검증 및 주의사항')}
    <div class="validation-card ${warnings.length ? 'has-warning' : ''}">${warnings.length ? `<b>확인 필요</b><ul>${listItems(warnings)}</ul>` : '<span class="check-circle">✓</span><div><b>입력 데이터 검증 완료</b><p>필수값 및 36개 문항의 응답 범위를 확인했습니다.</p></div>'}</div>
    <div class="appendix-grid">
      ${appendixCard('자동 채점 범위', '문항 가중치, 역채점, 규준표 매칭, T점수·백분위, 유형 판별, 해석문 바인딩을 자동 수행합니다.')}
      ${appendixCard('검수 필요 항목', '실제 문항·규준표·해석문·유형 기준은 발주처 최종 원자료로 교체하고 전문가 검수를 거쳐야 합니다.')}
      ${appendixCard('개인정보', '운영 환경에서는 공개 시트가 아닌 인증된 저장소, HTTPS, 접근 로그와 백업 정책을 적용해야 합니다.')}
      ${appendixCard('의학적 진단 아님', '본 결과지는 의료적·임상적 진단을 대체하지 않습니다. 필요한 경우 관련 전문가와 상담하세요.')}
    </div>
    <div class="closing"><div><span>CHILD TEMPERAMENT PROFILE</span><b>${esc(childName)} 아동 결과지</b></div><strong>${esc(response.examiner_code || '-')}</strong></div>
    ${pageFooter('09')}
  </section>
</body>
</html>`;
}

function normalizeFactors(input) {
  const fallback = [
    ['activity', '활동성'], ['adaptability', '적응성'], ['sensitivity', '민감성'],
    ['persistence', '지속성'], ['sociability', '사회성'], ['emotionality', '정서성'],
  ];
  return fallback.map(([id, name], index) => {
    const source = Array.isArray(input) ? (input.find((item) => item?.id === id) || input[index] || {}) : {};
    const t = finite(source.t_score, 50);
    return {
      index: index + 1,
      id,
      name: String(source.name || name),
      raw: finite(source.raw, 18),
      t_score: t,
      percentile: finite(source.percentile, 50),
      level: ['low', 'mid', 'high'].includes(source.level) ? source.level : (t < 45 ? 'low' : t > 55 ? 'high' : 'mid'),
    };
  });
}

function normalizeType(input, response) {
  const source = input || {};
  return {
    id: String(source.id || response.type_id || 'type_08'),
    name: String(source.name || response.type_name || '균형 잡힌 판다형'),
    animal: String(source.animal || '판다'),
    summary: String(source.summary || '여러 상황에서 균형 있는 반응을 보이며 환경에 따라 강점이 달라지는 유형입니다.'),
    strengths: arrayText(source.strengths, ['상황에 맞게 반응을 조절합니다.', '다양한 활동에서 균형 있게 참여합니다.']),
    careTips: arrayText(source.careTips || source.care_tips, ['선택지를 주어 자기 선호를 표현하게 해 주세요.', '잘 해낸 장면을 구체적으로 확인해 주세요.']),
    confidence: finite(source.confidence, 1),
  };
}

function buildRadarSvg(factors) {
  const size = 520, center = 260, radius = 164, count = factors.length;
  const point = (r, i) => {
    const angle = -Math.PI / 2 + 2 * Math.PI * i / count;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };
  const polygon = (r) => Array.from({length: count}, (_, i) => point(r, i).map((n) => n.toFixed(1)).join(',')).join(' ');
  const grids = [0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => `<polygon points="${polygon(radius * ratio)}" fill="${index % 2 ? '#fbfcfd' : '#f6f9fa'}" stroke="#d5e0e6" stroke-width="1.2"/>`).join('');
  const axes = factors.map((_, i) => { const [x, y] = point(radius, i); return `<line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#c3d1d9" stroke-width="1"/>`; }).join('');
  const values = factors.map((factor, i) => point(radius * clamp((Number(factor.t_score) - 20) / 60, 0.08, 1), i));
  const valuePolygon = values.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const dots = values.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#ffffff" stroke="#f06f52" stroke-width="3"/>`).join('');
  const labels = factors.map((factor, i) => {
    const [x, y] = point(radius + 57, i);
    return `<g><text x="${x.toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" font-size="16" font-weight="800" fill="#26384a">${esc(factor.name)}</text><text x="${x.toFixed(1)}" y="${(y + 18).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#f06f52">T ${num(factor.t_score)}</text></g>`;
  }).join('');
  const rings = [30, 40, 50, 60, 70].map((t, index) => `<text x="${center + 7}" y="${(center - radius * (index + 1) / 5 + 4).toFixed(1)}" font-size="10" fill="#8b9ba7">${t}</text>`).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="chart radar" role="img" aria-label="6요인 방사형 차트">${grids}${axes}${rings}<polygon points="${valuePolygon}" fill="rgba(240,111,82,.22)" stroke="#f06f52" stroke-width="4" stroke-linejoin="round"/>${dots}${labels}</svg>`;
}

function buildBarSvg(factors) {
  const width = 860, rowH = 62, height = 70 + rowH * factors.length;
  const left = 180, barWidth = 500;
  let out = `<rect x="${left}" y="34" width="${barWidth}" height="${rowH * factors.length - 18}" rx="14" fill="#f6f9fa"/>`;
  [30, 40, 50, 60, 70].forEach((tick) => {
    const x = left + (tick - 20) / 60 * barWidth;
    out += `<line x1="${x.toFixed(1)}" y1="28" x2="${x.toFixed(1)}" y2="${height - 18}" stroke="#dbe4e9" stroke-width="1"/><text x="${x.toFixed(1)}" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="#7d8d99">${tick}</text>`;
  });
  factors.forEach((factor, index) => {
    const y = 48 + index * rowH;
    const score = clamp(Number(factor.t_score), 20, 80);
    const w = (score - 20) / 60 * barWidth;
    const color = score < 45 ? '#49b59c' : score > 55 ? '#f57f61' : '#6d9fd0';
    out += `<text x="4" y="${y + 24}" font-size="17" font-weight="800" fill="#26384a">${esc(factor.name)}</text>
      <rect x="${left}" y="${y}" width="${barWidth}" height="32" rx="9" fill="#e8eef1"/>
      <rect x="${left}" y="${y}" width="${w.toFixed(1)}" height="32" rx="9" fill="${color}"/>
      <circle cx="${(left + w).toFixed(1)}" cy="${y + 16}" r="7" fill="#fff" stroke="${color}" stroke-width="4"/>
      <text x="${left + barWidth + 24}" y="${y + 15}" font-size="15" font-weight="900" fill="#26384a">T ${num(score)}</text>
      <text x="${left + barWidth + 24}" y="${y + 31}" font-size="11" font-weight="700" fill="#7d8d99">백분위 ${num(factor.percentile)}%</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${height}" class="chart bars" role="img" aria-label="요인별 막대 차트">${out}</svg>`;
}

const TYPE_ILLUST_META = {
  type_01: {kind: 'image', file: './assets/type_images_png/type_01.png', bg: '#eaf7ff'},
  type_02: {kind: 'image', file: './assets/type_images_png/type_02.png', bg: '#fff4e5'},
  type_03: {kind: 'image', file: './assets/type_images_png/type_03.png', bg: '#edf8e7'},
  type_04: {kind: 'image', file: './assets/type_images_png/type_04.png', bg: '#eaf8f5'},
  type_05: {kind: 'image', file: './assets/type_images_png/type_05.png', bg: '#fff1f5'},
  type_06: {kind: 'image', file: './assets/type_images_png/type_06.png', bg: '#fff5e7'},
  type_07: {kind: 'image', file: './assets/type_images_png/type_07.png', bg: '#eef1fd'},
  type_08: {kind: 'image', file: './assets/type_images_png/type_08.png', bg: '#f1f4f5'},
};

const TYPE_ILLUST_DATA = Object.fromEntries(Object.entries(TYPE_ILLUST_META).map(([key, meta]) => {
  if (meta.kind !== 'image') return [key, meta];
  const abs = path.resolve(__dirname, meta.file);
  const mime = abs.toLowerCase().endsWith('.png') ? 'image/png' : 'image/svg+xml';
  const data = fs.readFileSync(abs).toString('base64');
  return [key, {...meta, src: `data:${mime};base64,${data}`}];
}));

export function animalIllustration(typeId, animalName) {
  const meta = TYPE_ILLUST_DATA[typeId] || TYPE_ILLUST_DATA.type_08;
  const label = escAttr(animalName || '동물 유형');
  if (meta.kind === 'image') {
    return `<div class="type-animal-card" style="background:${meta.bg}"><img src="${meta.src}" alt="${label}"></div>`;
  }
  return `<div class="type-animal-card" style="background:${meta.bg}"><span class="type-animal-emoji" role="img" aria-label="${label}">${meta.value}</span></div>`;
}


function pageHeader(number, kicker, title) {
  return `<header class="page-header"><div><span>${number} · ${esc(kicker)}</span><h2>${esc(title)}</h2></div><div class="header-mark">T</div></header>`;
}
function pageFooter(number) { return `<footer class="page-footer"><span>CHILD TEMPERAMENT PROFILE</span><b>${number}</b></footer>`; }
function methodCard(number, title, text) { return `<article class="method-card"><span>${number}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`; }
function guideItem(number, title, text) { return `<article class="guide-item"><span>${number}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></article>`; }
function appendixCard(title, text) { return `<article class="appendix-card"><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`; }
function listItems(items) { return arrayText(items, ['실제 유형별 문구로 교체됩니다.']).map((item) => `<li>${esc(item)}</li>`).join(''); }
function arrayText(value, fallback) { return Array.isArray(value) && value.length ? value.map(String) : fallback; }
function finite(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function levelLabel(level) { return ({low: '낮음', mid: '보통', high: '높음'})[level] || '-'; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function num(value) { const n = Number(value); return Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : n.toFixed(1)) : '-'; }
function formatDate(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value || '-') : new Intl.DateTimeFormat('ko-KR', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul'}).format(d); }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'})[char]); }
function escAttr(value) { return esc(value).replace(/`/g, '&#96;'); }
