(function () {
  "use strict";

  const LS_ANY_FORM_SUBMITTED = "wehouse_any_form_submitted";
  const LS_USER_CITY = "wehouse_user_city";
  const LS_USER_CITY_SOURCE = "wehouse_user_city_source";
  const LEAD_POPUP_DEFAULT_TITLE = "Get Your Free Construction Plan";
  const LEAD_POPUP_DEFAULT_LEDE =
    "Share your details and our team will reach out within 24 hours with a personalised plan.";
  const SS_CITY_DETECT_ATTEMPTED = "wehouse_city_detect_attempted";
  const CITY_SLUG_BY_NAME = window.WEHOUSE_CITY_SLUG_BY_NAME || {};
  function markAnyFormSubmitted() {
    try {
      localStorage.setItem(LS_ANY_FORM_SUBMITTED, "1");
    } catch (e) {}
  }

  // Mobile nav toggle
  const navToggle = document.getElementById("nav-toggle");
  const navMobile = document.getElementById("nav-mobile");
  const navIconOpen = document.getElementById("nav-icon-open");
  const navIconClose = document.getElementById("nav-icon-close");

  function setMobileNavOpen(open) {
    if (!navToggle || !navMobile) return;
    navMobile.classList.toggle("hidden", !open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (navIconOpen && navIconClose) {
      navIconOpen.classList.toggle("hidden", open);
      navIconClose.classList.toggle("hidden", !open);
    }
    document.body.classList.toggle("nav-mobile-open", open);
  }

  function closeDesktopNavDropdowns() {
    document.querySelectorAll("[data-nav-dropdown][data-open]").forEach(function (group) {
      group.removeAttribute("data-open");
      var trigger = group.querySelector("[aria-haspopup]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var open = navMobile.classList.contains("hidden");
      if (open) closeNavCityMenu();
      setMobileNavOpen(open);
    });

    navMobile.addEventListener("click", function (e) {
      var link = e.target.closest("a, [data-lead-popup-trigger]");
      if (link) setMobileNavOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMobileNavOpen(false);
    });

    var desktopNavMq = window.matchMedia("(min-width: 1024px)");
    desktopNavMq.addEventListener("change", function (e) {
      if (e.matches) setMobileNavOpen(false);
      placeNavCityWrap();
    });
  }

  document.querySelectorAll("[data-nav-dropdown]").forEach(function (group) {
    var trigger = group.querySelector("[aria-haspopup]");
    if (!trigger) return;
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !group.hasAttribute("data-open");
      closeDesktopNavDropdowns();
      closeNavCityMenu();
      if (willOpen) {
        group.setAttribute("data-open", "");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", closeDesktopNavDropdowns);

  // Sticky header: light bar on scroll (readable on dark sections); light text only over dark-top heroes at rest
  const header = document.getElementById("site-header");
  const navLinks = header
    ? header.querySelectorAll(
        "#nav-desktop > a, #nav-desktop > .group > a, #nav-desktop > .group > button",
      )
    : [];
  const navToggleBtn = document.getElementById("nav-toggle");
  const navCityTrigger = document.getElementById("nav-city-trigger");
  const headerLogo = document.getElementById("header-logo");
  const headerLogoWhite = document.getElementById("header-logo-white");
  const hasDarkTopHero = !!document.querySelector(".wh-dark-top-hero");
  if (header) {
    function applyHeaderTextTheme(useLightText) {
      navLinks.forEach(function (link) {
        link.classList.toggle("text-dark", !useLightText);
        link.classList.toggle("text-white/80", useLightText);
      });

      if (navToggleBtn) {
        navToggleBtn.classList.toggle("text-dark", !useLightText);
        navToggleBtn.classList.toggle("text-white", useLightText);
      }

      if (navCityTrigger && window.matchMedia("(min-width: 1024px)").matches) {
        navCityTrigger.classList.toggle("text-dark", !useLightText);
        navCityTrigger.classList.toggle("text-white/80", useLightText);
      }

      if (headerLogo) {
        headerLogo.classList.toggle("opacity-0", useLightText);
      }
      if (headerLogoWhite) {
        headerLogoWhite.classList.toggle("opacity-0", !useLightText);
      }
    }

    function updateHeaderOnScroll() {
      const scrolled = window.scrollY > 10;
      if (scrolled) {
        header.classList.add("header-scrolled");
        header.classList.remove("bg-transparent", "bg-dark/90");
        applyHeaderTextTheme(false);
      } else {
        header.classList.remove("header-scrolled", "bg-dark/90");
        header.classList.add("bg-transparent");
        applyHeaderTextTheme(hasDarkTopHero);
      }
    }
    window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
    updateHeaderOnScroll();
  }

  function getUserCitySource() {
    try {
      return localStorage.getItem(LS_USER_CITY_SOURCE);
    } catch (e) {}
    return null;
  }

  function applySelectedCityLabels(cityName) {
    document.querySelectorAll("[data-selected-city-name]").forEach(function (el) {
      var fallback = el.getAttribute("data-selected-city-fallback") || "";
      el.textContent = cityName || fallback;
    });
    applySelectedCityPrices(cityName);
  }

  function applySelectedCityPrices(cityName) {
    document.querySelectorAll("[data-city-starting-package]").forEach(function (root) {
      var map = {};
      try {
        map = JSON.parse(root.getAttribute("data-city-starting-package-map") || "{}");
      } catch (e) {}
      var entry = cityName ? map[cityName] : null;
      var amountEl = root.querySelector("[data-selected-city-price]");
      var nameEl = root.querySelector("[data-selected-city-package-name]");
      if (amountEl) {
        var fallback = amountEl.getAttribute("data-selected-city-price-fallback") || amountEl.textContent || "";
        amountEl.textContent = (entry && entry.amount) || fallback;
      }
      if (nameEl) {
        var nameFallback = nameEl.getAttribute("data-selected-city-package-name-fallback") || nameEl.textContent || "";
        nameEl.textContent = (entry && entry.packageName) || nameFallback;
      }
    });
  }

  function updateNavCityUi(cityName) {
    var label = document.getElementById("nav-city-label");
    var select = document.getElementById("nav-city");
    if (label) label.textContent = cityName || "City";
    if (select) select.value = cityName || "";
    document.querySelectorAll("[data-nav-city-value]").forEach(function (btn) {
      var value = btn.getAttribute("data-nav-city-value") || "";
      var active = cityName ? value === cityName : !value;
      btn.classList.toggle("is-active", active);
    });
  }

  function closeNavCityMenu() {
    var menu = document.getElementById("nav-city-menu");
    var trigger = document.getElementById("nav-city-trigger");
    if (menu) menu.classList.add("hidden");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  function placeNavCityWrap() {
    var wrap = document.getElementById("nav-city-wrap");
    var trigger = document.getElementById("nav-city-trigger");
    var menu = document.getElementById("nav-city-menu");
    var desktopHome = document.getElementById("nav-desktop-home");
    var mobileSlot = document.getElementById("nav-city-mobile-slot");
    if (!wrap || !desktopHome || !mobileSlot) return;

    var isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      if (wrap.parentElement !== desktopHome.parentElement || desktopHome.previousElementSibling !== wrap) {
        desktopHome.insertAdjacentElement("beforebegin", wrap);
      }
      wrap.classList.remove("w-full");
      wrap.classList.add("h-10");
      if (trigger) {
        trigger.classList.remove("w-full", "max-w-none", "rounded-lg", "px-3", "py-2", "hover:bg-white/5");
        trigger.classList.add("h-full", "max-w-[7.25rem]", "sm:max-w-[9rem]");
      }
      if (menu) {
        menu.classList.add("absolute", "left-0", "top-full", "mt-2", "w-44");
        menu.classList.remove("static", "mt-1", "w-full");
      }
    } else {
      if (wrap.parentElement !== mobileSlot) {
        mobileSlot.appendChild(wrap);
      }
      wrap.classList.remove("h-10");
      wrap.classList.add("w-full");
      if (trigger) {
        trigger.classList.add("w-full", "max-w-none", "rounded-lg", "px-3", "py-2", "hover:bg-white/5", "text-white/80");
        trigger.classList.remove("h-full", "max-w-[7.25rem]", "sm:max-w-[9rem]", "text-dark");
      }
      if (menu) {
        menu.classList.remove("absolute", "left-0", "top-full", "mt-2", "w-44");
        menu.classList.add("static", "mt-1", "w-full");
      }
    }
  }

  function wireNavCityPicker() {
    var trigger = document.getElementById("nav-city-trigger");
    var menu = document.getElementById("nav-city-menu");
    if (!trigger || !menu) return;

    placeNavCityWrap();
    window.addEventListener("resize", placeNavCityWrap);

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      closeDesktopNavDropdowns();
      var open = menu.classList.contains("hidden");
      if (open) menu.classList.remove("hidden");
      else menu.classList.add("hidden");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", closeNavCityMenu);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNavCityMenu();
    });

    menu.querySelectorAll("[data-nav-city-value]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var value = btn.getAttribute("data-nav-city-value") || "";
        if (!value || value === "Other") clearUserCity();
        else setUserCity(value, "manual");
        closeNavCityMenu();
        if (!window.matchMedia("(min-width: 1024px)").matches) setMobileNavOpen(false);
      });
    });
  }

  function isGlobalCitySelect(select) {
    return !!select && select.id !== "referral-city";
  }

  function syncCityToAllForms(cityName, force) {
    function setSelect(select) {
      if (!select) return;
      if (!force && select.value) return;
      if (!cityName) {
        select.value = "";
        return;
      }
      var opt = Array.prototype.find.call(select.options, function (o) {
        return o.value === cityName;
      });
      select.value = opt ? cityName : "";
    }

    ["nav-city", "lead-popup-city", "hero-city"].forEach(function (id) {
      setSelect(document.getElementById(id));
    });
    document.querySelectorAll('select[name="city"]').forEach(function (select) {
      if (!isGlobalCitySelect(select)) return;
      setSelect(select);
    });
    updateNavCityUi(cityName);
    applySelectedCityLabels(cityName);
  }

  function clearUserCity() {
    try {
      localStorage.removeItem(LS_USER_CITY);
      localStorage.removeItem(LS_USER_CITY_SOURCE);
    } catch (e) {}
    syncCityToAllForms("", true);
    updateCityNavLinks();
  }

  function setUserCity(cityName, source) {
    source = source || "manual";
    if (!cityName || cityName === "Other") {
      if (source === "manual") clearUserCity();
      return;
    }
    if (source === "auto" && getUserCitySource() === "manual") return;

    try {
      localStorage.setItem(LS_USER_CITY, cityName);
      localStorage.setItem(LS_USER_CITY_SOURCE, source);
    } catch (e) {}
    syncCityToAllForms(cityName, true);
    updateCityNavLinks();
    maybeRedirectPackagesForCity(cityName);
  }

  function maybeRedirectPackagesForCity(cityName) {
    var slug = getCitySlug(cityName);
    var path = window.location.pathname;
    if (!slug) return;
    if (path === "/packages" || /^\/packages\/[^/]+$/.test(path)) {
      var target = "/packages/" + slug;
      if (path !== target) window.location.href = target;
    }
  }

  function saveUserCity(cityName) {
    setUserCity(cityName, "manual");
  }

  function getUserCity() {
    try {
      const stored = localStorage.getItem(LS_USER_CITY);
      if (stored) return stored;
    } catch (e) {}
    return null;
  }

  function applyCityToForms(cityName) {
    syncCityToAllForms(cityName, false);
  }

  function wireCitySelectListeners() {
    var ids = ["lead-popup-city", "hero-city"];
    ids.forEach(function (id) {
      var select = document.getElementById(id);
      if (!select || select.dataset.wehouseCityWired) return;
      select.dataset.wehouseCityWired = "1";
      select.addEventListener("change", function () {
        if (!select.value || select.value === "Other") {
          clearUserCity();
          return;
        }
        setUserCity(select.value, "manual");
      });
    });
    document.querySelectorAll('select[name="city"]').forEach(function (select) {
      if (!isGlobalCitySelect(select) || select.dataset.wehouseCityWired) return;
      select.dataset.wehouseCityWired = "1";
      select.addEventListener("change", function () {
        if (!select.value || select.value === "Other") {
          clearUserCity();
          return;
        }
        setUserCity(select.value, "manual");
      });
    });
  }

  function markCityDetectComplete() {
    try {
      sessionStorage.setItem(SS_CITY_DETECT_ATTEMPTED, "1");
    } catch (e) {}
  }

  function tryDetectCityFromIp(retryCount) {
    retryCount = retryCount || 0;
    try {
      if (sessionStorage.getItem(SS_CITY_DETECT_ATTEMPTED)) return;
    } catch (e) {
      return;
    }
    fetch("/api/detect-city", { credentials: "same-origin" })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data && data.city) {
          markCityDetectComplete();
          setUserCity(data.city, "auto");
          return;
        }
        if (retryCount < 1) {
          window.setTimeout(function () {
            tryDetectCityFromIp(retryCount + 1);
          }, 2000);
          return;
        }
        markCityDetectComplete();
      })
      .catch(function () {
        if (retryCount < 1) {
          window.setTimeout(function () {
            tryDetectCityFromIp(retryCount + 1);
          }, 2000);
          return;
        }
        markCityDetectComplete();
      });
  }

  function getCitySlug(cityName) {
    return cityName ? CITY_SLUG_BY_NAME[cityName] || null : null;
  }

  function updateCityNavLinks() {
    const slug = getCitySlug(getUserCity());
    const packagesUrl = slug ? `/packages/${slug}` : "/packages";
    const calculatorUrl = slug ? `/home-construction/${slug}#estimate` : "/planner";

    ["nav-packages-link", "nav-packages-link-mobile"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.setAttribute("href", packagesUrl);
    });
    ["nav-cost-calculator-link", "nav-cost-calculator-link-mobile"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.setAttribute("href", calculatorUrl);
    });
  }

  window.wehouseUpdateCityNavLinks = updateCityNavLinks;
  window.wehouseSyncCityForms = syncCityToAllForms;

  (function initUserCityNav() {
    wireNavCityPicker();
    wireCitySelectListeners();
    var city = getUserCity();
    if (city) {
      syncCityToAllForms(city, true);
      updateCityNavLinks();
      return;
    }
    updateCityNavLinks();
    tryDetectCityFromIp();
  })();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Projects portfolio filter
  const projectFilters = document.querySelectorAll(".project-filter");
  const projectCards = document.querySelectorAll(".project-card");

  if (projectFilters.length && projectCards.length) {
    projectFilters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const category = this.getAttribute("data-category");

        // Update active state
        projectFilters.forEach(function (b) {
          b.classList.remove("active", "bg-dark", "border-dark", "text-white");
          b.classList.add("border-gray-300", "text-gray-600");
        });
        this.classList.add("active", "bg-dark", "border-dark", "text-white");
        this.classList.remove("border-gray-300", "text-gray-600");

        // Filter cards
        projectCards.forEach(function (card) {
          const cardCategory = card.getAttribute("data-category");
          const show = category === "all" || cardCategory === category;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  // Contact form is handled by lead-otp.js (OTP + /api/privyr-lead).

  // Careers accordion
  const careerToggles = document.querySelectorAll(".career-toggle");
  careerToggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      const item = this.closest(".career-item");
      const content = item?.querySelector(".career-content");
      const icon = item?.querySelector(".career-icon");
      const isExpanded = this.getAttribute("aria-expanded") === "true";

      this.setAttribute("aria-expanded", !isExpanded);
      content?.classList.toggle("hidden", isExpanded);
      icon?.classList.toggle("rotate-180", !isExpanded);
    });
  });

  // Scroll-triggered fade-in (IntersectionObserver)
  const animateElements = document.querySelectorAll(".animate-on-scroll");
  if (animateElements.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -50px 0px", threshold: 0.1 },
    );

    animateElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Lead popup (shared across pages)
  (function () {
    const overlay = document.getElementById("lead-popup-overlay");
    const backdrop = document.getElementById("lead-popup-backdrop");
    const popup = document.getElementById("lead-popup");
    const closeBtn = document.getElementById("lead-popup-close");
    const form = document.getElementById("lead-popup-form");
    const successEl = document.getElementById("lead-popup-success");
    const titleEl = document.getElementById("lead-popup-title");
    const ledeEl = document.getElementById("lead-popup-lede");
    const LS_KEY = "wehouse_lead_popup";
    const LS_DISMISS_DAYS = 1;

    if (!overlay || !popup || !form) return;

    function resetLeadPopupCopy() {
      if (titleEl) titleEl.textContent = LEAD_POPUP_DEFAULT_TITLE;
      if (ledeEl) ledeEl.textContent = LEAD_POPUP_DEFAULT_LEDE;
    }

    function applyLeadPopupCopy(triggerEl) {
      if (!triggerEl) {
        resetLeadPopupCopy();
        return;
      }
      const customTitle = triggerEl.getAttribute("data-lead-popup-title");
      const customLede = triggerEl.getAttribute("data-lead-popup-lede");
      if (titleEl) {
        titleEl.textContent = customTitle || LEAD_POPUP_DEFAULT_TITLE;
      }
      if (ledeEl) {
        ledeEl.textContent = customLede || LEAD_POPUP_DEFAULT_LEDE;
      }
    }

    function hasSubmittedAnyForm() {
      try {
        return localStorage.getItem(LS_ANY_FORM_SUBMITTED) === "1";
      } catch (e) {
        return false;
      }
    }

    function isDismissed() {
      try {
        const v = localStorage.getItem(LS_KEY);
        if (!v) return false;
        const d = JSON.parse(v);
        return (
          d &&
          d.ts &&
          Date.now() - d.ts < LS_DISMISS_DAYS * 24 * 60 * 60 * 1000
        );
      } catch (e) {
        return false;
      }
    }

    function setDismissed() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now() }));
      } catch (e) {}
    }

    var lastLeadTrigger = null;
    var leadFocusTrapHandler = null;

    function getFocusable(container) {
      if (!container) return [];
      return Array.prototype.slice.call(
        container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
    }

    function trapFocus(container) {
      releaseFocusTrap();
      leadFocusTrapHandler = function (e) {
        if (e.key !== "Tab") return;
        var nodes = getFocusable(container);
        if (!nodes.length) return;
        var first = nodes[0];
        var last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", leadFocusTrapHandler);
    }

    function releaseFocusTrap() {
      if (leadFocusTrapHandler) {
        document.removeEventListener("keydown", leadFocusTrapHandler);
        leadFocusTrapHandler = null;
      }
    }

    function openPopup(force, triggerEl) {
      if (!force && hasSubmittedAnyForm()) return;
      if (!force && isDismissed()) return;
      lastLeadTrigger = triggerEl || document.activeElement;
      applyLeadPopupCopy(triggerEl);
      form.classList.remove("hidden");
      if (successEl) successEl.classList.add("hidden");
      overlay.classList.remove("opacity-0", "pointer-events-none");
      overlay.setAttribute("aria-hidden", "false");
      popup.classList.remove("scale-95");
      document.body.style.overflow = "hidden";
      trapFocus(popup);
      var focusTarget =
        document.getElementById("lead-popup-name") ||
        document.getElementById("lead-popup-close");
      if (focusTarget) {
        setTimeout(function () {
          focusTarget.focus();
        }, 0);
      }
    }

    function closePopup() {
      overlay.classList.add("opacity-0", "pointer-events-none");
      overlay.setAttribute("aria-hidden", "true");
      popup.classList.add("scale-95");
      document.body.style.overflow = "";
      releaseFocusTrap();
      resetLeadPopupCopy();
      if (lastLeadTrigger && typeof lastLeadTrigger.focus === "function") {
        lastLeadTrigger.focus();
      }
      lastLeadTrigger = null;
    }

    document.querySelectorAll("[data-lead-popup-trigger]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openPopup(true, el);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setDismissed();
        closePopup();
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setDismissed();
        closePopup();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.classList.contains("pointer-events-none")) {
        setDismissed();
        closePopup();
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && e.clientY <= 0 && !isDismissed()) {
        openPopup(false);
      }
    });
  })();

  // Referral lead popup (shared across pages)
  (function () {
    const overlay = document.getElementById("referral-popup-overlay");
    const backdrop = document.getElementById("referral-popup-backdrop");
    const popup = document.getElementById("referral-popup");
    const closeBtn = document.getElementById("referral-popup-close");
    const form = document.getElementById("referral-popup-form");
    const errorEl = document.getElementById("referral-popup-error");
    const successEl = document.getElementById("referral-popup-success");

    if (!overlay || !popup || !form) return;

    var lastReferralTrigger = null;
    var referralFocusTrapHandler = null;

    function getReferralFocusable(container) {
      if (!container) return [];
      return Array.prototype.slice.call(
        container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
    }

    function trapReferralFocus(container) {
      if (referralFocusTrapHandler) {
        document.removeEventListener("keydown", referralFocusTrapHandler);
      }
      referralFocusTrapHandler = function (e) {
        if (e.key !== "Tab") return;
        var nodes = getReferralFocusable(container);
        if (!nodes.length) return;
        var first = nodes[0];
        var last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", referralFocusTrapHandler);
    }

    function openReferralPopup() {
      lastReferralTrigger = document.activeElement;
      overlay.classList.remove("opacity-0", "pointer-events-none");
      overlay.setAttribute("aria-hidden", "false");
      popup.classList.remove("scale-95");
      document.body.style.overflow = "hidden";
      form.classList.remove("hidden");
      if (successEl) successEl.classList.add("hidden");
      if (errorEl) errorEl.classList.add("hidden");
      if (typeof window.wehouseResetReferralPopupSteps === "function") {
        window.wehouseResetReferralPopupSteps();
      }
      trapReferralFocus(popup);
      var focusTarget =
        document.getElementById("referral-your-name") ||
        document.getElementById("referral-popup-close");
      if (focusTarget) {
        setTimeout(function () {
          focusTarget.focus();
        }, 0);
      }
    }

    function closeReferralPopup() {
      overlay.classList.add("opacity-0", "pointer-events-none");
      overlay.setAttribute("aria-hidden", "true");
      popup.classList.add("scale-95");
      if (referralFocusTrapHandler) {
        document.removeEventListener("keydown", referralFocusTrapHandler);
        referralFocusTrapHandler = null;
      }
      if (lastReferralTrigger && typeof lastReferralTrigger.focus === "function") {
        lastReferralTrigger.focus();
      }
      lastReferralTrigger = null;
      document.body.style.overflow = "";
    }

    document
      .querySelectorAll("[data-referral-popup-trigger]")
      .forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          openReferralPopup();
        });
      });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeReferralPopup();
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        closeReferralPopup();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (
        e.key === "Escape" &&
        overlay &&
        !overlay.classList.contains("pointer-events-none")
      ) {
        closeReferralPopup();
      }
    });
  })();
})();
