// "AI가 코딩하는 중" 연출: 왼쪽 코드 타이핑 + 오른쪽 미리보기 조립
import { $, $$, describe, wait } from './util.js';

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

const STATUS = ['요청을 읽고 있어요', '앱 구조를 잡는 중', '분위기(테마) 입히는 중', '주인공을 불러오는 중', '동작 코드를 쓰는 중', '마무리 점검 중'];

// duration: 전체 연출 시간(ms). 반환: 끝나면 resolve. skip()으로 즉시 종료 가능.
export function runBuild(S, { duration = 5200, onDone }) {
  const d = describe(S);
  const code = codeFor(S);
  const pre = $('#code'), bar = $('#bbar'), status = $('#bstatus'), tab = $('#btab'), prev = $('#preview');
  const sk = [$('#sk1'), $('#sk2'), $('#sk3'), $('#sk4')];
  sk.forEach(s => s.classList.remove('in'));
  prev.style.removeProperty('--p-bg'); prev.style.removeProperty('--p-ink');
  $('.sk-char .em', prev).textContent = '';
  $$('.done-flash', prev).forEach(e => e.remove());
  pre.textContent = ''; bar.style.transform = 'scaleX(0)'; status.textContent = STATUS[0];

  let raf = 0, done = false, start = 0, lastStage = -1; // 백그라운드 탭에서도 진행되게 rAF 대신 setInterval
  const total = code.length;
  const finish = () => {
    if (done) return; done = true; clearInterval(raf);
    pre.textContent = code; bar.style.transform = 'scaleX(1)'; tab.textContent = code.split('\n').length + ' 줄';
    paint(1);
    const f = document.createElement('div'); f.className = 'done-flash'; f.textContent = '완성'; prev.appendChild(f);
    status.textContent = '완성! 앱을 여는 중…';
    setTimeout(() => onDone && onDone(), 650);
  };
  const paint = (p) => {
    const stage = p >= 0.97 ? 4 : p >= 0.72 ? 3 : p >= 0.48 ? 2 : p >= 0.22 ? 1 : 0;
    if (stage === lastStage) return; lastStage = stage;
    status.textContent = STATUS[Math.min(stage + 1, STATUS.length - 1)];
    if (stage >= 1) { prev.style.setProperty('--p-bg', d.theme.bg); prev.style.setProperty('--p-ink', d.theme.ink); sk[0].classList.add('in'); }
    if (stage >= 2) { sk[1].classList.add('in'); $('.sk-char .em', prev).textContent = d.char.emoji; }
    if (stage >= 3) sk[2].classList.add('in');
    if (stage >= 4) sk[3].classList.add('in');
  };
  const step = () => {
    if (done) return;
    const now = performance.now();
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    const n = Math.floor(total * p);
    pre.textContent = code.slice(0, n);
    const cur = document.createElement('span'); cur.className = 'cur'; pre.appendChild(cur);
    bar.style.transform = `scaleX(${p.toFixed(3)})`;
    tab.textContent = code.slice(0, n).split('\n').length + ' 줄';
    paint(p);
    if (p >= 1) return finish();
  };
  raf = setInterval(step, 33);
  return { skip: finish, cancel: () => { done = true; clearInterval(raf); } };
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
