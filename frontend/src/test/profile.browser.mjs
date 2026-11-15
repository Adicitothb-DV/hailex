import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
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
const profile = mkdtempSync(join(tmpdir(), 'hailex-profile-test-'));
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
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 20000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true });
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 200; i++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Condition not reached: ${expression}`);
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
    const request = pending.get(msg.id);
    if (request) {
      clearTimeout(request.timer);
      pending.delete(msg.id);
      msg.error
        ? request.reject(new Error(JSON.stringify(msg.error)))
        : request.resolve(msg.result);
    }
  });
  await send('Page.enable');
  await send('Page.navigate', { url: `${baseUrl}/#/analysis-insights` });
  await waitFor("Boolean(document.querySelector('[name=profile-name]'))");
  async function setName(value) {
    await evaluate(`(() => {
      const input = document.querySelector('[name=profile-name]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', {bubbles:true}));
    })()`);
    await delay(100);
    await evaluate("document.querySelector('.agricultural-profile form').requestSubmit()");
    await waitFor(
      "document.querySelector('.agricultural-profile [role=status]')?.textContent.includes('guardado')",
    );
  }
  await setName('Perfil de prueba');
  await send('Page.reload');
  await waitFor("document.querySelector('[name=profile-name]')?.value === 'Perfil de prueba'");
  await setName('Perfil editado');
  assert.equal(
    await evaluate(
      "JSON.parse(localStorage.getItem('hailex-agricultural-profile-v1')).profile.name",
    ),
    'Perfil editado',
  );
  await evaluate(
    "window.confirm = () => false; document.querySelector('.agricultural-profile button[type=button]').click()",
  );
  assert.ok(await evaluate("localStorage.getItem('hailex-agricultural-profile-v1')"));
  await evaluate(
    "window.confirm = () => true; document.querySelector('.agricultural-profile button[type=button]').click()",
  );
  assert.equal(await evaluate("localStorage.getItem('hailex-agricultural-profile-v1')"), null);
  console.log('PASS profile save, reload, edit, cancelled and confirmed deletion');
  await evaluate(`(() => {
    const root = document.querySelector('.rotation-workspace');
    const select = root.querySelector('select');
    select.value = 'maiz_forrajero';
    select.dispatchEvent(new Event('change', {bubbles:true}));
    root.querySelector('input[type=checkbox]').click();
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.rotation-workspace form').requestSubmit()");
  await waitFor("Boolean(document.querySelector('.rotation-workspace ol li'))");
  assert.ok(
    (await evaluate("document.querySelector('.rotation-workspace ol li').textContent")).includes(
      'Alfalfa',
    ),
  );
  assert.ok(
    (await evaluate("document.querySelector('.rotation-workspace').innerText")).includes(
      'no confiable',
    ),
  );
  await evaluate(`(() => {
    const select = document.querySelector('.rotation-workspace select');
    select.value = 'alfalfa';
    select.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.rotation-workspace form').requestSubmit()");
  await waitFor("document.querySelectorAll('.rotation-workspace ol li').length === 4");
  assert.ok(
    (
      await evaluate("document.querySelector('.rotation-workspace ol li:last-child').textContent")
    ).includes('Alfalfa'),
  );
  console.log('PASS deterministic rotation comparison via backend');
  await evaluate(`(() => {
    const textarea = document.querySelector('.advisor-chat textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, '¿Qué debo revisar?');
    textarea.dispatchEvent(new Event('input', {bubbles:true}));
    document.querySelector('.advisor-chat input[required]').click();
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.advisor-chat form').requestSubmit()");
  await waitFor(
    "document.querySelector('.advisor-chat [role=alert]')?.textContent.includes('clave')",
  );
  assert.equal(
    await evaluate("document.querySelector('.advisor-chat textarea').value"),
    '¿Qué debo revisar?',
  );
  console.log('PASS advisor missing-key state preserves draft');
  await evaluate(`(() => {
    const original = window.fetch;
    window.fetch = async (url, options) => {
      if (String(url).includes('/advisor/chat')) {
        window.__advisorRequest = JSON.parse(options.body);
        return new Response(JSON.stringify({data:{answer:{conclusion:'Respuesta simulada',interpretation:'Revisión de campo',actions:['Verificar agua'],limitations:['Datos parciales'],follow_up_questions:[]},context:{forecast:{status:'forecast_not_reliable'}},model:'openai/gpt-oss-120b',prompt_version:'test'},warnings:[]}), {status:200,headers:{'Content-Type':'application/json'}});
      }
      return original(url, options);
    };
    document.querySelectorAll('.advisor-chat fieldset input')[1].click();
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.advisor-chat form').requestSubmit()");
  await waitFor("document.querySelector('.advisor-chat').innerText.includes('Respuesta simulada')");
  assert.equal(await evaluate('window.__advisorRequest.include_siap'), false);
  assert.equal(await evaluate('window.__advisorRequest.message'), '¿Qué debo revisar?');
  console.log('PASS advisor success rendering and selected context (mock)');
} finally {
  socket?.close();
  browser.kill();
}
