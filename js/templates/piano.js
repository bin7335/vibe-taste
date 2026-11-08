// 미니 피아노: 8건반(도-도), 키보드 asdfghjk, 터치. "따라치기" 모드(난이도 → 음 개수)
import { frame, btn, stat } from './common.js';
import { el, beep, sfx } from '../util.js';

const NOTES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
const NAMES = ['도', '레', '미', '파', '솔', '라', '시', '도'];
const KEYS = 'asdfghjk';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d, rng } = ctx;
  const startLen = [3, 4, 5, 7][S.level - 1];
  const gap = [700, 550, 420, 320][S.level - 1];

  const top = el('div', 'row');
  const sRound = stat('따라치기 단계', '-'), sBest = stat('최고', 0);
  const simon = btn(`🎵 ${d.char.name}가 치는 걸 따라치기`, 'pb', startSimon);
  top.append(simon, sRound, sBest);
  const keys = el('div', 'keys');
  const keyEls = NOTES.map((_, i) => {
    const b = el('button'); b.append(NAMES[i]); const small = el('small', '', KEYS[i].toUpperCase()); b.appendChild(small);
    b.style.background = i % 2 ? '#fff' : d.theme.palette[i % d.theme.palette.length] + '33';
    b.addEventListener('pointerdown', e => { e.preventDefault(); press(i, true); });
    keys.appendChild(b); return b;
  });
  f.body.append(top, keys, el('div', 'stat', '키보드 A S D F G H J K 로도 연주할 수 있어요'));

  let seq = [], user = [], playing = false, round = 0, best = 0, timers = [];
  function light(i, ms = 180) { keyEls[i].classList.add('on'); timers.push(setTimeout(() => keyEls[i].classList.remove('on'), ms)); }
  function press(i, fromUser) {
    beep(NOTES[i], 0.35, 'triangle', 0.12); light(i);
    if (fromUser && seq.length && !playing) check(i);
  }
  function startSimon() {
    round = 0; seq = []; nextRound();
  }
  function nextRound() {
    round++; user = []; sRound.set(`${round}단계 (${startLen + round - 1}음)`);
    while (seq.length < startLen + round - 1) seq.push(rng.int(8));
    playing = true; simon.disabled = true;
    f.say(round === 1 ? '잘 듣고 똑같이 쳐 봐!' : '좋아, 한 음 더!');
    seq.forEach((n, k) => timers.push(setTimeout(() => { press(n, false); if (k === seq.length - 1) timers.push(setTimeout(() => { playing = false; simon.disabled = false; f.say('이제 네 차례!'); }, gap)); }, 600 + k * gap)));
  }
  function check(i) {
    user.push(i);
    const k = user.length - 1;
    if (seq[k] !== i) { sfx.no(); f.say(`${f.char.sad} ${round - 1}단계까지 성공!`); best = Math.max(best, round - 1); sBest.set(best); seq = []; sRound.set('-'); return; }
    if (user.length === seq.length) { sfx.win(); f.say(f.char.cheer); best = Math.max(best, round); sBest.set(best); timers.push(setTimeout(nextRound, 900)); }
  }
  const onKey = e => { if (e.repeat || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return; const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) press(i, true); };
  document.addEventListener('keydown', onKey);
  return () => { timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); f.destroyFrame(); };
}
