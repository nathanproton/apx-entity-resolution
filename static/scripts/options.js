(function () {
  var FONT_KEY = "apxwiki-font-size";
  var DARK_KEY = "apxwiki-dark-mode";
  var DEFAULT_SIZE = 16;
  var MIN_SIZE = 12;
  var MAX_SIZE = 28;
  var STEP = 2;

  var fontSize = parseInt(localStorage.getItem(FONT_KEY), 10) || DEFAULT_SIZE;
  var darkMode = localStorage.getItem(DARK_KEY) === "true";

  function applyFontSize() {
    document.documentElement.style.setProperty(
      "--content-font-size",
      fontSize + "px"
    );
    var label = document.getElementById("font-size-label");
    if (label) label.textContent = fontSize + "px";
  }

  function applyDarkMode() {
    document.documentElement.classList.toggle("dark", darkMode);
    var btn = document.getElementById("dark-mode-btn");
    if (btn) btn.textContent = darkMode ? "Light Mode" : "Dark Mode";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.createElement("div");
    bar.className = "options-bar";

    bar.innerHTML =
      '<button id="font-decrease" class="options-btn" title="Decrease font size">A\u2212</button>' +
      '<span id="font-size-label" class="options-label">' +
      fontSize +
      "px</span>" +
      '<button id="font-increase" class="options-btn" title="Increase font size">A+</button>' +
      '<span class="options-sep"></span>' +
      '<button id="dark-mode-btn" class="options-btn">' +
      (darkMode ? "Light Mode" : "Dark Mode") +
      "</button>";

    document.body.appendChild(bar);

    applyFontSize();
    applyDarkMode();

    document.getElementById("font-decrease").addEventListener("click", function () {
      if (fontSize > MIN_SIZE) {
        fontSize -= STEP;
        localStorage.setItem(FONT_KEY, fontSize);
        applyFontSize();
      }
    });

    document.getElementById("font-increase").addEventListener("click", function () {
      if (fontSize < MAX_SIZE) {
        fontSize += STEP;
        localStorage.setItem(FONT_KEY, fontSize);
        applyFontSize();
      }
    });

    document.getElementById("dark-mode-btn").addEventListener("click", function () {
      darkMode = !darkMode;
      localStorage.setItem(DARK_KEY, darkMode);
      applyDarkMode();
    });
  });
})();
