// 모든 앱 틀이 공유하는 뼈대: 테마 적용, 떨어지는 장식 효과, 제목, 주인공 말풍선
import { el, html } from '../util.js';

// 축하 조각: 한가운데에서 터져 나갔다가 떨어진다. 시드 난수를 쓰지 않아 앱 내용(문제 순서 등)에는 영향이 없다.
function burst(root, d, power = 1) {
  const n = Math.round(d.fx.n * 2.2 * power);
  if (!n) return; // "차분하게"를 고르면 터뜨리지 않는다
  const box = el('div', 'burst'); box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < n; i++) {
    const s = el('i'), ang = Math.random() * Math.PI * 2, dist = 110 + Math.random() * 270;
    s.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
    s.style.setProperty('--dy', Math.round(Math.sin(ang) * dist - 110) + 'px');
    s.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg');
    s.style.background = d.theme.palette[i % 5];
    s.style.animationDelay = Math.round(Math.random() * 120) + 'ms';
    box.appendChild(s);
  }
  root.appendChild(box);
  setTimeout(() => box.remove(), 1800);
}

export function frame(root, ctx) {
  const { d, rng, S } = ctx;
  const t = d.theme;
  for (const [k, v] of [['bg', t.bg], ['ac', t.ac], ['ac-deep', t.acDeep], ['ac-ink', t.acInk], ['ink', t.ink], ['muted', t.muted], ['card', t.card], ['line', t.line]]) root.style.setProperty('--p-' + k, v);
  root.dataset.theme = S.theme; // 테마별 배경(별·물결·언덕·물방울무늬)은 CSS가 그린다
  root.classList.remove('fb-ok', 'fb-no');
  html(root, '');

  const bg = el('div', 'bg'); bg.setAttribute('aria-hidden', 'true');
  root.appendChild(bg);

  const fx = el('div', 'fx'); fx.setAttribute('aria-hidden', 'true');
  // 잘라 붙인 색종이 조각: 테마 팔레트 색으로, 글자·이모지 없이
  root.style.fontSize = (d.size.scale * 100) + '%';
  const n = d.fx.n;
  for (let i = 0; i < n; i++) {
    const s = el('span');
    s.style.left = (i * (100 / n) + rng() * 8) + '%';
    s.style.background = rng.pick(t.palette.slice(0, 5));
    s.style.animationDuration = (9 + rng() * 9) + 's';
    s.style.animationDelay = (-rng() * 14) + 's';
    fx.appendChild(s);
  }
  root.appendChild(fx);
  const glow = el('div', 'glow'); glow.setAttribute('aria-hidden', 'true');
  root.appendChild(glow);

  // 앱 바: 아이콘 + 이름 + 한 줄 설명
  const app = el('div', 'app');
  const ttl = el('div', 'ttl');
  const ico = el('span', 'app-ico', d.app.emoji); ico.setAttribute('aria-hidden', 'true');
  const text = el('div', 'ttl__text');
  text.appendChild(el('h3', '', d.name));
  text.appendChild(el('span', 'app-sub', `${d.app.label} · ${d.theme.label} 분위기 · ${d.level.label}`));
  const dots = el('span', 'app-dots'); dots.setAttribute('aria-hidden', 'true'); dots.append(el('i'), el('i'), el('i'));
  ttl.append(ico, text, dots);
  app.appendChild(ttl);

  const hero = el('div', 'hero-char');
  const em = el('span', 'em', d.char.emoji);
  const say = el('div', 'say', d.char.lines[0]);
  hero.append(em, say);
  app.appendChild(hero);

  const body = el('div', 'body');
  body.style.display = 'flex'; body.style.flexDirection = 'column'; body.style.gap = '12px';
  app.appendChild(body);
  root.appendChild(app);

  const retrigger = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
  let sayT;
  const speak = (text, ms = 0) => {
    say.textContent = text;
    em.style.animation = 'none'; void em.offsetWidth; em.style.animation = '';
    retrigger(say, 'pop');
    clearTimeout(sayT);
    if (ms) sayT = setTimeout(() => { say.textContent = d.char.lines[1]; }, ms);
  };

  // 효과음이 날 때 화면도 같이 반응한다: 정답은 초록 테두리, 오답은 빨간 테두리와 흔들림, 승리는 색종이
  const onSfx = (e) => {
    const k = e.detail;
    if (k === 'win') burst(root, d);
    if (k === 'ok' || k === 'no') { root.classList.remove('fb-ok', 'fb-no'); void root.offsetWidth; root.classList.add('fb-' + k); }
  };
  document.addEventListener('vt:sfx', onSfx);
  const hello = setTimeout(() => burst(root, d, 0.7), 420); // 완성 순간의 "짠!"

  return { body, say: speak, char: d.char, theme: t, destroyFrame: () => { clearTimeout(sayT); clearTimeout(hello); document.removeEventListener('vt:sfx', onSfx); } };
}

export function btn(label, cls = 'pb', onClick) {
  const b = el('button', cls, label);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}
export function stat(label, value) {
  const s = el('div', 'stat'); s.append(label + ' '); const b = el('b', '', String(value)); s.appendChild(b);
  s.set = v => { const t = String(v); if (b.textContent === t) return; b.textContent = t; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); };
  return s;
}
export function overlay(parent, title, sub, buttonLabel, onClick) {
  const o = el('div', 'over');
  const box = el('div');
  box.appendChild(el('h4', '', title));
  if (sub) box.appendChild(el('p', '', sub));
  const b = btn(buttonLabel, 'pb', () => { o.remove(); onClick && onClick(); });
  box.appendChild(b);
  o.appendChild(box); parent.appendChild(o);
  return o;
}
export const fmtMs = ms => ms < 1000 ? Math.round(ms) + 'ms' : (ms / 1000).toFixed(2) + '초';
