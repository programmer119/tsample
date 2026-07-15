const config = window.TEMPERAMENT_CONFIG || {};
const state = {
  timer: null,
  loading: false,
  configured: Boolean(config.spreadsheetId && !String(config.spreadsheetId).includes('PASTE_')),
};

const $ = (selector) => document.querySelector(selector);
const connectionState = $('#connectionState');
const openFormBtn = $('#openFormBtn');
const refreshNowBtn = $('#refreshNowBtn');
const updatedAt = $('#updatedAt');
const resultRows = $('#resultRows');

function initNavigation() {
  const navLinks = [...document.querySelectorAll('.sidebar nav a')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
    });
  }, {rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.25, 0.5]});

  sections.forEach((section) => observer.observe(section));
}

function setConnection(status, text) {
  connectionState.className = `connection-pill ${status}`;
  connectionState.querySelector('span').textContent = text;
}

function readResultSheet() {
  if (!config.spreadsheetId || String(config.spreadsheetId).includes('PASTE_')) {
    return Promise.reject(new Error('config.js에 스프레드시트 ID가 없습니다.'));
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

    const sheetName = config.resultSheetName || '처리결과';
    const tqx = `out:json;responseHandler:${callbackName}`;
    script.src = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(String(config.spreadsheetId).trim())}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&headers=1&tqx=${encodeURIComponent(tqx)}&_=${Date.now()}`;
    document.head.appendChild(script);
  });
}
function rowsToRecords(values) {
  if (!Array.isArray(values) || values.length === 0) return [];
  const headers = (values[0] || []).map((value) => String(value).trim());
  return values.slice(1)
    .filter((row) => Array.isArray(row) && row.some((value) => String(value ?? '').trim() !== ''))
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        if (header) record[header] = row[index] ?? '';
      });
      return record;
    })
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
}

async function refreshDashboard({silent = false} = {}) {
  if (state.loading) return;
  if (!state.configured) {
    setConnection('error', '스프레드시트 설정 필요');
    $('#buildVersion').textContent = 'config.js 확인 필요';
    updatedAt.textContent = 'config.js의 스프레드시트 ID를 확인하세요.';
    if (!silent) showToast('config.js의 스프레드시트 설정이 필요합니다.', true);
    return;
  }

  state.loading = true;
  refreshNowBtn.disabled = true;
  setConnection('waiting', '실시간 데이터 확인 중');

  try {
    const values = await readResultSheet();
    const records = rowsToRecords(values);
    renderDashboard(records);
    renderResults(records.slice(0, 100));
    setConnection('ok', 'Google Form 실시간 연동됨');
    $('#buildVersion').textContent = 'PUBLIC SHEET LIVE';

    if (config.formUrl && !String(config.formUrl).includes('PASTE_')) {
      openFormBtn.href = config.formUrl;
      openFormBtn.classList.remove('disabled');
      openFormBtn.setAttribute('aria-disabled', 'false');
    }

    updatedAt.textContent = `마지막 확인 ${formatDate(new Date().toISOString())}`;
    if (!silent) showToast('Google Form 처리 결과를 새로고침했습니다.');
  } catch (error) {
    setConnection('error', '공개 시트 연결 실패');
    updatedAt.textContent = error.message;
    if (!silent) showToast(error.message, true);
  } finally {
    state.loading = false;
    refreshNowBtn.disabled = false;
  }
}

function renderDashboard(records) {
  const completed = records.filter((record) => record.status === 'PDF 완료').length;
  const scored = records.filter((record) => String(record.type_name || '').trim()).length;
  const failed = records.filter((record) => record.status && record.status !== 'PDF 완료').length;

  $('#metricResponses').textContent = number(records.length);
  $('#metricScored').textContent = number(scored);
  $('#metricReports').textContent = number(completed);
  $('#metricFailed').textContent = number(failed);
}

function renderResults(records) {
  if (!records.length) {
    resultRows.innerHTML = '<tr><td colspan="9" class="empty">아직 실제 Google Form 제출 결과가 없습니다. 상단의 테스트 구글폼을 열어 제출하세요.</td></tr>';
    return;
  }

  resultRows.innerHTML = records.map((item) => {
    const statusClass = item.status === 'PDF 완료' ? 'succeeded' : 'failed';
    const gender = item.gender === 'M' ? '남아' : item.gender === 'F' ? '여아' : '-';
    const childName = item.child_name_masked || maskName(item.child_name || '');
    const hasScore = String(item.score_json || '').trim() !== '';
    const viewerUrl = `report.html?response=${encodeURIComponent(item.response_id || '')}`;
    const viewerLink = hasScore
      ? `<a class="button-link subtle-link" href="${escapeAttribute(viewerUrl)}" target="_blank" rel="noopener">화면 보기</a>`
      : '';
    const pdfLink = String(item.pdf_url || '').trim()
      ? `<a class="button-link" href="${escapeAttribute(item.pdf_url)}" target="_blank" rel="noopener">PDF 열기</a>`
      : '';
    const resultLink = (viewerLink || pdfLink)
      ? `<div class="result-links">${pdfLink}${viewerLink}</div>`
      : '<span class="muted-text">생성 안 됨</span>';

    return `
      <tr>
        <td>${formatDate(item.submitted_at)}</td>
        <td><strong>${escapeHtml(item.response_id || '-')}</strong></td>
        <td>${escapeHtml(item.examiner_code || '-')}</td>
        <td>${escapeHtml(childName || '-')}</td>
        <td>${escapeHtml(`${item.birth_year || '-'}년 ${item.birth_month || '-'}월 · ${item.age_group || '-'}`)}</td>
        <td>${gender}</td>
        <td>${escapeHtml(item.type_name || '-')}</td>
        <td><span class="badge ${statusClass}" title="${escapeAttribute(item.error_message || '')}">${escapeHtml(item.status || '-')}</span></td>
        <td>${resultLink}</td>
      </tr>`;
  }).join('');
}

openFormBtn.addEventListener('click', (event) => {
  if (openFormBtn.classList.contains('disabled')) {
    event.preventDefault();
    showToast('config.js에 실제 Google Form 주소를 입력하세요.', true);
  }
});

refreshNowBtn.addEventListener('click', () => refreshDashboard());

let toastTimer;
function showToast(message, isError = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast show${isError ? ' error' : ''}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.className = 'toast'; }, 4200);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(String(value || '-'));
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function number(value) {
  return new Intl.NumberFormat('ko-KR').format(Number(value) || 0);
}

function maskName(name) {
  const text = String(name || '').trim();
  if (!text) return '-';
  if (text.length === 1) return `${text}*`;
  if (text.length === 2) return `${text[0]}*`;
  return `${text[0]}${'*'.repeat(text.length - 2)}${text[text.length - 1]}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

initNavigation();
refreshDashboard({silent: true});
if (state.configured) {
  state.timer = window.setInterval(() => refreshDashboard({silent: true}), Math.max(5000, Number(config.refreshMs) || 10000));
}
