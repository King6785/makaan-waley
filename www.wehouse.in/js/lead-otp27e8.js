(function (global) {
  "use strict";

  function otpApiUrl() {
    var plannerOtp =
      global.WEHOUSE_PLANNER_CONFIG &&
      global.WEHOUSE_PLANNER_CONFIG.otpApi;
    return (
      global.WEHOUSE_OTP_API ||
      plannerOtp ||
      "/api/msg91-otp"
    );
  }

  function isValidEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  /** E.164 digits without + (auto-resolve common India variants). */
  function normalizePhoneOtp(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (!d) return null;
    if (d.slice(0, 2) === "00") d = d.slice(2); // allow 00-prefixed international format
    if (d.length > 15) return null;

    // India local: 10-digit mobile (6-9xxxxxxxxx) -> 91xxxxxxxxxx
    if (d.length === 10) {
      var c = d.charAt(0);
      if (c >= "6" && c <= "9") return "91" + d;
      return null;
    }

    // India trunk prefix: 0xxxxxxxxxx -> 91xxxxxxxxxx
    if (d.length === 11 && d.charAt(0) === "0") {
      var c11 = d.charAt(1);
      if (c11 >= "6" && c11 <= "9") return "91" + d.slice(1);
      return null;
    }

    // India with country code already present (91 + 10-digit mobile)
    if (d.length === 12 && d.slice(0, 2) === "91") {
      var c12 = d.charAt(2);
      if (c12 >= "6" && c12 <= "9") return d;
      return null;
    }

    // Occasional 0 + 91 + 10-digit mobile -> strip trunk 0
    if (d.length === 13 && d.slice(0, 3) === "091") {
      var c13 = d.charAt(3);
      if (c13 >= "6" && c13 <= "9") return d.slice(1);
      return null;
    }

    if (d.length >= 11 && d.length <= 15 && d.charAt(0) !== "0") return d;
    return null;
  }

  function maskOtpPhoneHint(norm) {
    if (!norm) return "";
    if (norm.length >= 12 && norm.slice(0, 2) === "91") {
      var loc = norm.slice(2);
      if (loc.length === 10) {
        return "+91 " + loc.slice(0, 2) + "******" + loc.slice(-2);
      }
    }
    var keep = Math.min(4, Math.max(1, norm.length - 5));
    return "+" + norm.slice(0, keep) + "…" + norm.slice(-2);
  }

  function postOtp(body) {
    return fetch(otpApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().catch(function () {
        return {};
      }).then(function (data) {
        return { ok: r.ok, data: data };
      });
    });
  }

  var heroOtp = { token: null, phone10: null };

  function resetHeroOtpIfPhoneChanged(phoneRaw) {
    var p10 = normalizePhoneOtp(phoneRaw);
    if (!p10 || !heroOtp.phone10 || p10 !== heroOtp.phone10) {
      heroOtp.token = null;
      heroOtp.phone10 = p10 || null;
    }
  }

  function setHeroVerified(phone10, token) {
    heroOtp.phone10 = phone10;
    heroOtp.token = token;
  }

  global.wehouseNormalizePhone10 = normalizePhoneOtp;
  global.wehouseIsValidEmail = isValidEmail;
  global.wehouseGetHeroOtpToken = function () {
    return heroOtp.token;
  };

  /**
   * Attach MSG91 OTP UI to a form that already contains a [data-lead-otp-block]
   * (or elements matched via options) and a phone input.
   * Returns { getToken, isVerified, refreshHint }.
   */
  global.wehouseAttachFormOtp = function (form, options) {
    options = options || {};
    if (!form || typeof bindOtpControls !== "function") return null;

    var phoneEl =
      (options.phoneSelector && form.querySelector(options.phoneSelector)) ||
      form.querySelector("[name=phone]") ||
      form.querySelector("[name=mobile]");
    var block = form.querySelector("[data-lead-otp-block]");
    var sendBtn =
      (block && block.querySelector("[data-otp-send]")) ||
      form.querySelector(options.sendSelector || "[data-otp-send]");
    var verifyBtn =
      (block && block.querySelector("[data-otp-verify]")) ||
      form.querySelector(options.verifySelector || "[data-otp-verify]");
    var otpInput =
      (block && block.querySelector("[data-otp-input]")) ||
      form.querySelector(options.otpSelector || "[data-otp-input]");
    var otpFields =
      (block && block.querySelector("[data-otp-fields]")) ||
      form.querySelector(options.fieldsSelector || "[data-otp-fields]");
    var statusEl =
      (block && block.querySelector("[data-otp-status]")) ||
      form.querySelector(options.statusSelector || "[data-otp-status]");
    var hintEl =
      (block && block.querySelector("[data-otp-phone-hint]")) ||
      form.querySelector(options.hintSelector || "[data-otp-phone-hint]");
    var errEl =
      (options.errorSelector && form.querySelector(options.errorSelector)) ||
      form.querySelector("[data-otp-error]") ||
      null;

    var phoneVerified = { token: null, phone10: null };

    function refreshHint() {
      if (!hintEl) return;
      var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
      if (p10) {
        hintEl.textContent =
          "Code to " + maskOtpPhoneHint(p10) + ". Send OTP, then enter it.";
      } else {
        hintEl.textContent =
          "Enter your mobile number (India format auto-detected; others include country code).";
      }
    }

    function isVerified() {
      var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
      return !!(p10 && phoneVerified.token && phoneVerified.phone10 === p10);
    }

    bindOtpControls({
      formEl: form,
      phoneEl: phoneEl,
      sendBtn: sendBtn,
      verifyBtn: verifyBtn,
      otpInput: otpInput,
      otpFields: otpFields,
      statusEl: statusEl,
      errEl: errEl,
      onOtpUiChange: function () {
        refreshHint();
        if (typeof options.onChange === "function") options.onChange(isVerified());
      },
      onPhoneChange: function () {
        phoneVerified.token = null;
        phoneVerified.phone10 = null;
        if (statusEl) statusEl.classList.add("hidden");
        if (otpInput) otpInput.value = "";
        if (sendBtn) {
          sendBtn.classList.remove("hidden");
          sendBtn.setAttribute("data-label", "Send OTP");
        }
        if (typeof options.onChange === "function") options.onChange(false);
      },
      onVerified: function (p10, tok) {
        phoneVerified.phone10 = p10;
        phoneVerified.token = tok;
        if (typeof options.onChange === "function") options.onChange(true);
      },
    });

    refreshHint();
    if (typeof options.onChange === "function") options.onChange(isVerified());

    return {
      getToken: function () {
        return phoneVerified.token;
      },
      getPhone10: function () {
        return phoneVerified.phone10;
      },
      isVerified: isVerified,
      refreshHint: refreshHint,
    };
  };

  function bindOtpControls(opts) {
    var phoneEl = opts.phoneEl;
    var sendBtn = opts.sendBtn;
    var verifyBtn = opts.verifyBtn;
    var otpInput = opts.otpInput;
    var otpFields = opts.otpFields;
    var statusEl = opts.statusEl;
    var onVerified = opts.onVerified;
    var errEl = opts.errEl;
    var cooldownMs = opts.cooldownMs || 45000;
    var cooldownTimer = null;
    var cooldownUntil = 0;
    /** After first successful send, resend uses Msg91 v5 retry (retrytype=text). */
    var useRetryForResend = false;

    function showErr(msg) {
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove("hidden");
      }
    }
    function clearErr() {
      if (errEl) errEl.classList.add("hidden");
    }

    function setCooldown(active) {
      if (!sendBtn) return;
      if (active) {
        sendBtn.disabled = true;
        var left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
        var orig = sendBtn.getAttribute("data-label") || sendBtn.textContent;
        sendBtn.setAttribute("data-label", orig);
        sendBtn.textContent = "Resend in " + left + "s";
        cooldownTimer = setInterval(function () {
          var l = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
          if (l <= 0) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
            sendBtn.disabled = false;
            sendBtn.textContent = sendBtn.getAttribute("data-label") || "Send OTP";
            return;
          }
          sendBtn.textContent = "Resend in " + l + "s";
        }, 500);
      } else {
        if (cooldownTimer) clearInterval(cooldownTimer);
        cooldownTimer = null;
        sendBtn.disabled = false;
        var o = sendBtn.getAttribute("data-label");
        if (o) sendBtn.textContent = o;
      }
    }

    function otpUiChanged() {
      if (opts.onOtpUiChange) opts.onOtpUiChange();
    }

    if (phoneEl) {
      phoneEl.addEventListener("input", function () {
        useRetryForResend = false;
        if (sendBtn) sendBtn.classList.remove("hidden");
        if (statusEl) statusEl.classList.add("hidden");
        if (opts.onPhoneChange) opts.onPhoneChange(phoneEl.value);
        otpUiChanged();
      });
    }
    if (opts.formEl) {
      opts.formEl.addEventListener("reset", function () {
        useRetryForResend = false;
        setCooldown(false);
        if (sendBtn) {
          sendBtn.classList.remove("hidden");
          sendBtn.setAttribute("data-label", "Send OTP");
          sendBtn.textContent = "Send OTP";
        }
        if (statusEl) statusEl.classList.add("hidden");
        if (otpFields) otpFields.classList.remove("hidden");
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        clearErr();
        var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
        if (!p10) {
          showErr(
            "Enter a valid mobile number. India formats like 903..., 091..., or +91... are auto-resolved.",
          );
          otpUiChanged();
          return;
        }
        sendBtn.disabled = true;
        var payload = useRetryForResend
          ? { action: "retry", phone: p10, retrytype: "text" }
          : { action: "send", phone: p10 };
        postOtp(payload)
          .then(function (res) {
            if (res.data && res.data.success) {
              useRetryForResend = true;
              if (sendBtn) sendBtn.setAttribute("data-label", "Resend OTP");
              if (otpFields) otpFields.classList.remove("hidden");
              cooldownUntil = Date.now() + cooldownMs;
              setCooldown(true);
              if (otpInput) otpInput.focus();
            } else {
              sendBtn.disabled = false;
              showErr(
                (res.data && res.data.error) ||
                  "Could not send OTP. Try again.",
              );
            }
            otpUiChanged();
          })
          .catch(function () {
            sendBtn.disabled = false;
            showErr("Network error. Try again.");
            otpUiChanged();
          });
      });
    }

    if (verifyBtn && otpInput) {
      verifyBtn.addEventListener("click", function () {
        clearErr();
        var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
        var code = (otpInput.value || "").trim();
        if (!p10 || !code) {
          showErr("Enter the OTP we sent to your phone.");
          otpUiChanged();
          return;
        }
        verifyBtn.disabled = true;
        postOtp({ action: "verify", phone: p10, otp: code })
          .then(function (res) {
            verifyBtn.disabled = false;
            if (res.data && res.data.success && res.data.phone_verified_token) {
              if (statusEl) statusEl.classList.remove("hidden");
              if (otpFields) otpFields.classList.add("hidden");
              setCooldown(false);
              if (sendBtn) sendBtn.classList.add("hidden");
              onVerified(p10, res.data.phone_verified_token);
            } else {
              showErr(
                (res.data && res.data.error) || "Invalid OTP. Try again.",
              );
            }
            otpUiChanged();
          })
          .catch(function () {
            verifyBtn.disabled = false;
            showErr("Network error. Try again.");
            otpUiChanged();
          });
      });
    }
  }

  global.wehouseBindOtpControls = bindOtpControls;

  function initLeadPopup() {
    var form = document.getElementById("lead-popup-form");
    if (!form) return;
    var phoneVerified = { token: null, phone10: null };
    var phoneEl = document.getElementById("lead-popup-phone");
    var TOTAL_LEAD_STEPS = 3;
    var leadPopupStep = 1;
    var stepLabel = document.getElementById("lead-popup-step-label");
    var backBtn = document.getElementById("lead-popup-back");
    var nextBtn = document.getElementById("lead-popup-next");
    var submitBtn = document.getElementById("lead-popup-submit");
    var stepLabels = {
      1: "Step 1 of 3 — Your details",
      2: "Step 2 of 3 — Verify your mobile",
      3: "Step 3 of 3 — Your city",
    };

    function clearLeadStepErrors(stepEl) {
      if (!stepEl) return;
      stepEl.querySelectorAll("input, select").forEach(function (field) {
        field.classList.remove("border-red-400", "ring-1", "ring-red-300");
      });
    }

    function validateLeadPopupStep(step) {
      var stepEl = form.querySelector('[data-lead-popup-step="' + step + '"]');
      if (!stepEl) return false;
      clearLeadStepErrors(stepEl);
      var errorEl = document.getElementById("lead-popup-error");
      var hasError = false;
      stepEl.querySelectorAll("input[required], select[required]").forEach(function (field) {
        var value = (field.value || "").toString().trim();
        if (!value) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
        } else if (
          (field.getAttribute("type") === "email" || field.name === "email") &&
          !isValidEmail(value)
        ) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
        }
      });
      if (step === 2) {
        var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
        if (
          !p10 ||
          !phoneVerified.token ||
          phoneVerified.phone10 !== p10
        ) {
          hasError = true;
          if (errorEl) {
            errorEl.textContent =
              "Please verify your mobile number with OTP before continuing.";
            errorEl.classList.remove("hidden");
          }
        }
      }
      if (!hasError && errorEl) errorEl.classList.add("hidden");
      return !hasError;
    }

    function showLeadPopupStep(step) {
      leadPopupStep = step;
      form.querySelectorAll(".lead-popup-step").forEach(function (el) {
        var n = parseInt(el.getAttribute("data-lead-popup-step"), 10);
        el.classList.toggle("hidden", n !== step);
      });
      if (stepLabel) stepLabel.textContent = stepLabels[step] || "";
      if (backBtn) backBtn.hidden = step === 1;
      if (nextBtn) nextBtn.hidden = step === TOTAL_LEAD_STEPS;
      if (submitBtn) submitBtn.hidden = step !== TOTAL_LEAD_STEPS;
      updateLeadPopupSubmitGate();
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (leadPopupStep > 1) showLeadPopupStep(leadPopupStep - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (
          validateLeadPopupStep(leadPopupStep) &&
          leadPopupStep < TOTAL_LEAD_STEPS
        ) {
          showLeadPopupStep(leadPopupStep + 1);
        }
      });
    }

    form.addEventListener("reset", function () {
      phoneVerified.token = null;
      phoneVerified.phone10 = null;
      setTimeout(function () {
        showLeadPopupStep(1);
        refreshLeadOtpPhoneHint();
        updateLeadPopupSubmitGate();
      }, 0);
    });

    showLeadPopupStep(1);

    function refreshLeadOtpPhoneHint() {
      var el = document.getElementById("lead-popup-otp-phone-hint");
      if (!el || !phoneEl) return;
      var p10 = normalizePhoneOtp(phoneEl.value || "");
      if (p10) {
        el.textContent =
          "Code to " +
          maskOtpPhoneHint(p10) +
          " · Send OTP, then enter it here.";
      } else {
        el.textContent =
          "Add a valid mobile number (India format auto-detected; others include country code).";
      }
    }

    function updateLeadPopupSubmitGate() {
      var btn = document.getElementById("lead-popup-submit");
      var hint = document.getElementById("lead-popup-submit-hint");
      var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
      var ok = !!(p10 && phoneVerified.token && phoneVerified.phone10 === p10);
      if (btn) {
        btn.disabled = !ok;
        btn.classList.toggle("opacity-50", !ok);
        btn.classList.toggle("pointer-events-none", !ok);
        btn.setAttribute("aria-disabled", ok ? "false" : "true");
      }
      if (hint) {
        if (ok) hint.classList.add("hidden");
        else hint.classList.remove("hidden");
      }
    }

    bindOtpControls({
      formEl: form,
      phoneEl: phoneEl,
      sendBtn: document.getElementById("lead-popup-send-otp"),
      verifyBtn: document.getElementById("lead-popup-verify-otp"),
      otpInput: document.getElementById("lead-popup-otp"),
      otpFields: document.getElementById("lead-popup-otp-fields"),
      statusEl: document.getElementById("lead-popup-otp-status"),
      errEl: document.getElementById("lead-popup-error"),
      onOtpUiChange: function () {
        refreshLeadOtpPhoneHint();
        updateLeadPopupSubmitGate();
      },
      onPhoneChange: function () {
        phoneVerified.token = null;
        phoneVerified.phone10 = null;
        var st = document.getElementById("lead-popup-otp-status");
        if (st) st.classList.add("hidden");
        var oi = document.getElementById("lead-popup-otp");
        if (oi) oi.value = "";
        var sb = document.getElementById("lead-popup-send-otp");
        if (sb) sb.setAttribute("data-label", "Send OTP");
      },
      onVerified: function (p10, tok) {
        phoneVerified.phone10 = p10;
        phoneVerified.token = tok;
      },
    });

    refreshLeadOtpPhoneHint();
    updateLeadPopupSubmitGate();

    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (leadPopupStep < TOTAL_LEAD_STEPS) {
          if (validateLeadPopupStep(leadPopupStep)) {
            showLeadPopupStep(leadPopupStep + 1);
          }
          return;
        }
        if (!validateLeadPopupStep(3)) return;
        var name =
          (form.querySelector("[name=name]") || {}).value || "";
        var emailRaw =
          (form.querySelector("[name=email]") || {}).value || "";
        var phone =
          (form.querySelector("[name=phone]") || {}).value || "";
        var errorEl = document.getElementById("lead-popup-error");
        if (errorEl) errorEl.classList.add("hidden");
        name = name.toString().trim();
        var email = emailRaw.toString().trim();
        phone = phone.toString().trim();
        if (!name || !email || !phone) {
          if (errorEl) {
            errorEl.textContent =
              "Please enter your name, email, and phone number.";
            errorEl.classList.remove("hidden");
          }
          return;
        }
        if (!isValidEmail(email)) {
          if (errorEl) {
            errorEl.textContent = "Please enter a valid email address.";
            errorEl.classList.remove("hidden");
          }
          return;
        }
        var p10 = normalizePhoneOtp(phone);
        if (
          !phoneVerified.token ||
          !p10 ||
          phoneVerified.phone10 !== p10
        ) {
          if (errorEl) {
            errorEl.textContent =
              "Please verify your mobile number with OTP (Send OTP → Verify).";
            errorEl.classList.remove("hidden");
          }
          return;
        }
        var submitBtn = document.getElementById("lead-popup-submit");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Submitting...';
        }
        var apiUrl =
          form.getAttribute("data-privyr-api") || "/api/privyr-lead";
        var timeframe =
          (form.querySelector("[name=timeframe]") || {}).value || "";
        var payload = {
          name: name,
          email: email,
          phone: phone,
          phone_verified_token: phoneVerified.token,
          city: (form.querySelector("[name=city]") || {}).value || "",
          timeframe: timeframe,
          source: "Lead popup",
        };
        if (typeof global.wehouseMergeUtmIntoPayload === "function") {
          global.wehouseMergeUtmIntoPayload(payload);
        }
        fetch(apiUrl, {
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
              var thankYouUrl = form.getAttribute("data-thank-you-url");
              if (thankYouUrl) {
                window.location.href = thankYouUrl;
                return;
              }
              try {
                localStorage.setItem("wehouse_any_form_submitted", "1");
              } catch (err) {}
              try {
                localStorage.setItem(
                  "wehouse_lead_popup",
                  JSON.stringify({ ts: Date.now() }),
                );
              } catch (err2) {}
              form.classList.add("hidden");
              var successEl = document.getElementById("lead-popup-success");
              if (successEl) successEl.classList.remove("hidden");
              form.reset();
              showLeadPopupStep(1);
            } else if (errorEl) {
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
              submitBtn.innerHTML =
                '<span>Get My Free Plan</span><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>';
              updateLeadPopupSubmitGate();
            }
          });
      },
      true,
    );
  }

  function initReferralPopup() {
    var form = document.getElementById("referral-popup-form");
    if (!form) return;
    var phoneVerified = { token: null, phone10: null };
    var phoneEl = document.getElementById("referral-your-phone");
    var TOTAL_REFERRAL_STEPS = 3;
    var referralStep = 1;
    var stepLabel = document.getElementById("referral-popup-step-label");
    var backBtn = document.getElementById("referral-popup-back");
    var nextBtn = document.getElementById("referral-popup-next");
    var submitBtn = document.getElementById("referral-popup-submit");
    var stepLabels = {
      1: "Step 1 of 3 — Your details",
      2: "Step 2 of 3 — Friend details",
      3: "Step 3 of 3 — Friend's city",
    };

    function refreshReferralOtpPhoneHint() {
      var el = document.getElementById("referral-otp-phone-hint");
      if (!el || !phoneEl) return;
      var p10 = normalizePhoneOtp(phoneEl.value || "");
      if (p10) {
        el.textContent =
          "Code to " + maskOtpPhoneHint(p10) + " · Send OTP, then enter it.";
      } else {
        el.textContent =
          "Enter your mobile number (India format auto-detected; others include country code).";
      }
    }

    function isReferralPhoneVerified() {
      var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
      return !!(p10 && phoneVerified.token && phoneVerified.phone10 === p10);
    }

    function updateReferralSubmitGate() {
      var hint = document.getElementById("referral-submit-hint");
      var step1Hint = document.getElementById("referral-step1-hint");
      var ok = isReferralPhoneVerified();
      if (submitBtn) {
        submitBtn.disabled = !ok;
        submitBtn.classList.toggle("opacity-50", !ok);
        submitBtn.classList.toggle("pointer-events-none", !ok);
        submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
      }
      if (hint) {
        if (ok || referralStep !== TOTAL_REFERRAL_STEPS) hint.classList.add("hidden");
        else hint.classList.remove("hidden");
      }
      if (step1Hint) step1Hint.classList.toggle("hidden", ok);
    }

    function clearReferralStepErrors(stepEl) {
      if (!stepEl) return;
      stepEl.querySelectorAll("input, select").forEach(function (field) {
        field.classList.remove("border-red-400", "ring-1", "ring-red-300");
      });
    }

    function validateReferralStep(step) {
      var stepEl = form.querySelector('[data-referral-popup-step="' + step + '"]');
      if (!stepEl) return false;
      clearReferralStepErrors(stepEl);
      var errorEl = document.getElementById("referral-popup-error");
      var hasError = false;
      stepEl.querySelectorAll("input[required], select[required]").forEach(function (field) {
        var value = (field.value || "").toString().trim();
        if (!value) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
        } else if (
          (field.getAttribute("type") === "email" || field.name === "email") &&
          !isValidEmail(value)
        ) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
        }
      });
      if (step === 1 && !isReferralPhoneVerified()) {
        hasError = true;
        if (errorEl) {
          errorEl.textContent =
            "Please verify your mobile number with OTP before continuing.";
          errorEl.classList.remove("hidden");
        }
      }
      if (!hasError && errorEl) {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      } else if (hasError && errorEl && step !== 1) {
        errorEl.textContent = "Please complete the required fields.";
        errorEl.classList.remove("hidden");
      }
      return !hasError;
    }

    function showReferralStep(step) {
      referralStep = step;
      form.querySelectorAll(".referral-popup-step").forEach(function (el) {
        var n = parseInt(el.getAttribute("data-referral-popup-step"), 10);
        el.classList.toggle("hidden", n !== step);
      });
      if (stepLabel) stepLabel.textContent = stepLabels[step] || "";
      if (backBtn) backBtn.hidden = step === 1;
      if (nextBtn) nextBtn.hidden = step === TOTAL_REFERRAL_STEPS;
      if (submitBtn) submitBtn.hidden = step !== TOTAL_REFERRAL_STEPS;
      updateReferralSubmitGate();
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (referralStep > 1) showReferralStep(referralStep - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (
          validateReferralStep(referralStep) &&
          referralStep < TOTAL_REFERRAL_STEPS
        ) {
          showReferralStep(referralStep + 1);
        }
      });
    }

    bindOtpControls({
      formEl: form,
      phoneEl: phoneEl,
      sendBtn: document.getElementById("referral-send-otp"),
      verifyBtn: document.getElementById("referral-verify-otp"),
      otpInput: document.getElementById("referral-otp"),
      otpFields: document.getElementById("referral-otp-fields"),
      statusEl: document.getElementById("referral-otp-status"),
      errEl: document.getElementById("referral-popup-error"),
      onOtpUiChange: function () {
        refreshReferralOtpPhoneHint();
        updateReferralSubmitGate();
      },
      onPhoneChange: function () {
        phoneVerified.token = null;
        phoneVerified.phone10 = null;
        var st = document.getElementById("referral-otp-status");
        if (st) st.classList.add("hidden");
        var oi = document.getElementById("referral-otp");
        if (oi) oi.value = "";
        var sb = document.getElementById("referral-send-otp");
        if (sb) sb.setAttribute("data-label", "Send OTP");
      },
      onVerified: function (p10, tok) {
        phoneVerified.phone10 = p10;
        phoneVerified.token = tok;
      },
    });

    refreshReferralOtpPhoneHint();
    showReferralStep(1);
    global.wehouseResetReferralPopupSteps = function () {
      showReferralStep(1);
      var err = document.getElementById("referral-popup-error");
      if (err) {
        err.classList.add("hidden");
        err.textContent = "";
      }
    };

    form.addEventListener("reset", function () {
      phoneVerified.token = null;
      phoneVerified.phone10 = null;
      setTimeout(function () {
        showReferralStep(1);
        refreshReferralOtpPhoneHint();
        updateReferralSubmitGate();
      }, 0);
    });

    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (referralStep < TOTAL_REFERRAL_STEPS) {
          if (validateReferralStep(referralStep)) {
            showReferralStep(referralStep + 1);
          }
          return;
        }
        if (!validateReferralStep(2) || !validateReferralStep(1)) {
          if (!isReferralPhoneVerified()) showReferralStep(1);
          else showReferralStep(2);
          return;
        }

        var errorEl = document.getElementById("referral-popup-error");
        if (errorEl) errorEl.classList.add("hidden");

        var yourName =
          (form.querySelector("#referral-your-name") || {}).value || "";
        var yourEmailRaw =
          (form.querySelector("#referral-your-email") || {}).value || "";
        var yourPhone =
          (form.querySelector("#referral-your-phone") || {}).value || "";
        var friendName =
          (form.querySelector("#referral-friend-name") || {}).value || "";
        var friendPhone =
          (form.querySelector("#referral-friend-phone") || {}).value || "";
        var city = (form.querySelector("[name=city]") || {}).value || "";

        var yourEmail = yourEmailRaw.toString().trim();
        if (
          !yourName.trim() ||
          !yourEmail ||
          !yourPhone.trim() ||
          !friendName.trim() ||
          !friendPhone.trim()
        ) {
          if (errorEl) {
            errorEl.textContent =
              "Please enter your name, email, and phone, and your friend's details.";
            errorEl.classList.remove("hidden");
          }
          return;
        }
        if (!isValidEmail(yourEmail)) {
          if (errorEl) {
            errorEl.textContent = "Please enter a valid email address.";
            errorEl.classList.remove("hidden");
          }
          return;
        }

        var p10 = normalizePhoneOtp(yourPhone);
        if (
          !phoneVerified.token ||
          !p10 ||
          phoneVerified.phone10 !== p10
        ) {
          if (errorEl) {
            errorEl.textContent =
              "Please verify your mobile number with OTP (Send OTP → Verify).";
            errorEl.classList.remove("hidden");
          }
          showReferralStep(1);
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Submitting...';
        }

        var apiUrl =
          form.getAttribute("data-privyr-api") || "/api/privyr-lead";

        var payload = {
          name: yourName.toString().trim(),
          email: yourEmail,
          phone: yourPhone.toString().trim(),
          phone_verified_token: phoneVerified.token,
          city: city,
          timeframe: "",
          lead_tag: "REFERRAL",
          source: "Referral popup",
          message:
            "Referral lead:\nFriend Name: " +
            friendName.toString().trim() +
            "\nFriend Phone: " +
            friendPhone.toString().trim(),
        };
        if (typeof global.wehouseMergeUtmIntoPayload === "function") {
          global.wehouseMergeUtmIntoPayload(payload);
        }

        fetch(apiUrl, {
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
              try {
                localStorage.setItem("wehouse_any_form_submitted", "1");
              } catch (err) {}
              var thankYouUrl = form.getAttribute("data-thank-you-url");
              if (thankYouUrl) {
                window.location.href = thankYouUrl;
                return;
              }
              form.reset();
              form.classList.add("hidden");
              var successEl = document.getElementById("referral-popup-success");
              if (successEl) successEl.classList.remove("hidden");
            } else if (errorEl) {
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
              submitBtn.innerHTML =
                '<span>Submit Referral</span><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>';
              updateReferralSubmitGate();
            }
          });
      },
      true,
    );
  }

  function initHeroOtp() {
    var form = document.getElementById("hero-enquiry-form");
    if (!form) return;
    var step3 = form.querySelector('[data-hero-step="3"]');
    var submitBtn = document.getElementById("hero-submit-btn");
    var phoneEl = document.getElementById("hero-phone");
    var wrap = document.getElementById("hero-otp-wrap");
    var otpInput =
      document.getElementById("hero-otp") ||
      document.getElementById("hero-otp-input");
    if (!step3 || !submitBtn || !wrap || !otpInput) {
      return;
    }
    if (wrap.getAttribute("data-hero-otp-bound") === "1") return;
    wrap.setAttribute("data-hero-otp-bound", "1");

    function refreshHeroOtpPhoneHint() {
      var el = document.getElementById("hero-otp-phone-hint");
      if (!el || !phoneEl) return;
      var p10 = normalizePhoneOtp(phoneEl.value || "");
      if (p10) {
        el.textContent =
          "We'll text a code to " +
          maskOtpPhoneHint(p10) +
          ". Tap Send OTP, then enter it below.";
      } else {
        el.textContent =
          "Go back to step 2: enter a valid mobile number (India format auto-detected; others include country code).";
      }
    }

    function updateHeroSubmitGate() {
      var btn = document.getElementById("hero-submit-btn");
      var step3el = form.querySelector('[data-hero-step="3"]');
      var hint = document.getElementById("hero-submit-hint");
      if (!btn || !step3el) return;
      var step3open = !step3el.classList.contains("hidden");
      var p10 = phoneEl ? normalizePhoneOtp(phoneEl.value || "") : null;
      var verified = !!(p10 && heroOtp.token && heroOtp.phone10 === p10);
      if (step3open) {
        btn.disabled = !verified;
        btn.classList.toggle("opacity-50", !verified);
        btn.classList.toggle("pointer-events-none", !verified);
        btn.setAttribute("aria-disabled", verified ? "false" : "true");
        if (hint) {
          if (!verified) hint.classList.remove("hidden");
          else hint.classList.add("hidden");
        }
      } else {
        btn.disabled = false;
        btn.classList.remove("opacity-50", "pointer-events-none");
        btn.setAttribute("aria-disabled", "false");
        if (hint) hint.classList.add("hidden");
      }
    }

    bindOtpControls({
      formEl: form,
      phoneEl: phoneEl,
      sendBtn: document.getElementById("hero-send-otp"),
      verifyBtn: document.getElementById("hero-verify-otp"),
      otpInput: otpInput,
      otpFields: document.getElementById("hero-otp-fields"),
      statusEl: document.getElementById("hero-otp-status"),
      errEl: document.getElementById("hero-form-error"),
      onOtpUiChange: function () {
        refreshHeroOtpPhoneHint();
        updateHeroSubmitGate();
      },
      onPhoneChange: function (v) {
        resetHeroOtpIfPhoneChanged(v);
        var st = document.getElementById("hero-otp-status");
        if (st) st.classList.add("hidden");
        otpInput.value = "";
        var ot = document.getElementById("hero-otp-fields");
        if (ot) ot.classList.remove("hidden");
        var sb = document.getElementById("hero-send-otp");
        if (sb) sb.setAttribute("data-label", "Send OTP");
      },
      onVerified: function (p10, tok) {
        setHeroVerified(p10, tok);
      },
    });

    refreshHeroOtpPhoneHint();
    updateHeroSubmitGate();

    var mo = new MutationObserver(function () {
      refreshHeroOtpPhoneHint();
      updateHeroSubmitGate();
    });
    mo.observe(step3, { attributes: true, attributeFilter: ["class"] });

    form.addEventListener("reset", function () {
      heroOtp.token = null;
      heroOtp.phone10 = null;
      var st = document.getElementById("hero-otp-status");
      if (st) st.classList.add("hidden");
      var ot = document.getElementById("hero-otp-fields");
      if (ot) ot.classList.remove("hidden");
      otpInput.value = "";
      var sb = document.getElementById("hero-send-otp");
      if (sb) sb.setAttribute("data-label", "Send OTP");
      refreshHeroOtpPhoneHint();
      updateHeroSubmitGate();
    });
  }

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var phoneVerified = { token: null, phone10: null };
    var phoneEl = document.getElementById("contact-phone");
    var totalSteps = parseInt(form.getAttribute("data-total-steps") || "3", 10);
    var currentStep = 1;
    var stepLabel = form.querySelector("[data-contact-step-label]");
    var stepDots = form.querySelectorAll("[data-contact-step-dot]");
    var backBtn = form.querySelector("[data-contact-back]");
    var nextBtn = form.querySelector("[data-contact-next]");
    var submitBtn = document.getElementById("contact-submit");

    function showContactError(msg) {
      var errorEl = document.getElementById("contact-form-error");
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.classList.remove("hidden");
    }

    function clearContactMessages() {
      var errorEl = document.getElementById("contact-form-error");
      if (errorEl) {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      }
      var successEl = document.getElementById("contact-form-success");
      if (successEl) successEl.classList.add("hidden");
    }

    function refreshContactOtpPhoneHint() {
      var el = document.getElementById("contact-otp-phone-hint");
      if (!el || !phoneEl) return;
      var p10 = normalizePhoneOtp(phoneEl.value || "");
      if (p10) {
        el.textContent =
          "Code to " + maskOtpPhoneHint(p10) + " . Send OTP, then enter it.";
      } else {
        el.textContent =
          "Enter your mobile number (India format auto-detected; others include country code).";
      }
    }

    function isContactPhoneVerified() {
      var p10 = normalizePhoneOtp((phoneEl && phoneEl.value) || "");
      return !!(p10 && phoneVerified.token && phoneVerified.phone10 === p10);
    }

    function updateContactSubmitGate() {
      var hint = document.getElementById("contact-submit-hint");
      var ok = isContactPhoneVerified();
      if (submitBtn && currentStep === totalSteps) {
        submitBtn.disabled = !ok;
        submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
      }
      if (hint) {
        if (ok) hint.classList.add("hidden");
        else hint.classList.remove("hidden");
      }
    }

    function clearStepErrors(step) {
      form.querySelectorAll('[data-contact-step="' + step + '"] [data-contact-field]').forEach(function (field) {
        field.classList.remove("border-red-400", "ring-1", "ring-red-300");
      });
    }

    function validateStep(step) {
      clearStepErrors(step);
      var fields = form.querySelectorAll(
        '[data-contact-step="' + step + '"] [data-contact-field][data-contact-required]',
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
          !isValidEmail(value)
        ) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
        }
      });

      if (step === 2) {
        var message = ((form.querySelector("[name=message]") || {}).value || "")
          .toString()
          .trim();
        if (message && (message.length < 10 || message.length > 500)) {
          var messageEl = form.querySelector("[name=message]");
          if (messageEl) {
            messageEl.classList.add("border-red-400", "ring-1", "ring-red-300");
          }
          showContactError("Message should be between 10 and 500 characters.");
          return false;
        }
      }

      if (hasError) {
        showContactError("Please complete the required fields.");
      } else {
        clearContactMessages();
      }
      return !hasError;
    }

    function showStep(step) {
      currentStep = step;
      form.querySelectorAll("[data-contact-step]").forEach(function (panel) {
        var n = parseInt(panel.getAttribute("data-contact-step"), 10);
        panel.classList.toggle("hidden", n !== step);
      });

      var activePanel = form.querySelector('[data-contact-step="' + step + '"]');
      var title = activePanel
        ? activePanel.getAttribute("data-contact-step-title") || ""
        : "";
      if (stepLabel) {
        stepLabel.textContent =
          "Step " + step + " of " + totalSteps + (title ? " — " + title : "");
      }

      stepDots.forEach(function (dot) {
        var n = parseInt(dot.getAttribute("data-contact-step-dot"), 10);
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
          var ok = isContactPhoneVerified();
          submitBtn.disabled = !ok;
          submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
        }
      }
      if (step === totalSteps) refreshContactOtpPhoneHint();
      updateContactSubmitGate();
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

    bindOtpControls({
      formEl: form,
      phoneEl: phoneEl,
      sendBtn: document.getElementById("contact-send-otp"),
      verifyBtn: document.getElementById("contact-verify-otp"),
      otpInput: document.getElementById("contact-otp"),
      otpFields: document.getElementById("contact-otp-fields"),
      statusEl: document.getElementById("contact-otp-status"),
      errEl: document.getElementById("contact-form-error"),
      onOtpUiChange: function () {
        refreshContactOtpPhoneHint();
        updateContactSubmitGate();
      },
      onPhoneChange: function () {
        phoneVerified.token = null;
        phoneVerified.phone10 = null;
        var st = document.getElementById("contact-otp-status");
        if (st) st.classList.add("hidden");
        var oi = document.getElementById("contact-otp");
        if (oi) oi.value = "";
        var sb = document.getElementById("contact-send-otp");
        if (sb) sb.setAttribute("data-label", "Send OTP");
        clearContactMessages();
        updateContactSubmitGate();
      },
      onVerified: function (p10, tok) {
        phoneVerified.phone10 = p10;
        phoneVerified.token = tok;
      },
    });

    showStep(1);

    form.addEventListener("reset", function () {
      phoneVerified.token = null;
      phoneVerified.phone10 = null;
      setTimeout(function () {
        showStep(1);
        refreshContactOtpPhoneHint();
        updateContactSubmitGate();
      }, 0);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearContactMessages();

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

      var name = ((form.querySelector("[name=name]") || {}).value || "")
        .toString()
        .trim();
      var email = ((form.querySelector("[name=email]") || {}).value || "")
        .toString()
        .trim();
      var phone = ((form.querySelector("[name=phone]") || {}).value || "")
        .toString()
        .trim();
      var message = ((form.querySelector("[name=message]") || {}).value || "")
        .toString()
        .trim();

      if (!name || !email || !phone || !message) {
        showContactError("Please enter name, email, phone, and your message.");
        return;
      }
      if (!isValidEmail(email)) {
        showContactError("Please enter a valid email address.");
        return;
      }
      if (message.length < 10 || message.length > 500) {
        showContactError("Message should be between 10 and 500 characters.");
        showStep(2);
        return;
      }

      var p10 = normalizePhoneOtp(phone);
      if (!phoneVerified.token || !p10 || phoneVerified.phone10 !== p10) {
        showContactError(
          "Please verify your mobile number with OTP (Send OTP -> Verify).",
        );
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      var city = ((form.querySelector("[name=city]") || {}).value || "")
        .toString()
        .trim();
      var serviceInterest = (
        (form.querySelector("[name=serviceInterest]") || {}).value || ""
      )
        .toString()
        .trim();
      var plotSft = ((form.querySelector("[name=plotSft]") || {}).value || "")
        .toString()
        .trim();

      var messageParts = [message];
      if (serviceInterest)
        messageParts.unshift("Service interest: " + serviceInterest);

      var apiUrl = form.getAttribute("data-privyr-api") || "/api/privyr-lead";
      var payload = {
        name: name,
        email: email,
        phone: phone,
        city: city,
        plot_size: plotSft,
        message: messageParts.join("\n"),
        source: "Contact Us page",
        phone_verified_token: phoneVerified.token,
      };
      if (typeof global.wehouseMergeUtmIntoPayload === "function") {
        global.wehouseMergeUtmIntoPayload(payload);
      }

      fetch(apiUrl, {
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
            var thankYouUrl = form.getAttribute("data-thank-you-url");
            if (thankYouUrl) {
              window.location.href = thankYouUrl;
              return;
            }
            var successEl = document.getElementById("contact-form-success");
            if (successEl) successEl.classList.remove("hidden");
            form.reset();
          } else {
            showContactError(
              data.error || "Something went wrong. Please try again.",
            );
          }
        })
        .catch(function () {
          showContactError("Network error. Please try again.");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.textContent = "Send My Enquiry →";
            updateContactSubmitGate();
          }
        });
    });
  }

  function initAll() {
    initLeadPopup();
    initReferralPopup();
    initHeroOtp();
    initContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})(window);
