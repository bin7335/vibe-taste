// "AI가 코딩하는 중" 연출: 왼쪽 코드 타이핑 + 오른쪽 미리보기 조립
import { $, $$, describe, wait } from './util.js';
import { setMascot } from './mascot.js';

const SNIPPETS = {
  reaction: d => [
    `function startRound() {`,
    `  pad.textContent = "기다려…";`,
    `  const delay = ${[2500, 2000, 1500, 1000][d.S.level - 1]} + Math.random() * 1500;`,
    `  setTimeout(goGreen, delay);  // 초록이 되면 탭!`,
    `}`,
    `pad.onpointerdown = () => {`,
    `  if (!green) return hero.say("너무 빨라!");`,
    `  record(performance.now() - t0);`,
    `};`,
  ],
  dodge: d => [
    `const player = { x: W / 2, emoji: "${d.char.emoji}" };`,
    `const speed = ${[1, 1.5, 2.2, 3][d.S.level - 1]};  // ${d.level.label}`,
    `function spawn() {`,
    `  drops.push({ x: Math.random() * W, y: -30, g: pick(${JSON.stringify(d.theme.glyphs.slice(0, 3))}) });`,
    `}`,
    `function loop() {`,
    `  for (const o of drops) o.y += 3 * speed;`,
    `  if (hit(player, o)) lives--;`,
    `  requestAnimationFrame(loop);`,
    `}`,
  ],
  quiz: d => [
    `const questions = shuffle(bank["${d.theme.label}"]).slice(0, ${[3, 4, 5, 6][d.S.level - 1]});`,
    `const timeLimit = ${[0, 15, 8, 5][d.S.level - 1]};  // 초, 0이면 무제한`,
    `function ask(q) {`,
    `  title.textContent = q.text;`,
    `  for (const c of shuffle(q.choices)) addChoice(c);`,
    `}`,
    `function answer(c) {`,
    `  c === q.answer ? (score++, hero.say("${d.char.lines[1]}")) : hero.say("${d.char.sad}");`,
    `}`,
  ],
  typing: d => [
    `const words = shuffle(${JSON.stringify(d.theme.words.slice(0, 4))}, …);`,
    `let timeLeft = ${[40, 30, 20, 15][d.S.level - 1]};`,
    `input.oninput = () => {`,
    `  if (input.value.trim() === current) {`,
    `    correct++; next(); sfx.ok();`,
    `  }`,
    `};`,
    `setInterval(() => { if (--timeLeft === 0) finish(); }, 1000);`,
  ],
  timer: d => [
    `let total = ${[10, 5, 3, 1][d.S.level - 1]} * 60;  // ${d.level.label}`,
    `function tick() {`,
    `  left--; ring.style.strokeDashoffset = C * (1 - left / total);`,
    `  if (left === Math.floor(total / 2)) hero.say("절반 지났어!");`,
    `  if (left === 0) { confetti(); sfx.win(); }`,
    `}`,
    `plus.onclick = () => total += 60;`,
  ],
  ladder: d => [
    `const seconds = ${[4, 2.8, 1.8, 1.1][d.S.level - 1]};  // ${d.level.label}`,
    `const ladder = Array.from({ length: 9 }, () => randomRungs(names.length));`,
    `function ride(col) {`,
    `  for (const row of ladder) col += row[col] ? 1 : row[col - 1] ? -1 : 0;`,
    `  return results[col];`,
    `}`,
    `start.onclick = () => names.forEach((name, i) => {`,
    `  hero.climbDown(i, seconds).then(() => board.add(\`\${name} → \${ride(i)}\`));`,
    `});`,
  ],
  picker: d => [
    `const names = textarea.value.split("\\n").filter(Boolean);`,
    `function spin() {`,
    `  let i = 0, speed = ${[90, 60, 35, 20][d.S.level - 1]};`,
    `  const t = setInterval(() => wheel.textContent = names[i++ % names.length], speed);`,
    `  setTimeout(() => { clearInterval(t); announce(pick(names)); }, ${[3000, 2200, 1500, 900][d.S.level - 1]});`,
    `}`,
    `hero.say(\`\${winner}, 당첨!\`);`,
  ],
  paint: d => [
    `const palette = ${JSON.stringify(d.theme.palette.slice(0, 4))};`,
    `const stamps = ["${d.char.emoji}", ${d.theme.glyphs.slice(0, 3).map(g => `"${g}"`).join(', ')}];`,
    `canvas.onpointermove = e => {`,
    `  if (!drawing) return;`,
    `  ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke();`,
    `};`,
    `mission = { word: pick(words), seconds: ${[0, 60, 30, 15][d.S.level - 1]} };`,
  ],
  piano: d => [
    `const notes = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3];`,
    `const keys = "asdfghjk";`,
    `function play(i) {`,
    `  osc.frequency.value = notes[i]; osc.start();`,
    `  keyEls[i].classList.add("on");`,
    `}`,
    `// 따라치기: ${d.char.name}가 ${[3, 4, 5, 7][d.S.level - 1]}개 음을 들려주면 똑같이!`,
    `simon.start({ length: ${[3, 4, 5, 7][d.S.level - 1]} });`,
  ],
  memory: d => [
    `const faces = ["${d.char.emoji}", ${d.theme.glyphs.slice(0, 3).map(g => `"${g}"`).join(', ')}, …];  // ${[4, 6, 8, 10][d.S.level - 1]}쌍`,
    `const deck = shuffle([...faces, ...faces]);`,
    `function flip(card) {`,
    `  open.push(card);`,
    `  if (open.length === 2) open[0].face === open[1].face ? match() : hideLater(650);`,
    `}`,
  ],
  mole: d => [
    `const holes = grid(3, 3);`,
    `const upFor = ${[1100, 850, 620, 450][d.S.level - 1]};  // ${d.level.label}: 올라와 있는 시간(ms)`,
    `function pop() {`,
    `  hole = pick(holes); hole.textContent = Math.random() < 0.15 ? "💣" : "${d.char.emoji}";`,
    `  setTimeout(pop, upFor + Math.random() * 300);`,
    `}`,
    `hole.onpointerdown = () => isBomb ? (score -= 3) : score++;`,
  ],
  flash: d => [
    `const cards = bank["${d.theme.label}"].map(q => ({ front: q.text, back: q.answer }));`,
    `card.onclick = () => card.flip();`,
    `function grade(known) {`,
    `  if (!known) again.push(card);   // 모르는 카드는 다음 회차에`,
    `  next();`,
    `}`,
    `// ${[3, 4, 5, 6][d.S.level - 1]}장, 모를 때마다 다시`,
  ],
  math: d => [
    `const level = ${d.S.level};  // ${['덧셈·뺄셈 20 이내', '덧셈·뺄셈 100 이내', '곱셈 구구단', '곱셈·나눗셈 혼합'][d.S.level - 1]}`,
    `function make() {`,
    `  const a = rand(${[20, 90, 8, 8][d.S.level - 1]}), b = rand(${[20, 90, 9, 9][d.S.level - 1]});`,
    `  return level >= 3 ? [a + " × " + b, a * b] : [a + " + " + b, a + b];`,
    `}`,
    `input.onkeydown = e => e.key === "Enter" && check(Number(input.value));`,
  ],
  groups: d => [
    `const names = textarea.value.split("\\n").filter(Boolean);`,
    `const size = ${[2, 3, 4, 5][d.S.level - 1]};  // 모둠 인원`,
    `const groups = chunk(shuffle(names), Math.round(names.length / size));`,
    `groups.forEach((g, i) => render(\`\${i + 1}모둠\`, g, { leader: g[0] }));`,
    `hero.say("첫 번째가 모둠장!");`,
  ],
  checklist: d => [
    `const items = ${JSON.stringify(['교실 환기하기', '출석 확인', '알림장 쓰기'])}.map(t => ({ t, done: false }));`,
    `function render() {`,
    `  const done = items.filter(i => i.done).length;`,
    `  bar.style.transform = \`scaleX(\${done / items.length})\`;`,
    `  if (done === items.length) hero.say("${d.char.cheer}");`,
    `}`,
    `addButton.onclick = () => items.push({ t: input.value, done: false });`,
  ],
  beat: d => [
    `const rows = ["킥", "스네어", "하이햇", "멜로디"], steps = 8;`,
    `let bpm = ${[80, 100, 120, 140][d.S.level - 1]};  // ${d.level.label}`,
    `setInterval(() => {`,
    `  rows.forEach((r, i) => grid[i][step] && play(r));`,
    `  step = (step + 1) % steps;`,
    `}, 60000 / bpm / 2);`,
    `cell.onclick = () => grid[i][c] = !grid[i][c];`,
  ],
  pixel: d => [
    `const N = ${[8, 12, 16, 20][d.S.level - 1]};  // ${d.S.level}단계: ${[8, 12, 16, 20][d.S.level - 1]}×${[8, 12, 16, 20][d.S.level - 1]} 칸`,
    `const palette = ${JSON.stringify(d.theme.palette.slice(0, 4))};`,
    `canvas.onpointermove = e => {`,
    `  if (!down) return;`,
    `  cells[cellAt(e)] = color; draw();`,
    `};`,
    `save.onclick = () => download(canvas.toDataURL("image/png"), "${d.name}.png");`,
  ],
};

export function codeFor(S) {
  const d = describe(S); d.S = S;
  const head = [
    `// 🧑‍🏫 요청: "${d.theme.label} 분위기의 ${d.app.label}, 주인공은 ${d.char.label}, ${d.level.label}"`,
    `import { createApp, Hero, sfx } from "./vibe-kit.js";`,
    ``,
    `const app = createApp({`,
    `  name: "${d.name}",`,
    `  type: "${d.app.label}",`,
    `  theme: "${d.theme.label}",      // ${d.theme.sub}`,
    `  hero: "${d.char.emoji} ${d.char.name}",`,
    `  level: ${S.level},               // ${d.level.label}`,
    `  sound: "${d.sound.label}",${d.sound.mute ? '          // 무음' : ''}`,
    `  voice: "${d.voice.label}",`,
    `  scale: ${d.size.scale},            // ${d.size.label}`,
    `  celebrate: "${d.fx.label}",`,
    `});`,
    ``,
    `const hero = new Hero("${d.char.emoji}", { greet: "${d.char.lines[0]}" });`,
    ``,
  ];
  const tail = [``, `app.mount("#stage");   // 완성!`];
  return [...head, ...SNIPPETS[S.app](d), ...tail].join('\n');
}

const STATUS = ['뼈대를 세우고 있어요', '분위기를 입히고 있어요', '주인공을 불러오고 있어요', '움직이는 코드를 쓰고 있어요', '잘 되는지 시험하고 있어요', '다 만들었어요!'];
const TODO = ['뼈대 세우기', '분위기 입히기', '주인공 부르기', '동작 만들기', '테스트'];
const THOUGHTS = ['어떤 앱인지 살펴보는 중', '필요한 화면을 떠올리는 중', '만드는 순서를 정하는 중'];

// 코드 한 줄을 색칠해 span으로 만든다(textContent만 사용).
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')|\b(const|let|import|from|new|if|return|function|for|of|else|await)\b|\b(\d+(?:\.\d+)?)\b/g;
export function paintCode(parent, text) {
  let last = 0, m; TOKEN.lastIndex = 0;
  const put = (t, cls) => { if (!t) return; const n = document.createElement('span'); if (cls) n.className = cls; n.textContent = t; parent.appendChild(n); };
  while ((m = TOKEN.exec(text))) {
    put(text.slice(last, m.index));
    put(m[0], m[1] ? 'c-cm' : m[2] ? 'c-st' : m[3] ? 'c-kw' : 'c-nu');
    last = m.index + m[0].length;
  }
  put(text.slice(last));
}

// duration: 전체 연출 시간(ms). skip()으로 즉시 종료 가능.
// 터미널 대본: 요청 입력 → 생각 → 뼈대 → 분위기 → 주인공 → 코드 쓰기(줄마다 타이핑) → 테스트 → 완성
export function runBuild(S, { duration = 7000, onDone }) {
  const d = describe(S);
  const lines = codeFor(S).split('\n').slice(1); // 첫 줄(요청 주석)은 프롬프트로 대신 보여 준다
  const pre = $('#code'), bar = $('#bbar'), status = $('#bstatus'), tab = $('#btab'), prev = $('#preview'), mas = $('#masBuild'), track = $('#btrack');
  const todoBox = $('#btodo'), act = $('#bact'), tok = $('#btok');
  const sk = [$('#sk1'), $('#sk2'), $('#sk3'), $('#sk4')];
  const em = $('.sk-char .em', prev), bub = $('.sk-char .bub', prev), keys = $$('#sk4 span'), waitMsg = $('#pvWait');
  const VARS = ['bg', 'ink', 'card', 'ac', 'muted'];
  sk.forEach(s => s.classList.remove('in'));
  [sk[0], em, bub, sk[2], ...keys].forEach(n => n.classList.remove('is-real'));
  [sk[0], em, bub, sk[2]].forEach(n => { n.textContent = ''; });
  VARS.forEach(k => prev.style.removeProperty('--p-' + k));
  prev.classList.remove('is-themed'); waitMsg.hidden = false;
  const real = (n, text) => { if (n.classList.contains('is-real')) return; n.textContent = text; n.classList.add('is-real'); };
  $$('.done-flash', prev).forEach(e => e.remove());
  pre.textContent = ''; bar.style.transform = 'scaleX(0)';
  setMascot(mas, 'run'); track.style.setProperty('--p', '0');

  const span = (cls, text) => { const n = document.createElement('span'); if (cls) n.className = cls; n.textContent = text; return n; };
  const row = (cls) => { const r = document.createElement('div'); r.className = 'tl ' + cls; return r; };

  // 할 일 목록(터미널 아래 고정) + 미리보기 조립을 같은 단계로 묶는다
  todoBox.textContent = '';
  const todoEls = TODO.map(t => { const e = span('td', t); todoBox.appendChild(e); return e; });
  const mile = (i) => {
    todoEls.forEach((e, j) => { e.className = 'td' + (j < i ? ' is-done' : j === i ? ' is-cur' : ''); });
    status.textContent = STATUS[Math.min(i, STATUS.length - 1)];
    act.textContent = i < TODO.length ? `단계 ${i + 1}/${TODO.length} · ${TODO[i]}` : '완성';
    if (i >= 1) { waitMsg.hidden = true; sk.forEach(s => s.classList.add('in')); }                  // 뼈대: 회색 틀
    if (i >= 2) { VARS.forEach(k => prev.style.setProperty('--p-' + k, d.theme[k])); prev.classList.add('is-themed'); real(sk[0], d.name); } // 분위기: 색과 제목
    if (i >= 3) { real(em, d.char.emoji); real(bub, d.char.lines[0]); }                                // 주인공: 얼굴과 첫 인사
    if (i >= 4) real(sk[2], d.app.label);                                                              // 동작: 앱 본체
    if (i >= 5) keys.forEach(k => k.classList.add('is-real'));                                         // 테스트 통과: 버튼
  };
  mile(0);

  let written = 0, lastStep = null;
  const L = [];
  const add = (cost, make, upd) => L.push({ cost, make, upd });
  const closeStep = () => { if (lastStep) lastStep.classList.add('is-done'); };
  const say = (cls, text, cost = 1.5) => add(cost, () => { const r = row(cls); r.textContent = text; return r; });
  const step = (text, m) => add(2, () => { closeStep(); if (m != null) mile(m); const r = row('tl--step'); const ic = document.createElement('i'); ic.className = 'tl__ic'; r.append(ic, span('', text)); lastStep = r; return r; });
  const file = (name) => add(1.5, () => { const r = row('tl--ok'); r.append(span('tl__ok', '  + '), span('', name)); return r; });
  const gauge = (label) => add(5, () => {
    const r = row('tl--bar'); const b = span('tbar', ''); const i = document.createElement('i'); b.appendChild(i);
    const pct = span('tl__pct', '0%'); r.append(span('', '  ' + label + ' '), b, pct); r._i = i; r._p = pct; return r;
  }, (r, k) => { const v = Math.round(k * 100); r._i.style.width = v + '%'; r._p.textContent = v + '%'; if (k >= 1) r.classList.add('is-done'); });
  const test = (name) => add(2.5, () => { const r = row('tl--test'); const ic = document.createElement('i'); ic.className = 'tl__ic'; r._ms = span('tl__dim', ''); r.append(span('', '  '), ic, span('', ' ' + name), r._ms); return r; },
    (r, k) => { if (k >= 1 && !r._ok) { r._ok = true; r.classList.add('is-done'); r._ms.textContent = `  ${8 + name.length * 3}ms`; } });

  add(1, () => { const r = row('tl--banner'); r.append(span('tl__star', '✻ '), span('', '바이브코딩 공방 터미널'), span('tl__dim', '  AI 연결됨')); return r; });
  const ask = `${d.theme.label} 분위기의 ${d.app.label} 만들어 줘. 주인공은 ${d.char.label}, 이름은 "${d.name}"`;
  add(12, () => { const r = row('tl--prompt'); r._t = span('', ''); r.append(span('tl__g', '> '), r._t); return r; }, (r, k) => { r._t.textContent = ask.slice(0, Math.ceil(ask.length * k)); });
  add(6, () => { const r = row('tl--think'); r._t = span('tl__shim', ''); r.append(span('tl__star', '✻ '), r._t); return r; },
    (r, k) => { if (k >= 1) { r.classList.add('is-done'); r._t.textContent = '생각 끝! 만들 순서를 정했어요'; } else r._t.textContent = THOUGHTS[Math.min(2, Math.floor(k * 3))] + '…'; });
  step('뼈대 세우기', 0);
  file('index.html'); file('style.css'); file('app.js');
  step('분위기 입히기', 1);
  gauge(`${d.theme.label} 색과 배경`);
  step('주인공 부르기', 2);
  gauge(`${d.char.emoji} ${d.char.name} 데려오는 중`);
  step('동작 만들기  app.js', 3);
  lines.forEach((t, i) => add(1, () => row('tl--code'), (r, k) => {
    r.textContent = ''; r.appendChild(span('tl__n', String(i + 1).padStart(3, ' ') + ' + '));
    paintCode(r, t.slice(0, Math.ceil(t.length * k)) || ' '); written = Math.max(written, i + 1);
  }));
  say('tl--sub', `  └ app.js에 ${lines.length}줄을 썼어요`, 2);
  step('테스트 돌리기', 4);
  test('화면이 잘 열려요'); test('버튼이 잘 눌려요'); test('스마트폰에서도 딱 맞아요');
  add(3, () => { closeStep(); mile(5); const r = row('tl--done'); r.textContent = `✓ 완성! "${d.name}"`; return r; });
  say('tl--sub', `  파일 3개 · 코드 ${lines.length}줄 · 테스트 3/3 통과`, 2);

  let total = 0; L.forEach(l => { l.at = total; total += l.cost; });
  const tokens = Math.round(lines.join('\n').length * 0.7) + 240;

  const cur = document.createElement('span'); cur.className = 'cur';
  let shown = 0, active = null;
  const render = (t) => {
    while (shown < L.length && L[shown].at <= t) {
      if (active && active.l.upd) active.l.upd(active.r, 1);
      const l = L[shown++]; const r = l.make(); pre.appendChild(r); active = { l, r };
    }
    if (active && active.l.upd) active.l.upd(active.r, Math.min(1, (t - active.l.at) / active.l.cost));
    if (pre.lastElementChild) pre.lastElementChild.appendChild(cur);
    pre.scrollTop = pre.scrollHeight;
  };

  let timer = 0, done = false, start = 0; // 백그라운드 탭에서도 진행되게 rAF 대신 setInterval
  const meter = (ms, p) => { tab.textContent = `${written}줄 · ${(ms / 1000).toFixed(1)}초`; tok.textContent = `토큰 ${Math.round(tokens * p).toLocaleString('ko-KR')}`; };
  const finish = () => {
    if (done) return; done = true; clearInterval(timer);
    render(total + 1); cur.remove(); pre.scrollTop = pre.scrollHeight;
    bar.style.transform = 'scaleX(1)'; track.style.setProperty('--p', '1'); meter(start ? performance.now() - start : 0, 1);
    setMascot(mas, 'cheer');
    const f = document.createElement('div'); f.className = 'done-flash'; f.textContent = '완성!'; prev.appendChild(f);
    status.textContent = '다 만들었어요! 앱을 여는 중이에요';
    setTimeout(() => onDone && onDone(), 650);
  };
  const tick = () => {
    if (done) return;
    const now = performance.now();
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    render(total * p);
    bar.style.transform = `scaleX(${p.toFixed(3)})`; track.style.setProperty('--p', p.toFixed(3));
    meter(now - start, p);
    if (p >= 1) return finish();
  };
  render(0.5);
  timer = setInterval(tick, 33);
  return { skip: finish, cancel: () => { done = true; clearInterval(timer); } };
}

// 교사용: 실제 AI에게 시킬 때 쓰는 프롬프트
export function promptFor(S) {
  const d = describe(S);
  return [
    `너는 초등학생도 쓸 수 있는 웹앱을 만드는 개발자야. 아래 조건으로 HTML 파일 하나로 동작하는 앱을 만들어 줘.`,
    ``,
    `- 앱 종류: ${d.app.label} (${d.app.sub})`,
    `- 앱 이름: "${d.name}"`,
    `- 분위기: ${d.theme.label} 테마 (${d.theme.sub}). 배경·버튼 색을 여기에 맞추고 ${d.theme.glyphs.slice(0, 3).join(' ')} 같은 장식 효과를 넣어 줘.`,
    `- 주인공 캐릭터: ${d.char.label} "${d.char.name}" ${d.char.emoji}. 화면에 말풍선으로 "${d.char.lines[0]}" 같은 응원 멘트를 해 줘.`,
    `- 난이도: ${d.level.label} (${d.level.sub})`,
    `- 주인공 말투: ${d.voice.label}. 예: ${d.voice.sub}`,
    `- 효과음: ${d.sound.label}${d.sound.mute ? '' : ' (Web Audio로 직접 만들기)'}`,
    `- 글자·버튼 크기: ${d.size.label} (${d.size.sub})`,
    `- 축하 효과: ${d.fx.label} (${d.fx.sub})`,
    `- 조건: 스마트폰에서도 되게 반응형으로, 외부 라이브러리·서버 없이, 한국어 UI.`,
    ``,
    `다 만들면 실행 방법을 한 줄로 알려 줘.`,
    ``,
    `(고치고 싶을 때 이렇게 말하면 돼요) "배경을 바다로 바꿔 줘", "주인공을 공룡으로", "더 빠르게 해 줘", "제목을 '${d.name}'로 바꿔 줘"`,
  ].join('\n');
}
