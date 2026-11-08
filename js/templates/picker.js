// 뽑기: 이름 목록에서 룰렛처럼 돌려 한 명 뽑기. 난이도 → 돌아가는 속도
import { frame, btn } from './common.js';
import { el, sfx } from '../util.js';
import { SAMPLE_NAMES } from '../data.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, rng } = ctx;
  const spinMs = [3000, 2200, 1500, 900][S.level - 1];
  const stepMs = [90, 60, 35, 20][S.level - 1];

  const grid = el('div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'minmax(0,1fr) minmax(0,1.4fr)'; grid.style.gap = '12px';
  const left = el('div');
  const ta = el('textarea'); ta.rows = 8; ta.style.width = '100%'; ta.setAttribute('aria-label', '뽑을 이름 목록');
  ta.value = rng.shuffle(SAMPLE_NAMES).slice(0, 8).join('\n');
  const opts = el('div', 'row'); opts.style.marginTop = '8px';
  const chk = el('label'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = true; chk.append(cb, ' 뽑힌 사람은 빼기');
  chk.style.fontWeight = '700'; chk.style.fontSize = '14px';
  opts.appendChild(chk);
  left.append(el('div', 'stat', '한 줄에 한 명씩 적어요'), ta, opts);
  const right = el('div');
  const wheel = el('div', 'wheel', '뽑기를 눌러요');
  const row = el('div', 'row'); row.style.marginTop = '10px';
  const spin = btn('뽑기!', 'pb', doSpin);
  const num = btn('숫자 뽑기(1-30)', 'pb sub', () => { ta.value = Array.from({ length: 30 }, (_, i) => String(i + 1)).join('\n'); doSpin(); });
  const history = el('div', 'row'); history.style.marginTop = '8px';
  row.append(spin, num);
  right.append(wheel, row, history);
  grid.append(left, right);
  f.body.appendChild(grid);
  if (matchMedia('(max-width: 600px)').matches) grid.style.gridTemplateColumns = '1fr';

  let t1 = 0, t2 = 0, spinning = false;
  const names = () => ta.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 200);
  function doSpin() {
    if (spinning) return;
    const list = names();
    if (list.length < 2) { f.say('두 명 이상 적어야 뽑을 수 있어!'); sfx.no(); return; }
    spinning = true; spin.disabled = true; wheel.classList.remove('win');
    f.say('두구두구두구…');
    let i = 0;
    const winner = list[Math.floor(Math.random() * list.length)];
    t1 = setInterval(() => { wheel.textContent = list[i++ % list.length]; sfx.tick(); }, stepMs);
    t2 = setTimeout(() => {
      clearInterval(t1); wheel.textContent = winner; wheel.classList.add('win'); sfx.win();
      f.say(`${winner}, 당첨! ${f.char.cheer}`);
      const h = el('span', 'stat', winner); history.prepend(h); while (history.children.length > 8) history.lastChild.remove();
      if (cb.checked) ta.value = list.filter(n => n !== winner).join('\n');
      spinning = false; spin.disabled = false;
    }, spinMs);
  }
  return () => { clearInterval(t1); clearTimeout(t2); f.destroyFrame(); };
}
