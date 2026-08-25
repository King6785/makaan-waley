(function () {
  "use strict";

  var filterBtns = document.querySelectorAll("[data-blog-category]");
  var cards = document.querySelectorAll(".blog-post-card");
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-blog-category");
        filterBtns.forEach(function (b) {
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
        cards.forEach(function (card) {
          if (cat === "all") {
            card.style.display = "";
            return;
          }
          var cardCat = card.getAttribute("data-category") || "";
          card.style.display =
            cardCat.indexOf(cat) >= 0 || cat.indexOf(cardCat) >= 0 ? "" : "none";
        });
      });
    });
  }

  var subForm = document.getElementById("blog-subscribe-form");
  var subSuccess = document.getElementById("blog-subscribe-success");
  var subError = document.getElementById("blog-subscribe-error");
  if (!subForm) return;

  subForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (subSuccess) subSuccess.classList.add("hidden");
    if (subError) subError.classList.add("hidden");

    var name = ((subForm.querySelector("[name=name]") || {}).value || "").trim();
    var email = ((subForm.querySelector("[name=email]") || {}).value || "").trim();
    var hp = ((subForm.querySelector("[name=hp_website]") || {}).value || "").trim();

    if (!name || !email) {
      if (subError) {
        subError.textContent = "Please enter your name and email.";
        subError.classList.remove("hidden");
      }
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (subError) {
        subError.textContent = "Please enter a valid email address.";
        subError.classList.remove("hidden");
      }
      return;
    }

    var submitBtn = subForm.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Subscribing…";
    }

    var payload = {
      name: name,
      email: email,
      source: "Blog newsletter subscribe",
      lead_tag: "NEWSLETTER",
      message: "Blog newsletter subscription",
      hp_website: hp,
    };
    if (typeof window.wehouseMergeUtmIntoPayload === "function") {
      window.wehouseMergeUtmIntoPayload(payload);
    }

    fetch(subForm.getAttribute("data-privyr-api") || "/api/privyr-lead", {
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
          if (subSuccess) subSuccess.classList.remove("hidden");
          subForm.reset();
          return;
        }
        if (subError) {
          subError.textContent =
            data.error || "Something went wrong. Please try again.";
          subError.classList.remove("hidden");
        }
      })
      .catch(function () {
        if (subError) {
          subError.textContent = "Network error. Please try again.";
          subError.classList.remove("hidden");
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Subscribe";
        }
      });
  });
})();
