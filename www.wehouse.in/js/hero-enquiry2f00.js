/**
 * Hero enquiry multistep form — shared initializer.
 *
 * Works with any page that contains #hero-enquiry-form.
 * Lead source is read from the form's data-lead-source attribute.
 * OTP token is provided by lead-otp.js via window.wehouseGetHeroOtpToken().
 */
(function (global) {
  "use strict";

  function initHeroEnquiryForm() {
    var form = document.getElementById("hero-enquiry-form");
    if (!form) return;

    var TOTAL_STEPS = 3;
    var currentStep = 1;

    var stepLabel = document.getElementById("hero-step-label");
    var stepDots = document.querySelectorAll(".hero-step-dot");
    var backBtn = document.getElementById("hero-back-btn");
    var nextBtn = document.getElementById("hero-next-btn");
    var stepsWrap = document.getElementById("hero-form-steps-wrap");
    var successStep = document.getElementById("hero-form-success-step");
    var submitAnotherBtn = document.getElementById("hero-submit-another-btn");

    function clearStepErrors(step) {
      form.querySelectorAll('[data-hero-step="' + step + '"]').forEach(function (f) {
        f.classList.remove("border-red-400", "ring-1", "ring-red-300");
      });
    }

    function validateStep(step) {
      clearStepErrors(step);
      var fields = form.querySelectorAll(
        '[data-hero-step="' + step + '"][data-hero-required]'
      );
      var hasError = false;

      fields.forEach(function (field) {
        var value = (field.value || "").toString().trim();
        if (!value) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
        } else {
          field.classList.remove("border-red-400", "ring-1", "ring-red-300");
          var isEmail =
            field.getAttribute("type") === "email" ||
            (field.name || "") === "email";
          if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            field.classList.add("border-red-400", "ring-1", "ring-red-300");
            hasError = true;
          }
        }
      });
      return !hasError;
    }

    function showStep(step) {
      currentStep = step;
      form.querySelectorAll(".hero-step").forEach(function (el) {
        var n = parseInt(el.getAttribute("data-hero-step"), 10);
        if (n === step) {
          el.classList.remove("hidden");
        } else {
          el.classList.add("hidden");
        }
      });

      if (stepLabel) {
        stepLabel.textContent = "Step " + step + " of " + TOTAL_STEPS;
      }
      stepDots.forEach(function (dot) {
        var n = parseInt(dot.getAttribute("data-step-dot"), 10);
        if (n <= step) {
          dot.classList.remove("bg-gray-200");
          dot.classList.add("bg-amber-500");
        } else {
          dot.classList.add("bg-gray-200");
          dot.classList.remove("bg-amber-500");
        }
      });

      if (backBtn) {
        if (step === 1) {
          backBtn.classList.add("hidden");
          backBtn.classList.remove("inline-flex");
        } else {
          backBtn.classList.remove("hidden");
          backBtn.classList.add("inline-flex");
        }
      }
      if (nextBtn) {
        if (step === TOTAL_STEPS) {
          nextBtn.classList.add("hidden");
          nextBtn.classList.remove("inline-flex");
        } else {
          nextBtn.classList.remove("hidden");
          nextBtn.classList.add("inline-flex");
        }
      }
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (currentStep > 1) showStep(currentStep - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (validateStep(currentStep) && currentStep < TOTAL_STEPS) {
          showStep(currentStep + 1);
        }
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (currentStep < TOTAL_STEPS) {
        if (validateStep(currentStep)) showStep(currentStep + 1);
        return;
      }

      if (!validateStep(TOTAL_STEPS)) return;

      var submitBtn = document.getElementById("hero-submit-btn");
      var errorEl = document.getElementById("hero-form-error");
      var apiUrl = form.getAttribute("data-privyr-api") || "/api/privyr-lead";
      var leadSource = form.getAttribute("data-lead-source") || "Hero form";

      var payload = {
        name: (form.querySelector("[name=name]") || {}).value || "",
        email: (form.querySelector("[name=email]") || {}).value || "",
        phone: (form.querySelector("[name=phone]") || {}).value || "",
        city: (form.querySelector("[name=city]") || {}).value || "",
        plotSize: (form.querySelector("[name=plotSize]") || {}).value || "",
        timeframe: (form.querySelector("[name=timeframe]") || {}).value || "",
        source: leadSource
      };

      if (typeof global.wehouseMergeUtmIntoPayload === "function") {
        global.wehouseMergeUtmIntoPayload(payload);
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        var spanEl = submitBtn.querySelector("span");
        if (spanEl) spanEl.textContent = "Sending...";
      }
      if (errorEl) {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      }

      var phone10 =
        typeof global.wehouseNormalizePhone10 === "function"
          ? global.wehouseNormalizePhone10((payload.phone || "").toString().trim())
          : null;
      var otpTok =
        typeof global.wehouseGetHeroOtpToken === "function"
          ? global.wehouseGetHeroOtpToken()
          : null;

      if (!phone10 || !otpTok) {
        if (errorEl) {
          errorEl.textContent =
            "Please verify your mobile number with OTP (Send OTP \u2192 Verify).";
          errorEl.classList.remove("hidden");
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          var spanEl2 = submitBtn.querySelector("span");
          if (spanEl2) spanEl2.textContent = "Get My Smart Plan";
        }
        return;
      }

      payload.phone_verified_token = otpTok;

      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () { return {}; })
            .then(function (data) {
              if (!res.ok) {
                throw new Error(data.error || "Something went wrong. Please try again.");
              }
              var thankYouUrl = form.getAttribute("data-thank-you-url");
              if (thankYouUrl) {
                global.location.href = thankYouUrl;
                return;
              }
              if (stepsWrap) stepsWrap.classList.add("hidden");
              if (successStep) successStep.classList.remove("hidden");
              form.reset();
              showStep(1);
            });
        })
        .catch(function (err) {
          if (errorEl) {
            errorEl.textContent =
              err.message || "Something went wrong. Please try again.";
            errorEl.classList.remove("hidden");
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            var spanEl3 = submitBtn.querySelector("span");
            if (spanEl3) spanEl3.textContent = "Get My Smart Plan";
          }
        });
    });

    if (submitAnotherBtn && stepsWrap && successStep) {
      submitAnotherBtn.addEventListener("click", function () {
        successStep.classList.add("hidden");
        stepsWrap.classList.remove("hidden");
        form.reset();
        showStep(1);
      });
    }

    showStep(1);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroEnquiryForm);
  } else {
    initHeroEnquiryForm();
  }
})(window);
