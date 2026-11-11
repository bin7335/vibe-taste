// 모달: QR 공유, 프롬프트 보기
import { QR } from './qr.js';
import { $, el, html, shareUrl, copyText, toast } from './util.js';
import { promptFor, codeFor, paintCode } from './build.js';

const modal = () => $('#modal'), sheet = () => $('#sheet');

let opener = null;
export function closeModal() { modal().hidden = true; html(sheet(), ''); if (opener && opener.isConnected) opener.focus({ preventScroll: true }); opener = null; }

function openSheet(title, desc) {
  const s = sheet(); html(s, ''); s.classList.remove('sheet--wide');
  const x = el('button', 'x', '✕'); x.setAttribute('aria-label', '닫기'); x.onclick = closeModal; s.appendChild(x);
  s.appendChild(el('h3', '', title));
  if (desc) s.appendChild(el('p', '', desc));
  if (modal().hidden) opener = document.activeElement;
  modal().hidden = false; x.focus({ preventScroll: true });
  return s;
}

export function showQr(S) {
  const url = shareUrl(S);
  const s = openSheet('내 폰으로 가져가기', '카메라로 QR을 찍으면 방금 만든 앱이 그대로 열려요. 서버에 저장하지 않고 주소 안에 선택값만 담았어요.');
  const box = el('div', 'qrbox');
  const svgWrap = el('div');
  try { svgWrap.innerHTML = QR.toSvg(url); } catch (e) { svgWrap.textContent = 'QR 생성 실패'; }
  box.appendChild(svgWrap.firstElementChild || svgWrap);
  box.appendChild(el('div', 'url', url));
  s.appendChild(box);
  const row = el('div', 'row');
  const copy = el('button', 'btn primary', '링크 복사');
  copy.onclick = async () => toast(await copyText(url) ? '링크를 복사했어요' : '복사가 막혔어요. 주소를 길게 눌러 복사하세요');
  row.appendChild(copy);
  if (navigator.share) { const sh = el('button', 'btn', '공유하기'); sh.onclick = () => navigator.share({ title: '상상을 앱으로 - 바이브코딩 공방', url }).catch(() => {}); row.appendChild(sh); }
  s.appendChild(row);
}

export function showPrompt(S) {
  const s = openSheet('진짜 AI에게 시키려면?', '방금 버튼으로 고른 것을 말로 풀면 이런 프롬프트가 돼요. Claude·ChatGPT·Gemini 어디에 붙여 넣어도 비슷한 앱이 나옵니다.');
  const ta = el('textarea'); ta.readOnly = true; ta.value = promptFor(S); s.appendChild(ta);
  const row = el('div', 'row');
  const copy = el('button', 'btn primary', '프롬프트 복사');
  copy.onclick = async () => toast(await copyText(ta.value) ? '프롬프트를 복사했어요' : '복사가 막혔어요. 글을 길게 눌러 복사하세요');
  row.appendChild(copy);
  s.appendChild(row);
  const tip = el('p', '', '팁: 교실에서는 학생이 조건을 "말"로 먼저 쓰게 하고, AI 결과를 보며 "뭘 더 말해야 했지?"를 찾는 활동이 바이브코딩 수업의 핵심이에요.');
  tip.style.marginTop = '12px'; s.appendChild(tip);
}

export function showCode(S) {
  const s = openSheet('AI가 쓴 코드', '이 앱의 뼈대가 되는 코드예요. 체험용으로 핵심만 간추려 보여 줘요. 내가 고른 이름, 분위기, 주인공이 어디에 들어갔는지 찾아보세요.');
  s.classList.add('sheet--wide');
  const code = codeFor(S);
  const view = el('div', 'codeview'); view.tabIndex = 0; view.setAttribute('aria-label', '만들어진 코드');
  code.split('\n').forEach((t, i) => { const r = el('div', 'cv'); r.appendChild(el('span', 'cv__n', String(i + 1))); const c = el('span', 'cv__c'); paintCode(c, t || ' '); r.appendChild(c); view.appendChild(r); });
  s.appendChild(view);
  const row = el('div', 'row');
  const copy = el('button', 'btn primary', '코드 복사');
  copy.onclick = async () => toast(await copyText(code) ? '코드를 복사했어요' : '복사가 막혔어요. 글을 길게 눌러 복사하세요');
  row.appendChild(copy);
  row.appendChild(el('span', 'cv__meta', `app.js · ${code.split('\n').length}줄`));
  s.appendChild(row);
}

export function initModal() {
  modal().addEventListener('click', e => { if (e.target === modal()) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal().hidden) closeModal(); });
}
