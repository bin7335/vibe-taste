// 모둠 짜기: 이름 목록을 모둠 인원수로 랜덤 배정. 난이도 → 기본 모둠 인원
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';
import { SAMPLE_NAMES } from '../data.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, rng, d } = ctx;
  let size = [2, 3, 4, 5][S.level - 1];

  const grid = el('div'); grid.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:12px';
  if (matchMedia('(max-width: 600px)').matches) grid.style.gridTemplateColumns = '1fr';
  const leftCol = el('div');
  const ta = el('textarea'); ta.rows = 10; ta.style.width = '100%'; ta.setAttribute('aria-label', '이름 목록');
  ta.value = [...SAMPLE_NAMES, '하준', '지안', '서준', '아린'].join('\n');
  const sizeRow = el('div', 'row'); sizeRow.style.marginTop = '8px';
  const sSize = stat('모둠 인원', size);
  sizeRow.append(btn('−', 'pb sub', () => { size = Math.max(2, size - 1); sSize.set(size); }), sSize, btn('+', 'pb sub', () => { size = Math.min(8, size + 1); sSize.set(size); }));
  const go = btn('모둠 짜기', 'pb', make);
  sizeRow.appendChild(go);
  leftCol.append(el('div', 'stat', '한 줄에 한 명씩'), ta, sizeRow);
  const out = el('div'); out.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;align-content:start';
  grid.append(leftCol, out);
  f.body.appendChild(grid);

  function make() {
    const names = ta.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 200);
    if (names.length < 2) { f.say('두 명 이상 적어 줘.'); sfx.no(); return; }
    const sh = [...names]; for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
    const nGroups = Math.max(1, Math.round(sh.length / size));
    const groups = Array.from({ length: nGroups }, () => []);
    sh.forEach((nm, i) => groups[i % nGroups].push(nm));
    out.textContent = '';
    groups.forEach((g, i) => {
      const box = el('div'); box.style.cssText = 'background:var(--p-card);border-radius:var(--radius-stock);padding:12px;box-shadow:inset 0 0 0 1px var(--p-line)';
      const h = el('div', '', `${i + 1}모둠`); h.style.cssText = 'font-weight:700;margin-bottom:6px;color:var(--p-ac-deep)';
      box.appendChild(h);
      g.forEach((nm, k) => { const line = el('div', '', nm); if (k === 0) { line.textContent = nm + ' (모둠장)'; line.style.fontWeight = '700'; } box.appendChild(line); });
      out.appendChild(box);
    });
    f.say(`${names.length}명을 ${nGroups}모둠으로 나눴어. 첫 번째가 모둠장!`); sfx.win();
  }
  make();
  return () => f.destroyFrame();
}
