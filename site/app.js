/* =====================================================
   デジタルテキスト Bookshelf (HTML-only)
   ===================================================== */

const STORAGE_KEYS = {
  progress: "kasukabe_textbook_progress_v1",
  lastOpened: "kasukabe_textbook_last_v1",
};

const state = {
  catalog: null,
  books: [],
  activeCategory: "all",
  searchQuery: "",
};

const els = {
  siteStats: document.getElementById("site-stats"),
  continueSection: document.getElementById("continue-section"),
  continueThumb: document.getElementById("continue-thumb"),
  continueTitle: document.getElementById("continue-title"),
  continueMeta: document.getElementById("continue-meta"),
  continueBtn: document.getElementById("continue-btn"),
  booksGrid: document.getElementById("books-grid"),
  emptyState: document.getElementById("empty-state"),
  searchInput: document.getElementById("search-input"),
  resetFilterBtn: document.getElementById("reset-filter-btn"),
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getProgressMap() {
  return loadJSON(STORAGE_KEYS.progress, {});
}

function getBookUrl(book, page = 1) {
  const base = book.htmlUrl || (book.id === "01-hiragana" ? "hiragana.html" : `textbook.html?book=${encodeURIComponent(book.id)}`);
  return page > 1 ? `${base}#p${page}` : base;
}

async function init() {
  try {
    const res = await fetch("data/books.json");
    if (!res.ok) throw new Error("books.json の読み込みに失敗しました");
    state.catalog = await res.json();
    state.books = state.catalog.books || [];

    els.siteStats.textContent = `全 ${state.catalog.totalBooks} 冊・${state.catalog.totalPages} ページ`;
    bindEvents();
    renderBookshelf();
  } catch (err) {
    els.siteStats.textContent = "読み込みエラー";
    els.booksGrid.innerHTML = `<div class="empty-state"><p>データの読み込みに失敗しました: ${err.message}</p></div>`;
  }
}

function bindEvents() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      state.activeCategory = btn.dataset.category;
      renderBookshelf();
    });
  });

  els.searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderBookshelf();
  });

  els.resetFilterBtn.addEventListener("click", () => {
    state.activeCategory = "all";
    state.searchQuery = "";
    els.searchInput.value = "";
    document.querySelectorAll(".tab-btn").forEach((b) => {
      const isAll = b.dataset.category === "all";
      b.classList.toggle("active", isAll);
      b.setAttribute("aria-selected", String(isAll));
    });
    renderBookshelf();
  });
}

function renderContinueBanner() {
  const last = loadJSON(STORAGE_KEYS.lastOpened, null);
  if (!last || !last.bookId) {
    els.continueSection.classList.add("hidden");
    return;
  }
  const book = state.books.find((b) => b.id === last.bookId);
  if (!book) {
    els.continueSection.classList.add("hidden");
    return;
  }
  const page = Math.min(Math.max(1, last.page || 1), book.pageCount);
  els.continueThumb.src = book.cover;
  els.continueTitle.textContent = `(${book.number}) ${book.title}`;
  els.continueMeta.textContent = `${page} / ${book.pageCount} ページまで学習済み`;
  els.continueBtn.href = getBookUrl(book, page);
  els.continueSection.classList.remove("hidden");
}

function renderBookshelf() {
  renderContinueBanner();
  const progressMap = getProgressMap();

  const filtered = state.books.filter((book) => {
    if (state.activeCategory !== "all" && book.category !== state.activeCategory) {
      return false;
    }
    if (state.searchQuery) {
      const q = state.searchQuery;
      return (
        book.title.toLowerCase().includes(q) ||
        book.subtitle.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q) ||
        book.categoryLabel.toLowerCase().includes(q) ||
        book.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (filtered.length === 0) {
    els.booksGrid.innerHTML = "";
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  els.booksGrid.innerHTML = "";

  filtered.forEach((book) => {
    const savedPage = Math.min(progressMap[book.id] || 0, book.pageCount);
    const percent = savedPage > 0 ? Math.round((savedPage / book.pageCount) * 100) : 0;
    const href = getBookUrl(book, savedPage > 0 ? savedPage : 1);

    const card = document.createElement("a");
    card.className = "book-card";
    card.href = href;
    card.style.textDecoration = "none";
    card.innerHTML = `
      <div class="book-cover-area">
        <span class="book-number-badge">No.${String(book.number).padStart(2, "0")}</span>
        <div class="book-cover-frame">
          <img src="${book.cover}" alt="${book.title} 表紙" loading="lazy" />
        </div>
        <span class="book-pages-badge">${book.pageCount}ページ</span>
      </div>
      <div class="book-meta">
        <div class="book-tags">
          <span class="tag tag-${book.category}">${book.categoryLabel}</span>
          <span class="tag tag-level">${book.level}</span>
        </div>
        <h3 class="book-title">${book.title}</h3>
        <p class="book-desc">${book.description}</p>
        ${
          savedPage > 0
            ? `<div class="book-progress-wrap">
                 <div class="book-progress-text">
                   <span>p.${savedPage} / ${book.pageCount}</span>
                   <span>${percent}%</span>
                 </div>
                 <div class="book-progress-bar">
                   <div class="book-progress-fill" style="width:${percent}%"></div>
                 </div>
               </div>`
            : ""
        }
      </div>
    `;
    els.booksGrid.appendChild(card);
  });
}

init();
