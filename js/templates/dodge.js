// 피하기 게임: 키보드 ←→ / A D, 터치(좌우 탭·드래그). 난이도 → 낙하 속도·생성 빈도
import { frame, btn, stat, overlay } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { rng, S, d } = ctx;
  const speed = [1, 1.5, 2.2, 3][S.level - 1];
  const spawnEvery = [900, 700, 500, 380][S.level - 1];

  const top = el('div', 'row');
  const sScore = stat('점수', 0), sLives = stat('목숨', 3), sBest = stat('최고', 0);
  top.append(sScore, sLives, sBest);
  const canvas = el('canvas'); canvas.width = 720; canvas.height = 420; canvas.style.height = 'auto'; canvas.style.aspectRatio = '720/420';
  const wrap = el('div'); wrap.style.position = 'relative'; wrap.appendChild(canvas);
  const help = el('div', 'row');
  help.appendChild(el('span', 'stat', '← → 또는 A D · 화면 왼쪽/오른쪽 탭 · 드래그'));
  f.body.append(top, wrap, help);

  const ctx2 = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const player = { x: W / 2, y: H - 48, r: 26, vx: 0 };
  let drops = [], lives = 3, score = 0, best = 0, running = false, raf = 0, lastSpawn = 0, startT = 0, keys = {}, pointerX = null;
  const glyphs = d.theme.glyphs;

  function draw() {
    ctx2.clearRect(0, 0, W, H);
    ctx2.font = '40px system-ui, "Apple Color Emoji", "Segoe UI Emoji"'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    ctx2.fillText(d.char.emoji, player.x, player.y);
    ctx2.font = '30px system-ui, "Apple Color Emoji", "Segoe UI Emoji"';
    for (const o of drops) ctx2.fillText(o.g, o.x, o.y);
    if (!running && lives > 0 && !startT) {
      ctx2.fillStyle = d.theme.ink; ctx2.font = 'bold 26px system-ui, sans-serif';
      ctx2.fillText('시작 버튼을 눌러요', W / 2, H / 2 - 20);
    }
  }
  function loop(now) {
    if (!running) return;
    if (now - lastSpawn > spawnEvery / Math.min(2, 1 + (now - startT) / 40000)) { lastSpawn = now; drops.push({ x: 30 + rng() * (W - 60), y: -30, g: rng.pick(glyphs), v: (2.4 + rng() * 1.6) * speed }); }
    if (keys.left) player.x -= 6 * Math.max(1, speed * 0.8);
    if (keys.right) player.x += 6 * Math.max(1, speed * 0.8);
    if (pointerX !== null) player.x += (pointerX - player.x) * 0.25;
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    for (const o of drops) o.y += o.v;
    const before = drops.length;
    drops = drops.filter(o => {
      if (Math.hypot(o.x - player.x, o.y - player.y) < player.r + 14) { hit(); return false; }
      return o.y < H + 30;
    });
    score += before - drops.length - (hitThisFrame ? 1 : 0); hitThisFrame = false;
    if (score < 0) score = 0;
    sScore.set(score);
    draw();
    raf = requestAnimationFrame(loop);
  }
  let hitThisFrame = false;
  function hit() {
    hitThisFrame = true; lives--; sfx.no();
    sLives.set(lives);
    f.say(lives ? f.char.sad : '으악! 게임 끝…', 1500);
    canvas.style.filter = 'brightness(1.6)'; setTimeout(() => canvas.style.filter = '', 120);
    if (!lives) gameOver();
  }
  function gameOver() {
    running = false; cancelAnimationFrame(raf); best = Math.max(best, score); sBest.set(best);
    overlay(wrap, `점수 ${score}`, score > 40 ? f.char.cheer : '다시 해 볼까?', '다시 하기', start);
  }
  function start() {
    drops = []; lives = 3; score = 0; running = true; startT = performance.now(); lastSpawn = 0;
    sLives.set(3); sScore.set(0); player.x = W / 2;
    f.say(f.char.lines[0]); sfx.ok();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  const startBtn = btn('시작', 'pb', () => { if (!running) start(); });
  help.prepend(startBtn);

  const onDown = e => { if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); } if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); } };
  const onUp = e => { if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false; if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false; };
  document.addEventListener('keydown', onDown); document.addEventListener('keyup', onUp);
  const toX = e => { const r = canvas.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); if (!running) return; pointerX = toX(e); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (pointerX !== null) pointerX = toX(e); });
  const release = () => { pointerX = null; };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  draw();
  return () => { running = false; cancelAnimationFrame(raf); document.removeEventListener('keydown', onDown); document.removeEventListener('keyup', onUp); f.destroyFrame(); };
}
