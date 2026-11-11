// 공방 도우미 캐릭터(자체 제작 SVG). 고정 마크업만 쓰고 사용자 입력은 넣지 않는다.
const SVG = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
<ellipse class="mas__shadow" cx="32" cy="60" rx="14" ry="2.5"/>
<g class="mas__all">
  <rect class="mas__leg" x="22" y="46" width="5" height="10" rx="2.5"/>
  <rect class="mas__leg" x="37" y="46" width="5" height="10" rx="2.5"/>
  <g class="mas__body">
    <line class="mas__ant" x1="32" y1="15" x2="32" y2="8"/>
    <circle class="mas__tip" cx="32" cy="6" r="3.5"/>
    <rect class="mas__arm mas__arm--l" x="4" y="30" width="11" height="5" rx="2.5"/>
    <rect class="mas__arm mas__arm--r" x="49" y="30" width="11" height="5" rx="2.5"/>
    <rect class="mas__face" x="12" y="15" width="40" height="34" rx="12"/>
    <g class="mas__eyes"><rect x="23" y="26" width="5" height="9" rx="2.5"/><rect x="36" y="26" width="5" height="9" rx="2.5"/></g>
    <path class="mas__mouth" d="M27 40q5 4 10 0"/>
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
export function hopMascot(node) {
  if (!node) return;
  node.classList.remove('mas--hop'); void node.offsetWidth; node.classList.add('mas--hop');
}
