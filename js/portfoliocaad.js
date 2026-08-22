(function () {
  "use strict";

  var filtersEl = document.getElementById("portfolio-filters");
  if (!filtersEl) return;

  var cards = Array.prototype.slice.call(
    document.querySelectorAll("#portfolio-grid > article"),
  );
  var resultsCountEl = document.getElementById("portfolio-results-count");
  var emptyEl = document.getElementById("portfolio-empty");
  var filterButtons = Array.prototype.slice.call(
    filtersEl.querySelectorAll("button[data-filter]"),
  );

  var activeBtnClasses = ["border-gray-900", "bg-gray-900", "text-white"];
  var inactiveBtnClasses = ["border-gray-200", "bg-white", "text-gray-600"];
  var activeCountClasses = ["text-white/75"];
  var inactiveCountClasses = ["text-gray-400", "font-medium"];

  var active = {
    city: filtersEl.getAttribute("data-initial-city") || "all",
    type: filtersEl.getAttribute("data-initial-type") || "all",
    size: filtersEl.getAttribute("data-initial-size") || "all",
    status: filtersEl.getAttribute("data-initial-status") || "all",
  };

  function normalize(value) {
    return (value || "all").toLowerCase();
  }

  function setButtonState(btn, isActive) {
    btn.classList.toggle("is-active", isActive);
    activeBtnClasses.forEach(function (cls) {
      btn.classList.toggle(cls, isActive);
    });
    inactiveBtnClasses.forEach(function (cls) {
      btn.classList.toggle(cls, !isActive);
    });

    var countEl = btn.querySelector("span");
    if (countEl) {
      activeCountClasses.forEach(function (cls) {
        countEl.classList.toggle(cls, isActive);
      });
      inactiveCountClasses.forEach(function (cls) {
        countEl.classList.toggle(cls, !isActive);
      });
    }

    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  function setActiveButton(group, value) {
    filterButtons.forEach(function (btn) {
      if (btn.getAttribute("data-filter") !== group) return;
      var btnValue = normalize(btn.getAttribute("data-value"));
      setButtonState(btn, btnValue === normalize(value));
    });
  }

  function cardMatches(card) {
    var city = normalize(card.getAttribute("data-city"));
    var type = normalize(card.getAttribute("data-type"));
    var size = normalize(card.getAttribute("data-size"));
    var status = normalize(card.getAttribute("data-status"));

    if (active.city !== "all" && city !== normalize(active.city)) return false;
    if (active.type !== "all" && type !== normalize(active.type)) return false;
    if (active.size !== "all" && size !== normalize(active.size)) return false;
    if (active.status !== "all" && status !== normalize(active.status)) return false;
    return true;
  }

  function applyFilters() {
    var visible = 0;

    cards.forEach(function (card) {
      var show = cardMatches(card);
      card.hidden = !show;
      card.style.display = show ? "" : "none";
      if (show) visible += 1;
    });

    if (resultsCountEl) {
      resultsCountEl.textContent =
        visible === 1 ? "Showing 1 project" : "Showing " + visible + " projects";
    }

    if (emptyEl) {
      emptyEl.classList.toggle("hidden", visible > 0);
    }
  }

  function initFromQuery() {
    Object.keys(active).forEach(function (group) {
      setActiveButton(group, active[group]);
    });
    applyFilters();
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.getAttribute("data-filter");
      var value = btn.getAttribute("data-value");
      if (!group || !value) return;

      active[group] = value;
      setActiveButton(group, value);
      applyFilters();
    });
  });

  initFromQuery();
})();
