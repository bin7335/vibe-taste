// 공방 도우미 캐릭터. Claude Code 시작 화면의 픽셀 마스코트 모양을 따라 그린 비공식 그림이다(공식 파일 아님).
// 이 앱은 Anthropic 공식 서비스가 아니며, 그 사실은 화면 아래 안내 문구에 적어 둔다.
// 고정 마크업만 쓰고 사용자 입력은 넣지 않는다. 한 칸 = 가로 3.6 × 세로 7.2.
const SVG = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
<ellipse class="mas__shadow" cx="32" cy="53" rx="20" ry="2.5"/>
<g class="mas__all">
  <rect class="mas__leg" x="14" y="38.8" width="3.6" height="9.2"/>
  <rect class="mas__leg" x="21.2" y="38.8" width="3.6" height="9.2"/>
  <rect class="mas__leg" x="39.2" y="38.8" width="3.6" height="9.2"/>
  <rect class="mas__leg" x="46.4" y="38.8" width="3.6" height="9.2"/>
  <g class="mas__body">
    <rect class="mas__arm mas__arm--l" x="3.2" y="26.4" width="8.2" height="7.2"/>
    <rect class="mas__arm mas__arm--r" x="52.6" y="26.4" width="8.2" height="7.2"/>
    <rect class="mas__face" x="10.4" y="12" width="43.2" height="28.8"/>
    <g class="mas__eyes"><rect x="17.6" y="19.2" width="3.6" height="7.2"/><rect x="42.8" y="19.2" width="3.6" height="7.2"/></g>
  </g>
</g></svg>`;

export function mountMascots(root = document) {
  root.querySelectorAll('[data-mascot]').forEach(n => { n.classList.add('mas'); n.innerHTML = SVG; });
}
// 상태: idle | wave | type | cheer
export function setMascot(node, state) {
  if (!node) return;
  [...node.classList].filter(c => c.startsWith('mas--')).forEach(c => node.classList.remove(c));
  node.classList.add('mas--' + state);
}
// 돌발 동작(한 번 하고 끝): hop 폴짝 | spin 공중제비 | dash 왔다 갔다 | wiggle 팔 파닥 | look 두리번 | squash 움찔 | shake 도리도리
const ANTICS = { hop: 500, spin: 750, dash: 1150, wiggle: 720, look: 1300, squash: 450, shake: 420 };
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function antic(node, name) {
  if (!node || still()) return;
  Object.keys(ANTICS).forEach(k => node.classList.remove('mas--' + k)); void node.offsetWidth;
  node.classList.add('mas--' + name);
  clearTimeout(node._anticT); node._anticT = setTimeout(() => node.classList.remove('mas--' + name), ANTICS[name] + 60);
}
export const hopMascot = node => antic(node, 'hop');
// 가만히 두면 심심해하는 캐릭터: 화면에 보이는 동안 1.4-3초마다 아무 동작이나 한다. 반환값을 부르면 멈춘다.
export function startAntics(node, { min = 1400, max = 3000 } = {}) {
  if (!node || still()) return () => {};
  const pool = ['hop', 'spin', 'dash', 'wiggle', 'look', 'squash'];
  let t = 0, prev = '';
  const next = () => {
    t = setTimeout(() => {
      if (node.offsetParent !== null && !document.hidden) { let a; do { a = pool[Math.floor(Math.random() * pool.length)]; } while (a === prev); prev = a; antic(node, a); }
      next();
    }, min + Math.random() * (max - min));
  };
  next();
  return () => clearTimeout(t);
}
