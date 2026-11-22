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
assert.equal((await fetch(baseUrl)).status, 200);
const profile = mkdtempSync(join(tmpdir(), 'hailex-preferences-'));
const browser = spawn(
  browserPath,
  [
    '--headless',
    '--disable-gpu',
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
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
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
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(msg.id);
    msg.error ? request.reject(new Error(JSON.stringify(msg.error))) : request.resolve(msg.result);
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: baseUrl });
  await waitFor("document.querySelector('.preferences-controls select') !== null");
  assert.equal(await evaluate('document.documentElement.lang'), 'en-US');
  assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light');
  for (const width of [320, 768, 1366]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert.equal(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      true,
      `Dashboard overflow at ${width}px`,
    );
  }
  for (const locale of ['en-US', 'es-MX']) {
    for (const theme of ['light', 'dark']) {
      await evaluate(
        `(() => { const selects = document.querySelectorAll('.preferences-controls select'); selects[0].value = '${locale}'; selects[0].dispatchEvent(new Event('change', { bubbles: true })); selects[1].value = '${theme}'; selects[1].dispatchEvent(new Event('change', { bubbles: true })); })()`,
      );
      await waitFor(
        `document.documentElement.lang === '${locale}' && document.documentElement.dataset.theme === '${theme}'`,
      );
      assert.equal(await evaluate("localStorage.getItem('hailex.preferences.locale')"), locale);
      assert.equal(await evaluate("localStorage.getItem('hailex.preferences.theme')"), theme);
      console.log(`PASS preference controls: ${locale}/${theme}`);
    }
  }
  await send('Page.reload');
  await waitFor(
    "document.querySelector('.preferences-controls select') !== null && document.documentElement.lang === 'es-MX' && document.documentElement.dataset.theme === 'dark'",
  );
  await evaluate("location.hash = '#/earth-explorer'");
  await waitFor("document.querySelector('.header-page')?.textContent === 'Explorador terrestre'");
  await waitFor("document.querySelector('main h1')?.textContent === 'Explorador terrestre'");
  assert.equal(
    await evaluate('document.querySelector("main h1").textContent'),
    'Explorador terrestre',
  );
  assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark');
  await evaluate(
    `(() => { const select = document.querySelector('.preferences-controls select'); select.value = 'en-US'; select.dispatchEvent(new Event('change', {bubbles:true})); })()`,
  );
  await waitFor("document.querySelector('main h1')?.textContent === 'Earth Explorer'");
  assert.ok(
    await evaluate("document.querySelector('.map-caption').textContent.includes('OpenStreetMap')"),
  );
  await evaluate(
    "localStorage.setItem('hailex.preferences.locale', 'invalid'); localStorage.setItem('hailex.preferences.theme', 'invalid')",
  );
  await send('Page.reload');
  await waitFor(
    "document.querySelector('.preferences-controls select') !== null && document.documentElement.lang === 'en-US' && document.documentElement.dataset.theme === 'light'",
  );
  console.log('PASS reload, navigation, and invalid preference fallback');
  await evaluate(`(() => {
    const original = window.fetch;
    window.__chats = []; window.__voices = []; window.__plays = 0;
    window.fetch = async (url, options) => {
      if (String(url).includes('/advisor/chat')) {
        window.__chats.push(JSON.parse(options.body));
        await new Promise(resolve => setTimeout(resolve, 300));
        return new Response(JSON.stringify({data:{answer:{conclusion:window.__answer || 'Test answer',interpretation:'',actions:[],limitations:[],follow_up_questions:[]},context:{},model:'test',prompt_version:'test'},warnings:[]}), {status:200,headers:{'Content-Type':'application/json'}});
      }
      if (String(url).includes('/advisor/tts')) {
        window.__voices.push(JSON.parse(options.body));
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (window.__ttsFail) return new Response(JSON.stringify({error:{code:'fish_audio_unavailable'}}), {status:503,headers:{'Content-Type':'application/json'}});
        return new Response(new Blob(['audio'], {type:'audio/mpeg'}), {status:200,headers:{'Content-Type':'audio/mpeg'}});
      }
      return original(url, options);
    };
    HTMLMediaElement.prototype.play = function() {
      window.__plays++;
      return window.__plays === 1 ? Promise.reject(new DOMException('blocked', 'NotAllowedError')) : Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function() {};
    document.querySelector('.lex-trigger').click();
  })()`);
  await waitFor("Boolean(document.querySelector('.advisor-chat textarea'))");
  await evaluate(`(() => {
    const text = document.querySelector('.advisor-chat textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(text, 'What should I check?');
    text.dispatchEvent(new Event('input', {bubbles:true}));
    document.querySelector('.advisor-chat input[required]').click();
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.advisor-chat form').requestSubmit()");
  await waitFor('window.__chats.length === 1');
  await evaluate(
    `(() => {const select = document.querySelector('.preferences-controls select'); select.value='es-MX'; select.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await waitFor('window.__voices.length === 1');
  assert.equal(
    await evaluate("document.querySelectorAll('.advisor-response').length"),
    0,
    'Text must wait for audio',
  );
  assert.ok(
    await evaluate(
      "document.querySelector('.advisor-chat').innerText.includes('Preparando la respuesta y el audio juntos')",
    ),
  );
  await waitFor(
    "window.__voices.length === 1 && document.querySelector('.lex-voice')?.innerText.includes('Reproducir audio')",
  );
  assert.equal(await evaluate('window.__chats[0].locale'), 'en-US');
  assert.equal(await evaluate('window.__voices[0].locale'), 'en-US');
  assert.equal(
    await evaluate("document.querySelector('.advisor-response .advisor-conclusion').textContent"),
    'Test answer',
  );
  await evaluate(
    "[...document.querySelectorAll('.lex-voice button')].find(b => b.textContent.includes('Reproducir audio')).click()",
  );
  await waitFor('window.__plays === 2');
  assert.equal(
    await evaluate('window.__voices.length'),
    1,
    'Retry should reuse the generated audio',
  );
  console.log('PASS Lex per-turn locale and blocked autoplay retry without extra TTS request');
  await evaluate(`(() => {
    window.__answer = 'Answer despite audio failure'; window.__ttsFail = true;
    const text = document.querySelector('.advisor-chat textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(text, 'Second question');
    text.dispatchEvent(new Event('input', {bubbles:true}));
  })()`);
  await delay(100);
  await evaluate("document.querySelector('.advisor-chat form').requestSubmit()");
  await waitFor('window.__voices.length === 2');
  assert.equal(
    await evaluate("document.body.innerText.includes('Answer despite audio failure')"),
    false,
  );
  await waitFor("document.body.innerText.includes('Answer despite audio failure')");
  assert.ok(
    await evaluate(
      "document.querySelector('.lex-voice').innerText.includes('Fish Audio no pudo generar')",
    ),
  );
  console.log('PASS TTS failure releases the answer with a visible error');
} finally {
  socket?.close();
  browser.kill();
}
