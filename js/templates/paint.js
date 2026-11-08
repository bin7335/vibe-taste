// 그림판: 테마 팔레트·굵기·도장·지우개·저장. 난이도 2 이상은 "N초 안에 OO 그리기" 미션
import { frame, btn, stat } from './common.js';
import { el, sfx } from '../util.js';

export default function mount(root, ctx) {
  const f = frame(root, ctx);
  const { S, d, rng } = ctx;
  const missionSec = [0, 60, 30, 15][S.level - 1];

  const palette = el('div', 'palette');
  const colors = [...d.theme.palette, '#111111'];
  let color = colors[0], size = 6, stamp = null, drawing = false, last = null;
  colors.forEach(c => { const b = el('button'); b.style.background = c; b.title = c; b.setAttribute('aria-label', '색 ' + c); if (c === color) b.classList.add('on'); b.addEventListener('click', () => { color = c; stamp = null; sel(b); }); palette.appendChild(b); });
  const sizes = el('div', 'row');
  [3, 6, 14, 28].forEach(s => { const b = btn(s < 6 ? '얇게' : s < 14 ? '보통' : s < 28 ? '굵게' : '왕굵게', 'pb sub', () => { size = s; stamp = null; }); sizes.appendChild(b); });
  const stamps = el('div', 'palette');
  [d.char.emoji, ...d.theme.glyphs.slice(0, 4)].forEach(g => { const b = el('button', 'st', g); b.addEventListener('click', () => { stamp = g; sel(b); }); stamps.appendChild(b); });
  const eraser = btn('지우개', 'pb sub', () => { stamp = null; color = 'erase'; sel(eraser); });
  const clear = btn('새 종이', 'pb sub', () => { fill(); sfx.tap(); });
  const save = btn('저장(PNG)', 'pb sub', () => { try { const a = el('a'); a.href = canvas.toDataURL('image/png'); a.download = `${d.name}.png`; a.click(); f.say('저장했어! 갤러리를 확인해 봐.'); } catch (e) { f.say('저장이 막혔어요.'); } });
  const tools = el('div', 'row'); tools.append(eraser, clear, save);
  function sel(b) { [...palette.children, ...stamps.children, eraser].forEach(x => x.classList.toggle('on', x === b)); }

  const canvas = el('canvas'); canvas.width = 900; canvas.height = 520; canvas.style.height = 'auto'; canvas.style.aspectRatio = '900/520'; canvas.style.background = '#fff'; canvas.style.cursor = 'crosshair';
  const g = canvas.getContext('2d');
  const fill = () => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, canvas.width, canvas.height); };
  fill();
  const pos = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * canvas.width, y: (e.clientY - r.top) / r.height * canvas.height }; };
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault(); canvas.setPointerCapture(e.pointerId); const p = pos(e);
    if (stamp) { g.font = `${size * 6 + 30}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(stamp, p.x, p.y); sfx.tap(); return; }
    drawing = true; last = p; dot(p);
  });
  canvas.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); line(last, p); last = p; });
  const up = () => { drawing = false; last = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  function stroke() { g.lineCap = g.lineJoin = 'round'; g.lineWidth = color === 'erase' ? size * 3 : size; g.strokeStyle = g.fillStyle = color === 'erase' ? '#ffffff' : color; }
  function dot(p) { stroke(); g.beginPath(); g.arc(p.x, p.y, g.lineWidth / 2, 0, Math.PI * 2); g.fill(); }
  function line(a, b) { stroke(); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }

  const mrow = el('div', 'row');
  let mt = 0;
  if (missionSec) {
    const sMission = stat('미션', '-'), sTime = stat('남은 시간', '-');
    const mbtn = btn('미션 시작', 'pb', () => {
      const word = rng.pick(d.theme.words); let left = missionSec;
      sMission.set(word); sTime.set(left + '초'); fill();
      f.say(`${missionSec}초 안에 "${word}"을(를) 그려 봐!`);
      clearInterval(mt);
      mt = setInterval(() => { left--; sTime.set(left + '초'); if (left <= 3 && left > 0) sfx.tick(); if (left <= 0) { clearInterval(mt); f.say(`시간 끝! 친구에게 "${word}" 맞는지 물어봐. ${f.char.cheer}`); sfx.win(); } }, 1000);
    });
    mrow.append(mbtn, sMission, sTime);
  } else mrow.appendChild(el('span', 'stat', '자유롭게 그려요. 도장을 누르고 종이를 탭하면 찍혀요.'));

  f.body.append(palette, sizes, stamps, tools, canvas, mrow);
  return () => { clearInterval(mt); f.destroyFrame(); };
}
