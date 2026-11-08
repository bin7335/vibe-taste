// 비트 메이커: 4악기 × 8박 격자. 난이도 → 빠르기
import { frame, btn, stat } from './common.js';
import { el, beep, sfx } from '../util.js';

const ROWS = [['킥', 90, 'sine', 0.25], ['스네어', 220, 'square', 0.08], ['하이햇', 2400, 'triangle', 0.04], ['멜로디', 440, 'triangle', 0.1]];

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, rng, d } = ctx;
  let bpm = [80, 100, 120, 140][S.level - 1];
  const STEPS = 8;
  const grid = Array.from({ length: ROWS.length }, () => Array(STEPS).fill(false));
  // 시드로 첫 패턴을 깔아 두어 빈 화면이 아니게
  for (let c = 0; c < STEPS; c++) { if (c % 2 === 0) grid[0][c] = true; if (c % 4 === 2) grid[1][c] = true; if (rng() < 0.6) grid[2][c] = true; if (rng() < 0.35) grid[3][c] = true; }
  const melody = [262, 294, 330, 392, 440, 523, 392, 330];

  const top = el('div', 'row');
  const play = btn('재생', 'pb', toggle);
  const sBpm = stat('빠르기', bpm + ' BPM');
  top.append(play, btn('느리게', 'pb sub', () => { bpm = Math.max(60, bpm - 10); sBpm.set(bpm + ' BPM'); if (timer) { stop(); start(); } }), sBpm, btn('빠르게', 'pb sub', () => { bpm = Math.min(200, bpm + 10); sBpm.set(bpm + ' BPM'); if (timer) { stop(); start(); } }), btn('비우기', 'pb sub', () => { grid.forEach(r => r.fill(false)); paint(); }), btn('랜덤', 'pb sub', () => { grid.forEach((r, i) => r.forEach((_, c) => r[c] = Math.random() < [0.5, 0.3, 0.6, 0.35][i])); paint(); }));
  const table = el('div'); table.style.cssText = `display:grid;grid-template-columns:72px repeat(${STEPS},minmax(0,1fr));gap:6px;align-items:center`;
  const cells = [];
  ROWS.forEach((r, i) => {
    const lab = el('div', 'stat', r[0]); lab.style.textAlign = 'center'; table.appendChild(lab);
    cells[i] = [];
    for (let c = 0; c < STEPS; c++) {
      const b = el('button'); b.style.cssText = 'aspect-ratio:1;border:0;border-radius:var(--radius-input);background:var(--p-card);box-shadow:inset 0 0 0 1px var(--p-line);transition:background-color var(--dur-micro) linear;min-height:36px';
      b.setAttribute('aria-label', `${r[0]} ${c + 1}박`);
      b.addEventListener('click', () => { grid[i][c] = !grid[i][c]; paint(); sfx.tap(); });
      table.appendChild(b); cells[i][c] = b;
    }
  });
  f.body.append(top, table);

  let timer = 0, step = 0;
  function paint() { cells.forEach((row, i) => row.forEach((b, c) => { b.style.background = grid[i][c] ? (i === 3 ? 'var(--p-ac-deep)' : 'var(--p-ac)') : 'var(--p-card)'; b.style.outline = c === step && timer ? '3px solid var(--p-ink)' : ''; })); }
  function tickStep() {
    ROWS.forEach((r, i) => { if (grid[i][step]) beep(i === 3 ? melody[step] : r[1], i === 0 ? 0.18 : 0.08, r[2], r[3]); });
    paint(); step = (step + 1) % STEPS;
  }
  function start() { step = 0; timer = setInterval(tickStep, 60000 / bpm / 2); play.textContent = '멈춤'; tickStep(); f.say('칸을 눌러 바꾸면 바로 반영돼!'); }
  function stop() { clearInterval(timer); timer = 0; play.textContent = '재생'; paint(); }
  function toggle() { timer ? stop() : start(); }
  paint();
  return () => { clearInterval(timer); f.destroyFrame(); };
}
