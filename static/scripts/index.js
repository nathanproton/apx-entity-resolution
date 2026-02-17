document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("book-content");
  const agencySelect = document.getElementById("agency-select");
  const DATA = window.__INDEX_DATA__;

  const agencies = [
    {
      key: "town_of_appomattox_council_minutes",
      label: "Town of Appomattox Council Minutes",
    },
    {
      key: "appomattox_county_bos",
      label: "Appomattox County Board of Supervisors",
    },
  ];

  // Navigate to agency page when selected
  agencySelect.addEventListener("change", () => {
    if (agencySelect.value) {
      window.location.href = agencySelect.value + ".html";
    }
  });

  function formatCorpus(corpus) {
    if (!corpus || corpus.length < 17) return "";
    const startYear = corpus.slice(0, 4);
    const endYear = corpus.slice(9, 13);
    return `${startYear}\u2013${endYear}`;
  }

  agencies.forEach((agency) => {
    const info = DATA[agency.key];
    if (!info) return;

    const section = document.createElement("div");
    section.className = "index-section";

    const heading = document.createElement("h2");
    heading.className = "index-heading";
    heading.textContent = agency.label;
    section.appendChild(heading);

    const table = document.createElement("table");
    table.className = "index-table";

    const thead = document.createElement("thead");
    thead.innerHTML =
      "<tr><th>Book</th><th>Date Range</th><th>Pages</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    const bookKeys = Object.keys(info.books).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

    bookKeys.forEach((bookNum) => {
      const book = info.books[bookNum];
      const tr = document.createElement("tr");
      tr.className = "index-row";
      tr.addEventListener("click", () => {
        window.location.href = `${agency.key}.html#book=${bookNum}`;
      });

      const tdBook = document.createElement("td");
      const link = document.createElement("a");
      link.href = `${agency.key}.html#book=${bookNum}`;
      link.className = "book-link";
      link.textContent = `Book ${bookNum}`;
      tdBook.appendChild(link);

      const tdDates = document.createElement("td");
      tdDates.textContent = formatCorpus(book.corpus);

      const tdPages = document.createElement("td");
      tdPages.className = "pages-count";
      tdPages.textContent = book.pages.toLocaleString();

      tr.appendChild(tdBook);
      tr.appendChild(tdDates);
      tr.appendChild(tdPages);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    content.appendChild(section);
  });
});
