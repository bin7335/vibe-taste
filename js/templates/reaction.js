// 반응속도 게임: 색이 바뀌면 탭. 난이도 → 라운드 수·대기 시간·속임수
import { frame, btn, stat, fmtMs } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { rng, S } = ctx;
  const rounds = [3, 5, 7, 10][S.level - 1];
  const minWait = [2200, 1800, 1400, 1000][S.level - 1];
  const fake = S.level >= 3;

  const top = el('div', 'row');
  const sRound = stat('라운드', `0 / ${rounds}`), sLast = stat('이번 기록', '-'), sBest = stat('최고', '-');
  top.append(sRound, sLast, sBest);
  const pad = el('div', 'pad', '탭해서 시작!');
  pad.style.background = 'var(--p-card)'; pad.style.boxShadow = 'inset 0 0 0 2px var(--p-line)';
  pad.setAttribute('role', 'button'); pad.tabIndex = 0;
  const bottom = el('div', 'row');
  const again = btn('다시 하기', 'pb sub', () => reset());
  bottom.appendChild(again);
  f.body.append(top, pad, bottom);

  let state = 'idle', timer = 0, t0 = 0, round = 0, times = [], best = Infinity;
  const setPad = (bg, text, color) => { pad.style.background = bg; pad.textContent = text; pad.style.color = color || ''; pad.style.borderStyle = 'solid'; };

  function reset() { clearTimeout(timer); state = 'idle'; round = 0; times = []; sRound.set(`0 / ${rounds}`); sLast.set('-'); setPad('var(--p-card)', '탭해서 시작!'); pad.style.borderStyle = 'dashed'; f.say(f.char.lines[0]); }
  function startRound() {
    state = 'wait'; round++;
    sRound.set(`${round} / ${rounds}`);
    setPad('var(--color-accent-3)', '기다려…', 'var(--color-ink)');
    const delay = minWait + rng() * 1800;
    if (fake && rng() < 0.35) {
      timer = setTimeout(() => { setPad('var(--color-sand)', '아직!', 'var(--color-ink)'); timer = setTimeout(go, 500 + rng() * 900); }, delay * 0.6);
    } else timer = setTimeout(go, delay);
  }
  function go() { state = 'go'; t0 = performance.now(); setPad('var(--color-mint)', '지금! 탭!', 'var(--color-ink)'); sfx.tick(); }
  function finish() {
    state = 'done';
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    setPad('var(--p-ac)', `평균 ${fmtMs(avg)}\n${avg < 250 ? '번개 손!' : avg < 350 ? '아주 빨라요' : avg < 500 ? '좋아요' : '연습하면 빨라져요'}`, 'var(--p-ac-ink)');
    pad.style.whiteSpace = 'pre-line';
    f.say(avg < 300 ? f.char.cheer : f.char.lines[2]); sfx.win();
  }
  function tap() {
    if (state === 'idle') { f.say('빨간색이면 기다리고, 초록색이 되면 바로 탭!'); return startRound(); }
    if (state === 'wait') { clearTimeout(timer); sfx.no(); f.say('너무 빨라! 초록색을 기다려야 해.'); setPad('var(--color-muted)', '너무 빨랐어요\n탭해서 다시', 'var(--color-paper)'); pad.style.whiteSpace = 'pre-line'; round--; state = 'retry'; return; }
    if (state === 'retry') return startRound();
    if (state === 'go') {
      const ms = performance.now() - t0; times.push(ms); best = Math.min(best, ms);
      sLast.set(fmtMs(ms)); sBest.set(fmtMs(best)); sfx.ok();
      if (round >= rounds) return finish();
      state = 'between'; setPad('var(--p-card)', `${fmtMs(ms)}!\n탭해서 다음 라운드`); pad.style.whiteSpace = 'pre-line';
      f.say(ms < 250 ? '우와, 번개 같아!' : f.char.lines[1]);
      return;
    }
    if (state === 'between') return startRound();
    if (state === 'done') return reset();
  }
  pad.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  pad.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); } });
  const onKey = e => { if (e.code === 'Space' && document.activeElement !== pad && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { e.preventDefault(); tap(); } };
  document.addEventListener('keydown', onKey);
  return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey); f.destroyFrame(); };
}
