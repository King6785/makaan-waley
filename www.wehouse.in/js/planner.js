(function () {
  "use strict";

  /* ── Config ── */
  var cfg = window.WEHOUSE_PLANNER_CONFIG || {};
  var apiUrl = cfg.api || "/api/privyr-lead";
  var otpApi =
    cfg.otpApi ||
    (typeof window.WEHOUSE_OTP_API === "string" && window.WEHOUSE_OTP_API) ||
    "/api/msg91-otp";
  var thankYouBase = cfg.thankYouBase || "/thank-you";
  var basePath = cfg.base || "/";
  var DEFAULT_OPTION_PLACEHOLDER_IMG_REL =
    cfg.defaultOptionPlaceholderImg ||
    "images/wehouse-icon.svg";
  var STEP_VIDEO_FILES = [
    "videos/planner-page/optimized/planner-step1.mp4",
    "videos/planner-page/optimized/planner-step2.mp4",
    "videos/planner-page/optimized/planner-step3.mp4",
    "videos/planner-page/optimized/planner-step4.mp4",
    "videos/planner-page/optimized/planner-step5.mp4",
  ];
  var prefetchedStepVideos = {};
  var LS_ANY_FORM_SUBMITTED = "wehouse_any_form_submitted";

  function markAnyFormSubmitted() {
    try {
      localStorage.setItem(LS_ANY_FORM_SUBMITTED, "1");
    } catch (e) {}
  }

  function normalizePhone10Planner(raw) {
    if (typeof window.wehouseNormalizePhone10 === "function") {
      return window.wehouseNormalizePhone10(raw);
    }
    var d = String(raw || "").replace(/\D/g, "");
    if (!d || d.length > 15) return null;
    if (d.length === 10) {
      var c = d.charAt(0);
      if (c >= "6" && c <= "9") return "91" + d;
      return null;
    }
    if (d.length >= 11 && d.length <= 15 && d.charAt(0) !== "0") return d;
    return null;
  }

  function maskPlannerOtpHint(norm) {
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

  function refreshPlannerOtpPhoneHint() {
    var el = document.getElementById("planner-otp-phone-hint");
    var ph = document.getElementById("contact-phone");
    if (!el || !ph) return;
    var p10 = normalizePhone10Planner(ph.value);
    if (p10) {
      el.textContent =
        "We'll text a code to " +
        maskPlannerOtpHint(p10) +
        ". Tap Send OTP, then enter the code below.";
    } else {
      el.textContent =
        "Enter a valid mobile (India: 10 digits; other countries: include country code, e.g. +1…).";
    }
  }

  function postOtpPlanner(body) {
    return fetch(otpApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          return { ok: r.ok, data: data };
        });
    });
  }

  /* ── Data ── */
  var CITIES = [
    // Use planner city card images for the city selection step.
    {
      label: "Hyderabad",
      emoji: "🏙️",
      note: "Our flagship city",
      value: "hyderabad",
      image: "images/planner/city/hyderabad.webp",
    },
    {
      label: "Ahmedabad",
      emoji: "🪔",
      note: "Gujarat's design capital",
      value: "ahmedabad",
      image: "images/planner/city/ahmedabad.webp",
    },
    {
      label: "Chennai",
      emoji: "🌊",
      note: "South Chennai focus",
      value: "chennai",
      image: "images/planner/city/chennai.webp",
    },
    {
      label: "Bengaluru",
      emoji: "🌿",
      note: "Tech hub living",
      value: "bengaluru",
      image: "images/planner/city/bengaluru.webp",
    },
    {
      label: "Pune",
      emoji: "🏔️",
      note: "Premium suburbs",
      value: "pune",
      image: "images/planner/city/pune.webp",
    },
    {
      label: "Jaipur",
      emoji: "🕌",
      note: "Royal heritage zones",
      value: "jaipur",
      image: "images/planner/city/jaipur.webp",
    },
    {
      label: "Chandigarh",
      emoji: "🏛️",
      note: "Planned city expertise",
      value: "chandigarh",
      image: "images/planner/city/chandigarh.webp",
    },
    {
      label: "Amaravati",
      emoji: "🌇",
      note: "AP capital region",
      value: "amaravati",
      image: "images/planner/city/amaravati.webp",
    },
    {
      label: "Other City",
      emoji: "📍",
      note: "We'll check coverage",
      value: "other",
    },
  ];

  var TARGET_CITIES = [
    "hyderabad",
    "ahmedabad",
    "chennai",
    "bengaluru",
    "pune",
    "jaipur",
    "chandigarh",
    "amaravati",
  ];

  var QUESTIONS = [
    {
      id: "city",
      title: "Where are you planning to build?",
      subtitle:
        "We tailor plans to local regulations, market rates, and terrain.",
      usp: "Local execution teams with city-specific planning and procurement.",
      type: "grid",
    },
    {
      id: "plotOwnership",
      title: "Do you already own the plot?",
      subtitle:
        "This helps us understand which stage of the journey you're at.",
      usp: "From plot planning to final handover — WeHouse supports the full journey.",
      type: "list",
      options: [
        {
          label: "Yes, I own the plot",
          value: "yes",
          icon: "✅",
          image: "images/planner/i-own-plot.webp",
        },
        {
          label: "Currently finalizing",
          value: "finalizing",
          icon: "⏳",
          image: "images/planner/currently-finalizing.webp",
        },
        {
          label: "Not yet, still planning",
          value: "no",
          icon: "🔍",
          image: "images/planner/still-planning.webp",
        },
      ],
    },
    {
      id: "plotSize",
      title: "What is your plot size?",
      subtitle:
        "We'll use your plot size to brief our team—so follow-up is relevant to your site.",
      usp: "Engineered planning aligned to your plot — not a one-size template.",
      type: "plotSizeSlider",
      options: [
        { label: "Below 100 sq yd", value: "small", icon: "📐" },
        { label: "100 – 150 sq yd", value: "medium", icon: "📏" },
        { label: "150 – 200 sq yd", value: "large", icon: "🏠" },
        { label: "200 – 250 sq yd", value: "xlarge", icon: "🏡" },
        { label: "250 – 300 sq yd", value: "xxlarge", icon: "🏘️" },
        { label: "300+ sq yd", value: "ultra", icon: "🏰" },
      ],
    },
    {
      id: "budget",
      title: "What is your expected construction budget?",
      subtitle:
        "We work across all budget bands with transparent, locked pricing.",
      usp: "Clear scope and inclusions—so expectations match before you build.",
      type: "list",
      options: [
        { label: "<40L", value: "low", note: "Smart Planning" },
        { label: "40-60L", value: "medium", note: "Well Planned" },
        { label: "60L-1Cr", value: "high", note: "Balanced Approach" },
        { label: "1-2Cr", value: "premium", note: "Thoughtfully Designed" },
        { label: "2Cr+", value: "luxury", note: "Open Possibilities" },
      ],
    },
    {
      id: "timeline",
      title: "When are you planning to start?",
      subtitle:
        "The biggest cost in construction is delay. We're built for speed.",
      usp: "Delay? We Pay Your Rent. Milestone-locked timelines, not contractor promises.",
      type: "list",
      options: [
        {
          label: "Starting Soon",
          value: "immediate",
          icon: "🚀",
          image: "images/planner/timeline/starting-soon.webp",
        },
        {
          label: "1-3 Months",
          value: "3months",
          icon: "🚗",
          image: "images/planner/timeline/1-3-months.webp",
        },
        {
          label: "3-6 Months",
          value: "6months",
          icon: "🏍️",
          image: "images/planner/timeline/3-6-months.webp",
        },
        {
          label: "6+ Months",
          value: "later",
          icon: "🚶",
          image: "images/planner/timeline/6-plus-months.webp",
        },
      ],
    },
    {
      id: "constructionType",
      title: "What are you planning to build?",
      subtitle:
        "We handle everything from compact ground floors to premium villas.",
      usp: "24 milestones. Digitally documented. Quality verified at every stage.",
      type: "grid2",
      options: [
        {
          label: "Ground Floor",
          value: "gf",
          icon: "🏠",
          image: "images/planner/home-type/ground-floor.webp",
        },
        {
          label: "G + 1",
          value: "g1",
          icon: "🏘️",
          image: "images/planner/home-type/ground-plus-1.webp",
        },
        {
          label: "G + 2",
          value: "g2",
          icon: "🏗️",
          image: "images/planner/home-type/ground-plus-2.webp",
        },
        {
          label: "Duplex",
          value: "duplex",
          icon: "🏛️",
          image: "images/planner/home-type/duplex.webp",
        },
        {
          label: "Villa",
          value: "villa",
          icon: "🏰",
          image: "images/planner/home-type/villa.webp",
        },
        {
          label: "Custom Home",
          value: "custom",
          icon: "✨",
          image: "images/planner/home-type/custom-home.webp",
        },
      ],
    },
  ];

  /* ── Stage labels ── */
  var STAGE_LABELS = [
    "EMPTY PLOT",
    "BLUEPRINT DESIGN",
    "FOUNDATION WORK",
    "STRUCTURE & COLUMNS",
    "WALLS & MEP",
    "FINISHING TOUCHES",
    "HANDOVER READY",
  ];

  /* ── State ── */
  var state = {
    screen: "quiz", // quiz | contact | nameCapture | result | referral | thanks
    stepIndex: 0,
    answers: {},
    contact: {},
    leadType: null,
    currentAnswer: null,
  };

  var PLOT_SIZE_STEPS = [
    {
      value: "small",
      label: "Below 100 sq yards",
      sliderLabel: "Below 100",
      scale: 0.6,
      title: "Smart Compact Living",
      subtitle: "Perfect for a Cozy Modern Home",
    },
    {
      value: "medium",
      label: "100–150 sq yards",
      sliderLabel: "100–150",
      scale: 0.75,
      title: "Efficient Space. Smart Design",
      subtitle: "Ideal for a Stylish G+1 Home",
    },
    {
      value: "large",
      label: "150–200 sq yards",
      sliderLabel: "150–200",
      scale: 0.9,
      title: "Balanced Space. Better Living",
      subtitle: "Perfect for a Comfortable G+1 Home",
    },
    {
      value: "xlarge",
      label: "200–250 sq yards",
      sliderLabel: "200–250",
      scale: 1.05,
      title: "More Space. More Freedom",
      subtitle: "Ideal for a Spacious Family Home",
    },
    {
      value: "xxlarge",
      label: "250–300 sq yards",
      sliderLabel: "250–300",
      scale: 1.2,
      title: "Upgrade to Premium Living",
      subtitle: "Perfect for a Luxury Villa Experience",
    },
    {
      value: "ultra",
      label: "300+ sq yards",
      sliderLabel: "300+",
      scale: 1.35,
      title: "Build Without Limits",
      subtitle: "Ideal for a Grand Villa with Lawn & Parking",
    },
  ];

  /* ── DOM refs (populated in init to avoid top-level null errors) ── */
  var screenHero, screenApp, heroStartBtn;
  var contentQuiz,
    contentContact,
    contentNameCapture,
    contentResult,
    contentReferral,
    contentThanks;
  var progressFill, progressLabel, progressPct;
  var questionTitle, questionSubtitle, quizOptions, quizUsp, uspText;
  var navBack, navNext, plannerNav;
  // Right companion panel (desktop)
  var rightBadgeText,
    rightTitle,
    rightSubtitle,
    rightList,
    rightMiniRow,
    rightTags,
    rightMedia;

  /* ── Lead scoring ── */
  function scoreLeads(answers) {
    var score = 0;
    var isTarget = TARGET_CITIES.indexOf(answers.city) >= 0;

    if (isTarget) score += 30;
    if (answers.plotOwnership === "yes") score += 25;
    if (answers.plotOwnership === "finalizing") score += 15;
    if (
      answers.budget === "high" ||
      answers.budget === "premium" ||
      answers.budget === "luxury"
    )
      score += 20;
    if (answers.budget === "medium") score += 12;
    if (answers.timeline === "immediate" || answers.timeline === "3months")
      score += 25;
    if (answers.timeline === "6months") score += 12;

    if (!isTarget) return "other";
    if (score >= 70) return "hot";
    if (score >= 40) return "warm";
    return "nurture";
  }

  /* ── Right panel content (step-aware) ── */
  function titleCase(s) {
    if (!s) return "";
    return String(s).charAt(0).toUpperCase() + String(s).slice(1);
  }

  function budgetLabel(v) {
    if (v === "low") return "Below ₹40L";
    if (v === "medium") return "₹40L – ₹60L";
    if (v === "high") return "₹60L – ₹1Cr";
    if (v === "premium") return "₹1Cr – ₹2Cr";
    if (v === "luxury") return "₹2Cr+";
    return "";
  }

  function formatBudgetAmount(text) {
    return String(text || "").replace(
      /(Cr|L)/g,
      "<span class='planner-budget-unit'>$1</span>",
    );
  }

  function budgetSavingsData(value) {
    if (value === "low") {
      return { prefix: "You can save up to", amount: "₹3–5 Lakhs" };
    }
    if (value === "medium") {
      return { prefix: "You can save up to", amount: "₹5–8 Lakhs" };
    }
    if (value === "high") {
      return { prefix: "You can save up to", amount: "₹8–12 Lakhs" };
    }
    if (value === "premium") {
      return { prefix: "You can save up to", amount: "₹12–20 Lakhs" };
    }
    if (value === "luxury") {
      return { prefix: "You can save", amount: "₹20 Lakhs+" };
    }
    return null;
  }

  function plotSizeLabel(v) {
    if (v === "small") return "Below 100 sq yd";
    if (v === "medium") return "100 – 150 sq yd";
    if (v === "large") return "150 – 200 sq yd";
    if (v === "xlarge") return "200 – 250 sq yd";
    if (v === "xxlarge") return "250 – 300 sq yd";
    if (v === "ultra") return "300+ sq yd";
    return "";
  }

  function getPlotStepByValue(value) {
    for (var i = 0; i < PLOT_SIZE_STEPS.length; i++) {
      if (PLOT_SIZE_STEPS[i].value === value) return PLOT_SIZE_STEPS[i];
    }
    return PLOT_SIZE_STEPS[2];
  }

  function getPlotStepByIndex(index) {
    var idx = Math.max(0, Math.min(PLOT_SIZE_STEPS.length - 1, Number(index) || 0));
    return PLOT_SIZE_STEPS[idx];
  }

  function emphasizePlotText(text) {
    return String(text || "")
      .replace(
        /(Smart|Compact Living|Efficient Space|Balanced Space|Freedom|Premium Living|Without Limits|Cozy Modern Home|Luxury Villa|Grand Villa|Lawn|Parking|G\+1|Spacious Family Home)/g,
        "<span class='plot-copy-accent'>$1</span>",
      );
  }

  function renderPlotSizeSlider() {
    var selectedValue = state.currentAnswer || state.answers.plotSize || "large";
    var selectedStep = getPlotStepByValue(selectedValue);
    var selectedIndex = PLOT_SIZE_STEPS.indexOf(selectedStep);
    var sliderMarkersHtml = "";
    for (var i = 0; i < PLOT_SIZE_STEPS.length; i++) {
      sliderMarkersHtml +=
        "<span class='plot-step-marker" +
        (i === selectedIndex ? " active" : "") +
        "' data-step-index='" +
        i +
        "' style='--marker-left:" +
        (i * 100) / (PLOT_SIZE_STEPS.length - 1) +
        "%'>" +
        "<span class='plot-dot" +
        (i <= selectedIndex ? " active" : "") +
        "'></span>" +
        "<span class='plot-step-label" +
        (i === selectedIndex ? " active" : "") +
        "'>" +
        PLOT_SIZE_STEPS[i].sliderLabel +
        "</span>" +
        "</span>";
    }

    var wrapper = document.createElement("div");
    wrapper.className = "plot-size-selector";
    wrapper.innerHTML =
      "<div class='plot-visual-stage'>" +
      "<div class='plot-square' id='plot-square' style='--plot-scale:" +
      selectedStep.scale +
      ";--plot-shadow-level:" +
      (selectedIndex + 1) +
      ";'>" +
      "<div class='plot-grid'></div>" +
      "</div>" +
      "</div>" +
      "<div class='plot-size-label' id='plot-size-label'>" +
      selectedStep.label +
      "</div>" +
      "<div class='plot-copy-title' id='plot-copy-title'>" +
      emphasizePlotText(selectedStep.title) +
      "</div>" +
      "<div class='plot-copy-subtitle' id='plot-copy-subtitle'>" +
      emphasizePlotText(selectedStep.subtitle) +
      "</div>" +
      "<div class='plot-slider-wrap'>" +
      "<input id='plot-size-range' class='plot-size-range' type='range' min='0' max='5' step='1' value='" +
      selectedIndex +
      "' style='--plot-slider-progress:" +
      (selectedIndex / (PLOT_SIZE_STEPS.length - 1)) * 100 +
      "%;" +
      "' aria-label='Select plot size' />" +
      "<div class='plot-slider-scale'>" +
      sliderMarkersHtml +
      "</div>" +
      "<div class='plot-slider-hint'>Slide to select your space</div>" +
      "</div>";

    quizOptions.appendChild(wrapper);

    var slider = document.getElementById("plot-size-range");
    var square = document.getElementById("plot-square");
    var labelEl = document.getElementById("plot-size-label");
    var copyTitleEl = document.getElementById("plot-copy-title");
    var copySubtitleEl = document.getElementById("plot-copy-subtitle");
    var markerEls = wrapper.querySelectorAll(".plot-step-marker");
    var dotEls = wrapper.querySelectorAll(".plot-dot");
    var stepLabelEls = wrapper.querySelectorAll(".plot-step-label");

    function updateByIndex(index, addPulse) {
      var step = getPlotStepByIndex(index);
      var idx = PLOT_SIZE_STEPS.indexOf(step);
      state.currentAnswer = step.value;
      if (square) {
        square.style.setProperty("--plot-scale", step.scale);
        square.style.setProperty("--plot-shadow-level", idx + 1);
        if (addPulse) {
          square.classList.remove("plot-square-stop-pulse");
          void square.offsetWidth;
          square.classList.add("plot-square-stop-pulse");
        }
      }
      if (labelEl) labelEl.textContent = step.label;
      if (copyTitleEl) copyTitleEl.innerHTML = emphasizePlotText(step.title);
      if (copySubtitleEl) copySubtitleEl.innerHTML = emphasizePlotText(step.subtitle);
      if (slider) {
        slider.style.setProperty(
          "--plot-slider-progress",
          (idx / (PLOT_SIZE_STEPS.length - 1)) * 100 + "%",
        );
      }
      if (dotEls && dotEls.length) {
        for (var i = 0; i < dotEls.length; i++) {
          var isActive = i <= idx;
          dotEls[i].classList.toggle("active", isActive);
        }
      }
      if (stepLabelEls && stepLabelEls.length) {
        for (var j = 0; j < stepLabelEls.length; j++) {
          stepLabelEls[j].classList.toggle("active", j === idx);
        }
      }
      if (markerEls && markerEls.length) {
        for (var k = 0; k < markerEls.length; k++) {
          markerEls[k].classList.toggle("active", k === idx);
        }
      }
      updateNextBtn();
    }

    updateByIndex(selectedIndex, false);

    if (slider) {
      slider.addEventListener("input", function () {
        updateByIndex(slider.value, false);
      });
      slider.addEventListener("change", function () {
        updateByIndex(slider.value, true);
      });
      slider.addEventListener("pointerup", function () {
        updateByIndex(slider.value, true);
      });
      slider.addEventListener("keyup", function () {
        updateByIndex(slider.value, true);
      });
    }

    if (markerEls && markerEls.length) {
      for (var m = 0; m < markerEls.length; m++) {
        markerEls[m].addEventListener("click", function () {
          var idx = Number(this.getAttribute("data-step-index"));
          if (Number.isNaN(idx)) return;
          if (slider) slider.value = idx;
          updateByIndex(idx, true);
        });
      }
    }
  }

  function timelineLabel(v) {
    if (v === "immediate") return "Starting Soon";
    if (v === "3months") return "1-3 Months";
    if (v === "6months") return "3-6 Months";
    if (v === "later") return "6+ Months";
    if (v === "exploring") return "Just exploring";
    return "";
  }

  function buildTypeLabel(v) {
    if (v === "gf") return "Ground Floor";
    if (v === "g1") return "G + 1";
    if (v === "g2") return "G + 2";
    if (v === "duplex") return "Duplex";
    if (v === "villa") return "Villa";
    if (v === "custom") return "Custom Home";
    return "";
  }

  function setRightList(items) {
    if (!rightList) return;
    rightList.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
      var li = document.createElement("li");
      li.className = "right-li";
      li.innerHTML =
        "<div class='right-li-icon'>✦</div>" +
        "<div class='right-li-text'>" +
        items[i] +
        "</div>";
      rightList.appendChild(li);
    }
  }

  function setRightMinis(minis) {
    if (!rightMiniRow) return;
    if (!minis || !minis.length) {
      rightMiniRow.style.display = "none";
      rightMiniRow.innerHTML = "";
      return;
    }
    rightMiniRow.style.display = "grid";
    rightMiniRow.innerHTML = "";
    for (var i = 0; i < minis.length; i++) {
      var box = document.createElement("div");
      box.className = "right-mini";
      box.innerHTML =
        "<div class='right-mini-k'>" +
        minis[i].k +
        "</div>" +
        "<div class='right-mini-v'>" +
        minis[i].v +
        "</div>";
      rightMiniRow.appendChild(box);
    }
  }

  function setRightTags(tags) {
    if (!rightTags) return;
    if (!tags || !tags.length) {
      rightTags.style.display = "none";
      rightTags.innerHTML = "";
      return;
    }
    rightTags.style.display = "flex";
    rightTags.innerHTML = "";
    for (var i = 0; i < tags.length; i++) {
      var t = document.createElement("div");
      t.className = "right-tag";
      t.textContent = tags[i];
      rightTags.appendChild(t);
    }
  }

  function setRightMedia(html) {
    if (!rightMedia) return;
    if (!html) {
      html = getRightStepVideoHtml();
    }
    if (!html) {
      rightMedia.style.display = "none";
      rightMedia.innerHTML = "";
      return;
    }
    rightMedia.style.display = "block";
    rightMedia.innerHTML = html;
  }

  function getStepVideoSrcForIndex(index) {
    if (index < 0 || !STEP_VIDEO_FILES.length) return "";
    var fileIndex = Math.min(index, STEP_VIDEO_FILES.length - 1);
    return basePath + STEP_VIDEO_FILES[fileIndex];
  }

  function getRightStepVideoHtml() {
    var index = -1;
    if (state.screen === "quiz") {
      index = state.stepIndex;
    } else if (state.screen === "contact") {
      index = QUESTIONS.length;
    } else {
      return "";
    }
    var src = getStepVideoSrcForIndex(index);
    if (!src) return "";
    // Keep it muted/inline for reliable autoplay across browsers.
    return (
      "<video src='" +
      src +
      "' autoplay muted playsinline preload='metadata' class='planner-step-video'></video>"
    );
  }

  function prefetchStepVideoByIndex(index) {
    var src = getStepVideoSrcForIndex(index);
    if (!src || prefetchedStepVideos[src]) return;
    prefetchedStepVideos[src] = true;

    // Hint browser to fetch upcoming step videos at low priority.
    var link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "video";
    link.href = src;
    document.head.appendChild(link);
  }

  function prefetchUpcomingStepVideos() {
    if (state.screen !== "quiz") return;
    prefetchStepVideoByIndex(state.stepIndex + 1);
    prefetchStepVideoByIndex(state.stepIndex + 2);
  }

  function renderRightPanel() {
    if (!rightTitle || !rightSubtitle || !rightBadgeText) return;

    // Badge text: step or screen
    if (state.screen === "quiz") {
      rightBadgeText.textContent = "DREAM HOME PLANNER";
    } else if (state.screen === "contact") {
      rightBadgeText.textContent = "STEP 1 OF 2";
    } else if (state.screen === "nameCapture") {
      rightBadgeText.textContent = "STEP 2 OF 2";
    } else if (state.screen === "result") {
      rightBadgeText.textContent = "YOUR RESULT";
    } else if (state.screen === "referral") {
      rightBadgeText.textContent = "REFER & EARN";
    } else if (state.screen === "thanks") {
      rightBadgeText.textContent = "HOME JOURNEY STARTED";
    } else {
      rightBadgeText.textContent = "DREAM HOME PLANNER";
    }

    // Screen-level panels
    if (state.screen === "contact") {
      setRightMedia(null);
      rightTitle.textContent = "Quick mobile verification step";
      rightSubtitle.textContent =
        "This helps us route your project to the right local team.";
      setRightList([
        "Only project-relevant communication.",
        "No spam. No generic sales scripts.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (state.screen === "nameCapture") {
      setRightMedia(null);
      rightTitle.textContent = "Let’s Start Building Your Home";
      rightSubtitle.textContent =
        "Tell us your name so we can personalize your home journey.";
      setRightList([
        "Your response personalizes your build plan.",
        "Our team will connect shortly with next steps.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (state.screen === "referral") {
      setRightMedia(null);
      rightTitle.textContent = "Referral = real help";
      rightSubtitle.textContent =
        "Share a friend’s details — our team will guide them the same way.";
      setRightList([
        "We reach out within 24 hours.",
        "We handle it end-to-end.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (state.screen === "thanks") {
      setRightMedia(null);
      rightTitle.textContent = "You’re all set";
      rightSubtitle.textContent =
        "We’ve received your details. A WeHouse expert will connect soon.";
      setRightList([
        "A WeHouse expert will connect within 24 hours.",
        "You’ll get a clear next-step plan.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (state.screen === "result") {
      setRightMedia(null);
      var lt = state.leadType || scoreLeads(state.answers);
      if (lt === "hot") {
        rightTitle.textContent = "You look ready to build";
        rightSubtitle.textContent =
          "Best move now: lock scope + timeline before costs drift.";
        setRightList([
          "Lock scope and inclusions early to avoid cost creep.",
          "Start approvals + design to save weeks.",
        ]);
        setRightMinis(null);
        setRightTags(["Delay? We Pay Rent", "Clear next steps"]);
      } else if (lt === "warm") {
        rightTitle.textContent = "Perfect time to plan";
        rightSubtitle.textContent =
          "You’re early enough to optimize budget and avoid rework.";
        setRightList([
          "Convert requirements into a locked scope.",
          "Prepare approvals so you can start without delay.",
        ]);
        setRightMinis(null);
        setRightTags(null);
      } else if (lt === "other") {
        rightTitle.textContent = "Checking coverage";
        rightSubtitle.textContent =
          "WeHouse is expanding. We’ll confirm feasibility for your city.";
        setRightList([
          "We’ll verify service availability for your location.",
          "We’ll share next steps.",
        ]);
        setRightMinis(null);
        setRightTags(null);
      } else {
        rightTitle.textContent = "Start with knowledge";
        rightSubtitle.textContent =
          "Early planning is the best time to build clarity and avoid bad decisions.";
        setRightList([
          "Understand true construction costs beyond ₹/sqft.",
          "Know what to demand from any builder.",
        ]);
        setRightMinis(null);
        setRightTags(null);
      }
      return;
    }

    // Quiz step panels
    var q = QUESTIONS[state.stepIndex];
    var city = state.answers.city;
    var cityLabel = city ? titleCase(city) : "";
    var commonTags = ["24 Milestones", "Digital Tracking", "Live CCTV"];

    if (!q) {
      rightTitle.textContent = "Build smarter, not harder.";
      rightSubtitle.textContent =
        "Answer a few questions on the left — we’ll tailor the right next step for you.";
      setRightList([
        "Milestone-based execution with documented quality checks.",
        "Live CCTV monitoring and digital tracking throughout the build.",
      ]);
      setRightMinis(null);
      setRightTags(commonTags);
      return;
    }

    if (q.id === "city") {
      setRightMedia(null);
      rightTitle.textContent = cityLabel
        ? cityLabel + " planning, done right"
        : "City-specific planning matters";
      rightSubtitle.textContent =
        "Local rules and ground realities affect cost and timeline.";
      setRightList([
        "City-specific planning and execution teams.",
        "Clear next step after your answers.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (q.id === "plotOwnership") {
      setRightMedia(null);
      var own = state.answers.plotOwnership;
      rightTitle.textContent = "Your journey stage";
      rightSubtitle.textContent =
        "WeHouse can support from plot finalization to handover — but the best next step depends on where you are today.";
      setRightList([
        own === "yes"
          ? "Great — next we align design + approvals + budget so you can start clean."
          : own === "finalizing"
            ? "We can plan budget + requirements now so you can start fast once finalized."
            : "We can help you shortlist plots that avoid costly approval/structural surprises.",
        "Transparent scope prevents last-minute add-ons.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (q.id === "plotSize") {
      setRightMedia(null);
      var ps = plotSizeLabel(state.answers.plotSize);
      rightTitle.textContent = "Design + structure depend on plot size";
      rightSubtitle.textContent =
        "Bigger isn’t always harder — but it changes structure, MEP routing, and cost drivers.";
      setRightList([
        "We engineer plans to your plot — not templates.",
        "Early MEP planning avoids expensive rework.",
      ]);
      setRightMinis([
        { k: "SELECTED", v: ps || "Choose on left" },
        { k: "FOCUS", v: "No rework" },
      ]);
      setRightTags(null);
      return;
    }

    if (q.id === "budget") {
      setRightMedia(null);
      var b = budgetLabel(state.answers.budget);
      rightTitle.textContent = "Budget should feel predictable";
      rightSubtitle.textContent =
        "Most construction blow-ups happen because scope and inclusions aren’t locked early.";
      setRightList([
        "Clear inclusions/exclusions — no vague ‘₹/sqft’ games.",
        "Finish-level choices handled upfront.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (q.id === "timeline") {
      setRightMedia(null);
      var tl = timelineLabel(state.answers.timeline);
      rightTitle.textContent = "Timeline is a cost lever";
      rightSubtitle.textContent =
        "Delays aren’t just annoying — they change material prices, labor availability, and rent overlap.";
      setRightList([
        "We plan approvals + procurement to reduce idle time.",
        "Milestone timelines keep everyone accountable.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    if (q.id === "constructionType") {
      setRightMedia(null);
      var bt = buildTypeLabel(state.answers.constructionType);
      rightTitle.textContent = "Scope defines cost and speed";
      rightSubtitle.textContent =
        "Floors, spans, and finish level drive structure and MEP complexity.";
      setRightList([
        "MEP planning early prevents expensive break-and-fix later.",
        "Quality checks are documented at each stage.",
      ]);
      setRightMinis(null);
      setRightTags(null);
      return;
    }

    // Fallback
    rightTitle.textContent = "Your plan is taking shape";
    rightSubtitle.textContent =
      "Every answer helps tailor the best next step for your build.";
    setRightList([
      "We’ll convert your answers into a clear plan and next action.",
      "Milestone execution and documented scope reduce delivery risk.",
    ]);
    setRightMedia(null);
    setRightMinis(null);
    setRightTags(commonTags);
  }

  /* ── Show screen ── */
  function showScreen(name) {
    state.screen = name;

    if (screenHero)
      screenHero.style.display = name === "hero" ? "flex" : "none";
    if (screenApp) screenApp.style.display = name !== "hero" ? "grid" : "none";
    if (screenApp) {
      var isLeadCaptureScreen = name === "contact" || name === "nameCapture";
      screenApp.classList.toggle("lead-capture-fullwidth", isLeadCaptureScreen);
    }

    if (name !== "hero") {
      if (contentQuiz)
        contentQuiz.style.display = name === "quiz" ? "block" : "none";
      if (contentContact)
        contentContact.style.display = name === "contact" ? "block" : "none";
      if (contentNameCapture)
        contentNameCapture.style.display = name === "nameCapture" ? "block" : "none";
      if (contentResult)
        contentResult.style.display = name === "result" ? "block" : "none";
      if (contentReferral)
        contentReferral.style.display = name === "referral" ? "block" : "none";
      if (contentThanks)
        contentThanks.style.display = name === "thanks" ? "block" : "none";
      if (plannerNav)
        plannerNav.style.display =
          name === "quiz" || name === "contact" || name === "nameCapture"
            ? "flex"
            : "none";
    }

    window.scrollTo(0, 0);
    renderRightPanel();
    if (name === "contact") {
      refreshPlannerOtpPhoneHint();
    }
    updateNextBtn();
  }

  /* ── Update progress ── */
  function updateProgress(stepIndex) {
    var total = QUESTIONS.length + 1; // +1 for contact
    var pct = Math.round(((stepIndex + 1) / total) * 100);
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressLabel)
      progressLabel.textContent = "STEP " + (stepIndex + 1) + " OF " + total;
    if (progressPct) progressPct.textContent = pct + "%";
  }

  /* ── Update build visual stage ── */
  function updateVisualStage(stage) {
    var svgs = document.querySelectorAll(".build-stage-svg");
    for (var i = 0; i < svgs.length; i++) {
      var el = svgs[i];
      var s = parseInt(el.getAttribute("data-stage"), 10);
      el.style.display = s === stage ? "block" : "none";
    }
    if (stageLabel)
      stageLabel.textContent =
        STAGE_LABELS[Math.min(stage, STAGE_LABELS.length - 1)] || "";

    // Update milestone pills
    if (milestonePills && milestonePills.length) {
      for (var j = 0; j < milestonePills.length; j++) {
        var pill = milestonePills[j];
        var idx = parseInt(pill.getAttribute("data-pill"), 10);
        var check = pill.querySelector(".pill-check");
        if (idx < stage) {
          pill.className = "milestone-pill done";
          if (check) check.style.display = "inline";
        } else {
          pill.className = "milestone-pill pending";
          if (check) check.style.display = "none";
        }
      }
    }
  }

  /* ── Render a question step ── */
  function renderStep(stepIndex) {
    var q = QUESTIONS[stepIndex];
    if (!q) return;

    questionTitle.textContent = q.title;
    questionSubtitle.textContent = q.subtitle;

    if (q.usp) {
      uspText.textContent = q.usp;
      quizUsp.style.display = "flex";
    } else {
      quizUsp.style.display = "none";
    }

    quizOptions.innerHTML = "";

    if (q.id === "plotSize") {
      renderPlotSizeSlider();
      return;
    }

    var isGrid = q.type === "grid";
    var isGrid2 = q.type === "grid2";
    var options = isGrid ? CITIES : q.options;
    var isCityGrid = !!(q && q.id === "city");
    var isPlotOwnership = !!(q && q.id === "plotOwnership");
    var isBudgetStep = !!(q && q.id === "budget");
    var isTimelineStep = !!(q && q.id === "timeline");
    var isConstructionType = !!(q && q.id === "constructionType");

    var wrapper = document.createElement("div");

    if (isConstructionType) {
      wrapper.className = "planner-home-type-grid";
      wrapper.style.cssText =
        "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px";
    } else if (isGrid || isGrid2) {
      wrapper.style.cssText =
        "display:grid;grid-template-columns:repeat(auto-fill,minmax(" +
        (isGrid ? "130px" : "110px") +
        ",1fr));gap:10px";
    } else if (isTimelineStep) {
      wrapper.className = "planner-timeline-grid";
      wrapper.style.cssText =
        "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px";
    } else if (isBudgetStep) {
      wrapper.className = "planner-budget-grid";
      wrapper.style.cssText =
        "display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px";
    } else if (isPlotOwnership) {
      wrapper.className = "planner-plot-ownership-grid";
      wrapper.style.cssText =
        "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px";
    } else {
      wrapper.style.cssText = "display:flex;flex-direction:column;gap:10px";
    }

    var accent = "#F97316";
    try {
      var cssAccent = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--planner-accent");
      if (cssAccent && cssAccent.trim()) accent = cssAccent.trim();
    } catch (e) {}
    var selectedBudgetValue = null;

    options.forEach(function (opt) {
      var value = opt.value || opt.label;
      var label = opt.label;
      var note = opt.note || null;
      var imgRel = opt.image || null;
      var icon = opt.icon || opt.emoji || null;
      var selected =
        state.currentAnswer === value ||
        (state.currentAnswer === null && state.answers[q.id] === value);
      if (isBudgetStep && selected) selectedBudgetValue = value;

      var card = document.createElement("div");
      var isCityWithoutImage = isCityGrid && !imgRel;
      card.className =
        "planner-option-card" +
        (isGrid || isGrid2 ? " grid-card" : "") +
        (isConstructionType ? " planner-home-type-card" : "") +
        (isTimelineStep ? " planner-timeline-card" : "") +
        (isBudgetStep ? " planner-budget-card" : "") +
        (isPlotOwnership ? " planner-plot-ownership-card" : "") +
        (isCityGrid ? " planner-city-card" : "") +
        (isCityWithoutImage ? " planner-city-card-no-image" : "") +
        (selected ? " selected" : "");
      card.setAttribute("data-value", value);

      if (isGrid || isGrid2) {
        if (isCityGrid) {
          var cityMediaHtml = "";
          var cityOverlayHtml = "<div class='planner-city-overlay'></div>";
          if (imgRel) {
            var imgSrc = basePath + imgRel;
            cityMediaHtml =
              "<img src='" +
              imgSrc +
              "' alt='" +
              label +
              "' class='planner-city-img' loading='lazy' decoding='async' />";
          } else {
            cityOverlayHtml = "";
          }

          card.innerHTML =
            cityMediaHtml +
            cityOverlayHtml +
            "<div class='planner-city-meta'>" +
            "<div class='planner-city-title' style='color:" +
            (selected ? accent : "#fff") +
            "'>" +
            label +
            "</div>" +
            (note ? "<div class='planner-city-note'>" + note + "</div>" : "") +
            "</div>" +
            (selected
              ? "<div class='planner-option-check'><svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'><polyline points='20 6 9 17 4 12'/></svg></div>"
              : "");
        } else {
          var thumbHtml = "";
          var imgSrc2 = basePath + (imgRel || DEFAULT_OPTION_PLACEHOLDER_IMG_REL);
          thumbHtml =
            "<img src='" +
            imgSrc2 +
            "' alt='" +
            label +
            "' class='planner-option-thumb' loading='lazy' decoding='async' />";

          card.innerHTML =
            thumbHtml +
            "<span class='planner-option-title' style='color:" +
            (selected ? accent : "rgba(255,255,255,0.85)") +
            "'>" +
            label +
            "</span>" +
            (note
              ? "<span class='planner-option-note'>" +
                note +
                "</span>"
              : "") +
            (selected
              ? "<div class='planner-option-check'><svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'><polyline points='20 6 9 17 4 12'/></svg></div>"
              : "");
        }
      } else {
        if (isTimelineStep) {
          var timelineMedia = "";
          if (imgRel) {
            var timelineImgSrc = basePath + imgRel;
            timelineMedia =
              "<img src='" +
              timelineImgSrc +
              "' alt='" +
              label +
              "' class='planner-timeline-img' loading='lazy' decoding='async' />";
          } else {
            timelineMedia =
              "<div class='planner-timeline-emoji'>" +
              (icon || "⏱️") +
              "</div>";
          }

          card.innerHTML =
            "<div class='planner-timeline-title'>" +
            label +
            "</div>" +
            (note ? "<div class='planner-timeline-note'>" + note + "</div>" : "") +
            "<div class='planner-timeline-media'>" +
            timelineMedia +
            "</div>" +
            (selected
              ? "<div class='planner-option-check'><svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'><polyline points='20 6 9 17 4 12'/></svg></div>"
              : "");
        } else if (isBudgetStep) {
          card.innerHTML =
            "<div class='planner-budget-amount'>" +
            formatBudgetAmount(label) +
            "</div>" +
            "<div class='planner-budget-divider'></div>" +
            (note ? "<div class='planner-budget-note'>" + note + "</div>" : "") +
            (selected
              ? "<div class='planner-option-check'><svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'><polyline points='20 6 9 17 4 12'/></svg></div>" +
                "<span class='planner-budget-sparkle s1'></span>" +
                "<span class='planner-budget-sparkle s2'></span>" +
                "<span class='planner-budget-sparkle s3'></span>" +
                "<span class='planner-budget-sparkle s4'></span>"
              : "");
        } else {
          var thumbHtmlList = "";
          var imgSrc3 =
            basePath + (imgRel || DEFAULT_OPTION_PLACEHOLDER_IMG_REL);
          thumbHtmlList =
            "<img src='" +
            imgSrc3 +
            "' alt='" +
            label +
            "' class='planner-option-thumb' loading='lazy' decoding='async' />";

          card.innerHTML =
            thumbHtmlList +
            "<span class='planner-option-title planner-option-title--wide' style='color:" +
            (selected ? accent : "rgba(255,255,255,0.85)") +
            "'>" +
            label +
            "</span>" +
            (selected
              ? "<div style='width:20px;height:20px;border-radius:50%;background:" +
                accent +
                ";display:flex;align-items:center;justify-content:center;flex-shrink:0'><svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'><polyline points='20 6 9 17 4 12'/></svg></div>"
              : "");
        }
      }

      card.addEventListener("click", function () {
        handleOptionSelect(value);
      });

      wrapper.appendChild(card);
    });

    quizOptions.appendChild(wrapper);

    if (isBudgetStep && selectedBudgetValue) {
      var savings = budgetSavingsData(selectedBudgetValue);
      if (savings) {
        var savingsEl = document.createElement("div");
        savingsEl.className = "planner-budget-savings";
        savingsEl.innerHTML =
          "<span class='planner-budget-savings-icon'>✨</span>" +
          "<span class='planner-budget-savings-prefix'>" +
          savings.prefix +
          " </span>" +
          "<span class='planner-budget-savings-amount'>" +
          savings.amount +
          "</span>";
        wrapper.appendChild(savingsEl);

        setTimeout(function () {
          savingsEl.classList.add("show");
        }, 200);
      }

      var selectedCard = wrapper.querySelector(".planner-budget-card.selected");
      if (selectedCard) {
        setTimeout(function () {
          selectedCard.classList.add("planner-budget-celebrate");
        }, 100);
        setTimeout(function () {
          selectedCard.classList.remove("planner-budget-celebrate");
        }, 560);
      }
    }
  }

  /* ── Handle option select ── */
  function handleOptionSelect(value) {
    state.currentAnswer = value;
    var q = QUESTIONS[state.stepIndex];
    if (q) renderStep(state.stepIndex); // re-render to reflect selection
    updateNextBtn();

    // Auto-advance for list + city grid (step 1) — short delay so user sees selection
    var q2 = QUESTIONS[state.stepIndex];
    if (q2 && q2.id !== "plotSize" && (q2.type === "list" || q2.id === "city")) {
      var autoAdvanceDelay = q2.id === "budget" ? 620 : 350;
      setTimeout(function () {
        if (state.currentAnswer === value) handleNext();
      }, autoAdvanceDelay);
    }
  }

  /* ── Next button state ── */
  function updateNextBtn() {
    if (!navNext) return;
    var isContact = state.screen === "contact";
    var isNameCapture = state.screen === "nameCapture";
    if (isContact) {
      var phone = document.getElementById("contact-phone");
      var p10 =
        phone && phone.value.trim()
          ? normalizePhone10Planner(phone.value)
          : null;
      var otpOk =
        p10 &&
        state.contact.phoneVerifiedToken &&
        state.contact.otpPhone10 === p10;
      navNext.disabled = !(phone && phone.value.trim() && otpOk);
      navNext.textContent = "Continue →";
      var pHint = document.getElementById("planner-contact-hint");
      if (pHint) {
        pHint.style.display =
          phone && phone.value.trim() && !otpOk ? "block" : "none";
      }
      navNext.style.opacity = navNext.disabled ? "0.55" : "";
    } else if (isNameCapture) {
      var name = document.getElementById("contact-name");
      var emailF = document.getElementById("contact-email");
      var nameOk = name && name.value.trim();
      var em = emailF ? emailF.value.trim() : "";
      var emailOk = em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      navNext.disabled = !(nameOk && emailOk);
      navNext.textContent = "Start My Home Journey";
      navNext.style.opacity = navNext.disabled ? "0.55" : "";
    } else {
      var hasAnswer =
        state.currentAnswer !== null ||
        state.answers[
          QUESTIONS[state.stepIndex] && QUESTIONS[state.stepIndex].id
        ] !== undefined;
      navNext.disabled = !hasAnswer;
      var isLast = state.stepIndex === QUESTIONS.length - 1;
      navNext.textContent = isLast ? "Almost There →" : "Continue →";
      navNext.style.opacity = navNext.disabled ? "0.55" : "";
    }
  }

  /* ── Navigate to quiz step ── */
  function goToStep(index) {
    state.stepIndex = index;
    state.currentAnswer = null;
    var q = QUESTIONS[index];
    if (q && q.id === "plotSize") {
      state.currentAnswer = state.answers.plotSize || "large";
    }

    updateProgress(index);
    renderStep(index);
    updateNextBtn();
    renderRightPanel();
    prefetchUpcomingStepVideos();

    if (navBack) navBack.style.display = index === 0 ? "none" : "";

    // Scroll left panel to top
    var left = document.getElementById("planner-left");
    if (left) left.scrollTop = 0;
  }

  /* ── Handle Next ── */
  function handleNext() {
    if (state.screen === "contact") {
      var phoneEl = document.getElementById("contact-phone");
      var phoneErrEl = document.getElementById("contact-error");
      var phone = phoneEl ? phoneEl.value.trim() : "";
      if (!phone) {
        if (phoneErrEl) {
          phoneErrEl.textContent = "Please enter your mobile number.";
          phoneErrEl.style.display = "block";
        }
        return;
      }
      if (phoneErrEl) phoneErrEl.style.display = "none";
      var p10Check = normalizePhone10Planner(phone);
      if (
        !state.contact.phoneVerifiedToken ||
        !p10Check ||
        state.contact.otpPhone10 !== p10Check
      ) {
        if (phoneErrEl) {
          phoneErrEl.textContent =
            "Verify your mobile with OTP (Send OTP → Verify).";
          phoneErrEl.style.display = "block";
        }
        return;
      }
      state.contact.phone = phone;
      showScreen("nameCapture");
      updateNextBtn();
      if (navBack) navBack.style.display = "";
      return;
    }
    if (state.screen === "nameCapture") {
      submitPlanner();
      return;
    }

    // Save current answer
    var q = QUESTIONS[state.stepIndex];
    if (!q) return;
    var value = state.currentAnswer;
    if (value === null) return;
    state.answers[q.id] = value;
    state.currentAnswer = null;

    if (state.stepIndex < QUESTIONS.length - 1) {
      goToStep(state.stepIndex + 1);
    } else {
      // Go to contact
      showScreen("contact");
      updateNextBtn();
      if (navBack) navBack.style.display = "";
    }
  }

  /* ── Handle Back ── */
  function handleBack() {
    if (state.screen === "nameCapture") {
      showScreen("contact");
      updateNextBtn();
      if (navBack) navBack.style.display = "";
      return;
    }
    if (state.screen === "contact") {
      showScreen("quiz");
      goToStep(QUESTIONS.length - 1);
      return;
    }
    if (state.stepIndex === 0) {
      goToStep(0);
      return;
    }
    goToStep(state.stepIndex - 1);
  }

  /* ── Submit planner form ── */
  function submitPlanner() {
    var nameEl = document.getElementById("contact-name");
    var emailEl = document.getElementById("contact-email");
    var phoneEl = document.getElementById("contact-phone");
    var errEl = document.getElementById("contact-error");
    var nameErrEl = document.getElementById("name-capture-error");

    var name = nameEl ? nameEl.value.trim() : "";
    var email = emailEl ? emailEl.value.trim() : "";
    var phone = (phoneEl && phoneEl.value.trim()) || state.contact.phone || "";

    if (!phone) {
      if (errEl) {
        errEl.textContent = "Please enter your mobile number.";
        errEl.style.display = "block";
      }
      return;
    }
    if (!name) {
      if (nameErrEl) {
        nameErrEl.textContent = "Please enter your name.";
        nameErrEl.style.display = "block";
      }
      return;
    }
    if (!email) {
      if (nameErrEl) {
        nameErrEl.textContent = "Please enter your email.";
        nameErrEl.style.display = "block";
      }
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (nameErrEl) {
        nameErrEl.textContent = "Please enter a valid email address.";
        nameErrEl.style.display = "block";
      }
      return;
    }
    if (errEl) errEl.style.display = "none";
    if (nameErrEl) nameErrEl.style.display = "none";

    var p10Submit = normalizePhone10Planner(phone);
    if (
      !state.contact.phoneVerifiedToken ||
      !p10Submit ||
      state.contact.otpPhone10 !== p10Submit
    ) {
      if (errEl) {
        errEl.textContent =
          "Verify your mobile with OTP on the previous step.";
        errEl.style.display = "block";
      }
      return;
    }

    navNext.disabled = true;
    navNext.textContent = "Submitting...";

    var leadType = scoreLeads(state.answers);
    state.leadType = leadType;

    var payload = {
      name: name,
      phone: phone,
      phone_verified_token: state.contact.phoneVerifiedToken,
      email: email,
      city: state.answers.city
        ? state.answers.city.charAt(0).toUpperCase() +
          state.answers.city.slice(1)
        : "",
      source: "dream_home_planner",
      lead_tag: leadType.toUpperCase(),
      plot_status: state.answers.plotOwnership || "",
      plot_size: state.answers.plotSize || "",
      budget_range: state.answers.budget || "",
      timeline: state.answers.timeline || "",
      construction_type: state.answers.constructionType || "",
      whatsapp_consent: false,
    };
    if (typeof wehouseMergeUtmIntoPayload === "function") {
      wehouseMergeUtmIntoPayload(payload);
    }

    function resetSubmitUi(msg) {
      if (msg && errEl) {
        errEl.textContent = msg;
        errEl.style.display = "block";
      }
      navNext.disabled = false;
      navNext.textContent =
        state.screen === "nameCapture" ? "Start My Home Journey" : "Continue →";
    }

    function goToThankYouPage(ownerName) {
      markAnyFormSubmitted();
      var citySlug = state.answers.city || "";
      var path = thankYouBase || "/thank-you.php";
      var u = new URL(path, window.location.href);
      u.searchParams.set("referral", "1");
      if (citySlug) u.searchParams.set("city", citySlug);
      if (ownerName) u.searchParams.set("owner", ownerName);
      window.location.href = u.toString();
    }

    function doSubmit() {
      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().catch(function () {
            return {};
          }).then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (res.data && res.data.success) {
            goToThankYouPage(name);
            return;
          }
          resetSubmitUi(
            (res.data && res.data.error) ||
              "Something went wrong. Please try again.",
          );
        })
        .catch(function () {
          resetSubmitUi("Network error. Please try again.");
        });
    }

    doSubmit();
  }

  /* ── Referral ── */
  function bindReferral() {
    // All "Refer & Earn" links in result screens
    var refBtns = document.querySelectorAll(".planner-referral-link");
    for (var i = 0; i < refBtns.length; i++) {
      refBtns[i].addEventListener("click", function () {
        showScreen("referral");
        if (plannerNav) plannerNav.style.display = "none";
        prefillPlannerReferral();
      });
    }

    var submitBtn = document.getElementById("referral-submit");
    var skipBtn = document.getElementById("referral-skip");
    var errEl = document.getElementById("planner-referral-error");
    var phoneEl = document.getElementById("ref-your-phone");
    var refRoot = document.getElementById("content-referral");

    var otp =
      refRoot && typeof window.wehouseAttachFormOtp === "function"
        ? window.wehouseAttachFormOtp(refRoot, {
            phoneSelector: "#ref-your-phone",
            errorSelector: "#planner-referral-error",
            onChange: function (ok) {
              if (submitBtn) {
                var reuse =
                  state.contact.phoneVerifiedToken &&
                  state.contact.otpPhone10 &&
                  typeof window.wehouseNormalizePhone10 === "function" &&
                  window.wehouseNormalizePhone10(
                    (phoneEl && phoneEl.value) || "",
                  ) === state.contact.otpPhone10;
                var enabled = ok || reuse;
                submitBtn.disabled = !enabled;
                submitBtn.setAttribute(
                  "aria-disabled",
                  enabled ? "false" : "true",
                );
              }
            },
          })
        : null;

    function prefillPlannerReferral() {
      var nameEl = document.getElementById("ref-your-name");
      var emailEl = document.getElementById("ref-your-email");
      var nameCapture = document.getElementById("contact-name");
      var emailCapture = document.getElementById("contact-email");
      var phoneCapture = document.getElementById("contact-phone");
      if (nameEl && !nameEl.value) {
        nameEl.value =
          (nameCapture && nameCapture.value) || state.contact.name || "";
      }
      if (emailEl && !emailEl.value) {
        emailEl.value =
          (emailCapture && emailCapture.value) || state.contact.email || "";
      }
      if (phoneEl && !phoneEl.value) {
        phoneEl.value =
          (phoneCapture && phoneCapture.value) || state.contact.phone || "";
      }
      if (otp && otp.refreshHint) otp.refreshHint();
      // Reuse already-verified planner OTP when phone matches
      if (
        otp &&
        state.contact.phoneVerifiedToken &&
        state.contact.otpPhone10 &&
        typeof window.wehouseNormalizePhone10 === "function"
      ) {
        var p10 = window.wehouseNormalizePhone10(phoneEl && phoneEl.value);
        if (p10 && p10 === state.contact.otpPhone10) {
          // Token is stored in planner state; submit path can use it directly
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.setAttribute("aria-disabled", "false");
          }
          var statusEl = document.getElementById("planner-ref-otp-status");
          var sendBtn = document.getElementById("planner-ref-send-otp");
          var fields = document.getElementById("planner-ref-otp-fields");
          if (statusEl) statusEl.classList.remove("hidden");
          if (sendBtn) sendBtn.classList.add("hidden");
          if (fields) fields.classList.add("hidden");
        }
      }
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", function () {
        if (errEl) errEl.classList.add("hidden");

        var yourName = (
          (document.getElementById("ref-your-name") || {}).value || ""
        ).trim();
        var yourEmail = (
          (document.getElementById("ref-your-email") || {}).value || ""
        ).trim();
        var yourPhone = ((phoneEl && phoneEl.value) || "").trim();
        var friendName = (
          (document.getElementById("ref-friend-name") || {}).value || ""
        ).trim();
        var friendCity = (
          (document.getElementById("ref-friend-city") || {}).value || ""
        ).trim();
        var friendPhone = (
          (document.getElementById("ref-friend-phone") || {}).value || ""
        ).trim();

        if (
          !yourName ||
          !yourEmail ||
          !yourPhone ||
          !friendName ||
          !friendPhone
        ) {
          if (errEl) {
            errEl.textContent =
              "Please enter your details and your friend's name and phone.";
            errEl.classList.remove("hidden");
          }
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(yourEmail)) {
          if (errEl) {
            errEl.textContent = "Please enter a valid email address.";
            errEl.classList.remove("hidden");
          }
          return;
        }

        var p10 =
          typeof window.wehouseNormalizePhone10 === "function"
            ? window.wehouseNormalizePhone10(yourPhone)
            : normalizePhone10Planner(yourPhone);
        var token = null;
        if (
          state.contact.phoneVerifiedToken &&
          state.contact.otpPhone10 &&
          p10 === state.contact.otpPhone10
        ) {
          token = state.contact.phoneVerifiedToken;
        } else if (otp && otp.isVerified()) {
          token = otp.getToken();
        }

        if (!token || !p10) {
          if (errEl) {
            errEl.textContent =
              "Please verify your mobile number with OTP before submitting.";
            errEl.classList.remove("hidden");
          }
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting…";

        var payload = {
          name: yourName,
          email: yourEmail,
          phone: yourPhone,
          phone_verified_token: token,
          city: friendCity,
          lead_tag: "REFERRAL",
          source: "Dream Home Planner referral",
          message:
            "Referral lead:\nFriend Name: " +
            friendName +
            "\nFriend Phone: " +
            friendPhone +
            (friendCity ? "\nFriend City: " + friendCity : ""),
        };
        if (typeof wehouseMergeUtmIntoPayload === "function") {
          wehouseMergeUtmIntoPayload(payload);
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
              showScreen("thanks");
              return;
            }
            if (errEl) {
              errEl.textContent =
                data.error || "Something went wrong. Please try again.";
              errEl.classList.remove("hidden");
            }
          })
          .catch(function () {
            if (errEl) {
              errEl.textContent = "Network error. Please try again.";
              errEl.classList.remove("hidden");
            }
          })
          .finally(function () {
            submitBtn.textContent = "Submit Referral";
            submitBtn.disabled = false;
            submitBtn.setAttribute("aria-disabled", "false");
          });
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", function () {
        showScreen("thanks");
      });
    }
  }

  /* ── Contact field listeners (enable/disable next) ── */
  function bindContactFields() {
    var ids = ["contact-phone", "contact-name", "contact-email"];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) el.addEventListener("input", updateNextBtn);
    }
  }

  function bindPlannerOtp() {
    var sendBtn = document.getElementById("planner-send-otp");
    var verifyBtn = document.getElementById("planner-verify-otp");
    var otpRow = document.getElementById("planner-otp-row");
    var otpInput = document.getElementById("planner-otp-code");
    var phoneEl = document.getElementById("contact-phone");
    var verifiedEl = document.getElementById("planner-otp-verified");
    var errEl = document.getElementById("contact-error");
    if (!sendBtn || !verifyBtn || !phoneEl) return;

    var useRetryForResend = false;
    var cooldownMs = 45000;
    var cooldownTimer = null;
    var cooldownUntil = 0;

    function clearSendCooldown() {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
      if (sendBtn) {
        sendBtn.disabled = false;
        var o = sendBtn.getAttribute("data-label") || "Send OTP";
        sendBtn.textContent = o;
      }
    }

    function setSendCooldown(active) {
      if (!sendBtn) return;
      if (active) {
        sendBtn.disabled = true;
        var left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
        sendBtn.textContent = "Resend in " + left + "s";
        cooldownTimer = setInterval(function () {
          var l = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
          if (l <= 0) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
            sendBtn.disabled = false;
            sendBtn.textContent =
              sendBtn.getAttribute("data-label") || "Send OTP";
            return;
          }
          sendBtn.textContent = "Resend in " + l + "s";
        }, 500);
      } else {
        clearSendCooldown();
      }
    }

    function clearVerified() {
      state.contact.phoneVerifiedToken = null;
      state.contact.otpPhone10 = null;
      if (verifiedEl) verifiedEl.style.display = "none";
    }

    phoneEl.addEventListener("input", function () {
      useRetryForResend = false;
      clearVerified();
      clearSendCooldown();
      if (otpInput) otpInput.value = "";
      if (sendBtn) {
        sendBtn.style.display = "";
        sendBtn.setAttribute("data-label", "Send OTP");
        sendBtn.textContent = "Send OTP";
      }
      refreshPlannerOtpPhoneHint();
      updateNextBtn();
    });

    sendBtn.addEventListener("click", function () {
      if (errEl) errEl.style.display = "none";
      var p10 = normalizePhone10Planner(phoneEl.value);
      if (!p10) {
        if (errEl) {
          errEl.textContent =
            "Enter a valid mobile. India: 10 digits. Other countries: include country code (e.g. +1…).";
          errEl.style.display = "block";
        }
        return;
      }
      sendBtn.disabled = true;
      var otpBody = useRetryForResend
        ? { action: "retry", phone: p10, retrytype: "text" }
        : { action: "send", phone: p10 };
      postOtpPlanner(otpBody)
        .then(function (res) {
          if (res.data && res.data.success) {
            useRetryForResend = true;
            if (sendBtn) sendBtn.setAttribute("data-label", "Resend OTP");
            if (otpRow) otpRow.style.display = "flex";
            if (otpInput) otpInput.focus();
            refreshPlannerOtpPhoneHint();
            cooldownUntil = Date.now() + cooldownMs;
            setSendCooldown(true);
          } else {
            sendBtn.disabled = false;
            var dl = sendBtn.getAttribute("data-label") || "Send OTP";
            sendBtn.textContent = dl;
            if (errEl) {
              errEl.textContent =
                (res.data && res.data.error) || "Could not send OTP.";
              errEl.style.display = "block";
            }
          }
        })
        .catch(function () {
          sendBtn.disabled = false;
          var dl = sendBtn.getAttribute("data-label") || "Send OTP";
          sendBtn.textContent = dl;
          if (errEl) {
            errEl.textContent = "Network error.";
            errEl.style.display = "block";
          }
        })
        .then(function () {
          updateNextBtn();
        });
    });

    verifyBtn.addEventListener("click", function () {
      if (errEl) errEl.style.display = "none";
      var p10 = normalizePhone10Planner(phoneEl.value);
      var code = ((otpInput && otpInput.value) || "").trim();
      if (!p10 || !code) {
        if (errEl) {
          errEl.textContent = "Enter the OTP we sent.";
          errEl.style.display = "block";
        }
        return;
      }
      verifyBtn.disabled = true;
      postOtpPlanner({ action: "verify", phone: p10, otp: code })
        .then(function (res) {
          verifyBtn.disabled = false;
          if (res.data && res.data.success && res.data.phone_verified_token) {
            state.contact.phoneVerifiedToken = res.data.phone_verified_token;
            state.contact.otpPhone10 = p10;
            setSendCooldown(false);
            if (sendBtn) sendBtn.style.display = "none";
            if (verifiedEl) verifiedEl.style.display = "inline";
            if (otpRow) otpRow.style.display = "none";
            refreshPlannerOtpPhoneHint();
            updateNextBtn();
          } else if (errEl) {
            errEl.textContent =
              (res.data && res.data.error) || "Invalid OTP.";
            errEl.style.display = "block";
          }
        })
        .catch(function () {
          verifyBtn.disabled = false;
          if (errEl) {
            errEl.textContent = "Network error.";
            errEl.style.display = "block";
          }
        });
    });
  }

  /* ── Init ── */
  function init() {
    // Populate DOM refs now that DOM is guaranteed ready
    screenHero = document.getElementById("screen-hero");
    screenApp = document.getElementById("screen-app");
    heroStartBtn = document.getElementById("planner-hero-start");
    contentQuiz = document.getElementById("content-quiz");
    contentContact = document.getElementById("content-contact");
    contentNameCapture = document.getElementById("content-name-capture");
    contentResult = document.getElementById("content-result");
    contentReferral = document.getElementById("content-referral");
    contentThanks = document.getElementById("content-thanks");
    progressFill = document.getElementById("progress-fill");
    progressLabel = document.getElementById("progress-step-label");
    progressPct = document.getElementById("progress-pct");
    questionTitle = document.getElementById("question-title");
    questionSubtitle = document.getElementById("question-subtitle");
    quizOptions = document.getElementById("quiz-options");
    quizUsp = document.getElementById("quiz-usp");
    uspText = document.getElementById("usp-text");
    navBack = document.getElementById("nav-back");
    navNext = document.getElementById("nav-next");
    plannerNav = document.getElementById("planner-nav");
    rightBadgeText = document.getElementById("right-badge-text");
    rightTitle = document.getElementById("right-title");
    rightSubtitle = document.getElementById("right-subtitle");
    rightList = document.getElementById("right-list");
    rightMiniRow = document.getElementById("right-mini-row");
    rightTags = document.getElementById("right-tags");
    rightMedia = document.getElementById("right-media");

    // Hero start button (kept safe if hero markup exists)
    if (heroStartBtn) {
      heroStartBtn.addEventListener("click", function () {
        showScreen("quiz");
        goToStep(0);
      });
    }

    // Nav buttons
    if (navNext) navNext.addEventListener("click", handleNext);
    if (navBack) navBack.addEventListener("click", handleBack);

    // Bind referral & contact
    bindReferral();
    bindContactFields();
    bindPlannerOtp();

    // Initial state: skip hero and open directly in form step 1
    showScreen("quiz");
    goToStep(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
