// 낱말 카드: 앞면 질문, 뒷면 답. 알아요/몰라요로 나누고 모르는 것만 다시. 난이도 → 카드 수
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d, rng } = ctx;
  const count = [3, 4, 5, 6][S.level - 1];
  let deck = rng.shuffle(d.theme.quiz).slice(0, count).map(q => ({ q: q[0], a: q[1] }));

  const top = el('div', 'row');
  const sLeft = stat('남은 카드', deck.length), sKnown = stat('알아요', 0), sRound = stat('회차', 1);
  top.append(sLeft, sKnown, sRound);
  const card = el('button', 'q');
  card.style.cssText = 'min-height:180px;width:100%;display:grid;place-items:center;text-align:center;cursor:pointer;border:0;font-size:var(--text-xl);font-weight:700';
  card.setAttribute('aria-label', '카드 뒤집기');
  const side = el('div', 'stat', '앞면 · 탭해서 뒤집기');
  const row = el('div', 'row');
  const know = btn('알아요', 'pb', () => grade(true)), dont = btn('몰라요', 'pb sub', () => grade(false));
  const restart = btn('처음부터', 'pb sub', () => { deck = rng.shuffle(d.theme.quiz).slice(0, count).map(q => ({ q: q[0], a: q[1] })); known = 0; round = 1; sKnown.set(0); sRound.set(1); i = 0; again = []; show(); });
  row.append(know, dont, restart);
  f.body.append(top, card, side, row);

  let i = 0, flipped = false, known = 0, round = 1, again = [];
  function show() {
    flipped = false;
    if (i >= deck.length) {
      if (!again.length) { card.textContent = `다 외웠어요! ${known}장 전부 알아요.`; side.textContent = '끝'; know.disabled = dont.disabled = true; f.say(f.char.cheer); sfx.win(); return; }
      deck = rng.shuffle(again); again = []; i = 0; round++; sRound.set(round); f.say(`모르는 ${deck.length}장만 다시!`);
    }
    know.disabled = dont.disabled = false;
    card.textContent = deck[i].q; side.textContent = '앞면 · 탭해서 뒤집기'; sLeft.set(deck.length - i);
    card.style.background = 'var(--p-card)';
  }
  card.addEventListener('click', () => { flipped = !flipped; card.textContent = flipped ? deck[i].a : deck[i].q; side.textContent = flipped ? '뒷면 · 정답' : '앞면 · 탭해서 뒤집기'; card.style.background = flipped ? 'var(--p-ac)' : 'var(--p-card)'; card.style.color = flipped ? 'var(--p-ac-ink)' : 'var(--p-ink)'; sfx.tap(); });
  function grade(ok) {
    if (ok) { known++; sKnown.set(known); sfx.ok(); } else { again.push(deck[i]); sfx.no(); f.say('괜찮아, 뒤에 다시 나와.', 1200); }
    i++; card.style.color = 'var(--p-ink)'; show();
  }
  show();
  return () => f.destroyFrame();
}
