(function () {
  "use strict";

  var CITY_SLUG_BY_NAME = window.WEHOUSE_CITY_SLUG_BY_NAME || {};

  var LS_USER_CITY = "wehouse_user_city";
  var LS_USER_CITY_SOURCE = "wehouse_user_city_source";

  function getUserCity() {
    try {
      return localStorage.getItem(LS_USER_CITY);
    } catch (e) {}
    return null;
  }

  function setUserCity(cityName) {
    if (!cityName) return;
    try {
      localStorage.setItem(LS_USER_CITY, cityName);
      localStorage.setItem(LS_USER_CITY_SOURCE, "manual");
    } catch (e) {}
    if (typeof window.wehouseSyncCityForms === "function") {
      window.wehouseSyncCityForms(cityName, true);
    }
    if (typeof window.wehouseUpdateCityNavLinks === "function") {
      window.wehouseUpdateCityNavLinks();
    }
  }

  function getSlugForCity(cityName) {
    return cityName ? CITY_SLUG_BY_NAME[cityName] || null : null;
  }

  function formatInrCompact(n) {
    if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
    if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function formatInr(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  var page = document.getElementById("packages-page");
  if (!page) return;

  var serverSlug = page.getAttribute("data-city-slug") || "";
  var awaitRedirect = page.getAttribute("data-await-redirect") === "true";

  if (awaitRedirect) {
    var storedSlug = getSlugForCity(getUserCity());
    if (storedSlug && storedSlug !== serverSlug) {
      window.location.replace("/packages/" + storedSlug);
      return;
    }
  } else {
    var serverCityName = page.getAttribute("data-city-name");
    if (serverCityName) setUserCity(serverCityName);
  }

  /* ── City dialog ── */
  var dialog = document.getElementById("packages-city-dialog");
  var changeBtn = document.getElementById("packages-change-city");
  var closeBtn = document.getElementById("packages-city-dialog-close");

  if (changeBtn && dialog) {
    changeBtn.addEventListener("click", function () {
      if (typeof dialog.showModal === "function") dialog.showModal();
    });
  }

  if (closeBtn && dialog) {
    closeBtn.addEventListener("click", function () {
      dialog.close();
    });
  }

  document.querySelectorAll(".packages-city-option").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var slug = btn.getAttribute("data-city-slug");
      var name = btn.getAttribute("data-city-name");
      if (!slug) return;
      setUserCity(name);
      window.location.href = "/packages/" + slug;
    });
  });

  /* ── Instant Cost Estimator ── */
  var packages = [];
  try {
    packages = JSON.parse(page.getAttribute("data-estimator") || "[]");
  } catch (e) {
    packages = [];
  }

  var calcPkg = "standard-pro";
  var sftInput = document.getElementById("pkg-est-sft");
  var buaRange = document.getElementById("pkg-est-bua");
  var buaLabel = document.getElementById("pkg-est-bua-label");
  var citySelectEst = document.getElementById("pkg-est-city");
  var totalEl = document.getElementById("pkg-est-total");
  var subEl = document.getElementById("pkg-est-sub");
  var pkgEl = document.getElementById("pkg-est-pkg");
  var rateEl = document.getElementById("pkg-est-rate");
  var stiltEl = document.getElementById("pkg-est-stilt");

  function findPkg(slug) {
    for (var i = 0; i < packages.length; i++) {
      if (packages[i].slug === slug) return packages[i];
    }
    return packages[2] || packages[0] || null;
  }

  function parseSft(value) {
    var n = parseInt(String(value).replace(/,/g, ""), 10);
    return isNaN(n) ? null : n;
  }

  function clampSft(n) {
    return Math.min(6000, Math.max(500, n));
  }

  function applySftDisplay(sft, writeInput) {
    if (writeInput && sftInput) sftInput.value = String(sft);
    if (buaRange) buaRange.value = String(sft);
    if (buaLabel) buaLabel.textContent = sft.toLocaleString("en-IN") + " sq.ft.";
  }

  function calcUpdate(writeBack) {
    if (!totalEl || !packages.length) return;
    var pkg = findPkg(calcPkg);
    if (!pkg) return;
    var parsed = sftInput ? parseSft(sftInput.value) : 1500;
    var sft = clampSft(parsed == null ? 1500 : parsed);
    applySftDisplay(sft, !!writeBack);
    var total = Math.round(sft * pkg.price);
    var cityName = page.getAttribute("data-city-name") || "Hyderabad";
    if (citySelectEst) {
      var opt = citySelectEst.options[citySelectEst.selectedIndex];
      if (opt) cityName = opt.textContent || cityName;
    }

    totalEl.textContent = formatInrCompact(total);
    if (pkgEl) pkgEl.textContent = pkg.name;
    if (subEl) {
      subEl.textContent =
        sft.toLocaleString("en-IN") +
        " sq.ft. built-up · " +
        formatInr(pkg.price) +
        "/sft · " +
        cityName;
    }
    if (rateEl) rateEl.textContent = formatInr(pkg.price);
    if (stiltEl) stiltEl.textContent = formatInr(pkg.stilt);
  }

  function setEstimatorTabState(btn, on) {
    ["border-amber-500", "bg-amber-50", "ring-1", "ring-amber-500"].forEach(function (c) {
      btn.classList.toggle(c, on);
    });
    ["border-gray-200", "bg-white"].forEach(function (c) {
      btn.classList.toggle(c, !on);
    });
    var price = btn.querySelectorAll("span")[1];
    if (price) {
      price.classList.toggle("text-amber-700", on);
      price.classList.toggle("text-gray-500", !on);
    }
  }

  document.querySelectorAll("[data-estimator-pkg]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      calcPkg = btn.getAttribute("data-estimator-pkg") || calcPkg;
      document.querySelectorAll("[data-estimator-pkg]").forEach(function (el) {
        var on = el === btn;
        setEstimatorTabState(el, on);
        el.setAttribute("aria-selected", on ? "true" : "false");
      });
      calcUpdate(false);
    });
  });

  if (sftInput) {
    sftInput.addEventListener("input", function () {
      calcUpdate(false);
    });
    sftInput.addEventListener("blur", function () {
      calcUpdate(true);
    });
    sftInput.addEventListener("change", function () {
      calcUpdate(true);
    });
  }
  if (buaRange) {
    buaRange.addEventListener("input", function () {
      if (sftInput) sftInput.value = buaRange.value;
      calcUpdate(true);
    });
  }
  function goToCityPackages(selectEl) {
    if (!selectEl) return;
    var slug = selectEl.value;
    var name = selectEl.options[selectEl.selectedIndex]
      ? selectEl.options[selectEl.selectedIndex].textContent
      : "";
    if (slug && slug !== serverSlug) {
      setUserCity(name);
      window.location.href = "/packages/" + slug;
    }
  }

  if (citySelectEst) {
    citySelectEst.addEventListener("change", function () {
      goToCityPackages(citySelectEst);
    });
  }

  var citySelectExplorer = document.getElementById("pkg-explorer-city");
  if (citySelectExplorer) {
    citySelectExplorer.addEventListener("change", function () {
      goToCityPackages(citySelectExplorer);
    });
  }

  calcUpdate();

  function setExplorerNavState(btn, on) {
    ["border-amber-500", "bg-amber-50", "shadow-lg", "shadow-amber-500/12"].forEach(function (c) {
      btn.classList.toggle(c, on);
    });
    ["border-gray-200", "bg-white"].forEach(function (c) {
      btn.classList.toggle(c, !on);
    });
    var spans = btn.querySelectorAll("span");
    var price = spans[1];
    if (price) {
      price.classList.toggle("text-amber-700", on);
      price.classList.toggle("text-amber-500", !on);
    }
  }

  function setExplorerPanelState(panel, on) {
    panel.classList.toggle("hidden", !on);
    panel.classList.toggle("block", on);
  }

  /* ── Package Explorer ── */
  document.querySelectorAll("[data-explorer-tier]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var slug = btn.getAttribute("data-explorer-tier");
      if (!slug) return;
      document.querySelectorAll("[data-explorer-tier]").forEach(function (el) {
        var on = el === btn;
        setExplorerNavState(el, on);
        el.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll("[data-explorer-panel]").forEach(function (panel) {
        var on = panel.getAttribute("data-explorer-panel") === slug;
        setExplorerPanelState(panel, on);
      });
    });
  });

  /* ── Lead form ── */
  var citySelect = document.getElementById("pkg-city");
  if (citySelect) {
    citySelect.addEventListener("change", function () {
      var slug = getSlugForCity(citySelect.value);
      if (slug && slug !== serverSlug) {
        setUserCity(citySelect.value);
      }
    });
  }

  var form = document.getElementById("packages-lead-form-el");
  if (form) {
    var errorEl = form.querySelector(".packages-lead-error");
    var totalSteps = parseInt(form.getAttribute("data-total-steps") || "3", 10);
    var currentStep = 1;
    var stepLabel = form.querySelector("[data-pkg-step-label]");
    var stepDots = form.querySelectorAll("[data-pkg-step-dot]");
    var backBtn = form.querySelector("[data-pkg-back]");
    var nextBtn = form.querySelector("[data-pkg-next]");
    var submitBtn = form.querySelector("[data-pkg-submit]");
    var otpHint = form.querySelector("[data-pkg-otp-hint]");

    var otp = typeof window.wehouseAttachFormOtp === "function"
      ? window.wehouseAttachFormOtp(form, {
          phoneSelector: "[name=phone]",
          errorSelector: ".packages-lead-error",
          onChange: function (ok) {
            if (submitBtn && currentStep === totalSteps) {
              submitBtn.disabled = !ok;
              submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
            }
            if (otpHint) otpHint.classList.toggle("hidden", ok);
          },
        })
      : null;

    function clearStepErrors(step) {
      form.querySelectorAll('[data-pkg-step="' + step + '"] [data-pkg-field]').forEach(function (field) {
        field.classList.remove("border-red-400", "ring-1", "ring-red-300");
      });
    }

    function validateStep(step) {
      clearStepErrors(step);
      var fields = form.querySelectorAll(
        '[data-pkg-step="' + step + '"] [data-pkg-field][data-pkg-required]',
      );
      var hasError = false;

      fields.forEach(function (field) {
        var value = (field.value || "").toString().trim();
        if (!value) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
          return;
        }
        if (
          (field.getAttribute("type") === "email" || field.name === "email") &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
        }
      });

      if (hasError && errorEl) {
        errorEl.textContent = "Please complete the required fields.";
        errorEl.classList.remove("hidden");
      } else if (errorEl) {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      }

      return !hasError;
    }

    function showStep(step) {
      currentStep = step;
      form.querySelectorAll("[data-pkg-step]").forEach(function (panel) {
        var n = parseInt(panel.getAttribute("data-pkg-step"), 10);
        panel.classList.toggle("hidden", n !== step);
      });

      var activePanel = form.querySelector('[data-pkg-step="' + step + '"]');
      var title = activePanel
        ? activePanel.getAttribute("data-pkg-step-title") || ""
        : "";
      if (stepLabel) {
        stepLabel.textContent =
          "Step " + step + " of " + totalSteps + (title ? " — " + title : "");
      }

      stepDots.forEach(function (dot) {
        var n = parseInt(dot.getAttribute("data-pkg-step-dot"), 10);
        var reached = n <= step;
        var current = n === step;
        dot.classList.toggle("bg-amber-500", reached && !current);
        dot.classList.toggle("bg-amber-600", current);
        dot.classList.toggle("scale-125", current);
        dot.classList.toggle("bg-gray-200", !reached);
      });

      if (backBtn) backBtn.classList.toggle("hidden", step === 1);
      if (nextBtn) nextBtn.classList.toggle("hidden", step === totalSteps);
      if (submitBtn) {
        submitBtn.classList.toggle("hidden", step !== totalSteps);
        if (step === totalSteps) {
          var ok = otp ? otp.isVerified() : false;
          submitBtn.disabled = !ok;
          submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
        }
      }
      if (otp && otp.refreshHint) otp.refreshHint();
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (currentStep > 1) showStep(currentStep - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (validateStep(currentStep) && currentStep < totalSteps) {
          showStep(currentStep + 1);
        }
      });
    }

    showStep(1);

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (currentStep < totalSteps) {
        if (validateStep(currentStep)) showStep(currentStep + 1);
        return;
      }

      if (!validateStep(1)) {
        showStep(1);
        return;
      }
      if (!validateStep(2)) {
        showStep(2);
        return;
      }

      var name = ((form.querySelector("[name=name]") || {}).value || "").trim();
      var phone = ((form.querySelector("[name=phone]") || {}).value || "").trim();
      var email = ((form.querySelector("[name=email]") || {}).value || "").trim();
      var city = ((form.querySelector("[name=city]") || {}).value || "").trim();
      var sft = ((form.querySelector("[name=approx_sft]") || {}).value || "").trim();
      var timeline = ((form.querySelector("[name=start_timeline]") || {}).value || "").trim();
      var requirements = ((form.querySelector("[name=requirements]") || {}).value || "").trim();
      var source = ((form.querySelector("[name=source]") || {}).value || "Packages page").trim();

      if (errorEl) errorEl.classList.add("hidden");

      if (!name || !phone || !email || !city) {
        if (errorEl) {
          errorEl.textContent = "Please fill in name, phone, email, and city.";
          errorEl.classList.remove("hidden");
        }
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errorEl) {
          errorEl.textContent = "Please enter a valid email address.";
          errorEl.classList.remove("hidden");
        }
        return;
      }
      if (!otp || !otp.isVerified()) {
        if (errorEl) {
          errorEl.textContent = "Please verify your mobile number with OTP.";
          errorEl.classList.remove("hidden");
        }
        return;
      }

      var messageParts = ["Package enquiry from packages page."];
      if (sft) messageParts.push("Approx SFT: " + sft);
      if (timeline) messageParts.push("Start timeline: " + timeline);
      if (requirements) messageParts.push("Requirements: " + requirements);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting…";
      }

      var payload = {
        name: name,
        phone: phone,
        email: email,
        city: city,
        plot_size: sft,
        timeframe: timeline,
        message: messageParts.join(" "),
        source: source,
        phone_verified_token: otp.getToken(),
      };

      if (typeof window.wehouseMergeUtmIntoPayload === "function") {
        window.wehouseMergeUtmIntoPayload(payload);
      }

      fetch(form.getAttribute("data-privyr-api") || "/api/privyr-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().catch(function () {
            return {};
          });
        })
        .then(function (data) {
          if (data.success) {
            var thankYou = form.getAttribute("data-thank-you-url") || "/thank-you";
            window.location.href = thankYou;
            return;
          }
          if (errorEl) {
            errorEl.textContent = data.error || "Something went wrong. Please try again.";
            errorEl.classList.remove("hidden");
          }
        })
        .catch(function () {
          if (errorEl) {
            errorEl.textContent = "Network error. Please try again.";
            errorEl.classList.remove("hidden");
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.textContent = "Get Formal Quote →";
            var ok = otp ? otp.isVerified() : false;
            submitBtn.disabled = !ok;
            submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
          }
        });
    });
  }
})();
