/* =====================================================
   Full-Screen / Large Writing Pad Modal + Client-Side
   Handwriting & Stroke-Order Evaluator (writing-pad.js)
   ===================================================== */

(function () {
  // ==================== STROKE COUNTS (HIRAGANA & KATAKANA) ====================
  const BASE_STROKES = {
    // Hiragana
    "あ":3,"い":2,"う":2,"え":2,"お":3,
    "か":3,"き":4,"く":1,"け":3,"こ":2,
    "さ":3,"し":1,"す":2,"せ":3,"そ":1,
    "た":4,"ち":2,"つ":1,"て":1,"と":2,
    "な":4,"に":3,"ぬ":2,"ね":2,"の":1,
    "は":3,"ひ":1,"ふ":4,"へ":1,"ほ":4,
    "ま":3,"み":2,"む":3,"め":2,"も":3,
    "や":3,"ゆ":2,"よ":2,
    "ら":2,"り":2,"る":1,"れ":2,"ろ":1,
    "わ":2,"を":3,"ん":1,
    "ゃ":3,"ゅ":2,"ょ":2,"っ":1,"ぁ":3,"ぃ":2,"ぅ":2,"ぇ":2,"ぉ":3,
    // Katakana
    "ア":2,"イ":2,"ウ":3,"エ":3,"オ":3,
    "カ":2,"キ":3,"ク":2,"ケ":3,"コ":2,
    "サ":3,"シ":3,"ス":2,"セ":2,"ソ":2,
    "タ":3,"チ":3,"ツ":3,"テ":3,"ト":2,
    "ナ":2,"ニ":2,"ヌ":2,"ネ":4,"ノ":1,
    "ハ":2,"ヒ":2,"フ":1,"ヘ":1,"ホ":4,
    "マ":2,"ミ":3,"ム":2,"メ":2,"モ":3,
    "ヤ":2,"ユ":2,"ヨ":3,
    "ラ":2,"リ":2,"ル":2,"レ":1,"ロ":3,
    "ワ":2,"ヲ":3,"ン":2,"ー":1,
    "ャ":2,"ュ":2,"ョ":3,"ッ":3,"ァ":2,"ィ":2,"ゥ":3,"ェ":3,"ォ":3
  };

  const DAKUTEN_MAP = {
    "が":"か","ぎ":"き","ぐ":"く","げ":"け","ご":"こ",
    "ざ":"さ","じ":"し","ず":"す","ぜ":"せ","ぞ":"そ",
    "だ":"た","ぢ":"ち","づ":"つ","で":"て","ど":"と",
    "ば":"は","び":"ひ","ぶ":"ふ","べ":"へ","ぼ":"ほ",
    "ガ":"カ","ギ":"キ","グ":"ク","ゲ":"ケ","ゴ":"コ",
    "ザ":"サ","ジ":"シ","ズ":"ス","ゼ":"セ","ゾ":"ソ",
    "ダ":"タ","ヂ":"チ","ヅ":"ツ","デ":"テ","ド":"ト",
    "バ":"ハ","ビ":"ヒ","ブ":"フ","ベ":"ヘ","ボ":"ホ","ヴ":"ウ"
  };

  const HANDAKUTEN_MAP = {
    "ぱ":"は","ぴ":"ひ","ぷ":"ふ","ぺ":"へ","ぽ":"ほ",
    "パ":"ハ","ピ":"ヒ","プ":"フ","ペ":"ヘ","ポ":"ホ"
  };

  function getExpectedStrokes(text) {
    if (!text) return null;
    let total = 0;
    for (const ch of Array.from(text)) {
      if (BASE_STROKES[ch] != null) {
        total += BASE_STROKES[ch];
      } else if (DAKUTEN_MAP[ch]) {
        total += (BASE_STROKES[DAKUTEN_MAP[ch]] || 0) + 2;
      } else if (HANDAKUTEN_MAP[ch]) {
        total += (BASE_STROKES[HANDAKUTEN_MAP[ch]] || 0) + 1;
      } else {
        return null; // Unknown kanji without explicit count
      }
    }
    return total > 0 ? total : null;
  }

  window.getExpectedStrokes = getExpectedStrokes;

  // ==================== STROKE DIRECTION CHECK ====================
  function checkStrokeDirections(strokeList) {
    // Check basic Japanese stroke-order rules:
    // Horizontal strokes generally go left -> right; vertical strokes go top -> bottom.
    let reversedCount = 0;
    for (const st of strokeList) {
      if (st.length < 4) continue;
      const start = st[0];
      const end = st[st.length - 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 45) continue; // Ignore short hooks/dots/loops
      // Strictly horizontal right-to-left stroke (unusual in Japanese)
      if (Math.abs(dx) > Math.abs(dy) * 2.4 && dx < -45) {
        reversedCount++;
      }
      // Strictly vertical bottom-to-top stroke (unusual in Japanese)
      if (Math.abs(dy) > Math.abs(dx) * 2.4 && dy < -45) {
        reversedCount++;
      }
    }
    return reversedCount;
  }

  // ==================== HANDWRITING EVALUATOR ====================
  function getInkBounds(data, w, h) {
    let minX = w, minY = h, maxX = -1, maxY = -1, count = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = data[(y * w + x) * 4 + 3];
        if (a > 40) {
          count++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return count === 0 ? null : { minX, minY, maxX, maxY, count };
  }

  function renderNormalizedMask(srcCanvas, gridW, gridH) {
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    const sctx = srcCanvas.getContext("2d", { willReadFrequently: true });
    const sdata = sctx.getImageData(0, 0, sw, sh).data;
    const b = getInkBounds(sdata, sw, sh);
    if (!b) return null;

    const bw = Math.max(1, b.maxX - b.minX + 1);
    const bh = Math.max(1, b.maxY - b.minY + 1);

    const pad = 6;
    const availW = gridW - pad * 2;
    const availH = gridH - pad * 2;
    const scale = Math.min(availW / bw, availH / bh);
    const dw = bw * scale;
    const dh = bh * scale;
    const dx = (gridW - dw) / 2;
    const dy = (gridH - dh) / 2;

    const norm = document.createElement("canvas");
    norm.width = gridW;
    norm.height = gridH;
    const nctx = norm.getContext("2d", { willReadFrequently: true });
    nctx.drawImage(srcCanvas, b.minX, b.minY, bw, bh, dx, dy, dw, dh);

    const ndata = nctx.getImageData(0, 0, gridW, gridH).data;
    const mask = new Uint8Array(gridW * gridH);
    let ink = 0;
    for (let i = 0; i < mask.length; i++) {
      if (ndata[i * 4 + 3] > 35) {
        mask[i] = 1;
        ink++;
      }
    }
    return { mask, ink, aspect: bw / bh };
  }

  function renderReferenceCanvas(text, isWide) {
    const c = document.createElement("canvas");
    c.width = isWide ? 600 : 300;
    c.height = isWide ? 240 : 300;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontSize = isWide ? 140 : 210;
    if (text.length > 1) {
      fontSize = Math.min(fontSize, Math.floor((c.width * 0.86) / text.length));
    }
    ctx.font = `600 ${fontSize}px "Klee One", "Hiragino Maru Gothic ProN", "Noto Sans JP", sans-serif`;
    ctx.fillText(text, c.width / 2, c.height / 2);
    return c;
  }

  function dilateMask(mask, w, h, radius) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(h - 1, y + radius);
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        const x0 = Math.max(0, x - radius);
        const x1 = Math.min(w - 1, x + radius);
        for (let yy = y0; yy <= y1; yy++) {
          const row = yy * w;
          for (let xx = x0; xx <= x1; xx++) {
            out[row + xx] = 1;
          }
        }
      }
    }
    return out;
  }

  function evaluateHandwritingCanvas(userCanvas, targetText, isWide, options = {}) {
    const gridW = isWide ? 112 : 64;
    const gridH = 64;
    const userNorm = renderNormalizedMask(userCanvas, gridW, gridH);
    if (!userNorm || userNorm.ink < 14) {
      return {
        status: "empty",
        score: 0,
        passed: false,
        message: "まだ書かれていません。書いてから判定しましょう！",
      };
    }

    const refCanvas = renderReferenceCanvas(targetText, isWide);
    const refNorm = renderNormalizedMask(refCanvas, gridW, gridH);
    if (!refNorm || refNorm.ink === 0) {
      return { status: "close", score: 70, passed: false, message: "お手本と見比べて確認しましょう！" };
    }

    const radius = 4;
    const refDilated = dilateMask(refNorm.mask, gridW, gridH, radius);
    const userDilated = dilateMask(userNorm.mask, gridW, gridH, radius);

    let refHit = 0;
    let userHit = 0;
    for (let i = 0; i < refNorm.mask.length; i++) {
      if (refNorm.mask[i] && userDilated[i]) refHit++;
      if (userNorm.mask[i] && refDilated[i]) userHit++;
    }

    const coverage = refHit / refNorm.ink;
    const precision = userHit / userNorm.ink;
    let f1 = coverage + precision > 0 ? (2 * coverage * precision) / (coverage + precision) : 0;

    const ratioDiff = Math.max(userNorm.aspect / refNorm.aspect, refNorm.aspect / userNorm.aspect);
    if (ratioDiff > 1.8) {
      f1 *= Math.max(0.55, 1.8 / ratioDiff);
    }

    const score = Math.min(100, Math.max(0, Math.round(f1 * 100)));
    const passThreshold = isWide ? 68 : 72;

    // Optional stroke count & direction check
    const notes = [];
    let strokePenalty = false;
    if (options.expectedStrokes && typeof options.drawnStrokes === "number") {
      const diff = options.drawnStrokes - options.expectedStrokes;
      if (diff === 0) {
        notes.push(`画数OK(${options.expectedStrokes}画)`);
      } else if (diff < 0) {
        notes.push(`画数が少なめ(${options.drawnStrokes}/${options.expectedStrokes}画)`);
        if (Math.abs(diff) >= 2) strokePenalty = true;
      } else {
        notes.push(`画数が多め(${options.drawnStrokes}/${options.expectedStrokes}画)`);
        if (Math.abs(diff) >= 2) strokePenalty = true;
      }
    }
    if (options.strokeList && options.strokeList.length > 0) {
      const rev = checkStrokeDirections(options.strokeList);
      if (rev > 0) {
        notes.push("書き順方向(左→右・上→下)に注意");
      }
    }
    const noteText = notes.length ? ` ／ ${notes.join("・")}` : "";

    if (score >= passThreshold && !strokePenalty) {
      return {
        status: "ok",
        score,
        passed: true,
        message: `🎉 せいかい！（一致度 ${score}%${noteText}）`,
      };
    }
    if (score >= 52) {
      return {
        status: "close",
        score,
        passed: false,
        message: `👍 おしい！（一致度 ${score}%${noteText}）`,
      };
    }
    return {
      status: "retry",
      score,
      passed: false,
      message: `💪 もういちど！（一致度 ${score}%${noteText}）`,
    };
  }

  window.evaluateHandwritingCanvas = evaluateHandwritingCanvas;

  // ==================== WRITING PAD MODAL ====================
  let modalEl = null;
  let items = [];
  let idx = 0;
  let showGuide = true;
  let showStrokeNums = true;
  let answerRevealed = false;
  let strokes = [];
  let currentStroke = null;
  let drawing = false;
  let speakCallback = null;
  let onPassCallback = null;

  function ensureModal() {
    if (modalEl) return;
    modalEl = document.createElement("div");
    modalEl.id = "writing-pad-modal";
    modalEl.className = "wp-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.innerHTML = `
      <div class="wp-shell">
        <header class="wp-topbar">
          <button type="button" class="wp-top-btn" data-wp="close">← 戻る</button>
          <div class="wp-top-center">
            <span class="wp-counter" data-wp="counter">1 / 1</span>
            <span class="wp-top-title" data-wp="title"></span>
            <span class="wp-stroke-pill" data-wp="stroke-pill">0画</span>
          </div>
          <button type="button" class="wp-top-btn wp-guide-btn active" data-wp="guide">お手本 ON</button>
        </header>

        <div class="wp-banner">
          <div class="wp-banner-main">
            <span class="wp-banner-char" data-wp="banner-char"></span>
            <div class="wp-banner-info">
              <div class="wp-banner-sub" data-wp="banner-sub"></div>
              <div class="wp-banner-extra" data-wp="banner-extra"></div>
            </div>
          </div>
          <button type="button" class="wp-speak-btn" data-wp="speak" title="発音を聞く">🔊 きく</button>
        </div>

        <div class="wp-stage">
          <div class="wp-pad-wrap" data-wp="pad-wrap">
            <span class="wp-guide-char" data-wp="guide-char"></span>
            <canvas class="wp-canvas" data-wp="canvas" width="600" height="600"></canvas>
          </div>
        </div>

        <div class="wp-result hidden" data-wp="result"></div>

        <footer class="wp-controls">
          <div class="wp-edit-row">
            <button type="button" class="wp-ctrl-btn" data-wp="undo">↶ 戻す</button>
            <button type="button" class="wp-ctrl-btn danger" data-wp="clear">🗑️ けす</button>
            <button type="button" class="wp-ctrl-btn check" data-wp="check">✓ 答え合わせ</button>
          </div>
          <div class="wp-nav-row">
            <button type="button" class="wp-nav-btn" data-wp="prev">← 前へ</button>
            <button type="button" class="wp-nav-btn primary" data-wp="next">次へ →</button>
          </div>
        </footer>
      </div>
    `;
    document.body.appendChild(modalEl);

    const canvas = modalEl.querySelector('[data-wp="canvas"]');
    bindCanvas(canvas);

    modalEl.querySelector('[data-wp="close"]').addEventListener("click", closePad);
    modalEl.querySelector('[data-wp="guide"]').addEventListener("click", () => {
      const it = items[idx];
      if (it && it.testMode) {
        answerRevealed = !answerRevealed;
        updateTestAnswerUI();
      } else {
        showGuide = !showGuide;
        updateGuideUI();
      }
    });
    modalEl.querySelector('[data-wp="speak"]').addEventListener("click", () => {
      const it = items[idx];
      if (it && speakCallback) speakCallback(it.speak || it.char);
    });
    modalEl.querySelector('[data-wp="undo"]').addEventListener("click", () => {
      strokes.pop();
      hideResult();
      updateStrokePill();
      redrawCanvas();
    });
    modalEl.querySelector('[data-wp="clear"]').addEventListener("click", () => {
      strokes = [];
      hideResult();
      updateStrokePill();
      redrawCanvas();
    });
    modalEl.querySelector('[data-wp="check"]').addEventListener("click", runPadCheck);
    modalEl.querySelector('[data-wp="prev"]').addEventListener("click", () => {
      if (idx > 0) {
        idx--;
        strokes = [];
        answerRevealed = false;
        hideResult();
        renderCurrent();
      }
    });
    modalEl.querySelector('[data-wp="next"]').addEventListener("click", () => {
      if (idx < items.length - 1) {
        idx++;
        strokes = [];
        answerRevealed = false;
        hideResult();
        renderCurrent();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (!modalEl || modalEl.classList.contains("hidden")) return;
      if (e.key === "Escape") closePad();
    });
  }

  function getItemExpectedStrokes(it) {
    if (!it) return null;
    if (typeof it.strokes === "number" && it.strokes > 0) return it.strokes;
    return getExpectedStrokes(it.char);
  }

  function updateStrokePill() {
    if (!modalEl) return;
    const it = items[idx];
    const pill = modalEl.querySelector('[data-wp="stroke-pill"]');
    const expected = getItemExpectedStrokes(it);
    if (expected) {
      pill.textContent = `${strokes.length}/${expected}画`;
      pill.classList.toggle("exact", strokes.length === expected);
    } else {
      pill.textContent = `${strokes.length}画`;
      pill.classList.remove("exact");
    }
  }

  function hideResult() {
    if (!modalEl) return;
    const resEl = modalEl.querySelector('[data-wp="result"]');
    resEl.classList.add("hidden");
    resEl.className = "wp-result hidden";
    const guideEl = modalEl.querySelector('[data-wp="guide-char"]');
    guideEl.classList.remove("compare-ok", "compare-ng");
  }

  function runPadCheck() {
    const it = items[idx];
    if (!it) return;
    const canvas = modalEl.querySelector('[data-wp="canvas"]');

    // Temporarily render clean strokes (without stroke number badges) for accurate pixel comparison
    redrawCanvas(false);
    const expected = getItemExpectedStrokes(it);
    const res = evaluateHandwritingCanvas(canvas, it.char, Boolean(it.wide), {
      expectedStrokes: it.wide ? null : expected,
      drawnStrokes: strokes.length,
      strokeList: strokes,
    });
    redrawCanvas(true);

    const resEl = modalEl.querySelector('[data-wp="result"]');
    const guideEl = modalEl.querySelector('[data-wp="guide-char"]');

    resEl.textContent = res.message;
    resEl.className = `wp-result is-${res.status}`;

    if (res.status !== "empty") {
      if (it.testMode) {
        answerRevealed = true;
        updateTestAnswerUI();
      } else {
        guideEl.classList.remove("hidden");
      }
      guideEl.classList.toggle("compare-ok", Boolean(res.passed));
      guideEl.classList.toggle("compare-ng", !res.passed);

      if (res.passed) {
        if (speakCallback) speakCallback(it.speak || it.char);
        if (onPassCallback) onPassCallback(idx, res.score);
      }
    }
  }

  function bindCanvas(canvas) {
    const getPt = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * canvas.width,
        y: ((e.clientY - r.top) / r.height) * canvas.height,
      };
    };

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawing = true;
      currentStroke = [getPt(e)];
      strokes.push(currentStroke);
      updateStrokePill();
      redrawCanvas(true);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!drawing || !currentStroke) return;
      e.preventDefault();
      currentStroke.push(getPt(e));
      redrawCanvas(true);
    });

    const end = () => {
      drawing = false;
      currentStroke = null;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  function redrawCanvas(withNumbers = true) {
    if (!modalEl) return;
    const canvas = modalEl.querySelector('[data-wp="canvas"]');
    const ctx = canvas.getContext("2d");
    const it = items[idx];
    const lineW = it && it.wide ? 11 : 14;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, lineW / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#111827";
        ctx.fill();
      } else {
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    }

    // Draw stroke-order start badges (1, 2, 3...) for single-character practice
    if (withNumbers && showStrokeNums && !(it && it.wide)) {
      ctx.save();
      ctx.font = 'bold 20px "Noto Sans JP", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      strokes.forEach((st, i) => {
        if (!st.length) return;
        const p = st[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(29, 91, 121, 0.88)";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(i + 1), p.x, p.y + 1);
      });
      ctx.restore();
    }
  }

  function updateGuideUI() {
    const btn = modalEl.querySelector('[data-wp="guide"]');
    const guideChar = modalEl.querySelector('[data-wp="guide-char"]');
    btn.classList.toggle("active", showGuide);
    btn.textContent = showGuide ? "お手本 ON" : "お手本 OFF";
    guideChar.classList.toggle("hidden", !showGuide);
  }

  function updateTestAnswerUI() {
    const it = items[idx];
    const btn = modalEl.querySelector('[data-wp="guide"]');
    const guideChar = modalEl.querySelector('[data-wp="guide-char"]');
    const extraEl = modalEl.querySelector('[data-wp="banner-extra"]');
    btn.classList.toggle("active", answerRevealed);
    btn.textContent = answerRevealed ? "答えを隠す" : "答えを見る";
    guideChar.classList.toggle("hidden", !answerRevealed);
    extraEl.textContent = answerRevealed
      ? `答え：${it.char}（${Array.from(it.char).length}もじ）`
      : `音声をきいて手で書いてみましょう（${Array.from(it.char).length}もじ）`;
  }

  function renderCurrent() {
    const it = items[idx];
    if (!it) return;
    const padWrap = modalEl.querySelector('[data-wp="pad-wrap"]');
    const canvas = modalEl.querySelector('[data-wp="canvas"]');
    const isWide = Boolean(it.wide);

    padWrap.classList.toggle("wide-pad", isWide);
    const targetW = isWide ? 900 : 600;
    const targetH = isWide ? 480 : 600;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    modalEl.querySelector('[data-wp="counter"]').textContent = `${idx + 1} / ${items.length}`;
    modalEl.querySelector('[data-wp="title"]').textContent = it.testMode ? "聞き取りテスト" : `${it.char} の練習`;
    modalEl.querySelector('[data-wp="banner-char"]').textContent = it.testMode ? (it.icon || "🎧") : it.char;
    modalEl.querySelector('[data-wp="banner-sub"]').textContent = it.sub || "";
    modalEl.querySelector('[data-wp="banner-extra"]').textContent = it.extra || "";

    const guideEl = modalEl.querySelector('[data-wp="guide-char"]');
    guideEl.textContent = it.char;
    guideEl.classList.toggle("yoon", Boolean(it.isYoon || (!isWide && it.char.length > 1)));
    guideEl.classList.toggle("word-guide", isWide);

    modalEl.querySelector('[data-wp="prev"]').disabled = idx === 0;
    modalEl.querySelector('[data-wp="next"]').disabled = idx === items.length - 1;

    updateStrokePill();
    if (it.testMode) {
      updateTestAnswerUI();
    } else {
      updateGuideUI();
    }
    redrawCanvas(true);
  }

  function closePad() {
    if (!modalEl) return;
    modalEl.classList.add("hidden");
    document.body.style.overflow = "";
  }

  window.openWritingPad = function (charItems, startIndex, speakFn, onPassFn) {
    if (!charItems || !charItems.length) return;
    ensureModal();
    items = charItems;
    idx = Math.min(Math.max(0, startIndex || 0), items.length - 1);
    speakCallback = speakFn || null;
    onPassCallback = onPassFn || null;
    strokes = [];
    answerRevealed = false;
    hideResult();
    renderCurrent();
    modalEl.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
})();
