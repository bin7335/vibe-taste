// 두더지 잡기: 3×3 구멍에서 주인공이 튀어나오면 탭. 난이도 → 속도
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d, rng } = ctx;
  const upFor = [1100, 850, 620, 450][S.level - 1];
  const total = 30;

  const top = el('div', 'row');
  const sScore = stat('점수', 0), sTime = stat('남은 시간', total + '초'), sBest = stat('최고', 0);
  const start = btn('시작', 'pb', begin);
  top.append(start, sScore, sTime, sBest);
  const grid = el('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-width:520px;margin:0 auto;width:100%';
  const holes = Array.from({ length: 9 }, (_, i) => {
    const b = el('button');
    b.style.cssText = 'aspect-ratio:1;border:0;border-radius:var(--radius-pill);background:var(--p-card);box-shadow:inset 0 6px 0 0 var(--p-line);font-size:44px;line-height:1;transition:background-color var(--dur-micro) linear';
    b.setAttribute('aria-label', '구멍 ' + (i + 1));
    b.addEventListener('pointerdown', e => { e.preventDefault(); whack(i); });
    grid.appendChild(b); return b;
  });
  f.body.append(top, grid);

  let score = 0, best = 0, left = total, cur = -1, running = false, popT = 0, tick = 0, misses = 0;
  function pop() {
    if (!running) return;
    if (cur >= 0) { holes[cur].textContent = ''; misses++; }
    let n; do { n = rng.int(9); } while (n === cur);
    cur = n; holes[cur].textContent = rng() < 0.15 ? '💣' : d.char.emoji;
    holes[cur].animate?.([{ fontSize: '8px' }, { fontSize: '44px' }], { duration: 180, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }); // 쏙 올라오는 느낌
    popT = setTimeout(pop, upFor + rng() * 300);
  }
  function whack(i) {
    if (!running || i !== cur) return;
    const bomb = holes[i].textContent === '💣';
    holes[i].textContent = ''; cur = -1; clearTimeout(popT);
    if (bomb) { score = Math.max(0, score - 3); sfx.no(); f.say('앗, 폭탄! -3', 900); }
    else { score++; sfx.tap(); if (score % 10 === 0) f.say(rng.pick([f.char.lines[1], '손이 빠른데?']), 1000); }
    sScore.set(score);
    holes[i].style.background = 'var(--p-ac)'; setTimeout(() => holes[i].style.background = 'var(--p-card)', 120);
    popT = setTimeout(pop, 200 + rng() * 300);
  }
  function begin() {
    score = 0; left = total; misses = 0; running = true; start.disabled = true; sScore.set(0); sTime.set(left + '초');
    f.say(`${d.char.name}가 나오면 바로 탭! 폭탄은 피하고.`); sfx.ok();
    clearInterval(tick); tick = setInterval(() => { left--; sTime.set(left + '초'); if (left <= 0) end(); }, 1000);
    pop();
  }
  function end() {
    running = false; clearInterval(tick); clearTimeout(popT); if (cur >= 0) holes[cur].textContent = ''; cur = -1;
    best = Math.max(best, score); sBest.set(best); start.disabled = false; start.textContent = '다시';
    f.say(score >= 25 ? f.char.cheer : `${score}마리! 다시 도전?`); sfx.win();
  }
  return () => { running = false; clearInterval(tick); clearTimeout(popT); f.destroyFrame(); };
}
