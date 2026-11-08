// 모든 앱 틀이 공유하는 뼈대: 테마 적용, 떨어지는 장식 효과, 제목, 주인공 말풍선
import { el, html } from '../util.js';

export function frame(root, ctx) {
  const { d, rng } = ctx;
  const t = d.theme;
  for (const [k, v] of [['bg', t.bg], ['ac', t.ac], ['ac-deep', t.acDeep], ['ac-ink', t.acInk], ['ink', t.ink], ['muted', t.muted], ['card', t.card], ['line', t.line]]) root.style.setProperty('--p-' + k, v);
  html(root, '');

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

  const app = el('div', 'app');
  const ttl = el('div', 'ttl');
  const h3 = el('h3', '', d.name);
  ttl.appendChild(h3);
  ttl.appendChild(el('span', 'chip', `${d.app.label}, ${d.theme.label} 분위기, ${d.level.label}`));
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

  let sayT;
  const speak = (text, ms = 0) => {
    say.textContent = text;
    em.style.animation = 'none'; void em.offsetWidth; em.style.animation = '';
    clearTimeout(sayT);
    if (ms) sayT = setTimeout(() => { say.textContent = d.char.lines[1]; }, ms);
  };
  return { body, say: speak, char: d.char, theme: t, destroyFrame: () => clearTimeout(sayT) };
}

export function btn(label, cls = 'pb', onClick) {
  const b = el('button', cls, label);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}
export function stat(label, value) {
  const s = el('div', 'stat'); s.append(label + ' '); const b = el('b', '', String(value)); s.appendChild(b);
  s.set = v => { b.textContent = String(v); };
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
