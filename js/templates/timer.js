// 교실 타이머: 원형 게이지, ±1분, 주인공이 중간중간 말 걸기, 끝나면 축하 효과
import { frame, btn } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d, rng } = ctx;
  let total = [10, 5, 3, 1][S.level - 1] * 60, left = total, timer = 0, running = false;

  const ring = el('div', 'ring');
  const R = 100, C = 2 * Math.PI * R;
  ring.innerHTML = `<svg viewBox="0 0 230 230" width="100%" height="100%" aria-hidden="true">
    <circle cx="115" cy="115" r="${R}" fill="none" stroke="var(--p-line)" stroke-width="16"/>
    <circle class="prog" cx="115" cy="115" r="${R}" fill="none" stroke="var(--p-ac)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/>
  </svg>`;
  const t = el('div', 't'); ring.appendChild(t);
  const prog = ring.querySelector('.prog');
  const row = el('div', 'row'); row.style.justifyContent = 'center';
  const minus = btn('−1분', 'pb sub', () => adjust(-60));
  const plus = btn('+1분', 'pb sub', () => adjust(60));
  const go = btn('시작', 'pb', toggle);
  const reset = btn('처음으로', 'pb sub', () => { stop(); left = total; render(); f.say(f.char.lines[0]); });
  row.append(minus, go, plus, reset);
  const presets = el('div', 'row'); presets.style.justifyContent = 'center';
  [1, 3, 5, 10].forEach(m => presets.appendChild(btn(`${m}분`, 'pb sub', () => { stop(); total = left = m * 60; render(); })));
  f.body.append(ring, row, presets);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function render() { t.textContent = fmt(left); prog.style.strokeDashoffset = C * (1 - left / Math.max(1, total)); prog.style.stroke = left <= 10 && left > 0 ? 'var(--color-accent-3)' : 'var(--p-ac)'; }
  function adjust(s) { total = Math.max(10, Math.min(3600, total + s)); left = Math.max(1, Math.min(total, left + s)); render(); }
  function tick() {
    left--; render();
    if (left === Math.floor(total / 2)) f.say('절반 지났어! 잘하고 있어.', 2500);
    if (left === 30) f.say('30초 남았어. 마무리하자!', 2500);
    if (left <= 5 && left > 0) sfx.tick();
    if (left <= 0) { stop(); done(); }
  }
  function toggle() { running ? stop() : start(); }
  function start() { if (left <= 0) left = total; running = true; go.textContent = '일시정지'; f.say(rng.pick(['시작! 집중하자.', f.char.lines[0]])); clearInterval(timer); timer = setInterval(tick, 1000); }
  function stop() { running = false; go.textContent = '시작'; clearInterval(timer); }
  function done() {
    f.say(f.char.cheer); sfx.win(); t.textContent = '끝!';
    for (let i = 0; i < 24; i++) {
      const s = el('span');
      Object.assign(s.style, { position: 'absolute', left: rng() * 100 + '%', top: '-30px', width: '10px', height: '16px', borderRadius: '2px', background: rng.pick(d.theme.palette), animation: `fall ${1.5 + rng() * 1.5}s linear forwards`, zIndex: 3, pointerEvents: 'none' });
      root.appendChild(s); setTimeout(() => s.remove(), 3200);
    }
  }
  render();
  return () => { clearInterval(timer); f.destroyFrame(); };
}
