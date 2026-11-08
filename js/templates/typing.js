// 타자 연습: 테마 단어를 제한 시간 안에 정확히 입력. 난이도 → 시간·단어 길이
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { rng, S, d } = ctx;
  const total = [40, 30, 20, 15][S.level - 1];
  const pool = rng.shuffle(d.theme.words);
  const words = S.level >= 3 ? pool : pool.sort((a, b) => a.length - b.length);

  const top = el('div', 'row');
  const sTime = stat('남은 시간', total + '초'), sOk = stat('맞힌 단어', 0), sAcc = stat('정확도', '100%');
  top.append(sTime, sOk, sAcc);
  const word = el('div', 'word', '시작을 누르면 단어가 나와요');
  const input = el('input'); input.placeholder = '여기에 똑같이 입력'; input.autocomplete = 'off'; input.style.fontSize = '22px'; input.style.fontWeight = '700'; input.disabled = true;
  input.setAttribute('aria-label', '단어 입력');
  const row = el('div', 'row');
  const start = btn('▶ 시작', 'pb', begin);
  row.append(start);
  f.body.append(top, word, input, row);

  let idx = 0, ok = 0, typed = 0, wrong = 0, left = total, timer = 0, running = false;
  function show() { word.textContent = words[idx % words.length]; }
  function begin() {
    idx = 0; ok = 0; typed = 0; wrong = 0; left = total; running = true;
    sOk.set(0); sAcc.set('100%'); sTime.set(left + '초');
    input.disabled = false; input.value = ''; input.focus(); show(); start.disabled = true;
    f.say('준비… 시작! 보이는 단어를 똑같이 쳐.');
    clearInterval(timer);
    timer = setInterval(() => { left--; sTime.set(left + '초'); if (left <= 5 && left > 0) sfx.tick(); if (left <= 0) finish(); }, 1000);
  }
  function finish() {
    clearInterval(timer); running = false; input.disabled = true; start.disabled = false; start.textContent = '🔁 다시';
    const wpm = Math.round(ok / total * 60);
    word.innerHTML = ''; word.append(`${ok}단어 · 분당 ${wpm}단어`);
    f.say(ok >= 10 ? f.char.cheer : ok >= 5 ? '좋아, 점점 빨라지네!' : f.char.lines[2]); sfx.win();
  }
  input.addEventListener('input', () => {
    if (!running) return;
    typed++;
    const target = words[idx % words.length];
    const v = input.value.trim();
    if (v === target) {
      ok++; idx++; input.value = ''; sOk.set(ok); sfx.ok();
      word.innerHTML = ''; const okEl = el('span', 'ok', '✓ ' + target); word.appendChild(okEl);
      setTimeout(show, 150);
      if (ok % 5 === 0) f.say(rng.pick(['5개 돌파!', f.char.lines[1], '손가락이 날아다닌다!']), 1500);
    } else if (!target.startsWith(v)) { wrong++; }
    sAcc.set(Math.max(0, Math.round((1 - wrong / Math.max(1, typed)) * 100)) + '%');
  });
  return () => { clearInterval(timer); f.destroyFrame(); };
}
