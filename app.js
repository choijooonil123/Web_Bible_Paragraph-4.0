/* --------- Utils --------- */

// ===== [BOOK HEAD CHIPS] 각 책의 1장 첫 단락 '설교' 오른쪽에 칩스 주입 =====

function ensureBookHeadChips(){
  const doc = document;

  // 1) 책 노드 찾기
  const books = doc.querySelectorAll('#tree > details, details.book');
  if (!books.length) {
    console.warn('[bookchips] 책(details) 없음: #tree 구조를 확인하세요.');
    return;
  }

  books.forEach((bookEl, bookIdx) => {
    try{
      // 2) 1장 + 첫 단락
      const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
      if (!ch1) return;

      const p1  = ch1.querySelector(':scope > .paras > details.para') || ch1.querySelector('details.para');
      if (!p1) return;

      // 3) 툴바 확보
      let tb = p1.querySelector('.ptoolbar');
      if (!tb) {
        const body = p1.querySelector('.pbody') || p1;
        tb = doc.createElement('div');
        tb.className = 'ptoolbar';
        body.insertAdjacentElement('afterbegin', tb);
      }

      // 4) 설교 버튼 확보
      let sermBtn = tb.querySelector('.sermBtn');
      if (!sermBtn) {
        sermBtn = doc.createElement('button');
        sermBtn.className = 'sermBtn';
        sermBtn.textContent = '설교목록';
        tb.appendChild(sermBtn);
      }

      // 5) 기존 칩스 제거
      tb.querySelectorAll('.bookhead-chips').forEach(n => n.remove());

      // 6) 칩스 생성 후 설교 오른쪽에 삽입
      const chips = doc.createElement('span');
      chips.className = 'bookhead-chips';
      chips.innerHTML = `
        <button type="button" class="book-chip" data-type="basic">기본이해</button>
        <button type="button" class="book-chip" data-type="structure">내용구조</button>
        <button type="button" class="book-chip" data-type="summary">메세지요약</button>
      `;

      sermBtn.insertAdjacentElement('afterend', chips);

      // ===== 기본이해·내용구조·메세지요약 → "책 단위" 에디터 연결 =====
      const chipBasic   = chips.querySelector('button[data-type="basic"]');
      const chipStruct  = chips.querySelector('button[data-type="structure"]');
      const chipSummary = chips.querySelector('button[data-type="summary"]');

      // 이 단락의 책 정보만 사용 (chap/paraIdx는 여기선 안 씀)
      const summaryEl = p1.querySelector(':scope > summary .ptitle');
      if (!summaryEl) return;

      const book = summaryEl.dataset.book;
      if (!book) return;

      const openBookChipEditor = (mode) => {
        openBookDocEditor(mode, book); // 🌟 새로 만든 책 단위 에디터
      };

      if (chipBasic)
        chipBasic.onclick = () => openBookChipEditor('basic');

      if (chipStruct)
        chipStruct.onclick = () => openBookChipEditor('struct');

      if (chipSummary)
        chipSummary.onclick = () => openBookChipEditor('summary');

    } catch(err){
      console.warn('[bookchips] 처리 중 오류:', err);
    }
  });
}

window.ensureBookHeadChips = ensureBookHeadChips;

// ===== [GLOBAL BOOK CHIPS] 헤더의 '서식가져오기' 오른쪽에 전역 칩스 =====
// ===== [GLOBAL BOOK CHIPS] '서식가져오기' 오른쪽 칩스 주입 =====
function ensureGlobalBookChips(){
  const doc = document;

  // 기준: "서식가져오기" 버튼 찾기
  const anchor =
    doc.getElementById('btnFmtLoad') ||
    Array.from(doc.querySelectorAll('button')).find(b => (b.textContent||'').includes('서식가져오기'));
  if(!anchor) return;

  // 이미 있으면 재배치만
  let wrap = doc.getElementById('globalBookChips');
  if(!wrap){
    wrap = doc.createElement('span');
    wrap.id = 'globalBookChips';
    wrap.innerHTML = `
      <button type="button" class="book-chip" data-type="basic">기본이해</button>
      <button type="button" class="book-chip" data-type="structure">내용구조</button>
      <button type="button" class="book-chip" data-type="summary">메세지요약</button>
    `;
    anchor.insertAdjacentElement('afterend', wrap);

    // 클릭 → 현재 열린 "책(summary)" 기준 책 단위 에디터 실행
    // 이벤트 리스너 중복 등록 방지 플래그
    if (!wrap.dataset.listenerAttached) {
      wrap.dataset.listenerAttached = 'true';
      wrap.addEventListener('click', (e)=>{
      const btn = e.target.closest('.book-chip');
      if(!btn) return;
      e.stopPropagation();

      // ✅ 책 summary를 유연하게 찾는 헬퍼
      const getCurrentBookSummary = () => {
        // 1) 현재 열린 단락이 있으면 그 단락이 속한 책
        const openPara = document.querySelector('details.para[open]');
        if (openPara) {
          const bookEl = openPara.closest('details.book');
          if (bookEl) {
            // 이미 열려있지 않을 때만 열기 (무한 루프 방지)
            if (!bookEl.hasAttribute('open')) {
              try {
                bookEl.setAttribute('open','');
              } catch(e) {
                console.warn('[ensureGlobalBookChips] 책 열기 실패:', e);
              }
            }
            const sum = bookEl.querySelector(':scope > summary');
            if (sum) return sum;
          }
        }
        // 2) 이미 열려 있는 책
        const opened = document.querySelector('details.book[open] > summary');
        if (opened) return opened;

        // 3) 아무 책도 안 열려 있으면 첫 번째 책을 자동으로 열기
        const first = document.querySelector('details.book > summary');
        if (first) {
          const bookEl = first.parentElement;
          if (bookEl && !bookEl.hasAttribute('open')) {
            try {
              bookEl.setAttribute('open','');
            } catch(e) {
              console.warn('[ensureGlobalBookChips] 첫 책 열기 실패:', e);
            }
          }
          return first;
        }
        return null;
      };

      const bookSummary = getCurrentBookSummary();
      if (!bookSummary) {
        alert('성경(책)을 찾지 못했습니다. 트리가 렌더링되었는지 확인하세요.');
        return;
      }

      // 책 이름 추출
      const btitle = bookSummary.querySelector('.btitle');
      const bookName = btitle?.dataset?.book || bookSummary.dataset?.book || (btitle?.textContent || bookSummary.textContent || '').trim();
      if (!bookName) {
        alert('책 이름을 찾을 수 없습니다.');
        return;
      }

      // 버튼의 data-type을 openBookDocEditor의 mode로 매핑
      const typeMap = {
        'basic': 'basic',
        'structure': 'struct',
        'summary': 'summary'
      };
      const mode = typeMap[btn.dataset.type] || btn.dataset.type;

      if (typeof openBookDocEditor === 'function') {
        openBookDocEditor(mode, bookName);
      } else {
        alert('openBookDocEditor 함수가 없습니다.');
      }
      });
    } // if (!wrap.dataset.listenerAttached) 닫기

  }

  // 항상 '서식가져오기' 오른쪽에 위치 보정
  if (wrap.previousElementSibling !== anchor){
    anchor.insertAdjacentElement('afterend', wrap);
  }
}

// 콘솔에서도 호출 가능
window.ensureGlobalBookChips = ensureGlobalBookChips;

// ===== [BOOK-UNIT EDITOR] 성경(책) 단위 에디터 & 칩스 =====
const BOOK_UNIT_NS = 'WBP3_BOOKUNIT';

// 책 키 생성: data-book 우선, 없으면 제목 텍스트 사용
function _bookKeyFromSummary(sumEl, type){
  if (!sumEl) return null;
  const btitle = sumEl.querySelector('.btitle');
  const dataBook = btitle?.dataset?.book || sumEl.dataset?.book;
  let bookId = dataBook || (btitle?.textContent || sumEl.textContent || '').trim();
  if (!bookId) return null;
  // 공백 정리
  bookId = bookId.replace(/\s+/g,' ');
  return `${BOOK_UNIT_NS}:${bookId}:${type}`;
}

// 기존 단위 에디터 팝업을 재사용 (없으면 생성)
function _ensureBookUnitEditorHost(){
  let host = document.getElementById('unitEditor');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'unitEditor';
  host.className = 'unit-editor';
  host.innerHTML = `
    <header>
      <div class="ue-title">단위 에디터</div>
      <div class="ue-actions">
        <button type="button" id="ueSave">저장</button>
        <button type="button" id="ueClose">닫기</button>
      </div>
    </header>
    <textarea id="ueText" placeholder="여기에 내용을 입력하세요. (자동저장)"></textarea>
  `;
  document.body.appendChild(host);
  // 닫기
  host.querySelector('#ueClose').addEventListener('click', ()=> { host.style.display = 'none'; });
  // 수동 저장
  host.querySelector('#ueSave').addEventListener('click', ()=>{
    const key = host.dataset.key;
    if (key) saveState(key, host.querySelector('#ueText').value || '');
  });
  // 자동 저장(디바운스)
  let _tm = null;
  host.querySelector('#ueText').addEventListener('input', ()=>{
    clearTimeout(_tm);
    _tm = setTimeout(()=>{
      const key = host.dataset.key;
      if (key) debounceSave(key, host.querySelector('#ueText').value || '', 400);
    }, 400);
  });
  return host;
}

// 책 단위 에디터 열기
function openBookEditor(type, sumEl){
  const sum = sumEl || document.querySelector('details.book[open] > summary');
  if (!sum) { alert('열린 성경(책)을 찾을 수 없습니다. 책 summary를 먼저 여세요.'); return; }

  const key = _bookKeyFromSummary(sum, type);
  if (!key) { alert('책 키 생성 실패: .btitle data-book 또는 텍스트 확인'); return; }

  const host = _ensureBookUnitEditorHost();
  const label = (type === 'basic') ? '기본이해' : (type === 'structure' ? '내용구조' : '메세지요약');
  host.dataset.key = key;
  host.querySelector('.ue-title').textContent = `단위 에디터 — ${label} (책 단위)`;
  host.querySelector('#ueText').value = loadState(key, '') || '';
  host.style.display = 'flex';
  host.querySelector('#ueText').focus();
}

// 책 summary 옆 칩스 주입
function ensureBookChips(){
  const books = document.querySelectorAll('details.book > summary');
  if (!books.length) return;

  books.forEach(sum => {
    // btitle 없으면 생성(한 번만)
    let bt = sum.querySelector('.btitle');
    if (!bt) {
      bt = document.createElement('span');
      bt.className = 'btitle';
      const first = sum.firstChild;
      if (first && first.nodeType === Node.TEXT_NODE) {
        bt.textContent = first.nodeValue.trim();
        first.nodeValue = '';
        sum.insertBefore(bt, sum.firstChild);
      } else {
        // 텍스트가 없으면 빈 btitle 삽입
        sum.insertBefore(bt, sum.firstChild);
      }
    }

    // 이미 summary 바로 아래에 칩스가 있는지 확인
    let chips = sum.querySelector(':scope > .book-chips');
    if (!chips) {
      chips = document.createElement('span');
      chips.className = 'book-chips';
      chips.innerHTML = `
        <button type="button" class="book-chip" data-type="basic">기본이해</button>
        <button type="button" class="book-chip" data-type="structure">내용구조</button>
        <button type="button" class="book-chip" data-type="summary">메세지요약</button>
      `;
      sum.insertBefore(chips, sum.firstChild);

      // summary 토글로 전파 차단 + 해당 책 컨텍스트로 에디터 열기
      chips.addEventListener('click', (e)=>{
        e.stopPropagation();
        const btn = e.target.closest('.book-chip'); if (!btn) return;
        const paraBook = sum.closest('details.book');
        if (paraBook && !paraBook.hasAttribute('open')) paraBook.setAttribute('open',''); // 책 열기 보장
        openBookEditor(btn.dataset.type, sum);
        e.preventDefault();
      });
    }
  });
}

// 전역에서 콘솔로도 호출 가능하게 등록
// window.ensureBookChips = ensureBookChips;

// ===== [UNIT-EDITOR GLOBAL CHIPS] 헤더 우측 전역 칩스 생성 (전역 등록) BEGIN =====
function ensureUnitGlobalChips(){
  const doc = document;

  // 헤더 확보(없으면 대체 헤더 생성)
  let header = doc.querySelector('header');
  if (!header) {
    header = doc.createElement('header');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--panel,#161922);border-bottom:1px solid var(--border,#252a36);position:sticky;top:0;z-index:1000;';
    doc.body.insertAdjacentElement('afterbegin', header);
  } else {
    const cs = getComputedStyle(header);
    if (cs.display !== 'flex') header.style.display = 'flex';
    if (!cs.alignItems || cs.alignItems === 'normal') header.style.alignItems = 'center';
    if (!cs.gap || cs.gap === '0px') header.style.gap = '8px';
  }

  // 중복 생성 방지
  let bar = doc.getElementById('unitGlobalChips');
  if (!bar) {
    bar = doc.createElement('div');
    bar.id = 'unitGlobalChips';
    bar.innerHTML = `
      <button type="button" class="unit-chip" data-type="basic">기본이해</button>
      <button type="button" class="unit-chip" data-type="structure">내용구조</button>
      <button type="button" class="unit-chip" data-type="summary">메세지요약</button>
    `;
    header.appendChild(bar);

    // 클릭: 현재 열린 단락 기준으로 에디터 열기
    bar.addEventListener('click', (e)=>{
      const btn = e.target.closest('.unit-chip'); if(!btn) return;
      const open = document.querySelector('details.para[open]');
      if(!open){ alert('열린 단락이 없습니다. 단락을 먼저 여세요.'); return; }
      if(!open.hasAttribute('open')) open.setAttribute('open','');
      openUnitEditor(btn.dataset.type);
      e.preventDefault();
      e.stopPropagation();
    });
  }
}
// 전역에서 콘솔 호출 가능하도록 노출
// window.ensureUnitGlobalChips = ensureUnitGlobalChips;
// ===== [UNIT-EDITOR GLOBAL CHIPS] END =====

const UNIT_NS = 'WBP3_UNIT';

function _unitKeyFromTitleEl(ptitleEl, type){
  const b = ptitleEl?.dataset?.book, c = ptitleEl?.dataset?.ch, i = ptitleEl?.dataset?.idx;
  if(!b || !c || !i) return null;
  return `${UNIT_NS}:${b}:${c}:${i}:${type}`;
}

function _ensureUnitEditorHost(){
  let host = document.getElementById('unitEditor');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'unitEditor';
  host.className = 'unit-editor';
  host.innerHTML = `
    <header>
      <div class="ue-title">단위 에디터</div>
      <div class="ue-actions">
        <button type="button" id="ueSave">저장</button>
        <button type="button" id="ueClose">닫기</button>
      </div>
    </header>
    <textarea id="ueText" placeholder="여기에 내용을 입력하세요. (자동저장)"></textarea>
  `;
  document.body.appendChild(host);

  // 닫기
  host.querySelector('#ueClose').addEventListener('click', ()=> { host.style.display='none'; });
  // 저장 (수동)
  host.querySelector('#ueSave').addEventListener('click', ()=>{
    const key = host.dataset.key;
    if (key) saveState(key, host.querySelector('#ueText').value || '');
  });
  // 자동저장 (디바운스)
  let _tm = null;
  host.querySelector('#ueText').addEventListener('input', ()=>{
    clearTimeout(_tm);
    _tm = setTimeout(()=>{
      const key = host.dataset.key;
      if (key) debounceSave(key, host.querySelector('#ueText').value || '', 400);
    }, 400);
  });

  return host;
}

function openUnitEditor(type){
  const open = document.querySelector('details.para[open]');
  const t = open?.querySelector('summary .ptitle');
  if(!t){ alert('열린 단락을 찾을 수 없습니다.'); return; }

  const key = _unitKeyFromTitleEl(t, type);
  if(!key){ alert('키 생성 오류: data-book/ch/idx 확인'); return; }

  const host = _ensureUnitEditorHost();
  const label = type === 'basic' ? '기본이해' : (type === 'structure' ? '내용구조' : '메세지요약');

  host.dataset.key = key;
  host.querySelector('.ue-title').textContent = `단위 에디터 — ${label}`;
  host.querySelector('#ueText').value = loadState(key, '') || '';
  host.style.display = 'flex';
  host.querySelector('#ueText').focus();
}

// ===== [FORMAT-PERSIST BACKUP] 내보내기/가져오기 유틸 (WBP3_FMT) BEGIN =====
// const FMT_NS = typeof FMT_NS === 'string' ? FMT_NS : 'WBP3_FMT'; // 이미 있으면 재사용

function wbpExportFormats(){
  try{
    const keys = Object.keys(localStorage).filter(k => k.startsWith(FMT_NS + ':'));
    const items = keys.map(k => ({ key: k, value: loadState(k, null) }));
    const payload = {
      ns: FMT_NS,
      exportedAt: new Date().toISOString(),
      count: items.length,
      items
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date(); // YYYYMMDD-HHMMSS
    const pad = n => String(n).padStart(2,'0');
    const fname = `wbp-format-backup-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;
    a.href = url; a.download = fname; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
    if (typeof status === 'function') status(`서식 내보내기 완료 (${items.length}개)`);
  }catch(e){
    console.error(e);
    alert('서식 내보내기 중 오류가 발생했습니다.');
  }
}

function wbpImportFormatsFromFile(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files && input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const json = JSON.parse(String(reader.result||'{}'));
        // 허용 포맷: {ns, exportedAt, items:[{key,value}]} 또는 { "<key>": <value>, ... }
        let kvList = [];
        if (Array.isArray(json.items)) {
          kvList = json.items;
        } else {
          kvList = Object.keys(json).map(k => ({ key: k, value: json[k] }));
        }
        // 네임스페이스 키만 반영
        const onlyFmt = kvList.filter(rec => typeof rec.key === 'string' && rec.key.startsWith(FMT_NS + ':'));
        if (onlyFmt.length === 0) {
          alert('가져올 WBP 서식 키를 찾지 못했습니다.');
          return;
        }
        // 덮어쓰기 확인
        const overwrite = confirm(`${onlyFmt.length}개의 서식 데이터를 가져옵니다.\n동일 키는 덮어쓰기 됩니다. 계속할까요?`);
        if(!overwrite) return;

        let applied = 0;
        for(const rec of onlyFmt){
          try{
            saveState(rec.key, rec.value ?? null);
            applied++;
          }catch(e){
            console.warn('skip:', rec.key, e);
          }
        }
        if (typeof status === 'function') status(`서식 가져오기 완료 (${applied}개 적용)`);
        alert(`가져오기 완료: ${applied}개 적용`);
      }catch(e){
        console.error(e);
        alert('서식 가져오기 중 오류가 발생했습니다. JSON 형식을 확인하세요.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
// ===== [FORMAT-PERSIST BACKUP] 내보내기/가져오기 유틸 (WBP3_FMT) END =====

// ===== [FORMAT-PERSIST/RUNS] 위치정보(오프셋) 추출 및 HTML 재구성 유틸 BEGIN =====
function _collectTextAndRuns(rootEl){
  const spans = [];
  let text = '';
  let offset = 0;
  const active = [];

  function pushSpan(start, end, attrs){
    if (end > start) spans.push({ start, end, attrs: { ...attrs } });
  }
  function attrsFromEl(el){
    const a = {};
    const tag = el.tagName?.toLowerCase?.() || '';
    if (tag === 'b' || tag === 'strong') a.b = true;
    if (tag === 'i' || tag === 'em')     a.i = true;
    if (tag === 'u')                      a.u = true;
    if (tag === 's' || tag === 'strike')  a.s = true;
    if (tag === 'mark')                   a.mark = true;
    const color = (el.style && el.style.color) || el.getAttribute?.('color');
    if (color) a.color = color;
    return a;
  }
  function walk(node){
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const chunk = node.nodeValue || '';
      const start = offset;
      const cps = [...chunk]; // 유니코드 안전
      text += chunk; offset += cps.length;
      for (const a of active) pushSpan(start, offset, a);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const attrs = attrsFromEl(node);
      const has = Object.keys(attrs).length > 0;
      if (has) active.push(attrs);
      for (let c=node.firstChild; c; c=c.nextSibling) walk(c);
      if (has) active.pop();
    }
  }
  walk(rootEl);
  return { text, spans };
}

function _wrapRunsToHTML(text, spans){
  // 유니코드 안전 문자 배열
  const cps = [...String(text||'')];

  // 위치별 시작/끝 인덱스 맵
  const starts = new Map(), ends = new Map();
  (spans||[]).forEach(sp => {
    if (!starts.has(sp.start)) starts.set(sp.start, []);
    starts.get(sp.start).push(sp);
    if (!ends.has(sp.end)) ends.set(sp.end, []);
    ends.get(sp.end).push(sp);
  });

  // 태그 열기/닫기
  function openTags(a){
    let out = '';
    if (a.b) out += '<b>';
    if (a.i) out += '<i>';
    if (a.u) out += '<u>';
    if (a.s) out += '<s>';
    if (a.mark) out += '<mark>';
    if (a.color) out += `<span style="color:${a.color}">`;
    return out;
  }
  function closeTags(a){
    let out = '';
    if (a.color) out = '</span>' + out;
    if (a.mark)  out = '</mark>' + out;
    if (a.s)     out = '</s>' + out;
    if (a.u)     out = '</u>' + out;
    if (a.i)     out = '</i>' + out;
    if (a.b)     out = '</b>' + out;
    return out;
  }

  // 현재 활성 속성 스택(단순 병합 전략)
  const active = [];
  const out = [];

  for (let i=0;i<=cps.length;i++){
    // 먼저 닫기
    if (ends.has(i)){
      if (active.length){
        const merged = active.reduce((m,a)=>Object.assign(m,a),{});
        out.push(closeTags(merged));
        active.length = 0;
      }
    }
    // 그 다음 열기
    if (starts.has(i)){
      const list = starts.get(i) || [];
      if (list.length){
        const merged = {};
        for (const sp of list){
          const a = sp.attrs || {};
          if (a.b) merged.b = true;
          if (a.i) merged.i = true;
          if (a.u) merged.u = true;
          if (a.s) merged.s = true;
          if (a.mark) merged.mark = true;
          if (a.color) merged.color = a.color;
          active.push(a);
        }
        out.push(openTags(merged));
      }
    }
    // 본문 문자 추가
    if (i < cps.length){
      const ch = cps[i]
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
      out.push(ch);
    }
  }

  if (active.length){
    const merged = active.reduce((m,a)=>Object.assign(m,a),{});
    out.push(closeTags(merged));
  }
  return out.join('');
}

// ===== [FORMAT-PERSIST/RUNS] END =====

// ===== [FORMAT-PERSIST] WBP-3.0 절문장 서식 저장/복원 (localStorage, v2 runs) BEGIN =====

// ---- (ADD) 현재 열린 단락 서식초기화 ----
function clearFormatForOpenPara(){
  // 1) 현재 열린 단락 컨텍스트
  const ctx = (typeof getOpenParaKeyAndEls === 'function') ? getOpenParaKeyAndEls() : null;
  if(!ctx){ alert('열려있는 단락을 찾을 수 없습니다.'); return; }

  // 2) localStorage 저장본 삭제 (그 단락만)
  try{
    localStorage.removeItem(ctx.key);
  }catch(e){
    console.warn('localStorage remove 실패:', e);
  }

  // 3) 화면의 인라인 서식 제거 (.pline .content 우선)
  const SKIP_SELECTOR = 'sup, sup.pv, .pv, .pvnum, .verse-no'; // 절번호 등은 건드리지 않음
  const isEmptyStyle = (el) => !el.getAttribute('style') || el.getAttribute('style').trim()==='';

  const stripInlineFormat = (root)=>{
    if(!root) return;
    // 굵게/기울임/밑줄/취소선/mark/font → 언랩 (태그 제거, 텍스트만 남김)
    root.querySelectorAll('b,i,u,s,mark,font').forEach(el=>{
      if (el.matches(SKIP_SELECTOR)) return;
      const frag = document.createDocumentFragment();
      while(el.firstChild) frag.appendChild(el.firstChild);
      el.replaceWith(frag);
    });
    // span의 색/배경색 제거. 쓸모없어지면 언랩
    root.querySelectorAll('span').forEach(el=>{
      if (el.matches(SKIP_SELECTOR)) return;
      const style = el.getAttribute('style') || '';
      // 색 관련 속성 비우기
      el.style && (el.style.color = '', el.style.backgroundColor = '');
      // color/background만 있었던 경우 style 비우기
      if (style) {
        const s = el.getAttribute('style') || '';
        if (!s || s.trim()==='') el.removeAttribute('style');
      }
      // 클래스/데이터/아이디 등 메타가 없고 style도 없으면 언랩
      if (!el.classList.length && !el.attributes.length) {
        const frag = document.createDocumentFragment();
        while(el.firstChild) frag.appendChild(el.firstChild);
        el.replaceWith(frag);
      }
    });
  };

  // 각 절문장에 적용
  for (const lineEl of ctx.lineEls){
    const root = lineEl.matches('.content') ? lineEl : (lineEl.querySelector('.content') || lineEl);
    stripInlineFormat(root);
  }

  // 4) 상태 표시
  if (typeof status === 'function') status('서식초기화 완료 (해당 단락만)');
}

// FMT_NS는 위쪽(저장 시스템 섹션)에서 정의됨

function getOpenParaKeyAndEls(){
  // 현재 열려있는 단락(details.para[open])과 키 구성
  const openPara = document.querySelector('details.para[open]');
  if(!openPara) return null;

  const t = openPara.querySelector('summary .ptitle');
  if(!t) return null;

  const book = t.dataset.book;
  const ch   = t.dataset.ch;
  const idx  = t.dataset.idx;
  if(!book || !ch || !idx) return null;

  // 절문장(라인) 엘리먼트 수집: .pline .content 우선, 없으면 .pline 자체
  const candidates = openPara.querySelectorAll('.pline .content, .pline');
  const lineEls = Array.from(candidates).filter(el => !el.matches('details, summary'));

  const key = `${FMT_NS}:${book}:${ch}:${idx}`;
  return { key, openPara, lineEls };
}

function saveFormatForOpenPara(){
  const ctx = getOpenParaKeyAndEls();
  if(!ctx){ alert('열려있는 단락을 찾을 수 없습니다.'); return; }

  const lines = ctx.lineEls.map(el => {
    const root = el.matches('.content') ? el : (el.querySelector('.content') || el);
    const { text, spans } = _collectTextAndRuns(root);
    return { html: root.innerHTML, text, spans };
  });

  const payload = { v: 2, savedAt: Date.now(), lines };
  try{
    saveState(ctx.key, payload);
    status && status('서식 저장 완료 (정밀: 위치정보 포함)');
  }catch(e){
    console.error(e);
    alert('서식 저장 중 오류가 발생했습니다.');
  }
}

function restoreFormatForOpenPara(){
  const ctx = getOpenParaKeyAndEls();
  if(!ctx){ alert('열려있는 단락을 찾을 수 없습니다.'); return; }

  const data = loadState(ctx.key, null);
  if(!data){ alert('저장된 서식이 없습니다. 먼저 [서식저장]을 실행하세요.'); return; }
  if(!data || !Array.isArray(data.lines)){ alert('저장된 서식 형식이 올바르지 않습니다.'); return; }

  const n = Math.min(ctx.lineEls.length, data.lines.length);
  for (let i=0; i<n; i++){
    const el = ctx.lineEls[i];
    const root = el.matches('.content') ? el : (el.querySelector('.content') || el);
    const rec = data.lines[i] || {};
    if (rec.text && Array.isArray(rec.spans)){
      // runs 기반 복원
      root.innerHTML = _wrapRunsToHTML(rec.text, rec.spans);
    } else if (rec.html){
      // 구형 저장본 호환
      root.innerHTML = rec.html;
    }
  }
  status && status('서식 회복 완료 (runs 기반)');
}

// ===== [FORMAT-PERSIST] WBP-3.0 절문장 서식 저장/복원 (localStorage, v2 runs) END =====

// ===== [FORMAT-PERSIST UI] 버튼 생성/바인딩 BEGIN =====
// === [FORMAT-PERSIST UI] 버튼 생성/배치 — 헤더(내용가져오기 옆)로 이동 ===
function ensureFormatButtons(){
  const doc = document;

  // 0) 앵커: 헤더의 "내용가져오기" 버튼(기존 id: btnImportAll) 우선 탐색
  let anchor =
    doc.getElementById('btnImportAll') ||
    Array.from(doc.querySelectorAll('header button')).find(b => (b.textContent||'').trim().includes('내용가져오기')) ||
    null;

  // 1) 호스트: 헤더 우선
  const headerEl = doc.querySelector('header');
  const host = (anchor && anchor.parentElement) || headerEl || doc.body;

  // 2) 중복 검사
  const existSave = doc.getElementById('btnFmtSave');
  const existLoad = doc.getElementById('btnFmtLoad');
  const existExp  = doc.getElementById('btnFmtExport');
  const existImp  = doc.getElementById('btnFmtImport');

  // 3) 생성 유틸
  const mkBtn = (id, label) => {
    const b = doc.createElement('button');
    b.id = id;
    b.type='button';
    b.textContent = label;
    b.className = 'fmt-btn';
    b.style.marginLeft = '6px';
    return b;
  };

  const btnSave = existSave || mkBtn('btnFmtSave','서식저장');
  const btnLoad = existLoad || mkBtn('btnFmtLoad','서식회복');
  const btnExp  = existExp  || mkBtn('btnFmtExport','서식내보내기');
  const btnImp  = existImp  || mkBtn('btnFmtImport','서식가져오기');

  // 4) 배치: "내용가져오기" 버튼의 오른쪽에 순서대로 붙이기
  //    [내용가져오기] [서식가져오기] [서식내보내기] [서식회복] [서식저장]
  if (anchor) {
    // 이미 있으면 재정렬만
    anchor.insertAdjacentElement('afterend', btnSave);
    anchor.insertAdjacentElement('afterend', btnLoad);
    anchor.insertAdjacentElement('afterend', btnExp);
    anchor.insertAdjacentElement('afterend', btnImp);
  } else if (host) {
    host.append(btnImp, btnExp, btnLoad, btnSave);
  }

  // 5) 클릭 이벤트(기존 핸들러 재사용)
  btnSave.onclick = saveFormatForOpenPara;
  btnLoad.onclick = restoreFormatForOpenPara;
  btnExp.onclick  = wbpExportFormats;
  btnImp.onclick  = wbpImportFormatsFromFile;
}

function safeBindFmtButtons(){
  try{ ensureFormatButtons(); }
  catch(e){ console.error('ensureFormatButtons error:', e); }
  // 버튼 색상 업데이트
  updateButtonColors();
}

/* ✅ 버튼 색상 업데이트 (저장된 데이터가 있으면 색깔 표시) */
function updateButtonColors(){
  try {
    // 1. 내용내보내기 버튼 - 저장된 데이터가 있는지 확인
    const btnExportAll = document.getElementById('btnExportAll');
    if (btnExportAll) {
      const hasContent = hasStoredContent();
      if (hasContent) {
        btnExportAll.style.background = 'linear-gradient(180deg, #6ea8fe 78%, #5a8fe0 72%)';
        btnExportAll.style.borderColor = '#5a8fe0';
        btnExportAll.style.color = '#fff';
      } else {
        btnExportAll.style.background = '';
        btnExportAll.style.borderColor = '';
        btnExportAll.style.color = '';
      }
    }
    
    // 2. 서식내보내기 버튼 - 저장된 서식이 있는지 확인
    const btnFmtExport = document.getElementById('btnFmtExport');
    if (btnFmtExport) {
      const hasFormat = hasStoredFormat();
      if (hasFormat) {
        btnFmtExport.style.background = 'linear-gradient(180deg, #6ea8fe 78%, #5a8fe0 72%)';
        btnFmtExport.style.borderColor = '#5a8fe0';
        btnFmtExport.style.color = '#fff';
      } else {
        btnFmtExport.style.background = '';
        btnFmtExport.style.borderColor = '';
        btnFmtExport.style.color = '';
      }
    }
    
    // 3. 서식저장 버튼 - 저장된 서식이 있는지 확인
    const btnFmtSave = document.getElementById('btnFmtSave');
    if (btnFmtSave) {
      const hasFormat = hasStoredFormat();
      if (hasFormat) {
        btnFmtSave.style.background = 'linear-gradient(180deg, #6ea8fe 78%, #5a8fe0 72%)';
        btnFmtSave.style.borderColor = '#5a8fe0';
        btnFmtSave.style.color = '#fff';
      } else {
        btnFmtSave.style.background = '';
        btnFmtSave.style.borderColor = '';
        btnFmtSave.style.color = '';
      }
    }
  } catch (e) {
    console.error('[updateButtonColors] 오류:', e);
  }
}

/* ✅ 저장된 내용 데이터 확인 */
function hasStoredContent(){
  try {
    const keys = [STORAGE_SERMON, STORAGE_UNIT_CTX, STORAGE_WHOLE_CTX, STORAGE_COMMENTARY, STORAGE_SUMMARY];
    for (const key of keys) {
      const data = loadState(key, null);
      if (data !== null && data !== undefined) {
        // 객체인 경우 빈 객체가 아닌지 확인
        if (typeof data === 'object' && !Array.isArray(data)) {
          const keys = Object.keys(data);
          // 메타 필드 제외하고 실제 데이터가 있는지 확인
          const hasData = keys.some(k => !k.startsWith('_') && data[k] !== null && data[k] !== undefined);
          if (hasData) return true;
        } else if (Array.isArray(data) && data.length > 0) {
          return true;
        } else if (typeof data === 'string' && data.trim() !== '') {
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    console.error('[hasStoredContent] 오류:', e);
    return false;
  }
}

/* ✅ 저장된 서식 데이터 확인 */
function hasStoredFormat(){
  try {
    // WBP_FMT.map 확인 (index.html에서 정의됨)
    if (typeof window.WBP_FMT !== 'undefined' && window.WBP_FMT && window.WBP_FMT.map) {
      const map = window.WBP_FMT.map;
      const keys = Object.keys(map);
      if (keys.length > 0) {
        // 실제 데이터가 있는지 확인
        const hasData = keys.some(k => map[k] !== null && map[k] !== undefined && map[k] !== '');
        if (hasData) return true;
      }
    }
    
    // localStorage에서 직접 확인
    const fmtData = loadState('wbps.versefmt.v2', {});
    if (fmtData && typeof fmtData === 'object' && !Array.isArray(fmtData)) {
      const keys = Object.keys(fmtData);
      // 메타 필드 제외하고 실제 데이터가 있는지 확인
      const hasData = keys.some(k => !k.startsWith('_') && fmtData[k] !== null && fmtData[k] !== undefined && fmtData[k] !== '');
      if (hasData) return true;
    }
    
    return false;
  } catch (e) {
    console.error('[hasStoredFormat] 오류:', e);
    return false;
  }
}
// ===== [FORMAT-PERSIST UI] 버튼 생성/바인딩 END =====

// ===== [UNIT-EDITOR] ptitle 옆 버튼 주입 (전방위 견고 버전) =====
function ensureUnitChips(){
  // 열려있는 단락이 없으면 모든 단락에 시도(최초 로드 대비)
  const paras = document.querySelectorAll('details.para');
  if (!paras.length) return;

  paras.forEach(para => {
    const sum = para.querySelector('summary');
    if (!sum) return;

    // 1) ptitle 확보: 없으면 summary 텍스트를 감싸서 생성
    let t = sum.querySelector('.ptitle');
    if (!t) {
      t = document.createElement('span');
      t.className = 'ptitle';
      // summary 첫 번째 노드가 텍스트라면 그 텍스트를 ptitle로 옮김
      const first = sum.firstChild;
      if (first && first.nodeType === Node.TEXT_NODE) {
        t.textContent = first.nodeValue.trim();
        first.nodeValue = '';
        sum.insertBefore(t, sum.firstChild);
      } else {
        // 텍스트가 없으면 summary 맨 앞에 빈 ptitle 삽입
        sum.insertBefore(t, sum.firstChild);
      }
    }

    // 2) 이미 있으면 중복 생성 금지
    if (t.querySelector('.unit-chips')) return;

    // 3) 버튼 삽입
    const wrap = document.createElement('span');
    wrap.className = 'unit-chips';
    wrap.innerHTML = `
      <button type="button" class="unit-chip" data-type="basic">기본이해</button>
      <button type="button" class="unit-chip" data-type="structure">내용구조</button>
      <button type="button" class="unit-chip" data-type="summary">메세지요약</button>
    `;
    t.appendChild(wrap);

    // 4) 클릭이 summary 토글로 전파되지 않도록 차단 + 에디터 열기
    if (!wrap.dataset.bound) {
      wrap.addEventListener('click', (e)=>{
        e.stopPropagation(); // summary의 열기/닫기 방지
        const btn = e.target.closest('.unit-chip');
        if (!btn) return;
        // 단락이 닫혀 있으면 열기
        if (!para.hasAttribute('open')) para.setAttribute('open','');
        // 에디터 실행
        openUnitEditor(btn.dataset.type);
        e.preventDefault(); // 모바일 더블탭 등 방지
      });
      wrap.dataset.bound = '1';
    }

    // 4) 클릭 처리 (오픈 단락 기준으로 에디터 열기)
    wrap.addEventListener('click', (e)=>{
      const btn = e.target.closest('.unit-chip');
      if (!btn) return;
      // 이 버튼이 속한 단락을 "열린" 상태로 만들고 에디터 호출
      if (!para.hasAttribute('open')) para.setAttribute('open','');
      openUnitEditor(btn.dataset.type);
    });
  });
}

// ===== [FLOATING SELECTION TOOLBAR] 선택 시 작은 툴바 노출 =====
function _ensureFloatingPlbar(){
  if (document.getElementById('wbp-plbar')) return;
  const bar = document.createElement('div');
  bar.id = 'wbp-plbar';
  bar.setAttribute('hidden', '');
  bar.innerHTML = `
    <button type="button" data-cmd="bold">B</button>
    <button type="button" data-cmd="italic">I</button>
    <button type="button" data-cmd="underline">U</button>
    <div class="divider"></div>
    <input type="color" id="wbp-color-picker" title="색상 선택" style="width:34px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,.06);padding:0">
    <div class="divider"></div>
    <button type="button" id="wbp-save-format">저장</button>
  `;
  document.body.appendChild(bar);

  bar.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const cmd = btn.dataset && btn.dataset.cmd;
    if (cmd) {
      // try execCommand first, fallback to range wrap
      try{ document.execCommand(cmd); }
      catch(e){ _wrapSelectionWithTag(cmd); }
      // keep toolbar visible
    } else if (btn.id === 'wbp-save-format'){
      try{ saveFormatForOpenPara(); }
      catch(e){ console.error('saveFormatForOpenPara error', e); }
    }
  });
  // 색상 입력 처리 (input 이벤트)
  const colorInp = bar.querySelector('#wbp-color-picker');
  if (colorInp){
    colorInp.addEventListener('input', (ev)=>{
      const color = ev.target.value;
      if (!color) return;
      try{
        document.execCommand('foreColor', false, color);
      }catch(e){
        _wrapSelectionWithColor(color);
      }
    });
  }
}

function _wrapSelectionWithTag(cmd){
  const sel = document.getSelection(); if (!sel || sel.rangeCount===0) return;
  const range = sel.getRangeAt(0);
  const tagMap = { bold:'b', italic:'i', underline:'u' };
  const tag = tagMap[cmd] || 'span';
  try{
    const el = document.createElement(tag);
    range.surroundContents(el);
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(el);
    sel.addRange(newRange);
  }catch(e){
    console.warn('[wrapSelection] surroundContents failed:', e);
  }
}

function _wrapSelectionWithColor(color){
  const sel = document.getSelection(); if (!sel || sel.rangeCount===0) return;
  const range = sel.getRangeAt(0);
  try{
    const el = document.createElement('span');
    el.style.color = color;
    range.surroundContents(el);
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(el);
    sel.addRange(newRange);
  }catch(e){
    // fallback: wrap by extracting contents
    try{
      const frag = range.cloneContents();
      const wrapper = document.createElement('span'); wrapper.style.color = color;
      wrapper.appendChild(frag);
      range.deleteContents();
      range.insertNode(wrapper);
      sel.removeAllRanges();
      const nr = document.createRange(); nr.selectNodeContents(wrapper); sel.addRange(nr);
    }catch(err){
      console.warn('[wrapSelectionColor] failed:', err);
    }
  }
}

function _posAndShowPlbar(range){
  const bar = document.getElementById('wbp-plbar'); if(!bar) return;
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width===0 && rect.height===0)) return;
  bar.removeAttribute('hidden');
  // position relative to viewport + scroll
  const left = rect.left + rect.width/2 + window.scrollX;
  const top  = rect.top + window.scrollY;
  bar.style.left = left + 'px';
  bar.style.top  = top + 'px';
}

function _hidePlbar(){
  const bar = document.getElementById('wbp-plbar'); if(!bar) return;
  bar.setAttribute('hidden','');
}

function _selectionIsInOpenPara(){
  const sel = document.getSelection(); if(!sel || sel.rangeCount===0) return null;
  const range = sel.getRangeAt(0);
  const node = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
  if(!node) return null;
  const pline = node.closest('.pline');
  if(!pline) return null;
  const para = pline.closest('details.para');
  if(!para || !para.hasAttribute('open')) return null;
  return { pline, para, range };
}

// selectionchange handler
function _onSelectionChangeForPlbar(){
  const ctx = _selectionIsInOpenPara();
  if(!ctx) { _hidePlbar(); return; }
  const sel = document.getSelection();
  if (!sel || sel.isCollapsed) { _hidePlbar(); return; }
  // show and position
  _posAndShowPlbar(ctx.range);
}

// Init listeners (idempotent)
function ensureFloatingSelectionToolbar(){
  _ensureFloatingPlbar();
  // avoid duplicate listeners by name-check
  if (ensureFloatingSelectionToolbar._attached) return; ensureFloatingSelectionToolbar._attached = true;
  document.addEventListener('selectionchange', ()=>{
    // small timeout to let selection settle
    setTimeout(_onSelectionChangeForPlbar, 10);
  });
  // hide when clicking outside
  document.addEventListener('mousedown', (e)=>{
    const bar = document.getElementById('wbp-plbar');
    if (!bar) return;
    if (e.target && (e.target.closest && e.target.closest('#wbp-plbar'))) return;
    // allow clicks inside .pline to keep toolbar
    if (e.target && e.target.closest && e.target.closest('.pline')) return;
    _hidePlbar();
  });
}

// 자동 초기화 시도
try{ ensureFloatingSelectionToolbar(); }catch(e){ console.warn('floating toolbar init failed', e); }


const AI_ENDPOINT = 'http://localhost:5174/api/unit-context';
const el = id => document.getElementById(id);
const treeEl = el('tree'), statusEl = el('status');
function status(msg){ statusEl.textContent = msg; }
function escapeHtml(s){
  return String(s||'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}
function stripBlankLines(s){return String(s||'').split(/\r?\n/).filter(l=>l.trim()!=='').join('\n');}

function syncCurrentFromOpen(){
  const openPara = treeEl.querySelector('details.para[open]');
  if(!openPara) return false;
  const t = openPara.querySelector('summary .ptitle');
  if(!t) return false;
  const book = t.dataset.book;
  const chap = parseInt(t.dataset.ch, 10);
  const idx  = parseInt(t.dataset.idx, 10);
  const para = BIBLE?.books?.[book]?.[chap]?.paras?.[idx];
  if(!para) return false;
  CURRENT.book   = book;
  CURRENT.chap   = chap;
  CURRENT.paraIdx= idx;
  CURRENT.paraId = `${book}|${chap}|${para.ref}`;
  return true;
}

// 제목 변경 반영
function updateParaTitle(book, chap, idx, newTitle){
  try{
    const para = BIBLE?.books?.[book]?.[chap]?.paras?.[idx];
    if(!para) return;
    para.title = newTitle;
    const s = document.querySelector(
      `summary .ptitle[data-book="${CSS.escape(String(book))}"][data-ch="${CSS.escape(String(chap))}"][data-idx="${CSS.escape(String(idx))}"]`
    );
    if(s) s.textContent = newTitle;
  }catch(_){}
}

// JSON 다운로드
async function downloadBibleJSON(){
  let payload = null;
  try {
    payload = await tryFetchJSON('bible-paragraphs.json');
  } catch(_) {
    try {
      payload = await tryFetchJSON('bible_paragraphs.json');
    } catch(_) {
      payload = BIBLE;
    }
  }
  if(!BIBLE){ alert('BIBLE 데이터가 없습니다.'); return; }
  const blob = new Blob([JSON.stringify(payload || BIBLE, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bible-paragraphs.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  status('수정된 JSON을 다운로드했습니다.');
}

/* ==== 전체 데이터 백업/복원 ==== */
const STORAGE_SERMON      = 'wbps.sermons.v4';
const STORAGE_LAST_SERMON_PARA = 'wbps.lastSermonPara.v4';
const STORAGE_UNIT_CTX    = 'wbps.ctx.unit.v1';
const STORAGE_WHOLE_CTX   = 'wbps.ctx.whole.v1';
const STORAGE_COMMENTARY  = 'wbps.ctx.comm.v1';
const STORAGE_SUMMARY     = 'wbps.ctx.summary.v1';
const VOICE_CHOICE_KEY    = 'wbps.tts.choice.v2';

const STORAGE_BOOK_BASIC   = 'WBP3_BOOK_BASIC';
const STORAGE_BOOK_STRUCT  = 'WBP3_BOOK_STRUCT';
const STORAGE_BOOK_SUMMARY = 'WBP3_BOOK_SUMMARY';
const FMT_NS = 'WBP3_FMT';  // 서식 네임스페이스 (validateState에서 사용)

// ===== [통합 저장 시스템 v4] =====
const STORAGE_VERSION = 4;
const STORAGE_SCHEMA_PREFIX = 'wbps.v4';

// Deep copy 유틸리티
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepCopy(item));
  if (typeof obj === 'object') {
    const copy = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepCopy(obj[key]);
      }
    }
    return copy;
  }
  return obj;
}

// Shallow clone 유틸리티
function shallowClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Array) return [...obj];
  if (typeof obj === 'object') return { ...obj };
  return obj;
}

// 저장 전 데이터 유효성 검사
function validateState(key, value) {
  if (key === null || key === undefined || typeof key !== 'string') {
    console.warn('[validateState] Invalid key:', key);
    return false;
  }
  if (value === undefined) {
    console.warn('[validateState] Value is undefined for key:', key);
    return false;
  }
  // 특정 키에 대한 추가 검증
  if (key.startsWith('WBP3_FMT:') || key.startsWith(FMT_NS + ':')) {
    if (typeof value === 'object' && value !== null) {
      if (!value.hasOwnProperty('v') && !value.hasOwnProperty('version')) {
        console.warn('[validateState] Format data missing version:', key);
        // 버전 정보가 없어도 허용 (구형 데이터 호환)
      }
    }
  }
  return true;
}

// 저장 실패 시 백업 생성
function backupState(key, value) {
  try {
    const backupKey = `${key}.backup.${Date.now()}`;
    const backupData = {
      originalKey: key,
      timestamp: Date.now(),
      data: deepCopy(value)
    };
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    console.warn('[backupState] Backup created:', backupKey);
    return backupKey;
  } catch (e) {
    console.error('[backupState] Backup failed:', e);
    return null;
  }
}

// 이전 버전 스키마 자동 변환 (v3 → v4)
function migrateState(key, rawValue) {
  try {
    // v3 스키마 감지 및 변환
    if (key.startsWith('wbps.') && !key.includes('.v4')) {
      // v3 키를 v4로 마이그레이션
      const migratedKey = key.replace(/\.v(\d+)$/, '.v4');
      if (migratedKey !== key) {
        console.log(`[migrateState] Migrating ${key} → ${migratedKey}`);
        // 기존 데이터를 새 키로 복사
        try {
          const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
          const migrated = {
            ...parsed,
            _migrated: true,
            _migratedFrom: key,
            _migratedAt: Date.now(),
            _version: STORAGE_VERSION
          };
          localStorage.setItem(migratedKey, JSON.stringify(migrated));
          return { key: migratedKey, value: migrated };
        } catch (e) {
          console.warn('[migrateState] Migration failed:', e);
        }
      }
    }
    
    // 값 자체에 버전 정보가 없는 경우 추가
    if (typeof rawValue === 'string') {
      try {
        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed === 'object' && !parsed._version) {
          parsed._version = STORAGE_VERSION;
          return { key, value: parsed };
        }
      } catch (e) {
        // JSON이 아닌 경우 그대로 반환
      }
    }
    
    return { key, value: rawValue };
  } catch (e) {
    console.error('[migrateState] Migration error:', e);
    return { key, value: rawValue };
  }
}

// "**" 제거 함수 (재귀적으로 모든 문자열에서 제거)
function removeBoldMarkers(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\*\*/g, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeBoldMarkers(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // 메타 필드(_version, _savedAt 등)는 제외
        if (key.startsWith('_')) {
          result[key] = obj[key];
        } else {
          result[key] = removeBoldMarkers(obj[key]);
        }
      }
    }
    return result;
  }
  return obj;
}

// 단일 저장 함수
function saveState(key, value, options = {}) {
  if (!validateState(key, value)) {
    console.error('[saveState] Validation failed for key:', key);
    return false;
  }

  try {
    // 저장 직전 deep copy
    const dataToSave = deepCopy(value);
    
    // "**" 제거 (모든 문자열에서)
    const cleanedData = removeBoldMarkers(dataToSave);
    
    // 스키마에 버전 정보 추가
    let finalValue = cleanedData;
    if (typeof cleanedData === 'object' && cleanedData !== null && !Array.isArray(cleanedData)) {
      finalValue = {
        ...cleanedData,
        _version: STORAGE_VERSION,
        _savedAt: Date.now()
      };
    }
    
    // JSON 직렬화
    const serialized = typeof finalValue === 'string' 
      ? finalValue 
      : JSON.stringify(finalValue);
    
    // 저장 시도
    localStorage.setItem(key, serialized);
    
    // 버튼 색상 업데이트 (내용 또는 서식 관련 키인 경우)
    if (key === STORAGE_SERMON || key === STORAGE_UNIT_CTX || key === STORAGE_WHOLE_CTX || 
        key === STORAGE_COMMENTARY || key === STORAGE_SUMMARY || key === 'wbps.versefmt.v2') {
      setTimeout(updateButtonColors, 100);
    }
    
    // 저장 직후 shallow clone으로 확인
    const saved = shallowClone(finalValue);
    
    // 저장 성공 이벤트 발생
    if (!options.silent) {
      window.dispatchEvent(new CustomEvent('wbps:stateSaved', {
        detail: { key, value: saved }
      }));
    }
    
    return true;
  } catch (e) {
    console.error('[saveState] Save failed:', e);
    // 저장 실패 시 백업 생성
    backupState(key, value);
    return false;
  }
}

// 저장 호출 정규화 (debounce) - 단일 이벤트 루프
const saveQueue = new Map();
let saveTimer = null;
const DEFAULT_SAVE_DELAY = 300;

// 통합 저장 이벤트 핸들러
function debounceSave(key, value, delay = DEFAULT_SAVE_DELAY) {
  // 큐에 추가
  saveQueue.set(key, value);
  
  // 기존 타이머 취소
  if (saveTimer) clearTimeout(saveTimer);
  
  // 새 타이머 설정
  saveTimer = setTimeout(() => {
    // 큐의 모든 항목 저장
    const count = saveQueue.size;
    const savedKeys = [];
    for (const [k, v] of saveQueue.entries()) {
      if (saveState(k, v, { silent: true })) {
        savedKeys.push(k);
      }
    }
    saveQueue.clear();
    saveTimer = null;
    
    // 일괄 저장 완료 이벤트
    window.dispatchEvent(new CustomEvent('wbps:batchSaved', {
      detail: { count, savedKeys }
    }));
  }, delay);
}

// 전역 저장 이벤트 리스너 통합
(function setupUnifiedSaveEventLoop() {
  // 모든 저장 요청을 단일 이벤트로 처리
  window.addEventListener('wbps:saveRequest', (e) => {
    const { key, value, delay } = e.detail || {};
    if (key !== undefined && value !== undefined) {
      debounceSave(key, value, delay || DEFAULT_SAVE_DELAY);
    }
  }, { capture: true });
  
  // 즉시 저장 요청 (debounce 없음)
  window.addEventListener('wbps:saveImmediate', (e) => {
    const { key, value } = e.detail || {};
    if (key !== undefined && value !== undefined) {
      saveState(key, value);
    }
  }, { capture: true });
})();

// 통합 로딩 함수
function loadState(key, defaultValue = null, options = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }
    
    // 마이그레이션 체크
    if (options.migrate !== false) {
      const migrated = migrateState(key, raw);
      if (migrated.key !== key) {
        // 마이그레이션된 경우 새 키로 다시 로드
        return loadState(migrated.key, defaultValue, { migrate: false });
      }
    }
    
    // 파싱 시도
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      // JSON이 아닌 경우 원본 반환
      return raw;
    }
  } catch (e) {
    console.error('[loadState] Load failed:', e);
    return defaultValue;
  }
}

// 초기화 시 자동 마이그레이션 실행
(function autoMigrate() {
  try {
    const keys = Object.keys(localStorage);
    let migratedCount = 0;
    for (const key of keys) {
      if (key.startsWith('wbps.') && !key.includes('.v4') && !key.includes('backup')) {
        const raw = localStorage.getItem(key);
        const migrated = migrateState(key, raw);
        if (migrated.key !== key) {
          migratedCount++;
        }
      }
    }
    if (migratedCount > 0) {
      console.log(`[autoMigrate] Migrated ${migratedCount} keys to v4`);
    }
  } catch (e) {
    console.error('[autoMigrate] Migration error:', e);
  }
})();
// ===== [통합 저장 시스템 v4] END =====

function todayStr(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function exportAllData(){
  const keys = [STORAGE_SERMON, STORAGE_UNIT_CTX, STORAGE_WHOLE_CTX, STORAGE_COMMENTARY, STORAGE_SUMMARY, VOICE_CHOICE_KEY];
  const payload = { __wbps:1, date: todayStr(), items:{} };
  keys.forEach(k=> payload.items[k] = loadState(k, null));
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  const ts = new Date();
  const tss = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}-${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}`;
  a.href = URL.createObjectURL(blob);
  a.download = `wbps-backup-${tss}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  status('전체 데이터를 내보냈습니다.');
}
async function importAllData(file){
  try{
    const text = await file.text();
    const json = JSON.parse(text);
    if(!json || json.__wbps!==1 || !json.items){ alert('백업 파일 형식이 아닙니다.'); return; }
    if(!confirm('이 백업으로 현재 기기의 데이터를 덮어쓸까요?')) return;
    Object.entries(json.items).forEach(([k,v])=>{
      if(v===null || v===undefined) localStorage.removeItem(k);
      else saveState(k, v);
    });
    status('가져오기가 완료되었습니다. 페이지를 새로고침하면 반영됩니다.');
  }catch(e){
    console.error(e);
    alert('가져오기 중 오류가 발생했습니다.');
  }
}

/* --------- Refs / State --------- */
const voiceSelect = el('voiceSelect'), testVoiceBtn = el('testVoice');
const rateCtl = el('rateCtl'), pitchCtl = el('pitchCtl'), voiceHint = el('voiceHint');
const modalWrap = el('modalWrap'), modalRef = el('modalRef');
const sermonList = el('sermonList'), sermonEditor = el('sermonEditor');
const sermonTitle = el('sermonTitle'), sermonBody = el('sermonBody');
const editorSpeakBtn = el('editorSpeak');
const modalFooterNew = el('modalFooterNew');

let BIBLE = createEmptyBibleState();
let CURRENT = { book:null, chap:null, paraIdx:null, paraId:null };
let READER = { playing:false, q:[], idx:0, synth:window.speechSynthesis||null, scope:null, btn:null, continuous:false };
let EDITOR_READER = { playing:false, u:null, synth:window.speechSynthesis||null };
const LAZY_BODY_PREVIEW_COUNT = 12;
const SEARCH_PAGE_SIZE = 20;
const SERMON_PREVIEW_CHAR_LIMIT = 1200;
const DRAFT_PREFIX = 'wbps.sermon.draft.';
const DRAFT_MAX_ITEMS = 5;
const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function createEmptyBibleState(){
  return { meta:{}, books:{}, bookOrder:[] };
}
function syncBibleGlobal(){
  window.BIBLE = BIBLE;
}
function ensureBookState(bookName){
  if (!BIBLE.books[bookName]) BIBLE.books[bookName] = { _loaded:false, _chapterOrder:[] };
  return BIBLE.books[bookName];
}
function ensureChapterState(bookName, chap){
  const bookState = ensureBookState(bookName);
  if (!bookState[chap]) bookState[chap] = { chapter:chap, paras:[], _loaded:false };
  return bookState[chap];
}
function getLoadedPara(bookName, chap, idx){
  return BIBLE?.books?.[bookName]?.[chap]?.paras?.[idx] || null;
}
async function apiJSON(path){
  const res = await fetch(path, {cache:'no-store'});
  if(!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return await res.json();
}
async function bootstrapBibleIndex(){
  try {
    const data = await apiJSON('/api/books');
    BIBLE = createEmptyBibleState();
    BIBLE.bookOrder = (data.books || []).map(item => item.book);
    (data.books || []).forEach(item => {
      BIBLE.books[item.book] = {
        _loaded:false,
        _chapterOrder:Array.from({ length: Number(item.chapter_count) || 0 }, (_, i) => i + 1)
      };
    });
    syncBibleGlobal();
  } catch (_) {
    let raw = null;
    try {
      raw = await tryFetchJSON('bible-paragraphs.json');
    } catch(_) {
      raw = await tryFetchJSON('bible_paragraphs.json');
    }
    BIBLE = createEmptyBibleState();
    const books = raw?.books || {};
    BIBLE.bookOrder = Object.keys(books);
    BIBLE.meta = raw?.meta || {};
    BIBLE.bookOrder.forEach(bookName => {
      const chapters = books[bookName] || {};
      const chapterOrder = Object.keys(chapters).map(n => parseInt(n, 10)).sort((a, b) => a - b);
      BIBLE.books[bookName] = { _loaded:true, _chapterOrder:chapterOrder };
      chapterOrder.forEach(chap => {
        const chapterData = chapters[String(chap)] || {};
        BIBLE.books[bookName][chap] = {
          chapter: chap,
          title: chapterData.title || '',
          paraCount: Array.isArray(chapterData.paras) ? chapterData.paras.length : 0,
          paras: Array.isArray(chapterData.paras) ? chapterData.paras : [],
          _loaded: true
        };
      });
    });
    syncBibleGlobal();
  }
}
async function ensureBookChaptersLoaded(bookName){
  const bookState = ensureBookState(bookName);
  if (bookState._loaded) return bookState;
  const data = await apiJSON(`/api/chapters/${encodeURIComponent(bookName)}`);
  bookState._chapterOrder = [];
  (data.chapters || []).forEach(ch => {
    const chap = Number(ch.chapter);
    bookState._chapterOrder.push(chap);
    bookState[chap] = {
      chapter: chap,
      title: ch.title || '',
      paraCount: Number(ch.para_count) || 0,
      firstRef: ch.first_ref || '',
      firstTitle: ch.first_title || '',
      paras: bookState[chap]?.paras || [],
      _loaded: !!bookState[chap]?._loaded
    };
  });
  bookState._loaded = true;
  syncBibleGlobal();
  return bookState;
}
async function ensureChapterParagraphsLoaded(bookName, chap){
  const chapterState = ensureChapterState(bookName, chap);
  if (chapterState._loaded && Array.isArray(chapterState.paras) && chapterState.paras.length) return chapterState;
  const data = await apiJSON(`/api/paragraphs/${encodeURIComponent(bookName)}/${chap}`);
  chapterState.title = data.title || chapterState.title || '';
  chapterState.paras = Array.isArray(data.paras) ? data.paras : [];
  chapterState.paraCount = chapterState.paras.length;
  chapterState._loaded = true;
  syncBibleGlobal();
  return chapterState;
}
function bytesToBase64(bytes){
  let binary = '';
  const chunk = 0x8000;
  for(let i = 0; i < bytes.length; i += chunk){
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function base64ToBytes(base64){
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for(let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function compressDraftText(text){
  const source = String(text || '');
  if (!source) return { codec:'plain', text:'' };
  if (typeof CompressionStream === 'function' && typeof TextEncoder === 'function') {
    const stream = new Blob([source]).stream().pipeThrough(new CompressionStream('gzip'));
    const buffer = await new Response(stream).arrayBuffer();
    return { codec:'gzip-base64', text:bytesToBase64(new Uint8Array(buffer)) };
  }
  return { codec:'plain', text:source };
}
async function decompressDraftText(payload){
  if (!payload || typeof payload !== 'object') return '';
  if (payload.codec === 'gzip-base64' && payload.text && typeof DecompressionStream === 'function') {
    try {
      const bytes = base64ToBytes(payload.text);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return await new Response(stream).text();
    } catch(_) {}
  }
  return String(payload.text || payload.bodyText || '');
}
function cleanupDraftStorage(){
  try {
    const now = Date.now();
    const drafts = Object.keys(localStorage)
      .filter(key => key.startsWith(DRAFT_PREFIX))
      .map(key => {
        try {
          const value = JSON.parse(localStorage.getItem(key) || '{}');
          return { key, ts: Number(value.ts) || 0 };
        } catch(_) {
          return { key, ts: 0 };
        }
      })
      .sort((a, b) => b.ts - a.ts);

    drafts.forEach((item, index) => {
      const expired = !item.ts || now - item.ts > DRAFT_MAX_AGE_MS;
      const overflow = index >= DRAFT_MAX_ITEMS;
      if (expired || overflow) localStorage.removeItem(item.key);
    });
  } catch(e) {
    console.warn('[draft] cleanup failed', e);
  }
}
function plainTextToEditorHTML(text){
  return escapeHtml(String(text || '')).replace(/\n/g, '<br>');
}

/* --------- Boot --------- */
(async function boot(){
  const startTime = performance.now();
  
  try {
    // 🚀 IndexedDB 캐싱 시스템 사용 (재방문 시 즉시 로딩!)
    await bootstrapBibleIndex();
      // fallback: 캐싱 시스템이 없으면 직접 fetch
  } catch(e) {
    status('bible-paragraphs.json을 찾을 수 없습니다. 같은 폴더에 두고 다시 열어주세요.');
    console.error('[Boot] 성경 데이터 로드 실패:', e);
    return;
  }
  
  buildTree();
  ensureSermonButtons();   // 🔧 설교 버튼 누락 시 보강
  
  const loadTime = (performance.now() - startTime).toFixed(0);
  status(`불러오기 완료 (${loadTime}ms). 66권 트리가 활성화되었습니다.`);
  console.log(`[Boot] ✅ 전체 초기화 완료: ${loadTime}ms`);
  
  await setupVoices();
  
  // 프로그램 시작 시 설교목록 자동 표시 비활성화 (설교목록 버튼을 눌러야 표시됨)
  // restoreSermonListOnStartup();
})();

(function bindButtons(){
  el('btnSaveJSON')?.addEventListener('click', downloadBibleJSON);
  const btnExport = el('btnExportAll');
  const btnImport = el('btnImportAll');
  const fileInput = el('importFile');
  if (btnExport) btnExport.onclick = exportAllData;
  if (btnImport) btnImport.onclick = ()=> fileInput && fileInput.click();
  if (fileInput) fileInput.addEventListener('change', (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    importAllData(f).finally(()=>{ e.target.value=''; });
  });
})();

async function tryFetchJSON(path){ const res = await fetch(path, {cache:'no-store'}); if(!res.ok) throw 0; return await res.json(); }

/* --------- Voice --------- */
function waitForVoices(timeout=1500){
  return new Promise(resolve=>{
    const have = speechSynthesis.getVoices?.();
    if (have && have.length) return resolve(have);
    const t = setTimeout(()=> resolve(speechSynthesis.getVoices?.()||[]), timeout);
    speechSynthesis.onvoiceschanged = ()=>{ clearTimeout(t); resolve(speechSynthesis.getVoices?.()||[]); };
  });
}
function getKoreanVoices(all){
  return (all||[]).filter(v=>{
    const n=(v.name||'').toLowerCase(), l=(v.lang||'').toLowerCase();
    return l.startsWith('ko') || n.includes('korean') || n.includes('한국') || n.includes('korea');
  });
}
function presetsForSingleVoice(){
  return [
    {id:'preset-soft-low',  label:'프리셋 · 저음/느림',   rate:0.85, pitch:0.85},
    {id:'preset-soft-high', label:'프리셋 · 고음/느림',   rate:0.90, pitch:1.20},
    {id:'preset-fast',      label:'프리셋 · 빠름',       rate:1.20, pitch:1.05},
    {id:'preset-bright',    label:'프리셋 · 밝게',       rate:1.05, pitch:1.25},
    {id:'preset-radio',     label:'프리셋 · 라디오톤',   rate:1.00, pitch:0.90},
    {id:'preset-reading',   label:'프리셋 · 낭독체',     rate:0.95, pitch:1.00},
  ];
}
async function setupVoices(){
  // 음성 선택 UI 요소가 없으면 건너뛰기
  if (!voiceSelect) {
    console.warn('[setupVoices] voiceSelect 요소를 찾을 수 없습니다. 음성 선택 UI가 없어도 낭독 기능은 작동합니다.');
    return;
  }
  
  const all = await waitForVoices();
  const kos = getKoreanVoices(all);

  voiceSelect.innerHTML = '';
  const def = document.createElement('option');
  def.value = JSON.stringify({type:'default'});
  def.textContent = '브라우저 기본(ko-KR)';
  voiceSelect.appendChild(def);

  if(kos.length > 0){
    const og = document.createElement('optgroup'); og.label = '한국어 보이스';
    kos.forEach(v=>{
      const opt = document.createElement('option');
      opt.value = JSON.stringify({type:'voice', uri:v.voiceURI});
      opt.textContent = `${v.name} — ${v.lang}${v.localService ? ' (로컬)' : ''}`;
      og.appendChild(opt);
    });
    voiceSelect.appendChild(og);
  }
  if(kos.length <= 1){
    const pg = document.createElement('optgroup'); pg.label = '스타일 프리셋';
    presetsForSingleVoice().forEach(p=>{
      const opt = document.createElement('option');
      opt.value = JSON.stringify({type:'preset', rate:p.rate, pitch:p.pitch});
      opt.textContent = p.label;
      pg.appendChild(opt);
    });
    if (voiceHint) voiceHint.style.display = '';
  } else {
    if (voiceHint) voiceHint.style.display = 'none';
  }

  const saved = loadState(VOICE_CHOICE_KEY, null);
  if(saved){
    // saved가 객체인 경우 JSON 문자열로 변환하여 비교
    const savedStr = typeof saved === 'string' ? saved : JSON.stringify(saved);
    const idx = [...voiceSelect.options].findIndex(o=>o.value===savedStr);
    if(idx>=0) voiceSelect.selectedIndex = idx;
  } else {
    saveState(VOICE_CHOICE_KEY, voiceSelect.value);
  }
  voiceSelect.addEventListener('change', ()=> debounceSave(VOICE_CHOICE_KEY, voiceSelect.value));
  if (testVoiceBtn) testVoiceBtn.onclick = ()=> speakSample('태초에 하나님이 천지를 창조하시니라.');
}
function resolveVoiceChoice(){
  const saved = loadState(VOICE_CHOICE_KEY, null);
  if(!saved) return {type:'default'};
  // saved가 문자열(JSON)인 경우 파싱, 객체인 경우 그대로 사용
  if(typeof saved === 'string') {
    try {
      return JSON.parse(saved);
    } catch(e) {
      return {type:'default'};
    }
  }
  // 이미 객체인 경우 그대로 반환
  return saved;
}
function pickVoiceByURI(uri){ return (speechSynthesis.getVoices?.()||[]).find(v=>v.voiceURI===uri) || null; }
function applyVoice(u){
  const choice = resolveVoiceChoice();
  if(!choice || typeof choice !== 'object') {
    // choice가 유효하지 않은 경우 기본값 사용
    u.lang = 'ko-KR';
    u.rate = parseFloat(rateCtl?.value||'0.95');
    u.pitch = parseFloat(pitchCtl?.value||'1');
    return;
  }
  const baseRate = parseFloat(rateCtl?.value||'0.95');
  const basePitch = parseFloat(pitchCtl?.value||'1');
  if(choice.type==='voice' && choice.uri){
    const v = pickVoiceByURI(choice.uri);
    if(v){ u.voice = v; u.lang = v.lang; } else { u.lang = 'ko-KR'; }
    u.rate = baseRate; u.pitch = basePitch;
  } else if(choice.type==='preset'){
    u.lang = 'ko-KR';
    u.rate = clamp((choice.rate ?? 0.95) * baseRate / 0.95, 0.5, 2);
    u.pitch = clamp((choice.pitch ?? 1.0) * basePitch / 1.0, 0, 2);
  } else {
    u.lang = 'ko-KR'; u.rate = baseRate; u.pitch = basePitch;
  }
}
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }
function speakSample(text){
  const synth = window.speechSynthesis;
  try{ synth.cancel(); }catch(e){}
  const u = new SpeechSynthesisUtterance(text);
  applyVoice(u);
  synth.speak(u);
}

/* --------- Tree --------- */
function buildTree(){
  treeEl.innerHTML = '';
  if(!BIBLE){ treeEl.innerHTML = '<div class="muted">파일을 찾을 수 없습니다.</div>'; return; }

  for(const bookName of Object.keys(BIBLE.books)){
    const detBook = document.createElement('details');
    const sumBook = document.createElement('summary');
    sumBook.innerHTML = `<span class="tw">${escapeHtml(bookName)}</span>`;
    detBook.appendChild(sumBook);

    const chWrap = document.createElement('div'); chWrap.className='chapters';
    const chapters = Object.keys(BIBLE.books[bookName]).map(n=>parseInt(n,10)).sort((a,b)=>a-b);

    for(const chap of chapters){
      const detChap = document.createElement('details');
      const sumChap = document.createElement('summary');
      sumChap.innerHTML = `<span class="chip">${chap}장</span>`;
      detChap.appendChild(sumChap);

      const parWrap = document.createElement('div'); parWrap.className='paras';
      const paras = BIBLE.books[bookName][chap].paras || [];
      paras.forEach((p, idx)=>{
        const detPara = document.createElement('details'); detPara.className='para';
        detPara.setAttribute('data-book', bookName);
        detPara.setAttribute('data-ch', chap);
        detPara.setAttribute('data-idx', idx);

        const m = String(p.ref||'').match(/^(\d+):(\d+)(?:-(\d+))?$/);
        const v1 = m ? m[2] : '?', v2 = m ? (m[3]||m[2]) : '?';
        const titleText = p.title || p.ref;

        const sum = document.createElement('summary');
        sum.innerHTML = `
          <span class="vrange">(${v1}-${v2})</span>
          <span class="ptitle"
                data-book="${bookName}"
                data-ch="${chap}"
                data-idx="${idx}"
                title="제목을 더블클릭하면 편집할 수 있습니다">${escapeHtml(titleText)}</span>
        `;

        const titleEl = sum.querySelector('.ptitle');

        titleEl.addEventListener('dblclick', (e)=>{
          e.preventDefault(); e.stopPropagation();
          detPara.open = true;
          startInlineTitleEdit(titleEl, bookName, chap, idx);
        }, true);

        function guardSummary(ev){
          const isEditing = titleEl.isContentEditable;
          const dblOnTitle = (ev.type === 'dblclick' && ev.target === titleEl);
          if (isEditing || dblOnTitle){
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
        ['pointerdown','mousedown','click','dblclick'].forEach(type=>{
          sum.addEventListener(type, guardSummary, true);
        });

        detPara.appendChild(sum);

        const body = document.createElement('div');
        body.className = 'pbody';
        body.innerHTML = `
          <div class="ptoolbar">
            <button class="primary speakBtn">낭독</button>
            <label class="chip"><input type="checkbox" class="keepReading" style="margin-right:6px">계속 낭독</label>
            <button class="ctxBtn btnSummary">내용흐름</button>
            <button class="ctxBtn btnUnitCtx">단위성경속 맥락</button>
            <button class="ctxBtn btnWholeCtx">전체성경속 맥락</button>
            <button class="ctxBtn btnCommentary">주석</button>
            <button class="sermBtn">설교목록</button>
            <div class="spacer"></div>
          </div>
          <div class="pcontent"></div>`;

        // [PATCH 1 START] 설교 버튼 생성/가시성만 보강 (클릭 바인딩 없음)
        (function ensureSermonBtn(){
          const tb = body.querySelector('.ptoolbar');
          if (!tb) return;

          if (!tb.querySelector('.spacer')) {
            const sp = document.createElement('div');
            sp.className = 'spacer';
            tb.appendChild(sp);
          }
          let sermBtn = tb.querySelector('.sermBtn');
          if (!sermBtn) {
            sermBtn = document.createElement('button');
            sermBtn.className = 'sermBtn';
            sermBtn.textContent = '설교목록';
            tb.appendChild(sermBtn);
          }
        })();
        // [PATCH 1 END]

        detPara.appendChild(body);

        const pcontent = body.querySelector('.pcontent');
        // 성경 본문 편집을 위해 contenteditable 설정
        pcontent.setAttribute('contenteditable', 'true');
        (p.verses||[]).forEach(([v,t])=>{
          const line = document.createElement('div');
          line.className = 'pline';
          line.dataset.verse = v;
          line.innerHTML = `<sup class="pv">${v}</sup>${t}`;
          pcontent.appendChild(line);
        });

        detPara.addEventListener('toggle', ()=>{
          if(detPara.open){
            CURRENT.book = bookName; CURRENT.chap = chap; CURRENT.paraIdx = idx;
            const para = BIBLE.books[bookName][chap].paras[idx];
            CURRENT.paraId = `${bookName}|${chap}|${para.ref}`;
            status(`선택됨: ${bookName} ${chap}장 · ${para.title||para.ref}`);
            // 열릴 때 설교 버튼 누락 시 즉시 생성 (클릭 바인딩 없음)
            const tb = detPara.querySelector('.ptoolbar');
            if (tb && !tb.querySelector('.sermBtn')) {
              const btn = document.createElement('button');
              btn.className = 'sermBtn';
              btn.textContent = '설교';
              tb.appendChild(btn);
            }
          }
        });

        body.querySelector('.speakBtn').addEventListener('click', ()=>{
          toggleSpeakInline(bookName, chap, idx, detPara, body.querySelector('.speakBtn'));
        });

        // 컨텍스트 에디터 버튼들
        body.querySelector('.btnUnitCtx').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('unit'); }); // 단위성경속 편집기 호출
        body.querySelector('.btnWholeCtx').addEventListener('click',()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('whole'); }); // 전체성경속 편집기 호출
        body.querySelector('.btnCommentary').addEventListener('click',()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('commentary'); }); // 주석 편집기 호출
        body.querySelector('.btnSummary').addEventListener('click',   ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('summary'); }); // 내용흐름 편집기 호출

        parWrap.appendChild(detPara);
      });

      detChap.appendChild(parWrap);
      chWrap.appendChild(detChap);
    }

    detBook.appendChild(chWrap);
    treeEl.appendChild(detBook);
  }
    // ✅ 바로 여기에 한 줄 추가합니다 👇👇👇
  document.dispatchEvent(new CustomEvent('wbp:treeBuilt'));
}

function buildTree(){
  treeEl.innerHTML = '';
  if(!BIBLE || !Array.isArray(BIBLE.bookOrder)){
    treeEl.innerHTML = '<div class="muted">파일을 찾을 수 없습니다.</div>';
    return;
  }

  BIBLE.bookOrder.forEach(bookName => {
    const detBook = document.createElement('details');
    detBook.className = 'book';
    detBook.dataset.book = bookName;

    const sumBook = document.createElement('summary');
    sumBook.innerHTML = `<span class="tw">${escapeHtml(bookName)}</span>`;
    detBook.appendChild(sumBook);

    const chWrap = document.createElement('div');
    chWrap.className = 'chapters';

    const chapterOrder = ensureBookState(bookName)._chapterOrder || [];
    chapterOrder.forEach(chap => {
      const detChap = document.createElement('details');
      detChap.dataset.book = bookName;
      detChap.dataset.ch = chap;

      const sumChap = document.createElement('summary');
      sumChap.innerHTML = `<span class="chip">${chap}장</span>`;
      detChap.appendChild(sumChap);

      const parWrap = document.createElement('div');
      parWrap.className = 'paras';
      parWrap.innerHTML = '<div class="muted" style="padding:6px 2px">본문은 열 때 불러옵니다.</div>';
      detChap.appendChild(parWrap);

      detChap.addEventListener('toggle', async ()=>{
        if (!detChap.open || detChap.dataset.loading === '1') return;
        try {
          detChap.dataset.loading = '1';
          parWrap.innerHTML = '<div class="muted" style="padding:6px 2px">본문 불러오는 중…</div>';
          const chapterState = await ensureChapterParagraphsLoaded(bookName, chap);
          renderChapterParagraphs(bookName, chap, chapterState.paras || [], parWrap);
          ensureSermonButtons();
          if (typeof ensureBookHeadChips === 'function') ensureBookHeadChips();
        } catch (err) {
          console.error('[lazy-load] chapter load failed', err);
          parWrap.innerHTML = '<div class="muted" style="padding:6px 2px">본문을 불러오지 못했습니다.</div>';
        } finally {
          detChap.dataset.loading = '';
        }
      });

      chWrap.appendChild(detChap);
    });

    detBook.appendChild(chWrap);
    treeEl.appendChild(detBook);

    detBook.addEventListener('toggle', async ()=>{
      if (!detBook.open || detBook.dataset.loading === '1' || detBook.dataset.loaded === '1') return;
      try {
        detBook.dataset.loading = '1';
        await ensureBookChaptersLoaded(bookName);
        detBook.dataset.loaded = '1';
      } catch (err) {
        console.error('[lazy-load] book load failed', err);
      } finally {
        detBook.dataset.loading = '';
      }
    });
  });

  document.dispatchEvent(new CustomEvent('wbp:treeBuilt'));
}

function renderChapterParagraphs(bookName, chap, paras, parWrap){
  parWrap.innerHTML = '';
  paras.forEach((p, idx) => {
    parWrap.appendChild(createParagraphDetails(bookName, chap, idx, p));
  });
}

function createParagraphDetails(bookName, chap, idx, p){
  const detPara = document.createElement('details');
  detPara.className = 'para';
  detPara.dataset.book = bookName;
  detPara.dataset.ch = chap;
  detPara.dataset.idx = idx;

  const m = String(p.ref||'').match(/^(\d+):(\d+)(?:-(\d+))?$/);
  const v1 = m ? m[2] : '?';
  const v2 = m ? (m[3]||m[2]) : '?';
  const titleText = p.title || p.ref;

  const sum = document.createElement('summary');
  sum.innerHTML = `
    <span class="vrange">(${v1}-${v2})</span>
    <span class="ptitle"
          data-book="${bookName}"
          data-ch="${chap}"
          data-idx="${idx}"
          title="제목을 더블클릭하면 편집할 수 있습니다">${escapeHtml(titleText)}</span>
  `;
  detPara.appendChild(sum);

  const titleEl = sum.querySelector('.ptitle');
  titleEl.addEventListener('dblclick', (e)=>{
    e.preventDefault();
    e.stopPropagation();
    detPara.open = true;
    startInlineTitleEdit(titleEl, bookName, chap, idx);
  }, true);
  ['pointerdown','mousedown','click','dblclick'].forEach(type=>{
    sum.addEventListener(type, (ev)=>{
      const isEditing = titleEl.isContentEditable;
      const dblOnTitle = ev.type === 'dblclick' && ev.target === titleEl;
      if (isEditing || dblOnTitle) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }, true);
  });

  const body = document.createElement('div');
  body.className = 'pbody';
  body.innerHTML = `
    <div class="ptoolbar">
      <button class="primary speakBtn">낭독</button>
      <label class="chip"><input type="checkbox" class="keepReading" style="margin-right:6px">계속 낭독</label>
      <button class="ctxBtn btnSummary">내용흐름</button>
      <button class="ctxBtn btnUnitCtx">단위성경속 맥락</button>
      <button class="ctxBtn btnWholeCtx">전체성경속 맥락</button>
      <button class="ctxBtn btnCommentary">주석</button>
      <button class="sermBtn">설교목록</button>
      <div class="spacer"></div>
    </div>
    <div class="pcontent" contenteditable="true"></div>`;
  detPara.appendChild(body);

  const pcontent = body.querySelector('.pcontent');
  body.querySelector('.speakBtn').addEventListener('click', ()=>{
    toggleSpeakInline(bookName, chap, idx, detPara, body.querySelector('.speakBtn'));
  });
  body.querySelector('.btnUnitCtx').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('unit'); });
  body.querySelector('.btnWholeCtx').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('whole'); });
  body.querySelector('.btnCommentary').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('commentary'); });
  body.querySelector('.btnSummary').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('summary'); });

  detPara.addEventListener('toggle', ()=>{
    if (!detPara.open) return;
    CURRENT.book = bookName;
    CURRENT.chap = chap;
    CURRENT.paraIdx = idx;
    const para = getLoadedPara(bookName, chap, idx);
    if (!para) return;
    CURRENT.paraId = `${bookName}|${chap}|${para.ref}`;
    status(`${bookName} ${chap}장 ${para.title || para.ref}`);
    renderParagraphBody(pcontent, para);
  });

  return detPara;
}

function renderParagraphBody(pcontent, para){
  if (!pcontent || pcontent.dataset.loaded === '1') return;
  const verses = Array.isArray(para?.verses) ? para.verses : [];
  const initialCount = Math.min(LAZY_BODY_PREVIEW_COUNT, verses.length);
  const fragment = document.createDocumentFragment();
  for(let i = 0; i < initialCount; i++){
    const [v, t] = verses[i];
    fragment.appendChild(createVerseLine(v, t));
  }
  pcontent.innerHTML = '';
  pcontent.appendChild(fragment);
  pcontent.dataset.loaded = '1';

  if (verses.length > initialCount) {
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'chip';
    moreBtn.textContent = '더 보기';
    moreBtn.addEventListener('click', ()=>{
      const extra = document.createDocumentFragment();
      for(let i = initialCount; i < verses.length; i++){
        const [v, t] = verses[i];
        extra.appendChild(createVerseLine(v, t));
      }
      pcontent.appendChild(extra);
      moreBtn.remove();
    }, { once:true });
    pcontent.appendChild(moreBtn);
  }
}

function createVerseLine(v, t){
  const line = document.createElement('div');
  line.className = 'pline';
  line.dataset.verse = v;
  line.innerHTML = `<sup class="pv">${v}</sup>${t}`;
  return line;
}

// [PATCH 2 START] 렌더 후에도 설교 버튼 누락 시 자동 보정(클릭 바인딩 없음)
(function sermonBtnWatcher(){
  const root = document.getElementById('tree');
  if (!root) return;

  function fix(tb){
    if (!tb.querySelector('.spacer')) {
      const sp = document.createElement('div');
      sp.className = 'spacer';
      tb.insertBefore(sp, tb.firstChild);
    }
    if (!tb.querySelector('.sermBtn')) {
      const b = document.createElement('button');
      b.className = 'sermBtn';
      b.textContent = '설교';
      tb.appendChild(b);
    }
  }

  let isSweeping = false; // 무한 루프 방지 플래그
  function sweep(){
    if(isSweeping) return; // 이미 스윕 중이면 무시
    isSweeping = true;
    try {
      root.querySelectorAll('details.para .ptoolbar').forEach(fix);
    } finally {
      // 다음 이벤트 루프에서 플래그 해제
      setTimeout(() => { isSweeping = false; }, 0);
    }
  }

  sweep();
  new MutationObserver(sweep).observe(root, {subtree:true, childList:true});
})();
// [PATCH 2 END]

/* ✅ 트리 렌더 후 설교 버튼이 누락됐을 때 자동 보강(클릭 바인딩 없음) */
function ensureSermonButtons(){
  document.querySelectorAll('#tree details.para .ptoolbar').forEach(tb=>{
    if (tb.querySelector('.sermBtn')) return;

    let spacer = tb.querySelector('.spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'spacer';
      tb.appendChild(spacer);
    }

    const btn = document.createElement('button');
    btn.className = 'sermBtn';
    btn.textContent = '설교';
    tb.appendChild(btn);
  });
}

/* 🔧 트리 위임 클릭 공용 처리 (유일한 클릭 바인딩) */
treeEl.addEventListener('click', (e)=>{
  const isCtxBtn = e.target.closest('.btnSummary, .btnUnitCtx, .btnWholeCtx, .btnCommentary, .sermBtn');
  if (!isCtxBtn) return;

  const paraEl = e.target.closest('details.para');
  const t = paraEl?.querySelector('summary .ptitle');
  if (!paraEl || !t) return;

  CURRENT.book   = t.dataset.book;
  CURRENT.chap   = parseInt(t.dataset.ch, 10);
  CURRENT.paraIdx= parseInt(t.dataset.idx, 10);
  const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
  if (!para) return;
  CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;

  if (e.target.closest('.btnSummary'))    { openSingleDocEditor('summary');    return; }
  if (e.target.closest('.btnUnitCtx'))    { openSingleDocEditor('unit');       return; }
  if (e.target.closest('.btnWholeCtx'))   { openSingleDocEditor('whole');      return; }
  if (e.target.closest('.btnCommentary')) { openSingleDocEditor('commentary'); return; }
  if (e.target.closest('.sermBtn'))       { openSermonListModal();             return; }

  // === [BOOK-CHIP → '내용흐름' 편집기 동일 사용] =========================
  const chip = e.target.closest('.book-chip[data-type="basic"], .book-chip[data-type="structure"], .book-chip[data-type="summary"]');
  if (chip) {
    e.preventDefault();
    e.stopPropagation();

    // 2개 이상 책 오픈 시 제한
    const openedBooks = [...document.querySelectorAll('#tree details.book[open]')];
    if (openedBooks.length > 1) {
      alert('2개 이상 성경이 열려 있습니다. 한 권만 연 다음 다시 시도하세요.');
      return;
    }

    // 대상 책: 열려있는 책 1개 또는 첫 책
    const bookEl = openedBooks[0] || document.querySelector('#tree > details.book');
    if (!bookEl) return;

    // 이 책의 1장 / 첫 단락
    const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
    const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
    if (!p1) return;

    // '내용흐름' 트리거 버튼 탐색
    const flowBtn =
      p1.querySelector('.ptoolbar [data-action="flow"]') ||
      p1.querySelector('.ptoolbar .btn-flow') ||
      [...(p1.querySelectorAll('.ptoolbar button')||[])].find(b => (b.textContent||'').trim() === '내용흐름');

    if (!flowBtn) return;

    // 내용흐름 편집기를 그대로 호출
    flowBtn.click();

    // 에디터 타이틀을 칩 라벨로 교체 (스타일/기능은 내용흐름 그대로)
    const label = (chip.textContent||'').trim();
    setTimeout(()=>{
      const dlg =
        document.querySelector('.flow-editor-modal') ||
        document.querySelector('.editor-modal') ||
        document.querySelector('.wbp-editor') ||
        document.querySelector('.modal');
      const titleEl =
        dlg?.querySelector('.modal-title') ||
        dlg?.querySelector('.editor-title') ||
        dlg?.querySelector('.title');
      if (titleEl) titleEl.textContent = label;
    }, 0);

    return;
  }
  // ======================================================================


});

/* --------- Inline TTS --------- */
function buildQueueFrom(book, chap, idx){
  const para = BIBLE.books[book][chap].paras[idx];
  return (para.verses||[]).map(([v,t])=>({verse:v, text:t}));
}
function clearReadingHighlight(scope){ 
  const elements = scope.nodeType === 1 && scope.classList?.contains('pline') 
    ? [scope] 
    : scope.querySelectorAll('.pline');
  elements.forEach(el=> {
    if (el.classList) {
      el.classList.remove('reading');
      el.removeAttribute('data-reading-sentence');
    }
    // 문장 하이라이트 span 제거
    el.querySelectorAll('.sentence-reading').forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize();
      }
    });
  });
}
function bindKeepReading(scope){
  const cb = scope.querySelector('.keepReading');
  if(!cb) return;
  cb.checked  = READER.continuous;
  cb.disabled = false;
  cb.onchange = ()=>{ READER.continuous = cb.checked; };
}
// 문장 분할 함수 (한국어/영문 종결부호 기준)
function splitToSentences(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  // 마침표, 물음표, 느낌표, 말줄임표, 한국어 종결(다.)도 일반 마침표로 처리
  const parts = t.split(/(?<=[\.!\?…]|[。！？])\s+/u).filter(s => s && s.trim().length > 0);
  return parts;
}

// 절 내부의 문장을 하이라이트하기 위한 함수
function highlightSentenceInLine(line, sentenceIndex, sentences) {
  if (!line || !sentences || sentenceIndex < 0 || sentenceIndex >= sentences.length) return;
  
  // 기존 문장 하이라이트 span 제거
  line.querySelectorAll('.sentence-reading').forEach(span => {
    const parent = span.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(span.textContent), span);
      parent.normalize();
    }
  });
  
  // 절 전체 하이라이트
  line.classList.add('reading');
  line.setAttribute('data-reading-sentence', sentenceIndex);
  line.scrollIntoView({block:'center', behavior:'smooth'});
  
  // 절 텍스트 가져오기 (절번호 제외)
  const verseNumEl = line.querySelector('.pv');
  const lineText = line.textContent || '';
  const verseNum = verseNumEl?.textContent || '';
  const textWithoutVerse = lineText.replace(verseNum, '').trim();
  
  // 현재 문장 찾기
  const targetSentence = sentences[sentenceIndex].trim();
  const sentenceStart = textWithoutVerse.indexOf(targetSentence);
  
  if (sentenceStart === -1) {
    // 문장을 찾지 못한 경우 절 전체만 하이라이트
    return;
  }
  
  // 절 내부 텍스트 노드 찾기 (절번호 제외)
  const walker = document.createTreeWalker(
    line,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // 절번호 노드는 제외
        if (verseNumEl && (node.parentElement === verseNumEl || node.parentElement?.contains(verseNumEl))) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );
  
  let textNode = null;
  let currentPos = 0;
  let foundStart = false;
  let startNode = null;
  let startOffset = 0;
  let endNode = null;
  let endOffset = 0;
  
  // 문장 시작과 끝 위치 찾기
  while (textNode = walker.nextNode()) {
    const text = textNode.textContent;
    const textLen = text.length;
    
    if (!foundStart && currentPos + textLen > sentenceStart) {
      // 문장 시작 위치 찾음
      foundStart = true;
      startNode = textNode;
      startOffset = sentenceStart - currentPos;
    }
    
    if (foundStart && currentPos + textLen >= sentenceStart + targetSentence.length) {
      // 문장 끝 위치 찾음
      endNode = textNode;
      endOffset = sentenceStart + targetSentence.length - currentPos;
      break;
    }
    
    currentPos += textLen;
  }
  
  // 문장을 span으로 감싸기
  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      
      const span = document.createElement('span');
      span.className = 'sentence-reading';
      span.style.background = 'color-mix(in hsl, var(--accent) 25%, black 0%)';
      span.style.borderRadius = '4px';
      span.style.padding = '2px 0';
      span.style.transition = 'background 0.2s';
      
      range.surroundContents(span);
    } catch (e) {
      // 범위가 여러 노드에 걸쳐 있는 경우 extractContents 사용
      try {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        const contents = range.extractContents();
        const span = document.createElement('span');
        span.className = 'sentence-reading';
        span.style.background = 'color-mix(in hsl, var(--accent) 25%, black 0%)';
        span.style.borderRadius = '4px';
        span.style.padding = '2px 0';
        span.style.transition = 'background 0.2s';
        span.appendChild(contents);
        range.insertNode(span);
      } catch (e2) {
        // 실패한 경우 절 전체만 하이라이트
        console.warn('문장 하이라이트 실패:', e2);
      }
    }
  }
}

function speakVerseItemInScope(item, scope, onend){
  if(!READER.synth) return;
  
  // 절 텍스트를 문장으로 분할
  const sentences = splitToSentences(item.text);
  const line = scope.querySelector(`.pline[data-verse="${item.verse}"]`);
  
  if (sentences.length === 0) {
    // 문장이 없으면 기존 방식대로 처리
    const u = new SpeechSynthesisUtterance(String(item.text));
    applyVoice(u);
    let done = false;
    const safeEnd = ()=>{ if(done) return; done = true; onend(); };
    u.onstart = ()=>{
      clearReadingHighlight(scope);
      if(line){ line.classList.add('reading'); line.scrollIntoView({block:'center', behavior:'smooth'}); }
      if (READER._wd){ clearTimeout(READER._wd); READER._wd = null; }
      const base = Math.max(800, Math.round(item.text.length * 65));
      const rate = u.rate || 1;
      const estimate = Math.max(600, Math.round(base / rate)) + 1200;
      READER._wd = setTimeout(safeEnd, estimate);
    };
    u.onend   = safeEnd;
    u.onerror = safeEnd;
    READER.synth.speak(u);
    return;
  }
  
  // 문장 단위로 읽기
  let currentSentenceIndex = 0;
  let allDone = false;
  
  function speakNextSentence() {
    if (allDone || currentSentenceIndex >= sentences.length) {
      onend();
      return;
    }
    
    const sentence = sentences[currentSentenceIndex];
    const u = new SpeechSynthesisUtterance(sentence);
    applyVoice(u);
    
    let done = false;
    const safeEnd = () => {
      if (done) return;
      done = true;
      currentSentenceIndex++;
      if (currentSentenceIndex < sentences.length) {
        speakNextSentence();
      } else {
        allDone = true;
        onend();
      }
    };
    
    u.onstart = () => {
      // 현재 문장 하이라이트
      if (line) {
        highlightSentenceInLine(line, currentSentenceIndex, sentences);
      }
      if (READER._wd) { clearTimeout(READER._wd); READER._wd = null; }
      const base = Math.max(800, Math.round(sentence.length * 65));
      const rate = u.rate || 1;
      const estimate = Math.max(600, Math.round(base / rate)) + 1200;
      READER._wd = setTimeout(safeEnd, estimate);
    };
    
    u.onend = safeEnd;
    u.onerror = safeEnd;
    
    READER.synth.speak(u);
  }
  
  // 첫 문장부터 시작
  clearReadingHighlight(scope);
  speakNextSentence();
}

function clearReadingHighlight(scope){
  const elements = scope.nodeType === 1 && scope.classList?.contains('pline')
    ? [scope]
    : scope.querySelectorAll('.pline');
  elements.forEach(el => {
    if (!el.classList) return;
    el.classList.remove('reading', 'sentence-reading');
    el.removeAttribute('data-reading-sentence');
  });
}

function highlightSentenceInLine(line, sentenceIndex){
  if (!line) return;
  clearReadingHighlight(line.closest('details.para') || line.parentNode || line);
  line.classList.add('reading', 'sentence-reading');
  line.setAttribute('data-reading-sentence', sentenceIndex);
  line.scrollIntoView({block:'center', behavior:'smooth'});
}

function toggleSpeakInline(book, chap, idx, paraDetailsEl, btnEl){
  // speechSynthesis가 없으면 재시도
  if(!READER.synth) {
    READER.synth = window.speechSynthesis || null;
    if(!READER.synth) return alert('이 브라우저는 음성합성을 지원하지 않습니다.');
  }
  const sameScope = READER.playing && READER.scope === paraDetailsEl;
  if(READER.playing && sameScope){ stopSpeakInline(); return; }
  READER.continuous = true;
  READER.q = buildQueueFrom(book, chap, idx);
  READER.idx = 0;
  READER.playing = true;
  READER.scope = paraDetailsEl;
  READER.btn = btnEl;
  try{ READER.synth.cancel(); }catch(e){}
  bindKeepReading(READER.scope);
  updateInlineSpeakBtn();
  playNextInQueueInline(book, chap, idx);
}
function playNextInQueueInline(book, chap, idx){
  if(!READER.playing) return;
  if(READER.idx >= READER.q.length){
    if(READER.continuous && goToNextParagraphInline(book, chap, idx)){
      const nextCb = READER.scope?.querySelector?.('.keepReading');
      if(nextCb){ nextCb.checked = READER.continuous; nextCb.disabled = false; }
      READER.q = buildQueueFrom(CURRENT.book, CURRENT.chap, CURRENT.paraIdx);
      READER.idx = 0;
      bindKeepReading(READER.scope);
      updateInlineSpeakBtn();
      setTimeout(()=>{ try{ READER.synth.cancel(); }catch(e){} playNextInQueueInline(CURRENT.book, CURRENT.chap, CURRENT.paraIdx); }, 120);
      return;
    }
    stopSpeakInline();
    return;
  }
  const item = READER.q[READER.idx];
  speakVerseItemInScope(item, READER.scope, ()=>{ READER.idx++; playNextInQueueInline(book, chap, idx); });
}
function stopSpeakInline(){
  READER.playing = false;
  try{ READER.synth && READER.synth.cancel(); }catch(e){}
  if (READER._wd){ clearTimeout(READER._wd); READER._wd = null; }
  if(READER.scope){
    const cb = READER.scope.querySelector?.('.keepReading');
    if(cb) cb.disabled = false;
    clearReadingHighlight(READER.scope);
  }
  updateInlineSpeakBtn();
  READER.scope = null; READER.btn = null;
}
function updateInlineSpeakBtn(){ if(READER.btn) READER.btn.textContent = READER.playing ? '중지' : '낭독'; }

function goToNextParagraphInline(book, chap, idx){
  const chObj = BIBLE.books[book][chap];
  const booksEls = [...treeEl.children];

  const bookNames = Object.keys(BIBLE.books);
  const bIdx = bookNames.indexOf(book);
  const bookEl = booksEls[bIdx];
  if(!bookEl) return false;

  const chaptersEls = bookEl.querySelectorAll(':scope > .chapters > details');
  const chapNums = Object.keys(BIBLE.books[book]).map(n=>parseInt(n,10)).sort((a,b)=>a-b);

  const chPos = chapNums.indexOf(chap);
  const chapEl = chaptersEls[chPos];
  if(!chapEl) return false;

  const paraEls = chapEl.querySelectorAll(':scope > .paras > details.para');

  if (READER.btn) READER.btn.textContent = '낭독';

  if (idx < chObj.paras.length - 1){
    const nextEl = paraEls[idx + 1];
    if(nextEl){
      chapEl.open = true;
      nextEl.open = true;
      CURRENT.book = book;
      CURRENT.chap = chap;
      CURRENT.paraIdx = idx + 1;
      READER.scope = nextEl;
      READER.btn = nextEl.querySelector('.speakBtn');
      if (READER.btn) READER.btn.textContent = READER.playing ? '중지' : '낭독';
      return true;
    }
  }

  if (chPos >= 0 && chPos < chapNums.length - 1){
    const nextChap = chapNums[chPos + 1];
    const nextChapEl = chaptersEls[chPos + 1];
    if(nextChapEl){
      const nextParas = (BIBLE.books[book][nextChap].paras || []);
      if(nextParas.length){
        const nextParaEl = nextChapEl.querySelector(':scope > .paras > details.para');
        nextChapEl.open = true;
        if(nextParaEl) nextParaEl.open = true;

        CURRENT.book = book;
        CURRENT.chap = nextChap;
        CURRENT.paraIdx = 0;

        READER.scope = nextParaEl;
        READER.btn = nextParaEl?.querySelector('.speakBtn') || null;
        if (READER.btn) READER.btn.textContent = READER.playing ? '중지' : '낭독';
        return true;
      }
    }
  }

  const bPos = bIdx;
  if (bPos >= 0 && bPos < bookNames.length - 1){
    const nextBook = bookNames[bPos + 1];
    const nextBookEl = booksEls[bPos + 1];
    if(nextBookEl){
      const firstChap = Math.min(...Object.keys(BIBLE.books[nextBook]).map(n=>parseInt(n,10)));
      const nextChapEl = nextBookEl.querySelector(':scope > .chapters > details');
      const nextParaEl = nextChapEl?.querySelector(':scope > .paras > details.para');
      if(nextParaEl){
        nextBookEl.open = true;
        nextChapEl.open = true;
        nextParaEl.open = true;

        CURRENT.book = nextBook;
        CURRENT.chap = firstChap;
        CURRENT.paraIdx = 0;

        READER.scope = nextParaEl;
        READER.btn = nextParaEl.querySelector('.speakBtn');
        if (READER.btn) READER.btn.textContent = READER.playing ? '중지' : '낭독';
        return true;
      }
    }
  }
  return false;
}

/* --------- Sermon / Context Editors --------- */
function getSermonMap(){ 
  const data = loadState(STORAGE_SERMON, {});
  // 메타 필드(_version, _savedAt 등) 제거하고 실제 데이터만 반환
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const { _version, _savedAt, _migrated, _migratedFrom, _migratedAt, ...cleanData } = data;
    return cleanData;
  }
  return data || {};
}
function setSermonMap(o, immediate = false){ 
  if (immediate) {
    // 즉시 저장 (debounce 없이)
    const saved = saveState(STORAGE_SERMON, o, { silent: false });
    if (!saved) {
      console.error('[setSermonMap] 저장 실패, 재시도 중...');
      // 재시도
      setTimeout(() => {
        saveState(STORAGE_SERMON, o, { silent: false });
      }, 100);
      return false;
    }
    return true;
  } else {
    const saved = saveState(STORAGE_SERMON, o);
    if (!saved) {
      console.error('[setSermonMap] 저장 실패, 재시도 중...');
      // 재시도
      setTimeout(() => {
        saveState(STORAGE_SERMON, o);
      }, 100);
      return false;
    }
    return true;
  }
}
function getDocMap(storageKey){ return loadState(storageKey, {}); }
function setDocMap(storageKey, obj){ saveState(storageKey, obj); }

/* ✅ 프로그램 시작 시 저장된 설교목록 자동 표시 */
function restoreSermonListOnStartup(){
  try {
    // 마지막으로 본 paraId 가져오기
    const lastParaId = loadState(STORAGE_LAST_SERMON_PARA, null);
    if (!lastParaId || typeof lastParaId !== 'string') {
      console.log('[restoreSermonListOnStartup] 저장된 paraId가 없습니다.');
      return;
    }
    
    // paraId 파싱: "book|chap|ref"
    const parts = lastParaId.split('|');
    if (parts.length < 3) {
      console.log('[restoreSermonListOnStartup] 잘못된 paraId 형식:', lastParaId);
      return;
    }
    
    const [book, chapStr, ref] = parts;
    const chap = parseInt(chapStr, 10);
    
    if (!book || !Number.isFinite(chap) || !BIBLE?.books?.[book]?.[chap]) {
      console.log('[restoreSermonListOnStartup] 유효하지 않은 paraId:', lastParaId);
      return;
    }
    
    // 해당 장의 단락 찾기
    const paras = BIBLE.books[book][chap].paras || [];
    const paraIdx = paras.findIndex(p => p.ref === ref);
    
    if (paraIdx === -1) {
      console.log('[restoreSermonListOnStartup] 단락을 찾을 수 없습니다:', lastParaId);
      return;
    }
    
    // CURRENT 상태 설정
    CURRENT.book = book;
    CURRENT.chap = chap;
    CURRENT.paraIdx = paraIdx;
    CURRENT.paraId = lastParaId;
    
    // 설교목록 확인
    const map = getSermonMap();
    const arr = map[lastParaId] || [];
    
    if (arr.length === 0) {
      console.log('[restoreSermonListOnStartup] 해당 paraId에 설교가 없습니다:', lastParaId);
      return;
    }
    
    console.log('[restoreSermonListOnStartup] 설교목록 자동 표시:', lastParaId, '설교 개수:', arr.length);
    
    // 트리가 완전히 빌드된 후 설교목록 표시
    setTimeout(() => {
      // 해당 단락 열기
      const paraEl = document.querySelector(`details.para summary .ptitle[data-book="${book}"][data-ch="${chap}"][data-idx="${paraIdx}"]`);
      if (paraEl) {
        const paraDetails = paraEl.closest('details.para');
        if (paraDetails && !paraDetails.open) {
          paraDetails.open = true;
        }
      }
      
      // 설교목록 모달 열기
      openSermonListModal();
    }, 500); // 트리 빌드 완료 대기
    
  } catch (e) {
    console.error('[restoreSermonListOnStartup] 오류:', e);
  }
}

/* ✅ 설교목록 모달 열기 */
function openSermonListModal(){
  // CURRENT 상태 확인 및 동기화
  if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
    if (!syncCurrentFromOpen()) {
      alert('단락을 먼저 선택해 주세요.');
      return;
    }
  }

  const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
  if (!para) {
    alert('선택한 단락을 찾을 수 없습니다.');
    return;
  }
  
  // paraId 확실히 설정
  CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  
  // 마지막으로 본 paraId 저장
  saveState(STORAGE_LAST_SERMON_PARA, CURRENT.paraId);

  document.getElementById('modalTitle').textContent = '설교목록';
  modalRef.textContent = `${CURRENT.book} ${CURRENT.chap}장 · ${para.title || para.ref} (${para.ref})`;
  
  sermonEditor.style.display = 'none';
  sermonEditor.classList.add('context-editor');
  // aria-hidden을 먼저 false로 설정한 후 display를 변경 (접근성 개선)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = '';
  // 플로팅 툴바 숨김
  if (window.__hideFloatingToolbar) window.__hideFloatingToolbar();

  // localStorage에서 설교목록 정보를 가져와서 렌더링
  renderSermonList();
  
  // 모달이 열린 후 포커스를 설정하기 전에 aria-hidden이 확실히 적용되도록 보장
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'flex') {
      modalWrap.setAttribute('aria-hidden','false');
    }
  });
  
  // 모달이 열린 후 포커스를 모달 내부로 이동 (접근성 개선)
  setTimeout(() => {
    const firstFocusable = modalWrap.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }, 0);
}

/* ✅ 설교 편집기 열기 (설교보기 버튼에서 호출) */
function openSermonEditorDirectly(sermonIdx = 0){
  if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
    if (!syncCurrentFromOpen()) {
      alert('단락을 먼저 선택해 주세요.');
      return;
    }
  }

  const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
  if (!para) {
    alert('선택한 단락을 찾을 수 없습니다.');
    return;
  }
  CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;

  // 설교 데이터 확인
  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  const existingSermon = arr[sermonIdx];

  document.getElementById('modalTitle').textContent = '설교 편집';
  // 본문 정보 숨김 (설교보기에서는 표시하지 않음)
  modalRef.textContent = '';
  modalRef.style.display = 'none';
  sermonList.innerHTML = '';
  sermonEditor.style.display = '';
  sermonEditor.classList.add('context-editor');
  sermonEditor.dataset.ctxType = '';
  sermonEditor.dataset.editing = existingSermon ? String(sermonIdx) : ''; // 편집 모드 설정
  
  // aria-hidden을 먼저 false로 설정한 후 display를 변경 (접근성 개선)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = 'none';
  // 플로팅 툴바 숨김
  if (window.__hideFloatingToolbar) window.__hideFloatingToolbar();

  // 제목 입력 필드 표시
  sermonTitle.style.display = '';
  
  // 모달이 열린 후 포커스를 설정하기 전에 aria-hidden이 확실히 적용되도록 보장
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'flex') {
      modalWrap.setAttribute('aria-hidden','false');
    }
  });
  
  // 메타 필드 숨김 (설교보기에서는 표시하지 않음)
  const metaFields = document.getElementById('sermonMetaFields');
  if (metaFields) metaFields.style.display = 'none';
  
  // 기존 설교 내용 로드 또는 빈 편집기
  if (existingSermon) {
    sermonTitle.value = existingSermon.title || '';
    setBodyHTML(existingSermon.body || '');
  } else {
    sermonTitle.value = '';
    setBodyHTML('');
  }
  
  // 성구 삽입 버튼 숨김 (설교보기에서는 사용하지 않음)
  const insertVerseBtn = document.getElementById('insertVerseBtn');
  if (insertVerseBtn) {
    insertVerseBtn.style.display = 'none';
  }
  
  // 모달이 열린 후 포커스를 모달 내부로 이동 (접근성 개선)
  setTimeout(() => {
    const firstFocusable = modalWrap.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }, 0);
}

/* ✅ 성구 삽입 기능 */
function setupInsertVerseButton(){
  const insertBtn = document.getElementById('insertVerseBtn');
  if (!insertBtn) return;
  
  // 기존 이벤트 리스너 제거 후 새로 추가
  const newBtn = insertBtn.cloneNode(true);
  insertBtn.parentNode.replaceChild(newBtn, insertBtn);
  
  newBtn.addEventListener('click', () => {
    if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
      alert('단락을 먼저 선택해 주세요.');
      return;
    }
    
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (!para) {
      alert('선택한 단락을 찾을 수 없습니다.');
      return;
    }
    
    // 성구 텍스트 생성
    const verses = para.verses || [];
    let verseText = `${CURRENT.book} ${CURRENT.chap}:${para.ref}\n\n`;
    verses.forEach(([v, t]) => {
      verseText += `${v} ${t}\n`;
    });
    
    // 현재 커서 위치에 삽입
    const body = sermonBody;
    if (!body) return;
    
    if (isRTE()) {
      // RTE 모드
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        
        // 줄바꿈을 <br>로 변환하여 삽입
        const lines = verseText.split('\n');
        lines.forEach((line, idx) => {
          if (line.trim()) {
            const textNode = document.createTextNode(line);
            range.insertNode(textNode);
            if (idx < lines.length - 1) {
              const br = document.createElement('br');
              range.insertNode(br);
            }
          } else if (idx < lines.length - 1) {
            const br = document.createElement('br');
            range.insertNode(br);
          }
        });
        
        // 커서를 삽입된 텍스트 뒤로 이동
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // 선택 영역이 없으면 끝에 추가
        const lines = verseText.split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            body.innerHTML += line + '<br>';
          } else {
            body.innerHTML += '<br>';
          }
        });
      }
      body.focus();
    } else {
      // 텍스트 영역 모드
      const start = body.selectionStart || 0;
      const end = body.selectionEnd || 0;
      const text = body.value;
      body.value = text.substring(0, start) + verseText + text.substring(end);
      body.focus();
      body.setSelectionRange(start + verseText.length, start + verseText.length);
    }
  });
}

/* ✅ 기존 모달 기반 설교 시스템은 제거됨 - openSermonEditorDirectly 사용 */
el('closeModal').onclick = ()=>{ 
  // display를 먼저 none으로 설정한 후 aria-hidden을 true로 설정 (접근성 개선)
  modalWrap.style.display='none'; 
  // 모달이 실제로 닫힌 후에만 aria-hidden을 true로 설정
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'none') {
      modalWrap.setAttribute('aria-hidden','true');
    }
  });
  stopEditorSpeak(true); 
};

function openSingleDocEditor(kind){
  if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
    if (!syncCurrentFromOpen()) { alert('단락을 먼저 선택해 주세요.'); return; }
  }
  if (!BIBLE) { alert('성경 데이터가 로드되지 않았습니다.'); return; }

  const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
  const pid  = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;

  const titlePrefix =
    kind==='unit'       ? '단위성경속 맥락' :
    kind==='whole'      ? '전체성경속 맥락' :
    kind==='commentary' ? '주석' :
                           '내용요약';

  const key =
    kind==='unit'       ? STORAGE_UNIT_CTX :
    kind==='whole'      ? STORAGE_WHOLE_CTX :
    kind==='commentary' ? STORAGE_COMMENTARY :
                           STORAGE_SUMMARY;

  const map = getDocMap(key);
  const doc = map[pid] || {
    body:  (kind==='summary' ? '핵심 내용을 간결하게 요약해 적어주세요.' : ''),
    images: [], date:''
  };
  modalRef.textContent = `${CURRENT.book} ${CURRENT.chap}장 · ${para.title||para.ref} (${para.ref}) — ${titlePrefix}`;
  sermonList.innerHTML = '';
  sermonEditor.style.display = '';
  sermonEditor.classList.add('context-editor');
  // aria-hidden을 먼저 false로 설정한 후 display를 변경 (접근성 개선)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = 'none';
  // 플로팅 툴바는 단락성경 편집기 내부에서 사용 가능하도록 유지

  sermonTitle.value = doc.title || '';
  setBodyHTML(doc.body || '');

  sermonEditor.dataset.editing = '';
  sermonEditor.dataset.ctxType = kind;
  
  // 모달이 열린 후 포커스를 모달 내부로 이동 (접근성 개선)
  // aria-hidden이 확실히 적용된 후 포커스를 설정
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'flex') {
      modalWrap.setAttribute('aria-hidden','false');
      setTimeout(() => {
        const firstFocusable = modalWrap.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }, 0);
    }
  });

  const aiBtn = document.getElementById('aiFill');
  if (aiBtn) {
    aiBtn.style.display = (kind === 'unit') ? '' : 'none';
    aiBtn.onclick = null;
    if (kind === 'unit') {
      aiBtn.onclick = async ()=>{ /* 선택: AI 핸들러 */ };
    }
  }
}

function openBookDocEditor(mode, book){
  if (!book) {
    alert('책 정보를 찾을 수 없습니다. 다시 시도해 주세요.');
    return;
  }

  const titlePrefix =
    mode === 'basic'   ? '기본이해' :
    mode === 'struct'  ? '내용구조' :
                         '메세지요약';

  const key =
    mode === 'basic'   ? STORAGE_BOOK_BASIC :
    mode === 'struct'  ? STORAGE_BOOK_STRUCT :
                         STORAGE_BOOK_SUMMARY;

  const map = getDocMap(key);
  const doc = map[book] || {
    title: '',
    body:
      mode === 'basic'
        ? '이 책의 역사적·배경적·신학적 기본 이해를 정리해 주세요.'
      : mode === 'struct'
        ? '이 책의 큰 구조(단락 흐름, 핵심 주제)를 정리해 주세요.'
        : '이 책의 핵심 메시지와 적용 포인트를 간결하게 요약해 주세요.',
    images: [],
    date: ''
  };

  // 🔹 모달/에디터 UI 세팅 (내용흐름 에디터와 동일한 스타일)
  modalRef.textContent = `${book} — ${titlePrefix}`;
  sermonList.innerHTML = '';
  sermonEditor.style.display = '';
  sermonEditor.classList.add('context-editor');
  // aria-hidden을 먼저 false로 설정한 후 display를 변경 (접근성 개선)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = 'none';
  // 플로팅 툴바는 편집기 내부 선택 시 표시되도록 유지
  // (초기 상태만 숨김, 나중에 텍스트 선택하면 표시됨)
  if (window.__hideFloatingToolbar) window.__hideFloatingToolbar();

  sermonTitle.value = doc.title || '';
  
  // 모달이 열린 후 포커스를 모달 내부로 이동 (접근성 개선)
  // aria-hidden이 확실히 적용된 후 포커스를 설정
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'flex') {
      modalWrap.setAttribute('aria-hidden','false');
      setTimeout(() => {
        const firstFocusable = modalWrap.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }, 0);
    }
  });
  setBodyHTML(doc.body || '');

  // 🔹 저장 구분용 메타데이터
  sermonEditor.dataset.editing = '';
  sermonEditor.dataset.ctxType  = `book-${mode}`; // book-basic / book-struct / book-summary
  sermonEditor.dataset.bookName = book;

  // 🔹 AI 버튼은 책 단위에서는 사용 안 함
  const aiBtn = document.getElementById('aiFill');
  if (aiBtn) {
    aiBtn.style.display = 'none';
    aiBtn.onclick = null;
  }
}

/* ✅ 설교목록 렌더링 (localStorage에서 설교목록 정보 가져와서 표시) */
function renderSermonList(){
  // CURRENT.paraId가 없으면 설정 시도
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      sermonList.innerHTML = '<div class="muted" style="padding:14px">단락을 먼저 선택해 주세요.</div>';
      return;
    }
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (para) {
      CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
    }
  }
  
  if (!CURRENT.paraId) {
    sermonList.innerHTML = '<div class="muted" style="padding:14px">단락 정보를 찾을 수 없습니다.</div>';
    return;
  }
  
  // localStorage에서 설교목록 정보 가져오기
  let arr = [];
  try {
    const map = getSermonMap(); // localStorage에서 직접 가져옴
    
    // 데이터 유효성 검사
    if (!map || typeof map !== 'object') {
      console.warn('[renderSermonList] localStorage에서 설교 맵을 가져올 수 없습니다. 빈 객체로 초기화합니다.');
      sermonList.innerHTML = '<div class="muted" style="padding:14px">설교가 없습니다. "새 설교목록" 버튼을 눌러 설교를 작성하세요.</div>';
      return;
    }
    
    // CURRENT.paraId로 설교 배열 가져오기 (localStorage에서 직접 가져옴)
    arr = Array.isArray(map[CURRENT.paraId]) ? map[CURRENT.paraId] : [];
    
    console.log('[renderSermonList] localStorage에서 가져온 설교목록 - paraId:', CURRENT.paraId, '설교 개수:', arr.length);
    
    sermonList.innerHTML = '';

    // 설교가 없으면 없는 것으로 표시
    if(arr.length === 0){
      sermonList.innerHTML = '<div class="muted" style="padding:14px">설교가 없습니다. "새 설교목록" 버튼을 눌러 설교를 작성하세요.</div>';
      return;
    }
  } catch (e) {
    console.error('[renderSermonList] localStorage에서 설교목록을 가져오는 중 오류 발생:', e);
    sermonList.innerHTML = '<div class="muted" style="padding:14px">설교 데이터를 불러올 수 없습니다.</div>';
    return;
  }

  // localStorage에서 가져온 설교목록 표시
  arr.forEach((it, idx)=>{
    // 카드 형태의 컨테이너
    const card = document.createElement('div');
    card.className = 'sermon-card';
    card.style.cssText = 'padding: 16px; margin-bottom: 12px; border: 1px solid var(--border, #ddd); border-radius: 8px; background: var(--panel, #1a1d29);';

    // 헤더 영역 (제목, 날짜, 버튼)
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px;';

    // 제목과 날짜 영역
    const titleDateArea = document.createElement('div');
    titleDateArea.style.cssText = 'flex: 1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; font-size: 16px; margin-bottom: 4px; color: #ffd700;'; // 밝은 노란색
    title.textContent = (it.title || '(제목 없음)');

    titleDateArea.appendChild(title);

    // 버튼 영역
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // 설교삭제 버튼
    const btnDelete = document.createElement('button');
    btnDelete.textContent = '삭제';
    btnDelete.className = 'sermon-delete-btn';
    btnDelete.style.cssText = 'padding: 6px 16px; font-size: 13px; white-space: nowrap; border: 1px solid var(--danger, #ff6b6b); color: var(--danger, #ff6b6b); background: transparent; border-radius: 4px; cursor: pointer;';
    btnDelete.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(!confirm(`"${it.title || '(제목 없음)'}" 설교를 삭제할까요?`)) return;
      const m = getSermonMap();
      const a = m[CURRENT.paraId] || [];
      a.splice(idx, 1);
      m[CURRENT.paraId] = a;
      setSermonMap(m);
      renderSermonList();
      status('설교가 삭제되었습니다.');
    });

    // 설교보기 버튼
    const btnView = document.createElement('button');
    btnView.textContent = '설교보기';
    btnView.className = 'sermon-view-btn';
    
    // 설교 내용이 채워져 있는지 확인
    const hasContent = (it.body && it.body.trim().replace(/<[^>]*>/g, '').trim()) || 
                      (it.title && it.title.trim() && it.title !== '(제목 없음)');
    
    // 내용이 있으면 filled 스타일 적용
    if (hasContent) {
      btnView.classList.add('filled');
      btnView.style.cssText = 'padding: 6px 16px; font-size: 13px; white-space: nowrap; background: #ff8c00; border-color: #ffa94d; color: #fff; border-width: 1px; box-shadow: 0 0 6px rgba(0,0,0,0.25);';
    } else {
      btnView.style.cssText = 'padding: 6px 16px; font-size: 13px; white-space: nowrap;';
    }
    
    btnView.addEventListener('click', ()=>{
      openSermonEditorDirectly(idx);
    });

    buttonArea.appendChild(btnDelete);
    buttonArea.appendChild(btnView);

    header.appendChild(titleDateArea);
    header.appendChild(buttonArea);

    // 메타 정보 영역 (본문, 초점, 키워드, 적용대상)
    const metaArea = document.createElement('div');
    metaArea.style.cssText = 'margin-bottom: 12px; padding: 10px; background: var(--bg, #0f1115); border-radius: 4px; border: 1px solid var(--border, #252a36); font-size: 13px;';
    
    const metaItems = [];
    
    // 본문 내용 (HTML이 있으면 표시)
    if (it.body && it.body.trim()) {
      // 성경위치정보 생성
      let locationText = '';
      if (CURRENT.paraId) {
        const [book, chap, ref] = CURRENT.paraId.split('|');
        if (book && chap) {
          locationText = `${book} ${chap}장 ${ref || ''}`;
        }
      }
      
      const bodyItem = document.createElement('div');
      bodyItem.style.cssText = 'margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border, #252a36);';
      bodyItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">본문:</span> <span style="color: var(--muted, #9aa0ab); margin-left: 4px;">${escapeHtml(locationText)}</span>`;
      metaItems.push(bodyItem);
    }
    
    if (it.focus && it.focus.trim()) {
      const focusItem = document.createElement('div');
      focusItem.style.cssText = 'margin-bottom: 6px;';
      focusItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">초점:</span> <span style="color: var(--text, #e6e8ef);">${escapeHtml(it.focus)}</span>`;
      metaItems.push(focusItem);
    }
    
    if (it.keywords && it.keywords.trim()) {
      const keywordsItem = document.createElement('div');
      keywordsItem.style.cssText = 'margin-bottom: 6px;';
      const keywordsList = it.keywords.split(',').map(k => k.trim()).filter(k => k).join(', ');
      keywordsItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">키워드:</span> <span style="color: var(--text, #e6e8ef);">${escapeHtml(keywordsList)}</span>`;
      metaItems.push(keywordsItem);
    }
    
    if (it.target && it.target.trim()) {
      const targetItem = document.createElement('div');
      targetItem.style.cssText = 'margin-bottom: 0;';
      targetItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">적용대상:</span> <span style="color: var(--text, #e6e8ef);">${escapeHtml(it.target)}</span>`;
      metaItems.push(targetItem);
    }
    
    if (metaItems.length > 0) {
      metaItems.forEach(item => metaArea.appendChild(item));
    }

    // 링크 영역
    const linkArea = document.createElement('div');
    if (it.link && it.link.trim()) {
      linkArea.style.cssText = 'margin-bottom: 8px;';
      const linkEl = document.createElement('a');
      linkEl.href = it.link;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.style.cssText = 'font-size: 13px; color: var(--accent, #1677ff); text-decoration: none; word-break: break-all;';
      linkEl.textContent = it.link;
      linkEl.title = it.link;
      linkArea.appendChild(linkEl);
    }

    // 이미지 영역
    const imageArea = document.createElement('div');
    if (it.images && it.images.length > 0) {
      imageArea.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;';
      it.images.forEach((img, imgIdx) => {
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border, #ddd);';
        
        const imgEl = document.createElement('img');
        imgEl.src = img.url || img;
        imgEl.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        imgEl.alt = img.alt || `이미지 ${imgIdx + 1}`;
        imgEl.onerror = () => {
          imgEl.style.display = 'none';
          imgContainer.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;">이미지 없음</div>';
        };
        
        imgContainer.appendChild(imgEl);
        imageArea.appendChild(imgContainer);
      });
    }

    // 모든 요소를 카드에 추가
    const previewArea = document.createElement('div');
    const previewText = htmlToPlainText(it.body || '');
    if (previewText) {
      previewArea.style.cssText = 'margin-top: 10px; padding: 12px; border: 1px solid var(--border, #252a36); border-radius: 6px; background: color-mix(in srgb, var(--panel, #161922) 88%, #000 12%); font-size: 13px; line-height: 1.7; white-space: pre-wrap;';
      const previewBody = document.createElement('div');
      const shortText = previewText.slice(0, SERMON_PREVIEW_CHAR_LIMIT);
      previewBody.textContent = previewText.length > SERMON_PREVIEW_CHAR_LIMIT ? `${shortText}...` : previewText;
      previewArea.appendChild(previewBody);
      if (previewText.length > SERMON_PREVIEW_CHAR_LIMIT) {
        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'chip';
        moreBtn.style.marginTop = '10px';
        moreBtn.textContent = '더 보기';
        moreBtn.addEventListener('click', ()=>{
          const expanded = moreBtn.dataset.expanded === '1';
          previewBody.textContent = expanded ? `${shortText}...` : previewText;
          moreBtn.dataset.expanded = expanded ? '0' : '1';
          moreBtn.textContent = expanded ? '더 보기' : '접기';
        });
        previewArea.appendChild(moreBtn);
      }
    }

    card.appendChild(header);
    if (metaArea.hasChildNodes()) card.appendChild(metaArea);
    if (linkArea.hasChildNodes()) card.appendChild(linkArea);
    if (imageArea.hasChildNodes()) card.appendChild(imageArea);
    if (previewArea.hasChildNodes()) card.appendChild(previewArea);

    sermonList.appendChild(card);
  });
}

/* ✅ 설교목록 저장 버튼 */
el('saveSermonListBtn').onclick = () => {
  // CURRENT.paraId 확인 및 설정
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      alert('단락을 먼저 선택해 주세요.');
      return;
    }
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (!para) {
      alert('단락을 찾을 수 없습니다.');
      return;
    }
    CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  }
  
  // 현재 설교 목록 가져오기 (현재 보이고 있는 설교목록)
  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  
  if (arr.length === 0) {
    alert('저장할 설교가 없습니다.');
    return;
  }
  
  // 저장 전 디버깅
  console.log('[saveSermonListBtn] 저장 전 - paraId:', CURRENT.paraId, '설교 개수:', arr.length);
  
  // 저장 시도
  const saved = setSermonMap(map, true); // 즉시 저장
  
  if (!saved) {
    console.error('[saveSermonListBtn] 설교 저장 실패');
    alert('설교 저장에 실패했습니다. 다시 시도해 주세요.');
    return;
  }
  
  // 저장 후 검증: localStorage에서 실제로 저장되었는지 확인
  const verifyMap = getSermonMap();
  const verifyArr = verifyMap[CURRENT.paraId] || [];
  console.log('[saveSermonListBtn] 저장 후 검증 - paraId:', CURRENT.paraId, '저장된 설교 개수:', verifyArr.length);
  
  if (verifyArr.length === 0) {
    console.error('[saveSermonListBtn] 저장 검증 실패: 설교가 저장되지 않았습니다.');
    alert('설교 저장에 실패했습니다. 다시 시도해 주세요.');
    return;
  }
  
  // 저장 성공
  status(`${arr.length}개의 설교가 저장되었습니다.`);
  
  // 저장 성공 시각적 피드백
  const btn = el('saveSermonListBtn');
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '저장됨 ✓';
    btn.style.opacity = '0.7';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.opacity = '1';
    }, 2000);
  }
};

/* ✅ 새 설교목록 버튼 - 설교 정보 입력 */
function bindNewSermonBtn() {
  const newSermonBtn = el('newSermonBtn');
  if (!newSermonBtn) return;
  
  // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
  const newBtn = newSermonBtn.cloneNode(true);
  newSermonBtn.parentNode?.replaceChild(newBtn, newSermonBtn);
  
  newBtn.onclick = ()=>{
    if (!CURRENT.paraId) {
      if (!syncCurrentFromOpen()) { 
        alert('단락을 먼저 선택하세요.'); 
        return; 
      }
      const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
      if (!para) {
        alert('단락을 찾을 수 없습니다.');
        return;
      }
      CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
    }
    
    // 설교 정보 입력 모달 열기
    openSermonInputModal();
  };
}

// 초기 바인딩 (DOM이 준비된 후)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindNewSermonBtn);
} else {
  bindNewSermonBtn();
}

/* ✅ 설교 정보 입력 모달 - 텍스트 파싱 방식 */
function openSermonInputModal(){
  // CURRENT.paraId 확인 및 설정
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      alert('단락을 먼저 선택해 주세요.');
      return;
    }
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (!para) {
      alert('단락을 찾을 수 없습니다.');
      return;
    }
    CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  }
  
  // 기존 모달 내용 숨기기
  sermonList.innerHTML = '';
  sermonEditor.style.display = 'none';
  
  // 입력 영역 생성
  const inputArea = document.createElement('div');
  inputArea.style.cssText = 'padding: 20px;';
  inputArea.innerHTML = `
    <div style="margin-bottom: 12px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text, #e6e8ef);">설교 정보 입력</label>
      <div style="font-size: 12px; color: var(--text-muted, #9aa0ab); margin-bottom: 8px; padding: 8px; background: var(--bg, #0f1115); border-radius: 4px; line-height: 1.6;">
        형식: 번호와 "설교 제목:" 또는 번호만으로 시작, 그 다음 "본문:", "초점:", "키워드:", "적용 대상:" 라벨로 정보 입력<br/>
        여러 설교를 한 번에 입력 가능합니다.<br/>
        예:<br/>
        1. 설교 제목: "태초에 하나님이" – 신앙의 첫 문장<br/>
        본문: 창 1:1–5<br/>
        초점: "태초에(베레쉬트)"와 "하나님(엘로힘)"으로 시작하는 신앙의 방향 전환<br/>
        키워드: 하나님 중심 세계관, 인생의 시작점 재정립<br/>
        적용 대상: 전 교인, 신앙 기초 재정비 시
      </div>
      <textarea id="newSermonText" 
        placeholder="설교 정보를 입력하세요 (여러 설교를 한 번에 입력 가능)&#10;&#10;예:&#10;1. 설교 제목: &quot;태초에 하나님이&quot; – 신앙의 첫 문장&#10;본문: 창 1:1–5&#10;초점: 태초에와 하나님으로 시작하는 신앙의 방향 전환&#10;키워드: 하나님 중심 세계관, 인생의 시작점 재정립&#10;적용 대상: 전 교인"
        style="width: 100%; min-height: 300px; padding: 12px; border: 1px solid var(--border, #252a36); border-radius: 4px; background: var(--bg, #0f1115); color: var(--text, #e6e8ef); font-size: 14px; resize: vertical; font-family: inherit; line-height: 1.6;"></textarea>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="cancelSermonInput" style="padding: 8px 16px; border: 1px solid var(--border, #252a36); border-radius: 4px; background: var(--bg, #0f1115); color: var(--text, #e6e8ef); cursor: pointer;">취소</button>
      <button id="saveSermonInput" class="primary" style="padding: 8px 16px; border-radius: 4px; cursor: pointer;">저장</button>
    </div>
  `;
  
  sermonList.appendChild(inputArea);
  
  // 취소 버튼
  document.getElementById('cancelSermonInput').onclick = () => {
    renderSermonList();
  };
  
  // 저장 버튼
  document.getElementById('saveSermonInput').onclick = () => {
    const text = (document.getElementById('newSermonText').value || '').trim();
    
    if (!text) {
      alert('설교 정보를 입력해주세요.');
      return;
    }
    
    // 텍스트 파싱 (여러 설교 지원)
    const sermons = parseSermonText(text);
    
    if (sermons.length === 0) {
      alert('설교 정보를 올바르게 입력해주세요.');
      return;
    }
    
    // 설교 생성
    const map = getSermonMap();
    const arr = map[CURRENT.paraId] || [];
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    
    // 파싱된 모든 설교 추가
    sermons.forEach(sermon => {
      if (sermon.title) {
        const newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random() + Math.random());
        arr.unshift({ 
          id: newId, 
          title: sermon.title, 
          body: sermon.body, 
          images: [], 
          date: date, 
          link: '',
          focus: sermon.focus,
          keywords: sermon.keywords,
          target: sermon.target
        });
      }
    });
    
    map[CURRENT.paraId] = arr;
    
    // 저장 전 디버깅
    console.log('[saveSermonInput] 저장 전 - paraId:', CURRENT.paraId, '설교 개수:', arr.length);
    
    const saved = setSermonMap(map, true); // 즉시 저장
    
    // 저장 확인
    if (!saved) {
      console.error('[saveSermonInput] 설교 저장 실패');
      alert('설교 저장에 실패했습니다. 다시 시도해 주세요.');
      return;
    }
    
    // 저장 후 검증: localStorage에서 실제로 저장되었는지 확인
    const verifyMap = getSermonMap();
    const verifyArr = verifyMap[CURRENT.paraId] || [];
    console.log('[saveSermonInput] 저장 후 검증 - paraId:', CURRENT.paraId, '저장된 설교 개수:', verifyArr.length);
    
    if (verifyArr.length === 0) {
      console.error('[saveSermonInput] 저장 검증 실패: 설교가 저장되지 않았습니다.');
      alert('설교 저장에 실패했습니다. 다시 시도해 주세요.');
      return;
    }
    
    // 입력 영역 제거 후 설교목록 렌더링
    sermonList.innerHTML = '';
    renderSermonList();
    status(`${sermons.length}개의 설교가 저장되었습니다.`);
  };
  
  // 포커스
  setTimeout(() => {
    const textInput = document.getElementById('newSermonText');
    if (textInput) textInput.focus();
  }, 0);
}

/* ✅ 텍스트에서 설교 정보 파싱 (여러 설교 지원) */
function parseSermonText(text) {
  const lines = text.split('\n').map(line => line.trim());
  const sermons = [];
  
  let currentSermon = null;
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // 새 설교 시작 (번호로 시작)
    if (line.match(/^\d+[\.\)]/)) {
      // 이전 설교 저장
      if (currentSermon && currentSermon.title) {
        sermons.push(currentSermon);
      }
      
      // 새 설교 시작
      currentSermon = {
        title: '',
        body: '',
        focus: '',
        keywords: '',
        target: ''
      };
      currentSection = null;
      
      // "설교 제목:"이 있는 경우
      if (line.match(/설교\s*제목\s*[:：]/i)) {
        let titleText = line.replace(/^\d+[\.\)]\s*설교\s*제목\s*[:：]/i, '').trim();
        // 따옴표 제거
        titleText = titleText.replace(/^["'"]|["'"]$/g, '');
        currentSermon.title = titleText;
      } else {
        // 번호만 있고 "설교 제목:"이 없는 경우, 번호 제거하고 나머지를 제목으로
        let titleText = line.replace(/^\d+[\.\)]\s*/, '').trim();
        // 따옴표 제거
        titleText = titleText.replace(/^["'"]|["'"]$/g, '');
        currentSermon.title = titleText;
      }
      continue;
    }
    
    // "설교 제목:"으로 시작하는 경우 (번호 없이)
    if (line.match(/^설교\s*제목\s*[:：]/i)) {
      // 이전 설교 저장
      if (currentSermon && currentSermon.title) {
        sermons.push(currentSermon);
      }
      
      // 새 설교 시작
      currentSermon = {
        title: '',
        body: '',
        focus: '',
        keywords: '',
        target: ''
      };
      currentSection = null;
      
      let titleText = line.replace(/^설교\s*제목\s*[:：]/i, '').trim();
      // 따옴표 제거
      titleText = titleText.replace(/^["'"]|["'"]$/g, '');
      currentSermon.title = titleText;
      continue;
    }
    
    // currentSermon이 없으면 건너뛰기
    if (!currentSermon) continue;
    
    // 본문 라벨 체크
    if (line.match(/^본문\s*[:：]/i) || line.match(/^body\s*[:：]/i)) {
      currentSection = 'body';
      currentSermon.body = line.replace(/^본문\s*[:：]|^body\s*[:：]/i, '').trim();
      continue;
    }
    
    // 초점 라벨 체크
    if (line.match(/^초점\s*[:：]/i) || line.match(/^focus\s*[:：]/i)) {
      currentSection = 'focus';
      currentSermon.focus = line.replace(/^초점\s*[:：]|^focus\s*[:：]/i, '').trim();
      continue;
    }
    
    // 키워드 라벨 체크
    if (line.match(/^키워드\s*[:：]/i) || line.match(/^keywords?\s*[:：]/i)) {
      currentSection = 'keywords';
      currentSermon.keywords = line.replace(/^키워드\s*[:：]|^keywords?\s*[:：]/i, '').trim();
      continue;
    }
    
    // 적용 대상 라벨 체크
    if (line.match(/^적용\s*대상\s*[:：]/i) || line.match(/^적용대상\s*[:：]/i) || line.match(/^target\s*[:：]/i)) {
      currentSection = 'target';
      currentSermon.target = line.replace(/^적용\s*대상\s*[:：]|^적용대상\s*[:：]|^target\s*[:：]/i, '').trim();
      continue;
    }
    
    // 로마 숫자 섹션 (Ⅱ. 같은 것)은 무시
    if (line.match(/^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+[\.\)]/)) {
      continue;
    }
    
    // 현재 섹션에 따라 내용 추가
    if (currentSection === 'body') {
      currentSermon.body += (currentSermon.body ? '\n' : '') + line;
    } else if (currentSection === 'focus') {
      currentSermon.focus += (currentSermon.focus ? ' ' : '') + line;
    } else if (currentSection === 'keywords') {
      currentSermon.keywords += (currentSermon.keywords ? ' ' : '') + line;
    } else if (currentSection === 'target') {
      currentSermon.target += (currentSermon.target ? ' ' : '') + line;
    } else if (!currentSermon.title) {
      // 섹션이 정해지지 않았고 제목도 없으면 제목으로
      currentSermon.title = line;
    } else {
      // 섹션이 정해지지 않았으면 본문으로
      currentSermon.body += (currentSermon.body ? '\n' : '') + line;
    }
  }
  
  // 마지막 설교 저장
  if (currentSermon && currentSermon.title) {
    sermons.push(currentSermon);
  }
  
  return sermons;
}

el('cancelEdit')?.addEventListener('click', ()=>{
  if(sermonEditor.dataset.ctxType){
    sermonEditor.dataset.ctxType = '';
    modalWrap.style.display = 'none'; 
    // 모달이 실제로 닫힌 후에만 aria-hidden을 true로 설정
    requestAnimationFrame(() => {
      if (modalWrap.style.display === 'none') {
        modalWrap.setAttribute('aria-hidden','true');
      }
    });
  }else{
    // 설교 편집기인 경우 설교목록으로 돌아가기
    sermonEditor.style.display = 'none';
    renderSermonList();
  }
  stopEditorSpeak(true);
});

el('saveSermon').onclick = () => {
  const title = (sermonTitle.value || '').trim() || '(제목 없음)';
  let body = getBodyHTML() || '';
  body = body.replace(/^\s+|\s+$/g, '');

  // 메타 필드 값 가져오기 (필드가 숨겨져 있으면 기존 값 유지)
  const focusEl = document.getElementById('sermonFocus');
  const keywordsEl = document.getElementById('sermonKeywords');
  const targetEl = document.getElementById('sermonTarget');
  
  // 편집 모드인지 확인
  const editing = sermonEditor.dataset.editing;
  let focus = '';
  let keywords = '';
  let target = '';
  
  if (editing !== '' && CURRENT.paraId) {
    // 편집 모드: 기존 값 유지
    const map = getSermonMap();
    const arr = map[CURRENT.paraId] || [];
    const i = +editing;
    const existingSermon = arr[i];
    if (existingSermon) {
      focus = existingSermon.focus || '';
      keywords = existingSermon.keywords || '';
      target = existingSermon.target || '';
    }
  }
  
  // 메타 필드가 표시되어 있으면 입력된 값 사용
  if (focusEl && focusEl.offsetParent !== null) {
    focus = (focusEl.value || '').trim();
  }
  if (keywordsEl && keywordsEl.offsetParent !== null) {
    keywords = (keywordsEl.value || '').trim();
  }
  if (targetEl && targetEl.offsetParent !== null) {
    target = (targetEl.value || '').trim();
  }

  const imgs = [];
  const now  = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const ctxType = sermonEditor.dataset.ctxType || '';

  // ===============================
  // 1) 책 단위 에디터 (기본이해 / 내용구조 / 메세지요약)
  //    ctxType: book-basic / book-struct / book-summary
  // ===============================
  if (ctxType && ctxType.startsWith('book-')) {
    const bookName = sermonEditor.dataset.bookName;
    if (!bookName) {
      alert('책 정보를 찾을 수 없습니다.(bookName 누락)');
      return;
    }

    // 어떤 저장소에 넣을지 결정
    const storeKey =
      ctxType === 'book-basic'  ? STORAGE_BOOK_BASIC  :
      ctxType === 'book-struct' ? STORAGE_BOOK_STRUCT :
                                  STORAGE_BOOK_SUMMARY; // book-summary

    const map = getDocMap(storeKey);
    map[bookName] = { title, body, images: imgs, date };
    setDocMap(storeKey, map);

    // 책 단위는 편집기를 닫지 않고 유지
    status(`저장됨(책 ${bookName} · ${title})`);
    return;
  }

  // ===============================
  // 2) 단락 컨텍스트 에디터 (단위성경속 맥락 / 전체성경속 맥락 / 주석 / 내용요약)
  //    ctxType: unit / whole / commentary / summary
  // ===============================
  if (ctxType) {
    if (!BIBLE || !CURRENT || CURRENT.book == null ||
        !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
      alert('단락 정보를 찾을 수 없습니다. 먼저 단락을 선택해 주세요.');
      return;
    }

    const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
    if (!para) {
      alert('선택한 단락을 찾을 수 없습니다.');
      return;
    }

    const pid = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;

    const key =
      ctxType === 'unit'       ? STORAGE_UNIT_CTX :
      ctxType === 'whole'      ? STORAGE_WHOLE_CTX :
      ctxType === 'commentary' ? STORAGE_COMMENTARY :
                                 STORAGE_SUMMARY; // 단락 내용요약

    const map = getDocMap(key);
    map[pid] = { title, body, images: imgs, date };
    setDocMap(key, map);

    sermonEditor.dataset.ctxType = '';
    sermonEditor.classList.remove('context-editor');
    modalWrap.style.display = 'none';
    // 모달이 실제로 닫힌 후에만 aria-hidden을 true로 설정
    requestAnimationFrame(() => {
      if (modalWrap.style.display === 'none') {
        modalWrap.setAttribute('aria-hidden', 'true');
      }
    });
    status(`저장됨: ${title}`);
    return;
  }

  // ===============================
  // 3) 일반 설교(단락에 붙는 설교 리스트) 저장
  // ===============================
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      alert('단락을 먼저 선택해 주세요.');
      return;
    }
    const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
    CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  }

  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  // editing 변수는 위에서 이미 선언됨 (2872번 줄)

  if (editing !== '') {
    const i = +editing;
    if (arr[i]) {
      arr[i] = { ...arr[i], title, body, images: imgs, date, focus, keywords, target };
    }
  } else {
    arr.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title,
      body,
      images: imgs,
      date,
      link: '',
      focus,
      keywords,
      target
    });
  }

  map[CURRENT.paraId] = arr;
  const saved = setSermonMap(map, true); // 즉시 저장
  
  // 저장 확인
  if (!saved) {
    console.error('설교 저장 실패');
    alert('설교 저장에 실패했습니다. 다시 시도해 주세요.');
    return;
  }

  // 설교목록이 표시되어 있으면 목록으로 돌아가기, 아니면 편집기 유지
  const hasSermonList = sermonList.innerHTML.trim() !== '';
  const isEditorHidden = sermonEditor.style.display === 'none';
  
  // 저장 후 설교목록 갱신 (저장된 내용이 반영되도록)
  if (hasSermonList && isEditorHidden) {
    // 설교목록 모달이 열려있는 경우 - 목록으로 돌아가기
    sermonEditor.style.display = 'none';
    renderSermonList(); // 저장된 내용을 다시 불러와서 표시
  } else {
    // 설교보기 화면에서 직접 저장한 경우 - 편집기 유지
    // 편집 모드 업데이트 (새 설교가 추가된 경우)
    if (editing === '') {
      // 새 설교가 추가되었으므로 첫 번째 설교로 편집 모드 설정
      sermonEditor.dataset.editing = '0';
    }
    // 저장 후에도 편집기 유지
    sermonEditor.style.display = '';
    // 설교목록이 숨겨져 있어도 저장은 완료되었으므로, 나중에 목록을 열면 저장된 내용이 보임
  }
  
  status('설교가 저장되었습니다.');
};

/* ===== RTE 유틸 ===== */
function isRTE(){ return sermonBody && sermonBody.getAttribute('contenteditable') === 'true'; }
function getBodyHTML(){ return isRTE() ? sermonBody.innerHTML : (sermonBody.value || ''); }
function setBodyHTML(html){ if(isRTE()) sermonBody.innerHTML = html || ''; else sermonBody.value = html || ''; }

function applyColorImmediateToRTE(hex){
  if(!isRTE()) return;
  const sel = window.getSelection();
  if(!sel || sel.rangeCount===0){ sermonBody.focus(); return; }
  const range = sel.getRangeAt(0);
  if(!sermonBody.contains(range.commonAncestorContainer)){ sermonBody.focus(); return; }

  if(range.collapsed){
    const sp = document.createElement('span');
    sp.style.color = hex;
    sp.appendChild(document.createTextNode('\u200B'));
    range.insertNode(sp);
    sel.removeAllRanges();
    const r = document.createRange();
    r.setStart(sp.firstChild, 1); r.collapse(true);
    sel.addRange(r);
    return;
  }
  document.execCommand('foreColor', false, hex);
}
function execFmt(cmd){
  if(isRTE()){
    sermonBody.focus({preventScroll:true});
    document.execCommand(cmd,false,null);
  }
}

/* --------- Editor TTS --------- */
editorSpeakBtn.onclick = ()=> toggleEditorSpeak();

// 문장 단위 낭독을 위한 상태
let EDITOR_TTS = {
  sents: [],
  idx: 0,
  playing: false,
  synth: window.speechSynthesis || null,
  utter: null
};

// HTML을 일반 텍스트로 변환
function htmlToPlainText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  tmp.querySelectorAll('sup').forEach(s => s.textContent = '[' + s.textContent + '] ');
  return (tmp.textContent || '').replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n').replace(/\s+/g, ' ').trim();
}

// 문장 분할 (한국어/영문 종결부호 기준)
function splitToSentences(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  // 마침표, 물음표, 느낌표, 말줄임표, 한국어 종결(다.)도 일반 마침표로 처리
  const parts = t.split(/(?<=[\.!\?…]|[。！？])\s+/u).filter(s => s && s.trim().length > 0);
  return parts;
}

function toggleEditorSpeak(){
  // speechSynthesis가 없으면 재시도
  if(!EDITOR_TTS.synth) {
    EDITOR_TTS.synth = window.speechSynthesis || null;
    if(!EDITOR_TTS.synth) return alert('이 브라우저는 음성합성을 지원하지 않습니다.');
  }
  
  // 재생 중인 경우 일시정지/재개 처리
  if(EDITOR_TTS.playing) {
    if(EDITOR_TTS.synth.speaking && !EDITOR_TTS.synth.paused) {
      // 일시정지
      EDITOR_TTS.synth.pause();
      editorSpeakBtn.textContent = '재개';
      return;
    } else if(EDITOR_TTS.synth.paused) {
      // 재개
      EDITOR_TTS.synth.resume();
      editorSpeakBtn.textContent = '일시정지';
      return;
    } else {
      // 재생 중이지만 speaking이 false인 경우 중지
      stopEditorSpeak();
      return;
    }
  }

  // 제목과 본문 가져오기
  const title = (sermonTitle.value || '').trim();
  const bodyHTML = getBodyHTML();
  const bodyPlain = htmlToPlainText(bodyHTML);
  const fullText = [title, bodyPlain].filter(Boolean).join('. ');
  
  if(!fullText){ 
    alert('낭독할 내용이 없습니다.'); 
    return; 
  }

  // 문장 단위로 분할
  EDITOR_TTS.sents = splitToSentences(fullText);
  if (EDITOR_TTS.sents.length === 0) {
    alert('낭독할 내용이 없습니다.');
    return;
  }

  EDITOR_TTS.idx = 0;
  EDITOR_TTS.playing = true;
  editorSpeakBtn.textContent = '일시정지';
  
  // 첫 문장부터 시작
  speakEditorSentence(0);
}

function speakEditorSentence(i) {
  if (!EDITOR_TTS.synth || !EDITOR_TTS.playing) return;
  if (i < 0 || i >= EDITOR_TTS.sents.length) {
    stopEditorSpeak(true);
    return;
  }

  EDITOR_TTS.idx = i;
  try { 
    EDITOR_TTS.synth.cancel(); 
  } catch(_) {}

  const u = new SpeechSynthesisUtterance(EDITOR_TTS.sents[i]);
  applyVoice(u);
  u.lang = 'ko-KR';
  
  u.onend = () => {
    if (!EDITOR_TTS.playing) return;
    const next = i + 1;
    if (next < EDITOR_TTS.sents.length) {
      speakEditorSentence(next);
    } else {
      stopEditorSpeak(true);
    }
  };
  
  u.onerror = () => {
    if (!EDITOR_TTS.playing) return;
    const next = i + 1;
    if (next < EDITOR_TTS.sents.length) {
      speakEditorSentence(next);
    } else {
      stopEditorSpeak(true);
    }
  };

  EDITOR_TTS.utter = u;
  EDITOR_TTS.synth.speak(u);
}

function stopEditorSpeak(silent){
  EDITOR_TTS.playing = false;
  if(EDITOR_TTS.synth){ 
    try{ 
      EDITOR_TTS.synth.cancel();
    } catch(e){} 
  }
  EDITOR_TTS.utter = null;
  EDITOR_TTS.sents = [];
  EDITOR_TTS.idx = 0;
  
  if(!silent) status('설교 낭독을 중지했습니다.'); 
  editorSpeakBtn.textContent = '낭독';
}

/* --------- Hotkeys --------- */
window.addEventListener('keydown', (e)=>{
  if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='s'){
    e.preventDefault();
    downloadBibleJSON();
    return;
  }
  if(e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  const key = e.key.toLowerCase();
  if(key === 's'){
    e.preventDefault();
    syncCurrentFromOpen();
    const openPara = treeEl.querySelector('details.para[open]');
    if(openPara && CURRENT.book!=null){
      const btn = openPara.querySelector('.speakBtn');
      toggleSpeakInline(CURRENT.book, CURRENT.chap, CURRENT.paraIdx, openPara, btn);
    }
    return;
  }
  if(key === 'n'){
    e.preventDefault();
    if(!syncCurrentFromOpen()) return;
    const wasPlaying = !!READER.playing;
    try{ READER.synth && READER.synth.cancel(); }catch(_){}
    if (READER._wd){ clearTimeout(READER._wd); READER._wd = null; }
    READER.playing = wasPlaying;
    const moved = goToNextParagraphInline(CURRENT.book, CURRENT.chap, CURRENT.paraIdx);
    if(!moved) return;
    if (wasPlaying){
      const cb = READER.scope?.querySelector?.('.keepReading');
      if(cb){ cb.checked = READER.continuous; cb.disabled = false; }
      READER.q   = buildQueueFrom(CURRENT.book, CURRENT.chap, CURRENT.paraIdx);
      READER.idx = 0;
      bindKeepReading(READER.scope);
      updateInlineSpeakBtn();
      setTimeout(()=>{ try{ READER.synth && READER.synth.cancel(); }catch(_){}
        playNextInQueueInline(CURRENT.book, CURRENT.chap, CURRENT.paraIdx);
      }, 120);
    }
  }
});

/* === 팝업 편집기 (스크립트 분리 버전) === */
function openSermonEditorWindow(idx){
  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  const it  = arr[idx];
  // 새 설교인 경우(idx가 0이고 빈 설교가 있는 경우) 허용
  if(!it && !(idx === 0 && arr.length > 0 && arr[0].id)){ 
    alert('편집할 설교를 찾을 수 없습니다.'); 
    return; 
  }

  const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
  const versesRaw = Array.isArray(para?.verses) ? para.verses : [];

  const meta = {
    paraId: CURRENT.paraId,
    idx,
    ref: `${CURRENT.book} ${CURRENT.chap}장 · ${(para?.title || para?.ref || '')} (${para?.ref || ''})`,
    title: it.title || '',
    body:  it.body  || '',
    date:  it.date || '',
    verses: versesRaw
  };

  const w = window.open('', '_blank', 'width=1100,height=820');
  if(!w){ alert('팝업이 차단되었습니다. 브라우저 팝업을 허용해주세요.'); return; }
  w.__WBPS_META__ = meta;
  if (w.opener && w.opener.firebase) { w.firebase = w.opener.firebase; }

  let popupHTML = String.raw`<!DOCTYPE html><html lang="ko">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>설교 편집</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&family=Nanum+Myeongjo&display=swap" rel="stylesheet">
<style>
:root{--bg:#0f1115;--panel:#161922;--text:#e6e8ef;--muted:#9aa0ab;--border:#252a36;--accent:#6ea8fe;--danger:#ff6b6b}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);display:grid;grid-template-rows:56px 1fr 56px;gap:8px}
header,footer{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--panel);border-bottom:1px solid var(--border)}
footer{border-top:1px solid var(--border);border-bottom:none}
.grow{flex:1 1 auto}
main{padding:0 12px 12px}

input[type="text"].title-input{
  width: min(90%, 720px);
  background:#161922;color:#e6e8ef;border:1px solid #2a3040;border-radius:8px;
  padding:10px 12px;font-weight:700;font-size:1.14rem;line-height:1.4;letter-spacing:.01em;
}

button{background:color-mix(in hsl,var(--panel) 65%,black 10%);color:var(--text);
border:1px solid var(--border);border-radius:10px;padding:6px 10px;cursor:pointer;transition:border-color .15s,transform .04s}
button:hover{border-color:color-mix(in hsl,var(--border) 75%,var(--accent) 25%)} button:active{transform:translateY(1px)}
.primary{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 78%,white 10%),color-mix(in srgb,var(--accent) 72%,black 22%));border-color:color-mix(in srgb,var(--accent) 70%,black 10%)}
.muted{color:var(--muted)}

.context-editor{font-family:"Noto Serif KR","Nanum Myeong고",serif;font-size:1.05rem;line-height:1.85;letter-spacing:.02em;word-break:keep-all}

.notion-header{display:flex;align-items:center;gap:8px;margin-top:8px}
.notion-header .title{flex:1 1 auto;background:#161922;color:#e6e8ef;border:1px solid #2a3040;border-radius:8px;padding:10px 12px;font-weight:700}
.notion-header .meta{display:flex;gap:8px;align-items:center}
.notion-badge{font-size:11px;color:#9aa0ab}

#editorRoot{max-width:880px;margin:12px auto 8px;padding:0 6px}
#editorRoot.speaking{background:color-mix(in hsl, var(--accent) 8%, black 0%) !important; border-left:3px solid var(--accent) !important; border-radius:8px; padding-left:8px !important}
#editorRoot .sentence-speaking{background:color-mix(in hsl, var(--accent) 30%, black 0%); border-radius:4px; padding:2px 0; font-weight:600; transition:background 0.2s; animation:pulse-sentence 2s ease-in-out infinite}
@keyframes pulse-sentence{ 0%, 100%{ background:color-mix(in hsl, var(--accent) 30%, black 0%) } 50%{ background:color-mix(in hsl, var(--accent) 40%, black 0%) } }

/* .bubble 스타일 제거됨 - 공통 플로팅 툴바 모듈 사용 */

/* 플로팅 서식툴바 스타일 (본문과 동일) */
#wbp-plbar{
  position: fixed; left:0; top:0;
  transform: translate(-50%, calc(-100% - 10px));
  background:#0f1320; border:1px solid var(--border);
  border-radius:10px; padding:6px;
  display:flex; gap:6px; align-items:center;
  box-shadow:0 8px 20px rgba(0,0,0,.35); z-index:9999;
}
#wbp-plbar[hidden]{ display:none; }
#wbp-plbar .divider{ width:1px; height:20px; background:var(--border); }
#wbp-plbar button{
  border:1px solid var(--border); background:#1f2533; color:#e6e8ef;
  padding:6px 8px; border-radius:8px; cursor:pointer; font-weight:700;
}
#wbp-plbar button:hover{ background:#273046; }
#wbp-plbar select{ background:#1f2533; color:#e6e8ef; border:1px solid var(--border); border-radius:6px; padding:4px 6px }

.slash{position:fixed;inset:auto auto 0 0;max-height:260px;overflow:auto;background:#1c1f2a;border:1px solid #333;border-radius:12px;min-width:260px;padding:6px}
.slash.hidden{display:none}
.slash .item{padding:6px 8px;border-radius:8px;display:flex;gap:8px;align-items:center}
.slash .item.active,.slash .item:hover{background:#2a2f3d}

.notion-footer{padding:6px 12px;border-top:1px solid #252a36;background:#161922;position:sticky;bottom:0}
#traceLog{font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;max-height:180px;overflow:auto;white-space:pre-wrap}

#floatingBar{
  position: fixed; right: 16px; bottom: 16px; z-index: 50;
  display:flex; gap:8px; align-items:center;
  background: color-mix(in hsl, var(--panel) 85%, black 6%);
  border:1px solid var(--border); border-radius:999px; padding:8px 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
}
#floatingBar button{ padding:8px 14px; border-radius:999px }

@media print {
  @page { size: A4; margin: 18mm; }
  body{ background:#fff; color:#000; grid-template-rows:0 1fr 0 }
  header, footer, #floatingBar { display:none !important; }
}

/* === 편집기(main) 스크롤 및 겹침 방지 보정 === */
/* body를 3행 그리드(헤더/메인/푸터)로, 메인은 스크롤 가능 */
body{
  display: grid;
  grid-template-rows: 56px 1fr 56px;
  height: 100vh !important;
  overflow: hidden !important;
}

/* main은 스크롤이 가능해야 함 + footer/floatingBar에 가리지 않도록 하단 여백 */
main{
  position: relative;
  z-index: 1;
  overflow-y: auto !important;
  padding-top: 12px;
  padding-bottom: 140px; /* footer 높이 + 여유 */
  height: calc(100vh - 112px) !important; /* 56(header)+56(footer) */
}

/* 편집 영역 자체 여백 확보(아래쪽 충분히 띄워서 겹침 방지) */
#editorRoot{
  position: relative;
  z-index: 1;
  max-width: 880px;
  margin: 12px auto 100px;  /* 아래 여유 */
  overflow: visible;
}

/* 플로팅 버튼과의 겹침도 최소화(필요 시) */
#floatingBar{
  z-index: 50;
}
html, body { height:auto !important; overflow:auto !important; }
main { height:auto !important; overflow:visible !important; }

/* === 문장 낭독 하이라이트용 읽기 패널 === */
#readPane{
  position: fixed;
  right: 16px;
  top: 64px;
  bottom: 64px;
  width: 420px;
  overflow-y: auto;
  background: color-mix(in hsl, var(--panel) 92%, black 4%);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 10px 28px rgba(0,0,0,.35);
  display: none;
}
#readPane .sent{
  display: block;
  line-height: 1.8;
  margin: 4px 0;
  padding: 2px 6px;
  border-radius: 8px;
}
#readPane .sent.reading{
  background: #2b3242;
  outline: 1px solid #3b4b7a;
}
</style>
</head>
<body class="context-editor">
<header>
  <strong>설교 편집</strong><span class="muted" id="ref"></span>
  <div class="grow"></div>
  <button id="x">닫기</button>
</header>

<main>
  <input id="t" class="title-input" type="text" autocomplete="off" placeholder="설교 제목을 입력하세요">
  <div class="notion-header">
    <input id="neTitle" class="title" placeholder="제목을 입력하세요" />
    <div class="meta">
      <button id="nePublish" class="primary">게시</button>
      <button id="neStt">🎙 STT</button>
    </div>
  </div>

  <!-- 플로팅 서식툴바(본문 절문장용과 동일) -->
  <div id="wbp-plbar" hidden role="toolbar" aria-label="절 서식">
    <button type="button" data-cmd="createLink" title="링크 (Ctrl+K)">🔗</button>
    <div class="divider"></div>
    <!-- 여기 뒤에 6색 팔레트 + 기타 드롭다운이 JS로 주입됩니다 -->
  </div>

  <div id="editorRoot" class="rte" contenteditable="true" spellcheck="false" aria-label="Sermon Editor" style="min-height:360px;resize:vertical;padding:14px;background:#161922;border:1px solid #2a3040;border-radius:10px;line-height:1.85;letter-spacing:.015em;caret-color:var(--accent);outline:none"></div>

  <div id="readPane" aria-label="Reading Sentences"></div>

  <div class="notion-footer">
    <div class="notion-badge" id="neAutosave">자동저장 대기중…</div>
    <details style="margin-top:6px">
      <summary>🎧 Sermon Tracer 로그/타임라인</summary>
      <div id="traceLog"></div>
    </details>
  </div>
</main>

<div id="floatingBar" aria-label="도구 막대">
  <button id="btnInsertBibleFloating" class="primary">성경구절</button>
</div>

<footer>
  <span class="muted" id="date"></span><div class="grow"></div>
  <button id="print">인쇄(A4)</button>
  <button id="read" class="primary">낭독</button>
  <button id="stop">중지</button>
  <button class="danger" id="d">삭제</button>
  <button class="primary" id="s">저장</button>
</footer>
</body>
</html>`;

  // 템플릿 보간 및 </script> 보호
  popupHTML = popupHTML.replaceAll('${', '\\${');
  popupHTML = popupHTML.replaceAll('</script>', '<\\/script>');

  w.document.open();
  w.document.write(popupHTML);
  w.document.close();

  // 팝업 초기화 실행
  initSermonPopup(w);

  // 부모창 메시지 핸들러 (저장/삭제 반영)
  const onMsg = (ev) => {
    const data = ev?.data || {};
    if (!data.type) return;

    const map2 = getSermonMap();
    const arr2 = map2[CURRENT.paraId] || [];

    if (data.type === 'sermon-save') {
      const now  = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      
      // 새 설교인 경우 (idx가 배열 범위를 벗어나거나 해당 인덱스에 항목이 없는 경우)
      if (!arr2[idx]) {
        // 새 설교 추가: idx가 0이고 첫 번째 항목이 빈 설교인 경우 해당 항목의 id 사용
        let newId;
        if (idx === 0 && arr2.length > 0 && arr2[0] && arr2[0].id) {
          newId = arr2[0].id;
          // 빈 설교를 실제 내용으로 교체
          arr2[0] = { id: newId, title: data.title, body: data.body, images: data.images || [], date, link: arr2[0].link || '' };
        } else {
          newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
          // 배열이 idx보다 작으면 확장
          while (arr2.length <= idx) {
            arr2.push(null);
          }
          arr2[idx] = { id: newId, title: data.title, body: data.body, images: data.images || [], date, link: '' };
        }
      } else {
        // 기존 설교 업데이트 (빈 설교도 업데이트)
        arr2[idx] = { ...arr2[idx], title: data.title, body: data.body, images: data.images || arr2[idx].images || [], date };
      }
      
      map2[CURRENT.paraId] = arr2;
      setSermonMap(map2);
      status('설교가 저장되었습니다.');
      window.removeEventListener('message', onMsg);
    }

    if (data.type === 'sermon-delete') {
      if (arr2[idx]) arr2.splice(idx, 1);
      map2[CURRENT.paraId] = arr2;
      setSermonMap(map2);
      status('설교가 삭제되었습니다.');
      // 설교 삭제 시 단락 아래 설교 정보도 제거
      const paraEl = document.querySelector(`details.para[data-book="${CURRENT.book}"][data-ch="${CURRENT.chap}"][data-idx="${CURRENT.paraIdx}"]`);
      if (paraEl) {
        const pbody = paraEl.querySelector('.pbody');
        if (pbody) {
          const existingSermonInfo = pbody.querySelector('.sermon-info');
          if (existingSermonInfo) existingSermonInfo.remove();
        }
      }
      window.removeEventListener('message', onMsg);
    }
  };
  window.addEventListener('message', onMsg);
}

/* ===== 팝업 내부 스크립트 ===== */
function initSermonPopup(win){
  const w = win, d = w.document;

    // ===== 중복 제목 입력 숨기기(팝업 한정) =====
  (function removeDuplicateTitle() {
    const d = win.document;
    // 현재 사용 중인 제목 입력칸
    const mainTitle = d.getElementById('neTitle');
    if (!mainTitle) return;

    // 예전 제목 input(#t 등)이 있다면 숨김
    const dupCandidates = [
      ...d.querySelectorAll('input#t, input[type="text"].title-input')
    ].filter(el => el !== mainTitle);

    dupCandidates.forEach(el => {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    });
  })();


  const $ = id => d.getElementById(id);
  const meta = w.__WBPS_META__ || {};

  $('ref').textContent  = ' — ' + (meta.ref || '');
  $('date').textContent = meta.date ? ('최근 저장: ' + meta.date) : '';

  $('t').value = meta.title || '';
  $('neTitle').value = meta.title || '';

  const neRoot    = $('editorRoot');
  const wbpPlbar  = $('wbp-plbar');
  const neAutosave= $('neAutosave');
  const editorMain = neRoot.closest('main') || d.body;

  // 단순 contenteditable 에디터 초기화
  if (!neRoot.innerHTML || /^\s*$/.test(neRoot.innerHTML)) {
    neRoot.innerHTML = '<p>여기에 설교를 작성하세요.</p>';
  }

  // 🔁 공통 플로팅 툴바 모듈 사용 (본문 절문장용과 동일)
  if (wbpPlbar && neRoot && typeof createFloatingToolbar === 'function') {
    // 7색 팔레트 주입 (흰색 포함, 기타색 드롭다운 제거)
    (function injectPalette(){
      if(wbpPlbar.querySelector('.wbp-colors')) return;
      const PALETTE = ['#ff4d4f','#faad14','#fadb14','#52c41a','#1677ff','#722ed1','#ffffff'];
      const wrap = d.createElement('div');
      wrap.className = 'wbp-colors';
      PALETTE.forEach(hex=>{
        const b = d.createElement('button');
        b.type='button'; 
        b.title=hex === '#ffffff' ? '흰색' : hex; 
        b.style.cssText=`width:22px;height:22px;border-radius:5px;border:1px solid ${hex === '#ffffff' ? '#666' : '#2a3040'};background:${hex};`;
        b.addEventListener('click', ()=>{
          d.execCommand?.('foreColor', false, hex);
          NscheduleAutosave();
        });
        wrap.appendChild(b);
      });
      wbpPlbar.appendChild(wrap);
    })();

    // selectionFilter: 에디터 루트 안에서만 허용
    function inEditor() {
      const sel = w.getSelection();
      if (!sel || sel.rangeCount === 0) return false;

      const c = sel.getRangeAt(0).commonAncestorContainer;
      const el = (c.nodeType === 1 ? c : c.parentElement);
      if (!el) return false;

      // 에디터 루트 안에 있는지 확인
      return neRoot.contains(el);
    }

    // 명령 핸들러: execCommand 후 자동저장
    function handleCommand(cmd, val) {
      d.execCommand(cmd, false, val);
      NscheduleAutosave();
    }

    // 색상 입력 요소 찾기 (팔레트는 버튼이므로 null)
    const vcolor = null; // 본문과 달리 색상 입력은 팔레트로 처리

    createFloatingToolbar({
      barElement: wbpPlbar,
      colorElement: vcolor,
      rootContainer: neRoot,
      selectionFilter: inEditor,
      commandHandler: handleCommand,
      windowObj: w,
      docObj: d
    });
  }

  // 단순 HTML 가져오기/설정 함수
  function getEditorHTML(){
    return neRoot.innerHTML || '';
  }
  
  function setEditorHTML(html){
    neRoot.innerHTML = html || '<p>여기에 설교를 작성하세요.</p>';
  }

  // 입력 이벤트 리스너 추가
  neRoot.addEventListener('input', ()=> {
    NscheduleAutosave();
  });

  let NsaveTimer=null;
  function NscheduleAutosave(){
    clearTimeout(NsaveTimer);
    neAutosave.textContent = '입력 중…';
    NsaveTimer = setTimeout(async ()=>{
      try{
        const key = `${DRAFT_PREFIX}${(meta.paraId||'')}.${(meta.idx||0)}`;
        const compressed = await compressDraftText(htmlToPlain(getEditorHTML()));
        const payload = { title: ($('neTitle').value||''), bodyText: compressed.text, codec: compressed.codec, ts: Date.now() };
        saveState(key, payload);
        cleanupDraftStorage();
        neAutosave.textContent = '자동저장됨';
      }catch(_){ neAutosave.textContent = '자동저장 실패(용량)'; }
    }, 500);
  }

  // 초기화: 기존 HTML 로드
  (async function Ninit(){
    const key = `${DRAFT_PREFIX}${(meta.paraId||'')}.${(meta.idx||0)}`;
    const draft = loadState(key, null);
    const draftText = await decompressDraftText(draft);
    if (draftText) {
      setEditorHTML(plainTextToEditorHTML(draftText));
      if ($('neTitle') && draft?.title) $('neTitle').value = draft.title;
      neAutosave.textContent = '자동저장 초안 복원';
    } else if (meta.body) {
      setEditorHTML(meta.body);
    }
    cleanupDraftStorage();
    setTimeout(()=>{ neRoot.focus(); }, 60);
  })();

  // 공통 함수: HTML을 일반 텍스트로 변환
  function htmlToPlain(html){
    const tmp=d.createElement('div'); tmp.innerHTML=html||'';
    tmp.querySelectorAll('sup').forEach(s=> s.textContent='['+s.textContent+'] ');
    return (tmp.textContent||'').replace(/\s+\n/g,'\n').replace(/\n{2,}/g,'\n').replace(/\s+/g,' ').trim();
  }
  
  // 공통 함수: 문장 분할
  function splitToSentences(text){
    const t = String(text||'').trim();
    if(!t) return [];
    const parts = t.split(/(?<=[\.!\?…]|[。！？])\s+/u).filter(s=>s && s.trim().length>0);
    return parts;
  }
  
  // 공통 함수: 설교 편집기의 모든 문장 추출 (STT와 낭독 모두에서 사용)
  function extractAllSentences(){
    const html = getEditorHTML();
    const title = (d.getElementById('neTitle').value || d.getElementById('t').value || '').trim();
    const plain = [title, htmlToPlain(html)].filter(Boolean).join('. ');
    const sents = splitToSentences(plain);
    
    // 각 문장이 속한 요소 찾기 (contenteditable 직접 사용)
    const editorRoot = d.getElementById('editorRoot');
    const sentEls = [];
    
    if (editorRoot) {
      const editorText = htmlToPlain(editorRoot.innerHTML);
      const editorSents = splitToSentences(editorText);
      
      editorSents.forEach(sent => {
        sentEls.push({
          sentence: sent,
          block: editorRoot,
          content: editorRoot
        });
      });
    }
    
    return { sentences: sents, elements: sentEls };
  }
  
  // 공통 함수: 문장 하이라이트 제거 (STT와 낭독 모두에서 사용)
  function clearSentenceHighlight(){
    const editorRoot = d.getElementById('editorRoot');
    if (!editorRoot) return;
    
    editorRoot.querySelectorAll('.sentence-speaking').forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        parent.replaceChild(d.createTextNode(span.textContent), span);
        parent.normalize();
      }
    });
    editorRoot.classList.remove('speaking');
  }
  
  // 공통 함수: 문장 하이라이트 (STT와 낭독 모두에서 사용)
  function highlightSentence(sentIndex, sentEl){
    if (!sentEl || sentIndex < 0) return;
    
    clearSentenceHighlight();
    
    const { block, content, sentence } = sentEl;
    if (!block || !content) return;
    
    // 에디터에 speaking 클래스 추가
    if (block === d.getElementById('editorRoot')) {
      block.classList.add('speaking');
    }
    
    // 문장을 span으로 감싸서 하이라이트
    const contentText = htmlToPlain(content.innerHTML);
    const sentenceStart = contentText.indexOf(sentence);
    
    if (sentenceStart === -1) {
      // 문장을 찾지 못한 경우 블록만 하이라이트
      return;
    }
    
    // 텍스트 노드에서 문장 위치 찾기
    const walker = d.createTreeWalker(
      content,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let textNode = null;
    let currentPos = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;
    
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent;
      const textLen = text.length;
      
      if (!startNode && currentPos + textLen > sentenceStart) {
        startNode = textNode;
        startOffset = sentenceStart - currentPos;
      }
      
      if (startNode && currentPos + textLen >= sentenceStart + sentence.length) {
        endNode = textNode;
        endOffset = sentenceStart + sentence.length - currentPos;
        break;
      }
      
      currentPos += textLen;
    }
    
    // 문장을 span으로 감싸기
    if (startNode && endNode) {
      try {
        const range = d.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        const span = d.createElement('span');
        span.className = 'sentence-speaking';
        span.style.background = 'color-mix(in hsl, var(--accent) 30%, black 0%)';
        span.style.borderRadius = '4px';
        span.style.padding = '2px 0';
        span.style.transition = 'background 0.2s';
        span.style.fontWeight = '600';
        
        range.surroundContents(span);
        
        // 블록이 화면에 보이도록 스크롤
        block.scrollIntoView({block:'center', behavior:'smooth'});
      } catch (e) {
        // 범위가 여러 노드에 걸쳐 있는 경우
        try {
          const range = d.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          
          const contents = range.extractContents();
          const span = d.createElement('span');
          span.className = 'sentence-speaking';
          span.style.background = 'color-mix(in hsl, var(--accent) 30%, black 0%)';
          span.style.borderRadius = '4px';
          span.style.padding = '2px 0';
          span.style.transition = 'background 0.2s';
          span.style.fontWeight = '600';
          span.appendChild(contents);
          range.insertNode(span);
          
          block.scrollIntoView({block:'center', behavior:'smooth'});
        } catch (e2) {
          console.warn('문장 하이라이트 실패:', e2);
        }
      }
    }
  }

  // STT with Sentence Highlighting
  (function(){
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if(!SR){ console.warn('STT 미지원'); return; }
    const rec = new SR(); rec.lang='ko-KR'; rec.interimResults=true; rec.continuous=true;

    let activeBlock=null, accText='', startedAt=null;
    let currentHighlightedIndex = -1; // 현재 하이라이트된 문장 인덱스
    let allSentences = []; // 모든 문장 배열
    let sentenceElements = []; // 각 문장이 속한 DOM 요소 배열
    
    function getActive(){ return d.getElementById('editorRoot'); }
    function setProgress(block, ratio){ /* 진행률 표시 제거 (단순 에디터에서는 불필요) */ }
    function plain(html){ return htmlToPlain(html); } // 공통 함수 사용
    function sim(a,b){ a=a.replace(/\s+/g,''); b=b.replace(/\s+/g,''); const L=Math.max(a.length,1); let m=0; for(let i=0;i<Math.min(a.length,b.length);i++){ if(a[i]===b[i]) m++; } return m/L; }
    function nextBlock(block){ return null; /* 단순 에디터에서는 다음 블록 개념 없음 */ }
    
    // clearSentenceHighlight와 highlightSentence는 위에서 공통 함수로 정의됨 (낭독 섹션과 공유)
    
    // 음성 인식 텍스트와 문장 매칭
    function matchSentence(recognizedText){
      if (!recognizedText || recognizedText.trim().length < 3) return -1;
      
      const normalized = recognizedText.replace(/\s+/g, '').toLowerCase();
      const searchStart = Math.max(0, currentHighlightedIndex);
      const searchEnd = Math.min(allSentences.length, searchStart + 5); // 현재 위치부터 5문장까지 검색
      
      let bestMatch = -1;
      let bestScore = 0;
      const threshold = 0.6; // 유사도 임계값
      
      for (let i = searchStart; i < searchEnd; i++) {
        const sent = allSentences[i];
        if (!sent) continue;
        
        const sentNormalized = sent.replace(/\s+/g, '').toLowerCase();
        
        // 부분 일치 체크
        if (sentNormalized.includes(normalized) || normalized.includes(sentNormalized)) {
          const score = Math.min(normalized.length, sentNormalized.length) / Math.max(normalized.length, sentNormalized.length);
          if (score > bestScore && score >= threshold) {
            bestScore = score;
            bestMatch = i;
          }
        }
        
        // 유사도 계산 (간단한 문자열 유사도)
        const similarity = sim(normalized, sentNormalized);
        if (similarity > bestScore && similarity >= threshold) {
          bestScore = similarity;
          bestMatch = i;
        }
      }
      
      return bestMatch;
    }

    const neSttBtn = d.getElementById('neStt');
    neSttBtn?.addEventListener('click', ()=>{
      if(neSttBtn.dataset.on==='1'){
        rec.stop();
        neSttBtn.dataset.on='0';
        neSttBtn.textContent='🎙 STT';
        clearSentenceHighlight();
        currentHighlightedIndex = -1;
        return;
      }
      
      // 문장 추출
      const extracted = extractAllSentences();
      allSentences = extracted.sentences;
      sentenceElements = extracted.elements;
      currentHighlightedIndex = -1;
      
      if (allSentences.length === 0) {
        w.alert('설교 내용이 없습니다. 먼저 설교를 작성해주세요.');
        return;
      }
      
      activeBlock = getActive();
      accText='';
      startedAt=Date.now();
      rec.start();
      neSttBtn.dataset.on='1';
      neSttBtn.textContent='⏸ 중지';
    });

    rec.onresult = (ev)=>{
      if(!activeBlock) return;
      const r = ev.results[ev.results.length-1];
      const txt = r[0].transcript;
      const isFinal = r.isFinal;
      
      accText += (isFinal ? txt + ' ' : txt);
      
      // 진행률 표시 제거 (단순 에디터에서는 불필요)

      const t = ((Date.now()-startedAt)/1000).toFixed(1);
      const neTrace = d.getElementById('traceLog');
      if (neTrace) {
        neTrace.textContent += `t=${t}s : ${txt}\n`;
        neTrace.scrollTop = neTrace.scrollHeight;
      }

      // 문장 매칭 및 하이라이트 (최종 결과일 때만)
      if (isFinal && txt.trim().length >= 3) {
        const matchedIndex = matchSentence(txt);
        if (matchedIndex >= 0 && matchedIndex < sentenceElements.length) {
          currentHighlightedIndex = matchedIndex;
          highlightSentence(matchedIndex, sentenceElements[matchedIndex]);
        }
      }

      // 블록 완료 체크 제거 (단순 에디터에서는 불필요)
    };
    
    rec.onend = ()=>{
      if(neSttBtn.dataset.on==='1'){
        rec.start();
      }
    };
    
    rec.onerror = (e)=> {
      console.warn('STT 오류', e.error);
      if (e.error === 'no-speech') {
        // 음성이 없을 때는 자동 재시작
        if(neSttBtn.dataset.on==='1'){
          setTimeout(() => rec.start(), 1000);
        }
      }
    };
  })();

  // 게시(Firebase 옵션)
  const nePubBtn = d.getElementById('nePublish');
  nePubBtn?.addEventListener('click', async ()=>{
    try{
      if(typeof w.firebase === 'undefined'){ w.alert('Firebase 미탑재: 게시 기능을 사용하려면 SDK/초기화가 필요합니다.'); return; }
      const user = w.firebase.auth().currentUser;
      if(!user){ w.alert('로그인 후 게시 가능합니다.'); return; }

      const db = w.firebase.firestore();
      const docRef = NSTATE.docId ? db.collection('sermons').doc(NSTATE.docId) : db.collection('sermons').doc();
      const payload = {
        title: (d.getElementById('neTitle').value||'무제'),
        blocks: NSTATE.blocks,
        owner: user.uid,
        updatedAt: w.firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: w.firebase.firestore.FieldValue.serverTimestamp(),
        status: 'published'
      };
      await docRef.set(payload, {merge:true});
      NSTATE.docId = docRef.id;
      const url = w.location.origin + '/viewer.html?id=' + docRef.id;
      w.alert('게시 완료!\n' + url);
    }catch(err){ console.error(err); w.alert('게시 실패: '+err.message); }
  });

  // 성경구절 삽입
  d.getElementById('btnInsertBibleFloating')?.addEventListener('click', insertBiblePrompt);
  async function insertBiblePrompt(){
    const raw = w.prompt('삽입할 성경구절 (예: 요 3:16, 창세기 1:1-3)');
    if(!raw) return;
    const norm=String(raw).replace(/\s+/g,' ').replace(/[–—－]/g,'-').replace(/[：]/g,':').trim();
    const m=norm.match(/^(.+?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/);
    if(!m){ w.alert('형식: 성경이름 장:절 또는 장:절-절'); return; }
    const bookRaw=m[1], chap=parseInt(m[2],10), vFrom=parseInt(m[3],10), vTo=m[4]?parseInt(m[4],10):parseInt(m[3],10);

    let BOOKS;
    try{ BOOKS = await getBooksInPopup(); }
    catch(e){ w.alert(e.message || '성경 데이터를 불러올 수 없습니다.'); return; }

    const bookKey=resolveBookKey(bookRaw,BOOKS);
    if(!bookKey){ w.alert(`해당 성경을 찾을 수 없습니다: "${bookRaw}"`); return; }

    const ch=BOOKS[bookKey]?.[chap];
    if(!ch){ w.alert(`"${bookKey}" ${chap}장을 찾을 수 없습니다.`); return; }

    const verses=(ch.paras||[]).flatMap(p=>p.verses||[]).filter(([v])=>v>=vFrom&&v<=vTo);
    if(!verses.length){ w.alert('해당 구절을 찾을 수 없습니다.'); return; }

    const header = `<div class="verse-header">&lt;${bookKey} ${chap}:${vFrom}${vTo!==vFrom?'-'+vTo:''}&gt;</div>`;
    const html = verses.map(([v,t])=>`<span class="verse-line"><sup>${v}</sup>${t}</span>`).join('');
    const blockHTML = header + html;

    // contenteditable에 직접 삽입
    const editorRoot = d.getElementById('editorRoot');
    if (editorRoot) {
      const p = d.createElement('p');
      p.innerHTML = blockHTML;
      editorRoot.appendChild(p);
      NscheduleAutosave();
      // 포커스를 새로 추가된 요소로 이동
      const sel = w.getSelection();
      const range2 = d.createRange();
      range2.selectNodeContents(p);
      range2.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range2);
    }
  }

  // 저장/삭제/닫기/인쇄
  // 20251114 12:48 교체
  d.getElementById('s').onclick = ()=>{
    let html = getEditorHTML();

    // ✅ 1) 내용이 없는 <p>…</p> 빈 줄 제거
    html = html.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*/gi, '');

    // ✅ 2) 줄바꿈 3개 이상 → 2개로 축소
    html = html.replace(/\n{3,}/g, '\n\n');

    const title =
        (d.getElementById('neTitle').value || d.getElementById('t').value || '').trim()
        || '(제목 없음)';

    const images = [];

    w.opener?.postMessage?.(
        {
        type: 'sermon-save',
        title,
        body: html,
        images,
        },
        '*'
    );

    w.close();
    };
  // 20251114 12:48 교체

  d.getElementById('d').onclick = ()=>{ if(w.confirm('삭제할까요?')){ w.opener?.postMessage?.({ type:'sermon-delete' }, '*'); w.close(); } };
  d.getElementById('x').onclick = ()=> w.close();
  d.getElementById('print').onclick = ()=> w.print();

  /* ========= 문장 단위 낭독 + 하이라이트 + 화면 중앙 정렬 ========= */
  const readBtn = d.getElementById('read');
  const stopBtn = d.getElementById('stop');
  const readPane = d.getElementById('readPane');

  const TTS = {
    sents: [],
    idx: 0,
    playing: false,
    synth: w.speechSynthesis || window.speechSynthesis,
    utter: null
  };

  // htmlToPlain과 splitToSentences는 위에서 공통 함수로 정의됨 (STT 섹션과 공유)

  function renderReadPane(){
    readPane.innerHTML = TTS.sents.map((s,i)=>`<span class="sent" data-i="${i}">${escapeHtml(s)}</span>`).join('');
    readPane.style.display = '';
  }

  function clearPaneHighlight(){
    readPane.querySelectorAll('.sent.reading').forEach(el=> el.classList.remove('reading'));
  }

  // 낭독용 문장 요소 저장 (STT 기능과 동일한 구조 사용)
  let readingSentenceElements = [];
  
  function highlightIndex(i){
    clearPaneHighlight();
    const span = readPane.querySelector(`.sent[data-i="${i}"]`);
    if(span){
      span.classList.add('reading');
      span.scrollIntoView({block:'center', behavior:'smooth'});
    }
    
    // 편집기 본문에도 하이라이트 (STT 기능과 동일한 함수 사용)
    if (i >= 0 && i < readingSentenceElements.length) {
      highlightSentence(i, readingSentenceElements[i]);
    }
  }

  function speakIdx(i){
    // speechSynthesis가 없으면 재시도
    if(!TTS.synth) {
      TTS.synth = w.speechSynthesis || window.speechSynthesis || null;
      if(!TTS.synth) return;
    }
    if(i<0 || i>=TTS.sents.length){ stopReading(); return; }
    TTS.idx = i;
    try{ TTS.synth.cancel(); }catch(_){}
    const u = new w.SpeechSynthesisUtterance(TTS.sents[i]);
    // 부모창 음성 설정을 그대로 이용하지 못하므로 기본 ko-KR로 설정
    u.lang = 'ko-KR';
    u.onstart = ()=>{
      highlightIndex(i);
    };
    u.onend = ()=>{
      if(!TTS.playing) return;
      const next = i+1;
      if(next < TTS.sents.length){
        speakIdx(next);
      }else{
        stopReading();
      }
    };
    u.onerror = ()=>{ // 오류 시 다음 문장으로 넘어가되 무한루프 방지
      if(!TTS.playing) return;
      const next = i+1;
      if(next < TTS.sents.length) speakIdx(next); else stopReading();
    };
    TTS.utter = u;
    TTS.synth.speak(u);
  }

  function startReading(){
    // STT 기능과 동일한 방식으로 문장 추출
    const extracted = extractAllSentences();
    const sents = extracted.sentences;
    if(!sents.length){ w.alert('낭독할 내용이 없습니다.'); return; }
    TTS.sents = sents;
    readingSentenceElements = extracted.elements; // STT와 동일한 구조 사용
    TTS.idx = 0;
    TTS.playing = true;
    renderReadPane();
    readBtn.textContent = '일시정지';
    speakIdx(0);
  }

  function stopReading(){
    TTS.playing = false;
    try{ TTS.synth && TTS.synth.cancel(); }catch(_){}
    clearPaneHighlight();
    
    // 편집기 본문 하이라이트도 제거 (STT 기능과 동일한 함수 사용)
    clearSentenceHighlight();
    
    readPane.style.display = 'none';
    readBtn.textContent = '낭독';
  }

  readBtn.onclick = ()=>{
    // speechSynthesis가 없으면 재시도
    if(!TTS.synth) {
      TTS.synth = w.speechSynthesis || window.speechSynthesis || null;
      if(!TTS.synth){ w.alert('이 브라우저는 음성합성을 지원하지 않습니다.'); return; }
    }
    if(!TTS.playing){
      startReading();
    }else{
      // 일시정지 토글: 일시정지 -> 재개
      if(TTS.synth.speaking && !TTS.synth.paused){
        TTS.synth.pause();
        readBtn.textContent = '재개';
      }else if(TTS.synth.paused){
        TTS.synth.resume();
        readBtn.textContent = '일시정지';
      }else{
        startReading();
      }
    }
  };

  stopBtn.onclick = ()=> stopReading();

  // 문장 클릭 시 해당 문장부터 재생
  readPane.addEventListener('click', (e)=>{
    const span = e.target.closest('.sent');
    if(!span) return;
    const i = +span.dataset.i;
    if(!Number.isFinite(i)) return;
    if(!TTS.sents.length) return;
    TTS.playing = true;
    readBtn.textContent = '일시정지';
    speakIdx(i);
  });

  // 저장/삭제/닫기/낭독 끝
  /* ========= 문장 단위 낭독 섹션 끝 ========= */

  // 기존 중지 버튼 핸들러는 위에서 대체( stopReading )로 처리됨
  // 기존 단일-문장 전체 낭독 로직은 요구사항에 맞춰 문장 단위로 치환됨

  // 성경 데이터 로드 유틸
  let __BOOKS_CACHE = null;
  async function getBooksInPopup(){
    if (__BOOKS_CACHE) return __BOOKS_CACHE;
    try{
      const P = w.opener || window.opener;
      if (P && P.BIBLE && P.BIBLE.books){
        __BOOKS_CACHE = P.BIBLE.books;
        return __BOOKS_CACHE;
      }
    }catch(_){}
    async function tryLoad(path){
      try{
        const res = await fetch(path, {cache:'no-store'});
        if(!res.ok) return null;
        const j = await res.json();
        return j && j.books ? j.books : null;
      }catch(_){ return null; }
    }
    __BOOKS_CACHE = await tryLoad('bible_paragraphs.json') || await tryLoad('bible-paragraphs.json');
    if(!__BOOKS_CACHE) throw new Error('성경 데이터(BIBLE)를 불러올 수 없습니다.');
    return __BOOKS_CACHE;
  }

  function resolveBookKey(input,BOOKS){
    const s=normalizeBookName(input); const keys=Object.keys(BOOKS||{});
    const byNorm=new Map(keys.map(k=>[normalizeBookName(k),k])); if(byNorm.has(s)) return byNorm.get(s);
    const alias=BOOK_ALIAS_MAP(); if(alias[s] && BOOKS[alias[s]]) return alias[s];
    const startHit=keys.find(k=>normalizeBookName(k).startsWith(s)); if(startHit) return startHit;
    const inclHit=keys.find(k=>normalizeBookName(k).includes(s)); if(inclHit) return inclHit;
    return null;
  }
  function normalizeBookName(x){
    return String(x||'').toLowerCase().replace(/\s+/g,'').replace(/[.\u00B7]/g,'').replace(/서$/,'').replace(/복음서?$/,'복음')
    .replace(/첫째|둘째|셋째/g, m=>({'첫째':'1','둘째':'2','셋째':'3'}[m])).replace(/[일이삼]/g,m=>({'일':'1','이':'2','삼':'3'}[m]))
    .replace(/롬서?$/,'롬').replace(/고린도전서?$/,'고전').replace(/고린도후서?$/,'고후')
    .replace(/데살로니가전서?$/,'살전').replace(/데살로니가후서?$/,'살후')
    .replace(/디모데전서?$/,'딤전').replace(/디모데후서?$/,'딤후')
    .replace(/베드로전서?$/,'벧전').replace(/베드로후서?$/,'벧후')
    .replace(/요한일서?$/,'요1').replace(/요한이서?$/,'요2').replace(/요한삼서?$/,'요3');
  }
  function BOOK_ALIAS_MAP(){
    return {
      // 구약
      '창':'창세기','창세기':'창세기','창세':'창세기','출':'출애굽기','출애굽기':'출애굽기','출애':'출애굽기','레':'레위기','레위기':'레위기','민':'민수기','민수기':'민수기','신':'신명기','신명기':'신명기',
      '수':'여호수아','여호수아':'여호수아','삿':'사사기','사사기':'사사기','룻':'룻기','룻기':'룻기','삼상':'사무엘상','사무엘상':'사무엘상','삼하':'사무엘하','사무엘하':'사무엘하',
      '왕상':'열왕기상','열왕기상':'열왕기상','왕하':'열왕기하','열왕기하':'열왕기하','대상':'역대상','역대상':'역대상','대하':'역대하','역대하':'역대하',
      '스':'에스라','에스라':'에스라','느':'느헤미야','느헤미야':'느헤미야','에':'에스더','에스더':'에스더','욥':'욥기','욥기':'욥기','시':'시편','시편':'시편','잠':'잠언','잠언':'잠언',
      '전':'전도서','전도서':'전도서','아':'아가','아가':'아가','사':'이사야','이사야':'이사야','렘':'예레미야','예레미야':'예레미야','애':'예레미야애가','예레미야애가':'예레미야애가',
      '겔':'에스겔','에스겔':'에스겔','단':'다니엘','다니엘':'다니엘','호':'호세아','호세아':'호세아','욜':'요엘','요엘':'요엘','암':'아모스','아모스':'아모스','옵':'오바댜','오바댜':'오바댜',
      '욘':'요나','요나':'요나','미':'미가','미가':'미가','나':'나훔','나훔':'나훔','합':'하박국','하박국':'하박국','습':'스바냐','스바냐':'스바냐','학':'학개','학개':'학개','슥':'스가랴','스가랴':'스가랴','말':'말라기','말라기':'말라기',
      // 신약
      '마':'마태복음','마태':'마태복음','마태복음':'마태복음','막':'마가복음','마가':'마가복음','마가복음':'마가복음','눅':'누가복음','누가':'누가복음','누가복음':'누가복음',
      '요':'요한복음','요한복음':'요한복음','행':'사도행전','사도행전':'사도행전','롬':'로마서','로마서':'로마서','고전':'고린도전서','고린도전서':'고린도전서','고후':'고린도후서','고린도후서':'고린도후서',
      '갈':'갈라디아서','갈라디아서':'갈라디아서','엡':'에베소서','에베소서':'에베소서','빌':'빌립보서','빌립보서':'빌립보서','골':'골로새서','골로새서':'골로새서',
      '살전':'데살로니가전서','데살로니가전서':'데살로니가전서','살후':'데살로니가후서','데살로니가후서':'데살로니가후서','딤전':'디모데전서','디모데전서':'디모데전서','딤후':'디모데후서','디모데후서':'디모데후서',
      '딛':'디도서','디도서':'디도서','몬':'빌레몬서','빌레몬서':'빌레몬서','히':'히브리서','히브리서':'히브리서','약':'야고보서','야고보서':'야고보서',
      '벧전':'베드로전서','베드로전서':'베드로전서','벧후':'베드로후서','베드로후서':'베드로후서',
      '요1':'요한일서','요일1':'요한일서','요한일':'요한일서','요한일서':'요한일서','요2':'요한이서','요일2':'요한이서','요한이':'요한이서','요한이서':'요한이서',
      '요3':'요한삼서','요일3':'요한삼서','요한삼':'요한삼서','요한삼서':'요한삼서','유':'유다서','유다서':'유다서','계':'요한계시록','계시록':'요한계시록','요한계시록':'요한계시록'
    }
  }
}

/* ===== 모달 RTE 상단 패딩 자동 보정 ===== */
function adjustModalEditorPadding() {
  const wrap = document.getElementById('rteToolbar');
  const body = document.querySelector('#sermonEditor .rte');
  if (!body) return;
  const h = wrap ? (wrap.offsetHeight || 0) : 0;
  body.style.setProperty('--editor-pad-top', (h + 0) + 'px');
}
window.addEventListener('resize', adjustModalEditorPadding);
document.getElementById('sermonTitle')?.addEventListener('input', adjustModalEditorPadding);
window.addEventListener('load', adjustModalEditorPadding);

/* ===== 인라인 제목 편집 더미 ===== */
function startInlineTitleEdit(){ /* 필요 시 실제 구현으로 교체 */ }

/* === 공통 플로팅 툴바 모듈 === */
function createFloatingToolbar(options) {
  const {
    barElement,           // 툴바 DOM 요소
    colorElement,        // 색상 입력 요소 (optional)
    rootContainer,       // 루트 컨테이너 (예: #doc, #editorRoot)
    selectionFilter,     // 선택 필터 함수 (예: inVerse)
    commandHandler,      // 명령 실행 함수 (기본: document.execCommand)
    windowObj = window,  // window 객체 (팝업일 경우 팝업의 window)
    docObj = document    // document 객체 (팝업일 경우 팝업의 document)
  } = options;
  
  // 디버그 로그 함수 별칭
  const addDebugLog = window.__addDebugLog || (() => {});

  if (!barElement || !rootContainer) {
    console.warn('[createFloatingToolbar] Missing required elements');
    return null;
  }

  const w = windowObj;
  const d = docObj;
  let savedRange = null;

  function saveSel() {
    const sel = w.getSelection();
    if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0).cloneRange();
  }

  function restoreSel() {
    if (!savedRange) return false;
    const sel = w.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }

  function selRect() {
    const sel = w.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const r = sel.getRangeAt(0).cloneRange();
    let rect = r.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      const span = d.createElement('span');
      span.appendChild(d.createTextNode('\u200b'));
      r.insertNode(span);
      rect = span.getBoundingClientRect();
      span.remove();
    }
    return rect;
  }

  function showBar() {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
    const sel = w.getSelection();
    if (!sel || sel.rangeCount === 0) {
      if (DEBUG) {
        console.log('[showBar] 선택 없음');
        addDebugLog('❌ showBar: 선택 없음', 'error');
      }
      hide();
      return;
    }
    
    // 선택이 collapsed인지 확인
    if (sel.isCollapsed) {
      if (DEBUG) {
        console.log('[showBar] 선택 collapsed');
        addDebugLog('❌ showBar: 선택 collapsed', 'error');
      }
      hide();
      return;
    }

    // selectionFilter 체크 (모달 체크는 inVerse에서 처리)
    if (selectionFilter && !selectionFilter()) {
      if (DEBUG) {
        console.log('[showBar] selectionFilter 실패');
        addDebugLog('❌ showBar: selectionFilter 실패', 'error');
      }
      hide();
      return;
    }
    
    if (DEBUG) {
      addDebugLog('✅ showBar: selectionFilter 통과', 'success');
    }
    
    // selectionFilter가 통과했다면, 모달이 열려있어도 선택은 허용된 것입니다.
    // inVerse() 함수가 이미 #tree 내부 선택과 #sermonEditor 내부 선택을 허용했으므로
    // 여기서는 추가 모달 체크를 하지 않습니다.

    const rect = selRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      if (DEBUG) {
        console.log('[showBar] rect 없음 또는 크기 0');
        addDebugLog('❌ showBar: rect 없음 또는 크기 0', 'error');
      }
      hide();
      return;
    }

    // 드래그한 부분 위에 정확히 배치
    // 중앙 정렬: left = 선택 영역 중앙 - 툴바 너비의 50%
    // 위에 배치: top = 선택 영역 위쪽 - 툴바 높이 - 여백
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top;
    
    // transform을 사용하여 중앙 정렬
    barElement.style.left = centerX + 'px';
    barElement.style.top = (topY - 10) + 'px';
    barElement.style.transform = 'translate(-50%, -100%)';
    barElement.hidden = false;
    
    if (DEBUG) {
      const info = {
        position: { left: centerX, top: topY },
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        barElementId: barElement.id,
        barElementTag: barElement.tagName
      };
      console.log('[showBar] ✅ 툴바 표시', info);
      addDebugLog(`✅ 툴바 표시 성공!`, 'success');
      addDebugLog(`  - 위치: (${centerX.toFixed(0)}, ${topY.toFixed(0)})`, 'info');
      addDebugLog(`  - rect: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`, 'info');
    }
    
    saveSel();
  }

  function hide() {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
    barElement.hidden = true;
    if (DEBUG) {
      addDebugLog('👁️ 툴바 숨김', 'info');
    }
  }

  // 툴바 클릭 이벤트
  barElement.addEventListener('mousedown', e => e.preventDefault());
  barElement.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (!restoreSel()) return;

    const cmd = btn.dataset.cmd;
    const act = btn.dataset.act;
    const mark = btn.dataset.mark;
    const action = btn.dataset.action;

    // 명령 실행
    const execCmd = commandHandler || ((cmd, val) => d.execCommand(cmd, false, val));

    if (cmd) {
      if (cmd === 'createLink') {
        const sel = w.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          const url = w.prompt('링크 URL을 입력하세요:', 'https://');
          if (url) {
            execCmd('createLink', false, url);
          }
        }
      } else {
        execCmd(cmd, null);
      }
      saveSel();
      if (!selectionFilter || selectionFilter()) showBar();
      return;
    }

    if (mark) {
      // 설교 팝업용 마크 명령
      execCmd(
        mark === 'highlight' ? 'backColor' : mark,
        mark === 'highlight' ? '#6655007a' : null
      );
      saveSel();
      if (!selectionFilter || selectionFilter()) showBar();
      return;
    }

    if (act === 'clearColor' || action === 'clearFmt') {
      if (action === 'clearFmt') {
        execCmd('removeFormat', null);
        execCmd('unlink', null);
      } else {
        try {
          const sel = w.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const range = sel.getRangeAt(0);
          const frag = range.cloneContents();
          const div = d.createElement('div');
          div.appendChild(frag);
          div.querySelectorAll('span, font').forEach(n => {
            if (n.style?.color) n.style.color = '';
            if (n.hasAttribute?.('color')) n.removeAttribute('color');
          });
          range.deleteContents();
          execCmd('insertHTML', div.innerHTML);
        } catch (_) {}
      }
      saveSel();
      if (!selectionFilter || selectionFilter()) showBar();
      return;
    }

    if (action === 'link') {
      const url = w.prompt('링크 URL');
      if (url) execCmd('createLink', url);
      saveSel();
      if (!selectionFilter || selectionFilter()) showBar();
    }
  });

  // 색상 입력 이벤트
  if (colorElement) {
    colorElement.addEventListener('input', () => {
      if (!restoreSel()) return;
      const execCmd = commandHandler || ((cmd, val) => d.execCommand(cmd, false, val));
      execCmd('foreColor', colorElement.value);
      saveSel();
      if (!selectionFilter || selectionFilter()) showBar();
    });
  }

  // 이벤트 리스너 등록
  const containerEl = typeof rootContainer === 'string' 
    ? d.querySelector(rootContainer) 
    : rootContainer;

  // 디바운싱을 위한 변수 (중복 호출 방지)
  let lastSelectionTime = 0;
  let mouseupTimeout = null;
  let isProcessing = false; // 처리 중 플래그 (무한 루프 방지)
  
  function triggerShowBar() {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
    
    // 이미 처리 중이면 무시 (무한 루프 방지)
    if (isProcessing) {
      if (DEBUG) {
        console.log('[triggerShowBar] 이미 처리 중, 무시');
        addDebugLog('⚠️ triggerShowBar: 이미 처리 중', 'warn');
      }
      return;
    }
    
    // 중복 호출 방지: 50ms 이내의 연속 호출은 무시 (20ms에서 50ms로 증가)
    const now = Date.now();
    if (now - lastSelectionTime < 50) {
      if (DEBUG) {
        addDebugLog(`⚠️ triggerShowBar: 중복 호출 방지 (${now - lastSelectionTime}ms 전)`, 'warn');
      }
      return;
    }
    lastSelectionTime = now;
    
    // 처리 중 플래그 설정
    isProcessing = true;
    
    try {
      // 선택이 완료되었는지 확인 후 즉시 표시
      if (DEBUG) {
        const sel = w.getSelection();
        const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;
        console.log('[triggerShowBar] 호출', {
          hasSelection,
          hasSelectionFilter: !!selectionFilter
        });
        addDebugLog(`🔔 triggerShowBar 호출 (hasSelection: ${hasSelection})`, 'info');
      }
      
      if (!selectionFilter || selectionFilter()) {
        if (DEBUG) {
          console.log('[triggerShowBar] ✅ selectionFilter 통과, showBar() 호출');
          addDebugLog('✅ selectionFilter 통과, showBar() 호출', 'success');
        }
        showBar();
      } else {
        if (DEBUG) {
          console.log('[triggerShowBar] ❌ selectionFilter 실패, hide() 호출');
          addDebugLog('❌ selectionFilter 실패, hide() 호출', 'error');
        }
        hide();
      }
    } catch (e) {
      console.warn('triggerShowBar() error:', e);
      if (DEBUG) addDebugLog(`❌ triggerShowBar 에러: ${e.message}`, 'error');
      hide();
    } finally {
      // 다음 이벤트 루프에서 플래그 해제
      setTimeout(() => {
        isProcessing = false;
      }, 0);
    }
  }

  // document 레벨에서 mouseup 처리 (더 넓은 범위 커버)
  d.addEventListener('mouseup', (e) => {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
    if (DEBUG) {
      addDebugLog(`🖱️ mouseup 이벤트 (target: ${e.target.tagName}.${e.target.className})`, 'info');
    }
    // 기존 timeout 취소
    if (mouseupTimeout) clearTimeout(mouseupTimeout);
    // 짧은 지연으로 선택이 완전히 완료된 후 처리
    // selectionFilter에서 필터링하므로 여기서는 모든 mouseup 처리
    mouseupTimeout = setTimeout(() => {
      if (DEBUG) addDebugLog('⏰ mouseup timeout 실행', 'info');
      triggerShowBar();
      mouseupTimeout = null;
    }, 50);
  }, { passive: true });

  if (containerEl) {
    containerEl.addEventListener('keyup', () => {
      setTimeout(() => {
        triggerShowBar();
      }, 10);
    });
  }

  // 전역 이벤트 (selectionchange는 window별로)
  w.addEventListener('selectionchange', () => {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
    if (DEBUG) {
      const sel = w.getSelection();
      addDebugLog(`📝 selectionchange 이벤트 (rangeCount: ${sel?.rangeCount || 0}, collapsed: ${sel?.isCollapsed || true})`, 'info');
    }
    // mouseup 처리 중이면 무시
    if (mouseupTimeout) {
      if (DEBUG) addDebugLog('⚠️ selectionchange: mouseup 처리 중, 무시', 'warn');
      return;
    }
    // 처리 중이면 무시 (무한 루프 방지)
    if (isProcessing) {
      if (DEBUG) addDebugLog('⚠️ selectionchange: 처리 중, 무시', 'warn');
      return;
    }
    // 짧은 지연으로 중복 방지 (50ms에서 100ms로 증가)
    if (Date.now() - lastSelectionTime < 100) {
      if (DEBUG) addDebugLog('⚠️ selectionchange: 중복 방지', 'warn');
      return;
    }
    setTimeout(() => {
      if (DEBUG) addDebugLog('⏰ selectionchange timeout 실행', 'info');
      triggerShowBar();
    }, 100);
  });

  w.addEventListener('scroll', hide, { passive: true });
  w.addEventListener('resize', hide);

  // 키보드 단축키 (노션 스타일: Ctrl+B/I/U/K, Ctrl+Shift+H: 글자색)
  w.addEventListener('keydown', (e) => {
    if (selectionFilter && !selectionFilter()) return;
    
    // Ctrl+Shift+H: 글자색 선택
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      const sel = w.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        // HTML5 color input 사용
        const colorInput = d.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#000000';
        colorInput.style.position = 'fixed';
        colorInput.style.opacity = '0';
        colorInput.style.pointerEvents = 'none';
        d.body.appendChild(colorInput);
        
        colorInput.addEventListener('change', () => {
          const execCmd = commandHandler || ((cmd, val) => d.execCommand(cmd, false, val));
          execCmd('foreColor', false, colorInput.value);
          d.body.removeChild(colorInput);
          setTimeout(showBar, 0);
        });
        
        colorInput.addEventListener('blur', () => {
          if (d.body.contains(colorInput)) {
            d.body.removeChild(colorInput);
          }
        });
        
        colorInput.click();
      }
      return;
    }
    
    // Ctrl+B/I/U/K
    if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
    const k = e.key.toLowerCase();
    if (['b', 'i', 'u', 'k'].includes(k)) {
      e.preventDefault();
      const execCmd = commandHandler || ((cmd, val) => d.execCommand(cmd, false, val));
      if (k === 'k') {
        // 링크: 선택된 텍스트가 있으면 링크 추가, 없으면 프롬프트
        const sel = w.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          const url = w.prompt('링크 URL을 입력하세요:', 'https://');
          if (url) {
            execCmd('createLink', false, url);
          }
        }
      } else {
        execCmd(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'underline', null);
      }
      setTimeout(showBar, 0);
    }
  });

  return { showBar, hide, saveSel, restoreSel };
}

/* === 절문장 전용 서식 툴바 === */
(function(){
  const bar = document.getElementById('vbar') || document.getElementById('wbp-plbar');
  const color = document.getElementById('vcolor');
  const docEl = document.getElementById('doc');

  // ===== [INIT HOOK] BEGIN =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      safeBindFmtButtons(); // 서식저장, 서식화복, 서식내보내기, 서식가져오기 버튼
      ensureBookHeadChips();       // 👈 각 성경책 1장 첫단락 설교버튼 오른쪽에 기본이해, 내용구조, 메세지요약 
      ensureGlobalBookChips();     // 👈 헤더의 '서식가져오기' 오른쪽에 전역 칩스
      // 버튼 색상 업데이트 (초기화 후)
      setTimeout(updateButtonColors, 500);
    });
  } else {
    safeBindFmtButtons();
    ensureBookHeadChips();       // 👈 마지막에 호출 (정착)
    ensureGlobalBookChips();     // 👈 헤더의 '서식가져오기' 오른쪽에 전역 칩스
    // 버튼 색상 업데이트 (초기화 후)
    setTimeout(updateButtonColors, 500);
  }
  document.addEventListener('wbp:treeBuilt', ()=>{
    const root = document.getElementById('tree') || document;
    WBP_FMT.restoreAll(root);       // (기존 유지)
    document.addEventListener('wbp:treeBuilt', ensureBookHeadChips);
  });
  // ===== [INIT HOOK] END =====

  const treeEl = document.getElementById('tree');
  if(!bar || !treeEl) return;

  // 🔍 디버깅 패널 생성 (전역 스코프)
  if (!window.__WBP_DEBUG_PANEL) {
    function createDebugPanel() {
      if (document.getElementById('wbp-debug-panel')) return document.getElementById('wbp-debug-panel');
      const panel = document.createElement('div');
      panel.id = 'wbp-debug-panel';
      panel.style.cssText = `
        position: fixed; bottom: 10px; right: 10px; width: 400px; max-height: 500px;
        background: rgba(0,0,0,0.9); color: #0f0; border: 2px solid #0f0;
        border-radius: 8px; padding: 12px; font-family: monospace; font-size: 11px;
        z-index: 99999; overflow-y: auto; display: none;
        box-shadow: 0 4px 20px rgba(0,255,0,0.3);
      `;
      panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #0f0; padding-bottom:4px;">
          <strong style="color:#0f0;">🔍 플로팅 툴바 디버그</strong>
          <button id="wbp-debug-close" style="background:#0f0; color:#000; border:none; padding:2px 8px; cursor:pointer; border-radius:4px;">✕</button>
        </div>
        <div id="wbp-debug-content" style="line-height:1.6;"></div>
      `;
      document.body.appendChild(panel);
      document.getElementById('wbp-debug-close').onclick = () => {
        panel.style.display = 'none';
      };
      window.__WBP_DEBUG_PANEL = panel;
      return panel;
    }
    createDebugPanel();
  }
  
  // 전역 디버그 로그 함수
  window.__addDebugLog = function(message, type = 'info') {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
    if (DEBUG) {
      const debugContent = document.getElementById('wbp-debug-content');
      if (!debugContent) return;
      const colors = { info: '#0f0', warn: '#ff0', error: '#f00', success: '#0ff' };
      const color = colors[type] || '#0f0';
      const time = new Date().toLocaleTimeString();
      const logEntry = document.createElement('div');
      logEntry.style.cssText = `color:${color}; margin:2px 0; padding:2px 0; border-bottom:1px solid rgba(0,255,0,0.2);`;
      logEntry.textContent = `[${time}] ${message}`;
      debugContent.appendChild(logEntry);
      debugContent.scrollTop = debugContent.scrollHeight;
      // 최대 50개 로그만 유지
      while (debugContent.children.length > 50) {
        debugContent.removeChild(debugContent.firstChild);
      }
    }
  };
  
  // 로컬 별칭
  const addDebugLog = window.__addDebugLog;
  
  // 디버그 패널 표시/숨김 토글
  window.__toggleDebugPanel = () => {
    const debugPanel = document.getElementById('wbp-debug-panel');
    if (!debugPanel) return;
    if (debugPanel.style.display === 'none' || !debugPanel.style.display) {
      debugPanel.style.display = 'block';
      window.__DEBUG_FLOATING_TOOLBAR = true;
      addDebugLog('디버그 모드 활성화', 'success');
    } else {
      debugPanel.style.display = 'none';
    }
  };

  // selectionFilter: 본문 절문장만 허용
  function inVerse() {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false; // 디버깅 플래그
    const startTime = performance.now();
    
    try {
      // 🔹 0) 현재 window가 메인 window인지 확인 (설교 팝업 window 제외)
      // 설교 팝업은 별도 window이므로 이 함수는 메인 window에서만 실행됨
      if (window !== window.top || window.parent !== window) {
        if (DEBUG) {
          console.log('[inVerse] 팝업 window 제외');
          addDebugLog('❌ 팝업 window 제외', 'warn');
        }
        return false;
      }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      if (DEBUG) {
        console.log('[inVerse] 선택 없음');
        addDebugLog('❌ 선택 없음', 'warn');
      }
      return false;
    }
    
    if (DEBUG) {
      addDebugLog(`✓ 선택 있음 (rangeCount: ${sel.rangeCount}, collapsed: ${sel.isCollapsed})`, 'info');
    }
    // isCollapsed 체크는 showBar()에서 이미 처리되므로 여기서는 제거

    // 🔹 4) 오직 성경 본문(#tree 안 .verse 또는 .pline)일 때만 true
    const treeEl = document.getElementById('tree');
    if (!treeEl) {
      if (DEBUG) {
        console.log('[inVerse] treeEl 없음');
        addDebugLog('❌ #tree 요소 없음', 'error');
      }
      return false;
    }
    
    if (DEBUG) {
      addDebugLog(`✓ #tree 요소 찾음`, 'info');
    }
    
    let range;
    try {
      range = sel.getRangeAt(0);
    } catch (e) {
      if (DEBUG) console.log('[inVerse] range 접근 실패:', e);
      return false; // range 접근 실패
    }
    
    const c  = range.commonAncestorContainer;
    const el = (c.nodeType === 1 ? c : c.parentElement);
    if (!el) {
      if (DEBUG) console.log('[inVerse] el 없음');
      return false;
    }

    // 🔹 0-1) 모달 체크는 나중에 수행 (먼저 .pcontent/.pline 확인)

    // 🔹 1) 선택된 요소가 메인 document에 속하는지 확인 (설교 팝업 제외)
    try {
      if (el.ownerDocument !== document) {
        if (DEBUG) console.log('[inVerse] 다른 window의 document 제외');
        return false; // 다른 window의 document면 제외
      }
    } catch (e) {
      if (DEBUG) console.log('[inVerse] document 접근 불가:', e);
      return false; // 접근 불가능하면 제외
    }

    // 🔹 4) 선택 영역의 시작과 끝 컨테이너를 먼저 확인 (commonAncestorContainer보다 정확)
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // 시작/끝 컨테이너가 .pcontent 또는 .pline 내부에 있는지 확인하는 헬퍼 함수
    function isInPcontent(container) {
      if (!container) return false;
      
      let node = container;
      if (container.nodeType === 3) { // 텍스트 노드
        node = container.parentElement;
      }
      if (!node) return false;
      
      // .pcontent 또는 .pline 찾기
      const pcontent = node.closest('.pcontent');
      const pline = node.closest('.pline');
      const verse = node.closest('.verse');
      const verseLine = node.closest('.verse-line');
      
      // .pcontent나 .pline이 #tree 안에 있으면 true
      if (pcontent && treeEl.contains(pcontent)) return true;
      if (pline && treeEl.contains(pline)) return true;
      if (verse && treeEl.contains(verse)) return true;
      if (verseLine && treeEl.contains(verseLine)) return true;
      
      return false;
    }
    
    // 시작 또는 끝이 .pcontent/.pline 내부에 있으면 허용
    const startInPcontent = isInPcontent(startContainer);
    const endInPcontent = isInPcontent(endContainer);
    if (startInPcontent || endInPcontent) {
      if (DEBUG) {
        const info = {
          startInPcontent,
          endInPcontent,
          startContainer: startContainer.nodeType === 3 ? startContainer.textContent?.substring(0, 20) : startContainer.tagName,
          endContainer: endContainer.nodeType === 3 ? endContainer.textContent?.substring(0, 20) : endContainer.tagName
        };
        console.log('[inVerse] ✅ .pcontent/.pline 내부 선택 허용', info);
        addDebugLog(`✅ .pcontent/.pline 내부 선택 허용 (start: ${startInPcontent}, end: ${endInPcontent})`, 'success');
      }
      const elapsed = (performance.now() - startTime).toFixed(2);
      if (DEBUG) addDebugLog(`⏱️ 처리 시간: ${elapsed}ms`, 'info');
      return true;
    }
    
    if (DEBUG) {
      addDebugLog(`⚠️ .pcontent/.pline 내부 선택 아님 (start: ${startInPcontent}, end: ${endInPcontent})`, 'warn');
    }
    
    // 🔹 5) commonAncestorContainer를 통한 추가 확인
    const pline = el.closest('.pline');
    const verse = el.closest('.verse');
    const verseLine = el.closest('.verse-line');
    const pcontent = el.closest('.pcontent');
    
    // 🔹 5-1) #sermonEditor 내부 선택 처리 (기본이해 편집기에서는 허용)
    const sermonEditor = el.closest('#sermonEditor');
    if (sermonEditor) {
      const sermonBody = sermonEditor.querySelector('#sermonBody');
      if (sermonBody) {
        // 선택 영역의 시작이나 끝이 sermonBody 내부에 있는지 확인
        const startNode = startContainer.nodeType === 3 ? startContainer.parentElement : startContainer;
        const endNode = endContainer.nodeType === 3 ? endContainer.parentElement : endContainer;
        const startInSermonBody = sermonBody.contains(startNode);
        const endInSermonBody = sermonBody.contains(endNode);
        const elInSermonBody = sermonBody.contains(el) || el === sermonBody;
        
        if (startInSermonBody || endInSermonBody || elInSermonBody) {
          // 모든 편집기 모드에서 플로팅 툴바 허용
          // - 책 단위: book-basic, book-struct, book-summary
          // - 단락 단위: summary, unit, whole, commentary
          const ctxType = sermonEditor.dataset.ctxType;
          if (ctxType) {
            // 책 단위 편집기 또는 단락 단위 편집기 모두 허용
            const allowedTypes = ['summary', 'unit', 'whole', 'commentary'];
            if (ctxType.startsWith('book-') || allowedTypes.includes(ctxType)) {
              if (DEBUG) {
                console.log('[inVerse] ✅ #sermonBody 선택 허용 (편집기)', {
                  startInSermonBody,
                  endInSermonBody,
                  elInSermonBody,
                  ctxType
                });
              }
              return true; // 편집기에서는 허용
            }
          }
          if (DEBUG) {
            console.log('[inVerse] ❌ #sermonBody 선택 제외', {
              startInSermonBody,
              endInSermonBody,
              elInSermonBody,
              ctxType,
              elTag: el.tagName,
              elId: el.id,
              elClass: el.className
            });
          }
          return false; // 다른 모드에서는 제외
        }
      }
    }
    
    // 🔹 5-2) #tree 안에 있는지 확인 (성경 본문 영역만 허용)
    const isInTree = treeEl.contains(el);
    if (DEBUG) {
      addDebugLog(`📍 #tree 내부 여부: ${isInTree}`, 'info');
      addDebugLog(`  - el.tagName: ${el.tagName}, el.className: ${el.className}`, 'info');
      addDebugLog(`  - pcontent: ${!!pcontent}, pline: ${!!pline}, verse: ${!!verse}, verseLine: ${!!verseLine}`, 'info');
    }
    
    if (isInTree) {
      // .pcontent 내부에서 선택된 경우도 허용 (여러 .pline에 걸친 선택 포함)
      if (pcontent || pline || verse || verseLine) {
        if (DEBUG) {
          const info = {
            hasPcontent: !!pcontent,
            hasPline: !!pline,
            hasVerse: !!verse,
            hasVerseLine: !!verseLine,
            elTag: el.tagName,
            elClass: el.className
          };
          console.log('[inVerse] ✅ #tree 내부 .pcontent/.pline 선택 허용', info);
          addDebugLog(`✅ #tree 내부 .pcontent/.pline 선택 허용`, 'success');
          addDebugLog(`  - pcontent: ${!!pcontent}, pline: ${!!pline}`, 'info');
        }
        const elapsed = (performance.now() - startTime).toFixed(2);
        if (DEBUG) addDebugLog(`⏱️ 처리 시간: ${elapsed}ms`, 'info');
        return true;
      } else {
        if (DEBUG) {
          addDebugLog(`❌ #tree 내부지만 .pcontent/.pline 없음`, 'error');
        }
      }
    }
    
    // 🔹 7) #tree 밖이면서 위 조건에 해당하지 않으면 false
    if (!isInTree) {
      // 모달 내부 요소 체크 (이미 위에서 허용된 경우는 제외)
      // 단, 성경 본문 영역(#tree 내부)은 이미 위에서 처리되었으므로 여기서는 모달 편집기만 체크
      const isInModal = el.closest('#modalWrap') || el.closest('.modal') || el.closest('#sermonList') || 
          el.closest('#rteToolbar') ||
          el.closest('.modal-backdrop') || el.closest('.editor-bar') || 
          (el.closest('.editor') && !treeEl.contains(el)) || el.closest('#modalFooterNew') ||
          el.closest('#editorRoot') || el.closest('#neFloatingBar') ||
          // .rte는 모달 내부의 #sermonBody만 체크 (성경 본문의 .pcontent는 제외)
          (el.closest('.rte') && el.closest('#sermonBody') && !treeEl.contains(el));
      
      if (isInModal) {
        if (DEBUG) {
          console.log('[inVerse] ❌ 모달 내부 요소 제외', {
            elTag: el.tagName,
            elId: el.id,
            elClass: el.className,
            closestModal: el.closest('#modalWrap') ? 'modalWrap' : 
                         el.closest('.modal') ? 'modal' :
                         el.closest('#sermonList') ? 'sermonList' :
                         el.closest('.rte') ? 'rte' :
                         el.closest('#rteToolbar') ? 'rteToolbar' : 'other'
          });
        }
        return false;
      }
      if (DEBUG) {
        console.log('[inVerse] ❌ #tree 밖이면서 모달도 아님');
      }
      return false;
    }
    
    // 🔹 8) 모달이 열려있고 선택이 모달 내부에 있으면 false (단, 위에서 허용된 #tree 내부 선택은 제외)
    // 이미 위에서 .pcontent, .pline, #sermonBody 내부 선택은 허용되었으므로
    // 여기서는 추가로 체크할 필요가 없습니다.
    
    if (DEBUG) {
      const info = {
        elTag: el.tagName,
        elId: el.id,
        elClass: el.className,
        isInTree,
        hasPcontent: !!pcontent,
        hasPline: !!pline
      };
      console.log('[inVerse] ❌ 모든 조건 불만족, false 반환', info);
      addDebugLog(`❌ 모든 조건 불만족`, 'error');
      addDebugLog(`  - isInTree: ${isInTree}, hasPcontent: ${!!pcontent}, hasPline: ${!!pline}`, 'error');
      addDebugLog(`  - el: ${el.tagName}.${el.className}`, 'error');
    }
    const elapsed = (performance.now() - startTime).toFixed(2);
    if (DEBUG) addDebugLog(`⏱️ 처리 시간: ${elapsed}ms`, 'info');
    return false;
    } catch (e) {
      // 예외 발생 시 false 반환 (무한 루프 방지)
      console.warn('inVerse() error:', e);
      return false;
    }
  }

  // 공통 모듈 사용
  const toolbar = createFloatingToolbar({
    barElement: bar,
    colorElement: color,
    rootContainer: treeEl,
    selectionFilter: inVerse,
    commandHandler: (cmd, val) => document.execCommand(cmd, false, val)
  });

  // 모달이 열릴 때 툴바 강제 숨김 (단, 편집기 내부 선택은 허용)
  const modalWrap = document.getElementById('modalWrap');
  if (modalWrap && toolbar) {
    // MutationObserver로 모달 상태 변화 감지
    const observer = new MutationObserver(() => {
      const isModalOpen = modalWrap.style.display === 'flex' || modalWrap.style.display === '';
      const ariaHidden = modalWrap.getAttribute('aria-hidden');
      
      // 모달이 열려있는 상태에서 aria-hidden이 true로 설정되는 것을 방지
      if (isModalOpen && ariaHidden === 'true') {
        modalWrap.setAttribute('aria-hidden', 'false');
      }
      
      // 모달이 열려있어도 편집기 내부 선택이면 툴바를 표시할 수 있도록
      // 여기서는 숨기지 않고, selectionFilter에서 허용된 경우에만 표시되도록 함
      // 모달이 닫혔을 때만 강제로 숨김
      if (!isModalOpen && ariaHidden === 'true') {
        toolbar.hide();
      }
    });
    observer.observe(modalWrap, { 
      attributes: true, 
      attributeFilter: ['style', 'aria-hidden'] 
    });
    
    // 모달이 열릴 때 직접 툴바 숨김 (이벤트 리스너)
    // 단, 성경 본문 영역 선택은 허용하므로 여기서는 숨기지 않음
    // selectionFilter(inVerse)에서 허용된 경우에만 표시되도록 함
    const originalDisplaySetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style')?.set;
    if (modalWrap.style) {
      // 모달 열기 함수들에서 호출될 수 있도록 전역 함수로 등록
      // 단, 성경 본문 영역에서는 숨기지 않음 (inVerse에서 허용)
      window.__hideFloatingToolbar = () => {
        const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
        if (DEBUG) {
          addDebugLog('🔔 __hideFloatingToolbar 호출됨', 'warn');
        }
        // 성경 본문 영역 선택이 아닐 때만 숨김
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          // inVerse()를 직접 호출하여 성경 본문 영역인지 확인
          const treeEl = document.getElementById('tree');
          if (treeEl) {
            try {
              const range = sel.getRangeAt(0);
              const c = range.commonAncestorContainer;
              const el = (c.nodeType === 1 ? c : c.parentElement);
              if (el && treeEl.contains(el)) {
                // 성경 본문 영역이면 숨기지 않음
                if (DEBUG) {
                  addDebugLog('✅ 성경 본문 영역이므로 숨기지 않음', 'success');
                }
                return;
              }
            } catch (e) {
              if (DEBUG) {
                addDebugLog(`❌ 에러 발생: ${e.message}`, 'error');
              }
              // 에러 발생 시 숨김
            }
          }
        }
        if (DEBUG) {
          addDebugLog('👁️ 툴바 숨김 실행', 'warn');
        }
        toolbar.hide();
      };
    }
  }

// ===== [FORMAT-PERSIST QUICK INSPECTOR] 열린 단락 저장본 바로 보기 =====
window.inspectCurrentFormat = () => {
  const t = document.querySelector('details.para[open] summary .ptitle');
  if(!t){ console.warn('⚠️ 열려있는 단락이 없습니다. 먼저 단락을 여세요.'); return; }

  const key = `WBP3_FMT:${t.dataset.book}:${t.dataset.ch}:${t.dataset.idx}`;
  const d = loadState(key, null);
  if(!d){ console.warn('❌ 저장된 서식 데이터가 없습니다.', key); return; }

  try {
    console.group('📘 열린 단락 서식저장 확인');
    console.log('KEY:', key);
    console.log('버전(v):', d.v);
    console.log('저장시각:', new Date(d.savedAt).toLocaleString());
    console.log('절문장 수:', d.lines?.length || 0);

    if (Array.isArray(d.lines) && d.lines.length) {
      const L = d.lines[0];
      console.log('▶ 첫 절문장 HTML:', (L.html||'').slice(0,120) + '...');
      console.log('▶ 첫 절문장 텍스트:', (L.text||'').slice(0,100));
      console.log('▶ 첫 절문장 spans(서식 runs):', L.spans?.slice(0,10) || '(없음)');
    }
    console.groupEnd();
  } catch(e) {
    console.error('⚠️ 저장 데이터 파싱 오류:', e);
  }
};

(function cleanupMiniChipsOnce(){
  document.querySelectorAll('.unit-chips, #unitGlobalChips').forEach(el => el.remove());
  const css = document.createElement('style');
  css.textContent = `.unit-chips, #unitGlobalChips { display:none !important; }`;
  document.head.appendChild(css);
})();

// === [REMOVE HEADER CHIPS] 헤더의 '기본이해·내용구조·메세지요약' 제거 ===
(function removeHeaderChips(){
  const hdr = document.querySelector('header');
  if (!hdr) return;
  const SEL = '.book-chip, .bookhead-chips, .unit-chip, .unit-chips, #unitGlobalChips';
  hdr.querySelectorAll(SEL).forEach(el => el.remove());
  const mo = new MutationObserver(() => {
    hdr.querySelectorAll(SEL).forEach(el => el.remove());
  });
  mo.observe(hdr, { childList:true, subtree:true });
})()

// === [REMOVE HEADER CHIPS - DELAYED] ===
function removeHeaderBookEditors(){
  const labels = ['기본이해','내용구조','메세지요약'];
  const tryRemove = ()=>{
    const header = document.querySelector('header');
    if(!header) return;
    let removed = 0;
    header.querySelectorAll('button, .btn, [role="button"]').forEach(b=>{
      if(labels.includes((b.textContent||'').trim())){
        b.remove();
        removed++;
      }
    });
    if(removed>0) console.log('기본이해·내용구조·메세지요약 제거 완료');
    else setTimeout(tryRemove, 500); // 버튼 생성 지연 대비 반복 시도
  };
  tryRemove();
}
removeHeaderBookEditors();

// === [BOOK-CHIP → FLOW-EDITOR 재사용 바인딩] ===============================
function bindBookHeadChipsToFlowEditor(){
  const tree = document.getElementById('tree');
  if(!tree) return;

  // 여러 권이 동시에 open이면 막기
  const openedBooks = [...tree.querySelectorAll('details.book[open]')];
  if(openedBooks.length > 1){
    alert('2개 이상 성경이 열려 있습니다. 한 권만 연 다음 다시 시도하세요.');
    return;
  }

  // 대상: 현재 열려있는 책(또는 화면상 첫 책)
  const bookEl =
    openedBooks[0] ||
    tree.querySelector('details.book');

  if(!bookEl) return;

  // 이 책의 1장/첫 단락 툴바에서 '내용흐름' 버튼을 찾아 둔다
  const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
  const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
  if(!p1) return;
  const flowBtn = p1.querySelector('.ptoolbar [data-action="flow"], .ptoolbar .btn-flow, .ptoolbar .chip-flow');
  if(!flowBtn) return;

  // 헤더 쪽 3버튼(또는 1장 첫 단락 옆에 추가된 3칩)을 찾아 동일한 편집기 호출로 연결
  const selectors = [
    '.chip-basic',      // 기본이해
    '.chip-structure',  // 내용구조
    '.chip-summary'     // 메세지요약
  ];
  const chips = [
    ...document.querySelectorAll(selectors.join(','))
  ];

  chips.forEach(chip=>{
    // 중복 바인딩 방지
    if(chip.dataset.wbpBind === 'ok') return;
    chip.dataset.wbpBind = 'ok';

    chip.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();

      // 다시 한 번: 다중 오픈 방지
      const openBooksNow = [...tree.querySelectorAll('details.book[open]')];
      if(openBooksNow.length !== 1){
        alert('편집기는 한 권만 열린 상태에서 사용할 수 있습니다.');
        return;
      }

      // 내용흐름 버튼의 편집기를 그대로 사용
      flowBtn.click();

      // 편집기 뜬 뒤, 제목만 해당 칩 텍스트로 교체(동일 UI 유지)
      // (편집기 DOM 클래스는 프로젝트에 맞춰 아래 후보 중 존재하는 것으로 적용)
      requestAnimationFrame(()=>{
        const dlg =
          document.querySelector('.flow-editor-modal')
          || document.querySelector('.editor-modal')
          || document.querySelector('.wbp-editor')
          || document.querySelector('.modal');

        const titleEl =
          dlg?.querySelector('.modal-title, .editor-title, .title');

        if(titleEl){
          titleEl.textContent = chip.textContent.trim();
        }
      });
    });
  });
}
// ===========================================================================

// 초기 바인딩(트리 렌더 이후에 1회)
document.addEventListener('wbp:treeBuilt', ()=>{
  bindBookHeadChipsToFlowEditor();
});

// 초기 로드 직후 한 번 시도(이미 렌더되어 있으면 즉시 연결)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindBookHeadChipsToFlowEditor);
} else {
  bindBookHeadChipsToFlowEditor();
}

// === [BOOK-CHIPS → FLOW EDITOR 재사용] =====================================
function bindBookChipsToFlowEditor(){
  const tree = document.getElementById('tree');
  if(!tree) return;

  // 현재 열린 책 수 확인 (2권 이상 열려 있으면 중단)
  const openedBooks = [...tree.querySelectorAll('details.book[open]')];
  if (openedBooks.length > 1) {
    alert('2개 이상 성경이 열려 있습니다. 한 권만 연 다음 다시 시도하세요.');
    return;
  }

  // 대상 책: 열려있으면 그 책, 없으면 첫 책
  const bookEl = openedBooks[0] || tree.querySelector('details.book');
  if(!bookEl) return;

  // 이 책의 1장/첫 단락에서 '내용흐름' 버튼(편집기 트리거)을 찾음
  const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
  const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
  if(!p1) return;

  const flowBtn =
    p1.querySelector('.ptoolbar [data-action="flow"]') ||
    p1.querySelector('.ptoolbar .btn-flow') ||
    p1.querySelector('.ptoolbar .chip-flow') ||
    p1.querySelector('.ptoolbar button:contains("내용흐름")'); // 최후 보정(필요시)

  if(!flowBtn) return;

  // 대상 칩(버튼): 각 책 1장 첫 단락 ‘설교’ 오른쪽에 배치된 3개
  // *프로젝트에 따라 클래스가 다를 수 있으므로 아래 셀렉터 중 존재하는 것만 매칭*
  const chips = [
    ...document.querySelectorAll(
      '.bookhead-chips .chip-basic, .bookhead-chips .chip-structure, .bookhead-chips .chip-summary,' +
      '.book-chips .chip-basic, .book-chips .chip-structure, .book-chips .chip-summary,' +
      '.chip-basic, .chip-structure, .chip-summary,' +
      '.bookhead-chips .book-chip[data-type="basic"], .bookhead-chips .book-chip[data-type="structure"], .bookhead-chips .book-chip[data-type="summary"]'
    )
  ];

  chips.forEach(chip=>{
    if(chip.dataset.flowBind === '1') return; // 중복 바인딩 방지
    chip.dataset.flowBind = '1';

    chip.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();

      // 클릭 시점에도 다중 오픈 방지 확인
      const openBooksNow = [...tree.querySelectorAll('details.book[open]')];
      if (openBooksNow.length !== 1 && openedBooks.length !== 1) {
        alert('편집기는 한 권만 열린 상태에서 사용할 수 있습니다.');
        return;
      }

      // ‘내용흐름’ 버튼 클릭을 그대로 위임 → 동일한 편집기/스타일 사용
      flowBtn.click();

      // 편집기 제목을 칩 라벨로 교체 (UI는 내용흐름 편집기를 그대로 사용)
      requestAnimationFrame(()=>{
        const dlg =
          document.querySelector('.flow-editor-modal') ||
          document.querySelector('.editor-modal') ||
          document.querySelector('.wbp-editor') ||
          document.querySelector('.modal');

        const titleEl =
          dlg?.querySelector('.modal-title') ||
          dlg?.querySelector('.editor-title') ||
          dlg?.querySelector('.title');

        if(titleEl){
          titleEl.textContent = (chip.textContent || '').trim();
        }
      });
    });
  });
}
// ============================================================================

// 렌더 완료 후 1회 바인딩
document.addEventListener('wbp:treeBuilt', ()=> {
  bindBookChipsToFlowEditor();
});

// 초기 로드 시점에도 보정
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindBookChipsToFlowEditor);
} else {
  bindBookChipsToFlowEditor();
}

// 초기/재렌더 훅 연결(중복 호출 허용, 내부에서 자체 가드)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindFlowEditorToBookChips);
} else {
  bindFlowEditorToBookChips();
}
document.addEventListener('wbp:treeBuilt', bindFlowEditorToBookChips);

// === [BOOK-CHIPS DIRECT BIND → 내용흐름 편집기 동일 기능] ================
// === [BOOK-CHIPS DIRECT BIND → UNIT CONTEXT 편집기 사용] ================
// === [BOOK-CHIPS DIRECT BIND → UNIT CONTEXT 편집기 사용] ================
function rebindBookChipsToFlowEditor(){
  const tree = document.getElementById('tree');
  if(!tree) return;

  // 열린 책 하나만 허용
  const openedBooks = [...tree.querySelectorAll('details.book[open]')];
  if(openedBooks.length > 1){
    alert('2개 이상 성경이 열려 있습니다. 한 권만 연 다음 시도하세요.');
    return;
  }

  const bookEl = openedBooks[0] || tree.querySelector('#tree > details.book');
  if(!bookEl) return;

  // 1장 첫 단락
  const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
  const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
  if(!p1) return;

  // 기본이해·내용구조·메세지요약 칩 (여러 형태 대응)
  const chips = [
    ...document.querySelectorAll(
      '.chip-basic, .chip-structure, .chip-summary, ' +
      '.book-chip[data-type="basic"], .book-chip[data-type="structure"], .book-chip[data-type="summary"]'
    )
  ];
  if(!chips.length) return;

  chips.forEach(chip=>{
    // 중복 방지
    if(chip.dataset.flowBound==='1') return;
    chip.dataset.flowBound='1';

    // 모든 기존 이벤트 제거 후 새로 바인딩
    const newChip = chip.cloneNode(true);
    chip.parentNode.replaceChild(newChip, chip);

    newChip.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();

      const nowOpen = [...tree.querySelectorAll('details.book[open]')];
      if(nowOpen.length > 1){
        alert('편집기는 한 권만 열린 상태에서 사용할 수 있습니다.');
        return;
      }

      // 1장 첫 단락의 book / chap / idx 정보 추출
      const paraTitle = p1.querySelector('summary .ptitle');
      const book  = paraTitle?.dataset.book || p1.dataset.book;
      const chap  = parseInt(paraTitle?.dataset.ch || p1.dataset.ch, 10) || 1;
      const idx   = parseInt(paraTitle?.dataset.idx || p1.dataset.idx, 10) || 0;

      // 칩 종류에 따라 type 결정
      let type = 'basic';
      if (newChip.classList.contains('chip-structure') || newChip.dataset.type === 'structure') {
        type = 'structure';      // 내용구조
      } else if (newChip.classList.contains('chip-summary') || newChip.dataset.type === 'summary') {
        type = 'summary';        // 메세지요약
      } else {
        type = 'basic';          // 기본이해
      }

      // 🔹 이제는 FLOW 편집기가 아니라 UNIT CONTEXT 편집기를 직접 사용
      //    → 저장 버튼은 saveUnitContext()만 호출하고, 창은 닫지 않음
      if (book != null && !Number.isNaN(chap) && !Number.isNaN(idx)) {
        openUnitContextEditor(book, chap, idx, type);
      } else {
        console.warn('openUnitContextEditor 호출용 book/chap/idx 정보를 찾지 못했습니다.', {book, chap, idx});
      }
    });
  });
}
// ==========================================================================

// 렌더 완료 후 1회 연결
document.addEventListener('wbp:treeBuilt', rebindBookChipsToFlowEditor);

// 초기 DOM 로드 시점에도 실행
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', rebindBookChipsToFlowEditor);
}else{
  rebindBookChipsToFlowEditor();
}

// =======================
//  UNIT CONTEXT 저장 루틴
// =======================

// 1) 서버 또는 로컬스토리지 저장 함수
async function saveUnitContext(type, book, chap, paraIdx, text){
  try {
    // 🔹 서버 저장 (API 사용 시)
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        type,
        book,
        chap,
        paraIdx,
        text
      })
    });

    // 🔹 실패시 로컬백업
    if (!res.ok){
      console.warn("API 저장 실패 → 로컬스토리지 백업");
      const key = `WBP3_UNITCTX:${book}:${chap}:${paraIdx}:${type}`;
      saveState(key, text);
    }

    status("저장되었습니다.");
  } catch (err){
    console.error(err);
    status("저장 실패(오프라인) → 로컬 백업");
    const key = `WBP3_UNITCTX:${book}:${chap}:${paraIdx}:${type}`;
    saveState(key, text);
  }
}


// =======================
//  편집기 저장 버튼 이벤트
// =======================
document.addEventListener('click', (e)=>{
  if (!e.target.closest) return;

  const btn = e.target.closest('[data-uc-save]');
  if (!btn) return;

  const host = document.getElementById('unitEditor');
  if (!host) return;

  const type     = host.dataset.type;
  const book     = host.dataset.book;
  const chap     = parseInt(host.dataset.ch, 10);
  const paraIdx  = parseInt(host.dataset.idx, 10);
  const textarea = host.querySelector('textarea');

  if (!textarea){
    alert("입력창을 찾을 수 없습니다.");
    return;
  }

  const text = textarea.value;

  saveUnitContext(type, book, chap, paraIdx, text);
});

// =======================
//  UNIT CONTEXT 편집기
//  (기본이해 / 내용흐름 / 메세지요약 공용)
// =======================
function openUnitContextEditor(book, chap, paraIdx, type){
  // 🔹 타입 기본값 (옛 코드에서 3개만 넘기는 경우 대비)
  if (!type) type = 'basic';

  // 🔹 타입 → 한글 라벨
  const typeLabelMap = {
    basic: '기본이해',
    structure: '내용흐름',
    flow: '내용흐름',
    summary: '메세지요약'
  };
  const typeLabel = typeLabelMap[type] || type;

  // 🔹 편집기 컨테이너 확보 (없으면 생성)
  let host = document.getElementById('unitEditor');
  if (!host){
    host = document.createElement('div');
    host.id = 'unitEditor';
    host.className = 'unit-editor-modal';
    document.body.appendChild(host);
  }

  // 🔹 어떤 단락을 편집 중인지 메타 정보 기록
  host.dataset.book = book;
  host.dataset.ch   = String(chap);
  host.dataset.idx  = String(paraIdx);
  host.dataset.type = type;

  // 🔹 화면 상단에 보여줄 단락 제목(선택)
  let refLabel = '';
  try {
    const paraSel = `details.para[data-book="${book}"][data-ch="${chap}"][data-idx="${paraIdx}"]`;
    const paraEl = document.querySelector(paraSel);
    const titleEl = paraEl?.querySelector('summary .ptitle');
    if (titleEl){
      refLabel = titleEl.textContent.trim();
    } else {
      refLabel = `${book} ${chap}장 단락 ${paraIdx + 1}`;
    }
  } catch (e){
    refLabel = `${book} ${chap}장 단락 ${paraIdx + 1}`;
  }

  // 🔹 편집기 HTML 템플릿
  host.innerHTML = `
    <div class="uc-wrap">
      <div class="uc-header">
        <div class="uc-title">
          <span class="uc-ref">${refLabel}</span>
          <span class="uc-type"> · ${typeLabel} 편집</span>
        </div>
        <button type="button" class="uc-close" data-uc-close>×</button>
      </div>
      <div class="uc-body">
        <textarea class="uc-input" spellcheck="false"
          placeholder="${typeLabel} 내용을 입력하세요"></textarea>
      </div>
      <div class="uc-footer">
        <button type="button" class="uc-save" data-uc-save>저장</button>
        <button type="button" class="uc-cancel" data-uc-close>닫기</button>
      </div>
    </div>
  `;

  // 🔹 로컬스토리지에 저장된 내용 불러오기
  const key   = `WBP3_UNITCTX:${book}:${chap}:${paraIdx}:${type}`;
  const saved = loadState(key, '');
  const ta    = host.querySelector('.uc-input');
  if (ta){
    ta.value = saved != null ? saved : '';
    ta.focus();
  }

  // 🔹 닫기 버튼 처리
  host.querySelectorAll('[data-uc-close]').forEach(btn=>{
    btn.onclick = () => {
      host.remove();
    };
  });
}


// =======================
//  localStorage 동기화 (서버 <-> 브라우저)
// =======================
document.addEventListener('DOMContentLoaded', async () => {
  // 서버에 저장된 localStorage를 불러와 브라우저에 적용
  try{
    const res = await fetch('/api/localstorage', { cache: 'no-store' });
    if (res.ok){
      const { items } = await res.json();
      if (items && typeof items === 'object'){
        Object.entries(items).forEach(([k,v]) => {
          try{
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          } catch(e){
            console.warn('[localstorage sync] set failed:', k, e);
          }
        });
        console.log('[localstorage sync] applied from server');
      }
    }
  } catch(e){
    console.warn('[localstorage sync] load failed:', e);
  }

  // 종료 직전 localStorage 전체를 서버에 업로드
  const uploadLocalStorage = () => {
    const items = {};
    for (let i=0; i<localStorage.length; i++){
      const k = localStorage.key(i);
      if (!k) continue;
      items[k] = localStorage.getItem(k);
    }
    const payload = JSON.stringify({ items });
    // sendBeacon을 우선 시도
    if (navigator.sendBeacon){
      const blob = new Blob([payload], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/localstorage', blob);
      if (ok) return;
    }
    // fallback
    fetch('/api/localstorage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(err => console.warn('[localstorage sync] upload failed:', err));
  };

  window.addEventListener('beforeunload', uploadLocalStorage);
});

})();
