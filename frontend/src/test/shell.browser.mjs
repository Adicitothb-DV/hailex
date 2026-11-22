import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run against an already running development server. No external test dependencies.
const baseUrl = process.env.HAILEX_TEST_URL ?? 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ??
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find(existsSync);
assert.ok(browserPath, 'Set CHROME_PATH to a Chrome/Chromium executable.');
assert.equal((await fetch(baseUrl)).status, 200, 'Start npm run dev before this test.');

const profile = mkdtempSync(join(tmpdir(), 'hailex-ui-test-'));
const browser = spawn(
  browserPath,
  [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
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
const consoleErrors = [];

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout: ${method}`));
    }, 10000);
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

async function waitFor(expression) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Condition not reached: ${expression}`);
}

const routes = [
  ['dashboard', 'La tierra, en perspectiva.'],
  ['earth-explorer', 'Earth Explorer'],
  ['climate-intelligence', 'Climate Intelligence'],
  ['rotation-studio', 'Rotation Studio'],
  ['analysis-insights', 'Analysis & Insights'],
];

try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let attempt = 0; !existsSync(portFile) && attempt < 100; attempt++) await delay(100);
  assert.ok(existsSync(portFile), 'Browser debugging port was not created.');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === 'page');
  assert.ok(target);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params);
    }
    const request = pending.get(message.id);
    if (request) {
      clearTimeout(request.timer);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
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
      await evaluate(`location.hash = '#/${route}'`);
      await waitFor(
        `document.querySelector('main h1')?.textContent === ${JSON.stringify(heading)}`,
      );
      assert.equal(await evaluate('document.querySelectorAll("main h1").length'), 1);
      assert.equal(
        await evaluate('document.documentElement.scrollWidth <= innerWidth'),
        true,
        `Overflow: ${route} at ${width}`,
      );
      assert.equal(await evaluate('document.activeElement.id'), 'main-content', 'Route focus');
      assert.equal(
        await evaluate(
          `document.querySelector('.desktop-sidebar [aria-current="page"]')?.getAttribute('href')`,
        ),
        `#/${route}`,
      );
    }
    console.log(`PASS: five routes, focus and no horizontal overflow at ${width}px`);
  }

  await evaluate('document.querySelector(\'a[href="#/dashboard"]\').click()');
  await waitFor("location.hash === '#/dashboard'");
  await evaluate("document.querySelector('.quick-links a').click()");
  await waitFor("document.title === 'Earth Explorer | HaiLex'");
  await evaluate('history.back()');
  await waitFor("document.title === 'Dashboard | HaiLex'");
  await evaluate('history.forward()');
  await waitFor("document.title === 'Earth Explorer | HaiLex'");
  await send('Page.reload');
  await waitFor(
    "document.title === 'Earth Explorer | HaiLex' && Boolean(document.querySelector('main h1'))",
  );
  console.log('PASS: navigation links, history and route reload');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate(
    "document.querySelector('.menu-button').focus(); document.querySelector('.menu-button').click()",
  );
  assert.equal(await evaluate('document.querySelector("dialog").open'), true);
  await evaluate('document.querySelector(".close-menu").focus()');
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
    modifiers: 8,
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
    modifiers: 8,
  });
  assert.equal(
    await evaluate(
      'document.activeElement === [...document.querySelectorAll("dialog a[href]")].at(-1)',
    ),
    true,
    'Shift+Tab wraps to the final navigation link',
  );
  for (let index = 0; index < 10; index++) {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
    });
    assert.equal(
      await evaluate('document.querySelector("dialog").contains(document.activeElement)'),
      true,
      'Modal focus trap',
    );
  }
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
  assert.equal(await evaluate('document.activeElement.className'), 'menu-button');
  await evaluate(
    "document.querySelector('.menu-button').click(); document.querySelector('dialog a[href=\"#/rotation-studio\"]').click()",
  );
  await waitFor(
    "document.title === 'Rotation Studio | HaiLex' && !document.querySelector('dialog').open",
  );
  assert.equal(await evaluate('document.activeElement.id'), 'main-content');
  await evaluate("document.querySelector('.menu-button').click()");
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitFor('!document.querySelector("dialog").open');
  assert.equal(await evaluate('document.activeElement.id'), 'main-content');
  console.log('PASS: mobile menu, focus trap, Escape, focus return and selection');

  await evaluate("location.hash = '#/unknown'");
  await waitFor("document.title === 'Página no encontrada | HaiLex'");
  assert.equal(
    await evaluate("document.querySelector('main a').getAttribute('href')"),
    '#/dashboard',
  );
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('.button')).transitionDuration"),
    '0s',
  );
  const resources = await evaluate(
    "performance.getEntriesByType('resource').map(entry => entry.name)",
  );
  assert.equal(
    resources.every((url) => new URL(url).origin === new URL(baseUrl).origin),
    true,
    'Unexpected external resources',
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.equal(consoleErrors.length, 0, JSON.stringify(consoleErrors));
  console.log('PASS: unknown route, reduced motion, no external resources or runtime exceptions');
} finally {
  socket?.close();
  browser.kill();
  console.log(`Temporary browser profile (outside repository): ${profile}`);
}
