// 사다리타기: 이름과 결과를 넣으면 주인공이 사다리를 타고 내려가 짝을 정해 준다. 난이도 → 타는 속도
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';
import { SAMPLE_NAMES } from '../data.js';

const ROWS = 9, MIN = 2, MAX = 6;
const FONT = 'system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const EMOJI = 'system-ui, "Apple Color Emoji", "Segoe UI Emoji"';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d, rng } = ctx;
  const seconds = [4, 2.8, 1.8, 1.1][S.level - 1]; // 한 명이 다 내려가는 데 걸리는 시간(화면 크기와 상관없이 같게)
  const pool = rng.shuffle(SAMPLE_NAMES).slice(0, MAX);
  const pal = d.theme.palette;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let n = 4, names = pool.slice(0, n), results = winOne(n);
  let rungs = [], shown = false, runners = [], ends = {}, raf = 0, last = 0, W = 0, H = 0;

  // ---------- 화면 ----------
  const top = el('div', 'row');
  const go = btn('출발!', 'pb', () => (allDone() ? reset('사다리를 새로 놓았어. 다시 해 보자!') : run(pending())));
  const mix = btn('다시 섞기', 'pb sub', () => reset('사다리를 새로 놓았어!'));
  const minus = btn('−', 'pb sub', () => resize(n - 1)); minus.setAttribute('aria-label', '인원 줄이기');
  const sN = stat('인원', n);
  const plus = btn('+', 'pb sub', () => resize(n + 1)); plus.setAttribute('aria-label', '인원 늘리기');
  top.append(go, mix, minus, sN, plus);

  const field = (label, value) => {
    const row = el('div', 'row'); row.style.flexWrap = 'nowrap';
    const tag = el('span', 'stat', label); tag.style.flex = 'none';
    const inp = el('input'); inp.value = value; inp.maxLength = 80; inp.autocomplete = 'off'; inp.setAttribute('aria-label', label + ' (쉼표로 나눠 적기)');
    inp.style.flex = '1'; inp.style.minWidth = '0';
    row.append(tag, inp);
    return { row, inp };
  };
  const fNames = field('이름', names.join(', '));
  const fRes = field('결과', results.join(', '));
  const presets = el('div', 'row');
  presets.append(
    btn('당첨 1명', 'pb sub', () => setResults(winOne(n))),
    btn('순서 정하기', 'pb sub', () => setResults(Array.from({ length: n }, (_, i) => `${i + 1}번`))),
    el('span', 'stat', '쉼표로 나눠 적어요 · 이름을 누르면 한 명만 출발'),
  );
  const wrap = el('div');
  const canvas = el('canvas'); canvas.style.touchAction = 'pan-y'; canvas.style.cursor = 'pointer';
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', '사다리. 결과는 아래 목록에 글로 나와요.');
  wrap.appendChild(canvas);
  const board = el('div', 'row'); board.setAttribute('aria-live', 'polite');
  f.body.append(top, fNames.row, wrap, fRes.row, presets, board);
  const g = canvas.getContext('2d');

  // ---------- 사다리 만들기 ----------
  function winOne(k) { const a = Array.from({ length: k }, () => '통과'); a[rng.int(k)] = '당첨'; return a; }
  function makeLadder() {
    rungs = Array.from({ length: ROWS }, () => { const row = []; for (let i = 0; i < n - 1; i++) row[i] = !row[i - 1] && rng() < 0.5; return row; });
    for (let i = 0; i < n - 1; i++) { // 기둥 사이마다 다리가 적어도 하나는 있게
      if (rungs.some(row => row[i])) continue;
      const free = rungs.filter(row => !row[i - 1] && !row[i + 1]);
      (free.length ? rng.pick(free) : rungs[rng.int(ROWS)])[i] = true;
    }
  }
  const padX = () => Math.max(30, Math.min(80, W * 0.1));
  const colX = i => padX() + i * (W - 2 * padX()) / (n - 1);
  const yTop = () => 62, yBot = () => H - 60;
  const rowY = r => yTop() + (r + 0.5) * (yBot() - yTop()) / ROWS;
  function pathOf(c) { // c번 기둥에서 출발했을 때 지나는 점들
    const pts = [[colX(c), yTop()]];
    for (let r = 0; r < ROWS; r++) {
      const to = rungs[r][c] ? c + 1 : (c > 0 && rungs[r][c - 1]) ? c - 1 : c;
      if (to !== c) { pts.push([colX(c), rowY(r)], [colX(to), rowY(r)]); c = to; }
    }
    pts.push([colX(c), yBot()]);
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { pts, len, end: c };
  }

  // ---------- 그리기 ----------
  const clip = s => (s.length > 5 ? s.slice(0, 4) + '…' : s);
  const line = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const box = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
  function trail(who, frac) { // 지나온 길과 주인공
    const p = pathOf(who); let left = p.len * frac, x = p.pts[0][0], y = p.pts[0][1];
    g.strokeStyle = pal[who % 5]; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y);
    for (let i = 1; i < p.pts.length && left > 0; i++) {
      const [nx, ny] = p.pts[i], seg = Math.hypot(nx - x, ny - y), k = seg ? Math.min(1, left / seg) : 1;
      x += (nx - x) * k; y += (ny - y) * k; left -= seg; g.lineTo(x, y);
    }
    g.stroke();
    g.font = `26px ${EMOJI}`; g.fillText(d.char.emoji, x, y - (frac >= 1 ? 16 : 0));
  }
  function draw() {
    if (!W) return;
    g.clearRect(0, 0, W, H);
    const gap = (W - 2 * padX()) / (n - 1), fs = Math.round(Math.max(12, Math.min(19, gap * 0.25)));
    g.lineCap = 'round'; g.lineJoin = 'round'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = d.theme.ink; g.globalAlpha = 0.4; g.lineWidth = 5;
    for (let i = 0; i < n; i++) line(colX(i), yTop(), colX(i), yBot());
    if (shown) rungs.forEach((row, r) => row.forEach((on, i) => { if (on) line(colX(i), rowY(r), colX(i + 1), rowY(r)); }));
    g.globalAlpha = 1;
    if (!shown) { // 출발 전에는 다리를 가려 둔다
      const w = Math.min(W - 32, 300), y = (yTop() + yBot()) / 2;
      g.fillStyle = d.theme.ac; box(W / 2 - w / 2, y - 24, w, 48, 14); g.fill();
      g.fillStyle = d.theme.acInk; g.font = `700 ${Math.min(17, fs + 2)}px ${FONT}`; g.fillText('출발하면 사다리가 나타나요', W / 2, y + 1);
    }
    for (let i = 0; i < n; i++) {
      g.fillStyle = d.theme.ink; g.font = `700 ${fs}px ${FONT}`; g.fillText(clip(names[i]), colX(i), 28);
      g.fillStyle = pal[i % 5]; g.beginPath(); g.arc(colX(i), yTop(), 7, 0, Math.PI * 2); g.fill();
      const cw = Math.min(gap - 8, 104), cx = colX(i) - cw / 2, cy = yBot() + 14, who = Object.keys(ends).find(k => ends[k] === i);
      g.fillStyle = d.theme.card; box(cx, cy, cw, 34, 10); g.fill();
      g.strokeStyle = who != null ? pal[who % 5] : d.theme.line; g.lineWidth = who != null ? 4 : 1.5; box(cx, cy, cw, 34, 10); g.stroke();
      g.fillStyle = d.theme.ink; g.font = `700 ${fs}px ${FONT}`; g.fillText(clip(results[i]), colX(i), cy + 18);
    }
    Object.keys(ends).forEach(k => trail(Number(k), 1));
    runners.forEach(r => trail(r.who, r.frac));
  }
  function fitCanvas() {
    const w = Math.max(260, Math.round(wrap.clientWidth || 600)), h = w < 520 ? 340 : 400, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w === W && h === H) return;
    W = w; H = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.height = h + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  // ---------- 타기 ----------
  const isDone = i => i in ends;
  const allDone = () => Object.keys(ends).length >= n;
  const pending = () => Array.from({ length: n }, (_, i) => i).filter(i => !isDone(i));
  function run(list) {
    list = list.filter(i => !isDone(i) && !runners.some(r => r.who === i));
    if (!list.length) return;
    shown = true; sfx.tap(); go.disabled = true;
    const avg = Array.from({ length: n }, (_, i) => pathOf(i).len).reduce((a, b) => a + b, 0) / n; // 길이 긴 사람이 조금 늦게 도착
    list.forEach(i => runners.push({ who: i, frac: still ? 1 : 0, ms: seconds * 1000 * Math.max(0.75, Math.min(1.3, pathOf(i).len / avg)) }));
    f.say(list.length > 1 ? '모두 출발! 누가 어디로 갈까?' : `${names[list[0]]}, 출발!`);
    if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
  }
  function loop(now) {
    raf = 0;
    const dt = last ? Math.min(50, now - last) : 16; last = now;
    for (const r of runners) r.frac = Math.min(1, r.frac + dt / r.ms);
    const fin = runners.filter(r => r.frac >= 1);
    runners = runners.filter(r => r.frac < 1);
    fin.forEach(r => {
      const end = pathOf(r.who).end; ends[r.who] = end; sfx.tick();
      board.appendChild(el('span', 'stat', `${names[r.who]} → ${results[end]}`));
    });
    draw();
    if (runners.length) { raf = requestAnimationFrame(loop); return; }
    go.disabled = false;
    if (allDone()) { go.textContent = '다시 하기'; sfx.win(); f.say(`모두 도착! ${f.char.cheer}`); }
    else if (fin.length) { const w = fin[fin.length - 1].who; sfx.ok(); f.say(`${names[w]} → ${results[ends[w]]}!`); }
  }
  function reset(msg) { // 새 사다리를 놓고 처음 상태로
    cancelAnimationFrame(raf); raf = 0; runners = []; ends = {}; shown = false;
    board.textContent = ''; go.textContent = '출발!'; go.disabled = false;
    makeLadder(); draw();
    if (msg) f.say(msg);
  }
  const parse = v => String(v).split(/[,\n，、]/).map(s => s.trim().slice(0, 10)).filter(Boolean);
  const fit = (arr, fill) => Array.from({ length: n }, (_, i) => arr[i] ?? fill(i));
  function resize(k) {
    k = Math.max(MIN, Math.min(MAX, k)); if (k === n) return;
    n = k; names = fit(names, i => pool[i] || `${i + 1}번`); results = fit(results, () => '통과');
    fNames.inp.value = names.join(', '); fRes.inp.value = results.join(', '); sN.set(n);
    reset(`${n}명이 탈 사다리야!`);
  }
  function setResults(arr) { results = arr; fRes.inp.value = arr.join(', '); reset('결과를 바꿨어. 출발해 볼까?'); }
  fNames.inp.addEventListener('input', () => { names = fit(parse(fNames.inp.value), i => `${i + 1}번`); reset(); });
  fRes.inp.addEventListener('input', () => { results = fit(parse(fRes.inp.value), () => '통과'); reset(); });
  canvas.addEventListener('click', e => { // 이름 근처를 누르면 그 사람만 출발
    const b = canvas.getBoundingClientRect(), x = (e.clientX - b.left) * (W / b.width), y = (e.clientY - b.top) * (H / b.height);
    if (y > yTop() + 24) return;
    let best = 0; for (let i = 1; i < n; i++) if (Math.abs(colX(i) - x) < Math.abs(colX(best) - x)) best = i;
    run([best]);
  });

  makeLadder();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(fitCanvas) : null;
  if (ro) ro.observe(wrap);
  fitCanvas();
  return () => { cancelAnimationFrame(raf); if (ro) ro.disconnect(); f.destroyFrame(); };
}
