(function () {
  "use strict";

  window.goTo = function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: top, behavior: "smooth" });
  };

  var MEP = [
    { f: "Warranty duration", b: "0–6 months verbal", g: "2 full years from handover — documented" },
    { f: "Written warranty document", b: "None", g: "Signed certificate at handover" },
    { f: "Electrical cables", b: "Generic / unspecified", g: "FR-LSH cables (ISI approved)" },
    { f: "Plumbing pipes", b: "Unspecified grade", g: "CPVC piping — in contract" },
    { f: "Switches / Switchgear", b: "Unspecified fixtures", g: "Specified switches and switchgear" },
    { f: "Claim response time", b: "No defined process", g: "Acknowledged 48 hrs · Inspection in 7 days" },
    { f: "Remediation cost", b: "Charged to homeowner", g: "₹0 — WeHouse bears all costs" },
  ];

  var PHASES = [
    {
      nm: "Excavation",
      ct: "28 checks",
      cols: [
        { t: "SITE PREPARATION", i: ["Soil depth verification (min 6'6\")", "PCC layer thickness (min 75mm)", "Anti-termite treatment application", "Sump RCC capacity (6000L)", "Plot survey alignment"] },
        { t: "REINFORCEMENT", i: ["Foundation rebar spacing check", "Cover block placement (min 20mm)", "Tie wire binding quality", "Bar diameter Fe-550 verification", "Column starter bar alignment"] },
        { t: "CONCRETE", i: ["Mix ratio verification (M20)", "Cube test samples taken", "Curing duration (min 14 days)", "Water-cement ratio check", "Compaction adequacy"] },
      ],
    },
    {
      nm: "Structure",
      ct: "36 checks",
      cols: [
        { t: "COLUMNS", i: ["Column size per structural drawing", "Reinforcement cage inspection", "Shutter plumb and level", "Concrete pour continuity", "Curing method and duration"] },
        { t: "BEAMS & SLABS", i: ["Beam top/bottom reinforcement", "Slab thickness (min 125mm)", "Slab reinforcement spacing", "28-day cube test result", "Post-pour curing compliance"] },
        { t: "QA SIGN-OFF", i: ["Shuttering removal timing", "Honeycombing inspection", "Surface finish quality", "Level and alignment check", "Slab height FFL (10'6\")"] },
      ],
    },
    {
      nm: "Masonry",
      ct: "24 checks",
      cols: [
        { t: "BRICKWORK", i: ["Brick quality (9\" ext / 4.5\" int)", "Mortar mix ratio (1:5)", "Course level and alignment", "Column-to-wall bonding", "Vertical joint stagger"] },
        { t: "PLASTERING", i: ["Plaster thickness (min 12mm)", "River sand grade verification", "Surface preparation (hacking)", "Curing (min 7 days)", "External plaster finish quality"] },
        { t: "WATERPROOFING", i: ["Dr. Fixit / Fosroc brand verified", "Application layers (min 2)", "Overlap at joints", "Ponding test (24hr result)", "Terrace slope to drain"] },
      ],
    },
    {
      nm: "Electrical",
      ct: "42 checks",
      cols: [
        { t: "CABLES & CONDUITS", i: ["Wire gauge per load (Polycab/KEI)", "Conduit depth in wall (min 20mm)", "PVC conduit brand (AKG/Sudhakar)", "Junction box placement", "Wire colour coding compliance"] },
        { t: "DB BOARD & EARTHING", i: ["DB board rating per load", "MCB trip rating verification", "Earth leakage circuit breaker", "Earthing continuity test", "Neutral and earth segregation"] },
        { t: "POINTS & FIXTURES", i: ["Point locations per electrical drawing", "Switch box level and plumb", "Legrand Myrius / GM Luxuty brand", "Load test per circuit", "EV point installation"] },
      ],
    },
    {
      nm: "Plumbing",
      ct: "38 checks",
      cols: [
        { t: "SUPPLY LINES", i: ["CPVC grade (Astral/Ashirvad)", "Pipe diameter per drawing", "Hot/cold line separation", "Sleeve placement in walls", "Pressure test (6 bar, 30 min)"] },
        { t: "DRAINAGE", i: ["Drainage pipe grade (PVC/CPVC)", "Slope adequacy (min 1:80)", "Trap at all fixtures", "Sewer line depth", "Vent pipe installation"] },
        { t: "FIXTURES", i: ["Sanitary ware brand (Cera/HindWare)", "WC flush operation test", "Basin and mixer installation", "Overhead shower alignment", "Flow rate at each tap"] },
      ],
    },
    {
      nm: "Finishing",
      ct: "44 checks",
      cols: [
        { t: "FLOORING", i: ["Tile adhesive bond strength", "Grout filling completeness", "Floor level and gradient", "Tile brand verification", "Grouting colour consistency"] },
        { t: "PAINTING", i: ["JK Putty coverage", "Asian Primer coat count", "Tractor Emulsion coat count", "Apex Ultima exterior (3 sides)", "Paint colour matching"] },
        { t: "DOORS & WINDOWS", i: ["Door frame level and plumb", "Shutter alignment and gap", "UPVC window weatherproofing", "Window grill welding quality", "Hardware and lock function"] },
      ],
    },
    {
      nm: "Waterproof.",
      ct: "22 checks",
      cols: [
        { t: "MATERIAL", i: ["Dr. Fixit / Fosroc brand confirmed", "Product batch number logged", "Primer coat applied", "Curing time between coats", "Application temperature"] },
        { t: "APPLICATION", i: ["Terrace layers (min 2)", "Bathroom overlap (min 150mm)", "Up-stand height (min 300mm)", "Parapet continuity", "Pipe penetration sealing"] },
        { t: "TESTING", i: ["Ponding test (min 24 hrs)", "Water level drop measurement", "Bathroom flood test", "Terrace drain flow test", "Pass/fail certificate issued"] },
      ],
    },
    {
      nm: "Handover",
      ct: "38 checks",
      cols: [
        { t: "SYSTEMS", i: ["All electrical switches operational", "All water outlets flowing", "All sanitary flushing correctly", "OHT filled and tested", "EV point tested"] },
        { t: "STRUCTURAL", i: ["Crack survey — all surfaces", "Settlement observation check", "RWH flow test", "Compound wall stability", "Gate operation and alignment"] },
        { t: "DOCUMENTATION", i: ["All warranty certificates prepared", "Brand product warranties collected", "E-Monitoring dashboard transferred", "CCTV app login handed over", "Key handover documentation"] },
      ],
    },
  ];

  var BCATS = ["All", "Structure", "Electrical", "Plumbing", "Bathroom", "Painting", "Finishing"];
  var BRAND_CAT_COLORS = {
    Structure: {
      card: "border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50/50",
      label: "text-orange-700",
      bar: "from-orange-500 to-amber-400",
    },
    Electrical: {
      card: "border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-yellow-50/50",
      label: "text-amber-800",
      bar: "from-amber-500 to-yellow-400",
    },
    Plumbing: {
      card: "border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-cyan-50/50",
      label: "text-sky-700",
      bar: "from-sky-500 to-cyan-400",
    },
    Bathroom: {
      card: "border-teal-200/70 bg-gradient-to-br from-teal-50 via-white to-emerald-50/50",
      label: "text-teal-700",
      bar: "from-teal-500 to-emerald-400",
    },
    Painting: {
      card: "border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-purple-50/50",
      label: "text-violet-700",
      bar: "from-violet-500 to-purple-400",
    },
    Finishing: {
      card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-green-50/50",
      label: "text-emerald-700",
      bar: "from-emerald-500 to-green-400",
    },
  };

  var BRANDS = [
    { cat: "Structure", n: "Ultratech", u: "Cement — 43/53 grade" },
    { cat: "Structure", n: "Maha / Priya", u: "Cement — 43 grade surface" },
    { cat: "Structure", n: "Jai Raj", u: "Fe-550 TMT Steel" },
    { cat: "Structure", n: "Dr. Fixit", u: "Waterproofing — all areas" },
    { cat: "Structure", n: "Fosroc", u: "Waterproofing — alternative" },
    { cat: "Electrical", n: "Polycab", u: "FR-LSH cables — ISI approved" },
    { cat: "Electrical", n: "KEI", u: "FR-LSH cables — FIA/TAC approved" },
    { cat: "Electrical", n: "AKG Heavy", u: "Conduit piping" },
    { cat: "Electrical", n: "Sudhakar", u: "Conduit piping — alternative" },
    { cat: "Electrical", n: "Legrand Myrius", u: "Switches and switchgear" },
    { cat: "Electrical", n: "GM Luxuty", u: "Switches — alternative" },
    { cat: "Plumbing", n: "Astral", u: "CPVC piping — hot & cold" },
    { cat: "Plumbing", n: "Ashirvad", u: "PVC & CPVC Pro piping" },
    { cat: "Bathroom", n: "Cera", u: "Master bath — up to ₹30,000" },
    { cat: "Bathroom", n: "HindWare", u: "All baths — fittings" },
    { cat: "Bathroom", n: "ParryWare", u: "Other baths — up to ₹20,000" },
    { cat: "Painting", n: "Asian Paints", u: "Primer — all internal surfaces" },
    { cat: "Painting", n: "Apex Ultima", u: "Exterior paint — 3 sides" },
    { cat: "Painting", n: "JK Putty", u: "Wall putty — standard/regular" },
    { cat: "Finishing", n: "Hindware", u: "Kitchen faucet ₹2,500" },
    { cat: "Finishing", n: "Duratank", u: "OHT 2000L 3-layer" },
    { cat: "Finishing", n: "Kajaria", u: "Floor tiles — brand partner" },
  ];

  function el(id) {
    return document.getElementById(id);
  }

  // MEP comparison rows
  var mepRows = el("mep-rows");
  if (mepRows) {
    mepRows.innerHTML = MEP.map(function (r, i) {
      var zebra = i % 2 === 1 ? " bg-gray-50/40" : "";
      return (
        '<div class="grid min-w-[44rem] grid-cols-[.9fr_1fr_1.25fr] border-b border-gray-100 text-sm last:border-0' + zebra + '" role="row">' +
        '<div class="flex items-center p-4 font-semibold text-gray-800" role="cell">' + r.f + "</div>" +
        '<div class="flex items-start gap-2.5 border-l border-gray-100 p-4 text-gray-500" role="cell">' +
        '<span class="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-red-50 text-red-500" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></span>' +
        '<span>' + r.b + "</span></div>" +
        '<div class="relative flex items-start gap-2.5 border-l border-orange-100 bg-orange-50/50 p-4 font-medium text-gray-800" role="cell">' +
        '<span class="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
        '<span>' + r.g + "</span></div>" +
        "</div>"
      );
    }).join("");
  }

  var mepRowsMobile = el("mep-rows-mobile");
  if (mepRowsMobile) {
    mepRowsMobile.innerHTML = MEP.map(function (r) {
      return (
        '<article class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm" role="listitem">' +
        '<p class="wh-heading-sm text-dark mb-2">' + r.f + "</p>" +
        '<div class="grid grid-cols-1 gap-2">' +
        '<div class="rounded-lg border border-gray-200 bg-gray-50 p-2">' +
        '<p class="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Typical contractor</p>' +
        '<p class="flex items-start gap-1.5 text-sm font-semibold text-dark">' +
        '<span class="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-red-50 text-red-500" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></span>' +
        '<span>' + r.b + "</span></p></div>" +
        '<div class="rounded-lg border border-amber-200 bg-orange-50/70 p-2">' +
        '<p class="mb-1 text-xs font-bold uppercase tracking-wider text-orange-700">WeHouse</p>' +
        '<p class="flex items-start gap-1.5 text-sm font-semibold text-dark">' +
        '<span class="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
        '<span>' + r.g + "</span></p></div>" +
        "</div></article>"
      );
    }).join("");
  }

  // Checkpoint phases
  window.setPH = function setPH(i) {
    document.querySelectorAll("[data-qa-phase]").forEach(function (node, x) {
      var selected = x === i;
      node.classList.toggle("border-orange-500", selected);
      node.classList.toggle("bg-white", selected);
      node.classList.toggle("text-orange-700", selected);
      node.classList.toggle("border-transparent", !selected);
      node.classList.toggle("text-gray-600", !selected);
      node.setAttribute("aria-selected", selected ? "true" : "false");
      node.setAttribute("tabindex", selected ? "0" : "-1");
    });
    renderPH(i);
  };

  function renderPH(i) {
    var p = PHASES[i];
    var panel = el("ph-panel");
    if (!panel || !p) return;
    panel.innerHTML =
      '<div class="flex flex-wrap items-center gap-4 border-b border-gray-100 px-5 py-5">' +
      '<div><p class="text-lg font-bold text-dark">' + p.nm + '</p><p class="mt-1 text-sm text-gray-500">Engineer review · Photo evidence · Digital sign-off</p></div>' +
      '<span class="ml-auto rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">' + p.ct + "</span>" +
      "</div>" +
      '<div class="grid md:grid-cols-3">' +
      p.cols
        .map(function (c) {
          return (
            '<div class="border-b border-gray-100 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">' +
            '<p class="mb-4 text-xs font-bold uppercase tracking-widest text-orange-700">' + c.t + "</p>" +
            c.i
              .map(function (x) {
                return '<div class="mb-3 flex gap-2 text-sm leading-relaxed text-gray-600 last:mb-0"><span class="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' + x + "</div>";
              })
              .join("") +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  var phSel = el("ph-sel");
  if (phSel) {
    phSel.innerHTML = PHASES.map(function (p, i) {
      return (
        '<button type="button" role="tab" aria-controls="ph-panel" aria-selected="' + (i === 0 ? "true" : "false") +
        '" tabindex="' + (i === 0 ? "0" : "-1") + '" data-qa-phase class="min-w-[7.5rem] shrink-0 snap-start border-b-2 px-3 py-3 text-center transition hover:bg-white ' +
        (i === 0 ? "border-orange-500 bg-white text-orange-700" : "border-transparent text-gray-600") + '" onclick="setPH(' + i + ')">' +
        '<span class="block text-xs font-bold tracking-widest text-gray-400">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="mt-1 block whitespace-nowrap text-sm font-bold">' + p.nm + "</span>" +
        '<span class="mt-0.5 block whitespace-nowrap text-xs text-gray-400">' + p.ct + "</span>" +
        "</button>"
      );
    }).join("");
    phSel.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      var tabs = Array.prototype.slice.call(phSel.querySelectorAll('[role="tab"]'));
      var current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      var next = event.key === "ArrowRight"
        ? (current + 1) % tabs.length
        : (current - 1 + tabs.length) % tabs.length;
      window.setPH(next);
      tabs[next].focus();
    });
    renderPH(0);
  }



  // Brands
  window.abcat = "All";
  window.renderBr = function renderBr() {
    var f = window.abcat === "All" ? BRANDS : BRANDS.filter(function (b) { return b.cat === window.abcat; });
    var grid = el("br-grid");
    if (!grid) return;
    grid.innerHTML = f
      .map(function (b) {
        var colors = BRAND_CAT_COLORS[b.cat] || BRAND_CAT_COLORS.Structure;
        return (
          '<article class="wh-card wh-card--interactive overflow-hidden p-4 ' + colors.card + '">' +
          '<div class="mb-3 h-1 w-10 rounded-full bg-gradient-to-r ' + colors.bar + '" aria-hidden="true"></div>' +
          '<span class="text-xs font-bold uppercase tracking-widest ' + colors.label + '">' + b.cat + "</span>" +
          '<h3 class="mt-1 font-extrabold text-dark">' + b.n + "</h3>" +
          '<p class="mt-1 text-sm leading-relaxed text-gray-600">' + b.u + "</p>" +
          "</article>"
        );
      })
      .join("");
  };

  var brCats = el("br-cats");
  if (brCats) {
    brCats.innerHTML = BCATS.map(function (c) {
      return (
        '<button type="button" class="shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ' +
        (c === window.abcat ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-700") +
        '" role="tab" aria-selected="' + (c === window.abcat ? "true" : "false") +
        '" data-bcat="' +
        c +
        '">' +
        c +
        "</button>"
      );
    }).join("");
    brCats.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-bcat]");
      if (!btn) return;
      window.abcat = btn.getAttribute("data-bcat");
      brCats.querySelectorAll("[data-bcat]").forEach(function (n) {
        var selected = n.getAttribute("data-bcat") === window.abcat;
        n.classList.toggle("border-orange-300", selected);
        n.classList.toggle("bg-orange-50", selected);
        n.classList.toggle("text-orange-700", selected);
        n.classList.toggle("border-gray-200", !selected);
        n.classList.toggle("bg-white", !selected);
        n.classList.toggle("text-gray-600", !selected);
        n.setAttribute("aria-selected", selected ? "true" : "false");
      });
      renderBr();
    });
    renderBr();
  }

  // Active tab on scroll
  var sids = ["mep-warranty", "quality-checkbook"];
  var qts = document.querySelectorAll("[data-qa-nav]");
  qts.forEach(function (button) {
    button.addEventListener("click", function () {
      window.goTo(button.getAttribute("data-qa-nav"));
    });
  });
  window.addEventListener(
    "scroll",
    function () {
      var cur = 0;
      sids.forEach(function (id, i) {
        var node = el(id);
        if (node && window.scrollY >= node.offsetTop - 160) cur = i;
      });
      qts.forEach(function (t, i) {
        var selected = i === cur;
        t.classList.toggle("border-orange-300", selected);
        t.classList.toggle("bg-orange-50", selected);
        t.classList.toggle("text-orange-700", selected);
        t.classList.toggle("border-gray-200", !selected);
        t.classList.toggle("bg-white", !selected);
        t.classList.toggle("text-gray-600", !selected);
      });
    },
    { passive: true }
  );

  // CTA form — 3-step flow
  var form = el("qa-cta-form");
  if (form) {
    var totalSteps = parseInt(form.getAttribute("data-total-steps") || "3", 10);
    var currentStep = 1;
    var errorEl = form.querySelector("[data-qa-form-error]");
    var stepLabel = form.querySelector("[data-qa-step-label]");
    var stepDots = form.querySelectorAll("[data-qa-step-dot]");
    var backBtn = form.querySelector("[data-qa-back]");
    var nextBtn = form.querySelector("[data-qa-next]");
    var submitBtn = form.querySelector("[data-qa-submit]");
    var otpHint = form.querySelector("[data-qa-otp-hint]");

    var otp = typeof window.wehouseAttachFormOtp === "function"
      ? window.wehouseAttachFormOtp(form, {
          phoneSelector: "[name=phone]",
          errorSelector: "[data-qa-form-error]",
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
      form.querySelectorAll('[data-qa-step="' + step + '"] [data-qa-field]').forEach(function (field) {
        field.classList.remove("border-red-400", "ring-1", "ring-red-300");
      });
    }

    function validateStep(step) {
      clearStepErrors(step);
      var fields = form.querySelectorAll('[data-qa-step="' + step + '"] [data-qa-field][data-qa-required]');
      var hasError = false;

      fields.forEach(function (field) {
        var value = (field.value || "").toString().trim();
        if (!value) {
          field.classList.add("border-red-400", "ring-1", "ring-red-300");
          hasError = true;
          return;
        }
        if ((field.getAttribute("type") === "email" || field.name === "email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
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
      form.querySelectorAll("[data-qa-step]").forEach(function (panel) {
        var n = parseInt(panel.getAttribute("data-qa-step"), 10);
        panel.classList.toggle("hidden", n !== step);
      });

      var activePanel = form.querySelector('[data-qa-step="' + step + '"]');
      var title = activePanel ? activePanel.getAttribute("data-qa-step-title") || "" : "";
      if (stepLabel) {
        stepLabel.textContent = "Step " + step + " of " + totalSteps + (title ? " — " + title : "");
      }

      stepDots.forEach(function (dot) {
        var n = parseInt(dot.getAttribute("data-qa-step-dot"), 10);
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
      if (errorEl) errorEl.classList.add("hidden");

      if (currentStep < totalSteps) {
        if (validateStep(currentStep)) showStep(currentStep + 1);
        return;
      }

      if (!validateStep(currentStep)) return;

      if (!otp || !otp.isVerified()) {
        if (errorEl) {
          errorEl.textContent = "Please verify your mobile number with OTP.";
          errorEl.classList.remove("hidden");
        }
        return;
      }

      var name = ((form.querySelector("[name=name]") || {}).value || "").trim();
      var email = ((form.querySelector("[name=email]") || {}).value || "").trim();
      var phone = ((form.querySelector("[name=phone]") || {}).value || "").trim();
      var topic = ((form.querySelector("[name=topic]") || {}).value || "").trim();
      var message = ((form.querySelector("[name=message]") || {}).value || "").trim();
      var source = ((form.querySelector("[name=source]") || {}).value || "Quality Assurance CTA").trim();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      var payload = {
        name: name,
        phone: phone,
        email: email,
        message: "QA topic: " + topic + (message ? "\n" + message : ""),
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
            window.location.href = form.getAttribute("data-thank-you-url") || "/thank-you";
          } else if (errorEl) {
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
            submitBtn.textContent = "Submit Question →";
            var ok = otp ? otp.isVerified() : false;
            submitBtn.disabled = !ok;
            submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
          }
        });
    });
  }
})();
