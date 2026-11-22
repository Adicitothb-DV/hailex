import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const browserPath =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = mkdtempSync(join(tmpdir(), 'hailex-agroalert-'));
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
let moistureRequests = 0;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => reject(new Error(`Timeout ${method}`)), 30000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitFor(expression, attempts = 1200) {
  for (let i = 0; i < attempts; i++) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await delay(100);
  }
  throw new Error(
    `Timeout ${expression}: ${(await evaluate('document.body.innerText')).slice(0, 3000)}`,
  );
}
try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; !existsSync(portFile) && i < 100; i++) await delay(100);
  assert.ok(existsSync(portFile));
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find((item) => item.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params);
    if (
      msg.method === 'Network.requestWillBeSent' &&
      msg.params.request.url.includes('/agroalert/moisture')
    )
      moistureRequests++;
    const request = pending.get(msg.id);
    if (request) {
      clearTimeout(request.timer);
      pending.delete(msg.id);
      msg.error
        ? request.reject(new Error(JSON.stringify(msg.error)))
        : request.resolve(msg.result);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', {
    url: `${process.env.HAILEX_TEST_URL ?? 'http://127.0.0.1:5173'}/#/rotation-studio`,
  });
  await waitFor(
    "document.querySelector('.agroalert-profile') && document.querySelector('.agroalert-map canvas')",
  );
  assert.ok(
    (await evaluate("document.querySelector('.agroalert-profile').innerText")).includes(
      'El Marqués',
    ),
  );
  const requestsBefore = moistureRequests;
  await evaluate(
    "(()=>{const el=[...document.querySelectorAll('label')].find(x=>x.textContent.includes('Mapa base')).querySelector('select'); el.value='satellite'; el.dispatchEvent(new Event('change',{bubbles:true}))})()",
  );
  await delay(1000);
  assert.equal(moistureRequests, requestsBefore, 'map theme must not fetch NASA');
  await evaluate(
    "[...document.querySelectorAll('.agroalert-tabs button')].find(b=>b.textContent.includes('Datos')).click()",
  );
  await waitFor("document.querySelector('.agroalert-table tbody tr')");
  assert.ok(
    (
      await evaluate(
        "document.querySelector('.agroalert-panel').innerText + document.body.innerText",
      )
    ).includes('Descargar historial CSV'),
  );
  await evaluate(
    "[...document.querySelectorAll('.agroalert-tabs button')].find(b=>b.textContent.includes('Evolución')).click()",
  );
  await waitFor("document.querySelector('.recharts-surface')");
  await evaluate(
    "(()=>{const el=[...document.querySelectorAll('label')].find(x=>x.textContent.includes('Municipio')).querySelector('select'); el.value='Colón'; el.dispatchEvent(new Event('change',{bubbles:true}))})()",
  );
  await waitFor("document.querySelector('.agroalert-profile')?.innerText.includes('Colón')");
  assert.ok(moistureRequests > requestsBefore);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(500);
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    true,
    'mobile overflow',
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(
    'PASS: El Marqués, mapa satélite sin nueva consulta, tablas, gráficas, Colón y viewport móvil',
  );
} finally {
  socket?.close();
  browser.kill();
  await delay(1000);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* Browser may still be releasing files. */ }
}
