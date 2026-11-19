/* =====================================================
   Full-Screen / Large Writing Pad Modal (writing-pad.js)
   Used by both hiragana.html and textbook.html
   ===================================================== */

(function () {
  let modalEl = null;
  let items = [];
  let idx = 0;
  let showGuide = true;
  let strokes = [];
  let currentStroke = null;
  let drawing = false;
  let speakCallback = null;

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
          <div class="wp-pad-wrap">
            <span class="wp-guide-char" data-wp="guide-char"></span>
            <canvas class="wp-canvas" data-wp="canvas" width="600" height="600"></canvas>
          </div>
        </div>

        <footer class="wp-controls">
          <div class="wp-edit-row">
            <button type="button" class="wp-ctrl-btn" data-wp="undo">↶ 1画もどす</button>
            <button type="button" class="wp-ctrl-btn danger" data-wp="clear">🗑️ ぜんぶけす</button>
          </div>
          <div class="wp-nav-row">
            <button type="button" class="wp-nav-btn" data-wp="prev">← 前の文字</button>
            <button type="button" class="wp-nav-btn primary" data-wp="next">次の文字 →</button>
          </div>
        </footer>
      </div>
    `;
    document.body.appendChild(modalEl);

    const canvas = modalEl.querySelector('[data-wp="canvas"]');
    bindCanvas(canvas);

    modalEl.querySelector('[data-wp="close"]').addEventListener("click", closePad);
    modalEl.querySelector('[data-wp="guide"]').addEventListener("click", () => {
      showGuide = !showGuide;
      updateGuideUI();
    });
    modalEl.querySelector('[data-wp="speak"]').addEventListener("click", () => {
      const it = items[idx];
      if (it && speakCallback) speakCallback(it.speak || it.char);
    });
    modalEl.querySelector('[data-wp="undo"]').addEventListener("click", () => {
      strokes.pop();
      redrawCanvas();
    });
    modalEl.querySelector('[data-wp="clear"]').addEventListener("click", () => {
      strokes = [];
      redrawCanvas();
    });
    modalEl.querySelector('[data-wp="prev"]').addEventListener("click", () => {
      if (idx > 0) {
        idx--;
        strokes = [];
        renderCurrent();
      }
    });
    modalEl.querySelector('[data-wp="next"]').addEventListener("click", () => {
      if (idx < items.length - 1) {
        idx++;
        strokes = [];
        renderCurrent();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (!modalEl || modalEl.classList.contains("hidden")) return;
      if (e.key === "Escape") closePad();
    });
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
      redrawCanvas();
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!drawing || !currentStroke) return;
      e.preventDefault();
      currentStroke.push(getPt(e));
      redrawCanvas();
    });

    const end = () => {
      drawing = false;
      currentStroke = null;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  function redrawCanvas() {
    if (!modalEl) return;
    const canvas = modalEl.querySelector('[data-wp="canvas"]');
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, 7, 0, Math.PI * 2);
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
  }

  function updateGuideUI() {
    const btn = modalEl.querySelector('[data-wp="guide"]');
    const guideChar = modalEl.querySelector('[data-wp="guide-char"]');
    btn.classList.toggle("active", showGuide);
    btn.textContent = showGuide ? "お手本 ON" : "お手本 OFF";
    guideChar.classList.toggle("hidden", !showGuide);
  }

  function renderCurrent() {
    const it = items[idx];
    if (!it) return;
    modalEl.querySelector('[data-wp="counter"]').textContent = `${idx + 1} / ${items.length}`;
    modalEl.querySelector('[data-wp="title"]').textContent = `${it.char} の練習`;
    modalEl.querySelector('[data-wp="banner-char"]').textContent = it.char;
    modalEl.querySelector('[data-wp="banner-sub"]').textContent = it.sub || "";
    modalEl.querySelector('[data-wp="banner-extra"]').textContent = it.extra || "";

    const guideEl = modalEl.querySelector('[data-wp="guide-char"]');
    guideEl.textContent = it.char;
    guideEl.classList.toggle("yoon", Boolean(it.isYoon || it.char.length > 1));

    modalEl.querySelector('[data-wp="prev"]').disabled = idx === 0;
    modalEl.querySelector('[data-wp="next"]').disabled = idx === items.length - 1;

    updateGuideUI();
    redrawCanvas();
  }

  function closePad() {
    if (!modalEl) return;
    modalEl.classList.add("hidden");
    document.body.style.overflow = "";
  }

  window.openWritingPad = function (charItems, startIndex, speakFn) {
    if (!charItems || !charItems.length) return;
    ensureModal();
    items = charItems;
    idx = Math.min(Math.max(0, startIndex || 0), items.length - 1);
    speakCallback = speakFn || null;
    strokes = [];
    renderCurrent();
    modalEl.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
})();
