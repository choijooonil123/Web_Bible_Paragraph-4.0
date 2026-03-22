/* --------- Utils --------- */

function ensureBookHeadChips(){ return; }
window.ensureBookHeadChips = ensureBookHeadChips;

function ensureGlobalBookChips(){ return; }
window.ensureGlobalBookChips = ensureGlobalBookChips;

const BOOK_UNIT_NS = 'WBP3_BOOKUNIT';

function _bookKeyFromSummary(sumEl, type){
  if (!sumEl) return null;
  const btitle = sumEl.querySelector('.btitle');
  const dataBook = btitle?.dataset?.book || sumEl.dataset?.book;
  const bookId = (dataBook || (btitle?.textContent || sumEl.textContent || '').trim()).replace(/\s+/g, ' ');
  if (!bookId) return null;
  return `${BOOK_UNIT_NS}:${bookId}:${type}`;
}

function _ensureBookUnitEditorHost(){
  let host = document.getElementById('unitEditor');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'unitEditor';
  host.className = 'unit-editor';
  host.innerHTML = `
    <header>
      <div class="ue-title">책 메모</div>
      <div class="ue-actions">
        <button type="button" id="ueSave">저장</button>
        <button type="button" id="ueClose">닫기</button>
      </div>
    </header>
    <textarea id="ueText" placeholder="여기에 내용을 입력하세요."></textarea>
  `;
  document.body.appendChild(host);
  host.querySelector('#ueClose')?.addEventListener('click', ()=> { host.style.display = 'none'; });
  host.querySelector('#ueSave')?.addEventListener('click', ()=>{
    const key = host.dataset.key;
    if (key) saveState(key, host.querySelector('#ueText')?.value || '');
  });
  return host;
}

function openBookEditor(type, sumEl){
  const sum = sumEl || document.querySelector('details.book[open] > summary');
  if (!sum) return;
  const key = _bookKeyFromSummary(sum, type);
  if (!key) return;
  const host = _ensureBookUnitEditorHost();
  host.dataset.key = key;
  host.querySelector('.ue-title').textContent = `책 메모 (${type})`;
  host.querySelector('#ueText').value = loadState(key, '') || '';
  host.style.display = 'flex';
}

function ensureBookChips(){ return; }
function ensureUnitGlobalChips(){ return; }

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
      <div class="ue-title">?⑥쐞 ?먮뵒??/div>
      <div class="ue-actions">
        <button type="button" id="ueSave">???/button>
        <button type="button" id="ueClose">?リ린</button>
      </div>
    </header>
    <textarea id="ueText" placeholder="?ш린???댁슜???낅젰?섏꽭?? (?먮룞???"></textarea>
  `;
  document.body.appendChild(host);

  // ?リ린
  host.querySelector('#ueClose').addEventListener('click', ()=> { host.style.display='none'; });
  // ???(?섎룞)
  host.querySelector('#ueSave').addEventListener('click', ()=>{
    const key = host.dataset.key;
    if (key) saveState(key, host.querySelector('#ueText').value || '');
  });
  // ?먮룞???(?붾컮?댁뒪)
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
  if(!t){ alert('?대┛ ?⑤씫??李얠쓣 ???놁뒿?덈떎.'); return; }

  const key = _unitKeyFromTitleEl(t, type);
  if(!key){ alert('???앹꽦 ?ㅻ쪟: data-book/ch/idx ?뺤씤'); return; }

  const host = _ensureUnitEditorHost();
  const label = type === 'basic' ? '湲곕낯?댄빐' : (type === 'structure' ? '?댁슜援ъ“' : '硫붿꽭吏?붿빟');

  host.dataset.key = key;
  host.querySelector('.ue-title').textContent = `?⑥쐞 ?먮뵒????${label}`;
  host.querySelector('#ueText').value = loadState(key, '') || '';
  host.style.display = 'flex';
  host.querySelector('#ueText').focus();
}

// ===== [FORMAT-PERSIST BACKUP] ?대낫?닿린/媛?몄삤湲??좏떥 (WBP3_FMT) BEGIN =====
// const FMT_NS = typeof FMT_NS === 'string' ? FMT_NS : 'WBP3_FMT'; // ?대? ?덉쑝硫??ъ궗??

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
    if (typeof status === 'function') status(`?쒖떇 ?대낫?닿린 ?꾨즺 (${items.length}媛?`);
  }catch(e){
    console.error(e);
    alert('?쒖떇 ?대낫?닿린 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
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
        // ?덉슜 ?щ㎎: {ns, exportedAt, items:[{key,value}]} ?먮뒗 { "<key>": <value>, ... }
        let kvList = [];
        if (Array.isArray(json.items)) {
          kvList = json.items;
        } else {
          kvList = Object.keys(json).map(k => ({ key: k, value: json[k] }));
        }
        // ?ㅼ엫?ㅽ럹?댁뒪 ?ㅻ쭔 諛섏쁺
        const onlyFmt = kvList.filter(rec => typeof rec.key === 'string' && rec.key.startsWith(FMT_NS + ':'));
        if (onlyFmt.length === 0) {
          alert('媛?몄삱 WBP ?쒖떇 ?ㅻ? 李얠? 紐삵뻽?듬땲??');
          return;
        }
        // ??뼱?곌린 ?뺤씤
        const overwrite = confirm(`${onlyFmt.length}媛쒖쓽 ?쒖떇 ?곗씠?곕? 媛?몄샃?덈떎.\n?숈씪 ?ㅻ뒗 ??뼱?곌린 ?⑸땲?? 怨꾩냽?좉퉴??`);
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
        if (typeof status === 'function') status(`?쒖떇 媛?몄삤湲??꾨즺 (${applied}媛??곸슜)`);
        alert(`媛?몄삤湲??꾨즺: ${applied}媛??곸슜`);
      }catch(e){
        console.error(e);
        alert('?쒖떇 媛?몄삤湲?以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. JSON ?뺤떇???뺤씤?섏꽭??');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
// ===== [FORMAT-PERSIST BACKUP] ?대낫?닿린/媛?몄삤湲??좏떥 (WBP3_FMT) END =====

// ===== [FORMAT-PERSIST/RUNS] ?꾩튂?뺣낫(?ㅽ봽?? 異붿텧 諛?HTML ?ш뎄???좏떥 BEGIN =====
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
      const cps = [...chunk]; // ?좊땲肄붾뱶 ?덉쟾
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
  // ?좊땲肄붾뱶 ?덉쟾 臾몄옄 諛곗뿴
  const cps = [...String(text||'')];

  // ?꾩튂蹂??쒖옉/???몃뜳??留?
  const starts = new Map(), ends = new Map();
  (spans||[]).forEach(sp => {
    if (!starts.has(sp.start)) starts.set(sp.start, []);
    starts.get(sp.start).push(sp);
    if (!ends.has(sp.end)) ends.set(sp.end, []);
    ends.get(sp.end).push(sp);
  });

  // ?쒓렇 ?닿린/?リ린
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

  // ?꾩옱 ?쒖꽦 ?띿꽦 ?ㅽ깮(?⑥닚 蹂묓빀 ?꾨왂)
  const active = [];
  const out = [];

  for (let i=0;i<=cps.length;i++){
    // 癒쇱? ?リ린
    if (ends.has(i)){
      if (active.length){
        const merged = active.reduce((m,a)=>Object.assign(m,a),{});
        out.push(closeTags(merged));
        active.length = 0;
      }
    }
    // 洹??ㅼ쓬 ?닿린
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
    // 蹂몃Ц 臾몄옄 異붽?
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

// ===== [FORMAT-PERSIST] WBP-3.0 ?덈Ц???쒖떇 ???蹂듭썝 (localStorage, v2 runs) BEGIN =====

// ---- (ADD) ?꾩옱 ?대┛ ?⑤씫 ?쒖떇珥덇린??----
function clearFormatForOpenPara(){
  // 1) ?꾩옱 ?대┛ ?⑤씫 而⑦뀓?ㅽ듃
  const ctx = (typeof getOpenParaKeyAndEls === 'function') ? getOpenParaKeyAndEls() : null;
  if(!ctx){ alert('?대젮?덈뒗 ?⑤씫??李얠쓣 ???놁뒿?덈떎.'); return; }

  // 2) localStorage ??λ낯 ??젣 (洹??⑤씫留?
  try{
    localStorage.removeItem(ctx.key);
  }catch(e){
    console.warn('localStorage remove ?ㅽ뙣:', e);
  }

  // 3) ?붾㈃???몃씪???쒖떇 ?쒓굅 (.pline .content ?곗꽑)
  const SKIP_SELECTOR = 'sup, sup.pv, .pv, .pvnum, .verse-no'; // ?덈쾲???깆? 嫄대뱶由ъ? ?딆쓬
  const isEmptyStyle = (el) => !el.getAttribute('style') || el.getAttribute('style').trim()==='';

  const stripInlineFormat = (root)=>{
    if(!root) return;
    // 援듦쾶/湲곗슱??諛묒쨪/痍⑥냼??mark/font ???몃옪 (?쒓렇 ?쒓굅, ?띿뒪?몃쭔 ?④?)
    root.querySelectorAll('b,i,u,s,mark,font').forEach(el=>{
      if (el.matches(SKIP_SELECTOR)) return;
      const frag = document.createDocumentFragment();
      while(el.firstChild) frag.appendChild(el.firstChild);
      el.replaceWith(frag);
    });
    // span????諛곌꼍???쒓굅. ?몃え?놁뼱吏硫??몃옪
    root.querySelectorAll('span').forEach(el=>{
      if (el.matches(SKIP_SELECTOR)) return;
      const style = el.getAttribute('style') || '';
      // ??愿???띿꽦 鍮꾩슦湲?
      el.style && (el.style.color = '', el.style.backgroundColor = '');
      // color/background留??덉뿀??寃쎌슦 style 鍮꾩슦湲?
      if (style) {
        const s = el.getAttribute('style') || '';
        if (!s || s.trim()==='') el.removeAttribute('style');
      }
      // ?대옒???곗씠???꾩씠????硫뷀?媛 ?녾퀬 style???놁쑝硫??몃옪
      if (!el.classList.length && !el.attributes.length) {
        const frag = document.createDocumentFragment();
        while(el.firstChild) frag.appendChild(el.firstChild);
        el.replaceWith(frag);
      }
    });
  };

  // 媛??덈Ц?μ뿉 ?곸슜
  for (const lineEl of ctx.lineEls){
    const root = lineEl.matches('.content') ? lineEl : (lineEl.querySelector('.content') || lineEl);
    stripInlineFormat(root);
  }

  // 4) ?곹깭 ?쒖떆
  if (typeof status === 'function') status('?쒖떇珥덇린???꾨즺 (?대떦 ?⑤씫留?');
}

// FMT_NS???꾩そ(????쒖뒪???뱀뀡)?먯꽌 ?뺤쓽??

function getOpenParaKeyAndEls(){
  // ?꾩옱 ?대젮?덈뒗 ?⑤씫(details.para[open])怨???援ъ꽦
  const openPara = document.querySelector('details.para[open]');
  if(!openPara) return null;

  const t = openPara.querySelector('summary .ptitle');
  if(!t) return null;

  const book = t.dataset.book;
  const ch   = t.dataset.ch;
  const idx  = t.dataset.idx;
  if(!book || !ch || !idx) return null;

  // ?덈Ц???쇱씤) ?섎━癒쇳듃 ?섏쭛: .pline .content ?곗꽑, ?놁쑝硫?.pline ?먯껜
  const candidates = openPara.querySelectorAll('.pline .content, .pline');
  const lineEls = Array.from(candidates).filter(el => !el.matches('details, summary'));

  const key = `${FMT_NS}:${book}:${ch}:${idx}`;
  return { key, openPara, lineEls };
}

function saveFormatForOpenPara(){
  const ctx = getOpenParaKeyAndEls();
  if(!ctx){ alert('?대젮?덈뒗 ?⑤씫??李얠쓣 ???놁뒿?덈떎.'); return; }

  const lines = ctx.lineEls.map(el => {
    const root = el.matches('.content') ? el : (el.querySelector('.content') || el);
    const { text, spans } = _collectTextAndRuns(root);
    return { html: root.innerHTML, text, spans };
  });

  const payload = { v: 2, savedAt: Date.now(), lines };
  try{
    saveState(ctx.key, payload);
    status && status('?쒖떇 ????꾨즺 (?뺣?: ?꾩튂?뺣낫 ?ы븿)');
  }catch(e){
    console.error(e);
    alert('?쒖떇 ???以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
  }
}

function restoreFormatForOpenPara(){
  const ctx = getOpenParaKeyAndEls();
  if(!ctx){ alert('?대젮?덈뒗 ?⑤씫??李얠쓣 ???놁뒿?덈떎.'); return; }

  const data = loadState(ctx.key, null);
  if(!data){ alert('??λ맂 ?쒖떇???놁뒿?덈떎. 癒쇱? [?쒖떇??????ㅽ뻾?섏꽭??'); return; }
  if(!data || !Array.isArray(data.lines)){ alert('??λ맂 ?쒖떇 ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎.'); return; }

  const n = Math.min(ctx.lineEls.length, data.lines.length);
  for (let i=0; i<n; i++){
    const el = ctx.lineEls[i];
    const root = el.matches('.content') ? el : (el.querySelector('.content') || el);
    const rec = data.lines[i] || {};
    if (rec.text && Array.isArray(rec.spans)){
      // runs 湲곕컲 蹂듭썝
      root.innerHTML = _wrapRunsToHTML(rec.text, rec.spans);
    } else if (rec.html){
      // 援ы삎 ??λ낯 ?명솚
      root.innerHTML = rec.html;
    }
  }
  status && status('?쒖떇 ?뚮났 ?꾨즺 (runs 湲곕컲)');
}

// ===== [FORMAT-PERSIST] WBP-3.0 ?덈Ц???쒖떇 ???蹂듭썝 (localStorage, v2 runs) END =====

// ===== [FORMAT-PERSIST UI] 踰꾪듉 ?앹꽦/諛붿씤??BEGIN =====
// === [FORMAT-PERSIST UI] 踰꾪듉 ?앹꽦/諛곗튂 ???ㅻ뜑(?댁슜媛?몄삤湲???濡??대룞 ===
function ensureFormatButtons(){
  const doc = document;
  const anchor = doc.getElementById('btnImportAll');
  const host = (anchor && anchor.parentElement) || doc.querySelector('header') || doc.body;
  const mkBtn = (id, label) => {
    let b = doc.getElementById(id);
    if (b) return b;
    b = doc.createElement('button');
    b.id = id;
    b.type = 'button';
    b.className = 'fmt-btn';
    b.style.marginLeft = '6px';
    b.textContent = label;
    return b;
  };
  const btnSave = mkBtn('btnFmtSave', '서식저장');
  const btnLoad = mkBtn('btnFmtLoad', '서식복원');
  const btnExp = mkBtn('btnFmtExport', '서식내보내기');
  const btnImp = mkBtn('btnFmtImport', '서식가져오기');
  if (anchor) {
    anchor.insertAdjacentElement('afterend', btnSave);
    anchor.insertAdjacentElement('afterend', btnLoad);
    anchor.insertAdjacentElement('afterend', btnExp);
    anchor.insertAdjacentElement('afterend', btnImp);
  } else {
    host.append(btnImp, btnExp, btnLoad, btnSave);
  }
  btnSave.onclick = saveFormatForOpenPara;
  btnLoad.onclick = restoreFormatForOpenPara;
  btnExp.onclick = wbpExportFormats;
  btnImp.onclick = wbpImportFormatsFromFile;
}

function safeBindFmtButtons(){
  try{ ensureFormatButtons(); }
  catch(e){ console.error('ensureFormatButtons error:', e); }
  // 踰꾪듉 ?됱긽 ?낅뜲?댄듃
  updateButtonColors();
}

/* ??踰꾪듉 ?됱긽 ?낅뜲?댄듃 (??λ맂 ?곗씠?곌? ?덉쑝硫??됯퉼 ?쒖떆) */
function updateButtonColors(){
  try {
    // 1. ?댁슜?대낫?닿린 踰꾪듉 - ??λ맂 ?곗씠?곌? ?덈뒗吏 ?뺤씤
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
    
    // 2. ?쒖떇?대낫?닿린 踰꾪듉 - ??λ맂 ?쒖떇???덈뒗吏 ?뺤씤
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
    
    // 3. ?쒖떇???踰꾪듉 - ??λ맂 ?쒖떇???덈뒗吏 ?뺤씤
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
    console.error('[updateButtonColors] ?ㅻ쪟:', e);
  }
}

/* ????λ맂 ?댁슜 ?곗씠???뺤씤 */
function hasStoredContent(){
  try {
    const keys = [STORAGE_SERMON, STORAGE_UNIT_CTX, STORAGE_WHOLE_CTX, STORAGE_COMMENTARY, STORAGE_SUMMARY];
    for (const key of keys) {
      const data = loadState(key, null);
      if (data !== null && data !== undefined) {
        // 媛앹껜??寃쎌슦 鍮?媛앹껜媛 ?꾨땶吏 ?뺤씤
        if (typeof data === 'object' && !Array.isArray(data)) {
          const keys = Object.keys(data);
          // 硫뷀? ?꾨뱶 ?쒖쇅?섍퀬 ?ㅼ젣 ?곗씠?곌? ?덈뒗吏 ?뺤씤
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
    console.error('[hasStoredContent] ?ㅻ쪟:', e);
    return false;
  }
}

/* ????λ맂 ?쒖떇 ?곗씠???뺤씤 */
function hasStoredFormat(){
  try {
    // WBP_FMT.map ?뺤씤 (index.html?먯꽌 ?뺤쓽??
    if (typeof window.WBP_FMT !== 'undefined' && window.WBP_FMT && window.WBP_FMT.map) {
      const map = window.WBP_FMT.map;
      const keys = Object.keys(map);
      if (keys.length > 0) {
        // ?ㅼ젣 ?곗씠?곌? ?덈뒗吏 ?뺤씤
        const hasData = keys.some(k => map[k] !== null && map[k] !== undefined && map[k] !== '');
        if (hasData) return true;
      }
    }
    
    // localStorage?먯꽌 吏곸젒 ?뺤씤
    const fmtData = loadState('wbps.versefmt.v2', {});
    if (fmtData && typeof fmtData === 'object' && !Array.isArray(fmtData)) {
      const keys = Object.keys(fmtData);
      // 硫뷀? ?꾨뱶 ?쒖쇅?섍퀬 ?ㅼ젣 ?곗씠?곌? ?덈뒗吏 ?뺤씤
      const hasData = keys.some(k => !k.startsWith('_') && fmtData[k] !== null && fmtData[k] !== undefined && fmtData[k] !== '');
      if (hasData) return true;
    }
    
    return false;
  } catch (e) {
    console.error('[hasStoredFormat] ?ㅻ쪟:', e);
    return false;
  }
}
// ===== [FORMAT-PERSIST UI] 踰꾪듉 ?앹꽦/諛붿씤??END =====

// ===== [UNIT-EDITOR] ptitle ??踰꾪듉 二쇱엯 (?꾨갑??寃ш퀬 踰꾩쟾) =====
function ensureUnitChips(){
  // ?대젮?덈뒗 ?⑤씫???놁쑝硫?紐⑤뱺 ?⑤씫???쒕룄(理쒖큹 濡쒕뱶 ?鍮?
  const paras = document.querySelectorAll('details.para');
  if (!paras.length) return;

  paras.forEach(para => {
    const sum = para.querySelector('summary');
    if (!sum) return;

    // 1) ptitle ?뺣낫: ?놁쑝硫?summary ?띿뒪?몃? 媛먯떥???앹꽦
    let t = sum.querySelector('.ptitle');
    if (!t) {
      t = document.createElement('span');
      t.className = 'ptitle';
      // summary 泥?踰덉㎏ ?몃뱶媛 ?띿뒪?몃씪硫?洹??띿뒪?몃? ptitle濡????
      const first = sum.firstChild;
      if (first && first.nodeType === Node.TEXT_NODE) {
        t.textContent = first.nodeValue.trim();
        first.nodeValue = '';
        sum.insertBefore(t, sum.firstChild);
      } else {
        // ?띿뒪?멸? ?놁쑝硫?summary 留??욎뿉 鍮?ptitle ?쎌엯
        sum.insertBefore(t, sum.firstChild);
      }
    }

    // 2) ?대? ?덉쑝硫?以묐났 ?앹꽦 湲덉?
    if (t.querySelector('.unit-chips')) return;

    // 3) 踰꾪듉 ?쎌엯
    const wrap = document.createElement('span');
    wrap.className = 'unit-chips';
    wrap.innerHTML = `
      <button type="button" class="unit-chip" data-type="basic">湲곕낯?댄빐</button>
      <button type="button" class="unit-chip" data-type="structure">?댁슜援ъ“</button>
      <button type="button" class="unit-chip" data-type="summary">硫붿꽭吏?붿빟</button>
    `;
    t.appendChild(wrap);

    // 4) ?대┃??summary ?좉?濡??꾪뙆?섏? ?딅룄濡?李⑤떒 + ?먮뵒???닿린
    if (!wrap.dataset.bound) {
      wrap.addEventListener('click', (e)=>{
        e.stopPropagation(); // summary???닿린/?リ린 諛⑹?
        const btn = e.target.closest('.unit-chip');
        if (!btn) return;
        // ?⑤씫???ロ? ?덉쑝硫??닿린
        if (!para.hasAttribute('open')) para.setAttribute('open','');
        // ?먮뵒???ㅽ뻾
        openUnitEditor(btn.dataset.type);
        e.preventDefault(); // 紐⑤컮???붾툝????諛⑹?
      });
      wrap.dataset.bound = '1';
    }

    // 4) ?대┃ 泥섎━ (?ㅽ뵂 ?⑤씫 湲곗??쇰줈 ?먮뵒???닿린)
    wrap.addEventListener('click', (e)=>{
      const btn = e.target.closest('.unit-chip');
      if (!btn) return;
      // ??踰꾪듉???랁븳 ?⑤씫??"?대┛" ?곹깭濡?留뚮뱾怨??먮뵒???몄텧
      if (!para.hasAttribute('open')) para.setAttribute('open','');
      openUnitEditor(btn.dataset.type);
    });
  });
}

// ===== [FLOATING SELECTION TOOLBAR] ?좏깮 ???묒? ?대컮 ?몄텧 =====
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
    <input type="color" id="wbp-color-picker" title="?됱긽 ?좏깮" style="width:34px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,.06);padding:0">
    <div class="divider"></div>
    <button type="button" id="wbp-save-format">???/button>
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
  // ?됱긽 ?낅젰 泥섎━ (input ?대깽??
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

// ?먮룞 珥덇린???쒕룄
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

// ?쒕ぉ 蹂寃?諛섏쁺
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

// JSON ?ㅼ슫濡쒕뱶
function downloadBibleJSON(){
  if(!BIBLE){ alert('BIBLE ?곗씠?곌? ?놁뒿?덈떎.'); return; }
  const blob = new Blob([JSON.stringify(BIBLE, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bible-paragraphs.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  status('?섏젙??JSON???ㅼ슫濡쒕뱶?덉뒿?덈떎.');
}

/* ==== ?꾩껜 ?곗씠??諛깆뾽/蹂듭썝 ==== */
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
const FMT_NS = 'WBP3_FMT';  // ?쒖떇 ?ㅼ엫?ㅽ럹?댁뒪 (validateState?먯꽌 ?ъ슜)

// ===== [?듯빀 ????쒖뒪??v4] =====
const STORAGE_VERSION = 4;
const STORAGE_SCHEMA_PREFIX = 'wbps.v4';

// Deep copy ?좏떥由ы떚
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

// Shallow clone ?좏떥由ы떚
function shallowClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Array) return [...obj];
  if (typeof obj === 'object') return { ...obj };
  return obj;
}

// ??????곗씠???좏슚??寃??
function validateState(key, value) {
  if (key === null || key === undefined || typeof key !== 'string') {
    console.warn('[validateState] Invalid key:', key);
    return false;
  }
  if (value === undefined) {
    console.warn('[validateState] Value is undefined for key:', key);
    return false;
  }
  // ?뱀젙 ?ㅼ뿉 ???異붽? 寃利?
  if (key.startsWith('WBP3_FMT:') || key.startsWith(FMT_NS + ':')) {
    if (typeof value === 'object' && value !== null) {
      if (!value.hasOwnProperty('v') && !value.hasOwnProperty('version')) {
        console.warn('[validateState] Format data missing version:', key);
        // 踰꾩쟾 ?뺣낫媛 ?놁뼱???덉슜 (援ы삎 ?곗씠???명솚)
      }
    }
  }
  return true;
}

// ????ㅽ뙣 ??諛깆뾽 ?앹꽦
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

// ?댁쟾 踰꾩쟾 ?ㅽ궎留??먮룞 蹂??(v3 ??v4)
function migrateState(key, rawValue) {
  try {
    // v3 ?ㅽ궎留?媛먯? 諛?蹂??
    if (key.startsWith('wbps.') && !key.includes('.v4')) {
      // v3 ?ㅻ? v4濡?留덉씠洹몃젅?댁뀡
      const migratedKey = key.replace(/\.v(\d+)$/, '.v4');
      if (migratedKey !== key) {
        console.log(`[migrateState] Migrating ${key} ??${migratedKey}`);
        // 湲곗〈 ?곗씠?곕? ???ㅻ줈 蹂듭궗
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
    
    // 媛??먯껜??踰꾩쟾 ?뺣낫媛 ?녿뒗 寃쎌슦 異붽?
    if (typeof rawValue === 'string') {
      try {
        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed === 'object' && !parsed._version) {
          parsed._version = STORAGE_VERSION;
          return { key, value: parsed };
        }
      } catch (e) {
        // JSON???꾨땶 寃쎌슦 洹몃?濡?諛섑솚
      }
    }
    
    return { key, value: rawValue };
  } catch (e) {
    console.error('[migrateState] Migration error:', e);
    return { key, value: rawValue };
  }
}

// "**" ?쒓굅 ?⑥닔 (?ш??곸쑝濡?紐⑤뱺 臾몄옄?댁뿉???쒓굅)
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
        // 硫뷀? ?꾨뱶(_version, _savedAt ?????쒖쇅
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

// ?⑥씪 ????⑥닔
function saveState(key, value, options = {}) {
  if (!validateState(key, value)) {
    console.error('[saveState] Validation failed for key:', key);
    return false;
  }

  try {
    // ???吏곸쟾 deep copy
    const dataToSave = deepCopy(value);
    
    // "**" ?쒓굅 (紐⑤뱺 臾몄옄?댁뿉??
    const cleanedData = removeBoldMarkers(dataToSave);
    
    // ?ㅽ궎留덉뿉 踰꾩쟾 ?뺣낫 異붽?
    let finalValue = cleanedData;
    if (typeof cleanedData === 'object' && cleanedData !== null && !Array.isArray(cleanedData)) {
      finalValue = {
        ...cleanedData,
        _version: STORAGE_VERSION,
        _savedAt: Date.now()
      };
    }
    
    // JSON 吏곷젹??
    const serialized = typeof finalValue === 'string' 
      ? finalValue 
      : JSON.stringify(finalValue);
    
    // ????쒕룄
    localStorage.setItem(key, serialized);
    
    // 踰꾪듉 ?됱긽 ?낅뜲?댄듃 (?댁슜 ?먮뒗 ?쒖떇 愿???ㅼ씤 寃쎌슦)
    if (key === STORAGE_SERMON || key === STORAGE_UNIT_CTX || key === STORAGE_WHOLE_CTX || 
        key === STORAGE_COMMENTARY || key === STORAGE_SUMMARY || key === 'wbps.versefmt.v2') {
      setTimeout(updateButtonColors, 100);
    }
    
    // ???吏곹썑 shallow clone?쇰줈 ?뺤씤
    const saved = shallowClone(finalValue);
    
    // ????깃났 ?대깽??諛쒖깮
    if (!options.silent) {
      window.dispatchEvent(new CustomEvent('wbps:stateSaved', {
        detail: { key, value: saved }
      }));
    }
    
    return true;
  } catch (e) {
    console.error('[saveState] Save failed:', e);
    // ????ㅽ뙣 ??諛깆뾽 ?앹꽦
    backupState(key, value);
    return false;
  }
}

// ????몄텧 ?뺢퇋??(debounce) - ?⑥씪 ?대깽??猷⑦봽
const saveQueue = new Map();
let saveTimer = null;
const DEFAULT_SAVE_DELAY = 300;

// ?듯빀 ????대깽???몃뱾??
function debounceSave(key, value, delay = DEFAULT_SAVE_DELAY) {
  // ?먯뿉 異붽?
  saveQueue.set(key, value);
  
  // 湲곗〈 ??대㉧ 痍⑥냼
  if (saveTimer) clearTimeout(saveTimer);
  
  // ????대㉧ ?ㅼ젙
  saveTimer = setTimeout(() => {
    // ?먯쓽 紐⑤뱺 ??ぉ ???
    const count = saveQueue.size;
    const savedKeys = [];
    for (const [k, v] of saveQueue.entries()) {
      if (saveState(k, v, { silent: true })) {
        savedKeys.push(k);
      }
    }
    saveQueue.clear();
    saveTimer = null;
    
    // ?쇨큵 ????꾨즺 ?대깽??
    window.dispatchEvent(new CustomEvent('wbps:batchSaved', {
      detail: { count, savedKeys }
    }));
  }, delay);
}

// ?꾩뿭 ????대깽??由ъ뒪???듯빀
(function setupUnifiedSaveEventLoop() {
  // 紐⑤뱺 ????붿껌???⑥씪 ?대깽?몃줈 泥섎━
  window.addEventListener('wbps:saveRequest', (e) => {
    const { key, value, delay } = e.detail || {};
    if (key !== undefined && value !== undefined) {
      debounceSave(key, value, delay || DEFAULT_SAVE_DELAY);
    }
  }, { capture: true });
  
  // 利됱떆 ????붿껌 (debounce ?놁쓬)
  window.addEventListener('wbps:saveImmediate', (e) => {
    const { key, value } = e.detail || {};
    if (key !== undefined && value !== undefined) {
      saveState(key, value);
    }
  }, { capture: true });

})();

// ?듯빀 濡쒕뵫 ?⑥닔
function loadState(key, defaultValue = null, options = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }
    
    // 留덉씠洹몃젅?댁뀡 泥댄겕
    if (options.migrate !== false) {
      const migrated = migrateState(key, raw);
      if (migrated.key !== key) {
        // 留덉씠洹몃젅?댁뀡??寃쎌슦 ???ㅻ줈 ?ㅼ떆 濡쒕뱶
        return loadState(migrated.key, defaultValue, { migrate: false });
      }
    }
    
    // ?뚯떛 ?쒕룄
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      // JSON???꾨땶 寃쎌슦 ?먮낯 諛섑솚
      return raw;
    }
  } catch (e) {
    console.error('[loadState] Load failed:', e);
    return defaultValue;
  }
}

// 珥덇린?????먮룞 留덉씠洹몃젅?댁뀡 ?ㅽ뻾
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
// ===== [?듯빀 ????쒖뒪??v4] END =====

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
  status('?꾩껜 ?곗씠?곕? ?대낫?덉뒿?덈떎.');
}
async function importAllData(file){
  try{
    const text = await file.text();
    const json = JSON.parse(text);
    if(!json || json.__wbps!==1 || !json.items){ alert('諛깆뾽 ?뚯씪 ?뺤떇???꾨떃?덈떎.'); return; }
    if(!confirm('??諛깆뾽?쇰줈 ?꾩옱 湲곌린???곗씠?곕? ??뼱?멸퉴??')) return;
    Object.entries(json.items).forEach(([k,v])=>{
      if(v===null || v===undefined) localStorage.removeItem(k);
      else saveState(k, v);
    });
    status('媛?몄삤湲곌? ?꾨즺?섏뿀?듬땲?? ?섏씠吏瑜??덈줈怨좎묠?섎㈃ 諛섏쁺?⑸땲??');
  }catch(e){
    console.error(e);
    alert('媛?몄삤湲?以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
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

let BIBLE = null;
let CURRENT = { book:null, chap:null, paraIdx:null, paraId:null };
let READER = { playing:false, q:[], idx:0, synth:window.speechSynthesis||null, scope:null, btn:null, continuous:false };
let EDITOR_READER = { playing:false, u:null, synth:window.speechSynthesis||null };

/* --------- Boot --------- */
(async function boot(){
  const startTime = performance.now();
  
  try {
    // ?? IndexedDB 罹먯떛 ?쒖뒪???ъ슜 (?щ갑臾???利됱떆 濡쒕뵫!)
    if (window.__WBP_BIBLE_CACHE__?.loadBible) {
      BIBLE = await window.__WBP_BIBLE_CACHE__.loadBible();
    } else {
      // fallback: 罹먯떛 ?쒖뒪?쒖씠 ?놁쑝硫?吏곸젒 fetch
      try {
        BIBLE = await tryFetchJSON('bible-paragraphs.json');
      } catch(_) {
        BIBLE = await tryFetchJSON('bible_paragraphs.json');
      }
    }
  } catch(e) {
    status('bible-paragraphs.json??李얠쓣 ???놁뒿?덈떎. 媛숈? ?대뜑???먭퀬 ?ㅼ떆 ?댁뼱二쇱꽭??');
    console.error('[Boot] ?깃꼍 ?곗씠??濡쒕뱶 ?ㅽ뙣:', e);
    return;
  }
  
  buildTree();
  ensureSermonButtons();   // ?뵩 ?ㅺ탳 踰꾪듉 ?꾨씫 ??蹂닿컯
  
  const loadTime = (performance.now() - startTime).toFixed(0);
  status(`遺덈윭?ㅺ린 ?꾨즺 (${loadTime}ms). 66沅??몃━媛 ?쒖꽦?붾릺?덉뒿?덈떎.`);
  console.log(`[Boot] ???꾩껜 珥덇린???꾨즺: ${loadTime}ms`);
  
  await setupVoices();
  
  // ?꾨줈洹몃옩 ?쒖옉 ???ㅺ탳紐⑸줉 ?먮룞 ?쒖떆 鍮꾪솢?깊솕 (?ㅺ탳紐⑸줉 踰꾪듉???뚮윭???쒖떆??
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
    return l.startsWith('ko') || n.includes('korean') || n.includes('?쒓뎅') || n.includes('korea');
  });
}
function presetsForSingleVoice(){
  return [
    {id:'preset-soft-low',  label:'부드럽게 낮게', rate:0.85, pitch:0.85},
    {id:'preset-soft-high', label:'부드럽게 높게', rate:0.90, pitch:1.20},
    {id:'preset-fast',      label:'빠르게', rate:1.20, pitch:1.05},
    {id:'preset-bright',    label:'밝게', rate:1.05, pitch:1.25},
    {id:'preset-radio',     label:'차분하게', rate:1.00, pitch:0.90},
    {id:'preset-reading',   label:'낭독체', rate:0.95, pitch:1.00},
  ];
}
async function setupVoices(){
  if (!voiceSelect) return;

  const all = await waitForVoices();
  const kos = getKoreanVoices(all);

  voiceSelect.innerHTML = '';
  const def = document.createElement('option');
  def.value = JSON.stringify({type:'default'});
  def.textContent = '브라우저 기본(ko-KR)';
  voiceSelect.appendChild(def);

  if (kos.length > 0) {
    const og = document.createElement('optgroup');
    og.label = '한국어 음성';
    kos.forEach(v => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({type:'voice', uri:v.voiceURI});
      opt.textContent = `${v.name} / ${v.lang}${v.localService ? ' (로컬)' : ''}`;
      og.appendChild(opt);
    });
    voiceSelect.appendChild(og);
  }

  if (kos.length <= 1) {
    const pg = document.createElement('optgroup');
    pg.label = '프리셋';
    presetsForSingleVoice().forEach(p => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({type:'preset', rate:p.rate, pitch:p.pitch});
      opt.textContent = p.label;
      pg.appendChild(opt);
    });
    voiceSelect.appendChild(pg);
    if (voiceHint) voiceHint.style.display = '';
  } else if (voiceHint) {
    voiceHint.style.display = 'none';
  }

  const saved = loadState(VOICE_CHOICE_KEY, null);
  if (saved) {
    const savedStr = typeof saved === 'string' ? saved : JSON.stringify(saved);
    const idx = [...voiceSelect.options].findIndex(o => o.value === savedStr);
    if (idx >= 0) voiceSelect.selectedIndex = idx;
  } else {
    saveState(VOICE_CHOICE_KEY, voiceSelect.value);
  }

  voiceSelect.addEventListener('change', ()=> debounceSave(VOICE_CHOICE_KEY, voiceSelect.value));
  if (testVoiceBtn) testVoiceBtn.onclick = ()=> speakSample('태초에 하나님이 천지를 창조하시니라.');
}
function resolveVoiceChoice(){
  const saved = loadState(VOICE_CHOICE_KEY, null);
  if(!saved) return {type:'default'};
  // saved媛 臾몄옄??JSON)??寃쎌슦 ?뚯떛, 媛앹껜??寃쎌슦 洹몃?濡??ъ슜
  if(typeof saved === 'string') {
    try {
      return JSON.parse(saved);
    } catch(e) {
      return {type:'default'};
    }
  }
  // ?대? 媛앹껜??寃쎌슦 洹몃?濡?諛섑솚
  return saved;
}
function pickVoiceByURI(uri){ return (speechSynthesis.getVoices?.()||[]).find(v=>v.voiceURI===uri) || null; }
function applyVoice(u){
  const choice = resolveVoiceChoice();
  if(!choice || typeof choice !== 'object') {
    // choice媛 ?좏슚?섏? ?딆? 寃쎌슦 湲곕낯媛??ъ슜
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
  if(!BIBLE){ treeEl.innerHTML = '<div class="muted">?뚯씪??李얠쓣 ???놁뒿?덈떎.</div>'; return; }

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
      sumChap.innerHTML = `<span class="chip">${chap}??/span>`;
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
                title="?쒕ぉ???붾툝?대┃?섎㈃ ?몄쭛?????덉뒿?덈떎">${escapeHtml(titleText)}</span>
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
            <button class="primary speakBtn">??룆</button>
            <label class="chip"><input type="checkbox" class="keepReading" style="margin-right:6px">怨꾩냽 ??룆</label>
            <button class="ctxBtn btnSummary">?댁슜?먮쫫</button>
            <button class="ctxBtn btnUnitCtx">?⑥쐞?깃꼍??留λ씫</button>
            <button class="ctxBtn btnWholeCtx">?꾩껜?깃꼍??留λ씫</button>
            <button class="ctxBtn btnCommentary">二쇱꽍</button>
            <button class="sermBtn">?ㅺ탳紐⑸줉</button>
            <div class="spacer"></div>
          </div>
          <div class="pcontent"></div>`;

        // [PATCH 1 START] ?ㅺ탳 踰꾪듉 ?앹꽦/媛?쒖꽦留?蹂닿컯 (?대┃ 諛붿씤???놁쓬)
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
            sermBtn.textContent = '?ㅺ탳紐⑸줉';
            tb.appendChild(sermBtn);
          }
        })();
        // [PATCH 1 END]

        detPara.appendChild(body);

        const pcontent = body.querySelector('.pcontent');
        // ?깃꼍 蹂몃Ц ?몄쭛???꾪빐 contenteditable ?ㅼ젙
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
            status(`?좏깮?? ${bookName} ${chap}??쨌 ${para.title||para.ref}`);
            // ?대┫ ???ㅺ탳 踰꾪듉 ?꾨씫 ??利됱떆 ?앹꽦 (?대┃ 諛붿씤???놁쓬)
            const tb = detPara.querySelector('.ptoolbar');
            if (tb && !tb.querySelector('.sermBtn')) {
              const btn = document.createElement('button');
              btn.className = 'sermBtn';
              btn.textContent = '?ㅺ탳';
              tb.appendChild(btn);
            }
          }
        });

        body.querySelector('.speakBtn').addEventListener('click', ()=>{
          toggleSpeakInline(bookName, chap, idx, detPara, body.querySelector('.speakBtn'));
        });

        // 而⑦뀓?ㅽ듃 ?먮뵒??踰꾪듉??
        body.querySelector('.btnUnitCtx').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('unit'); }); // ?⑥쐞?깃꼍???몄쭛湲??몄텧
        body.querySelector('.btnWholeCtx').addEventListener('click',()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('whole'); }); // ?꾩껜?깃꼍???몄쭛湲??몄텧
        body.querySelector('.btnCommentary').addEventListener('click',()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('commentary'); }); // 二쇱꽍 ?몄쭛湲??몄텧
        body.querySelector('.btnSummary').addEventListener('click',   ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('summary'); }); // ?댁슜?먮쫫 ?몄쭛湲??몄텧

        parWrap.appendChild(detPara);
      });

      detChap.appendChild(parWrap);
      chWrap.appendChild(detChap);
    }

    detBook.appendChild(chWrap);
    treeEl.appendChild(detBook);
  }
    // ??諛붾줈 ?ш린????以?異붽??⑸땲???몙?몙?몙
  document.dispatchEvent(new CustomEvent('wbp:treeBuilt'));
}

// [PATCH 2 START] ?뚮뜑 ?꾩뿉???ㅺ탳 踰꾪듉 ?꾨씫 ???먮룞 蹂댁젙(?대┃ 諛붿씤???놁쓬)
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
      b.textContent = '?ㅺ탳';
      tb.appendChild(b);
    }
  }

  let isSweeping = false; // 臾댄븳 猷⑦봽 諛⑹? ?뚮옒洹?
  function sweep(){
    if(isSweeping) return; // ?대? ?ㅼ쐲 以묒씠硫?臾댁떆
    isSweeping = true;
    try {
      root.querySelectorAll('details.para .ptoolbar').forEach(fix);
    } finally {
      // ?ㅼ쓬 ?대깽??猷⑦봽?먯꽌 ?뚮옒洹??댁젣
      setTimeout(() => { isSweeping = false; }, 0);
    }
  }

  sweep();
  new MutationObserver(sweep).observe(root, {subtree:true, childList:true});

})();
// [PATCH 2 END]

/* ???몃━ ?뚮뜑 ???ㅺ탳 踰꾪듉???꾨씫?먯쓣 ???먮룞 蹂닿컯(?대┃ 諛붿씤???놁쓬) */
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
    btn.textContent = '?ㅺ탳';
    tb.appendChild(btn);
  });
}

/* ?뵩 ?몃━ ?꾩엫 ?대┃ 怨듭슜 泥섎━ (?좎씪???대┃ 諛붿씤?? */
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

  // === [BOOK-CHIP ??'?댁슜?먮쫫' ?몄쭛湲??숈씪 ?ъ슜] =========================
  const chip = e.target.closest('.book-chip[data-type="basic"], .book-chip[data-type="structure"], .book-chip[data-type="summary"]');
  if (chip) {
    e.preventDefault();
    e.stopPropagation();

    // 2媛??댁긽 梨??ㅽ뵂 ???쒗븳
    const openedBooks = [...document.querySelectorAll('#tree details.book[open]')];
    if (openedBooks.length > 1) {
      alert('2媛??댁긽 ?깃꼍???대젮 ?덉뒿?덈떎. ??沅뚮쭔 ???ㅼ쓬 ?ㅼ떆 ?쒕룄?섏꽭??');
      return;
    }

    // ???梨? ?대젮?덈뒗 梨?1媛??먮뒗 泥?梨?
    const bookEl = openedBooks[0] || document.querySelector('#tree > details.book');
    if (!bookEl) return;

    // ??梨낆쓽 1??/ 泥??⑤씫
    const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
    const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
    if (!p1) return;

    // '?댁슜?먮쫫' ?몃━嫄?踰꾪듉 ?먯깋
    const flowBtn =
      p1.querySelector('.ptoolbar [data-action="flow"]') ||
      p1.querySelector('.ptoolbar .btn-flow') ||
      [...(p1.querySelectorAll('.ptoolbar button')||[])].find(b => (b.textContent||'').trim() === '?댁슜?먮쫫');

    if (!flowBtn) return;

    // ?댁슜?먮쫫 ?몄쭛湲곕? 洹몃?濡??몄텧
    flowBtn.click();

    // ?먮뵒????댄???移??쇰꺼濡?援먯껜 (?ㅽ???湲곕뒫? ?댁슜?먮쫫 洹몃?濡?
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
    // 臾몄옣 ?섏씠?쇱씠??span ?쒓굅
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
// 臾몄옣 遺꾪븷 ?⑥닔 (?쒓뎅???곷Ц 醫낃껐遺??湲곗?)
function splitToSentences(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/u).filter(s => s && s.trim().length > 0);
  return parts;
}

// ???대???臾몄옣???섏씠?쇱씠?명븯湲??꾪븳 ?⑥닔
function highlightSentenceInLine(line, sentenceIndex, sentences) {
  if (!line || !sentences || sentenceIndex < 0 || sentenceIndex >= sentences.length) return;
  
  // 湲곗〈 臾몄옣 ?섏씠?쇱씠??span ?쒓굅
  line.querySelectorAll('.sentence-reading').forEach(span => {
    const parent = span.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(span.textContent), span);
      parent.normalize();
    }
  });
  
  // ???꾩껜 ?섏씠?쇱씠??
  line.classList.add('reading');
  line.setAttribute('data-reading-sentence', sentenceIndex);
  line.scrollIntoView({block:'center', behavior:'smooth'});
  
  // ???띿뒪??媛?몄삤湲?(?덈쾲???쒖쇅)
  const verseNumEl = line.querySelector('.pv');
  const lineText = line.textContent || '';
  const verseNum = verseNumEl?.textContent || '';
  const textWithoutVerse = lineText.replace(verseNum, '').trim();
  
  // ?꾩옱 臾몄옣 李얘린
  const targetSentence = sentences[sentenceIndex].trim();
  const sentenceStart = textWithoutVerse.indexOf(targetSentence);
  
  if (sentenceStart === -1) {
    // 臾몄옣??李얠? 紐삵븳 寃쎌슦 ???꾩껜留??섏씠?쇱씠??
    return;
  }
  
  // ???대? ?띿뒪???몃뱶 李얘린 (?덈쾲???쒖쇅)
  const walker = document.createTreeWalker(
    line,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // ?덈쾲???몃뱶???쒖쇅
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
  
  // 臾몄옣 ?쒖옉怨????꾩튂 李얘린
  while (textNode = walker.nextNode()) {
    const text = textNode.textContent;
    const textLen = text.length;
    
    if (!foundStart && currentPos + textLen > sentenceStart) {
      // 臾몄옣 ?쒖옉 ?꾩튂 李얠쓬
      foundStart = true;
      startNode = textNode;
      startOffset = sentenceStart - currentPos;
    }
    
    if (foundStart && currentPos + textLen >= sentenceStart + targetSentence.length) {
      // 臾몄옣 ???꾩튂 李얠쓬
      endNode = textNode;
      endOffset = sentenceStart + targetSentence.length - currentPos;
      break;
    }
    
    currentPos += textLen;
  }
  
  // 臾몄옣??span?쇰줈 媛먯떥湲?
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
      // 踰붿쐞媛 ?щ윭 ?몃뱶??嫄몄퀜 ?덈뒗 寃쎌슦 extractContents ?ъ슜
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
        // ?ㅽ뙣??寃쎌슦 ???꾩껜留??섏씠?쇱씠??
        console.warn('臾몄옣 ?섏씠?쇱씠???ㅽ뙣:', e2);
      }
    }
  }
}

function speakVerseItemInScope(item, scope, onend){
  if(!READER.synth) return;
  
  // ???띿뒪?몃? 臾몄옣?쇰줈 遺꾪븷
  const sentences = splitToSentences(item.text);
  const line = scope.querySelector(`.pline[data-verse="${item.verse}"]`);
  
  if (sentences.length === 0) {
    // 臾몄옣???놁쑝硫?湲곗〈 諛⑹떇?濡?泥섎━
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
  
  // 臾몄옣 ?⑥쐞濡??쎄린
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
      // ?꾩옱 臾몄옣 ?섏씠?쇱씠??
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
  
  // 泥?臾몄옣遺???쒖옉
  clearReadingHighlight(scope);
  speakNextSentence();
}
function toggleSpeakInline(book, chap, idx, paraDetailsEl, btnEl){
  // speechSynthesis媛 ?놁쑝硫??ъ떆??
  if(!READER.synth) {
    READER.synth = window.speechSynthesis || null;
    if(!READER.synth) return alert('??釉뚮씪?곗????뚯꽦?⑹꽦??吏?먰븯吏 ?딆뒿?덈떎.');
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
function updateInlineSpeakBtn(){ if(READER.btn) READER.btn.textContent = READER.playing ? '以묒?' : '??룆'; }

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

  if (READER.btn) READER.btn.textContent = '??룆';

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
      if (READER.btn) READER.btn.textContent = READER.playing ? '以묒?' : '??룆';
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
        if (READER.btn) READER.btn.textContent = READER.playing ? '以묒?' : '??룆';
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
        if (READER.btn) READER.btn.textContent = READER.playing ? '以묒?' : '??룆';
        return true;
      }
    }
  }
  return false;
}

/* --------- Sermon / Context Editors --------- */
function getSermonMap(){ 
  const data = loadState(STORAGE_SERMON, {});
  // 硫뷀? ?꾨뱶(_version, _savedAt ?? ?쒓굅?섍퀬 ?ㅼ젣 ?곗씠?곕쭔 諛섑솚
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const { _version, _savedAt, _migrated, _migratedFrom, _migratedAt, ...cleanData } = data;
    return cleanData;
  }
  return data || {};
}
function setSermonMap(o, immediate = false){ 
  if (immediate) {
    // 利됱떆 ???(debounce ?놁씠)
    const saved = saveState(STORAGE_SERMON, o, { silent: false });
    if (!saved) {
      console.error('[setSermonMap] ????ㅽ뙣, ?ъ떆??以?..');
      // ?ъ떆??
      setTimeout(() => {
        saveState(STORAGE_SERMON, o, { silent: false });
      }, 100);
      return false;
    }
    return true;
  } else {
    const saved = saveState(STORAGE_SERMON, o);
    if (!saved) {
      console.error('[setSermonMap] ????ㅽ뙣, ?ъ떆??以?..');
      // ?ъ떆??
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

/* ???꾨줈洹몃옩 ?쒖옉 ????λ맂 ?ㅺ탳紐⑸줉 ?먮룞 ?쒖떆 */
function restoreSermonListOnStartup(){
  try {
    // 留덉?留됱쑝濡?蹂?paraId 媛?몄삤湲?
    const lastParaId = loadState(STORAGE_LAST_SERMON_PARA, null);
    if (!lastParaId || typeof lastParaId !== 'string') {
      console.log('[restoreSermonListOnStartup] ??λ맂 paraId媛 ?놁뒿?덈떎.');
      return;
    }
    
    // paraId ?뚯떛: "book|chap|ref"
    const parts = lastParaId.split('|');
    if (parts.length < 3) {
      console.log('[restoreSermonListOnStartup] ?섎せ??paraId ?뺤떇:', lastParaId);
      return;
    }
    
    const [book, chapStr, ref] = parts;
    const chap = parseInt(chapStr, 10);
    
    if (!book || !Number.isFinite(chap) || !BIBLE?.books?.[book]?.[chap]) {
      console.log('[restoreSermonListOnStartup] ?좏슚?섏? ?딆? paraId:', lastParaId);
      return;
    }
    
    // ?대떦 ?μ쓽 ?⑤씫 李얘린
    const paras = BIBLE.books[book][chap].paras || [];
    const paraIdx = paras.findIndex(p => p.ref === ref);
    
    if (paraIdx === -1) {
      console.log('[restoreSermonListOnStartup] ?⑤씫??李얠쓣 ???놁뒿?덈떎:', lastParaId);
      return;
    }
    
    // CURRENT ?곹깭 ?ㅼ젙
    CURRENT.book = book;
    CURRENT.chap = chap;
    CURRENT.paraIdx = paraIdx;
    CURRENT.paraId = lastParaId;
    
    // ?ㅺ탳紐⑸줉 ?뺤씤
    const map = getSermonMap();
    const arr = map[lastParaId] || [];
    
    if (arr.length === 0) {
      console.log('[restoreSermonListOnStartup] ?대떦 paraId???ㅺ탳媛 ?놁뒿?덈떎:', lastParaId);
      return;
    }
    
    console.log('[restoreSermonListOnStartup] ?ㅺ탳紐⑸줉 ?먮룞 ?쒖떆:', lastParaId, '?ㅺ탳 媛쒖닔:', arr.length);
    
    // ?몃━媛 ?꾩쟾??鍮뚮뱶?????ㅺ탳紐⑸줉 ?쒖떆
    setTimeout(() => {
      // ?대떦 ?⑤씫 ?닿린
      const paraEl = document.querySelector(`details.para summary .ptitle[data-book="${book}"][data-ch="${chap}"][data-idx="${paraIdx}"]`);
      if (paraEl) {
        const paraDetails = paraEl.closest('details.para');
        if (paraDetails && !paraDetails.open) {
          paraDetails.open = true;
        }
      }
      
      // ?ㅺ탳紐⑸줉 紐⑤떖 ?닿린
      openSermonListModal();
    }, 500); // ?몃━ 鍮뚮뱶 ?꾨즺 ?湲?
    
  } catch (e) {
    console.error('[restoreSermonListOnStartup] ?ㅻ쪟:', e);
  }
}

/* ???ㅺ탳紐⑸줉 紐⑤떖 ?닿린 */
function openSermonListModal(){
  // CURRENT ?곹깭 ?뺤씤 諛??숆린??
  if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
    if (!syncCurrentFromOpen()) {
      alert('?⑤씫??癒쇱? ?좏깮??二쇱꽭??');
      return;
    }
  }

  const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
  if (!para) {
    alert('?좏깮???⑤씫??李얠쓣 ???놁뒿?덈떎.');
    return;
  }
  
  // paraId ?뺤떎???ㅼ젙
  CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  
  // 留덉?留됱쑝濡?蹂?paraId ???
  saveState(STORAGE_LAST_SERMON_PARA, CURRENT.paraId);

  document.getElementById('modalTitle').textContent = '?ㅺ탳紐⑸줉';
  modalRef.textContent = `${CURRENT.book} ${CURRENT.chap}??쨌 ${para.title || para.ref} (${para.ref})`;
  
  sermonEditor.style.display = 'none';
  sermonEditor.classList.add('context-editor');
  // aria-hidden??癒쇱? false濡??ㅼ젙????display瑜?蹂寃?(?묎렐??媛쒖꽑)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = '';
  // ?뚮줈???대컮 ?④?
  if (window.__hideFloatingToolbar) window.__hideFloatingToolbar();

  // localStorage?먯꽌 ?ㅺ탳紐⑸줉 ?뺣낫瑜?媛?몄????뚮뜑留?
  renderSermonList();
  
  // 紐⑤떖???대┛ ???ъ빱?ㅻ? ?ㅼ젙?섍린 ?꾩뿉 aria-hidden???뺤떎???곸슜?섎룄濡?蹂댁옣
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'flex') {
      modalWrap.setAttribute('aria-hidden','false');
    }
  });
  
  // 紐⑤떖???대┛ ???ъ빱?ㅻ? 紐⑤떖 ?대?濡??대룞 (?묎렐??媛쒖꽑)
  setTimeout(() => {
    const firstFocusable = modalWrap.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }, 0);
}

/* ???ㅺ탳 ?몄쭛湲??닿린 (?ㅺ탳蹂닿린 踰꾪듉?먯꽌 ?몄텧) */
function openSermonEditorDirectly(sermonIdx = 0){
  if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
    if (!syncCurrentFromOpen()) {
      alert('?⑤씫??癒쇱? ?좏깮??二쇱꽭??');
      return;
    }
  }

  const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
  if (!para) {
    alert('?좏깮???⑤씫??李얠쓣 ???놁뒿?덈떎.');
    return;
  }
  CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;

  // ?ㅺ탳 ?곗씠???뺤씤
  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  const existingSermon = arr[sermonIdx];

  document.getElementById('modalTitle').textContent = '?ㅺ탳 ?몄쭛';
  // 蹂몃Ц ?뺣낫 ?④? (?ㅺ탳蹂닿린?먯꽌???쒖떆?섏? ?딆쓬)
  modalRef.textContent = '';
  modalRef.style.display = 'none';
  sermonList.innerHTML = '';
  sermonEditor.style.display = '';
  sermonEditor.classList.add('context-editor');
  sermonEditor.dataset.ctxType = '';
  sermonEditor.dataset.editing = existingSermon ? String(sermonIdx) : ''; // ?몄쭛 紐⑤뱶 ?ㅼ젙
  
  // aria-hidden??癒쇱? false濡??ㅼ젙????display瑜?蹂寃?(?묎렐??媛쒖꽑)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = 'none';
  // ?뚮줈???대컮 ?④?
  if (window.__hideFloatingToolbar) window.__hideFloatingToolbar();

  // ?쒕ぉ ?낅젰 ?꾨뱶 ?쒖떆
  sermonTitle.style.display = '';
  
  // 紐⑤떖???대┛ ???ъ빱?ㅻ? ?ㅼ젙?섍린 ?꾩뿉 aria-hidden???뺤떎???곸슜?섎룄濡?蹂댁옣
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'flex') {
      modalWrap.setAttribute('aria-hidden','false');
    }
  });
  
  // 硫뷀? ?꾨뱶 ?④? (?ㅺ탳蹂닿린?먯꽌???쒖떆?섏? ?딆쓬)
  const metaFields = document.getElementById('sermonMetaFields');
  if (metaFields) metaFields.style.display = 'none';
  
  // 湲곗〈 ?ㅺ탳 ?댁슜 濡쒕뱶 ?먮뒗 鍮??몄쭛湲?
  if (existingSermon) {
    sermonTitle.value = existingSermon.title || '';
    setBodyHTML(existingSermon.body || '');
  } else {
    sermonTitle.value = '';
    setBodyHTML('');
  }
  
  // ?깃뎄 ?쎌엯 踰꾪듉 ?④? (?ㅺ탳蹂닿린?먯꽌???ъ슜?섏? ?딆쓬)
  const insertVerseBtn = document.getElementById('insertVerseBtn');
  if (insertVerseBtn) {
    insertVerseBtn.style.display = 'none';
  }
  
  // 紐⑤떖???대┛ ???ъ빱?ㅻ? 紐⑤떖 ?대?濡??대룞 (?묎렐??媛쒖꽑)
  setTimeout(() => {
    const firstFocusable = modalWrap.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }, 0);
}

/* ???깃뎄 ?쎌엯 湲곕뒫 */
function setupInsertVerseButton(){
  const insertBtn = document.getElementById('insertVerseBtn');
  if (!insertBtn) return;
  
  // 湲곗〈 ?대깽??由ъ뒪???쒓굅 ???덈줈 異붽?
  const newBtn = insertBtn.cloneNode(true);
  insertBtn.parentNode.replaceChild(newBtn, insertBtn);
  
  newBtn.addEventListener('click', () => {
    if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
      alert('?⑤씫??癒쇱? ?좏깮??二쇱꽭??');
      return;
    }
    
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (!para) {
      alert('?좏깮???⑤씫??李얠쓣 ???놁뒿?덈떎.');
      return;
    }
    
    // ?깃뎄 ?띿뒪???앹꽦
    const verses = para.verses || [];
    let verseText = `${CURRENT.book} ${CURRENT.chap}:${para.ref}\n\n`;
    verses.forEach(([v, t]) => {
      verseText += `${v} ${t}\n`;
    });
    
    // ?꾩옱 而ㅼ꽌 ?꾩튂???쎌엯
    const body = sermonBody;
    if (!body) return;
    
    if (isRTE()) {
      // RTE 紐⑤뱶
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        
        // 以꾨컮轅덉쓣 <br>濡?蹂?섑븯???쎌엯
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
        
        // 而ㅼ꽌瑜??쎌엯???띿뒪???ㅻ줈 ?대룞
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // ?좏깮 ?곸뿭???놁쑝硫??앹뿉 異붽?
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
      // ?띿뒪???곸뿭 紐⑤뱶
      const start = body.selectionStart || 0;
      const end = body.selectionEnd || 0;
      const text = body.value;
      body.value = text.substring(0, start) + verseText + text.substring(end);
      body.focus();
      body.setSelectionRange(start + verseText.length, start + verseText.length);
    }
  });
}

/* ??湲곗〈 紐⑤떖 湲곕컲 ?ㅺ탳 ?쒖뒪?쒖? ?쒓굅??- openSermonEditorDirectly ?ъ슜 */
el('closeModal').onclick = ()=>{ 
  // display瑜?癒쇱? none?쇰줈 ?ㅼ젙????aria-hidden??true濡??ㅼ젙 (?묎렐??媛쒖꽑)
  modalWrap.style.display='none'; 
  // 紐⑤떖???ㅼ젣濡??ロ엺 ?꾩뿉留?aria-hidden??true濡??ㅼ젙
  requestAnimationFrame(() => {
    if (modalWrap.style.display === 'none') {
      modalWrap.setAttribute('aria-hidden','true');
    }
  });
  stopEditorSpeak(true); 
};

function openSingleDocEditor(kind){
  if (!CURRENT.book || !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
    if (!syncCurrentFromOpen()) { alert('?⑤씫??癒쇱? ?좏깮??二쇱꽭??'); return; }
  }
  if (!BIBLE) { alert('?깃꼍 ?곗씠?곌? 濡쒕뱶?섏? ?딆븯?듬땲??'); return; }

  const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
  const pid  = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;

  const titlePrefix =
    kind==='unit'       ? '?⑥쐞?깃꼍??留λ씫' :
    kind==='whole'      ? '?꾩껜?깃꼍??留λ씫' :
    kind==='commentary' ? '二쇱꽍' :
                           '?댁슜?붿빟';

  const key =
    kind==='unit'       ? STORAGE_UNIT_CTX :
    kind==='whole'      ? STORAGE_WHOLE_CTX :
    kind==='commentary' ? STORAGE_COMMENTARY :
                           STORAGE_SUMMARY;

  const map = getDocMap(key);
  const doc = map[pid] || {
    body:  (kind==='summary' ? '?듭떖 ?댁슜??媛꾧껐?섍쾶 ?붿빟???곸뼱二쇱꽭??' : ''),
    images: [], date:''
  };
  modalRef.textContent = `${CURRENT.book} ${CURRENT.chap}??쨌 ${para.title||para.ref} (${para.ref}) ??${titlePrefix}`;
  sermonList.innerHTML = '';
  sermonEditor.style.display = '';
  sermonEditor.classList.add('context-editor');
  // aria-hidden??癒쇱? false濡??ㅼ젙????display瑜?蹂寃?(?묎렐??媛쒖꽑)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = 'none';
  // ?뚮줈???대컮???⑤씫?깃꼍 ?몄쭛湲??대??먯꽌 ?ъ슜 媛?ν븯?꾨줉 ?좎?

  sermonTitle.value = doc.title || '';
  setBodyHTML(doc.body || '');

  sermonEditor.dataset.editing = '';
  sermonEditor.dataset.ctxType = kind;
  
  // 紐⑤떖???대┛ ???ъ빱?ㅻ? 紐⑤떖 ?대?濡??대룞 (?묎렐??媛쒖꽑)
  // aria-hidden???뺤떎???곸슜?????ъ빱?ㅻ? ?ㅼ젙
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
      aiBtn.onclick = async ()=>{ /* ?좏깮: AI ?몃뱾??*/ };
    }
  }
}

function openBookDocEditor(mode, book){
  if (!book) {
    alert('梨??뺣낫瑜?李얠쓣 ???놁뒿?덈떎. ?ㅼ떆 ?쒕룄??二쇱꽭??');
    return;
  }

  const titlePrefix =
    mode === 'basic'   ? '湲곕낯?댄빐' :
    mode === 'struct'  ? '?댁슜援ъ“' :
                         '硫붿꽭吏?붿빟';

  const key =
    mode === 'basic'   ? STORAGE_BOOK_BASIC :
    mode === 'struct'  ? STORAGE_BOOK_STRUCT :
                         STORAGE_BOOK_SUMMARY;

  const map = getDocMap(key);
  const doc = map[book] || {
    title: '',
    body:
      mode === 'basic'
        ? '??梨낆쓽 ??궗?겶룸같寃쎌쟻쨌?좏븰??湲곕낯 ?댄빐瑜??뺣━??二쇱꽭??'
      : mode === 'struct'
        ? '??梨낆쓽 ??援ъ“(?⑤씫 ?먮쫫, ?듭떖 二쇱젣)瑜??뺣━??二쇱꽭??'
        : '??梨낆쓽 ?듭떖 硫붿떆吏? ?곸슜 ?ъ씤?몃? 媛꾧껐?섍쾶 ?붿빟??二쇱꽭??',
    images: [],
    date: ''
  };

  // ?뵻 紐⑤떖/?먮뵒??UI ?명똿 (?댁슜?먮쫫 ?먮뵒?곗? ?숈씪???ㅽ???
  modalRef.textContent = `${book} ??${titlePrefix}`;
  sermonList.innerHTML = '';
  sermonEditor.style.display = '';
  sermonEditor.classList.add('context-editor');
  // aria-hidden??癒쇱? false濡??ㅼ젙????display瑜?蹂寃?(?묎렐??媛쒖꽑)
  modalWrap.setAttribute('aria-hidden','false');
  modalWrap.style.display = 'flex';
  modalFooterNew.style.display = 'none';
  // ?뚮줈???대컮???몄쭛湲??대? ?좏깮 ???쒖떆?섎룄濡??좎?
  // (珥덇린 ?곹깭留??④?, ?섏쨷???띿뒪???좏깮?섎㈃ ?쒖떆??
  if (window.__hideFloatingToolbar) window.__hideFloatingToolbar();

  sermonTitle.value = doc.title || '';
  
  // 紐⑤떖???대┛ ???ъ빱?ㅻ? 紐⑤떖 ?대?濡??대룞 (?묎렐??媛쒖꽑)
  // aria-hidden???뺤떎???곸슜?????ъ빱?ㅻ? ?ㅼ젙
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

  // ?뵻 ???援щ텇??硫뷀??곗씠??
  sermonEditor.dataset.editing = '';
  sermonEditor.dataset.ctxType  = `book-${mode}`; // book-basic / book-struct / book-summary
  sermonEditor.dataset.bookName = book;

  // ?뵻 AI 踰꾪듉? 梨??⑥쐞?먯꽌???ъ슜 ????
  const aiBtn = document.getElementById('aiFill');
  if (aiBtn) {
    aiBtn.style.display = 'none';
    aiBtn.onclick = null;
  }
}

/* ???ㅺ탳紐⑸줉 ?뚮뜑留?(localStorage?먯꽌 ?ㅺ탳紐⑸줉 ?뺣낫 媛?몄????쒖떆) */
function renderSermonList(){
  // CURRENT.paraId媛 ?놁쑝硫??ㅼ젙 ?쒕룄
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      sermonList.innerHTML = '<div class="muted" style="padding:14px">?⑤씫??癒쇱? ?좏깮??二쇱꽭??</div>';
      return;
    }
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (para) {
      CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
    }
  }
  
  if (!CURRENT.paraId) {
    sermonList.innerHTML = '<div class="muted" style="padding:14px">?⑤씫 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.</div>';
    return;
  }
  
  // localStorage?먯꽌 ?ㅺ탳紐⑸줉 ?뺣낫 媛?몄삤湲?
  let arr = [];
  try {
    const map = getSermonMap(); // localStorage?먯꽌 吏곸젒 媛?몄샂
    
    // ?곗씠???좏슚??寃??
    if (!map || typeof map !== 'object') {
      console.warn('[renderSermonList] localStorage?먯꽌 ?ㅺ탳 留듭쓣 媛?몄삱 ???놁뒿?덈떎. 鍮?媛앹껜濡?珥덇린?뷀빀?덈떎.');
      sermonList.innerHTML = '<div class="muted" style="padding:14px">?ㅺ탳媛 ?놁뒿?덈떎. "???ㅺ탳紐⑸줉" 踰꾪듉???뚮윭 ?ㅺ탳瑜??묒꽦?섏꽭??</div>';
      return;
    }
    
    // CURRENT.paraId濡??ㅺ탳 諛곗뿴 媛?몄삤湲?(localStorage?먯꽌 吏곸젒 媛?몄샂)
    arr = Array.isArray(map[CURRENT.paraId]) ? map[CURRENT.paraId] : [];
    
    console.log('[renderSermonList] localStorage?먯꽌 媛?몄삩 ?ㅺ탳紐⑸줉 - paraId:', CURRENT.paraId, '?ㅺ탳 媛쒖닔:', arr.length);
    
    sermonList.innerHTML = '';

    // ?ㅺ탳媛 ?놁쑝硫??녿뒗 寃껋쑝濡??쒖떆
    if(arr.length === 0){
      sermonList.innerHTML = '<div class="muted" style="padding:14px">?ㅺ탳媛 ?놁뒿?덈떎. "???ㅺ탳紐⑸줉" 踰꾪듉???뚮윭 ?ㅺ탳瑜??묒꽦?섏꽭??</div>';
      return;
    }
  } catch (e) {
    console.error('[renderSermonList] localStorage?먯꽌 ?ㅺ탳紐⑸줉??媛?몄삤??以??ㅻ쪟 諛쒖깮:', e);
    sermonList.innerHTML = '<div class="muted" style="padding:14px">?ㅺ탳 ?곗씠?곕? 遺덈윭?????놁뒿?덈떎.</div>';
    return;
  }

  // localStorage?먯꽌 媛?몄삩 ?ㅺ탳紐⑸줉 ?쒖떆
  arr.forEach((it, idx)=>{
    // 移대뱶 ?뺥깭??而⑦뀒?대꼫
    const card = document.createElement('div');
    card.className = 'sermon-card';
    card.style.cssText = 'padding: 16px; margin-bottom: 12px; border: 1px solid var(--border, #ddd); border-radius: 8px; background: var(--panel, #1a1d29);';

    // ?ㅻ뜑 ?곸뿭 (?쒕ぉ, ?좎쭨, 踰꾪듉)
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px;';

    // ?쒕ぉ怨??좎쭨 ?곸뿭
    const titleDateArea = document.createElement('div');
    titleDateArea.style.cssText = 'flex: 1;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; font-size: 16px; margin-bottom: 4px; color: #ffd700;'; // 諛앹? ?몃???
    title.textContent = (it.title || '(?쒕ぉ ?놁쓬)');

    titleDateArea.appendChild(title);

    // 踰꾪듉 ?곸뿭
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // ?ㅺ탳??젣 踰꾪듉
    const btnDelete = document.createElement('button');
    btnDelete.textContent = '??젣';
    btnDelete.className = 'sermon-delete-btn';
    btnDelete.style.cssText = 'padding: 6px 16px; font-size: 13px; white-space: nowrap; border: 1px solid var(--danger, #ff6b6b); color: var(--danger, #ff6b6b); background: transparent; border-radius: 4px; cursor: pointer;';
    btnDelete.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(!confirm(`"${it.title || '(?쒕ぉ ?놁쓬)'}" ?ㅺ탳瑜???젣?좉퉴??`)) return;
      const m = getSermonMap();
      const a = m[CURRENT.paraId] || [];
      a.splice(idx, 1);
      m[CURRENT.paraId] = a;
      setSermonMap(m);
      renderSermonList();
      status('?ㅺ탳媛 ??젣?섏뿀?듬땲??');
    });

    // ?ㅺ탳蹂닿린 踰꾪듉
    const btnView = document.createElement('button');
    btnView.textContent = '?ㅺ탳蹂닿린';
    btnView.className = 'sermon-view-btn';
    
    // ?ㅺ탳 ?댁슜??梨꾩썙???덈뒗吏 ?뺤씤
    const hasContent = (it.body && it.body.trim().replace(/<[^>]*>/g, '').trim()) || 
                      (it.title && it.title.trim() && it.title !== '(?쒕ぉ ?놁쓬)');
    
    // ?댁슜???덉쑝硫?filled ?ㅽ????곸슜
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

    // 硫뷀? ?뺣낫 ?곸뿭 (蹂몃Ц, 珥덉젏, ?ㅼ썙?? ?곸슜???
    const metaArea = document.createElement('div');
    metaArea.style.cssText = 'margin-bottom: 12px; padding: 10px; background: var(--bg, #0f1115); border-radius: 4px; border: 1px solid var(--border, #252a36); font-size: 13px;';
    
    const metaItems = [];
    
    // 蹂몃Ц ?댁슜 (HTML???덉쑝硫??쒖떆)
    if (it.body && it.body.trim()) {
      // ?깃꼍?꾩튂?뺣낫 ?앹꽦
      let locationText = '';
      if (CURRENT.paraId) {
        const [book, chap, ref] = CURRENT.paraId.split('|');
        if (book && chap) {
          locationText = `${book} ${chap}??${ref || ''}`;
        }
      }
      
      const bodyItem = document.createElement('div');
      bodyItem.style.cssText = 'margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border, #252a36);';
      bodyItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">蹂몃Ц:</span> <span style="color: var(--muted, #9aa0ab); margin-left: 4px;">${escapeHtml(locationText)}</span>`;
      metaItems.push(bodyItem);
    }
    
    if (it.focus && it.focus.trim()) {
      const focusItem = document.createElement('div');
      focusItem.style.cssText = 'margin-bottom: 6px;';
      focusItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">珥덉젏:</span> <span style="color: var(--text, #e6e8ef);">${escapeHtml(it.focus)}</span>`;
      metaItems.push(focusItem);
    }
    
    if (it.keywords && it.keywords.trim()) {
      const keywordsItem = document.createElement('div');
      keywordsItem.style.cssText = 'margin-bottom: 6px;';
      const keywordsList = it.keywords.split(',').map(k => k.trim()).filter(k => k).join(', ');
      keywordsItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">?ㅼ썙??</span> <span style="color: var(--text, #e6e8ef);">${escapeHtml(keywordsList)}</span>`;
      metaItems.push(keywordsItem);
    }
    
    if (it.target && it.target.trim()) {
      const targetItem = document.createElement('div');
      targetItem.style.cssText = 'margin-bottom: 0;';
      targetItem.innerHTML = `<span style="font-weight: 600; color: var(--text-muted, #9aa0ab);">?곸슜???</span> <span style="color: var(--text, #e6e8ef);">${escapeHtml(it.target)}</span>`;
      metaItems.push(targetItem);
    }
    
    if (metaItems.length > 0) {
      metaItems.forEach(item => metaArea.appendChild(item));
    }

    // 留곹겕 ?곸뿭
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

    // ?대?吏 ?곸뿭
    const imageArea = document.createElement('div');
    if (it.images && it.images.length > 0) {
      imageArea.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;';
      it.images.forEach((img, imgIdx) => {
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border, #ddd);';
        
        const imgEl = document.createElement('img');
        imgEl.src = img.url || img;
        imgEl.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        imgEl.alt = img.alt || `?대?吏 ${imgIdx + 1}`;
        imgEl.onerror = () => {
          imgEl.style.display = 'none';
          imgContainer.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;">?대?吏 ?놁쓬</div>';
        };
        
        imgContainer.appendChild(imgEl);
        imageArea.appendChild(imgContainer);
      });
    }

    // 紐⑤뱺 ?붿냼瑜?移대뱶??異붽?
    card.appendChild(header);
    if (metaArea.hasChildNodes()) card.appendChild(metaArea);
    if (linkArea.hasChildNodes()) card.appendChild(linkArea);
    if (imageArea.hasChildNodes()) card.appendChild(imageArea);

    sermonList.appendChild(card);
  });
}

/* ???ㅺ탳紐⑸줉 ???踰꾪듉 */
el('saveSermonListBtn').onclick = () => {
  // CURRENT.paraId ?뺤씤 諛??ㅼ젙
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      alert('?⑤씫??癒쇱? ?좏깮??二쇱꽭??');
      return;
    }
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (!para) {
      alert('?⑤씫??李얠쓣 ???놁뒿?덈떎.');
      return;
    }
    CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  }
  
  // ?꾩옱 ?ㅺ탳 紐⑸줉 媛?몄삤湲?(?꾩옱 蹂댁씠怨??덈뒗 ?ㅺ탳紐⑸줉)
  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  
  if (arr.length === 0) {
    alert('??ν븷 ?ㅺ탳媛 ?놁뒿?덈떎.');
    return;
  }
  
  // ??????붾쾭源?
  console.log('[saveSermonListBtn] ?????- paraId:', CURRENT.paraId, '?ㅺ탳 媛쒖닔:', arr.length);
  
  // ????쒕룄
  const saved = setSermonMap(map, true); // 利됱떆 ???
  
  if (!saved) {
    console.error('[saveSermonListBtn] ?ㅺ탳 ????ㅽ뙣');
    alert('?ㅺ탳 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄??二쇱꽭??');
    return;
  }
  
  // ?????寃利? localStorage?먯꽌 ?ㅼ젣濡???λ릺?덈뒗吏 ?뺤씤
  const verifyMap = getSermonMap();
  const verifyArr = verifyMap[CURRENT.paraId] || [];
  console.log('[saveSermonListBtn] ?????寃利?- paraId:', CURRENT.paraId, '??λ맂 ?ㅺ탳 媛쒖닔:', verifyArr.length);
  
  if (verifyArr.length === 0) {
    console.error('[saveSermonListBtn] ???寃利??ㅽ뙣: ?ㅺ탳媛 ??λ릺吏 ?딆븯?듬땲??');
    alert('?ㅺ탳 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄??二쇱꽭??');
    return;
  }
  
  // ????깃났
  status(`${arr.length}媛쒖쓽 ?ㅺ탳媛 ??λ릺?덉뒿?덈떎.`);
  
  // ????깃났 ?쒓컖???쇰뱶諛?
  const btn = el('saveSermonListBtn');
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '저장됨';
    btn.style.opacity = '0.7';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.opacity = '1';
    }, 2000);
  }
};

/* ?????ㅺ탳紐⑸줉 踰꾪듉 - ?ㅺ탳 ?뺣낫 ?낅젰 */
function bindNewSermonBtn() {
  const newSermonBtn = el('newSermonBtn');
  if (!newSermonBtn) return;
  
  // 湲곗〈 ?대깽??由ъ뒪???쒓굅 ???덈줈 異붽? (以묐났 諛⑹?)
  const newBtn = newSermonBtn.cloneNode(true);
  newSermonBtn.parentNode?.replaceChild(newBtn, newSermonBtn);
  
  newBtn.onclick = ()=>{
    if (!CURRENT.paraId) {
      if (!syncCurrentFromOpen()) { 
        alert('?⑤씫??癒쇱? ?좏깮?섏꽭??'); 
        return; 
      }
      const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
      if (!para) {
        alert('?⑤씫??李얠쓣 ???놁뒿?덈떎.');
        return;
      }
      CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
    }
    
    // ?ㅺ탳 ?뺣낫 ?낅젰 紐⑤떖 ?닿린
    openSermonInputModal();
  };
}

// 珥덇린 諛붿씤??(DOM??以鍮꾨맂 ??
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindNewSermonBtn);
} else {
  bindNewSermonBtn();
}

/* ???ㅺ탳 ?뺣낫 ?낅젰 紐⑤떖 - ?띿뒪???뚯떛 諛⑹떇 */
function openSermonInputModal(){
  // CURRENT.paraId ?뺤씤 諛??ㅼ젙
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      alert('?⑤씫??癒쇱? ?좏깮??二쇱꽭??');
      return;
    }
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (!para) {
      alert('?⑤씫??李얠쓣 ???놁뒿?덈떎.');
      return;
    }
    CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  }
  
  // 湲곗〈 紐⑤떖 ?댁슜 ?④린湲?
  sermonList.innerHTML = '';
  sermonEditor.style.display = 'none';
  
  // ?낅젰 ?곸뿭 ?앹꽦
  const inputArea = document.createElement('div');
  inputArea.style.cssText = 'padding: 20px;';
  inputArea.innerHTML = `
    <div style="margin-bottom: 12px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text, #e6e8ef);">?ㅺ탳 ?뺣낫 ?낅젰</label>
      <div style="font-size: 12px; color: var(--text-muted, #9aa0ab); margin-bottom: 8px; padding: 8px; background: var(--bg, #0f1115); border-radius: 4px; line-height: 1.6;">
        ?뺤떇: 踰덊샇? "?ㅺ탳 ?쒕ぉ:" ?먮뒗 踰덊샇留뚯쑝濡??쒖옉, 洹??ㅼ쓬 "蹂몃Ц:", "珥덉젏:", "?ㅼ썙??", "?곸슜 ???" ?쇰꺼濡??뺣낫 ?낅젰<br/>
        ?щ윭 ?ㅺ탳瑜???踰덉뿉 ?낅젰 媛?ν빀?덈떎.<br/>
        ??<br/>
        1. ?ㅺ탳 ?쒕ぉ: "?쒖큹???섎굹?섏씠" ???좎븰??泥?臾몄옣<br/>
        蹂몃Ц: 李?1:1??<br/>
        珥덉젏: "?쒖큹??踰좊젅?ы듃)"? "?섎굹???섎줈??"?쇰줈 ?쒖옉?섎뒗 ?좎븰??諛⑺뼢 ?꾪솚<br/>
        ?ㅼ썙?? ?섎굹??以묒떖 ?멸퀎愿, ?몄깮???쒖옉???ъ젙由?br/>
        ?곸슜 ??? ??援먯씤, ?좎븰 湲곗큹 ?ъ젙鍮???
      </div>
      <textarea id="newSermonText" 
        placeholder="?ㅺ탳 ?뺣낫瑜??낅젰?섏꽭??(?щ윭 ?ㅺ탳瑜???踰덉뿉 ?낅젰 媛??&#10;&#10;??&#10;1. ?ㅺ탳 ?쒕ぉ: &quot;?쒖큹???섎굹?섏씠&quot; ???좎븰??泥?臾몄옣&#10;蹂몃Ц: 李?1:1??&#10;珥덉젏: ?쒖큹?먯? ?섎굹?섏쑝濡??쒖옉?섎뒗 ?좎븰??諛⑺뼢 ?꾪솚&#10;?ㅼ썙?? ?섎굹??以묒떖 ?멸퀎愿, ?몄깮???쒖옉???ъ젙由?#10;?곸슜 ??? ??援먯씤"
        style="width: 100%; min-height: 300px; padding: 12px; border: 1px solid var(--border, #252a36); border-radius: 4px; background: var(--bg, #0f1115); color: var(--text, #e6e8ef); font-size: 14px; resize: vertical; font-family: inherit; line-height: 1.6;"></textarea>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="cancelSermonInput" style="padding: 8px 16px; border: 1px solid var(--border, #252a36); border-radius: 4px; background: var(--bg, #0f1115); color: var(--text, #e6e8ef); cursor: pointer;">痍⑥냼</button>
      <button id="saveSermonInput" class="primary" style="padding: 8px 16px; border-radius: 4px; cursor: pointer;">???/button>
    </div>
  `;
  
  sermonList.appendChild(inputArea);
  
  // 痍⑥냼 踰꾪듉
  document.getElementById('cancelSermonInput').onclick = () => {
    renderSermonList();
  };
  
  // ???踰꾪듉
  document.getElementById('saveSermonInput').onclick = () => {
    const text = (document.getElementById('newSermonText').value || '').trim();
    
    if (!text) {
      alert('?ㅺ탳 ?뺣낫瑜??낅젰?댁＜?몄슂.');
      return;
    }
    
    // ?띿뒪???뚯떛 (?щ윭 ?ㅺ탳 吏??
    const sermons = parseSermonText(text);
    
    if (sermons.length === 0) {
      alert('?ㅺ탳 ?뺣낫瑜??щ컮瑜닿쾶 ?낅젰?댁＜?몄슂.');
      return;
    }
    
    // ?ㅺ탳 ?앹꽦
    const map = getSermonMap();
    const arr = map[CURRENT.paraId] || [];
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    
    // ?뚯떛??紐⑤뱺 ?ㅺ탳 異붽?
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
    
    // ??????붾쾭源?
    console.log('[saveSermonInput] ?????- paraId:', CURRENT.paraId, '?ㅺ탳 媛쒖닔:', arr.length);
    
    const saved = setSermonMap(map, true); // 利됱떆 ???
    
    // ????뺤씤
    if (!saved) {
      console.error('[saveSermonInput] ?ㅺ탳 ????ㅽ뙣');
      alert('?ㅺ탳 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄??二쇱꽭??');
      return;
    }
    
    // ?????寃利? localStorage?먯꽌 ?ㅼ젣濡???λ릺?덈뒗吏 ?뺤씤
    const verifyMap = getSermonMap();
    const verifyArr = verifyMap[CURRENT.paraId] || [];
    console.log('[saveSermonInput] ?????寃利?- paraId:', CURRENT.paraId, '??λ맂 ?ㅺ탳 媛쒖닔:', verifyArr.length);
    
    if (verifyArr.length === 0) {
      console.error('[saveSermonInput] ???寃利??ㅽ뙣: ?ㅺ탳媛 ??λ릺吏 ?딆븯?듬땲??');
      alert('?ㅺ탳 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄??二쇱꽭??');
      return;
    }
    
    // ?낅젰 ?곸뿭 ?쒓굅 ???ㅺ탳紐⑸줉 ?뚮뜑留?
    sermonList.innerHTML = '';
    renderSermonList();
    status(`${sermons.length}媛쒖쓽 ?ㅺ탳媛 ??λ릺?덉뒿?덈떎.`);
  };
  
  // ?ъ빱??
  setTimeout(() => {
    const textInput = document.getElementById('newSermonText');
    if (textInput) textInput.focus();
  }, 0);
}

/* ???띿뒪?몄뿉???ㅺ탳 ?뺣낫 ?뚯떛 (?щ윭 ?ㅺ탳 吏?? */
function parseSermonText(text) {
  const lines = String(text || '').split('\n').map(line => line.trim()).filter(Boolean);
  const sermons = [];
  let current = null;
  let section = 'body';

  const pushCurrent = () => {
    if (!current) return;
    if (current.title || current.body || current.focus || current.keywords || current.target) {
      if (!current.title) current.title = '제목 없음';
      sermons.push(current);
    }
  };

  for (const line of lines) {
    if (/^\d+[\.\)]\s*/.test(line)) {
      pushCurrent();
      current = { title: line.replace(/^\d+[\.\)]\s*/, '').trim(), body: '', focus: '', keywords: '', target: '' };
      section = 'body';
      continue;
    }

    if (!current) current = { title: '', body: '', focus: '', keywords: '', target: '' };

    const titleMatch = line.match(/^(?:설교\s*제목|title)\s*[:：]\s*(.+)$/i);
    if (titleMatch) {
      current.title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
      continue;
    }

    const bodyMatch = line.match(/^(?:본문|body)\s*[:：]\s*(.*)$/i);
    if (bodyMatch) {
      section = 'body';
      current.body = bodyMatch[1].trim();
      continue;
    }

    const focusMatch = line.match(/^(?:초점|focus)\s*[:：]\s*(.*)$/i);
    if (focusMatch) {
      section = 'focus';
      current.focus = focusMatch[1].trim();
      continue;
    }

    const keywordMatch = line.match(/^(?:키워드|keywords?)\s*[:：]\s*(.*)$/i);
    if (keywordMatch) {
      section = 'keywords';
      current.keywords = keywordMatch[1].trim();
      continue;
    }

    const targetMatch = line.match(/^(?:적용\s*대상|적용대상|target)\s*[:：]\s*(.*)$/i);
    if (targetMatch) {
      section = 'target';
      current.target = targetMatch[1].trim();
      continue;
    }

    current[section] = `${current[section] ? `${current[section]}${section === 'body' ? '\n' : ' '}` : ''}${line}`.trim();
  }

  pushCurrent();
  return sermons;
}

el('cancelEdit')?.addEventListener('click', ()=>{
  if(sermonEditor.dataset.ctxType){
    sermonEditor.dataset.ctxType = '';
    modalWrap.style.display = 'none'; 
    // 紐⑤떖???ㅼ젣濡??ロ엺 ?꾩뿉留?aria-hidden??true濡??ㅼ젙
    requestAnimationFrame(() => {
      if (modalWrap.style.display === 'none') {
        modalWrap.setAttribute('aria-hidden','true');
      }
    });
  }else{
    // ?ㅺ탳 ?몄쭛湲곗씤 寃쎌슦 ?ㅺ탳紐⑸줉?쇰줈 ?뚯븘媛湲?
    sermonEditor.style.display = 'none';
    renderSermonList();
  }
  stopEditorSpeak(true);
});

el('saveSermon').onclick = () => {
  const title = (sermonTitle.value || '').trim() || '(?쒕ぉ ?놁쓬)';
  let body = getBodyHTML() || '';
  body = body.replace(/^\s+|\s+$/g, '');

  // 硫뷀? ?꾨뱶 媛?媛?몄삤湲?(?꾨뱶媛 ?④꺼???덉쑝硫?湲곗〈 媛??좎?)
  const focusEl = document.getElementById('sermonFocus');
  const keywordsEl = document.getElementById('sermonKeywords');
  const targetEl = document.getElementById('sermonTarget');
  
  // ?몄쭛 紐⑤뱶?몄? ?뺤씤
  const editing = sermonEditor.dataset.editing;
  let focus = '';
  let keywords = '';
  let target = '';
  
  if (editing !== '' && CURRENT.paraId) {
    // ?몄쭛 紐⑤뱶: 湲곗〈 媛??좎?
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
  
  // 硫뷀? ?꾨뱶媛 ?쒖떆?섏뼱 ?덉쑝硫??낅젰??媛??ъ슜
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
  // 1) 梨??⑥쐞 ?먮뵒??(湲곕낯?댄빐 / ?댁슜援ъ“ / 硫붿꽭吏?붿빟)
  //    ctxType: book-basic / book-struct / book-summary
  // ===============================
  if (ctxType && ctxType.startsWith('book-')) {
    const bookName = sermonEditor.dataset.bookName;
    if (!bookName) {
      alert('梨??뺣낫瑜?李얠쓣 ???놁뒿?덈떎.(bookName ?꾨씫)');
      return;
    }

    // ?대뼡 ??μ냼???ｌ쓣吏 寃곗젙
    const storeKey =
      ctxType === 'book-basic'  ? STORAGE_BOOK_BASIC  :
      ctxType === 'book-struct' ? STORAGE_BOOK_STRUCT :
                                  STORAGE_BOOK_SUMMARY; // book-summary

    const map = getDocMap(storeKey);
    map[bookName] = { title, body, images: imgs, date };
    setDocMap(storeKey, map);

    // 梨??⑥쐞???몄쭛湲곕? ?レ? ?딄퀬 ?좎?
    status(`??λ맖(梨?${bookName} 쨌 ${title})`);
    return;
  }

  // ===============================
  // 2) ?⑤씫 而⑦뀓?ㅽ듃 ?먮뵒??(?⑥쐞?깃꼍??留λ씫 / ?꾩껜?깃꼍??留λ씫 / 二쇱꽍 / ?댁슜?붿빟)
  //    ctxType: unit / whole / commentary / summary
  // ===============================
  if (ctxType) {
    if (!BIBLE || !CURRENT || CURRENT.book == null ||
        !Number.isFinite(CURRENT.chap) || !Number.isFinite(CURRENT.paraIdx)) {
      alert('?⑤씫 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎. 癒쇱? ?⑤씫???좏깮??二쇱꽭??');
      return;
    }

    const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
    if (!para) {
      alert('?좏깮???⑤씫??李얠쓣 ???놁뒿?덈떎.');
      return;
    }

    const pid = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;

    const key =
      ctxType === 'unit'       ? STORAGE_UNIT_CTX :
      ctxType === 'whole'      ? STORAGE_WHOLE_CTX :
      ctxType === 'commentary' ? STORAGE_COMMENTARY :
                                 STORAGE_SUMMARY; // ?⑤씫 ?댁슜?붿빟

    const map = getDocMap(key);
    map[pid] = { title, body, images: imgs, date };
    setDocMap(key, map);

    sermonEditor.dataset.ctxType = '';
    sermonEditor.classList.remove('context-editor');
    modalWrap.style.display = 'none';
    // 紐⑤떖???ㅼ젣濡??ロ엺 ?꾩뿉留?aria-hidden??true濡??ㅼ젙
    requestAnimationFrame(() => {
      if (modalWrap.style.display === 'none') {
        modalWrap.setAttribute('aria-hidden', 'true');
      }
    });
    status(`??λ맖: ${title}`);
    return;
  }

  // ===============================
  // 3) ?쇰컲 ?ㅺ탳(?⑤씫??遺숇뒗 ?ㅺ탳 由ъ뒪?? ???
  // ===============================
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      alert('?⑤씫??癒쇱? ?좏깮??二쇱꽭??');
      return;
    }
    const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
    CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  }

  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  // editing 蹂?섎뒗 ?꾩뿉???대? ?좎뼵??(2872踰?以?

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
  const saved = setSermonMap(map, true); // 利됱떆 ???
  
  // ????뺤씤
  if (!saved) {
    console.error('?ㅺ탳 ????ㅽ뙣');
    alert('?ㅺ탳 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄??二쇱꽭??');
    return;
  }

  // ?ㅺ탳紐⑸줉???쒖떆?섏뼱 ?덉쑝硫?紐⑸줉?쇰줈 ?뚯븘媛湲? ?꾨땲硫??몄쭛湲??좎?
  const hasSermonList = sermonList.innerHTML.trim() !== '';
  const isEditorHidden = sermonEditor.style.display === 'none';
  
  // ??????ㅺ탳紐⑸줉 媛깆떊 (??λ맂 ?댁슜??諛섏쁺?섎룄濡?
  if (hasSermonList && isEditorHidden) {
    // ?ㅺ탳紐⑸줉 紐⑤떖???대젮?덈뒗 寃쎌슦 - 紐⑸줉?쇰줈 ?뚯븘媛湲?
    sermonEditor.style.display = 'none';
    renderSermonList(); // ??λ맂 ?댁슜???ㅼ떆 遺덈윭????쒖떆
  } else {
    // ?ㅺ탳蹂닿린 ?붾㈃?먯꽌 吏곸젒 ??ν븳 寃쎌슦 - ?몄쭛湲??좎?
    // ?몄쭛 紐⑤뱶 ?낅뜲?댄듃 (???ㅺ탳媛 異붽???寃쎌슦)
    if (editing === '') {
      // ???ㅺ탳媛 異붽??섏뿀?쇰?濡?泥?踰덉㎏ ?ㅺ탳濡??몄쭛 紐⑤뱶 ?ㅼ젙
      sermonEditor.dataset.editing = '0';
    }
    // ????꾩뿉???몄쭛湲??좎?
    sermonEditor.style.display = '';
    // ?ㅺ탳紐⑸줉???④꺼???덉뼱????μ? ?꾨즺?섏뿀?쇰?濡? ?섏쨷??紐⑸줉???대㈃ ??λ맂 ?댁슜??蹂댁엫
  }
  
  status('?ㅺ탳媛 ??λ릺?덉뒿?덈떎.');
};

/* ===== RTE ?좏떥 ===== */
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

// 臾몄옣 ?⑥쐞 ??룆???꾪븳 ?곹깭
let EDITOR_TTS = {
  sents: [],
  idx: 0,
  playing: false,
  synth: window.speechSynthesis || null,
  utter: null
};

// HTML???쇰컲 ?띿뒪?몃줈 蹂??
function htmlToPlainText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  tmp.querySelectorAll('sup').forEach(s => s.textContent = '[' + s.textContent + '] ');
  return (tmp.textContent || '').replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n').replace(/\s+/g, ' ').trim();
}

// 臾몄옣 遺꾪븷 (?쒓뎅???곷Ц 醫낃껐遺??湲곗?)
function splitToSentences(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/u).filter(s => s && s.trim().length > 0);
  return parts;
}

function toggleEditorSpeak(){
  // speechSynthesis媛 ?놁쑝硫??ъ떆??
  if(!EDITOR_TTS.synth) {
    EDITOR_TTS.synth = window.speechSynthesis || null;
    if(!EDITOR_TTS.synth) return alert('??釉뚮씪?곗????뚯꽦?⑹꽦??吏?먰븯吏 ?딆뒿?덈떎.');
  }
  
  // ?ъ깮 以묒씤 寃쎌슦 ?쇱떆?뺤?/?ш컻 泥섎━
  if(EDITOR_TTS.playing) {
    if(EDITOR_TTS.synth.speaking && !EDITOR_TTS.synth.paused) {
      // ?쇱떆?뺤?
      EDITOR_TTS.synth.pause();
      editorSpeakBtn.textContent = '?ш컻';
      return;
    } else if(EDITOR_TTS.synth.paused) {
      // ?ш컻
      EDITOR_TTS.synth.resume();
      editorSpeakBtn.textContent = '?쇱떆?뺤?';
      return;
    } else {
      // ?ъ깮 以묒씠吏留?speaking??false??寃쎌슦 以묒?
      stopEditorSpeak();
      return;
    }
  }

  // ?쒕ぉ怨?蹂몃Ц 媛?몄삤湲?
  const title = (sermonTitle.value || '').trim();
  const bodyHTML = getBodyHTML();
  const bodyPlain = htmlToPlainText(bodyHTML);
  const fullText = [title, bodyPlain].filter(Boolean).join('. ');
  
  if(!fullText){ 
    alert('??룆???댁슜???놁뒿?덈떎.'); 
    return; 
  }

  // 臾몄옣 ?⑥쐞濡?遺꾪븷
  EDITOR_TTS.sents = splitToSentences(fullText);
  if (EDITOR_TTS.sents.length === 0) {
    alert('??룆???댁슜???놁뒿?덈떎.');
    return;
  }

  EDITOR_TTS.idx = 0;
  EDITOR_TTS.playing = true;
  editorSpeakBtn.textContent = '?쇱떆?뺤?';
  
  // 泥?臾몄옣遺???쒖옉
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
  
  if(!silent) status('?ㅺ탳 ??룆??以묒??덉뒿?덈떎.'); 
  editorSpeakBtn.textContent = '??룆';
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

/* === ?앹뾽 ?몄쭛湲?(?ㅽ겕由쏀듃 遺꾨━ 踰꾩쟾) === */
function openSermonEditorWindow(idx){
  const map = getSermonMap();
  const arr = map[CURRENT.paraId] || [];
  const it  = arr[idx];
  // ???ㅺ탳??寃쎌슦(idx媛 0?닿퀬 鍮??ㅺ탳媛 ?덈뒗 寃쎌슦) ?덉슜
  if(!it && !(idx === 0 && arr.length > 0 && arr[0].id)){ 
    alert('?몄쭛???ㅺ탳瑜?李얠쓣 ???놁뒿?덈떎.'); 
    return; 
  }

  const para = BIBLE.books[CURRENT.book][CURRENT.chap].paras[CURRENT.paraIdx];
  const versesRaw = Array.isArray(para?.verses) ? para.verses : [];

  const meta = {
    paraId: CURRENT.paraId,
    idx,
    ref: `${CURRENT.book} ${CURRENT.chap}??쨌 ${(para?.title || para?.ref || '')} (${para?.ref || ''})`,
    title: it.title || '',
    body:  it.body  || '',
    date:  it.date || '',
    verses: versesRaw
  };

  const w = window.open('', '_blank', 'width=1100,height=820');
  if(!w){ alert('?앹뾽??李⑤떒?섏뿀?듬땲?? 釉뚮씪?곗? ?앹뾽???덉슜?댁＜?몄슂.'); return; }
  w.__WBPS_META__ = meta;
  if (w.opener && w.opener.firebase) { w.firebase = w.opener.firebase; }

  let popupHTML = String.raw`<!DOCTYPE html><html lang="ko">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>?ㅺ탳 ?몄쭛</title>
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

.context-editor{font-family:"Noto Serif KR","Nanum Myeong怨?,serif;font-size:1.05rem;line-height:1.85;letter-spacing:.02em;word-break:keep-all}

.notion-header{display:flex;align-items:center;gap:8px;margin-top:8px}
.notion-header .title{flex:1 1 auto;background:#161922;color:#e6e8ef;border:1px solid #2a3040;border-radius:8px;padding:10px 12px;font-weight:700}
.notion-header .meta{display:flex;gap:8px;align-items:center}
.notion-badge{font-size:11px;color:#9aa0ab}

#editorRoot{max-width:880px;margin:12px auto 8px;padding:0 6px}
#editorRoot.speaking{background:color-mix(in hsl, var(--accent) 8%, black 0%) !important; border-left:3px solid var(--accent) !important; border-radius:8px; padding-left:8px !important}
#editorRoot .sentence-speaking{background:color-mix(in hsl, var(--accent) 30%, black 0%); border-radius:4px; padding:2px 0; font-weight:600; transition:background 0.2s; animation:pulse-sentence 2s ease-in-out infinite}
@keyframes pulse-sentence{ 0%, 100%{ background:color-mix(in hsl, var(--accent) 30%, black 0%) } 50%{ background:color-mix(in hsl, var(--accent) 40%, black 0%) } }

/* .bubble ?ㅽ????쒓굅??- 怨듯넻 ?뚮줈???대컮 紐⑤뱢 ?ъ슜 */

/* ?뚮줈???쒖떇?대컮 ?ㅽ???(蹂몃Ц怨??숈씪) */
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

/* === ?몄쭛湲?main) ?ㅽ겕濡?諛?寃뱀묠 諛⑹? 蹂댁젙 === */
/* body瑜?3??洹몃━???ㅻ뜑/硫붿씤/?명꽣)濡? 硫붿씤? ?ㅽ겕濡?媛??*/
body{
  display: grid;
  grid-template-rows: 56px 1fr 56px;
  height: 100vh !important;
  overflow: hidden !important;
}

/* main? ?ㅽ겕濡ㅼ씠 媛?ν빐????+ footer/floatingBar??媛由ъ? ?딅룄濡??섎떒 ?щ갚 */
main{
  position: relative;
  z-index: 1;
  overflow-y: auto !important;
  padding-top: 12px;
  padding-bottom: 140px; /* footer ?믪씠 + ?ъ쑀 */
  height: calc(100vh - 112px) !important; /* 56(header)+56(footer) */
}

/* ?몄쭛 ?곸뿭 ?먯껜 ?щ갚 ?뺣낫(?꾨옒履?異⑸텇???꾩썙??寃뱀묠 諛⑹?) */
#editorRoot{
  position: relative;
  z-index: 1;
  max-width: 880px;
  margin: 12px auto 100px;  /* ?꾨옒 ?ъ쑀 */
  overflow: visible;
}

/* ?뚮줈??踰꾪듉怨쇱쓽 寃뱀묠??理쒖냼???꾩슂 ?? */
#floatingBar{
  z-index: 50;
}
html, body { height:auto !important; overflow:auto !important; }
main { height:auto !important; overflow:visible !important; }

/* === 臾몄옣 ??룆 ?섏씠?쇱씠?몄슜 ?쎄린 ?⑤꼸 === */
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
  <strong>?ㅺ탳 ?몄쭛</strong><span class="muted" id="ref"></span>
  <div class="grow"></div>
  <button id="x">?リ린</button>
</header>

<main>
  <input id="t" class="title-input" type="text" autocomplete="off" placeholder="?ㅺ탳 ?쒕ぉ???낅젰?섏꽭??>
  <div class="notion-header">
    <input id="neTitle" class="title" placeholder="?쒕ぉ???낅젰?섏꽭?? />
    <div class="meta">
      <button id="nePublish" class="primary">寃뚯떆</button>
      <button id="neStt">?럺 STT</button>
    </div>
  </div>

  <!-- ?뚮줈???쒖떇?대컮(蹂몃Ц ?덈Ц?μ슜怨??숈씪) -->
  <div id="wbp-plbar" hidden role="toolbar" aria-label="???쒖떇">
    <button type="button" data-cmd="createLink" title="留곹겕 (Ctrl+K)">?뵕</button>
    <div class="divider"></div>
    <!-- ?ш린 ?ㅼ뿉 6???붾젅??+ 湲고? ?쒕∼?ㅼ슫??JS濡?二쇱엯?⑸땲??-->
  </div>

  <div id="editorRoot" class="rte" contenteditable="true" spellcheck="false" aria-label="Sermon Editor" style="min-height:360px;resize:vertical;padding:14px;background:#161922;border:1px solid #2a3040;border-radius:10px;line-height:1.85;letter-spacing:.015em;caret-color:var(--accent);outline:none"></div>

  <div id="readPane" aria-label="Reading Sentences"></div>

  <div class="notion-footer">
    <div class="notion-badge" id="neAutosave">?먮룞????湲곗쨷??/div>
    <details style="margin-top:6px">
      <summary>?렒 Sermon Tracer 濡쒓렇/??꾨씪??/summary>
      <div id="traceLog"></div>
    </details>
  </div>
</main>

<div id="floatingBar" aria-label="?꾧뎄 留됰?">
  <button id="btnInsertBibleFloating" class="primary">?깃꼍援ъ젅</button>
</div>

<footer>
  <span class="muted" id="date"></span><div class="grow"></div>
  <button id="print">?몄뇙(A4)</button>
  <button id="read" class="primary">??룆</button>
  <button id="stop">以묒?</button>
  <button class="danger" id="d">??젣</button>
  <button class="primary" id="s">???/button>
</footer>
</body>
</html>`;

  // ?쒗뵆由?蹂닿컙 諛?</script> 蹂댄샇
  popupHTML = popupHTML.replaceAll('${', '\\${');
  popupHTML = popupHTML.replaceAll('</script>', '<\\/script>');

  w.document.open();
  w.document.write(popupHTML);
  w.document.close();

  // ?앹뾽 珥덇린???ㅽ뻾
  initSermonPopup(w);

  // 遺紐⑥갹 硫붿떆吏 ?몃뱾??(?????젣 諛섏쁺)
  const onMsg = (ev) => {
    const data = ev?.data || {};
    if (!data.type) return;

    const map2 = getSermonMap();
    const arr2 = map2[CURRENT.paraId] || [];

    if (data.type === 'sermon-save') {
      const now  = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      
      // ???ㅺ탳??寃쎌슦 (idx媛 諛곗뿴 踰붿쐞瑜?踰쀬뼱?섍굅???대떦 ?몃뜳?ㅼ뿉 ??ぉ???녿뒗 寃쎌슦)
      if (!arr2[idx]) {
        // ???ㅺ탳 異붽?: idx媛 0?닿퀬 泥?踰덉㎏ ??ぉ??鍮??ㅺ탳??寃쎌슦 ?대떦 ??ぉ??id ?ъ슜
        let newId;
        if (idx === 0 && arr2.length > 0 && arr2[0] && arr2[0].id) {
          newId = arr2[0].id;
          // 鍮??ㅺ탳瑜??ㅼ젣 ?댁슜?쇰줈 援먯껜
          arr2[0] = { id: newId, title: data.title, body: data.body, images: data.images || [], date, link: arr2[0].link || '' };
        } else {
          newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
          // 諛곗뿴??idx蹂대떎 ?묒쑝硫??뺤옣
          while (arr2.length <= idx) {
            arr2.push(null);
          }
          arr2[idx] = { id: newId, title: data.title, body: data.body, images: data.images || [], date, link: '' };
        }
      } else {
        // 湲곗〈 ?ㅺ탳 ?낅뜲?댄듃 (鍮??ㅺ탳???낅뜲?댄듃)
        arr2[idx] = { ...arr2[idx], title: data.title, body: data.body, images: data.images || arr2[idx].images || [], date };
      }
      
      map2[CURRENT.paraId] = arr2;
      setSermonMap(map2);
      status('?ㅺ탳媛 ??λ릺?덉뒿?덈떎.');
      window.removeEventListener('message', onMsg);
    }

    if (data.type === 'sermon-delete') {
      if (arr2[idx]) arr2.splice(idx, 1);
      map2[CURRENT.paraId] = arr2;
      setSermonMap(map2);
      status('?ㅺ탳媛 ??젣?섏뿀?듬땲??');
      // ?ㅺ탳 ??젣 ???⑤씫 ?꾨옒 ?ㅺ탳 ?뺣낫???쒓굅
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

/* ===== ?앹뾽 ?대? ?ㅽ겕由쏀듃 ===== */
function initSermonPopup(win){
  const w = win, d = w.document;

    // ===== 以묐났 ?쒕ぉ ?낅젰 ?④린湲??앹뾽 ?쒖젙) =====
  (function removeDuplicateTitle() {
    const d = win.document;
    // ?꾩옱 ?ъ슜 以묒씤 ?쒕ぉ ?낅젰移?
    const mainTitle = d.getElementById('neTitle');
    if (!mainTitle) return;

    // ?덉쟾 ?쒕ぉ input(#t ?????덈떎硫??④?
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

  $('ref').textContent  = ' ??' + (meta.ref || '');
  $('date').textContent = meta.date ? ('理쒓렐 ??? ' + meta.date) : '';

  $('t').value = meta.title || '';
  $('neTitle').value = meta.title || '';

  const neRoot    = $('editorRoot');
  const wbpPlbar  = $('wbp-plbar');
  const neAutosave= $('neAutosave');
  const editorMain = neRoot.closest('main') || d.body;

  // ?⑥닚 contenteditable ?먮뵒??珥덇린??
  if (!neRoot.innerHTML || /^\s*$/.test(neRoot.innerHTML)) {
    neRoot.innerHTML = '<p>?ш린???ㅺ탳瑜??묒꽦?섏꽭??</p>';
  }

  // ?봺 怨듯넻 ?뚮줈???대컮 紐⑤뱢 ?ъ슜 (蹂몃Ц ?덈Ц?μ슜怨??숈씪)
  if (wbpPlbar && neRoot && typeof createFloatingToolbar === 'function') {
    // 7???붾젅??二쇱엯 (?곗깋 ?ы븿, 湲고????쒕∼?ㅼ슫 ?쒓굅)
    (function injectPalette(){
      if(wbpPlbar.querySelector('.wbp-colors')) return;
      const PALETTE = ['#ff4d4f','#faad14','#fadb14','#52c41a','#1677ff','#722ed1','#ffffff'];
      const wrap = d.createElement('div');
      wrap.className = 'wbp-colors';
      PALETTE.forEach(hex=>{
        const b = d.createElement('button');
        b.type='button'; 
        b.title=hex === '#ffffff' ? '?곗깋' : hex; 
        b.style.cssText=`width:22px;height:22px;border-radius:5px;border:1px solid ${hex === '#ffffff' ? '#666' : '#2a3040'};background:${hex};`;
        b.addEventListener('click', ()=>{
          d.execCommand?.('foreColor', false, hex);
          NscheduleAutosave();
        });
        wrap.appendChild(b);
      });
      wbpPlbar.appendChild(wrap);
    })();

    // selectionFilter: ?먮뵒??猷⑦듃 ?덉뿉?쒕쭔 ?덉슜
    function inEditor() {
      const sel = w.getSelection();
      if (!sel || sel.rangeCount === 0) return false;

      const c = sel.getRangeAt(0).commonAncestorContainer;
      const el = (c.nodeType === 1 ? c : c.parentElement);
      if (!el) return false;

      // ?먮뵒??猷⑦듃 ?덉뿉 ?덈뒗吏 ?뺤씤
      return neRoot.contains(el);
    }

    // 紐낅졊 ?몃뱾?? execCommand ???먮룞???
    function handleCommand(cmd, val) {
      d.execCommand(cmd, false, val);
      NscheduleAutosave();
    }

    // ?됱긽 ?낅젰 ?붿냼 李얘린 (?붾젅?몃뒗 踰꾪듉?대?濡?null)
    const vcolor = null; // 蹂몃Ц怨??щ━ ?됱긽 ?낅젰? ?붾젅?몃줈 泥섎━

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

  // ?⑥닚 HTML 媛?몄삤湲??ㅼ젙 ?⑥닔
  function getEditorHTML(){
    return neRoot.innerHTML || '';
  }
  
  function setEditorHTML(html){
    neRoot.innerHTML = html || '<p>?ш린???ㅺ탳瑜??묒꽦?섏꽭??</p>';
  }

  // ?낅젰 ?대깽??由ъ뒪??異붽?
  neRoot.addEventListener('input', ()=> {
    NscheduleAutosave();
  });

  let NsaveTimer=null;
  function NscheduleAutosave(){
    clearTimeout(NsaveTimer);
    neAutosave.textContent = '입력 중';
    NsaveTimer = setTimeout(()=>{
      try{
        const key = `wbps.sermon.draft.${(meta.paraId||'')}.${(meta.idx||0)}`;
        const plainText = htmlToPlain(getEditorHTML());
        const payload = {
          title: ($('neTitle').value||''),
          body_text: plainText,
          body_compressed: compressDraftText(plainText),
          ts: Date.now()
        };
        saveState(key, payload);
        neAutosave.textContent = '자동저장됨';
      }catch(_){ neAutosave.textContent = '자동저장 실패'; }
    }, 500);
  }

  // 珥덇린?? 湲곗〈 HTML 濡쒕뱶
  (function Ninit(){
    if (meta.body) {
      setEditorHTML(meta.body);
    }
    setTimeout(()=>{ neRoot.focus(); }, 60);
  })();

  // 怨듯넻 ?⑥닔: HTML???쇰컲 ?띿뒪?몃줈 蹂??
  function htmlToPlain(html){
    const tmp=d.createElement('div'); tmp.innerHTML=html||'';
    tmp.querySelectorAll('sup').forEach(s=> s.textContent='['+s.textContent+'] ');
    return (tmp.textContent||'').replace(/\s+\n/g,'\n').replace(/\n{2,}/g,'\n').replace(/\s+/g,' ').trim();
  }
  
  // 怨듯넻 ?⑥닔: 臾몄옣 遺꾪븷
  function splitToSentences(text){
    const t = String(text||'').trim();
    if(!t) return [];
    const parts = t.split(/(?<=[.!?])\s+/u).filter(s=>s && s.trim().length>0);
    return parts;
  }
  
  // 怨듯넻 ?⑥닔: ?ㅺ탳 ?몄쭛湲곗쓽 紐⑤뱺 臾몄옣 異붿텧 (STT? ??룆 紐⑤몢?먯꽌 ?ъ슜)
  function extractAllSentences(){
    const html = getEditorHTML();
    const title = (d.getElementById('neTitle').value || d.getElementById('t').value || '').trim();
    const plain = [title, htmlToPlain(html)].filter(Boolean).join('. ');
    const sents = splitToSentences(plain);
    
    // 媛?臾몄옣???랁븳 ?붿냼 李얘린 (contenteditable 吏곸젒 ?ъ슜)
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
  
  // 怨듯넻 ?⑥닔: 臾몄옣 ?섏씠?쇱씠???쒓굅 (STT? ??룆 紐⑤몢?먯꽌 ?ъ슜)
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
  
  // 怨듯넻 ?⑥닔: 臾몄옣 ?섏씠?쇱씠??(STT? ??룆 紐⑤몢?먯꽌 ?ъ슜)
  function highlightSentence(sentIndex, sentEl){
    if (!sentEl || sentIndex < 0) return;
    
    clearSentenceHighlight();
    
    const { block, content, sentence } = sentEl;
    if (!block || !content) return;
    
    // ?먮뵒?곗뿉 speaking ?대옒??異붽?
    if (block === d.getElementById('editorRoot')) {
      block.classList.add('speaking');
    }
    
    // 臾몄옣??span?쇰줈 媛먯떥???섏씠?쇱씠??
    const contentText = htmlToPlain(content.innerHTML);
    const sentenceStart = contentText.indexOf(sentence);
    
    if (sentenceStart === -1) {
      // 臾몄옣??李얠? 紐삵븳 寃쎌슦 釉붾줉留??섏씠?쇱씠??
      return;
    }
    
    // ?띿뒪???몃뱶?먯꽌 臾몄옣 ?꾩튂 李얘린
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
    
    // 臾몄옣??span?쇰줈 媛먯떥湲?
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
        
        // 釉붾줉???붾㈃??蹂댁씠?꾨줉 ?ㅽ겕濡?
        block.scrollIntoView({block:'center', behavior:'smooth'});
      } catch (e) {
        // 踰붿쐞媛 ?щ윭 ?몃뱶??嫄몄퀜 ?덈뒗 寃쎌슦
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
          console.warn('臾몄옣 ?섏씠?쇱씠???ㅽ뙣:', e2);
        }
      }
    }
  }

  // STT with Sentence Highlighting
  (function(){
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if(!SR){ console.warn('STT unavailable'); return; }
    const rec = new SR(); rec.lang='ko-KR'; rec.interimResults=true; rec.continuous=true;

    let activeBlock=null, accText='', startedAt=null;
    let currentHighlightedIndex = -1; // ?꾩옱 ?섏씠?쇱씠?몃맂 臾몄옣 ?몃뜳??
    let allSentences = []; // 紐⑤뱺 臾몄옣 諛곗뿴
    let sentenceElements = []; // 媛?臾몄옣???랁븳 DOM ?붿냼 諛곗뿴
    
    function getActive(){ return d.getElementById('editorRoot'); }
    function setProgress(block, ratio){ /* 吏꾪뻾瑜??쒖떆 ?쒓굅 (?⑥닚 ?먮뵒?곗뿉?쒕뒗 遺덊븘?? */ }
    function plain(html){ return htmlToPlain(html); } // 怨듯넻 ?⑥닔 ?ъ슜
    function sim(a,b){ a=a.replace(/\s+/g,''); b=b.replace(/\s+/g,''); const L=Math.max(a.length,1); let m=0; for(let i=0;i<Math.min(a.length,b.length);i++){ if(a[i]===b[i]) m++; } return m/L; }
    function nextBlock(block){ return null; /* ?⑥닚 ?먮뵒?곗뿉?쒕뒗 ?ㅼ쓬 釉붾줉 媛쒕뀗 ?놁쓬 */ }
    
    // clearSentenceHighlight? highlightSentence???꾩뿉??怨듯넻 ?⑥닔濡??뺤쓽??(??룆 ?뱀뀡怨?怨듭쑀)
    
    // ?뚯꽦 ?몄떇 ?띿뒪?몄? 臾몄옣 留ㅼ묶
    function matchSentence(recognizedText){
      if (!recognizedText || recognizedText.trim().length < 3) return -1;
      
      const normalized = recognizedText.replace(/\s+/g, '').toLowerCase();
      const searchStart = Math.max(0, currentHighlightedIndex);
      const searchEnd = Math.min(allSentences.length, searchStart + 5); // ?꾩옱 ?꾩튂遺??5臾몄옣源뚯? 寃??
      
      let bestMatch = -1;
      let bestScore = 0;
      const threshold = 0.6; // ?좎궗???꾧퀎媛?
      
      for (let i = searchStart; i < searchEnd; i++) {
        const sent = allSentences[i];
        if (!sent) continue;
        
        const sentNormalized = sent.replace(/\s+/g, '').toLowerCase();
        
        // 遺遺??쇱튂 泥댄겕
        if (sentNormalized.includes(normalized) || normalized.includes(sentNormalized)) {
          const score = Math.min(normalized.length, sentNormalized.length) / Math.max(normalized.length, sentNormalized.length);
          if (score > bestScore && score >= threshold) {
            bestScore = score;
            bestMatch = i;
          }
        }
        
        // ?좎궗??怨꾩궛 (媛꾨떒??臾몄옄???좎궗??
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
        neSttBtn.textContent='?럺 STT';
        clearSentenceHighlight();
        currentHighlightedIndex = -1;
        return;
      }
      
      // 臾몄옣 異붿텧
      const extracted = extractAllSentences();
      allSentences = extracted.sentences;
      sentenceElements = extracted.elements;
      currentHighlightedIndex = -1;
      
      if (allSentences.length === 0) {
        w.alert('?ㅺ탳 ?댁슜???놁뒿?덈떎. 癒쇱? ?ㅺ탳瑜??묒꽦?댁＜?몄슂.');
        return;
      }
      
      activeBlock = getActive();
      accText='';
      startedAt=Date.now();
      rec.start();
      neSttBtn.dataset.on='1';
      neSttBtn.textContent='??以묒?';
    });

    rec.onresult = (ev)=>{
      if(!activeBlock) return;
      const r = ev.results[ev.results.length-1];
      const txt = r[0].transcript;
      const isFinal = r.isFinal;
      
      accText += (isFinal ? txt + ' ' : txt);
      
      // 吏꾪뻾瑜??쒖떆 ?쒓굅 (?⑥닚 ?먮뵒?곗뿉?쒕뒗 遺덊븘??

      const t = ((Date.now()-startedAt)/1000).toFixed(1);
      const neTrace = d.getElementById('traceLog');
      if (neTrace) {
        neTrace.textContent += `t=${t}s : ${txt}\n`;
        neTrace.scrollTop = neTrace.scrollHeight;
      }

      // 臾몄옣 留ㅼ묶 諛??섏씠?쇱씠??(理쒖쥌 寃곌낵???뚮쭔)
      if (isFinal && txt.trim().length >= 3) {
        const matchedIndex = matchSentence(txt);
        if (matchedIndex >= 0 && matchedIndex < sentenceElements.length) {
          currentHighlightedIndex = matchedIndex;
          highlightSentence(matchedIndex, sentenceElements[matchedIndex]);
        }
      }

      // 釉붾줉 ?꾨즺 泥댄겕 ?쒓굅 (?⑥닚 ?먮뵒?곗뿉?쒕뒗 遺덊븘??
    };
    
    rec.onend = ()=>{
      if(neSttBtn.dataset.on==='1'){
        rec.start();
      }
    };
    
    rec.onerror = (e)=> {
      console.warn('STT ?ㅻ쪟', e.error);
      if (e.error === 'no-speech') {
        // ?뚯꽦???놁쓣 ?뚮뒗 ?먮룞 ?ъ떆??
        if(neSttBtn.dataset.on==='1'){
          setTimeout(() => rec.start(), 1000);
        }
      }
    };
  })();

  // 寃뚯떆(Firebase ?듭뀡)
  const nePubBtn = d.getElementById('nePublish');
  nePubBtn?.addEventListener('click', async ()=>{
    try{
      if(typeof w.firebase === 'undefined'){ w.alert('Firebase 誘명깙?? 寃뚯떆 湲곕뒫???ъ슜?섎젮硫?SDK/珥덇린?붽? ?꾩슂?⑸땲??'); return; }
      const user = w.firebase.auth().currentUser;
      if(!user){ w.alert('濡쒓렇????寃뚯떆 媛?ν빀?덈떎.'); return; }

      const db = w.firebase.firestore();
      const docRef = NSTATE.docId ? db.collection('sermons').doc(NSTATE.docId) : db.collection('sermons').doc();
      const payload = {
        title: (d.getElementById('neTitle').value||'臾댁젣'),
        blocks: NSTATE.blocks,
        owner: user.uid,
        updatedAt: w.firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: w.firebase.firestore.FieldValue.serverTimestamp(),
        status: 'published'
      };
      await docRef.set(payload, {merge:true});
      NSTATE.docId = docRef.id;
      const url = w.location.origin + '/viewer.html?id=' + docRef.id;
      w.alert('寃뚯떆 ?꾨즺!\n' + url);
    }catch(err){ console.error(err); w.alert('寃뚯떆 ?ㅽ뙣: '+err.message); }
  });

  // ?깃꼍援ъ젅 ?쎌엯
  d.getElementById('btnInsertBibleFloating')?.addEventListener('click', insertBiblePrompt);
  async function insertBiblePrompt(){
    const raw = w.prompt('삽입할 성경구절을 입력하세요. 예: 요 3:16, 창세기 1:1-3');
    if(!raw) return;
    const norm=String(raw).replace(/\s+/g,' ').replace(/[–—-]/g,'-').replace(/[：:]/g,':').trim();
    const m=norm.match(/^(.+?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/);
    if(!m){ w.alert('형식: 성경이름 장:절 또는 장:절-절'); return; }
    const bookRaw=m[1], chap=parseInt(m[2],10), vFrom=parseInt(m[3],10), vTo=m[4]?parseInt(m[4],10):parseInt(m[3],10);

    let BOOKS;
    try{ BOOKS = await getBooksInPopup(); }
    catch(e){ w.alert(e.message || '성경 데이터를 불러올 수 없습니다.'); return; }

    const bookKey=resolveBookKey(bookRaw,BOOKS);
    if(!bookKey){ w.alert(`해당 성경을 찾을 수 없습니다: "${bookRaw}"`); return; }

    const ch=BOOKS[bookKey]?.[chap];
    if(!ch){ w.alert(`"${bookKey}" ${chap}?μ쓣 李얠쓣 ???놁뒿?덈떎.`); return; }

    const verses=(ch.paras||[]).flatMap(p=>p.verses||[]).filter(([v])=>v>=vFrom&&v<=vTo);
    if(!verses.length){ w.alert('?대떦 援ъ젅??李얠쓣 ???놁뒿?덈떎.'); return; }

    const header = `<div class="verse-header">&lt;${bookKey} ${chap}:${vFrom}${vTo!==vFrom?'-'+vTo:''}&gt;</div>`;
    const html = verses.map(([v,t])=>`<span class="verse-line"><sup>${v}</sup>${t}</span>`).join('');
    const blockHTML = header + html;

    // contenteditable??吏곸젒 ?쎌엯
    const editorRoot = d.getElementById('editorRoot');
    if (editorRoot) {
      const p = d.createElement('p');
      p.innerHTML = blockHTML;
      editorRoot.appendChild(p);
      NscheduleAutosave();
      // ?ъ빱?ㅻ? ?덈줈 異붽????붿냼濡??대룞
      const sel = w.getSelection();
      const range2 = d.createRange();
      range2.selectNodeContents(p);
      range2.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range2);
    }
  }

  // ?????젣/?リ린/?몄뇙
  // 20251114 12:48 援먯껜
  d.getElementById('s').onclick = ()=>{
    let html = getEditorHTML();

    // ??1) ?댁슜???녿뒗 <p>??/p> 鍮?以??쒓굅
    html = html.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*/gi, '');

    // ??2) 以꾨컮轅?3媛??댁긽 ??2媛쒕줈 異뺤냼
    html = html.replace(/\n{3,}/g, '\n\n');

    const title =
        (d.getElementById('neTitle').value || d.getElementById('t').value || '').trim()
        || '(?쒕ぉ ?놁쓬)';

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
  // 20251114 12:48 援먯껜

  d.getElementById('d').onclick = ()=>{ if(w.confirm('??젣?좉퉴??')){ w.opener?.postMessage?.({ type:'sermon-delete' }, '*'); w.close(); } };
  d.getElementById('x').onclick = ()=> w.close();
  d.getElementById('print').onclick = ()=> w.print();

  /* ========= 臾몄옣 ?⑥쐞 ??룆 + ?섏씠?쇱씠??+ ?붾㈃ 以묒븰 ?뺣젹 ========= */
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

  // htmlToPlain怨?splitToSentences???꾩뿉??怨듯넻 ?⑥닔濡??뺤쓽??(STT ?뱀뀡怨?怨듭쑀)

  function renderReadPane(){
    readPane.innerHTML = TTS.sents.map((s,i)=>`<span class="sent" data-i="${i}">${escapeHtml(s)}</span>`).join('');
    readPane.style.display = '';
  }

  function clearPaneHighlight(){
    readPane.querySelectorAll('.sent.reading').forEach(el=> el.classList.remove('reading'));
  }

  // ??룆??臾몄옣 ?붿냼 ???(STT 湲곕뒫怨??숈씪??援ъ“ ?ъ슜)
  let readingSentenceElements = [];
  
  function highlightIndex(i){
    clearPaneHighlight();
    const span = readPane.querySelector(`.sent[data-i="${i}"]`);
    if(span){
      span.classList.add('reading');
      span.scrollIntoView({block:'center', behavior:'smooth'});
    }
    
    // ?몄쭛湲?蹂몃Ц?먮룄 ?섏씠?쇱씠??(STT 湲곕뒫怨??숈씪???⑥닔 ?ъ슜)
    if (i >= 0 && i < readingSentenceElements.length) {
      highlightSentence(i, readingSentenceElements[i]);
    }
  }

  function speakIdx(i){
    // speechSynthesis媛 ?놁쑝硫??ъ떆??
    if(!TTS.synth) {
      TTS.synth = w.speechSynthesis || window.speechSynthesis || null;
      if(!TTS.synth) return;
    }
    if(i<0 || i>=TTS.sents.length){ stopReading(); return; }
    TTS.idx = i;
    try{ TTS.synth.cancel(); }catch(_){}
    const u = new w.SpeechSynthesisUtterance(TTS.sents[i]);
    // 遺紐⑥갹 ?뚯꽦 ?ㅼ젙??洹몃?濡??댁슜?섏? 紐삵븯誘濡?湲곕낯 ko-KR濡??ㅼ젙
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
    u.onerror = ()=>{ // ?ㅻ쪟 ???ㅼ쓬 臾몄옣?쇰줈 ?섏뼱媛??臾댄븳猷⑦봽 諛⑹?
      if(!TTS.playing) return;
      const next = i+1;
      if(next < TTS.sents.length) speakIdx(next); else stopReading();
    };
    TTS.utter = u;
    TTS.synth.speak(u);
  }

  function startReading(){
    // STT 湲곕뒫怨??숈씪??諛⑹떇?쇰줈 臾몄옣 異붿텧
    const extracted = extractAllSentences();
    const sents = extracted.sentences;
    if(!sents.length){ w.alert('??룆???댁슜???놁뒿?덈떎.'); return; }
    TTS.sents = sents;
    readingSentenceElements = extracted.elements; // STT? ?숈씪??援ъ“ ?ъ슜
    TTS.idx = 0;
    TTS.playing = true;
    renderReadPane();
    readBtn.textContent = '?쇱떆?뺤?';
    speakIdx(0);
  }

  function stopReading(){
    TTS.playing = false;
    try{ TTS.synth && TTS.synth.cancel(); }catch(_){}
    clearPaneHighlight();
    
    // ?몄쭛湲?蹂몃Ц ?섏씠?쇱씠?몃룄 ?쒓굅 (STT 湲곕뒫怨??숈씪???⑥닔 ?ъ슜)
    clearSentenceHighlight();
    
    readPane.style.display = 'none';
    readBtn.textContent = '??룆';
  }

  readBtn.onclick = ()=>{
    // speechSynthesis媛 ?놁쑝硫??ъ떆??
    if(!TTS.synth) {
      TTS.synth = w.speechSynthesis || window.speechSynthesis || null;
      if(!TTS.synth){ w.alert('??釉뚮씪?곗????뚯꽦?⑹꽦??吏?먰븯吏 ?딆뒿?덈떎.'); return; }
    }
    if(!TTS.playing){
      startReading();
    }else{
      // ?쇱떆?뺤? ?좉?: ?쇱떆?뺤? -> ?ш컻
      if(TTS.synth.speaking && !TTS.synth.paused){
        TTS.synth.pause();
        readBtn.textContent = '?ш컻';
      }else if(TTS.synth.paused){
        TTS.synth.resume();
        readBtn.textContent = '?쇱떆?뺤?';
      }else{
        startReading();
      }
    }
  };

  stopBtn.onclick = ()=> stopReading();

  // 臾몄옣 ?대┃ ???대떦 臾몄옣遺???ъ깮
  readPane.addEventListener('click', (e)=>{
    const span = e.target.closest('.sent');
    if(!span) return;
    const i = +span.dataset.i;
    if(!Number.isFinite(i)) return;
    if(!TTS.sents.length) return;
    TTS.playing = true;
    readBtn.textContent = '?쇱떆?뺤?';
    speakIdx(i);
  });

  // ?????젣/?リ린/??룆 ??
  /* ========= 臾몄옣 ?⑥쐞 ??룆 ?뱀뀡 ??========= */

  // 湲곗〈 以묒? 踰꾪듉 ?몃뱾?щ뒗 ?꾩뿉???泥? stopReading )濡?泥섎━??
  // 湲곗〈 ?⑥씪-臾몄옣 ?꾩껜 ??룆 濡쒖쭅? ?붽뎄?ы빆??留욎떠 臾몄옣 ?⑥쐞濡?移섑솚??

  // ?깃꼍 ?곗씠??濡쒕뱶 ?좏떥
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
    if(!__BOOKS_CACHE) throw new Error('?깃꼍 ?곗씠??BIBLE)瑜?遺덈윭?????놁뒿?덈떎.');
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
    return String(x || '').toLowerCase().replace(/\s+/g, '').replace(/[.\u00B7]/g, '');
  }
  function BOOK_ALIAS_MAP(){
    return {
      '창': '창세기',
      '창세기': '창세기',
      '요': '요한복음',
      '요한복음': '요한복음',
      '마': '마태복음',
      '마태복음': '마태복음',
      '막': '마가복음',
      '마가복음': '마가복음',
      '눅': '누가복음',
      '누가복음': '누가복음',
      '롬': '로마서',
      '로마서': '로마서'
    };
  }
}

/* ===== 紐⑤떖 RTE ?곷떒 ?⑤뵫 ?먮룞 蹂댁젙 ===== */
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

/* ===== ?몃씪???쒕ぉ ?몄쭛 ?붾? ===== */
function startInlineTitleEdit(){ /* ?꾩슂 ???ㅼ젣 援ы쁽?쇰줈 援먯껜 */ }

/* === 怨듯넻 ?뚮줈???대컮 紐⑤뱢 === */
function createFloatingToolbar(options) {
  const {
    barElement,
    colorElement,
    rootContainer,
    selectionFilter,
    commandHandler,
    windowObj = window,
    docObj = document
  } = options || {};

  if (!barElement || !rootContainer) return null;

  const w = windowObj;
  const d = docObj;
  const containerEl = typeof rootContainer === 'string' ? d.querySelector(rootContainer) : rootContainer;
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

  function hide() {
    barElement.hidden = true;
  }

  function showBar() {
    const sel = w.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return hide();
    if (selectionFilter && !selectionFilter()) return hide();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect) return hide();
    barElement.style.left = `${rect.left + rect.width / 2}px`;
    barElement.style.top = `${rect.top - 10}px`;
    barElement.style.transform = 'translate(-50%, -100%)';
    barElement.hidden = false;
    saveSel();
  }

  const execCmd = commandHandler || ((cmd, val) => d.execCommand(cmd, false, val));

  barElement.addEventListener('mousedown', e => e.preventDefault());
  barElement.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn || !restoreSel()) return;
    const cmd = btn.dataset.cmd;
    const mark = btn.dataset.mark;
    const action = btn.dataset.action;

    if (cmd === 'createLink' || action === 'link') {
      const url = w.prompt('링크 URL', 'https://');
      if (url) execCmd('createLink', url);
    } else if (cmd) {
      execCmd(cmd, null);
    } else if (mark) {
      execCmd(mark === 'highlight' ? 'backColor' : mark, mark === 'highlight' ? '#6655007a' : null);
    } else if (action === 'clearFmt') {
      execCmd('removeFormat', null);
      execCmd('unlink', null);
    }

    saveSel();
    showBar();
  });

  if (colorElement) {
    colorElement.addEventListener('input', () => {
      if (!restoreSel()) return;
      execCmd('foreColor', colorElement.value);
      saveSel();
      showBar();
    });
  }

  const triggerShowBar = () => setTimeout(showBar, 10);
  containerEl?.addEventListener('mouseup', triggerShowBar);
  containerEl?.addEventListener('keyup', triggerShowBar);
  d.addEventListener('selectionchange', triggerShowBar);
  d.addEventListener('mousedown', e => {
    if (!barElement.contains(e.target)) hide();
  });
  w.addEventListener('scroll', hide, true);
  w.addEventListener('resize', hide);

  d.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (!['b', 'i', 'u', 'k'].includes(k)) return;
    if (selectionFilter && !selectionFilter()) return;
    e.preventDefault();
    if (k === 'k') {
      const url = w.prompt('링크 URL', 'https://');
      if (url) execCmd('createLink', url);
    } else {
      execCmd(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'underline', null);
    }
    setTimeout(showBar, 0);
  });

  return { showBar, hide, saveSel, restoreSel };
}
/* === ?덈Ц???꾩슜 ?쒖떇 ?대컮 === */
(function(){
  const bar = document.getElementById('vbar') || document.getElementById('wbp-plbar');
  const color = document.getElementById('vcolor');
  const docEl = document.getElementById('doc');

  // ===== [INIT HOOK] BEGIN =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      safeBindFmtButtons(); // ?쒖떇??? ?쒖떇?붾났, ?쒖떇?대낫?닿린, ?쒖떇媛?몄삤湲?踰꾪듉
      ensureBookHeadChips();       // ?몚 媛??깃꼍梨?1??泥ル떒???ㅺ탳踰꾪듉 ?ㅻⅨ履쎌뿉 湲곕낯?댄빐, ?댁슜援ъ“, 硫붿꽭吏?붿빟 
      ensureGlobalBookChips();     // ?몚 ?ㅻ뜑??'?쒖떇媛?몄삤湲? ?ㅻⅨ履쎌뿉 ?꾩뿭 移⑹뒪
      // 踰꾪듉 ?됱긽 ?낅뜲?댄듃 (珥덇린????
      setTimeout(updateButtonColors, 500);
    });
  } else {
    safeBindFmtButtons();
    ensureBookHeadChips();       // ?몚 留덉?留됱뿉 ?몄텧 (?뺤갑)
    ensureGlobalBookChips();     // ?몚 ?ㅻ뜑??'?쒖떇媛?몄삤湲? ?ㅻⅨ履쎌뿉 ?꾩뿭 移⑹뒪
    // 踰꾪듉 ?됱긽 ?낅뜲?댄듃 (珥덇린????
    setTimeout(updateButtonColors, 500);
  }
  document.addEventListener('wbp:treeBuilt', ()=>{
    const root = document.getElementById('tree') || document;
    WBP_FMT.restoreAll(root);       // (湲곗〈 ?좎?)
    document.addEventListener('wbp:treeBuilt', ensureBookHeadChips);
  });
  // ===== [INIT HOOK] END =====

  const treeEl = document.getElementById('tree');
  if(!bar || !treeEl) return;

  // ?뵇 ?붾쾭源??⑤꼸 ?앹꽦 (?꾩뿭 ?ㅼ퐫??
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
          <strong style="color:#0f0;">?뵇 ?뚮줈???대컮 ?붾쾭洹?/strong>
          <button id="wbp-debug-close" style="background:#0f0; color:#000; border:none; padding:2px 8px; cursor:pointer; border-radius:4px;">??/button>
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
  
  // ?꾩뿭 ?붾쾭洹?濡쒓렇 ?⑥닔
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
      // 理쒕? 50媛?濡쒓렇留??좎?
      while (debugContent.children.length > 50) {
        debugContent.removeChild(debugContent.firstChild);
      }
    }
  };
  
  // 濡쒖뺄 蹂꾩묶
  const addDebugLog = window.__addDebugLog;
  
  // ?붾쾭洹??⑤꼸 ?쒖떆/?④? ?좉?
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

  // selectionFilter: 蹂몃Ц ?덈Ц?λ쭔 ?덉슜
  function inVerse() {
    const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false; // ?붾쾭源??뚮옒洹?
    const startTime = performance.now();
    
    try {
      // ?뵻 0) ?꾩옱 window媛 硫붿씤 window?몄? ?뺤씤 (?ㅺ탳 ?앹뾽 window ?쒖쇅)
      // ?ㅺ탳 ?앹뾽? 蹂꾨룄 window?대?濡????⑥닔??硫붿씤 window?먯꽌留??ㅽ뻾??
      if (window !== window.top || window.parent !== window) {
        if (DEBUG) {
          console.log('[inVerse] ?앹뾽 window ?쒖쇅');
          addDebugLog('???앹뾽 window ?쒖쇅', 'warn');
        }
        return false;
      }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      if (DEBUG) {
        console.log('[inVerse] ?좏깮 ?놁쓬');
        addDebugLog('???좏깮 ?놁쓬', 'warn');
      }
      return false;
    }
    
    if (DEBUG) {
      addDebugLog(`???좏깮 ?덉쓬 (rangeCount: ${sel.rangeCount}, collapsed: ${sel.isCollapsed})`, 'info');
    }
    // isCollapsed 泥댄겕??showBar()?먯꽌 ?대? 泥섎━?섎?濡??ш린?쒕뒗 ?쒓굅

    // ?뵻 4) ?ㅼ쭅 ?깃꼍 蹂몃Ц(#tree ??.verse ?먮뒗 .pline)???뚮쭔 true
    const treeEl = document.getElementById('tree');
    if (!treeEl) {
      if (DEBUG) {
        console.log('[inVerse] treeEl ?놁쓬');
        addDebugLog('??#tree ?붿냼 ?놁쓬', 'error');
      }
      return false;
    }
    
    if (DEBUG) {
      addDebugLog(`??#tree ?붿냼 李얠쓬`, 'info');
    }
    
    let range;
    try {
      range = sel.getRangeAt(0);
    } catch (e) {
      if (DEBUG) console.log('[inVerse] range ?묎렐 ?ㅽ뙣:', e);
      return false; // range ?묎렐 ?ㅽ뙣
    }
    
    const c  = range.commonAncestorContainer;
    const el = (c.nodeType === 1 ? c : c.parentElement);
    if (!el) {
      if (DEBUG) console.log('[inVerse] el ?놁쓬');
      return false;
    }

    // ?뵻 0-1) 紐⑤떖 泥댄겕???섏쨷???섑뻾 (癒쇱? .pcontent/.pline ?뺤씤)

    // ?뵻 1) ?좏깮???붿냼媛 硫붿씤 document???랁븯?붿? ?뺤씤 (?ㅺ탳 ?앹뾽 ?쒖쇅)
    try {
      if (el.ownerDocument !== document) {
        if (DEBUG) console.log('[inVerse] ?ㅻⅨ window??document ?쒖쇅');
        return false; // ?ㅻⅨ window??document硫??쒖쇅
      }
    } catch (e) {
      if (DEBUG) console.log('[inVerse] document ?묎렐 遺덇?:', e);
      return false; // ?묎렐 遺덇??ν븯硫??쒖쇅
    }

    // ?뵻 4) ?좏깮 ?곸뿭???쒖옉怨???而⑦뀒?대꼫瑜?癒쇱? ?뺤씤 (commonAncestorContainer蹂대떎 ?뺥솗)
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // ?쒖옉/??而⑦뀒?대꼫媛 .pcontent ?먮뒗 .pline ?대????덈뒗吏 ?뺤씤?섎뒗 ?ы띁 ?⑥닔
    function isInPcontent(container) {
      if (!container) return false;
      
      let node = container;
      if (container.nodeType === 3) { // ?띿뒪???몃뱶
        node = container.parentElement;
      }
      if (!node) return false;
      
      // .pcontent ?먮뒗 .pline 李얘린
      const pcontent = node.closest('.pcontent');
      const pline = node.closest('.pline');
      const verse = node.closest('.verse');
      const verseLine = node.closest('.verse-line');
      
      // .pcontent??.pline??#tree ?덉뿉 ?덉쑝硫?true
      if (pcontent && treeEl.contains(pcontent)) return true;
      if (pline && treeEl.contains(pline)) return true;
      if (verse && treeEl.contains(verse)) return true;
      if (verseLine && treeEl.contains(verseLine)) return true;
      
      return false;
    }
    
    // ?쒖옉 ?먮뒗 ?앹씠 .pcontent/.pline ?대????덉쑝硫??덉슜
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
        console.log('[inVerse] ??.pcontent/.pline ?대? ?좏깮 ?덉슜', info);
        addDebugLog(`??.pcontent/.pline ?대? ?좏깮 ?덉슜 (start: ${startInPcontent}, end: ${endInPcontent})`, 'success');
      }
      const elapsed = (performance.now() - startTime).toFixed(2);
      if (DEBUG) addDebugLog(`?깍툘 泥섎━ ?쒓컙: ${elapsed}ms`, 'info');
      return true;
    }
    
    if (DEBUG) {
      addDebugLog(`?좑툘 .pcontent/.pline ?대? ?좏깮 ?꾨떂 (start: ${startInPcontent}, end: ${endInPcontent})`, 'warn');
    }
    
    // ?뵻 5) commonAncestorContainer瑜??듯븳 異붽? ?뺤씤
    const pline = el.closest('.pline');
    const verse = el.closest('.verse');
    const verseLine = el.closest('.verse-line');
    const pcontent = el.closest('.pcontent');
    
    // ?뵻 5-1) #sermonEditor ?대? ?좏깮 泥섎━ (湲곕낯?댄빐 ?몄쭛湲곗뿉?쒕뒗 ?덉슜)
    const sermonEditor = el.closest('#sermonEditor');
    if (sermonEditor) {
      const sermonBody = sermonEditor.querySelector('#sermonBody');
      if (sermonBody) {
        // ?좏깮 ?곸뿭???쒖옉?대굹 ?앹씠 sermonBody ?대????덈뒗吏 ?뺤씤
        const startNode = startContainer.nodeType === 3 ? startContainer.parentElement : startContainer;
        const endNode = endContainer.nodeType === 3 ? endContainer.parentElement : endContainer;
        const startInSermonBody = sermonBody.contains(startNode);
        const endInSermonBody = sermonBody.contains(endNode);
        const elInSermonBody = sermonBody.contains(el) || el === sermonBody;
        
        if (startInSermonBody || endInSermonBody || elInSermonBody) {
          // 紐⑤뱺 ?몄쭛湲?紐⑤뱶?먯꽌 ?뚮줈???대컮 ?덉슜
          // - 梨??⑥쐞: book-basic, book-struct, book-summary
          // - ?⑤씫 ?⑥쐞: summary, unit, whole, commentary
          const ctxType = sermonEditor.dataset.ctxType;
          if (ctxType) {
            // 梨??⑥쐞 ?몄쭛湲??먮뒗 ?⑤씫 ?⑥쐞 ?몄쭛湲?紐⑤몢 ?덉슜
            const allowedTypes = ['summary', 'unit', 'whole', 'commentary'];
            if (ctxType.startsWith('book-') || allowedTypes.includes(ctxType)) {
              if (DEBUG) {
                console.log('[inVerse] ??#sermonBody ?좏깮 ?덉슜 (?몄쭛湲?', {
                  startInSermonBody,
                  endInSermonBody,
                  elInSermonBody,
                  ctxType
                });
              }
              return true; // ?몄쭛湲곗뿉?쒕뒗 ?덉슜
            }
          }
          if (DEBUG) {
            console.log('[inVerse] ??#sermonBody ?좏깮 ?쒖쇅', {
              startInSermonBody,
              endInSermonBody,
              elInSermonBody,
              ctxType,
              elTag: el.tagName,
              elId: el.id,
              elClass: el.className
            });
          }
          return false; // ?ㅻⅨ 紐⑤뱶?먯꽌???쒖쇅
        }
      }
    }
    
    // ?뵻 5-2) #tree ?덉뿉 ?덈뒗吏 ?뺤씤 (?깃꼍 蹂몃Ц ?곸뿭留??덉슜)
    const isInTree = treeEl.contains(el);
    if (DEBUG) {
      addDebugLog(`?뱧 #tree ?대? ?щ?: ${isInTree}`, 'info');
      addDebugLog(`  - el.tagName: ${el.tagName}, el.className: ${el.className}`, 'info');
      addDebugLog(`  - pcontent: ${!!pcontent}, pline: ${!!pline}, verse: ${!!verse}, verseLine: ${!!verseLine}`, 'info');
    }
    
    if (isInTree) {
      // .pcontent ?대??먯꽌 ?좏깮??寃쎌슦???덉슜 (?щ윭 .pline??嫄몄튇 ?좏깮 ?ы븿)
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
          console.log('[inVerse] ??#tree ?대? .pcontent/.pline ?좏깮 ?덉슜', info);
          addDebugLog(`??#tree ?대? .pcontent/.pline ?좏깮 ?덉슜`, 'success');
          addDebugLog(`  - pcontent: ${!!pcontent}, pline: ${!!pline}`, 'info');
        }
        const elapsed = (performance.now() - startTime).toFixed(2);
        if (DEBUG) addDebugLog(`?깍툘 泥섎━ ?쒓컙: ${elapsed}ms`, 'info');
        return true;
      } else {
        if (DEBUG) {
          addDebugLog(`??#tree ?대?吏留?.pcontent/.pline ?놁쓬`, 'error');
        }
      }
    }
    
    // ?뵻 7) #tree 諛뽰씠硫댁꽌 ??議곌굔???대떦?섏? ?딆쑝硫?false
    if (!isInTree) {
      // 紐⑤떖 ?대? ?붿냼 泥댄겕 (?대? ?꾩뿉???덉슜??寃쎌슦???쒖쇅)
      // ?? ?깃꼍 蹂몃Ц ?곸뿭(#tree ?대?)? ?대? ?꾩뿉??泥섎━?섏뿀?쇰?濡??ш린?쒕뒗 紐⑤떖 ?몄쭛湲곕쭔 泥댄겕
      const isInModal = el.closest('#modalWrap') || el.closest('.modal') || el.closest('#sermonList') || 
          el.closest('#rteToolbar') ||
          el.closest('.modal-backdrop') || el.closest('.editor-bar') || 
          (el.closest('.editor') && !treeEl.contains(el)) || el.closest('#modalFooterNew') ||
          el.closest('#editorRoot') || el.closest('#neFloatingBar') ||
          // .rte??紐⑤떖 ?대???#sermonBody留?泥댄겕 (?깃꼍 蹂몃Ц??.pcontent???쒖쇅)
          (el.closest('.rte') && el.closest('#sermonBody') && !treeEl.contains(el));
      
      if (isInModal) {
        if (DEBUG) {
          console.log('[inVerse] ??紐⑤떖 ?대? ?붿냼 ?쒖쇅', {
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
        console.log('[inVerse] ??#tree 諛뽰씠硫댁꽌 紐⑤떖???꾨떂');
      }
      return false;
    }
    
    // ?뵻 8) 紐⑤떖???대젮?덇퀬 ?좏깮??紐⑤떖 ?대????덉쑝硫?false (?? ?꾩뿉???덉슜??#tree ?대? ?좏깮? ?쒖쇅)
    // ?대? ?꾩뿉??.pcontent, .pline, #sermonBody ?대? ?좏깮? ?덉슜?섏뿀?쇰?濡?
    // ?ш린?쒕뒗 異붽?濡?泥댄겕???꾩슂媛 ?놁뒿?덈떎.
    
    if (DEBUG) {
      const info = {
        elTag: el.tagName,
        elId: el.id,
        elClass: el.className,
        isInTree,
        hasPcontent: !!pcontent,
        hasPline: !!pline
      };
      console.log('[inVerse] ??紐⑤뱺 議곌굔 遺덈쭔議? false 諛섑솚', info);
      addDebugLog('조건 불충족', 'error');
      addDebugLog(`  - isInTree: ${isInTree}, hasPcontent: ${!!pcontent}, hasPline: ${!!pline}`, 'error');
      addDebugLog(`  - el: ${el.tagName}.${el.className}`, 'error');
    }
    const elapsed = (performance.now() - startTime).toFixed(2);
    if (DEBUG) addDebugLog(`?깍툘 泥섎━ ?쒓컙: ${elapsed}ms`, 'info');
    return false;
    } catch (e) {
      // ?덉쇅 諛쒖깮 ??false 諛섑솚 (臾댄븳 猷⑦봽 諛⑹?)
      console.warn('inVerse() error:', e);
      return false;
    }
  }

  // 怨듯넻 紐⑤뱢 ?ъ슜
  const toolbar = createFloatingToolbar({
    barElement: bar,
    colorElement: color,
    rootContainer: treeEl,
    selectionFilter: inVerse,
    commandHandler: (cmd, val) => document.execCommand(cmd, false, val)
  });

  // 紐⑤떖???대┫ ???대컮 媛뺤젣 ?④? (?? ?몄쭛湲??대? ?좏깮? ?덉슜)
  const modalWrap = document.getElementById('modalWrap');
  if (modalWrap && toolbar) {
    // MutationObserver濡?紐⑤떖 ?곹깭 蹂??媛먯?
    const observer = new MutationObserver(() => {
      const isModalOpen = modalWrap.style.display === 'flex' || modalWrap.style.display === '';
      const ariaHidden = modalWrap.getAttribute('aria-hidden');
      
      // 紐⑤떖???대젮?덈뒗 ?곹깭?먯꽌 aria-hidden??true濡??ㅼ젙?섎뒗 寃껋쓣 諛⑹?
      if (isModalOpen && ariaHidden === 'true') {
        modalWrap.setAttribute('aria-hidden', 'false');
      }
      
      // 紐⑤떖???대젮?덉뼱???몄쭛湲??대? ?좏깮?대㈃ ?대컮瑜??쒖떆?????덈룄濡?
      // ?ш린?쒕뒗 ?④린吏 ?딄퀬, selectionFilter?먯꽌 ?덉슜??寃쎌슦?먮쭔 ?쒖떆?섎룄濡???
      // 紐⑤떖???ロ삍???뚮쭔 媛뺤젣濡??④?
      if (!isModalOpen && ariaHidden === 'true') {
        toolbar.hide();
      }
    });
    observer.observe(modalWrap, { 
      attributes: true, 
      attributeFilter: ['style', 'aria-hidden'] 
    });
    
    // 紐⑤떖???대┫ ??吏곸젒 ?대컮 ?④? (?대깽??由ъ뒪??
    // ?? ?깃꼍 蹂몃Ц ?곸뿭 ?좏깮? ?덉슜?섎?濡??ш린?쒕뒗 ?④린吏 ?딆쓬
    // selectionFilter(inVerse)?먯꽌 ?덉슜??寃쎌슦?먮쭔 ?쒖떆?섎룄濡???
    const originalDisplaySetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style')?.set;
    if (modalWrap.style) {
      // 紐⑤떖 ?닿린 ?⑥닔?ㅼ뿉???몄텧?????덈룄濡??꾩뿭 ?⑥닔濡??깅줉
      // ?? ?깃꼍 蹂몃Ц ?곸뿭?먯꽌???④린吏 ?딆쓬 (inVerse?먯꽌 ?덉슜)
      window.__hideFloatingToolbar = () => {
        const DEBUG = window.__DEBUG_FLOATING_TOOLBAR || false;
        if (DEBUG) {
          addDebugLog('__hideFloatingToolbar 호출', 'warn');
        }
        // ?깃꼍 蹂몃Ц ?곸뿭 ?좏깮???꾨땺 ?뚮쭔 ?④?
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          // inVerse()瑜?吏곸젒 ?몄텧?섏뿬 ?깃꼍 蹂몃Ц ?곸뿭?몄? ?뺤씤
          const treeEl = document.getElementById('tree');
          if (treeEl) {
            try {
              const range = sel.getRangeAt(0);
              const c = range.commonAncestorContainer;
              const el = (c.nodeType === 1 ? c : c.parentElement);
              if (el && treeEl.contains(el)) {
                // ?깃꼍 蹂몃Ц ?곸뿭?대㈃ ?④린吏 ?딆쓬
                if (DEBUG) {
                  addDebugLog('???깃꼍 蹂몃Ц ?곸뿭?대?濡??④린吏 ?딆쓬', 'success');
                }
                return;
              }
            } catch (e) {
              if (DEBUG) {
                addDebugLog(`???먮윭 諛쒖깮: ${e.message}`, 'error');
              }
              // ?먮윭 諛쒖깮 ???④?
            }
          }
        }
        if (DEBUG) {
          addDebugLog('?몓截??대컮 ?④? ?ㅽ뻾', 'warn');
        }
        toolbar.hide();
      };
    }
  }

// ===== [FORMAT-PERSIST QUICK INSPECTOR] ?대┛ ?⑤씫 ??λ낯 諛붾줈 蹂닿린 =====
window.inspectCurrentFormat = () => {
  const t = document.querySelector('details.para[open] summary .ptitle');
  if(!t){ console.warn('?좑툘 ?대젮?덈뒗 ?⑤씫???놁뒿?덈떎. 癒쇱? ?⑤씫???ъ꽭??'); return; }

  const key = `WBP3_FMT:${t.dataset.book}:${t.dataset.ch}:${t.dataset.idx}`;
  const d = loadState(key, null);
  if(!d){ console.warn('????λ맂 ?쒖떇 ?곗씠?곌? ?놁뒿?덈떎.', key); return; }

  try {
    console.group('?뱲 ?대┛ ?⑤씫 ?쒖떇????뺤씤');
    console.log('KEY:', key);
    console.log('踰꾩쟾(v):', d.v);
    console.log('??μ떆媛?', new Date(d.savedAt).toLocaleString());
    console.log('?덈Ц????', d.lines?.length || 0);

    if (Array.isArray(d.lines) && d.lines.length) {
      const L = d.lines[0];
      console.log('??泥??덈Ц??HTML:', (L.html||'').slice(0,120) + '...');
      console.log('??泥??덈Ц???띿뒪??', (L.text||'').slice(0,100));
      console.log('??泥??덈Ц??spans(?쒖떇 runs):', L.spans?.slice(0,10) || '(?놁쓬)');
    }
    console.groupEnd();
  } catch(e) {
    console.error('?좑툘 ????곗씠???뚯떛 ?ㅻ쪟:', e);
  }
};

(function cleanupMiniChipsOnce(){
  document.querySelectorAll('.unit-chips, #unitGlobalChips').forEach(el => el.remove());
  const css = document.createElement('style');
  css.textContent = `.unit-chips, #unitGlobalChips { display:none !important; }`;
  document.head.appendChild(css);

})();

// === [REMOVE HEADER CHIPS] ?ㅻ뜑??'湲곕낯?댄빐쨌?댁슜援ъ“쨌硫붿꽭吏?붿빟' ?쒓굅 ===
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
  const labels = ['湲곕낯?댄빐','?댁슜援ъ“','硫붿꽭吏?붿빟'];
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
    if(removed>0) console.log('湲곕낯?댄빐쨌?댁슜援ъ“쨌硫붿꽭吏?붿빟 ?쒓굅 ?꾨즺');
    else setTimeout(tryRemove, 500); // 踰꾪듉 ?앹꽦 吏???鍮?諛섎났 ?쒕룄
  };
  tryRemove();
}
removeHeaderBookEditors();

// === [BOOK-CHIP ??FLOW-EDITOR ?ъ궗??諛붿씤?? ===============================
function bindBookHeadChipsToFlowEditor(){
  const tree = document.getElementById('tree');
  if(!tree) return;

  // ?щ윭 沅뚯씠 ?숈떆??open?대㈃ 留됯린
  const openedBooks = [...tree.querySelectorAll('details.book[open]')];
  if(openedBooks.length > 1){
    alert('2媛??댁긽 ?깃꼍???대젮 ?덉뒿?덈떎. ??沅뚮쭔 ???ㅼ쓬 ?ㅼ떆 ?쒕룄?섏꽭??');
    return;
  }

  // ??? ?꾩옱 ?대젮?덈뒗 梨??먮뒗 ?붾㈃??泥?梨?
  const bookEl =
    openedBooks[0] ||
    tree.querySelector('details.book');

  if(!bookEl) return;

  // ??梨낆쓽 1??泥??⑤씫 ?대컮?먯꽌 '?댁슜?먮쫫' 踰꾪듉??李얠븘 ?붾떎
  const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
  const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
  if(!p1) return;
  const flowBtn = p1.querySelector('.ptoolbar [data-action="flow"], .ptoolbar .btn-flow, .ptoolbar .chip-flow');
  if(!flowBtn) return;

  // ?ㅻ뜑 履?3踰꾪듉(?먮뒗 1??泥??⑤씫 ?놁뿉 異붽???3移???李얠븘 ?숈씪???몄쭛湲??몄텧濡??곌껐
  const selectors = [
    '.chip-basic',      // 湲곕낯?댄빐
    '.chip-structure',  // ?댁슜援ъ“
    '.chip-summary'     // 硫붿꽭吏?붿빟
  ];
  const chips = [
    ...document.querySelectorAll(selectors.join(','))
  ];

  chips.forEach(chip=>{
    // 以묐났 諛붿씤??諛⑹?
    if(chip.dataset.wbpBind === 'ok') return;
    chip.dataset.wbpBind = 'ok';

    chip.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();

      // ?ㅼ떆 ??踰? ?ㅼ쨷 ?ㅽ뵂 諛⑹?
      const openBooksNow = [...tree.querySelectorAll('details.book[open]')];
      if(openBooksNow.length !== 1){
        alert('?몄쭛湲곕뒗 ??沅뚮쭔 ?대┛ ?곹깭?먯꽌 ?ъ슜?????덉뒿?덈떎.');
        return;
      }

      // ?댁슜?먮쫫 踰꾪듉???몄쭛湲곕? 洹몃?濡??ъ슜
      flowBtn.click();

      // ?몄쭛湲????? ?쒕ぉ留??대떦 移??띿뒪?몃줈 援먯껜(?숈씪 UI ?좎?)
      // (?몄쭛湲?DOM ?대옒?ㅻ뒗 ?꾨줈?앺듃??留욎떠 ?꾨옒 ?꾨낫 以?議댁옱?섎뒗 寃껋쑝濡??곸슜)
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

// 珥덇린 諛붿씤???몃━ ?뚮뜑 ?댄썑??1??
document.addEventListener('wbp:treeBuilt', ()=>{
  bindBookHeadChipsToFlowEditor();
});

// 珥덇린 濡쒕뱶 吏곹썑 ??踰??쒕룄(?대? ?뚮뜑?섏뼱 ?덉쑝硫?利됱떆 ?곌껐)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindBookHeadChipsToFlowEditor);
} else {
  bindBookHeadChipsToFlowEditor();
}

// === [BOOK-CHIPS ??FLOW EDITOR ?ъ궗?? =====================================
function bindBookChipsToFlowEditor(){
  const tree = document.getElementById('tree');
  if(!tree) return;

  // ?꾩옱 ?대┛ 梨????뺤씤 (2沅??댁긽 ?대젮 ?덉쑝硫?以묐떒)
  const openedBooks = [...tree.querySelectorAll('details.book[open]')];
  if (openedBooks.length > 1) {
    alert('2媛??댁긽 ?깃꼍???대젮 ?덉뒿?덈떎. ??沅뚮쭔 ???ㅼ쓬 ?ㅼ떆 ?쒕룄?섏꽭??');
    return;
  }

  // ???梨? ?대젮?덉쑝硫?洹?梨? ?놁쑝硫?泥?梨?
  const bookEl = openedBooks[0] || tree.querySelector('details.book');
  if(!bookEl) return;

  // ??梨낆쓽 1??泥??⑤씫?먯꽌 '?댁슜?먮쫫' 踰꾪듉(?몄쭛湲??몃━嫄???李얠쓬
  const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
  const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
  if(!p1) return;

  const flowBtn =
    p1.querySelector('.ptoolbar [data-action="flow"]') ||
    p1.querySelector('.ptoolbar .btn-flow') ||
    p1.querySelector('.ptoolbar .chip-flow') ||
    p1.querySelector('.ptoolbar button:contains("?댁슜?먮쫫")'); // 理쒗썑 蹂댁젙(?꾩슂??

  if(!flowBtn) return;

  // ???移?踰꾪듉): 媛?梨?1??泥??⑤씫 ?섏꽕援먥??ㅻⅨ履쎌뿉 諛곗튂??3媛?
  // *?꾨줈?앺듃???곕씪 ?대옒?ㅺ? ?ㅻ? ???덉쑝誘濡??꾨옒 ??됲꽣 以?議댁옱?섎뒗 寃껊쭔 留ㅼ묶*
  const chips = [
    ...document.querySelectorAll(
      '.bookhead-chips .chip-basic, .bookhead-chips .chip-structure, .bookhead-chips .chip-summary,' +
      '.book-chips .chip-basic, .book-chips .chip-structure, .book-chips .chip-summary,' +
      '.chip-basic, .chip-structure, .chip-summary,' +
      '.bookhead-chips .book-chip[data-type="basic"], .bookhead-chips .book-chip[data-type="structure"], .bookhead-chips .book-chip[data-type="summary"]'
    )
  ];

  chips.forEach(chip=>{
    if(chip.dataset.flowBind === '1') return; // 以묐났 諛붿씤??諛⑹?
    chip.dataset.flowBind = '1';

    chip.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();

      // ?대┃ ?쒖젏?먮룄 ?ㅼ쨷 ?ㅽ뵂 諛⑹? ?뺤씤
      const openBooksNow = [...tree.querySelectorAll('details.book[open]')];
      if (openBooksNow.length !== 1 && openedBooks.length !== 1) {
        alert('?몄쭛湲곕뒗 ??沅뚮쭔 ?대┛ ?곹깭?먯꽌 ?ъ슜?????덉뒿?덈떎.');
        return;
      }

      // ?섎궡?⑺쓲由꾟?踰꾪듉 ?대┃??洹몃?濡??꾩엫 ???숈씪???몄쭛湲??ㅽ????ъ슜
      flowBtn.click();

      // ?몄쭛湲??쒕ぉ??移??쇰꺼濡?援먯껜 (UI???댁슜?먮쫫 ?몄쭛湲곕? 洹몃?濡??ъ슜)
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

// ?뚮뜑 ?꾨즺 ??1??諛붿씤??
document.addEventListener('wbp:treeBuilt', ()=> {
  bindBookChipsToFlowEditor();
});

// 珥덇린 濡쒕뱶 ?쒖젏?먮룄 蹂댁젙
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindBookChipsToFlowEditor);
} else {
  bindBookChipsToFlowEditor();
}

// 珥덇린/?щ젋?????곌껐(以묐났 ?몄텧 ?덉슜, ?대??먯꽌 ?먯껜 媛??
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindFlowEditorToBookChips);
} else {
  bindFlowEditorToBookChips();
}
document.addEventListener('wbp:treeBuilt', bindFlowEditorToBookChips);

// === [BOOK-CHIPS DIRECT BIND ???댁슜?먮쫫 ?몄쭛湲??숈씪 湲곕뒫] ================
// === [BOOK-CHIPS DIRECT BIND ??UNIT CONTEXT ?몄쭛湲??ъ슜] ================
// === [BOOK-CHIPS DIRECT BIND ??UNIT CONTEXT ?몄쭛湲??ъ슜] ================
function rebindBookChipsToFlowEditor(){
  const tree = document.getElementById('tree');
  if(!tree) return;

  // ?대┛ 梨??섎굹留??덉슜
  const openedBooks = [...tree.querySelectorAll('details.book[open]')];
  if(openedBooks.length > 1){
    alert('2媛??댁긽 ?깃꼍???대젮 ?덉뒿?덈떎. ??沅뚮쭔 ???ㅼ쓬 ?쒕룄?섏꽭??');
    return;
  }

  const bookEl = openedBooks[0] || tree.querySelector('#tree > details.book');
  if(!bookEl) return;

  // 1??泥??⑤씫
  const ch1 = bookEl.querySelector(':scope > .chapters > details') || bookEl.querySelector('details');
  const p1  = ch1?.querySelector(':scope > .paras > details.para') || ch1?.querySelector('details.para');
  if(!p1) return;

  // 湲곕낯?댄빐쨌?댁슜援ъ“쨌硫붿꽭吏?붿빟 移?(?щ윭 ?뺥깭 ???
  const chips = [
    ...document.querySelectorAll(
      '.chip-basic, .chip-structure, .chip-summary, ' +
      '.book-chip[data-type="basic"], .book-chip[data-type="structure"], .book-chip[data-type="summary"]'
    )
  ];
  if(!chips.length) return;

  chips.forEach(chip=>{
    // 以묐났 諛⑹?
    if(chip.dataset.flowBound==='1') return;
    chip.dataset.flowBound='1';

    // 紐⑤뱺 湲곗〈 ?대깽???쒓굅 ???덈줈 諛붿씤??
    const newChip = chip.cloneNode(true);
    chip.parentNode.replaceChild(newChip, chip);

    newChip.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();

      const nowOpen = [...tree.querySelectorAll('details.book[open]')];
      if(nowOpen.length > 1){
        alert('?몄쭛湲곕뒗 ??沅뚮쭔 ?대┛ ?곹깭?먯꽌 ?ъ슜?????덉뒿?덈떎.');
        return;
      }

      // 1??泥??⑤씫??book / chap / idx ?뺣낫 異붿텧
      const paraTitle = p1.querySelector('summary .ptitle');
      const book  = paraTitle?.dataset.book || p1.dataset.book;
      const chap  = parseInt(paraTitle?.dataset.ch || p1.dataset.ch, 10) || 1;
      const idx   = parseInt(paraTitle?.dataset.idx || p1.dataset.idx, 10) || 0;

      // 移?醫낅쪟???곕씪 type 寃곗젙
      let type = 'basic';
      if (newChip.classList.contains('chip-structure') || newChip.dataset.type === 'structure') {
        type = 'structure';      // ?댁슜援ъ“
      } else if (newChip.classList.contains('chip-summary') || newChip.dataset.type === 'summary') {
        type = 'summary';        // 硫붿꽭吏?붿빟
      } else {
        type = 'basic';          // 湲곕낯?댄빐
      }

      // ?뵻 ?댁젣??FLOW ?몄쭛湲곌? ?꾨땲??UNIT CONTEXT ?몄쭛湲곕? 吏곸젒 ?ъ슜
      //    ?????踰꾪듉? saveUnitContext()留??몄텧?섍퀬, 李쎌? ?レ? ?딆쓬
      if (book != null && !Number.isNaN(chap) && !Number.isNaN(idx)) {
        openUnitContextEditor(book, chap, idx, type);
      } else {
        console.warn('openUnitContextEditor ?몄텧??book/chap/idx ?뺣낫瑜?李얠? 紐삵뻽?듬땲??', {book, chap, idx});
      }
    });
  });
}
// ==========================================================================

// ?뚮뜑 ?꾨즺 ??1???곌껐
document.addEventListener('wbp:treeBuilt', rebindBookChipsToFlowEditor);

// 珥덇린 DOM 濡쒕뱶 ?쒖젏?먮룄 ?ㅽ뻾
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', rebindBookChipsToFlowEditor);
}else{
  rebindBookChipsToFlowEditor();
}

// =======================
//  UNIT CONTEXT ???猷⑦떞
// =======================

// 1) ?쒕쾭 ?먮뒗 濡쒖뺄?ㅽ넗由ъ? ????⑥닔
async function saveUnitContext(type, book, chap, paraIdx, text){
  try {
    // ?뵻 ?쒕쾭 ???(API ?ъ슜 ??
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

    // ?뵻 ?ㅽ뙣??濡쒖뺄諛깆뾽
    if (!res.ok){
      console.warn("API ????ㅽ뙣 ??濡쒖뺄?ㅽ넗由ъ? 諛깆뾽");
      const key = `WBP3_UNITCTX:${book}:${chap}:${paraIdx}:${type}`;
      saveState(key, text);
    }

    status("??λ릺?덉뒿?덈떎.");
  } catch (err){
    console.error(err);
    status("????ㅽ뙣(?ㅽ봽?쇱씤) ??濡쒖뺄 諛깆뾽");
    const key = `WBP3_UNITCTX:${book}:${chap}:${paraIdx}:${type}`;
    saveState(key, text);
  }
}


// =======================
//  ?몄쭛湲????踰꾪듉 ?대깽??
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
    alert("?낅젰李쎌쓣 李얠쓣 ???놁뒿?덈떎.");
    return;
  }

  const text = textarea.value;

  saveUnitContext(type, book, chap, paraIdx, text);
});

// =======================
//  UNIT CONTEXT ?몄쭛湲?
//  (湲곕낯?댄빐 / ?댁슜?먮쫫 / 硫붿꽭吏?붿빟 怨듭슜)
// =======================
function openUnitContextEditor(book, chap, paraIdx, type){
  // ?뵻 ???湲곕낯媛?(??肄붾뱶?먯꽌 3媛쒕쭔 ?섍린??寃쎌슦 ?鍮?
  if (!type) type = 'basic';

  // ?뵻 ??????쒓? ?쇰꺼
  const typeLabelMap = {
    basic: '湲곕낯?댄빐',
    structure: '?댁슜?먮쫫',
    flow: '?댁슜?먮쫫',
    summary: '硫붿꽭吏?붿빟'
  };
  const typeLabel = typeLabelMap[type] || type;

  // ?뵻 ?몄쭛湲?而⑦뀒?대꼫 ?뺣낫 (?놁쑝硫??앹꽦)
  let host = document.getElementById('unitEditor');
  if (!host){
    host = document.createElement('div');
    host.id = 'unitEditor';
    host.className = 'unit-editor-modal';
    document.body.appendChild(host);
  }

  // ?뵻 ?대뼡 ?⑤씫???몄쭛 以묒씤吏 硫뷀? ?뺣낫 湲곕줉
  host.dataset.book = book;
  host.dataset.ch   = String(chap);
  host.dataset.idx  = String(paraIdx);
  host.dataset.type = type;

  // ?뵻 ?붾㈃ ?곷떒??蹂댁뿬以??⑤씫 ?쒕ぉ(?좏깮)
  let refLabel = '';
  try {
    const paraSel = `details.para[data-book="${book}"][data-ch="${chap}"][data-idx="${paraIdx}"]`;
    const paraEl = document.querySelector(paraSel);
    const titleEl = paraEl?.querySelector('summary .ptitle');
    if (titleEl){
      refLabel = titleEl.textContent.trim();
    } else {
      refLabel = `${book} ${chap}???⑤씫 ${paraIdx + 1}`;
    }
  } catch (e){
    refLabel = `${book} ${chap}???⑤씫 ${paraIdx + 1}`;
  }

  // ?뵻 ?몄쭛湲?HTML ?쒗뵆由?
  host.innerHTML = `
    <div class="uc-wrap">
      <div class="uc-header">
        <div class="uc-title">
          <span class="uc-ref">${refLabel}</span>
          <span class="uc-type"> 쨌 ${typeLabel} ?몄쭛</span>
        </div>
        <button type="button" class="uc-close" data-uc-close>횞</button>
      </div>
      <div class="uc-body">
        <textarea class="uc-input" spellcheck="false"
          placeholder="${typeLabel} ?댁슜???낅젰?섏꽭??></textarea>
      </div>
      <div class="uc-footer">
        <button type="button" class="uc-save" data-uc-save>???/button>
        <button type="button" class="uc-cancel" data-uc-close>?リ린</button>
      </div>
    </div>
  `;

  // ?뵻 濡쒖뺄?ㅽ넗由ъ?????λ맂 ?댁슜 遺덈윭?ㅺ린
  const key   = `WBP3_UNITCTX:${book}:${chap}:${paraIdx}:${type}`;
  const saved = loadState(key, '');
  const ta    = host.querySelector('.uc-input');
  if (ta){
    ta.value = saved != null ? saved : '';
    ta.focus();
  }

  // ?뵻 ?リ린 踰꾪듉 泥섎━
  host.querySelectorAll('[data-uc-close]').forEach(btn=>{
    btn.onclick = () => {
      host.remove();
    };
  });
}


// =======================
//  localStorage ?숆린??(?쒕쾭 <-> 釉뚮씪?곗?)
// =======================
document.addEventListener('DOMContentLoaded', async () => {
  // ?쒕쾭????λ맂 localStorage瑜?遺덈윭? 釉뚮씪?곗????곸슜
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

  const uploadLocalStorage = () => {
    const items = {};
    for (let i=0; i<localStorage.length; i++){
      const k = localStorage.key(i);
      if (!k) continue;
      items[k] = localStorage.getItem(k);
    }
    const payload = JSON.stringify({ items });
    // sendBeacon???곗꽑 ?쒕룄
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





const SEARCH_PAGE_SIZE = 20;
const LAZY_STATE = {
  books: [],
  chapterMeta: new Map(),
  search: { query: '', page: 1, totalPages: 1, count: 0 }
};

function stripHtmlToText(html){
  const div = document.createElement('div');
  div.innerHTML = String(html || '');
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

function compressDraftText(text){
  const src = unescape(encodeURIComponent(String(text || '')));
  if (!src) return '';
  const dict = new Map();
  const out = [];
  let phrase = src.charAt(0);
  let code = 256;
  for (let i = 1; i < src.length; i++) {
    const curr = src.charAt(i);
    const combo = phrase + curr;
    if (dict.has(combo)) phrase = combo;
    else {
      out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));
      dict.set(combo, code++);
      phrase = curr;
    }
  }
  out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));
  return btoa(JSON.stringify(out));
}

function cleanupDraftAutosaves(){
  const prefix = 'wbps.sermon.draft.';
  const drafts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      const plain = parsed.body_text || stripHtmlToText(parsed.body || '');
      drafts.push({
        key,
        ts: parsed.ts || 0,
        value: {
          title: parsed.title || '',
          body_text: plain,
          body_compressed: compressDraftText(plain),
          ts: parsed.ts || 0
        }
      });
    } catch (_) {
      drafts.push({ key, ts: 0, value: null });
    }
  }
  drafts.sort((a, b) => b.ts - a.ts);
  drafts.forEach((item, index) => {
    if (index >= 5) localStorage.removeItem(item.key);
    else if (item.value) localStorage.setItem(item.key, JSON.stringify(item.value));
  });
}

async function tryFetchJSON(path){
  if (/bible[-_]paragraphs\.json$/i.test(String(path || ''))) {
    const res = await fetch('/api/books', { cache: 'no-store' });
    if (!res.ok) throw new Error('failed to fetch books');
    const data = await res.json();
    LAZY_STATE.books = Array.isArray(data.books) ? data.books : [];
    const skeleton = { books: {}, meta: {}, _lazy: true };
    LAZY_STATE.books.forEach((item) => {
      if (item?.book) skeleton.books[item.book] = {};
    });
    return skeleton;
  }
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw 0;
  return await res.json();
}

function renderParagraphBody(detPara, para){
  const pcontent = detPara.querySelector('.pcontent');
  if (!pcontent || pcontent.dataset.rendered === 'true') return;
  pcontent.dataset.rendered = 'true';
  pcontent.setAttribute('contenteditable', 'true');
  pcontent.innerHTML = '';
  (para.verses || []).forEach(([v, t]) => {
    const line = document.createElement('div');
    line.className = 'pline';
    line.dataset.verse = v;
    line.innerHTML = `<sup class="pv">${v}</sup>${t}`;
    pcontent.appendChild(line);
  });
  if (window.WBP_FMT?.restoreAll) WBP_FMT.restoreAll(detPara);
}

function createParagraphShell(bookName, chap, para, idx){
  const detPara = document.createElement('details');
  detPara.className = 'para';
  detPara.dataset.book = bookName;
  detPara.dataset.ch = chap;
  detPara.dataset.idx = idx;

  const m = String(para.ref || '').match(/^(\d+):(\d+)(?:-(\d+))?$/);
  const v1 = m ? m[2] : '?';
  const v2 = m ? (m[3] || m[2]) : '?';
  const titleText = para.title || para.ref || `문단 ${idx + 1}`;

  const sum = document.createElement('summary');
  sum.innerHTML = `<span class="vrange">(${v1}-${v2})</span><span class="ptitle" data-book="${bookName}" data-ch="${chap}" data-idx="${idx}">${escapeHtml(titleText)}</span>`;
  detPara.appendChild(sum);

  const body = document.createElement('div');
  body.className = 'pbody';
  body.innerHTML = `
    <div class="ptoolbar">
      <button class="primary speakBtn">낭독</button>
      <label class="chip"><input type="checkbox" class="keepReading" style="margin-right:6px">계속 낭독</label>
      <button class="ctxBtn btnSummary">요약</button>
      <button class="ctxBtn btnUnitCtx">단락 맥락</button>
      <button class="ctxBtn btnWholeCtx">전체 맥락</button>
      <button class="ctxBtn btnCommentary">주석</button>
      <button class="sermBtn">설교목록</button>
      <div class="spacer"></div>
    </div>
    <div class="pcontent" data-lazy-body="true"></div>`;
  detPara.appendChild(body);

  detPara.addEventListener('toggle', () => {
    if (!detPara.open) return;
    CURRENT.book = bookName;
    CURRENT.chap = chap;
    CURRENT.paraIdx = idx;
    CURRENT.paraId = `${bookName}|${chap}|${para.ref}`;
    status(`선택: ${bookName} ${chap}장 ${para.title || para.ref}`);
    renderParagraphBody(detPara, para);
  });

  body.querySelector('.speakBtn').addEventListener('click', ()=>{
    renderParagraphBody(detPara, para);
    toggleSpeakInline(bookName, chap, idx, detPara, body.querySelector('.speakBtn'));
  });
  body.querySelector('.btnUnitCtx').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('unit'); });
  body.querySelector('.btnWholeCtx').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('whole'); });
  body.querySelector('.btnCommentary').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('commentary'); });
  body.querySelector('.btnSummary').addEventListener('click', ()=>{ CURRENT.book=bookName; CURRENT.chap=chap; CURRENT.paraIdx=idx; openSingleDocEditor('summary'); });
  body.querySelector('.sermBtn').addEventListener('click', ()=>{
    CURRENT.book = bookName;
    CURRENT.chap = chap;
    CURRENT.paraIdx = idx;
    CURRENT.paraId = `${bookName}|${chap}|${para.ref}`;
    modalWrap.setAttribute('aria-hidden','false');
    modalWrap.style.display = 'flex';
    modalFooterNew.style.display = 'flex';
    sermonEditor.style.display = 'none';
    renderSermonList();
  });

  return detPara;
}

async function ensureBookChaptersLoaded(bookName, bookEl){
  if (bookEl.dataset.loaded === 'true') return;
  const wrap = bookEl.querySelector(':scope > .chapters');
  if (wrap) wrap.innerHTML = '<div class="muted">장 목록을 불러오는 중...</div>';
  const res = await fetch(`/api/chapters/${encodeURIComponent(bookName)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('failed to fetch chapters');
  const data = await res.json();
  LAZY_STATE.chapterMeta.set(bookName, data.chapters || []);
  if (wrap) wrap.innerHTML = '';

  (data.chapters || []).forEach((chapterInfo) => {
    const chap = chapterInfo.chapter;
    if (!BIBLE.books[bookName][chap]) BIBLE.books[bookName][chap] = { title: chapterInfo.title || '', paras: [] };
    const detChap = document.createElement('details');
    detChap.className = 'chapter';
    detChap.dataset.book = bookName;
    detChap.dataset.ch = chap;
    detChap.innerHTML = `<summary><span class="chip">${chap}장</span><span class="muted">${chapterInfo.para_count || 0}개 문단</span></summary><div class="paras"></div>`;
    detChap.addEventListener('toggle', ()=>{
      if (detChap.open) ensureChapterParagraphsLoaded(bookName, chap, detChap).catch((err)=>console.error(err));
    });
    wrap?.appendChild(detChap);
  });
  bookEl.dataset.loaded = 'true';
  document.dispatchEvent(new CustomEvent('wbp:treeBuilt'));
}

async function ensureChapterParagraphsLoaded(bookName, chap, chapEl){
  if (chapEl.dataset.loaded === 'true') return;
  const parWrap = chapEl.querySelector(':scope > .paras');
  if (parWrap) parWrap.innerHTML = '<div class="muted">본문을 불러오는 중...</div>';
  const res = await fetch(`/api/paragraphs/${encodeURIComponent(bookName)}/${chap}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('failed to fetch paragraphs');
  const data = await res.json();
  BIBLE.books[bookName][chap] = { title: data.title || '', paras: data.paras || [] };
  if (parWrap) parWrap.innerHTML = '';
  (data.paras || []).forEach((para, idx) => parWrap?.appendChild(createParagraphShell(bookName, chap, para, idx)));
  chapEl.dataset.loaded = 'true';
  document.dispatchEvent(new CustomEvent('wbp:treeBuilt'));
}

function buildTree(){
  treeEl.innerHTML = '';
  if (!BIBLE || !BIBLE.books) {
    treeEl.innerHTML = '<div class="muted">파일을 찾을 수 없습니다.</div>';
    return;
  }
  const list = LAZY_STATE.books.length ? LAZY_STATE.books : Object.keys(BIBLE.books).map((book) => ({ book, chapter_count: Object.keys(BIBLE.books[book] || {}).length }));
  list.forEach((item) => {
    const bookName = item.book;
    if (!BIBLE.books[bookName]) BIBLE.books[bookName] = {};
    const detBook = document.createElement('details');
    detBook.className = 'book';
    detBook.dataset.book = bookName;
    detBook.innerHTML = `<summary><span class="tw">${escapeHtml(bookName)}</span><span class="muted">${item.chapter_count || 0}장</span></summary><div class="chapters"><div class="muted">책을 열면 장 목록을 불러옵니다.</div></div>`;
    detBook.addEventListener('toggle', ()=>{
      if (detBook.open) ensureBookChaptersLoaded(bookName, detBook).catch((err)=>console.error(err));
    });
    treeEl.appendChild(detBook);
  });
  document.dispatchEvent(new CustomEvent('wbp:treeBuilt'));
}

function clearReadingHighlight(scope){
  const nodes = scope?.nodeType === 1 && scope.classList?.contains('pline') ? [scope] : Array.from(scope?.querySelectorAll?.('.pline') || []);
  nodes.forEach((el) => {
    el.classList.remove('reading', 'sentence-reading-light');
    el.removeAttribute('data-reading-sentence');
  });
}

function highlightSentenceInLine(line, sentenceIndex){
  if (!line) return;
  clearReadingHighlight(line.closest('details.para') || line);
  line.classList.add('reading', 'sentence-reading-light');
  line.setAttribute('data-reading-sentence', sentenceIndex);
  line.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function renderSermonList(){
  if (!CURRENT.paraId) {
    if (!syncCurrentFromOpen()) {
      sermonList.innerHTML = '<div class="muted" style="padding:14px">문단을 먼저 선택하세요.</div>';
      return;
    }
    const para = BIBLE?.books?.[CURRENT.book]?.[CURRENT.chap]?.paras?.[CURRENT.paraIdx];
    if (para) CURRENT.paraId = `${CURRENT.book}|${CURRENT.chap}|${para.ref}`;
  }

  const map = getSermonMap() || {};
  const arr = Array.isArray(map[CURRENT.paraId]) ? map[CURRENT.paraId] : [];
  sermonList.innerHTML = '';
  if (!arr.length) {
    sermonList.innerHTML = '<div class="muted" style="padding:14px">설교가 없습니다. 새 설교목록 버튼으로 추가하세요.</div>';
    return;
  }

  arr.forEach((it, idx) => {
    const card = document.createElement('div');
    card.className = 'sermon-card';
    card.style.cssText = 'padding:16px; margin-bottom:12px; border:1px solid var(--border, #ddd); border-radius:8px; background:var(--panel, #1a1d29);';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px;';
    const titleArea = document.createElement('div');
    titleArea.style.cssText = 'flex:1; min-width:0;';
    titleArea.innerHTML = `<div style="font-weight:700; font-size:16px; color:#ffd700; margin-bottom:4px;">${escapeHtml(it.title || '(제목 없음)')}</div>${it.date ? `<div class="muted">${escapeHtml(it.date)}</div>` : ''}`;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap;';
    const btnView = document.createElement('button');
    btnView.textContent = '설교보기';
    btnView.onclick = ()=> openSermonEditorDirectly(idx);
    const btnDelete = document.createElement('button');
    btnDelete.textContent = '삭제';
    btnDelete.onclick = (e)=>{
      e.stopPropagation();
      if (!confirm(`"${it.title || '(제목 없음)'}" 설교를 삭제할까요?`)) return;
      const m = getSermonMap();
      const a = m[CURRENT.paraId] || [];
      a.splice(idx, 1);
      m[CURRENT.paraId] = a;
      setSermonMap(m);
      renderSermonList();
    };
    actions.appendChild(btnView);
    actions.appendChild(btnDelete);
    header.appendChild(titleArea);
    header.appendChild(actions);
    card.appendChild(header);

    const meta = [];
    if (it.focus) meta.push(`<div><strong>초점:</strong> ${escapeHtml(it.focus)}</div>`);
    if (it.keywords) meta.push(`<div><strong>키워드:</strong> ${escapeHtml(it.keywords)}</div>`);
    if (it.target) meta.push(`<div><strong>적용대상:</strong> ${escapeHtml(it.target)}</div>`);
    if (meta.length) {
      const metaBox = document.createElement('div');
      metaBox.style.cssText = 'margin-bottom:10px; padding:10px; background:var(--bg, #0f1115); border:1px solid var(--border, #252a36); border-radius:6px; font-size:13px; line-height:1.6;';
      metaBox.innerHTML = meta.join('');
      card.appendChild(metaBox);
    }

    const plain = stripHtmlToText(it.body || '');
    if (plain) {
      const preview = document.createElement('div');
      preview.style.cssText = 'line-height:1.7; color:var(--text, #e6e8ef);';
      const shortText = plain.length > 220 ? `${plain.slice(0, 220)}...` : plain;
      preview.textContent = shortText;
      card.appendChild(preview);
      if (plain.length > 220) {
        const moreBtn = document.createElement('button');
        moreBtn.textContent = '더 보기';
        moreBtn.style.marginTop = '10px';
        moreBtn.onclick = () => {
          const expanded = moreBtn.dataset.expanded === 'true';
          preview.textContent = expanded ? shortText : plain;
          moreBtn.textContent = expanded ? '더 보기' : '접기';
          moreBtn.dataset.expanded = expanded ? 'false' : 'true';
        };
        card.appendChild(moreBtn);
      }
    }

    if (Array.isArray(it.images) && it.images.length) {
      const imageArea = document.createElement('div');
      imageArea.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;';
      it.images.forEach((img, imgIdx) => {
        const box = document.createElement('div');
        box.style.cssText = 'position:relative; width:80px; height:80px; border-radius:4px; overflow:hidden; border:1px solid var(--border, #ddd);';
        const imgEl = document.createElement('img');
        imgEl.src = img.url || img;
        imgEl.alt = img.alt || `이미지 ${imgIdx + 1}`;
        imgEl.loading = 'lazy';
        imgEl.decoding = 'async';
        imgEl.style.cssText = 'width:100%; height:100%; object-fit:cover;';
        box.appendChild(imgEl);
        imageArea.appendChild(box);
      });
      card.appendChild(imageArea);
    }

    sermonList.appendChild(card);
  });
}

async function openSearchResult(book, chapter, paraIndex){
  buildTree();
  const bookEl = treeEl.querySelector(`details.book[data-book="${CSS.escape(String(book))}"]`);
  if (!bookEl) return;
  bookEl.open = true;
  await ensureBookChaptersLoaded(book, bookEl);
  const chapEl = bookEl.querySelector(`details.chapter[data-ch="${CSS.escape(String(chapter))}"]`);
  if (!chapEl) return;
  chapEl.open = true;
  await ensureChapterParagraphsLoaded(book, chapter, chapEl);
  const paraEl = chapEl.querySelector(`details.para[data-idx="${CSS.escape(String(paraIndex))}"]`);
  if (paraEl) {
    paraEl.open = true;
    paraEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

async function renderSearchResults(query, page = 1){
  const q = String(query || '').trim();
  if (!q) return buildTree();
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}&page_size=${SEARCH_PAGE_SIZE}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('search failed');
  const data = await res.json();
  LAZY_STATE.search = { query: q, page: data.page || 1, totalPages: data.total_pages || 1, count: data.count || 0 };
  treeEl.innerHTML = '';

  const top = document.createElement('div');
  top.className = 'muted';
  top.style.margin = '8px';
  top.textContent = `검색어 "${q}" 결과 ${data.count || 0}건`;
  treeEl.appendChild(top);

  (data.results || []).forEach((item) => {
    const card = document.createElement('div');
    card.style.cssText = 'margin:8px; padding:14px; border:1px solid var(--border); border-radius:12px; background:color-mix(in hsl, var(--panel) 82%, black 6%);';
    card.innerHTML = `<div style="font-weight:700; color:var(--titleBlue);">${escapeHtml(item.book)} ${item.chapter}장 ${escapeHtml(item.ref || '')}</div><div style="margin-top:6px; font-weight:600;">${escapeHtml(item.title || item.ref || '문단')}</div><div style="margin-top:10px; line-height:1.7; color:var(--muted);">${escapeHtml((item.text || '').slice(0, 240))}${(item.text || '').length > 240 ? '...' : ''}</div>`;
    const openBtn = document.createElement('button');
    openBtn.textContent = '본문 열기';
    openBtn.style.marginTop = '10px';
    openBtn.onclick = ()=> openSearchResult(item.book, item.chapter, item.para_index);
    card.appendChild(openBtn);
    treeEl.appendChild(card);
  });

  const pager = document.createElement('div');
  pager.className = 'footer';
  pager.style.marginTop = '8px';
  pager.innerHTML = `<div class="muted">${LAZY_STATE.search.page} / ${LAZY_STATE.search.totalPages} 페이지</div>`;
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '이전 20개';
  prevBtn.disabled = LAZY_STATE.search.page <= 1;
  prevBtn.onclick = ()=> renderSearchResults(q, LAZY_STATE.search.page - 1);
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '다음 20개';
  nextBtn.disabled = LAZY_STATE.search.page >= LAZY_STATE.search.totalPages;
  nextBtn.onclick = ()=> renderSearchResults(q, LAZY_STATE.search.page + 1);
  pager.appendChild(prevBtn);
  pager.appendChild(nextBtn);
  treeEl.appendChild(pager);
}

function injectPerformanceStyles(){
  if (document.getElementById('wbp-perf-style')) return;
  const style = document.createElement('style');
  style.id = 'wbp-perf-style';
  style.textContent = `.pline.reading::before{animation:none !important}.pline,.sentence-reading-light{transition:background .12s ease,border-color .12s ease}@media (prefers-reduced-motion: reduce){*{animation:none !important;transition:none !important}}`;
  document.head.appendChild(style);
}

function setupSearchUI(){
  const input = el('searchInput');
  const btnSearch = el('btnSearch');
  const btnBrowse = el('btnBrowse');
  if (!input || !btnSearch || !btnBrowse) return;
  btnSearch.onclick = ()=> renderSearchResults(input.value, 1).catch((err)=>console.error(err));
  btnBrowse.onclick = ()=> buildTree();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnSearch.click();
    }
  });
}

injectPerformanceStyles();
setupSearchUI();
cleanupDraftAutosaves();

