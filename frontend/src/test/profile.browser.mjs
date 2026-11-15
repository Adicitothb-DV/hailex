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
  await evaluate("document.querySelector('.lex-trigger').click()");
  await evaluate(`(() => {
    const original = window.fetch;
    window.fetch = async (url, options) => String(url).includes('/advisor/chat')
      ? new Response(JSON.stringify({error:{code:'groq_api_key_missing',message:'La clave Groq no está configurada en el backend.'}}), {status:503,headers:{'Content-Type':'application/json'}})
      : original(url, options);
  })()`);
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
      if (String(url).includes('/advisor/tts')) {
        window.__ttsRequests = (window.__ttsRequests || 0) + 1;
        window.__ttsBody = JSON.parse(options.body);
        return new Response(new Blob(['mock audio'], {type:'audio/mpeg'}), {status:200,headers:{'Content-Type':'audio/mpeg'}});
      }
      return original(url, options);
    };
    HTMLMediaElement.prototype.play = function() { window.__played = (window.__played || 0) + 1; return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function() {};
    document.querySelectorAll('.advisor-chat fieldset input')[1].click();
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.advisor-chat form').requestSubmit()");
  await waitFor("document.querySelector('.advisor-chat').innerText.includes('Respuesta simulada')");
  assert.equal(await evaluate('window.__advisorRequest.include_siap'), false);
  assert.equal(await evaluate('window.__advisorRequest.message'), '¿Qué debo revisar?');
  assert.equal(await evaluate('window.__advisorRequest.history.length'), 0);
  assert.equal(await evaluate('window.__advisorRequest.include_web'), true);
  await waitFor('window.__ttsRequests === 1 && window.__played === 1');
  assert.ok((await evaluate('window.__ttsBody.text')).includes('Verificar agua'));
  console.log('PASS advisor success rendering and selected context (mock)');
  await evaluate(`(() => {
    const textarea = document.querySelector('.advisor-chat textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, 'Ya revisé el agua');
    textarea.dispatchEvent(new Event('input', {bubbles:true}));
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.advisor-chat form').requestSubmit()");
  await waitFor("document.querySelectorAll('.advisor-response').length === 2");
  assert.equal(await evaluate('window.__advisorRequest.history.length'), 2);
  assert.equal(await evaluate('window.__advisorRequest.history[0].content'), '¿Qué debo revisar?');
  assert.equal(await evaluate('window.__advisorRequest.message'), 'Ya revisé el agua');
  await waitFor('window.__ttsRequests === 2 && window.__played === 2');
  await evaluate("location.hash='#/dashboard'");
  await waitFor("document.querySelector('main h1')?.textContent === 'La tierra, en perspectiva.'");
  await send('Page.reload');
  await delay(500);
  await waitFor("Boolean(document.querySelector('.lex-trigger'))");
  await evaluate("document.querySelector('.lex-trigger').click()");
  await waitFor("document.querySelectorAll('.advisor-response').length === 2");
  await evaluate(
    "window.confirm=()=>true; [...document.querySelectorAll('.advisor-chat button')].find(b=>b.textContent.includes('Nueva conversación')).click()",
  );
  await waitFor("document.querySelectorAll('.advisor-response').length === 0");
  console.log('PASS follow-up history and new conversation');
  await evaluate('document.querySelector(\'[aria-label="Cerrar Lex"]\').click()');
  await evaluate(`window.SpeechRecognition = class {
    start() { window.__recognition = this; }
    abort() { this.aborted = true; }
  }`);
  await evaluate("document.querySelector('.lex-wake button').click()");
  assert.equal(
    await evaluate("document.querySelector('.lex-wake button').getAttribute('aria-pressed')"),
    'true',
  );
  await evaluate(
    `window.__recognition.onresult({resultIndex:0,results:[{isFinal:true,0:{transcript:'Oye Lex, analiza mi parcela'}}]})`,
  );
  await waitFor("document.querySelector('.advisor-chat textarea')?.value === 'analiza mi parcela'");
  assert.equal(await evaluate('window.__recognition.aborted'), true);
  assert.equal(await evaluate("document.querySelectorAll('.advisor-response').length"), 0);
  console.log('PASS opt-in wake word opens chat and preserves command for review');
  await evaluate('document.querySelector(\'[aria-label="Cerrar Lex"]\').click()');
  await evaluate("document.querySelector('.lex-wake button').click()");
  await evaluate(
    "Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'))",
  );
  assert.equal(await evaluate('window.__recognition.aborted'), true);
  assert.equal(
    await evaluate("document.querySelector('.lex-wake button').getAttribute('aria-pressed')"),
    'false',
  );
  await evaluate('delete document.hidden');
  console.log('PASS microphone stops when page is hidden');
} finally {
  socket?.close();
  browser.kill();
}
