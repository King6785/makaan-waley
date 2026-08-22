(function () {
  "use strict";

  var gallery = document.querySelector("[data-project-gallery]");
  var lightbox = document.querySelector("[data-project-gallery-lightbox]");
  if (!gallery || !lightbox) return;

  var hero = gallery.querySelector("[data-project-gallery-hero]");
  var openBtn = gallery.querySelector("[data-project-gallery-open]");
  var thumbs = Array.prototype.slice.call(
    document.querySelectorAll("[data-project-gallery-thumb]"),
  );
  var imageEl = lightbox.querySelector("[data-lightbox-image]");
  var counterEl = lightbox.querySelector("[data-lightbox-counter]");
  var closeBtn = lightbox.querySelector("[data-lightbox-close]");
  var prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  var nextBtn = lightbox.querySelector("[data-lightbox-next]");
  var backdrop = lightbox.querySelector("[data-lightbox-backdrop]");

  var sources = thumbs.length
    ? thumbs.map(function (thumb) {
        return thumb.getAttribute("data-src");
      }).filter(Boolean)
    : hero && hero.getAttribute("src")
      ? [hero.getAttribute("src")]
      : [];

  if (!hero || !imageEl || !sources.length) return;

  var index = 0;
  var lastFocus = null;
  var touchStartX = 0;
  var isOpen = false;

  function currentHeroSrc() {
    return hero.getAttribute("src") || "";
  }

  function indexOfSrc(src) {
    var i = sources.indexOf(src);
    return i >= 0 ? i : 0;
  }

  function setThumbState(activeThumb) {
    thumbs.forEach(function (thumb) {
      var active = thumb === activeThumb;
      thumb.setAttribute("aria-pressed", active ? "true" : "false");
      thumb.classList.toggle("border-amber-500", active);
      thumb.classList.toggle("border-transparent", !active);
      thumb.classList.toggle("hover:border-amber-300", !active);
    });
  }

  function selectImage(src) {
    if (!src) return;
    hero.src = src;
    index = indexOfSrc(src);
    var match = thumbs.find(function (thumb) {
      return thumb.getAttribute("data-src") === src;
    });
    if (match) setThumbState(match);
  }

  function showLightboxImage() {
    var src = sources[index];
    imageEl.src = src;
    imageEl.alt = hero.getAttribute("alt") || "Project photo";
    if (counterEl) {
      var many = sources.length > 1;
      counterEl.textContent = many ? index + 1 + " / " + sources.length : "";
      counterEl.classList.toggle("hidden", !many);
    }
    var showNav = sources.length > 1;
    [prevBtn, nextBtn].forEach(function (btn) {
      if (!btn) return;
      btn.classList.toggle("hidden", !showNav);
      btn.classList.toggle("inline-flex", showNav);
    });
  }

  function focusables() {
    return [closeBtn, prevBtn, nextBtn].filter(function (btn) {
      return btn && !btn.classList.contains("hidden");
    });
  }

  function openLightbox(atSrc) {
    if (atSrc) selectImage(atSrc);
    else index = indexOfSrc(currentHeroSrc());
    showLightboxImage();
    lastFocus = document.activeElement;
    isOpen = true;
    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!isOpen) return;
    isOpen = false;
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function step(delta) {
    if (sources.length < 2) return;
    index = (index + delta + sources.length) % sources.length;
    selectImage(sources[index]);
    showLightboxImage();
  }

  if (openBtn) {
    openBtn.addEventListener("click", function () {
      openLightbox(currentHeroSrc());
    });
  }

  thumbs.forEach(function (thumb) {
    thumb.addEventListener("click", function () {
      var src = thumb.getAttribute("data-src");
      if (!src) return;
      openLightbox(src);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (backdrop) backdrop.addEventListener("click", closeLightbox);
  if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

  document.addEventListener("keydown", function (event) {
    if (!isOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
      return;
    }
    if (event.key !== "Tab") return;
    var nodes = focusables();
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  lightbox.addEventListener("touchstart", function (event) {
    if (!event.changedTouches || !event.changedTouches.length) return;
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener("touchend", function (event) {
    if (!isOpen || sources.length < 2) return;
    if (!event.changedTouches || !event.changedTouches.length) return;
    var dx = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) < 50) return;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
