/**
 * PDF modal viewer.
 *
 * Exposes window.openPdfModal(agencyKey, book, plate) which opens
 * a full-screen modal with the PDF scrolled to the given page.
 *
 * PDF path convention:
 *   collections/{agencyKey}/search-pdf/{book}.pdf#page={plate}
 */
(function () {
  let overlay = null;
  let iframe = null;
  let closeBtn = null;
  let headerLabel = null;

  function createModal() {
    overlay = document.createElement("div");
    overlay.className = "pdf-modal-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    const modal = document.createElement("div");
    modal.className = "pdf-modal";

    const header = document.createElement("div");
    header.className = "pdf-modal-header";

    headerLabel = document.createElement("span");
    headerLabel.className = "pdf-modal-title";

    closeBtn = document.createElement("button");
    closeBtn.className = "pdf-modal-close";
    closeBtn.textContent = "\u00d7";
    closeBtn.title = "Close";
    closeBtn.addEventListener("click", closeModal);

    header.appendChild(headerLabel);
    header.appendChild(closeBtn);

    iframe = document.createElement("iframe");
    iframe.className = "pdf-modal-iframe";

    modal.appendChild(header);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function openModal(agencyKey, book, plate) {
    if (!overlay) createModal();

    const pdfUrl = `collections/${agencyKey}/search-pdf/${book}.pdf#page=${plate}`;
    iframe.src = pdfUrl;
    headerLabel.textContent = `Book ${book} \u2014 Page ${plate}`;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("open");
    iframe.src = "about:blank";
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay && overlay.classList.contains("open")) {
      closeModal();
    }
  });

  window.openPdfModal = openModal;
})();
