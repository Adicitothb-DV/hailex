import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const browserPath =
  process.env.CHROME_PATH ??
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find(existsSync);
assert.ok(browserPath, 'Chrome or Edge required');
const profile = mkdtempSync(join(tmpdir(), 'hailex-monitoring-'));
const browser = spawn(
  browserPath,
  [
    '--headless',
    '--no-first-run',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
let socket;
let sequence = 0;
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  return new Promise((resolvePromise, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => reject(new Error(`Timeout ${method}`)), 30000);
    pending.set(id, { resolvePromise, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitFor(expression, attempts = 300) {
  for (let i = 0; i < attempts; i++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Timeout: ${expression} BODY=${await evaluate('document.body.innerText')}`);
}
async function clickAt(x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await delay(250);
}
try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; !existsSync(portFile) && i < 100; i++) await delay(100);
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find((item) => item.type === 'page').webSocketDebuggerUrl);
  await new Promise((ok, fail) => {
    socket.addEventListener('open', ok, { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  socket.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params);
    const req = pending.get(msg.id);
    if (req) {
      clearTimeout(req.timer);
      pending.delete(msg.id);
      msg.error ? req.reject(new Error(JSON.stringify(msg.error))) : req.resolvePromise(msg.result);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/#/rotation-studio' });
  await waitFor(
    "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Dibujar parcela')&&!b.disabled)",
    600,
  );
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Dibujar parcela')).click()",
  );
  const rect = await evaluate(
    "(()=>{const r=document.querySelector('.map-canvas canvas').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}})()",
  );
  const x = rect.x + rect.w / 2,
    y = rect.y + rect.h / 2;
  await clickAt(x - 30, y - 30);
  await clickAt(x + 30, y - 30);
  await clickAt(x + 30, y + 30);
  await clickAt(x - 30, y + 30);
  await clickAt(x - 30, y - 30);
  await waitFor("document.querySelector('.location-panel').innerText.includes('perímetro')", 300);
  console.log('PASS dibujo y validación de área');
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Buscar escenas')).click()",
  );
  await waitFor(
    "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Analizar parcela'))",
    600,
  );
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Analizar parcela')).click()",
  );
  await waitFor("Boolean(document.querySelector('.monitoring-result'))", 1200);
  console.log(
    'PASS escena y análisis',
    (await evaluate("document.querySelector('.monitoring-result').innerText")).slice(0, 500),
  );
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent==='NDVI').click()",
  );
  await delay(1500);
  assert.equal(
    await evaluate("document.querySelector('button[aria-pressed=true]').textContent"),
    'NDVI',
  );
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent==='NDMI').click()",
  );
  await delay(1500);
  assert.equal(
    await evaluate("document.querySelector('button[aria-pressed=true]').textContent"),
    'NDMI',
  );
  const evidence = resolve('evidence');
  mkdirSync(evidence, { recursive: true });
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(evidence, 'monitoring-ndmi.png'), Buffer.from(shot.data, 'base64'));
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Consultar clima de los 30')).click()",
  );
  await waitFor(
    "document.querySelector('.monitoring-result').innerText.includes('NASA POWER ·') || document.querySelector('.monitoring-result [role=status]')?.innerText.includes('no pudo')",
    600,
  );
  console.log(
    'Clima de contexto:',
    (await evaluate("document.querySelector('.monitoring-result').innerText")).includes(
      'NASA POWER ·',
    )
      ? 'disponible'
      : 'proveedor no disponible',
  );
  await evaluate("location.hash='#/analysis-insights'");
  await waitFor("Boolean(document.querySelector('.agriculture-table tbody tr'))", 300);
  assert.ok(
    (await evaluate('document.body.innerText')).includes('2015, 2016, 2017, 2018, 2019, 2020'),
  );
  shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(evidence, 'agriculture.png'), Buffer.from(shot.data, 'base64'));
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(`PASS NDVI/NDMI y datos SIAP; capturas ${evidence}`);
} finally {
  socket?.close();
  browser.kill();
}
