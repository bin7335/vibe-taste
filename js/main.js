// 흐름 제어: 질문(6개) → 코딩 연출 → 결과(앱 + QR/바꿔보기/프롬프트/처음부터)
import { KINDS, APPS, THEMES, CHARS, LEVELS, SOUNDS, VOICES, SIZES, FXS } from './data.js';
import { $, $$, el, html, rng, newSeed, sanitizeName, isBanned, parseParams, buildQuery, describe, sfx, setSound, toast } from './util.js';
import { runBuild } from './build.js';
import { showQr, showPrompt, initModal, closeModal } from './share.js';
import { TEMPLATES } from './templates/index.js';

const QUESTIONS = [
  { key: 'kind', title: '무엇을 만들까요?', sub: '오늘 만들 앱의 큰 방향이에요.', options: () => Object.entries(KINDS) },
  { key: 'app', title: '어떤 앱이 좋아요?', sub: '넷 중 하나를 고르거나, AI에게 맡겨도 돼요.', options: S => KINDS[S.kind].apps.map(a => [a, APPS[a]]), ai: true },
  { key: 'theme', title: '어떤 분위기로 할까요?', sub: '색깔·배경·장식 효과가 바뀌어요.', options: () => Object.entries(THEMES) },
  { key: 'char', title: '주인공은 누구?', sub: '앱 안에서 응원해 주는 캐릭터예요.', options: () => Object.entries(CHARS) },
  { key: 'voice', title: '주인공은 어떤 말투로 말할까요?', sub: '응원 멘트와 격려 방식이 달라져요.', options: () => Object.entries(VOICES) },
  { key: 'level', title: '얼마나 빠르게?', sub: '게임 속도, 문제 수, 제한 시간이 달라져요.', options: () => LEVELS.map((l, i) => l && [String(i), l]).filter(Boolean) },
  { key: 'sound', title: '효과음은 어떻게 할까요?', sub: '버튼·정답·축하 소리의 음색이 바뀌어요.', options: () => Object.entries(SOUNDS) },
  { key: 'size', title: '글자와 버튼 크기는요?', sub: '누가 쓸지 생각해서 골라요.', options: () => Object.entries(SIZES) },
  { key: 'fx', title: '축하 효과는요?', sub: '화면 장식의 양이 달라져요.', options: () => Object.entries(FXS) },
  { key: 'name', title: '앱 이름을 지어 줄래요?', sub: '비워 두면 AI가 어울리는 이름을 지어 줘요. (12자까지)', text: true },
];

const fresh = () => ({ kind: null, app: null, theme: null, char: null, voice: null, level: null, sound: null, size: null, fx: null, name: '', seed: newSeed() });
let S = fresh();
let step = 0, build = null, destroyApp = null, fromLink = false;

const screens = { q: $('#scr-q'), build: $('#scr-build'), result: $('#scr-result') };
function show(name) { Object.entries(screens).forEach(([k, s]) => s.classList.toggle('on', k === name)); window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ---------- 질문 ----------
function renderSteps() {
  html($('#steps'), `<span>${Math.min(step + 1, QUESTIONS.length)} / ${QUESTIONS.length}</span><span class="dots">${QUESTIONS.map((_, i) => `<i class="${i < step ? 'done' : i === step ? 'cur' : ''}"></i>`).join('')}</span>`);
}
function renderQuestion() {
  const q = QUESTIONS[step];
  $('#hero').style.display = step === 0 ? '' : 'none';
  $('#qtitle').textContent = q.title; $('#qsub').textContent = q.sub;
  $('#back').style.visibility = step === 0 ? 'hidden' : '';
  const opts = $('#opts'); html(opts, '');
  const nameRow = $('#nameRow');
  if (q.text) {
    opts.hidden = true; nameRow.hidden = false;
    const inp = $('#nameIn'); inp.value = S.name || ''; inp.placeholder = '예: ' + describe(S).name;
    $('#qhint').textContent = '글자·숫자·♥★!? 만 쓸 수 있어요. Enter를 눌러도 만들어져요.';
    setTimeout(() => inp.focus(), 50);
  } else {
    opts.hidden = false; nameRow.hidden = true; $('#qhint').textContent = '키보드 A, B, C, D 또는 1에서 4로도 고를 수 있어요.';
    if (q.ai) { const ai = el('button', 'btn ghost', '못 고르겠어요, AI가 골라 주세요'); ai.id = 'aiPick'; ai.addEventListener('click', () => choose('__ai')); $('#qhint').before(ai); }
    $$('#aiPick').forEach((b, i) => { if (!q.ai || i > 0) b.remove(); });
    q.options(S).forEach(([val, o], i) => {
      const b = el('button', 'opt' + (o.ai ? ' ai' : ''));
      b.dataset.val = val;
      b.appendChild(el('span', 'key', 'ABCD'[i]));
      const body = el('span');
      body.appendChild(el('b', '', o.label));
      if (o.sub) body.appendChild(el('small', '', o.sub));
      b.appendChild(body);
      b.addEventListener('click', () => choose(val));
      opts.appendChild(b);
    });
  }
  const picked = $('#picked'); html(picked, '');
  const d = { kind: S.kind && KINDS[S.kind], app: S.app && APPS[S.app], theme: S.theme && THEMES[S.theme], char: S.char && CHARS[S.char], voice: S.voice && VOICES[S.voice], level: S.level && LEVELS[S.level], sound: S.sound && SOUNDS[S.sound], size: S.size && SIZES[S.size], fx: S.fx && FXS[S.fx] };
  Object.values(d).filter(Boolean).forEach(o => picked.appendChild(el('span', '', o.label)));
  renderSteps();
}
function choose(val) {
  const q = QUESTIONS[step]; sfx.tap();
  if (q.key === 'app' && val === '__ai') { val = KINDS[S.kind].apps[Math.floor(Math.random() * KINDS[S.kind].apps.length)]; toast(`AI 추천: ${APPS[val].label}`); }
  if (q.key === 'kind' && S.kind !== val) S.app = null;
  S[q.key] = q.key === 'level' ? parseInt(val, 10) : val;
  step++; renderQuestion();
}
$('#back').addEventListener('click', () => { if (step > 0) { step--; renderQuestion(); } });
function submitName() {
  const raw = $('#nameIn').value;
  const clean = sanitizeName(raw);
  if (isBanned(clean)) { toast('그 이름은 쓸 수 없어요. 다른 이름으로!'); $('#nameIn').value = ''; sfx.no(); return; }
  if (raw.trim() && !clean) toast('쓸 수 없는 글자라서 AI가 이름을 지어 줄게요');
  S.name = clean; S.seed = newSeed(); startBuild(5200);
}
$('#goBuild').addEventListener('click', submitName);
$('#nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitName(); } });
document.addEventListener('keydown', e => {
  if (!screens.q.classList.contains('on') || /INPUT|TEXTAREA/.test(document.activeElement?.tagName) || !$('#modal').hidden) return;
  const i = 'abcd'.indexOf(e.key.toLowerCase()) >= 0 ? 'abcd'.indexOf(e.key.toLowerCase()) : '1234'.indexOf(e.key);
  if (i < 0) return;
  const b = $$('#opts .opt')[i]; if (b) b.click();
});

// ---------- 코딩 연출 ----------
function startBuild(duration) {
  if (destroyApp) { destroyApp(); destroyApp = null; }
  show('build');
  if (build) build.cancel();
  build = runBuild(S, { duration, onDone: showResult });
}
$('#skip').addEventListener('click', () => build && build.skip());

// ---------- 결과 ----------
function showResult() {
  const d = describe(S);
  show('result');
  $('#rtitle').textContent = d.name;
  $('#rbadge').textContent = fromLink ? '내 폰에서 열렸어요' : '공방에서 나왔습니다';
  $('#rbadge').classList.toggle('phone', fromLink);
  $('#rmeta').textContent = `${d.kind.label}의 ${d.app.label}, ${d.theme.label} 분위기, 주인공 ${d.char.label}(${d.voice.label}), ${d.level.label}, ${d.sound.label}, ${d.size.label}, ${d.fx.label}`;
  const stage = $('#stage');
  if (destroyApp) destroyApp();
  setSound(S.sound);
  const ctx = { S, d, rng: rng(S.seed), name: d.name };
  destroyApp = TEMPLATES[S.app](stage, ctx);
  $('#tweak').hidden = true;
  history.replaceState(null, '', location.pathname + buildQuery(S));
  document.title = `${d.name} - 상상을 앱으로`;
}
$('#aQr').addEventListener('click', () => showQr(S));
$('#aPrompt').addEventListener('click', () => showPrompt(S));
$('#aHome').addEventListener('click', () => {
  if (destroyApp) { destroyApp(); destroyApp = null; }
  S = fresh();
  step = 0; fromLink = false; history.replaceState(null, '', location.pathname); document.title = '상상을 앱으로 - 바이브코딩 공방';
  renderQuestion(); show('q');
});
$('#aTweak').addEventListener('click', () => { const p = $('#tweak'); p.hidden = !p.hidden; if (!p.hidden) { renderTweak(); p.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } });

function renderTweak() {
  const body = $('#twBody'); html(body, '');
  const rows = [
    ['종류', 'kind', Object.entries(KINDS)],
    ['앱', 'app', KINDS[S.kind].apps.map(a => [a, APPS[a]])],
    ['분위기', 'theme', Object.entries(THEMES)],
    ['주인공', 'char', Object.entries(CHARS)],
    ['말투', 'voice', Object.entries(VOICES)],
    ['속도', 'level', LEVELS.map((l, i) => l && [i, l]).filter(Boolean)],
    ['효과음', 'sound', Object.entries(SOUNDS)],
    ['크기', 'size', Object.entries(SIZES)],
    ['축하 효과', 'fx', Object.entries(FXS)],
  ];
  for (const [label, key, opts] of rows) {
    body.appendChild(el('div', 'k', label));
    const chips = el('div', 'chips');
    for (const [val, o] of opts) {
      const c = el('button', 'chip' + (String(S[key]) === String(val) ? ' on' : ''), o.label);
      c.addEventListener('click', () => {
        if (String(S[key]) === String(val)) return;
        if (key === 'kind') { S.kind = val; S.app = KINDS[val].apps[0]; }
        else S[key] = key === 'level' ? Number(val) : val;
        toast(`"${label}만 ${o.label}(으)로 바꿔 줘" → 다시 빚는 중`);
        fromLink = false; startBuild(2600);
      });
      chips.appendChild(c);
    }
    body.appendChild(chips);
  }
  body.appendChild(el('div', 'k', '이름'));
  const nr = el('div', 'chips');
  const inp = el('input'); inp.maxLength = 12; inp.value = S.name; inp.placeholder = describe(S).name; inp.setAttribute('aria-label', '앱 이름 바꾸기');
  const ok = el('button', 'chip', '이름 바꾸기');
  const apply = () => { const c = sanitizeName(inp.value); if (isBanned(c)) { toast('그 이름은 쓸 수 없어요'); inp.value = ''; return; } S.name = c; fromLink = false; startBuild(2000); };
  ok.addEventListener('click', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') apply(); });
  nr.append(inp, ok); body.appendChild(nr);
}

// ---------- 시작 ----------
initModal();
const fromUrl = parseParams(location.search);
if (fromUrl) { S = fromUrl; fromLink = true; step = QUESTIONS.length; renderSteps(); startBuild(2200); }
else { renderQuestion(); show('q'); }

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/^(127\.|localhost)/.test(location.hostname)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// 자동 테스트·디버깅용 훅(사용자 데이터 없음)
window.VT = { get S() { return S; }, sanitizeName, isBanned, parseParams, buildQuery, describe, choose, skip: () => build && build.skip(), closeModal };
