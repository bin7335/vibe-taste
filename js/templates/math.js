// 암산 연습: 난이도 → 덧셈·뺄셈(20 이내) / 100 이내 / 곱셈 구구단 / 혼합(나눗셈 포함). 10문제, 제한 시간
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, rng } = ctx;
  const total = 10, limit = [0, 60, 45, 30][S.level - 1];

  const top = el('div', 'row');
  const sNo = stat('문제', `0 / ${total}`), sOk = stat('정답', 0), sTime = stat('남은 시간', limit ? limit + '초' : '무제한');
  top.append(sNo, sOk, sTime);
  const q = el('div', 'big', '시작을 누르면 문제가 나와요'); q.style.fontVariantNumeric = 'tabular-nums';
  const row = el('div', 'row'); row.style.justifyContent = 'center';
  const input = el('input'); input.type = 'number'; input.inputMode = 'numeric'; input.placeholder = '답'; input.style.cssText += 'width:140px;font-size:28px;font-weight:700;text-align:center'; input.disabled = true;
  input.setAttribute('aria-label', '답 입력');
  const ok = btn('확인', 'pb', check); ok.disabled = true;
  const start = btn('시작', 'pb sub', begin);
  row.append(input, ok, start);
  f.body.append(top, q, row);

  let n = 0, right = 0, answer = 0, left = limit, timer = 0, running = false;
  const make = () => {
    const lv = S.level;
    if (lv === 1) { const a = rng.int(20) + 1, b = rng.int(20) + 1; return rng() < 0.5 ? [`${a} + ${b}`, a + b] : [`${Math.max(a, b)} − ${Math.min(a, b)}`, Math.abs(a - b)]; }
    if (lv === 2) { const a = rng.int(90) + 10, b = rng.int(90) + 10; return rng() < 0.5 ? [`${a} + ${b}`, a + b] : [`${Math.max(a, b)} − ${Math.min(a, b)}`, Math.abs(a - b)]; }
    if (lv === 3) { const a = rng.int(8) + 2, b = rng.int(9) + 1; return [`${a} × ${b}`, a * b]; }
    const a = rng.int(8) + 2, b = rng.int(9) + 1, r = rng();
    return r < 0.4 ? [`${a} × ${b}`, a * b] : r < 0.7 ? [`${a * b} ÷ ${a}`, b] : [`${rng.int(400) + 100} + ${rng.int(400) + 100}`, null];
  };
  function next() {
    if (n >= total) return finish();
    let [text, ans] = make(); if (ans === null) { const [x, y] = text.split(' + ').map(Number); ans = x + y; }
    answer = ans; q.textContent = text + ' = ?'; n++; sNo.set(`${n} / ${total}`); input.value = ''; input.focus();
  }
  function check() {
    if (!running || input.value === '') return;
    if (Number(input.value) === answer) { right++; sOk.set(right); sfx.ok(); f.say(rng.pick(['정답!', f.char.lines[1], '좋아!']), 900); }
    else { sfx.no(); f.say(`아쉽다, 답은 ${answer}`, 1500); }
    next();
  }
  function begin() {
    n = 0; right = 0; left = limit; running = true; sOk.set(0); input.disabled = ok.disabled = false; start.disabled = true;
    f.say('준비됐지? 간다!');
    clearInterval(timer);
    if (limit) timer = setInterval(() => { left--; sTime.set(left + '초'); if (left <= 5 && left > 0) sfx.tick(); if (left <= 0) finish(); }, 1000);
    next();
  }
  function finish() {
    clearInterval(timer); running = false; input.disabled = ok.disabled = true; start.disabled = false; start.textContent = '다시';
    q.textContent = `${total}문제 중 ${right}개 정답`;
    f.say(right >= 9 ? f.char.cheer : right >= 6 ? '잘했어! 조금만 더.' : f.char.lines[2]); sfx.win();
  }
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  return () => { clearInterval(timer); f.destroyFrame(); };
}
