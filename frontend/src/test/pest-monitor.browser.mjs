import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const profile = mkdtempSync(join(tmpdir(), 'hailex-pest-'));
const browser = spawn(
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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
let id = 0;
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const seq = ++id;
    const timeout = setTimeout(() => reject(new Error(`Timeout ${method}`)), 30000);
    pending.set(seq, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id: seq, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 200; i++) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await delay(100);
  }
  throw new Error(`Timeout: ${expression}\n${await evaluate('document.body.innerText')}`);
}
try {
  const file = join(profile, 'DevToolsActivePort');
  for (let i = 0; !existsSync(file) && i < 100; i++) await delay(100);
  assert.ok(existsSync(file), 'Chrome must start');
  const port = readFileSync(file, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
    const item = pending.get(message.id);
    if (item) {
      clearTimeout(item.timeout);
      pending.delete(message.id);
      message.error
        ? item.reject(new Error(JSON.stringify(message.error)))
        : item.resolve(message.result);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', {
    url: `${process.env.HAILEX_TEST_URL ?? 'http://127.0.0.1:5173'}/#/pest-monitor`,
  });
  await waitFor("document.querySelectorAll('.pest-sector-list button').length === 6");
  await evaluate(
    "[...document.querySelectorAll('.pest-page button')].find(b => b.textContent === 'Simulador').click()",
  );
  await waitFor(
    "document.querySelectorAll('.pest-grid article').length > 0 && document.querySelector('.pest-grid .pest-badge')?.textContent.includes('/100')",
  );
  await evaluate(
    "[...document.querySelectorAll('.pest-page button')].find(b => b.textContent === 'Temporal húmedo').click()",
  );
  await waitFor("document.querySelector('.pest-simulator').innerText.includes('58 mm')");
  await evaluate(
    "(()=>{const s=document.querySelector('.pest-card select'); s.value='cebada'; s.dispatchEvent(new Event('change',{bubbles:true}));})()",
  );
  await waitFor(
    "[...document.querySelectorAll('.pest-grid article')].every(a => a.innerText.includes('Cebada')) && document.querySelectorAll('.pest-grid article').length === 2",
  );
  await evaluate("document.querySelectorAll('.pest-sector-list button')[1].click()");
  assert.ok(
    (
      await evaluate(
        "document.querySelector('.pest-sector-list button[aria-pressed=true]').innerText",
      )
    ).includes('Amazcala'),
  );
  await evaluate(
    "[...document.querySelectorAll('.pest-hero button')].find(b => b.textContent === 'Colón').click()",
  );
  await waitFor("document.querySelectorAll('.pest-sector-list button').length === 5");
  await waitFor("document.querySelector('.pest-map canvas')");
  await evaluate(
    "[...document.querySelectorAll('.pest-page button')].find(b => b.textContent === 'Satelital').click()",
  );
  await waitFor("document.querySelector('.pest-map canvas')");
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
  assert.deepEqual(errors, []);
  console.log('PASS: navegación, simulador, escenarios, filtro, localidades, Colón, mapa y móvil');
} finally {
  socket?.close();
  browser.kill();
  await delay(1000);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* Browser may still release files. */
  }
}
