(function () {
    "use strict";

    document.querySelectorAll("#service-faq [data-faq-item]").forEach(function (item) {
        var trigger = item.querySelector("[data-accordion-trigger]");
        if (!trigger) return;
        trigger.addEventListener("click", function () {
            var isOpen = item.getAttribute("data-state") === "open";
            item.setAttribute("data-state", isOpen ? "closed" : "open");
            trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
        });
    });

    document.querySelectorAll("[data-style-filter]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var filter = btn.getAttribute("data-style-filter");
            document.querySelectorAll("[data-style-filter]").forEach(function (b) {
                b.classList.toggle("is-active", b === btn);
            });
            document.querySelectorAll("[data-style]").forEach(function (item) {
                var style = item.getAttribute("data-style");
                var show = filter === "all" || style === filter;
                item.classList.toggle("hidden", !show);
            });
        });
    });

    document.querySelectorAll("[data-spec-filter]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var filter = btn.getAttribute("data-spec-filter") || "All";
            document.querySelectorAll("[data-spec-filter]").forEach(function (b) {
                var active = b === btn;
                b.classList.toggle("is-active", active);
                b.setAttribute("aria-pressed", active ? "true" : "false");
            });
            document.querySelectorAll("[data-spec-cat]").forEach(function (card) {
                var cat = card.getAttribute("data-spec-cat") || "";
                var show = filter === "All" || cat === filter;
                card.classList.toggle("hidden", !show);
            });
        });
    });

    document.querySelectorAll("[data-before-after]").forEach(function (slider) {
        var before = slider.querySelector("[data-before-after-before]");
        var handle = slider.querySelector("[data-before-after-handle]");
        if (!before || !handle) return;

        function setPosition(clientX) {
            var rect = slider.getBoundingClientRect();
            var pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
            before.style.width = pct + "%";
            handle.style.left = pct + "%";
        }

        var dragging = false;
        slider.addEventListener("pointerdown", function (e) {
            dragging = true;
            slider.setPointerCapture(e.pointerId);
            setPosition(e.clientX);
        });
        slider.addEventListener("pointermove", function (e) {
            if (dragging) setPosition(e.clientX);
        });
        slider.addEventListener("pointerup", function () {
            dragging = false;
        });
    });

    (function initMilestoneTabs() {
        var root = document.querySelector("[data-milestone-tabs]");
        if (!root) return;
        var tabs = root.querySelectorAll("[data-milestone-tab]");
        var panels = root.querySelectorAll("[data-milestone-panel]");

        function activate(index) {
            tabs.forEach(function (tab) {
                var active = tab.getAttribute("data-milestone-tab") === String(index);
                tab.classList.toggle("is-active", active);
                tab.setAttribute("aria-selected", active ? "true" : "false");
            });
            panels.forEach(function (panel) {
                var active = panel.getAttribute("data-milestone-panel") === String(index);
                panel.classList.toggle("is-active", active);
                if (active) panel.removeAttribute("hidden");
                else panel.setAttribute("hidden", "");
            });
        }

        tabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                activate(tab.getAttribute("data-milestone-tab") || "0");
            });
        });
    })();

    document.querySelectorAll("[data-service-lead]").forEach(function (form) {
        var totalSteps = parseInt(form.getAttribute("data-total-steps") || "1", 10);
        var currentStep = 1;
        var stepLabel = form.querySelector("[data-lead-step-label]");
        var backBtn = form.querySelector("[data-lead-back]");
        var nextBtn = form.querySelector("[data-lead-next]");
        var submitBtn = form.querySelector("[data-lead-submit]");
        var errEl = form.querySelector("[data-otp-error]");
        var stepDots = form.querySelectorAll("[data-lead-step-dot]");
        var otpWrap = form.querySelector("[data-service-lead-otp]");
        var otpHint = form.querySelector("[data-service-otp-hint]");

        var otp = typeof window.wehouseAttachFormOtp === "function"
            ? window.wehouseAttachFormOtp(form, {
                phoneSelector: "[name=phone]",
                errorSelector: "[data-otp-error]",
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
            form.querySelectorAll("[data-lead-field][data-lead-step=\"" + step + "\"]").forEach(function (field) {
                field.classList.remove("border-red-400", "ring-1", "ring-red-300");
            });
        }

        function validateStep(step) {
            clearStepErrors(step);
            var fields = form.querySelectorAll("[data-lead-field][data-lead-step=\"" + step + "\"][data-lead-required]");
            var hasError = false;

            fields.forEach(function (field) {
                var value = (field.value || "").toString().trim();
                if (!value) {
                    field.classList.add("border-red-400", "ring-1", "ring-red-300");
                    hasError = true;
                    return;
                }

                var isEmail = field.getAttribute("type") === "email" || (field.name || "") === "email";
                if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    field.classList.add("border-red-400", "ring-1", "ring-red-300");
                    hasError = true;
                }
            });

            if (hasError && errEl) {
                errEl.textContent = "Please complete the required fields.";
                errEl.classList.remove("hidden");
            } else if (errEl) {
                errEl.classList.add("hidden");
                errEl.textContent = "";
            }

            return !hasError;
        }

        function showStep(step) {
            currentStep = step;
            form.querySelectorAll("[data-lead-step]").forEach(function (el) {
                var n = parseInt(el.getAttribute("data-lead-step"), 10);
                el.classList.toggle("hidden", n !== step);
            });

            var activePanel = form.querySelector('[data-lead-step="' + step + '"]');
            var title = activePanel ? activePanel.getAttribute("data-lead-step-title") || "" : "";
            if (stepLabel) {
                stepLabel.textContent = "Step " + step + " of " + totalSteps + (title ? " — " + title : "");
            }

            stepDots.forEach(function (dot) {
                var n = parseInt(dot.getAttribute("data-lead-step-dot"), 10);
                dot.classList.toggle("is-active", n <= step);
                dot.classList.toggle("is-current", n === step);
            });

            if (backBtn) {
                backBtn.classList.toggle("hidden", step === 1);
            }
            if (nextBtn) {
                nextBtn.classList.toggle("hidden", step === totalSteps);
            }
            if (submitBtn) {
                submitBtn.classList.toggle("hidden", step !== totalSteps);
            }
            if (otpWrap) {
                otpWrap.classList.toggle("hidden", step !== totalSteps);
            }
            if (submitBtn && step === totalSteps) {
                var ok = otp ? otp.isVerified() : false;
                submitBtn.disabled = !ok;
                submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
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

        if (totalSteps > 1) {
            showStep(1);
        }

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (errEl) errEl.classList.add("hidden");

            if (currentStep < totalSteps) {
                if (validateStep(currentStep)) showStep(currentStep + 1);
                return;
            }

            if (!validateStep(currentStep)) return;

            if (!otp || !otp.isVerified()) {
                if (errEl) {
                    errEl.textContent = "Please verify your mobile number with OTP.";
                    errEl.classList.remove("hidden");
                }
                return;
            }

            var api = form.getAttribute("data-privyr-api") || "/api/privyr-lead";
            var thankYou = form.getAttribute("data-thank-you-url") || "/thank-you";
            var fd = new FormData(form);
            var payload = Object.fromEntries(fd.entries());
            delete payload.otp;

            var serviceName = form.getAttribute("data-service") || payload.service || "";
            var noteKeys = [
                "company", "sft", "homeType", "requirements", "projectType",
                "area", "plotSize", "style", "timeline", "timeframe", "service",
            ];
            var notes = [];
            noteKeys.forEach(function (key) {
                var v = (payload[key] || "").toString().trim();
                if (v) notes.push(key + ": " + v);
            });
            payload.message = notes.join("\n");
            payload.source = payload.source || ("Service page — " + serviceName);
            if (payload.sft && !payload.plot_size) payload.plot_size = payload.sft;
            if (payload.plotSize && !payload.plot_size) payload.plot_size = payload.plotSize;
            if (payload.area && !payload.plot_size) payload.plot_size = payload.area;
            if (payload.timeline && !payload.timeframe) payload.timeframe = payload.timeline;
            payload.phone_verified_token = otp.getToken();

            if (typeof window.wehouseMergeUtmIntoPayload === "function") {
                window.wehouseMergeUtmIntoPayload(payload);
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.setAttribute("data-original-label", submitBtn.textContent || "");
                submitBtn.textContent = "Sending…";
            }

            fetch(api, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload),
            })
                .then(function (res) {
                    return res.json().catch(function () {
                        return {};
                    }).then(function (data) {
                        return { ok: res.ok, data: data };
                    });
                })
                .then(function (result) {
                    if (result.data && result.data.success) {
                        window.location.href = thankYou;
                        return;
                    }
                    throw new Error(
                        (result.data && result.data.error) || "Submit failed"
                    );
                })
                .catch(function (err) {
                    if (submitBtn) {
                        submitBtn.textContent = submitBtn.getAttribute("data-original-label") || "Submit";
                        var ok = otp ? otp.isVerified() : false;
                        submitBtn.disabled = !ok;
                        submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
                    }
                    if (errEl) {
                        errEl.textContent =
                            (err && err.message) ||
                            "Something went wrong. Please call us or try again.";
                        errEl.classList.remove("hidden");
                    }
                });
        });
    });
})();
