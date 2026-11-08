// 픽셀 아트: 칸을 칠해 도트 그림. 난이도 → 격자 크기. PNG 저장
import { frame, btn } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d } = ctx;
  const N = [8, 12, 16, 20][S.level - 1];
  const colors = [...d.theme.palette, '#111111', '#ffffff'];
  let color = colors[0], down = false;

  const palette = el('div', 'palette');
  colors.forEach(c => { const b = el('button'); b.style.background = c; b.setAttribute('aria-label', '색 ' + c); if (c === color) b.classList.add('on'); b.addEventListener('click', () => { color = c; [...palette.children].forEach(x => x.classList.toggle('on', x === b)); }); palette.appendChild(b); });
  const canvas = el('canvas'); canvas.width = canvas.height = N * 24; canvas.style.cssText = 'max-width:480px;width:100%;height:auto;aspect-ratio:1;margin:0 auto;background:#fff;cursor:crosshair;image-rendering:pixelated';
  const g = canvas.getContext('2d');
  const cells = Array(N * N).fill('#ffffff');
  function draw() {
    for (let i = 0; i < N * N; i++) { g.fillStyle = cells[i]; g.fillRect((i % N) * 24, Math.floor(i / N) * 24, 24, 24); }
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1;
    for (let k = 0; k <= N; k++) { g.beginPath(); g.moveTo(k * 24 + 0.5, 0); g.lineTo(k * 24 + 0.5, N * 24); g.stroke(); g.beginPath(); g.moveTo(0, k * 24 + 0.5); g.lineTo(N * 24, k * 24 + 0.5); g.stroke(); }
  }
  const idx = e => { const r = canvas.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N); return x < 0 || y < 0 || x >= N || y >= N ? -1 : y * N + x; };
  const put = e => { const i = idx(e); if (i >= 0 && cells[i] !== color) { cells[i] = color; draw(); } };
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); down = true; put(e); sfx.tick(); });
  canvas.addEventListener('pointermove', e => { if (down) put(e); });
  const up = () => { down = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  const row = el('div', 'row');
  row.append(
    btn('새 종이', 'pb sub', () => { cells.fill('#ffffff'); draw(); }),
    btn('저장(PNG)', 'pb', () => { try { const out = document.createElement('canvas'); out.width = out.height = N * 24; const og = out.getContext('2d'); for (let i = 0; i < N * N; i++) { og.fillStyle = cells[i]; og.fillRect((i % N) * 24, Math.floor(i / N) * 24, 24, 24); } const a = el('a'); a.href = out.toDataURL('image/png'); a.download = `${d.name}.png`; a.click(); f.say('저장했어!'); } catch (e) { f.say('저장이 막혔어요.'); } }),
    el('span', 'stat', `${N}×${N} 칸 · 끌어서 칠하기`),
  );
  f.body.append(palette, canvas, row);
  draw();
  return () => f.destroyFrame();
}
