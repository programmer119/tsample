import express from 'express';
import puppeteer from 'puppeteer-core';
import {buildReportHtml} from './src/report-template.js';

const app = express();
const PORT = Number(process.env.PORT || 8080);
const RENDER_KEY = String(process.env.RENDER_KEY || 'temperament-test-renderer');
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
let browserPromise = null;

app.disable('x-powered-by');
app.use(express.json({limit: '1mb'}));

app.get('/health', (_req, res) => {
  res.json({ok: true, service: 'temperament-pdf-renderer', engine: 'Puppeteer/Chromium', version: '2026.07.15-122309-KST'});
});

app.post('/preview', authenticate, asyncHandler(async (req, res) => {
  validatePayload(req.body);
  res.type('html').send(buildReportHtml(req.body));
}));

app.post('/render', authenticate, asyncHandler(async (req, res) => {
  validatePayload(req.body);
  const html = buildReportHtml(req.body);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({width: 1240, height: 1754, deviceScaleFactor: 1});
    await page.setContent(html, {waitUntil: 'networkidle0', timeout: 30000});
    await page.emulateMediaType('screen');
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {top: '0', right: '0', bottom: '0', left: '0'},
      displayHeaderFooter: false,
      timeout: 60000,
    });
    const base = safeFilename(`${req.body.response.examiner_code || 'TEST'}_${req.body.response.response_id || 'REPORT'}`);
    res
      .status(200)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdf.length),
        'Content-Disposition': `inline; filename="${base}.pdf"`,
        'Cache-Control': 'no-store',
      })
      .send(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    ok: false,
    error: error.code || 'render_failed',
    message: error.message || String(error),
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`temperament-pdf-renderer listening on ${PORT}`);
});

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--no-first-run',
        '--no-zygote',
      ],
    }).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  const browser = await browserPromise;
  if (!browser.connected) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

function authenticate(req, res, next) {
  const supplied = String(req.get('X-Render-Key') || req.query.key || '');
  if (!timingSafeEqual(supplied, RENDER_KEY)) {
    return res.status(401).json({ok: false, error: 'invalid_render_key', message: 'PDF 렌더러 키가 일치하지 않습니다.'});
  }
  next();
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') throw badRequest('JSON 본문이 필요합니다.');
  if (!payload.response || typeof payload.response !== 'object') throw badRequest('response 객체가 필요합니다.');
  if (!payload.score || typeof payload.score !== 'object') throw badRequest('score 객체가 필요합니다.');
  if (!Array.isArray(payload.score.factors) || payload.score.factors.length !== 6) throw badRequest('score.factors는 6개여야 합니다.');
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'invalid_payload';
  return error;
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function safeFilename(value) {
  return String(value || 'report').replace(/[^0-9A-Za-z가-힣_-]/g, '_').slice(0, 100) || 'report';
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function shutdown(signal) {
  console.log(`received ${signal}, shutting down`);
  server.close();
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    await browser?.close().catch(() => {});
  }
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
