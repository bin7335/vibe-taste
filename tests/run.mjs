// 자동 테스트: 로컬 정적 서버 + 헤드리스 크롬(CDP)
// 실행: node tests/run.mjs   (저장소 루트에서, 크롬 필요)
// 검사: 모듈 로드 오류 0, 외부 요청 0, 375px 가로 넘침 없음, 8개 앱 틀 전부 마운트·조작, URL 복원·시드 고정, 이름 필터·XSS, QR·프롬프트·바꿔보기
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const port = 9700 + Math.floor(Math.random() * 200);
const udd = path.join(process.env.TEMP || '/tmp', 'vibe-taste-test-' + port);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${udd}`, '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
let wsUrl; for (let i = 0; i < 100 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
if (!wsUrl) { console.error('크롬 연결 실패'); process.exit(2); }
const sock = new WebSocket(wsUrl); await new Promise(r => sock.onopen = r);
let seq = 0; const pend = new Map(); let errors = [], requests = [];
sock.onmessage = ev => {
  const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  const p = m.params;
  if (m.method === 'Runtime.exceptionThrown') errors.push('예외: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text).split('\n')[0]);
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') errors.push('console.error: ' + p.args.map(a => a.value ?? a.description).join(' ').slice(0, 200));
  if (m.method === 'Log.entryAdded' && p.entry.level === 'error' && !/favicon/.test(p.entry.url || '')) errors.push('log: ' + p.entry.text);
  if (m.method === 'Network.requestWillBeSent') requests.push(p.request.url);
  if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true });
};
const send = (method, params = {}) => new Promise((r, j) => { const i = ++seq; const t = setTimeout(() => j(new Error('timeout ' + method)), 30000); pend.set(i, m => { clearTimeout(t); r(m); }); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr, timeout = 30000) => {
  const r = await send('Runtime.evaluate', { expression: `Promise.race([(async()=>{${expr}})(), new Promise((_,j)=>setTimeout(()=>j(new Error('시간 초과')),${timeout}))])`, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description?.split('\n')[0] || r.result.exceptionDetails.text);
  return r.result.result.value;
};
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.open=()=>null;HTMLAnchorElement.prototype.click=function(){if(this.hasAttribute('download'))window.__dl=(window.__dl||0)+1;};` });
const metrics = (w, h, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
const load = async (url, wait = 1200) => { errors = []; requests = []; await send('Page.navigate', { url }); await sleep(wait); };

const H = `const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const wait=ms=>new Promise(r=>setTimeout(r,ms));const assert=(c,m)=>{if(!c)throw new Error('assert: '+m)};
const click=s=>{const e=typeof s==='string'?$(s):s;if(!e)throw new Error('없음 '+s);e.click();};
const btns=()=>$$('#stage button').filter(b=>!b.disabled&&b.offsetWidth>0);`;
const XSS = `"'><img src=x onerror="window.__xss=1"><svg onload="window.__xss=1">`;
const results = []; const t = async (name, fn) => { try { const r = await fn(); results.push({ name, ok: true, r }); console.log('✓', name, r ?? ''); } catch (e) { results.push({ name, ok: false, e: e.message }); console.log('✗', name, '\n   ', e.message); } };
const noErrors = (label) => { const e = [...new Set(errors)].filter(x => !/AudioContext|NotAllowedError/.test(x)); if (e.length) throw new Error(label + ' 오류: ' + e.join(' / ')); };
const noExternal = () => { const ext = requests.filter(u => !u.startsWith(ORIGIN) && !/^(data|blob|about):/.test(u)); if (ext.length) throw new Error('외부 요청: ' + ext.join(' ')); };

await metrics(1280, 720, false);
await t('첫 화면 로드·오류 0·외부 요청 0', async () => { await load(ORIGIN + '/'); noErrors('로드'); noExternal(); const n = await ev(`return document.body.innerText.length`); if (n < 100) throw new Error('글자 적음'); return n + '자'; });
await t('375px 가로 넘침 없음(첫 화면)', async () => { await metrics(375, 812, true); await load(ORIGIN + '/'); const w = await ev(`return document.documentElement.scrollWidth`); if (w > 380) throw new Error('scrollWidth ' + w); await metrics(1280, 720, false); return w; });

await t('질문 흐름: 선택 → 이름 → 만들기 → 결과', async () => {
  await load(ORIGIN + '/');
  return await ev(`${H}
    assert($$('#opts .opt').length===4,'1번 질문 4지선다'); assert($('#nameRow').offsetParent===null,'이름칸 숨김');
    click($$('#opts .opt')[1]); assert($$('#opts .opt').length===3,'2번 질문: 2개 + AI 추천'); click($$('#opts .opt')[2]);
    assert(['quiz','typing'].includes(VT.S.app),'AI 추천이 공부 앱 중 하나');
    click($$('#opts .opt')[2]); click($$('#opts .opt')[3]); click($$('#opts .opt')[0]);
    assert($('#nameRow').offsetParent!==null,'이름칸 보임'); assert($('#opts').offsetParent===null,'보기 숨김');
    $('#nameIn').value='내 퀴즈'; click('#goBuild'); await wait(400);
    assert($('#scr-build').classList.contains('on'),'코딩 화면'); assert($('#code').textContent.length>20,'코드 타이핑 시작');
    VT.skip(); await wait(900);
    assert($('#scr-result').classList.contains('on'),'결과 화면'); assert($('#rtitle').textContent.includes('내 퀴즈'),'제목에 이름');
    assert(location.search.includes('n=')&&location.search.includes('t=forest')&&location.search.includes('c=ghost')&&location.search.includes('d=1'),'URL 상태 '+location.search);
    return VT.S.app+' '+location.search;`);
});
await t('키보드 A-D로 선택', async () => { await load(ORIGIN + '/'); return await ev(`${H} document.dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})); assert(VT.S.kind==='art','D → 예술'); document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',bubbles:true})); assert(VT.S.app==='paint','1 → 그림판'); return 'ok';`); });
await t('이름 필터: 금지어 거부·특수문자 제거·12자 제한', async () => ev(`${H}
  assert(VT.isBanned('ㅅ ㅂ 퀴즈'),'띄어쓴 금지어'); assert(!VT.isBanned('신발 가게'),'정상 이름 통과');
  assert(VT.sanitizeName('<b>x</b>')==='bxb','꺾쇠 제거: '+VT.sanitizeName('<b>x</b>'));
  assert(VT.sanitizeName('가나다라마바사아자차카타파하').length===12,'12자');
  assert(VT.sanitizeName('  별빛   냥이 ♥ ')==='별빛 냥이 ♥','공백 정리'); return 'ok';`));

const CASES = [
  ['reaction', 'space', 'robot', 4], ['dodge', 'sea', 'cat', 2], ['quiz', 'forest', 'dino', 3], ['typing', 'candy', 'ghost', 1],
  ['timer', 'space', 'cat', 4], ['picker', 'sea', 'robot', 1], ['paint', 'forest', 'ghost', 2], ['piano', 'candy', 'dino', 3],
];
for (const [a, th, c, d] of CASES) {
  await t(`앱 틀 ${a}: URL로 열기·마운트·버튼 연타·오류 0`, async () => {
    await load(`${ORIGIN}/?a=${a}&t=${th}&c=${c}&d=${d}&s=12345&n=${encodeURIComponent('테스트 앱')}`, 600);
    const r = await ev(`${H} VT.skip(); await wait(900);
      assert($('#scr-result').classList.contains('on'),'결과 화면 바로'); assert($('#rbadge').textContent.includes('폰'),'링크로 연 배지');
      assert($('#stage .app h3').textContent.includes('테스트 앱'),'제목'); assert($$('#stage .fx span').length>0,'장식 효과');
      const bg=$('#stage').style.getPropertyValue('--p-bg'); assert(bg.includes('oklch'),'테마 배경 '+bg);
      let n=0; for(let r=0;r<2;r++) for(const b of btns()){ b.click(); n++; await wait(30); }
      for(const i of $$('#stage input:not([type=checkbox]), #stage textarea')){ i.value=${JSON.stringify(XSS)}; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); }
      for(const b of btns().slice(0,8)){ b.click(); await wait(30); }
      const cv=$('#stage canvas'); if(cv){ const r=cv.getBoundingClientRect(); for(const [x,y] of [[.3,.5],[.5,.5],[.7,.6]]) { const o={clientX:r.left+r.width*x,clientY:r.top+r.height*y,bubbles:true,pointerId:1}; cv.dispatchEvent(new PointerEvent('pointerdown',o)); cv.dispatchEvent(new PointerEvent('pointermove',o)); cv.dispatchEvent(new PointerEvent('pointerup',o)); } }
      const pad=$('#stage .pad'); if(pad){ pad.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); await wait(100); pad.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); }
      for(const k of ['ArrowLeft','ArrowRight','a','d',' ']) { document.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:k===' '?'Space':k,bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true})); }
      await wait(1200);
      assert(!window.__xss,'XSS 실행됨'); return n+'번 클릭';`, 40000);
    noErrors(a); noExternal(); return r;
  });
}
await t('375px: 결과 화면(피하기·피아노) 가로 넘침 없음', async () => {
  await metrics(375, 812, true); const out = [];
  for (const a of ['dodge', 'piano', 'paint', 'picker']) { await load(`${ORIGIN}/?a=${a}&t=sea&c=cat&d=2&s=1`, 500); const w = await ev(`${H} VT.skip(); await wait(800); return document.documentElement.scrollWidth`); if (w > 380) throw new Error(a + ' scrollWidth ' + w); out.push(w); }
  await metrics(1280, 720, false); return out.join(',');
});
await t('시드 고정: 같은 주소 → 같은 퀴즈 순서·이름', async () => {
  const one = async () => { await load(`${ORIGIN}/?a=quiz&t=space&c=robot&d=2&s=777`, 500); return ev(`${H} VT.skip(); await wait(800); return $('#stage .q').textContent+'|'+$$('#stage .choices button').map(b=>b.textContent).join()+'|'+$('#rtitle').textContent`); };
  const a = await one(), b = await one(); if (a !== b) throw new Error('다름'); return a.slice(0, 40);
});
await t('잘못된 URL 파라미터·금지어 이름 무시', async () => {
  await load(`${ORIGIN}/?a=evil&t=space&c=cat`, 500);
  const q = await ev(`return document.querySelector('#scr-q').classList.contains('on')`); if (!q) throw new Error('질문 화면이어야 함');
  await load(`${ORIGIN}/?a=quiz&t=space&c=cat&d=99&s=-5&n=${encodeURIComponent('씨발 퀴즈')}#${encodeURIComponent(XSS)}`, 500);
  return ev(`${H} assert(VT.S.level===4,'d 상한 4'); assert(VT.S.seed>0,'시드 양수'); assert(VT.S.name==='','금지어 이름 비움'); VT.skip(); await wait(800); assert(!window.__xss,'xss'); return VT.describe(VT.S).name;`);
});
await t('QR 모달·프롬프트 모달·하나만 바꿔보기', async () => {
  await load(`${ORIGIN}/?a=timer&t=candy&c=ghost&d=2&s=42&n=${encodeURIComponent('내 타이머')}`, 500);
  const r = await ev(`${H} VT.skip(); await wait(800);
    click('#aQr'); assert(!$('#modal').hidden&&$('#sheet svg path'),'QR SVG'); assert($('#sheet .url').textContent.includes('a=timer'),'QR 주소'); VT.closeModal();
    click('#aPrompt'); const p=$('#sheet textarea').value; assert(p.includes('타이머')&&p.includes('내 타이머')&&p.includes('사탕')&&p.includes('유령'),'프롬프트 내용'); VT.closeModal();
    click('#aTweak'); assert(!$('#tweak').hidden,'바꿔보기 패널'); const chips=$$('#twBody .chip'); const sea=chips.find(c=>c.textContent.includes('바다')); click(sea); await wait(300);
    assert($('#scr-build').classList.contains('on'),'다시 코딩 화면'); VT.skip(); await wait(900);
    assert(VT.S.theme==='sea'&&VT.S.seed===42&&VT.S.name==='내 타이머','테마만 바뀌고 시드·이름 유지'); assert($('#rmeta').textContent.includes('바다'),'메타 갱신');
    click('#aHome'); assert($('#scr-q').classList.contains('on')&&location.search==='','처음으로'); return 'ok';`, 40000);
  noErrors('모달'); return r;
});
await t('서비스워커·매니페스트 파일 존재·JSON 유효', async () => {
  JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  for (const f of sw.match(/'\.\/[^']+'/g).map(s => s.slice(3, -1)).filter(Boolean)) if (!fs.existsSync(path.join(ROOT, f))) throw new Error('캐시 목록에 없는 파일: ' + f);
  return 'ok';
});

const fail = results.filter(r => !r.ok).length;
console.log(`\n${results.length}개 검사 · 실패 ${fail}건`);
fs.writeFileSync(path.join(ROOT, 'tests', 'report.json'), JSON.stringify(results, null, 1));
sock.close(); chrome.kill(); server.close(); await sleep(400); try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(fail ? 1 : 0);
