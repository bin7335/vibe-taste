// 퀴즈: 테마별 문제 은행에서 시드로 섞어 출제. 난이도 → 문항 수·제한 시간
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { rng, S, d } = ctx;
  const count = [3, 4, 5, 6][S.level - 1];
  const limit = [0, 15, 8, 5][S.level - 1];
  const qs = rng.shuffle(d.theme.quiz).slice(0, count).map(q => ({ text: q[0], answer: q[1], choices: rng.shuffle(q.slice(1)) }));

  const top = el('div', 'row');
  const sNo = stat('문제', `1 / ${count}`), sScore = stat('점수', 0), sTime = stat('남은 시간', limit ? limit + '초' : '무제한');
  top.append(sNo, sScore, sTime);
  const qEl = el('div', 'q');
  const choices = el('div', 'choices');
  const bottom = el('div', 'row');
  const next = btn('다음 문제 →', 'pb', () => ask(i + 1)); next.hidden = true;
  bottom.appendChild(next);
  f.body.append(top, qEl, choices, bottom);

  let i = -1, score = 0, timer = 0, left = 0, answered = false;
  function ask(n) {
    clearInterval(timer);
    if (n >= qs.length) return finish();
    i = n; answered = false; next.hidden = true;
    sNo.set(`${i + 1} / ${count}`);
    qEl.textContent = qs[i].text;
    choices.textContent = '';
    qs[i].choices.forEach((c, k) => {
      const b = el('button', '', `${'①②③④'[k]} ${c}`);
      b.addEventListener('click', () => pick(b, c));
      choices.appendChild(b);
    });
    if (limit) {
      left = limit; sTime.set(left + '초');
      timer = setInterval(() => { left--; sTime.set(left + '초'); if (left <= 3 && left > 0) sfx.tick(); if (left <= 0) { clearInterval(timer); pick(null, null); } }, 1000);
    }
    if (i === 0) f.say('문제 나간다! 잘 골라 봐.');
  }
  function pick(b, c) {
    if (answered) return; answered = true; clearInterval(timer);
    const ok = c === qs[i].answer;
    [...choices.children].forEach(x => { x.disabled = true; if (x.textContent.slice(2) === qs[i].answer) x.classList.add('ok'); });
    if (b && !ok) b.classList.add('no');
    if (ok) { score++; sScore.set(score); sfx.ok(); f.say(rng.pick(['정답! ' + f.char.lines[1], '맞았어!', f.char.lines[2]])); }
    else { sfx.no(); f.say(c === null ? '시간 초과! 정답은 "' + qs[i].answer + '"' : f.char.sad); }
    next.hidden = false; next.textContent = i + 1 >= qs.length ? '결과 보기' : '다음 문제 →';
    next.focus();
  }
  function finish() {
    qEl.textContent = `${count}문제 중 ${score}개 정답! ${score === count ? '만점!!' : score >= count / 2 ? '잘했어요' : '다시 도전해 봐요'}`;
    choices.textContent = ''; sTime.set('-');
    next.hidden = true;
    const again = btn('다시 풀기', 'pb', () => { score = 0; sScore.set(0); again.remove(); qs.forEach(q => q.choices = rng.shuffle(q.choices)); ask(0); });
    bottom.appendChild(again);
    f.say(score === count ? f.char.cheer : f.char.lines[2]); if (score === count) sfx.win(); else sfx.ok();
  }
  ask(0);
  return () => { clearInterval(timer); f.destroyFrame(); };
}
