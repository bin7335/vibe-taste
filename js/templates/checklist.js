// 체크리스트: 할 일을 적고 체크하며 진행률 보기. 난이도 → 기본 항목 수(새로 고치면 사라짐, 저장 없음)
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

const PRESET = ['교실 환기하기', '출석 확인', '알림장 쓰기', '우유 당번 확인', '숙제 걷기', '칠판 지우기', '내일 준비물 안내', '자리 정돈'];

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, rng } = ctx;
  const items = rng.shuffle(PRESET).slice(0, [3, 4, 6, 8][S.level - 1]).map(t => ({ t, done: false }));

  const top = el('div', 'row');
  const sDone = stat('완료', '0 / 0');
  const bar = el('div'); bar.style.cssText = 'flex:1;min-width:120px;height:12px;border-radius:999px;background:var(--p-card);box-shadow:inset 0 0 0 1px var(--p-line);overflow:hidden';
  const fill = el('i'); fill.style.cssText = 'display:block;height:100%;width:100%;background:var(--p-ac);transform:scaleX(0);transform-origin:left;transition:transform var(--dur-short) var(--ease-snap)';
  bar.appendChild(fill);
  top.append(sDone, bar);
  const list = el('ul'); list.style.cssText = 'list-style:none;margin:0;padding:0;display:grid;gap:8px';
  const addRow = el('div', 'row');
  const input = el('input'); input.placeholder = '할 일 추가'; input.style.flex = '1'; input.setAttribute('aria-label', '할 일 추가');
  const add = btn('추가', 'pb', () => { const t = input.value.trim().slice(0, 40); if (!t) return; items.push({ t, done: false }); input.value = ''; render(); sfx.tap(); });
  const clear = btn('완료한 것 치우기', 'pb sub', () => { for (let i = items.length - 1; i >= 0; i--) if (items[i].done) items.splice(i, 1); render(); });
  addRow.append(input, add, clear);
  f.body.append(top, list, addRow);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add.click(); } });

  function render() {
    list.textContent = '';
    items.forEach((it, i) => {
      const li = el('li'); li.style.cssText = 'display:flex;align-items:center;gap:10px;background:var(--p-card);border-radius:var(--radius-input);padding:10px 12px;box-shadow:inset 0 0 0 1px var(--p-line)';
      const cb = el('input'); cb.type = 'checkbox'; cb.checked = it.done; cb.style.cssText = 'width:22px;height:22px;min-height:0;accent-color:var(--p-ac-deep)'; cb.setAttribute('aria-label', it.t);
      cb.addEventListener('change', () => { it.done = cb.checked; render(); if (cb.checked) sfx.ok(); });
      const label = el('span', '', it.t); label.style.cssText = 'flex:1;font-weight:600' + (it.done ? ';text-decoration:line-through;opacity:.55' : '');
      const del = btn('빼기', 'pb sub', () => { items.splice(i, 1); render(); }); del.style.minHeight = '32px'; del.style.padding = '0 10px';
      li.append(cb, label, del); list.appendChild(li);
    });
    const done = items.filter(x => x.done).length;
    sDone.set(`${done} / ${items.length}`); fill.style.transform = `scaleX(${items.length ? done / items.length : 0})`;
    if (items.length && done === items.length) { f.say(`다 했다! ${f.char.cheer}`); }
    else if (!items.length) f.say('할 일을 적어 봐.');
  }
  render();
  return () => f.destroyFrame();
}
