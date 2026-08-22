(function () {
  "use strict";

  var dataEl = document.getElementById("glossary-terms-data");
  var listEl = document.getElementById("glossary-list");
  var filtersEl = document.getElementById("glossary-filters");
  var alphaEl = document.getElementById("glossary-alpha");
  var qEl = document.getElementById("glossary-q");
  var shownEl = document.getElementById("glossary-shown");
  var totalEl = document.getElementById("glossary-total");
  var controls = document.querySelector("[data-glossary-controls]");

  if (!dataEl || !listEl || !filtersEl || !alphaEl || !qEl) return;

  var terms = [];
  try {
    terms = JSON.parse(dataEl.textContent || "[]");
  } catch (e) {
    return;
  }

  var stages = ["All stages"].concat(
    Array.from(
      new Set(
        terms
          .map(function (t) {
            return t.stage;
          })
          .filter(Boolean)
      )
    ).sort()
  );

  var initial = (controls && controls.getAttribute("data-initial-stage")) || "";
  var activeStage = stages.indexOf(initial) >= 0 ? initial : "All stages";
  var query = "";

  if (totalEl) totalEl.textContent = String(terms.length);

  stages.forEach(function (s) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = s;
    b.className =
      "rounded-md border px-3 py-2 wh-meta font-medium uppercase tracking-wider transition-colors";
    b.setAttribute("aria-pressed", String(s === activeStage));
    styleFilter(b, s === activeStage);
    b.addEventListener("click", function () {
      activeStage = s;
      Array.prototype.forEach.call(filtersEl.children, function (x) {
        var on = x.textContent === s;
        x.setAttribute("aria-pressed", String(on));
        styleFilter(x, on);
      });
      render();
    });
    filtersEl.appendChild(b);
  });

  qEl.addEventListener("input", function () {
    query = (qEl.value || "").trim().toLowerCase();
    render();
  });

  function styleFilter(el, on) {
    if (on) {
      el.className =
        "rounded-md border border-dark bg-dark px-3 py-2 wh-meta font-medium uppercase tracking-wider text-white transition-colors";
    } else {
      el.className =
        "rounded-md border border-gray-200 bg-white px-3 py-2 wh-meta font-medium uppercase tracking-wider text-gray-500 transition-colors hover:border-dark hover:text-dark";
    }
  }

  function render() {
    var q = query;
    var rows = terms
      .filter(function (r) {
        return activeStage === "All stages" || r.stage === activeStage;
      })
      .filter(function (r) {
        if (!q) return true;
        return (
          (r.term || "").toLowerCase().indexOf(q) >= 0 ||
          (r.shortGloss || "").toLowerCase().indexOf(q) >= 0
        );
      })
      .slice()
      .sort(function (a, b) {
        return (a.term || "").localeCompare(b.term || "");
      });

    if (shownEl) shownEl.textContent = String(rows.length);

    var letters = {};
    rows.forEach(function (r) {
      var L = (r.term || "?").charAt(0).toUpperCase();
      if (!letters[L]) letters[L] = [];
      letters[L].push(r);
    });

    var present = Object.keys(letters).sort();
    alphaEl.innerHTML = "";
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (L) {
      var a = document.createElement("a");
      a.href = "#letter-" + L;
      a.textContent = L;
      a.className =
        "grid h-7 w-7 place-items-center rounded-md text-xs font-medium uppercase tracking-wide";
      if (present.indexOf(L) < 0) {
        a.className += " pointer-events-none text-gray-300 opacity-40";
        a.setAttribute("aria-disabled", "true");
        a.removeAttribute("href");
      } else {
        a.className += " text-gray-500 hover:bg-dark hover:text-white";
      }
      alphaEl.appendChild(a);
    });

    if (rows.length === 0) {
      listEl.innerHTML =
        '<div class="py-16 text-center text-gray-500"><b class="mb-1.5 block text-xl text-dark">No term matches that.</b>Try a shorter word, or suggest it and our engineers will write it up.</div>';
      return;
    }

    listEl.innerHTML = present
      .map(function (L) {
        var cards = letters[L]
          .map(function (r) {
            return (
              '<a class="block border-b border-gray-100 py-5 pr-4 no-underline transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500" href="/glossary/' +
              encodeURIComponent(r.slug) +
              '">' +
              '<span class="mb-1 flex flex-wrap items-baseline gap-2">' +
              '<b class="text-lg font-semibold text-dark">' +
              escapeHtml(r.term) +
              "</b>" +
              '<em class="rounded border border-gray-200 px-1.5 py-0.5 wh-meta font-medium not-italic uppercase tracking-wider text-gray-500">' +
              escapeHtml(r.stage) +
              "</em></span>" +
              '<p class="m-0 text-[15px] leading-snug text-gray-500">' +
              escapeHtml(r.shortGloss) +
              "</p></a>"
            );
          })
          .join("");

        return (
          '<section class="pt-9 scroll-mt-48" id="letter-' +
          L +
          '">' +
          '<div class="mb-0 flex items-center gap-4 border-b border-dark pb-2">' +
          '<b class="wh-heading-xl leading-none text-amber-600">' +
          L +
          "</b>" +
          '<span class="wh-meta text-gray-500">' +
          letters[L].length +
          " term" +
          (letters[L].length > 1 ? "s" : "") +
          "</span></div>" +
          '<div class="grid grid-cols-1 gap-0 sm:grid-cols-2 xl:grid-cols-3">' +
          cards +
          "</div></section>"
        );
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  render();
})();
