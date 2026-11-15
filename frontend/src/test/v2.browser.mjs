import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const baseUrl = process.env.HAILEX_TEST_URL ?? 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ??
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find(existsSync);
assert.ok(browserPath, 'Set CHROME_PATH to Chrome/Edge');
assert.equal((await fetch(baseUrl)).status, 200);
const profile = mkdtempSync(join(tmpdir(), 'hailex-v2-'));
const browser = spawn(
  browserPath,
  [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
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
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 20000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression, attempts = 200) {
  for (let i = 0; i < attempts; i++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Condition not reached: ${expression}`);
}
const routes = [
  ['dashboard', 'La tierra, en perspectiva.'],
  ['earth-explorer', 'Earth Explorer'],
  ['climate-intelligence', 'Climate Intelligence'],
  ['rotation-studio', 'Parcel Monitoring'],
  ['analysis-insights', 'Agricultural Context'],
];
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
  await send('Page.navigate', { url: baseUrl });
  await waitFor('Boolean(document.querySelector("main h1"))');
  for (const width of [320, 768, 1024, 1366]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    for (const [route, heading] of routes) {
      await evaluate(`location.hash='#/${route}'`);
      await waitFor(
        `document.querySelector('main h1')?.textContent === ${JSON.stringify(heading)}`,
      );
      assert.equal(
        await evaluate('document.documentElement.scrollWidth <= innerWidth'),
        true,
        `Overflow ${route} ${width}`,
      );
      assert.equal(await evaluate('document.activeElement.id'), 'main-content');
    }
    console.log(`PASS five routes and overflow at ${width}px`);
  }
  await evaluate("document.querySelector('.menu-trigger').click()");
  assert.equal(await evaluate('document.querySelector("dialog").open'), true);
  assert.equal(
    await evaluate("document.querySelector('.menu-trigger').getAttribute('aria-expanded')"),
    'true',
  );
  await evaluate('document.querySelector(\'dialog a[href="#/climate-intelligence"]\').click()');
  await waitFor(
    "location.hash === '#/climate-intelligence' && !document.querySelector('dialog').open",
  );
  await evaluate("document.querySelector('.menu-trigger').click()");
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await waitFor('!document.querySelector("dialog").open');
  console.log('PASS drawer, route and Escape');
  await waitFor("document.querySelector('.connection-connected') !== null");
  await evaluate("document.querySelector('.climate-form').requestSubmit()");
  await waitFor(
    "document.querySelector('.provenance') !== null || document.querySelector('.error-state') !== null",
    450,
  );
  assert.equal(
    await evaluate("Boolean(document.querySelector('.provenance'))"),
    true,
    `Climate error: ${await evaluate("document.querySelector('.error-state')?.innerText")}`,
  );
  assert.equal(await evaluate("document.querySelectorAll('.chart-card').length"), 3);
  assert.ok(
    (await evaluate("document.querySelector('.provenance').innerText")).includes('NASA POWER'),
  );
  console.log('PASS connected backend, climate 2025 and provenance');
  await evaluate(
    "document.querySelector('.field select').value='1'; document.querySelector('.field select').dispatchEvent(new Event('change',{bubbles:true}))",
  );
  await waitFor("document.querySelector('.header-location').textContent.includes('Colón')");
  assert.equal(await evaluate("Boolean(document.querySelector('.provenance'))"), false);
  await evaluate("document.querySelector('.climate-form').requestSubmit()");
  await waitFor(
    "document.querySelector('.provenance') !== null || document.querySelector('.error-state') !== null",
    450,
  );
  assert.equal(await evaluate("Boolean(document.querySelector('.provenance'))"), true);
  console.log('PASS Colón climate and state invalidation');
  await evaluate("location.hash='#/analysis-insights'");
  await waitFor("Boolean(document.querySelector('.agriculture-table tbody tr'))");
  assert.ok(
    (await evaluate('document.body.innerText')).includes('2015, 2016, 2017, 2018, 2019, 2020'),
  );
  console.log('PASS historial agrícola y brecha temporal');
  await evaluate("location.hash='#/climate-intelligence'");
  await waitFor("Boolean(document.querySelector('.climate-form'))");
  await evaluate(
    `(() => { const inputs = document.querySelectorAll('.climate-form input[type=date]'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(inputs[0], '2026-10-01'); inputs[0].dispatchEvent(new Event('input', {bubbles:true})); setter.call(inputs[1], '2026-10-07'); inputs[1].dispatchEvent(new Event('input', {bubbles:true})); })()`,
  );
  await evaluate("document.querySelector('.climate-form').requestSubmit()");
  await waitFor(
    "document.querySelector('.provenance')?.innerText.includes('2026-10-01') || Boolean(document.querySelector('.error-state'))",
    450,
  );
  if (await evaluate("Boolean(document.querySelector('.provenance'))")) {
    const radiation = await evaluate("document.querySelectorAll('.chart-card')[2].innerText");
    console.log(
      `Radiation missing-data state: ${radiation.includes('0 válidos') ? 'empty (verified)' : 'provider returned values'}`,
    );
  } else console.log('Recent provider query unavailable; missing-data test not verified');
  await evaluate("location.hash='#/earth-explorer'");
  await waitFor("Boolean(document.querySelector('.map-canvas'))");
  await delay(6000);
  console.log(
    `Map status: ${await evaluate("document.querySelector('.map-warning') ? 'fallback' : document.querySelector('.map-overlay') ? 'loading' : 'ready'")}`,
  );
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*tiles.openfreemap.org*'] });
  await evaluate("location.hash='#/dashboard'");
  await waitFor("document.querySelector('main h1')?.textContent === 'La tierra, en perspectiva.'");
  await evaluate("location.hash='#/earth-explorer'");
  await waitFor("Boolean(document.querySelector('.map-warning'))", 200);
  console.log('PASS map unavailable fallback');
  await send('Network.setBlockedURLs', { urls: ['*127.0.0.1:8000*'] });
  await evaluate("document.querySelector('.connection').click()");
  await waitFor("Boolean(document.querySelector('.connection-disconnected'))");
  await evaluate("location.hash='#/climate-intelligence'");
  await waitFor("Boolean(document.querySelector('.climate-form'))");
  await evaluate("document.querySelector('.climate-form').requestSubmit()");
  await waitFor("Boolean(document.querySelector('.error-state'))");
  assert.ok(
    (await evaluate("document.querySelector('.error-state').innerText")).includes('Reintentar'),
  );
  console.log('PASS disconnected backend and retry state');
  await evaluate("location.hash='#/analysis-insights'");
  await waitFor("Boolean(document.querySelector('[role=alert]'))");
  console.log('PASS agricultural backend failure');
  await send('Network.setBlockedURLs', { urls: [] });
  for (const [route] of routes) {
    await evaluate(`location.hash='#/${route}'`);
    await delay(800);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(profile, `${route}.png`), Buffer.from(shot.data, 'base64'));
  }
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('.menu-trigger')).transitionDuration"),
    '0s',
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(`PASS reduced motion, no runtime exceptions; screenshots: ${profile}`);
} finally {
  socket?.close();
  browser.kill();
  console.log(`Temporary profile: ${profile}`);
}
