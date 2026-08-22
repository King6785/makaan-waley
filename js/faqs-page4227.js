(function () {
    "use strict";

    var roots = document.querySelectorAll("[data-faq-accordion], #faqs-accordion");
    if (!roots.length) return;

    roots.forEach(function (root) {
        var items = root.querySelectorAll("[data-faq-item]");
        if (!items.length) return;

        items.forEach(function (item) {
            var trigger = item.querySelector("[data-accordion-trigger]");
            if (!trigger) return;

            trigger.addEventListener("click", function () {
                var isOpen = item.getAttribute("data-state") === "open";
                items.forEach(function (other) {
                    other.setAttribute("data-state", "closed");
                    var otherTrigger = other.querySelector("[data-accordion-trigger]");
                    if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
                });
                if (!isOpen) {
                    item.setAttribute("data-state", "open");
                    trigger.setAttribute("aria-expanded", "true");
                }
            });
        });
    });
})();
