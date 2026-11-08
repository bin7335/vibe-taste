// 짝 맞추기: 뒤집어서 같은 그림 두 장 찾기. 난이도 → 짝 수
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d, rng } = ctx;
  const pairs = [4, 6, 8, 10][S.level - 1];
  const faces = [d.char.emoji, ...d.theme.glyphs, '★', '●', '▲', '■', '◆', '♥'].slice(0, pairs);

  const top = el('div', 'row');
  const sMoves = stat('뒤집기', 0), sFound = stat('찾은 짝', `0 / ${pairs}`), sTime = stat('시간', '0초');
  const again = btn('다시 섞기', 'pb sub', deal);
  top.append(sMoves, sFound, sTime, again);
  const grid = el('div');
  grid.style.cssText = 'display:grid;gap:8px;max-width:620px;width:100%;margin:0 auto';
  grid.style.gridTemplateColumns = `repeat(${pairs <= 6 ? 4 : 5}, minmax(0, 1fr))`;
  f.body.append(top, grid);

  let open = [], found = 0, moves = 0, lock = false, t0 = 0, timer = 0, cards = [];
  function deal() {
    clearInterval(timer); open = []; found = 0; moves = 0; lock = false; t0 = 0;
    sMoves.set(0); sFound.set(`0 / ${pairs}`); sTime.set('0초');
    grid.textContent = '';
    cards = rng.shuffle([...faces, ...faces]).map((face, i) => {
      const b = el('button', 'card');
      b.style.cssText = 'aspect-ratio:1;border:0;border-radius:var(--radius-input);background:var(--p-ac);color:var(--p-ac-ink);font-size:32px;font-weight:700;box-shadow:0 3px 0 0 var(--p-ac-deep);transition:background-color var(--dur-micro) linear';
      b.setAttribute('aria-label', '카드 ' + (i + 1));
      b.addEventListener('click', () => flip(b, face));
      grid.appendChild(b); return b;
    });
    f.say('같은 그림 두 장을 찾아 봐!');
  }
  function show(b, face, on) { b.textContent = on ? face : ''; b.style.background = on ? 'var(--p-card)' : 'var(--p-ac)'; b.style.color = on ? 'var(--p-ink)' : 'var(--p-ac-ink)'; }
  function flip(b, face) {
    if (lock || b.disabled || open.some(o => o.b === b)) return;
    if (!t0) { t0 = performance.now(); timer = setInterval(() => sTime.set(Math.floor((performance.now() - t0) / 1000) + '초'), 500); }
    show(b, face, true); open.push({ b, face }); sfx.tap();
    if (open.length < 2) return;
    moves++; sMoves.set(moves);
    const [a, c] = open;
    if (a.face === c.face) {
      a.b.disabled = c.b.disabled = true; a.b.style.opacity = c.b.style.opacity = '0.55'; open = []; found++; sFound.set(`${found} / ${pairs}`); sfx.ok();
      if (found === pairs) { clearInterval(timer); f.say(`${moves}번 만에 다 찾았어! ${f.char.cheer}`); sfx.win(); }
      else f.say(rng.pick(['짝!', f.char.lines[1], '좋아, 하나 더']), 1200);
    } else {
      lock = true; setTimeout(() => { show(a.b, a.face, false); show(c.b, c.face, false); open = []; lock = false; }, 650);
    }
  }
  deal();
  return () => { clearInterval(timer); f.destroyFrame(); };
}
