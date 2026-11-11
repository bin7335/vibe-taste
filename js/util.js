// 공통 도우미: 난수, 이름 정리, 효과음, DOM, 토스트, URL 상태
import { KINDS, APPS, THEMES, CHARS, LEVELS, NAME_PATTERNS, BANNED, SOUNDS, VOICES, SIZES, FXS } from './data.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// 정적 마크업(사용자 입력 없음)을 넣을 때만 사용
export function html(parent, markup) { parent.innerHTML = markup; return parent; }

export const wait = ms => new Promise(r => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// 시드 고정 난수(mulberry32): 같은 시드면 같은 결과 → QR로 가져가도 똑같이 보임
export function rng(seed) {
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.int = (n) => Math.floor(f() * n);
  f.pick = (arr) => arr[f.int(arr.length)];
  f.shuffle = (arr) => { const c = [...arr]; for (let i = c.length - 1; i > 0; i--) { const j = f.int(i + 1); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  return f;
}
export const newSeed = () => 100000 + Math.floor(Math.random() * 900000);

// 앱 이름: 한글·글자·숫자·몇 가지 기호만, 12자. 화면에는 항상 textContent로만 넣는다.
export function sanitizeName(s) {
  return String(s ?? '').replace(/[^\p{L}\p{N} !?.♥♡★☆~\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
}
export function isBanned(s) {
  const n = String(s ?? '').toLowerCase().replace(/[\s!?.♥♡★☆~\-]/g, '');
  return BANNED.some(w => n.includes(w));
}

export function defaultName(S) {
  const r = rng(S.seed + 7);
  return r.pick(NAME_PATTERNS)(THEMES[S.theme].label, CHARS[S.char].name, APPS[S.app].label);
}

// ----- URL 상태 (서버 없이 QR·링크로 공유) -----
export function parseParams(search) {
  const p = new URLSearchParams(search);
  const app = p.get('a'), theme = p.get('t'), ch = p.get('c');
  if (!APPS[app] || !THEMES[theme] || !CHARS[ch]) return null;
  const level = clamp(parseInt(p.get('d'), 10) || 2, 1, 4);
  const seed = clamp(parseInt(p.get('s'), 10) || newSeed(), 1, 2147483647);
  let name = sanitizeName(p.get('n'));
  if (isBanned(name)) name = '';
  const kind = Object.keys(KINDS).find(k => KINDS[k].apps.includes(app) || (KINDS[k].old || []).includes(app));
  const pickKey = (v, table, dflt) => (v in table ? v : dflt);
  return { kind, app, theme, char: ch, level, seed, name,
    sound: pickKey(p.get('so'), SOUNDS, 'bell'), voice: pickKey(p.get('v'), VOICES, 'kind'), size: pickKey(p.get('z'), SIZES, 'normal'), fx: pickKey(p.get('fx'), FXS, 'confetti') };
}
export function buildQuery(S) {
  const p = new URLSearchParams({ a: S.app, t: S.theme, c: S.char, d: String(S.level), s: String(S.seed), so: S.sound, v: S.voice, z: S.size, fx: S.fx });
  if (S.name) p.set('n', S.name);
  return '?' + p.toString();
}
export function shareUrl(S) {
  return location.origin + location.pathname + buildQuery(S);
}

// ----- 효과음(WebAudio, 외부 파일 없음) -----
let ac = null;
export function beep(freq = 660, dur = 0.12, type = 'sine', vol = 0.08) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
    return o;
  } catch (e) { return null; }
}
// 효과음 프로필(선택 7): 음색과 크기, 또는 무음
let profile = SOUNDS.bell;
export function setSound(key) { profile = SOUNDS[key] || SOUNDS.bell; }
const fx = (f, d, type, vol) => profile.mute ? null : beep(f, d, profile.type || type, vol * profile.vol);
const ping = k => { try { document.dispatchEvent(new CustomEvent('vt:sfx', { detail: k })); } catch (e) {} }; // 앱 틀이 받아 화면 반응을 낸다
export const sfx = {
  tap: () => fx(880, 0.06, 'square', 0.04),
  ok: () => { ping('ok'); fx(660, 0.1, 'sine', 0.08); setTimeout(() => fx(990, 0.14, 'sine', 0.08), 90); },
  no: () => { ping('no'); return fx(180, 0.2, 'sawtooth', 0.06); },
  win: () => { ping('win'); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => fx(f, 0.18, 'sine', 0.08), i * 110)); },
  tick: () => fx(1200, 0.03, 'square', 0.02),
};

// ----- 토스트 -----
let toastT;
export function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200);
}

export async function copyText(s) {
  try { await navigator.clipboard.writeText(s); return true; } catch (e) {
    try { const ta = el('textarea'); ta.value = s; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e2) { return false; }
  }
}

export function describe(S) {
  const base = CHARS[S.char], v = VOICES[S.voice] || VOICES.kind;
  const char = { ...base, lines: v.lines(base.name), cheer: v.cheer(base.name), sad: v.sad(base.name) };
  return {
    kind: KINDS[S.kind], app: APPS[S.app], theme: THEMES[S.theme], char, level: LEVELS[S.level],
    sound: SOUNDS[S.sound] || SOUNDS.bell, voice: v, size: SIZES[S.size] || SIZES.normal, fx: FXS[S.fx] || FXS.confetti,
    name: S.name || defaultName(S),
  };
}

// 받침에 따라 조사를 고른다: josa('사탕', '으로/로') → '으로', josa('바다', '을/를') → '를'
export function josa(word, pair) {
  const [a, b] = pair.split('/');
  const c = String(word).trim().slice(-1).charCodeAt(0);
  if (!(c >= 0xac00 && c <= 0xd7a3)) return b;
  const jong = (c - 0xac00) % 28;
  if (pair === '으로/로') return jong === 0 || jong === 8 ? b : a;
  return jong ? a : b;
}
