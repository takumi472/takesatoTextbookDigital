/* =====================================================
   Unified Digital Textbook Engine (textbook.js)
   Renders any book from site/data/html/<book-id>.json
   ===================================================== */

let speechSlow = true;
let preferredJaVoice = null;

function pickJapaneseVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const jaVoices = voices.filter((v) => /^ja/i.test(v.lang));
  if (jaVoices.length === 0) return null;
  const priorities = ["Kyoko (Enhanced)", "Kyoko", "Google 日本語", "Nanami", "O-Ren", "Haruka", "Hattori"];
  for (const name of priorities) {
    const found = jaVoices.find((v) => v.name.includes(name));
    if (found) return found;
  }
  return jaVoices.find((v) => v.localService) || jaVoices[0];
}

if ("speechSynthesis" in window) {
  preferredJaVoice = pickJapaneseVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    preferredJaVoice = pickJapaneseVoice();
  };
}

function stripRubyForSpeech(str) {
  // Turn {漢字|かんじ} into かんじ so speech synthesis pronounces accurately
  return (str || "").replace(/\{([^|{}]+)\|([^{}]+)\}/g, "$2");
}

function renderRubyHTML(str) {
  const esc = (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\{([^|{}]+)\|([^{}]+)\}/g, "<ruby>$1<rt>$2</rt></ruby>");
}

function speakJa(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const clean = stripRubyForSpeech(text);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "ja-JP";
  if (!preferredJaVoice) preferredJaVoice = pickJapaneseVoice();
  if (preferredJaVoice) u.voice = preferredJaVoice;
  u.rate = speechSlow ? 0.62 : 0.85;
  u.pitch = 1.0;
  u.volume = 1.0;
  window.speechSynthesis.speak(u);
}

function normalizeAns(str) {
  return (str || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[。、・？?！!]/g, "");
}

// ==================== STATE ====================
const state = {
  bookId: "",
  book: null,
  currentIndex: 0,
};

const els = {
  bookTitleLabel: document.getElementById("book-title-label"),
  tocTitle: document.getElementById("toc-title"),
  tocSidebar: document.getElementById("toc-sidebar"),
  tocToggleBtn: document.getElementById("toc-toggle-btn"),
  tocCloseBtn: document.getElementById("toc-close-btn"),
  tocList: document.getElementById("toc-list"),
  pageContainer: document.getElementById("page-container"),
  prevSecBtn: document.getElementById("prev-sec-btn"),
  nextSecBtn: document.getElementById("next-sec-btn"),
  pageIndicator: document.getElementById("page-indicator"),
  toggleSpeedBtn: document.getElementById("toggle-speed-btn"),
  toggleRubyBtn: document.getElementById("toggle-ruby-btn"),
  toggleRomajiBtn: document.getElementById("toggle-romaji-btn"),
};

function saveBookProgress(pageNum) {
  if (!state.bookId) return;
  try {
    const map = JSON.parse(localStorage.getItem("kasukabe_textbook_progress_v1") || "{}");
    map[state.bookId] = pageNum;
    localStorage.setItem("kasukabe_textbook_progress_v1", JSON.stringify(map));
    localStorage.setItem("kasukabe_textbook_last_v1", JSON.stringify({ bookId: state.bookId, page: pageNum, updatedAt: Date.now() }));
  } catch {}
}

function memoKey() {
  return `tb_memo_${state.bookId}_v1`;
}
function loadMemos() {
  try { return JSON.parse(localStorage.getItem(memoKey()) || "{}"); } catch { return {}; }
}
function saveMemo(key, val) {
  const m = loadMemos();
  m[key] = val;
  try { localStorage.setItem(memoKey(), JSON.stringify(m)); } catch {}
}

// ==================== INIT ====================
async function init() {
  const params = new URLSearchParams(window.location.search);
  state.bookId = params.get("book") || "02-katakana";

  bindGlobalEvents();

  try {
    const res = await fetch(`data/html/${encodeURIComponent(state.bookId)}.json`);
    if (!res.ok) throw new Error(`テキストデータ (${state.bookId}) が見つかりません`);
    state.book = await res.json();

    els.bookTitleLabel.textContent = state.book.title;
    document.title = `${state.book.title}（HTML版）| 春日部日本語教室`;
    els.tocTitle.textContent = `もくじ（全${state.book.pages.length}ページ）`;

    renderTOC();
    const hashNum = Number((window.location.hash || "").replace("#p", ""));
    if (hashNum >= 1 && hashNum <= state.book.pages.length) {
      state.currentIndex = hashNum - 1;
    }
    renderPage(state.currentIndex);
  } catch (err) {
    els.bookTitleLabel.textContent = "読み込みエラー";
    els.pageContainer.innerHTML = `<div class="empty-state"><p>${err.message}</p><a class="btn primary" href="index.html">本棚へ戻る</a></div>`;
  }
}

function bindGlobalEvents() {
  els.tocToggleBtn.addEventListener("click", () => els.tocSidebar.classList.toggle("open"));
  els.tocCloseBtn.addEventListener("click", () => els.tocSidebar.classList.remove("open"));
  els.prevSecBtn.addEventListener("click", () => goTo(state.currentIndex - 1));
  els.nextSecBtn.addEventListener("click", () => goTo(state.currentIndex + 1));

  els.toggleSpeedBtn.addEventListener("click", () => {
    speechSlow = !speechSlow;
    els.toggleSpeedBtn.classList.toggle("active", speechSlow);
    els.toggleSpeedBtn.textContent = speechSlow ? "音声：ゆっくり" : "音声：ふつう";
  });

  els.toggleRubyBtn.addEventListener("click", () => {
    const hidden = document.body.classList.toggle("hide-ruby");
    els.toggleRubyBtn.classList.toggle("active", !hidden);
    els.toggleRubyBtn.textContent = hidden ? "ふりがな OFF" : "ふりがな ON";
  });

  els.toggleRomajiBtn.addEventListener("click", () => {
    const hidden = document.body.classList.toggle("hide-romaji");
    els.toggleRomajiBtn.classList.toggle("active", !hidden);
    els.toggleRomajiBtn.textContent = hidden ? "ローマ字 OFF" : "ローマ字 ON";
  });
}

function renderTOC() {
  els.tocList.innerHTML = "";
  state.book.pages.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-item";
    btn.dataset.idx = String(idx);
    btn.innerHTML = `<span class="toc-pnum">${p.label}</span><span>${p.title}</span>`;
    btn.addEventListener("click", () => {
      goTo(idx);
      els.tocSidebar.classList.remove("open");
    });
    els.tocList.appendChild(btn);
  });
}

function goTo(idx) {
  if (!state.book || idx < 0 || idx >= state.book.pages.length) return;
  window.speechSynthesis?.cancel();
  state.currentIndex = idx;
  history.replaceState(null, "", `?book=${encodeURIComponent(state.bookId)}#p${idx + 1}`);
  renderPage(idx);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPage(idx) {
  const page = state.book.pages[idx];
  saveBookProgress(idx + 1);
  els.tocList.querySelectorAll(".toc-item").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.idx) === idx);
  });
  els.prevSecBtn.disabled = idx === 0;
  els.nextSecBtn.disabled = idx === state.book.pages.length - 1;
  els.pageIndicator.textContent = `${page.label}（${idx + 1} / ${state.book.pages.length}）`;

  els.pageContainer.innerHTML = `
    <div class="page-header-row">
      <div>
        <h2 class="page-heading">${renderRubyHTML(page.title)}</h2>
        ${page.subtitle ? `<p class="page-sub">${renderRubyHTML(page.subtitle)}</p>` : ""}
      </div>
      <span class="page-tag">${page.label}</span>
    </div>
  `;

  (page.sections || []).forEach((sec) => {
    const wrap = document.createElement("section");
    wrap.className = "tb-section";
    if (sec.type === "text") renderTextSection(wrap, sec);
    else if (sec.type === "kana_chart") renderKanaChartSection(wrap, sec);
    else if (sec.type === "kana_practice") renderKanaPracticeSection(wrap, sec);
    else if (sec.type === "vocab_practice") renderVocabPracticeSection(wrap, sec);
    else if (sec.type === "kanji_practice") renderKanjiPracticeSection(wrap, sec);
    else if (sec.type === "dialogue") renderDialogueSection(wrap, sec);
    else if (sec.type === "reading") renderReadingSection(wrap, sec);
    else if (sec.type === "table") renderTableSection(wrap, sec);
    else if (sec.type === "pairs") renderPairsSection(wrap, sec);
    else if (sec.type === "quiz") renderQuizSection(wrap, sec);
    else if (sec.type === "fill_practice") renderFillPracticeSection(wrap, sec);
    else if (sec.type === "image_ref") renderImageRefSection(wrap, sec);
    els.pageContainer.appendChild(wrap);
  });
}

// ==================== SECTION RENDERERS ====================
function setupTraceCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#1d5b79";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  let drawing = false;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  };
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  canvas.addEventListener("pointerup", () => (drawing = false));
  canvas.addEventListener("pointercancel", () => (drawing = false));
}

function renderTextSection(wrap, sec) {
  const box = document.createElement("div");
  box.className = sec.style === "note" ? "staff-note" : "grammar-box";
  box.style.marginTop = "0";
  if (sec.heading) {
    const h = document.createElement("h3");
    h.innerHTML = renderRubyHTML(sec.heading);
    box.appendChild(h);
  }
  (sec.paragraphs || []).forEach((p) => {
    const el = document.createElement("p");
    el.innerHTML = renderRubyHTML(p);
    box.appendChild(el);
  });
  if (sec.bullets && sec.bullets.length) {
    const ul = document.createElement("ul");
    ul.className = "rule-list";
    sec.bullets.forEach((b) => {
      const li = document.createElement("li");
      li.innerHTML = renderRubyHTML(b);
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }
  wrap.appendChild(box);
}

function renderKanaChartSection(wrap, sec) {
  if (sec.heading) {
    const h = document.createElement("h3");
    h.className = "tb-sec-heading";
    h.textContent = sec.heading;
    wrap.appendChild(h);
  }
  const table = document.createElement("table");
  table.className = "gojuon-table";
  if (sec.headers && sec.headers.length) {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    tr.innerHTML = `<th></th>` + sec.headers.map((x) => `<th>${x}</th>`).join("");
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  const tbody = document.createElement("tbody");
  (sec.rows || []).forEach((row) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = row.label || "";
    tr.appendChild(th);
    (row.cells || []).forEach((cell) => {
      const td = document.createElement("td");
      if (cell && cell.c) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kana-sound-btn";
        btn.innerHTML = `<span>${cell.c}</span>${cell.r ? `<span class="romaji">${cell.r}</span>` : ""}`;
        btn.addEventListener("click", () => speakJa(cell.c));
        td.appendChild(btn);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function renderKanaPracticeSection(wrap, sec) {
  if (sec.heading) {
    const h = document.createElement("h3");
    h.className = "tb-sec-heading";
    h.textContent = sec.heading;
    wrap.appendChild(h);
  }
  const memos = loadMemos();
  const list = document.createElement("div");
  list.className = "kana-practice-list";
  const chars = sec.chars || [];
  const padItems = chars.map((it) => ({
    char: it.c,
    sub: it.r ? `よみ：${it.r}` : "",
    extra: memos[it.c] ? `メモ：${memos[it.c]}` : "指やペンで大きく書いて練習しましょう",
    speak: it.c,
    isYoon: Boolean(it.yoon || it.c.length > 1),
  }));

  chars.forEach((item, charIdx) => {
    const card = document.createElement("div");
    card.className = "kana-card";
    const yClass = item.yoon || item.c.length > 1 ? " yoon" : "";
    card.innerHTML = `
      <div class="kana-card-top">
        <button type="button" class="kana-big-btn${yClass}" title="発音を聞く">${item.c}</button>
        <div class="kana-meta">
          <div class="kana-meta-row">
            <span class="kana-romaji-tag romaji">${item.r || ""}</span>
            <button type="button" class="speak-mini-btn">🔊 きく</button>
          </div>
          <input type="text" class="yomikata-input" placeholder="よみかた（母国語メモ）" value="${(memos[item.c] || "").replace(/"/g, "&quot;")}" />
        </div>
      </div>
      <div class="tracing-row">
        ${[true, true, false, false].map((hasGuide) => `
          <div class="trace-box">
            ${hasGuide ? `<span class="trace-guide${yClass}">${item.c}</span>` : ""}
            <canvas class="trace-canvas" width="136" height="136"></canvas>
          </div>
        `).join("")}
        <button type="button" class="write-open-btn" data-role="open-pad">✍️ 大きく書く</button>
        <button type="button" class="trace-clear-btn">けす</button>
      </div>
      <div class="mobile-write-footer">
        <button type="button" class="write-open-btn" data-role="open-pad-mobile">✍️ 「${item.c}」を大きく書く練習</button>
      </div>
    `;
    card.querySelector(".kana-big-btn").addEventListener("click", () => speakJa(item.c));
    card.querySelector(".speak-mini-btn").addEventListener("click", () => speakJa(item.c));
    card.querySelector(".yomikata-input").addEventListener("input", (e) => {
      saveMemo(item.c, e.target.value);
      padItems[charIdx].extra = e.target.value ? `メモ：${e.target.value}` : "指やペンで大きく書いて練習しましょう";
    });
    const openThisPad = () => window.openWritingPad?.(padItems, charIdx, speakJa);
    card.querySelector('[data-role="open-pad"]').addEventListener("click", openThisPad);
    card.querySelector('[data-role="open-pad-mobile"]').addEventListener("click", openThisPad);

    const canvases = card.querySelectorAll(".trace-canvas");
    canvases.forEach(setupTraceCanvas);
    card.querySelector(".trace-clear-btn").addEventListener("click", () => {
      canvases.forEach((cv) => cv.getContext("2d").clearRect(0, 0, cv.width, cv.height));
    });
    list.appendChild(card);
  });
  wrap.appendChild(list);
}

function renderVocabPracticeSection(wrap, sec) {
  let testMode = false;
  const draw = () => {
    wrap.innerHTML = "";
    if (sec.heading) {
      const h = document.createElement("h3");
      h.className = "tb-sec-heading";
      h.textContent = sec.heading;
      wrap.appendChild(h);
    }
    const bar = document.createElement("div");
    bar.className = "renshu-toolbar";
    bar.innerHTML = `
      <div class="mode-switch">
        <button type="button" class="mode-btn ${!testMode ? "active" : ""}" data-m="study">お手本モード</button>
        <button type="button" class="mode-btn ${testMode ? "active" : ""}" data-m="test">聞き取りテスト</button>
      </div>
      ${testMode ? `
        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" class="btn primary" data-act="check">答え合わせ</button>
          <button type="button" class="btn" data-act="reveal">答えを見る</button>
          <span class="score-badge" data-role="score"></span>
        </div>
      ` : `<span class="page-sub">🔊 ボタンで音声を聞きながら覚えましょう</span>`}
    `;
    bar.querySelector('[data-m="study"]').addEventListener("click", () => { testMode = false; draw(); });
    bar.querySelector('[data-m="test"]').addEventListener("click", () => { testMode = true; draw(); });
    wrap.appendChild(bar);

    const grid = document.createElement("div");
    grid.className = "vocab-grid";
    const inputs = [];

    (sec.words || []).forEach((item) => {
      const card = document.createElement("div");
      card.className = "vocab-card";
      if (!testMode) {
        card.innerHTML = `
          <div class="vocab-top">
            <span class="vocab-icon">${item.icon || "📘"}</span>
            <button type="button" class="speak-mini-btn">🔊 きく</button>
          </div>
          <div class="vocab-word">${renderRubyHTML(item.w)}</div>
          <div class="vocab-hint"><span class="romaji">${item.r || ""}${item.mean ? " ／ " : ""}</span>${item.mean || ""}</div>
        `;
        card.querySelector(".speak-mini-btn").addEventListener("click", () => speakJa(item.speak || item.w));
      } else {
        card.innerHTML = `
          <div class="vocab-top">
            <span class="vocab-icon">${item.icon || "🎧"}</span>
            <button type="button" class="speak-mini-btn">🔊 きく</button>
          </div>
          <div class="vocab-test-romaji">${item.r || item.mean || ""}</div>
          <input type="text" class="vocab-input" placeholder="入力してください" />
          <div class="answer-reveal hidden">答え：${stripRubyForSpeech(item.w)}</div>
        `;
        card.querySelector(".speak-mini-btn").addEventListener("click", () => speakJa(item.speak || item.w));
        inputs.push({ inp: card.querySelector("input"), ans: stripRubyForSpeech(item.w), reveal: card.querySelector(".answer-reveal") });
      }
      grid.appendChild(card);
    });
    wrap.appendChild(grid);

    if (testMode) {
      bar.querySelector('[data-act="check"]').addEventListener("click", () => {
        let ok = 0;
        inputs.forEach(({ inp, ans, reveal }) => {
          const right = normalizeAns(inp.value) === normalizeAns(ans);
          inp.classList.toggle("correct", right);
          inp.classList.toggle("wrong", !right);
          reveal.classList.toggle("hidden", right);
          if (right) ok++;
        });
        bar.querySelector('[data-role="score"]').textContent = `${ok} / ${inputs.length} 問せいかい！`;
      });
      bar.querySelector('[data-act="reveal"]').addEventListener("click", () => {
        inputs.forEach(({ inp, ans, reveal }) => {
          inp.value = ans;
          inp.classList.add("correct");
          inp.classList.remove("wrong");
          reveal.classList.add("hidden");
        });
      });
    }
  };
  draw();
}

function renderKanjiPracticeSection(wrap, sec) {
  if (sec.heading) {
    const h = document.createElement("h3");
    h.className = "tb-sec-heading";
    h.textContent = sec.heading;
    wrap.appendChild(h);
  }
  const list = document.createElement("div");
  list.className = "kanji-list";
  const items = sec.items || [];

  const padItems = items.map((it) => {
    const readings = [it.on ? `音：${it.on}` : "", it.kun ? `訓：${it.kun}` : ""].filter(Boolean).join(" ／ ");
    const sampleWords = (it.words || []).slice(0, 3).map((w) => `${w.w}（${w.r}）`).join("・");
    const speakSample = it.words && it.words[0] ? it.words[0].r : it.kun || it.on || it.char;
    return {
      char: it.char,
      sub: readings + (it.strokes ? `（${it.strokes}画）` : ""),
      extra: sampleWords,
      speak: speakSample,
      isYoon: false,
    };
  });

  items.forEach((item, kanjiIdx) => {
    const card = document.createElement("div");
    card.className = "kanji-card";
    const speakSample = item.words && item.words[0] ? item.words[0].r : item.kun || item.on || item.char;
    card.innerHTML = `
      <div class="kanji-top">
        <div class="kanji-char-box">
          <button type="button" class="kanji-big-btn" title="読み方を聞く">${item.char}</button>
          <div class="kanji-badges">
            ${item.strokes ? `<span class="kanji-badge">${item.strokes}画</span>` : ""}
            ${item.radical ? `<span class="kanji-badge">部首：${item.radical}</span>` : ""}
          </div>
        </div>
        <div class="kanji-info">
          <div class="kanji-readings">
            ${item.on ? `<span class="reading-pill"><strong>音</strong>${item.on}</span>` : ""}
            ${item.kun ? `<span class="reading-pill"><strong>訓</strong>${item.kun}</span>` : ""}
          </div>
          <div class="kanji-words"></div>
        </div>
      </div>
      <div class="tracing-row">
        ${[true, true, false, false, false].map((hasGuide) => `
          <div class="trace-box">
            ${hasGuide ? `<span class="trace-guide">${item.char}</span>` : ""}
            <canvas class="trace-canvas" width="136" height="136"></canvas>
          </div>
        `).join("")}
        <button type="button" class="write-open-btn" data-role="open-pad">✍️ 大きく書く</button>
        <button type="button" class="trace-clear-btn">けす</button>
      </div>
      <div class="mobile-write-footer">
        <button type="button" class="write-open-btn" data-role="open-pad-mobile">✍️ 「${item.char}」を大きく書く練習</button>
      </div>
    `;
    card.querySelector(".kanji-big-btn").addEventListener("click", () => speakJa(speakSample));

    const openThisPad = () => window.openWritingPad?.(padItems, kanjiIdx, speakJa);
    card.querySelector('[data-role="open-pad"]').addEventListener("click", openThisPad);
    card.querySelector('[data-role="open-pad-mobile"]').addEventListener("click", openThisPad);

    const wordsEl = card.querySelector(".kanji-words");
    (item.words || []).forEach((wd) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "kanji-word-chip";
      chip.innerHTML = `<span class="kw-kanji">${wd.w}</span><span class="kw-read">${wd.r} 🔊</span>`;
      chip.addEventListener("click", () => speakJa(wd.r || wd.w));
      wordsEl.appendChild(chip);
    });

    const canvases = card.querySelectorAll(".trace-canvas");
    canvases.forEach(setupTraceCanvas);
    card.querySelector(".trace-clear-btn").addEventListener("click", () => {
      canvases.forEach((cv) => cv.getContext("2d").clearRect(0, 0, cv.width, cv.height));
    });
    list.appendChild(card);
  });

  wrap.appendChild(list);
}

function renderDialogueSection(wrap, sec) {
  const headingRow = document.createElement("div");
  headingRow.className = "tb-sec-heading";
  headingRow.innerHTML = `<span>${renderRubyHTML(sec.heading || "かいわ")}</span>`;
  const playAllBtn = document.createElement("button");
  playAllBtn.type = "button";
  playAllBtn.className = "action-pill";
  playAllBtn.textContent = "🔊 全部きく";
  playAllBtn.addEventListener("click", () => {
    const full = (sec.lines || []).map((l) => stripRubyForSpeech(l.ja)).join("。 ");
    speakJa(full);
  });
  headingRow.appendChild(playAllBtn);
  wrap.appendChild(headingRow);

  const list = document.createElement("div");
  list.className = "dialogue-list";
  (sec.lines || []).forEach((line) => {
    const row = document.createElement("div");
    row.className = "dialogue-line";
    row.innerHTML = `
      ${line.speaker ? `<span class="speaker-badge">${line.speaker}</span>` : ""}
      <div class="dialogue-text">
        <div>${renderRubyHTML(line.ja)}</div>
        ${line.r ? `<span class="dialogue-romaji romaji">${line.r}</span>` : ""}
      </div>
      <button type="button" class="speak-mini-btn">🔊</button>
    `;
    row.querySelector("button").addEventListener("click", () => speakJa(line.ja));
    list.appendChild(row);
  });
  wrap.appendChild(list);

  if (sec.goal) {
    const goal = document.createElement("div");
    goal.className = "goal-box";
    goal.innerHTML = `<strong>ねらい：</strong> ${renderRubyHTML(sec.goal)}`;
    wrap.appendChild(goal);
  }
}

function renderReadingSection(wrap, sec) {
  const headingRow = document.createElement("div");
  headingRow.className = "tb-sec-heading";
  headingRow.innerHTML = `<span>${renderRubyHTML(sec.heading || "よみもの")}</span>`;
  const playAllBtn = document.createElement("button");
  playAllBtn.type = "button";
  playAllBtn.className = "action-pill";
  playAllBtn.textContent = "🔊 全文をきく";
  playAllBtn.addEventListener("click", () => {
    const full = (sec.paragraphs || []).map(stripRubyForSpeech).join(" ");
    speakJa(full);
  });
  headingRow.appendChild(playAllBtn);
  wrap.appendChild(headingRow);

  const body = document.createElement("div");
  body.className = "reading-body";
  (sec.paragraphs || []).forEach((p) => {
    const row = document.createElement("div");
    row.className = "reading-para";
    row.innerHTML = `<p>${renderRubyHTML(p)}</p><button type="button" class="speak-mini-btn">🔊</button>`;
    row.querySelector("button").addEventListener("click", () => speakJa(p));
    body.appendChild(row);
  });
  wrap.appendChild(body);

  if (sec.question) {
    const qBox = document.createElement("div");
    qBox.className = "goal-box";
    qBox.innerHTML = renderRubyHTML(sec.question);
    wrap.appendChild(qBox);
  }

  if (sec.glossary && sec.glossary.length) {
    const gBox = document.createElement("div");
    gBox.className = "glossary-box";
    gBox.innerHTML = `<strong>ことば・読み方</strong><div class="glossary-grid"></div>`;
    const gGrid = gBox.querySelector(".glossary-grid");
    sec.glossary.forEach((g) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "kanji-word-chip";
      chip.innerHTML = `<span class="kw-kanji">${g.w}</span><span class="kw-read">${g.r} 🔊</span>`;
      chip.addEventListener("click", () => speakJa(g.r || g.w));
      gGrid.appendChild(chip);
    });
    wrap.appendChild(gBox);
  }
}

function renderTableSection(wrap, sec) {
  if (sec.heading) {
    const h = document.createElement("h3");
    h.className = "tb-sec-heading";
    h.innerHTML = renderRubyHTML(sec.heading);
    wrap.appendChild(h);
  }
  const tWrap = document.createElement("div");
  tWrap.className = "tb-table-wrap";
  const table = document.createElement("table");
  table.className = "tb-table";
  if (sec.headers && sec.headers.length) {
    const thead = document.createElement("thead");
    thead.innerHTML = `<tr>${sec.headers.map((h) => `<th>${renderRubyHTML(h)}</th>`).join("")}</tr>`;
    table.appendChild(thead);
  }
  const tbody = document.createElement("tbody");
  (sec.rows || []).forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "speak-cell-btn";
      btn.innerHTML = renderRubyHTML(String(cell));
      btn.addEventListener("click", () => speakJa(String(cell)));
      td.appendChild(btn);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tWrap.appendChild(table);
  wrap.appendChild(tWrap);
}

function renderPairsSection(wrap, sec) {
  const box = document.createElement("div");
  box.className = "grammar-box";
  box.style.marginTop = "0";
  if (sec.heading) {
    const h = document.createElement("h3");
    h.innerHTML = renderRubyHTML(sec.heading);
    box.appendChild(h);
  }
  const grid = document.createElement("div");
  grid.className = "pair-grid";
  (sec.pairs || []).forEach(([a, b]) => {
    const card = document.createElement("div");
    card.className = "pair-card";
    const b1 = document.createElement("button");
    b1.type = "button";
    b1.className = "pair-word-btn";
    b1.innerHTML = renderRubyHTML(a);
    b1.addEventListener("click", () => speakJa(a));
    const arr = document.createElement("span");
    arr.className = "pair-arrow";
    arr.textContent = "⇔";
    const b2 = document.createElement("button");
    b2.type = "button";
    b2.className = "pair-word-btn";
    b2.innerHTML = renderRubyHTML(b);
    b2.addEventListener("click", () => speakJa(b));
    card.append(b1, arr, b2);
    grid.appendChild(card);
  });
  box.appendChild(grid);
  wrap.appendChild(box);
}

function renderQuizSection(wrap, sec) {
  const box = document.createElement("div");
  box.className = "grammar-box";
  box.style.marginTop = "0";
  if (sec.heading) {
    const h = document.createElement("h3");
    h.innerHTML = renderRubyHTML(sec.heading);
    box.appendChild(h);
  }
  if (sec.instruction) {
    const p = document.createElement("p");
    p.innerHTML = renderRubyHTML(sec.instruction);
    box.appendChild(p);
  }
  const list = document.createElement("div");
  list.className = "quiz-list";
  const inputs = [];
  (sec.items || []).forEach((it) => {
    const row = document.createElement("div");
    row.className = "quiz-row";
    row.innerHTML = `
      <span class="quiz-prompt">${renderRubyHTML(it.prompt)} ${it.speak ? '<button type="button" class="speak-mini-btn">🔊</button>' : ""}</span>
      <input type="text" class="quiz-input" placeholder="答えを入力..." />
    `;
    if (it.speak) {
      row.querySelector("button").addEventListener("click", () => speakJa(it.speak));
    }
    inputs.push({ inp: row.querySelector("input"), ans: it.answer });
    list.appendChild(row);
  });
  box.appendChild(list);

  const bar = document.createElement("div");
  bar.className = "check-bar";
  bar.innerHTML = `
    <button type="button" class="btn primary" data-act="check">答え合わせ</button>
    <button type="button" class="btn" data-act="show">答えを見る</button>
    <span class="score-badge" data-role="score"></span>
  `;
  bar.querySelector('[data-act="check"]').addEventListener("click", () => {
    let ok = 0;
    inputs.forEach(({ inp, ans }) => {
      const right = normalizeAns(inp.value) === normalizeAns(ans);
      inp.classList.toggle("correct", right);
      inp.classList.toggle("wrong", !right);
      if (right) ok++;
    });
    bar.querySelector('[data-role="score"]').textContent = `${ok} / ${inputs.length} 問せいかい！`;
  });
  bar.querySelector('[data-act="show"]').addEventListener("click", () => {
    inputs.forEach(({ inp, ans }) => {
      inp.value = ans;
      inp.classList.add("correct");
      inp.classList.remove("wrong");
    });
  });
  box.appendChild(bar);
  wrap.appendChild(box);
}

function renderFillPracticeSection(wrap, sec) {
  const box = document.createElement("div");
  box.className = "grammar-box fill-practice-box";
  box.style.marginTop = "0";
  if (sec.heading) {
    const h = document.createElement("h3");
    h.innerHTML = renderRubyHTML(sec.heading);
    box.appendChild(h);
  }
  if (sec.instruction) {
    const p = document.createElement("p");
    p.innerHTML = renderRubyHTML(sec.instruction);
    box.appendChild(p);
  }

  const memos = loadMemos();
  const list = document.createElement("div");
  list.className = "quiz-list";

  (sec.templates || []).forEach((tpl, idx) => {
    const storageKey = `fill_${state.currentIndex}_${idx}`;
    const row = document.createElement("div");
    row.className = "fill-row";
    const beforeHTML = tpl.before ? `<span>${renderRubyHTML(tpl.before)}</span>` : "";
    const afterHTML = tpl.after ? `<span>${renderRubyHTML(tpl.after)}</span>` : "";
    row.innerHTML = `
      <div class="fill-line">
        ${beforeHTML}
        <input type="text" class="fill-input" placeholder="${tpl.placeholder || "ここに入力"}" value="${(memos[storageKey] || "").replace(/"/g, "&quot;")}" />
        ${afterHTML}
      </div>
      <button type="button" class="speak-mini-btn">🔊 よみあげる</button>
    `;
    const inp = row.querySelector("input");
    inp.addEventListener("input", (e) => saveMemo(storageKey, e.target.value));
    row.querySelector("button").addEventListener("click", () => {
      const val = inp.value.trim() || tpl.sample || "";
      const sentence = `${stripRubyForSpeech(tpl.before || "")}${val}${stripRubyForSpeech(tpl.after || "")}`;
      speakJa(sentence);
    });
    list.appendChild(row);
  });

  box.appendChild(list);
  wrap.appendChild(box);
}

function renderImageRefSection(wrap, sec) {
  if (sec.heading) {
    const h = document.createElement("h3");
    h.className = "tb-sec-heading";
    h.innerHTML = renderRubyHTML(sec.heading);
    wrap.appendChild(h);
  }
  const pFile = String(sec.pdfPage || 1).padStart(3, "0");
  const fig = document.createElement("div");
  fig.className = "inline-ref-img";
  fig.innerHTML = `
    <img src="books/${state.bookId}/pages/p${pFile}.webp" alt="${sec.caption || "図版"}" loading="lazy" />
    ${sec.caption ? `<p class="inline-ref-caption">${renderRubyHTML(sec.caption)}</p>` : ""}
  `;
  wrap.appendChild(fig);
}

init();
