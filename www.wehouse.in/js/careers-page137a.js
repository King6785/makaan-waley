(function () {
  "use strict";

  var cityFilter = "all";
  var functionFilter = "all";
  var cards = document.querySelectorAll("#careers-roles-grid .careers-role-card");

  function applyFilters() {
    cards.forEach(function (card) {
      var city = card.getAttribute("data-city") || "";
      var fn = card.getAttribute("data-function") || "";
      var cityMatch = cityFilter === "all" || city === cityFilter;
      var fnMatch = functionFilter === "all" || fn === functionFilter;
      card.style.display = cityMatch && fnMatch ? "" : "none";
    });
  }

  if (cards.length) {
    document.querySelectorAll("[data-careers-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.getAttribute("data-careers-filter");
        var value = btn.getAttribute("data-value");
        var group =
          type === "city" ? "#careers-city-filters" : "#careers-function-filters";
        document.querySelectorAll(group + " .careers-filter-btn").forEach(function (b) {
          b.classList.remove(
            "is-active",
            "border-amber-500",
            "bg-amber-50",
            "text-amber-700",
          );
          b.classList.add("border-gray-200", "text-gray-600");
        });
        btn.classList.add(
          "is-active",
          "border-amber-500",
          "bg-amber-50",
          "text-amber-700",
        );
        btn.classList.remove("border-gray-200", "text-gray-600");
        if (type === "city") cityFilter = value;
        else functionFilter = value;
        applyFilters();
      });
    });
  }

  var form = document.getElementById("careers-partner-form");
  if (!form) return;

  var errorEl = form.querySelector(".careers-form-error");
  var totalSteps = parseInt(form.getAttribute("data-total-steps") || "3", 10);
  var currentStep = 1;
  var stepLabel = form.querySelector("[data-careers-step-label]");
  var stepDots = form.querySelectorAll("[data-careers-step-dot]");
  var backBtn = form.querySelector("[data-careers-back]");
  var nextBtn = form.querySelector("[data-careers-next]");
  var submitBtn = form.querySelector("[data-careers-submit]");
  var otpHint = form.querySelector("[data-careers-otp-hint]");

  var otp =
    typeof window.wehouseAttachFormOtp === "function"
      ? window.wehouseAttachFormOtp(form, {
          phoneSelector: "[name=mobile]",
          errorSelector: ".careers-form-error",
          onChange: function (ok) {
            if (otpHint) otpHint.classList.toggle("hidden", ok);
          },
        })
      : null;

  function clearStepErrors(step) {
    form
      .querySelectorAll('[data-careers-step="' + step + '"] [data-careers-field]')
      .forEach(function (field) {
        field.classList.remove("border-red-400", "ring-1", "ring-red-300");
      });
  }

  function validateStep(step) {
    clearStepErrors(step);
    var fields = form.querySelectorAll(
      '[data-careers-step="' + step + '"] [data-careers-field][data-careers-required]',
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

    if (hasError) {
      if (errorEl) {
        errorEl.textContent = "Please complete the required fields.";
        errorEl.classList.remove("hidden");
      }
      return false;
    }

    if (step === 2 && (!otp || !otp.isVerified())) {
      if (errorEl) {
        errorEl.textContent =
          "Please verify your mobile number with OTP before continuing.";
        errorEl.classList.remove("hidden");
      }
      return false;
    }

    if (errorEl) {
      errorEl.classList.add("hidden");
      errorEl.textContent = "";
    }
    return true;
  }

  function showStep(step) {
    currentStep = step;
    form.querySelectorAll("[data-careers-step]").forEach(function (panel) {
      var n = parseInt(panel.getAttribute("data-careers-step"), 10);
      panel.classList.toggle("hidden", n !== step);
    });

    var activePanel = form.querySelector('[data-careers-step="' + step + '"]');
    var title = activePanel
      ? activePanel.getAttribute("data-careers-step-title") || ""
      : "";
    if (stepLabel) {
      stepLabel.textContent =
        "Step " + step + " of " + totalSteps + (title ? " — " + title : "");
    }

    stepDots.forEach(function (dot) {
      var n = parseInt(dot.getAttribute("data-careers-step-dot"), 10);
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
        submitBtn.disabled = false;
        submitBtn.setAttribute("aria-disabled", "false");
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
    if (!validateStep(3)) {
      showStep(3);
      return;
    }

    var workType = ((form.querySelector("[name=workType]") || {}).value || "").trim();
    var companyName = (
      (form.querySelector("[name=companyName]") || {}).value || ""
    ).trim();
    var phone = ((form.querySelector("[name=mobile]") || {}).value || "").trim();
    var email = ((form.querySelector("[name=email]") || {}).value || "").trim();
    var message = ((form.querySelector("[name=message]") || {}).value || "").trim();

    if (errorEl) errorEl.classList.add("hidden");

    if (!workType || !companyName || !phone || !email || !message) {
      if (errorEl) {
        errorEl.textContent = "Please complete all fields.";
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
      showStep(2);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
    }

    var payload = {
      name: companyName,
      email: email,
      phone: phone,
      phone_verified_token: otp.getToken(),
      source: "Careers partner application",
      lead_tag: "VENDOR",
      message:
        "Partner / vendor application\nType of work: " +
        workType +
        "\nCompany: " +
        companyName +
        "\n" +
        message,
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
          window.location.href =
            form.getAttribute("data-thank-you-url") || "/thank-you";
          return;
        }
        if (errorEl) {
          errorEl.textContent =
            data.error || "Something went wrong. Please try again.";
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
          submitBtn.textContent = "Submit application";
          submitBtn.disabled = false;
          submitBtn.setAttribute("aria-disabled", "false");
        }
      });
  });
})();
