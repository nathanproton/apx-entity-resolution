document.addEventListener("DOMContentLoaded", () => {
  const agencySelect = document.getElementById("agency-select");
  const bookSelect = document.getElementById("book-select");
  const pageInput = document.getElementById("page-input");
  const goBtn = document.getElementById("go-btn");
  const content = document.getElementById("book-content");
  const pageIndicator = document.getElementById("page-indicator");
  const scrollTopBtn = document.getElementById("scroll-top");
  const searchInput = document.getElementById("search-input");
  const searchMeta = document.getElementById("search-meta");

  const DATA = window.__BOOK_DATA__;
  const CORPUS = window.__BOOK_CORPUS__ || {};
  const AGENCY_KEY = window.__AGENCY_KEY__ || "";

  let currentMode = "browse";
  let miniSearchIndex = null;
  let allDocs = [];

  // ── Set active agency ──

  if (AGENCY_KEY && agencySelect) {
    agencySelect.value = AGENCY_KEY;
  }

  agencySelect.addEventListener("change", () => {
    window.location.href = agencySelect.value + ".html";
  });

  // ── Helpers ──

  function formatCorpus(corpus) {
    if (!corpus || corpus.length < 17) return "";
    const startYear = corpus.slice(0, 4);
    const endYear = corpus.slice(9, 13);
    return `${startYear}\u2013${endYear}`;
  }

  // ── Build book dropdown with corpus date ranges ──

  const books = Object.keys(DATA).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  books.forEach((book) => {
    const opt = document.createElement("option");
    opt.value = book;
    const dateRange = formatCorpus(CORPUS[book]);
    opt.textContent = dateRange
      ? `Book ${book} (${dateRange})`
      : `Book ${book}`;
    bookSelect.appendChild(opt);
  });

  // ── Build MiniSearch index over all pages ──

  function buildSearchIndex() {
    allDocs = [];
    let docId = 0;
    for (const book of Object.keys(DATA)) {
      for (const page of DATA[book]) {
        allDocs.push({
          id: docId++,
          book: book,
          plate: page.plate,
          ocrblock_txt: page.ocrblock_txt,
        });
      }
    }

    miniSearchIndex = new MiniSearch({
      fields: ["ocrblock_txt"],
      storeFields: ["book", "plate", "ocrblock_txt"],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        combineWith: "AND",
      },
    });

    miniSearchIndex.addAll(allDocs);
  }

  buildSearchIndex();

  // ── Render book (browse mode) ──

  function renderBook(bookKey) {
    currentMode = "browse";
    searchMeta.textContent = "";
    content.innerHTML = "";

    const pages = DATA[bookKey];
    if (!pages || pages.length === 0) {
      content.innerHTML = "<p>No pages found for this book.</p>";
      updatePageIndicator();
      return;
    }

    const sorted = [...pages].sort((a, b) => {
      const pa = typeof a.plate === "number" ? a.plate : parseInt(a.plate, 10);
      const pb = typeof b.plate === "number" ? b.plate : parseInt(b.plate, 10);
      return pa - pb;
    });

    const fragment = document.createDocumentFragment();

    sorted.forEach((page) => {
      const block = document.createElement("div");
      block.className = "page-block";
      block.id = `page-${page.plate}`;
      block.dataset.plate = page.plate;

      const label = document.createElement("span");
      label.className = "page-label";
      label.textContent = `Page ${page.plate}`;

      const viewLink = document.createElement("button");
      viewLink.className = "view-original";
      viewLink.textContent = "View Original";
      viewLink.addEventListener("click", () => {
        window.openPdfModal(AGENCY_KEY, bookKey, page.plate);
      });

      const labelRow = document.createElement("div");
      labelRow.className = "page-label-row";
      labelRow.appendChild(label);
      labelRow.appendChild(viewLink);

      const text = document.createElement("div");
      text.className = "page-text";
      text.textContent = page.ocrblock_txt;

      block.appendChild(labelRow);
      block.appendChild(text);
      fragment.appendChild(block);
    });

    content.appendChild(fragment);

    const minPage = sorted[0].plate;
    const maxPage = sorted[sorted.length - 1].plate;
    pageInput.min = typeof minPage === "number" ? minPage : parseInt(minPage, 10);
    pageInput.max = typeof maxPage === "number" ? maxPage : parseInt(maxPage, 10);
    pageInput.placeholder = `${minPage}\u2013${maxPage}`;
    pageInput.value = "";

    updatePageIndicator();
  }

  // ── Highlight search terms in text ──

  function highlightText(text, terms) {
    if (!terms || terms.length === 0) return document.createTextNode(text);

    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(pattern);

    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (pattern.test(part)) {
        const mark = document.createElement("mark");
        mark.textContent = part;
        frag.appendChild(mark);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
      pattern.lastIndex = 0;
    }
    return frag;
  }

  // ── Search and render results ──

  function performSearch(query) {
    if (!query.trim()) {
      searchMeta.textContent = "";
      renderBook(bookSelect.value);
      return;
    }

    currentMode = "search";
    content.innerHTML = "";

    const results = miniSearchIndex.search(query, {
      prefix: true,
      fuzzy: 0.2,
      combineWith: "AND",
    });

    if (results.length === 0) {
      searchMeta.textContent = "No results.";
      content.innerHTML =
        '<p class="no-results">No pages match your search.</p>';
      return;
    }

    searchMeta.textContent = `${results.length} page${results.length !== 1 ? "s" : ""}`;

    const terms = results.length > 0 ? results[0].terms : [];
    const fragment = document.createDocumentFragment();

    results.forEach((result) => {
      const block = document.createElement("div");
      block.className = "page-block search-result";
      block.dataset.plate = result.plate;
      block.dataset.book = result.book;

      const label = document.createElement("span");
      label.className = "page-label";
      const dateRange = formatCorpus(CORPUS[result.book]);
      label.textContent = dateRange
        ? `Book ${result.book} (${dateRange}) \u2014 Page ${result.plate}`
        : `Book ${result.book} \u2014 Page ${result.plate}`;

      const viewLink = document.createElement("button");
      viewLink.className = "view-original";
      viewLink.textContent = "View Original";
      viewLink.addEventListener("click", () => {
        window.openPdfModal(AGENCY_KEY, result.book, result.plate);
      });

      const labelRow = document.createElement("div");
      labelRow.className = "page-label-row";
      labelRow.appendChild(label);
      labelRow.appendChild(viewLink);

      const text = document.createElement("div");
      text.className = "page-text";
      text.appendChild(highlightText(result.ocrblock_txt, terms));

      block.appendChild(labelRow);
      block.appendChild(text);
      fragment.appendChild(block);
    });

    content.appendChild(fragment);
    window.scrollTo({ top: 0 });
  }

  // ── Scroll to page ──

  function scrollToPage(plate) {
    const el = document.getElementById(`page-${plate}`);
    if (!el) return;

    document.querySelectorAll(".page-block.highlighted").forEach((b) => {
      b.classList.remove("highlighted");
    });

    el.classList.add("highlighted");

    const toolbarHeight =
      document.querySelector(".toolbar").offsetHeight + 12;
    const top = el.getBoundingClientRect().top + window.scrollY - toolbarHeight;
    window.scrollTo({ top, behavior: "smooth" });

    setTimeout(() => {
      el.classList.remove("highlighted");
    }, 2500);
  }

  // ── Page indicator ──

  function updatePageIndicator() {
    if (currentMode === "search") {
      pageIndicator.textContent = "";
      return;
    }

    const blocks = document.querySelectorAll(".page-block");
    if (blocks.length === 0) {
      pageIndicator.textContent = "";
      return;
    }

    const toolbarBottom =
      document.querySelector(".toolbar").getBoundingClientRect().bottom;
    let currentPlate = null;

    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      if (rect.bottom > toolbarBottom) {
        currentPlate = block.dataset.plate;
        break;
      }
    }

    if (currentPlate !== null) {
      pageIndicator.textContent = `Viewing page ${currentPlate} of ${blocks.length}`;
    }
  }

  // ── Event listeners ──

  bookSelect.addEventListener("change", () => {
    searchInput.value = "";
    searchMeta.textContent = "";
    renderBook(bookSelect.value);
    window.scrollTo({ top: 0 });
  });

  function handleGo() {
    const val = pageInput.value.trim();
    if (val) {
      if (currentMode === "search") {
        renderBook(bookSelect.value);
      }
      scrollToPage(val);
    }
  }

  goBtn.addEventListener("click", handleGo);

  pageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGo();
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(searchInput.value);
    }
    if (e.key === "Escape") {
      searchInput.value = "";
      searchInput.blur();
      if (currentMode === "search") {
        renderBook(bookSelect.value);
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  let scrollTick = false;
  window.addEventListener("scroll", () => {
    if (!scrollTick) {
      requestAnimationFrame(() => {
        updatePageIndicator();

        if (window.scrollY > 400) {
          scrollTopBtn.classList.add("visible");
        } else {
          scrollTopBtn.classList.remove("visible");
        }

        scrollTick = false;
      });
      scrollTick = true;
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Initial render — check hash for #book=N
  if (books.length > 0) {
    let initialBook = books[0];
    const hash = window.location.hash;
    const bookMatch = hash.match(/book=(\d+)/);
    if (bookMatch && DATA[bookMatch[1]]) {
      initialBook = bookMatch[1];
    }
    bookSelect.value = initialBook;
    renderBook(initialBook);
  }
});
