

        var BASE = "";
        document.addEventListener("DOMContentLoaded", function() {
            if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
            gsap.registerPlugin(ScrollTrigger);

            // Hero Animations - Staggered entrance
            var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
            
            gsap.set(".hero-stamp", { scale: 0.72, rotation: -22, transformOrigin: "50% 50%" });
            gsap.set(".hero-form", { opacity: 0, x: 60 });

            heroTl.to(".hero-headline", {
                y: 0,
                opacity: 1,
                duration: 0.5
            })
            .to(".hero-tagline", {
                y: 0,
                opacity: 1,
                duration: 0.4
            }, "-=0.25")
            .to(".hero-subheadline", {
                y: 0,
                opacity: 1,
                duration: 0.4
            }, "-=0.25")
            .to(".hero-cta", {
                y: 0,
                opacity: 1,
                duration: 0.4
            }, "-=0.2")
            .to(".hero-stats", {
                y: 0,
                opacity: 1,
                duration: 0.35
            }, "-=0.15")
            .to(".hero-form", {
                x: 0,
                opacity: 1,
                duration: 0.45,
                ease: "power3.out"
            }, "-=0.2")
            .to(".hero-stamp", {
                opacity: 1,
                scale: 1,
                rotation: -10,
                duration: 0.4,
                ease: "back.out(1.6)"
            }, "-=0.18");

            // Soft-rotate faded Indian family overlays in hero background
            (function initHeroFamilyFades() {
                var fades = Array.prototype.slice.call(document.querySelectorAll(".hero-family-fade"));
                if (fades.length < 2) return;
                var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
                if (prefersReducedMotion || coarsePointer) return;
                var index = fades.findIndex(function(el) { return el.classList.contains("is-active"); });
                if (index < 0) index = 0;
                window.setInterval(function() {
                    fades[index].classList.remove("is-active");
                    index = (index + 1) % fades.length;
                    fades[index].classList.add("is-active");
                }, 5200);
            })();

            var isInHero = false;

            // Scroll progress bar
            var scrollProgress = document.getElementById("scroll-progress");
            if (scrollProgress) {
                function updateScrollProgress() {
                    var scrollTop = window.scrollY;
                    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    var pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
                    scrollProgress.style.transform = "scaleX(" + pct + ")";
                }
                window.addEventListener("scroll", updateScrollProgress, { passive: true });
                updateScrollProgress();
            }

            // Magnetic CTA: subtle pull toward cursor when in hero (fine pointer only)
            var heroSectionEl = document.getElementById("hero");
            var heroCta = document.getElementById("hero-cta-primary");
            var ctaMagX = 0, ctaMagY = 0;
            var ctaTargetX = 0, ctaTargetY = 0;
            var canHoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
            if (heroCta && heroSectionEl && canHoverFine) {
                document.addEventListener("mousemove", function(e) {
                    if (!heroCta || !heroSectionEl) return;
                    var heroRect = heroSectionEl.getBoundingClientRect();
                    var inHero = e.clientY >= heroRect.top && e.clientY <= heroRect.bottom;
                    if (!inHero) { ctaTargetX = 0; ctaTargetY = 0; return; }
                    var rect = heroCta.getBoundingClientRect();
                    var cx = rect.left + rect.width / 2;
                    var cy = rect.top + rect.height / 2;
                    var dx = e.clientX - cx;
                    var dy = e.clientY - cy;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    var maxDist = 140;
                    var pull = 12;
                    if (dist < maxDist && dist > 0) {
                        var f = (1 - dist / maxDist) * pull;
                        ctaTargetX = (dx / dist) * f;
                        ctaTargetY = (dy / dist) * f;
                    } else {
                        ctaTargetX = 0;
                        ctaTargetY = 0;
                    }
                });
                heroSectionEl.addEventListener("mouseleave", function() {
                    ctaTargetX = 0;
                    ctaTargetY = 0;
                });
                function animateMagnetic() {
                    ctaMagX += (ctaTargetX - ctaMagX) * 0.15;
                    ctaMagY += (ctaTargetY - ctaMagY) * 0.15;
                    if (heroCta) heroCta.style.transform = "translate(" + ctaMagX + "px," + ctaMagY + "px)";
                    requestAnimationFrame(animateMagnetic);
                }
                animateMagnetic();
            }

            // Cursor Following Blob (fine pointer / hover devices only)
            var cursorBlob = document.getElementById("cursor-blob");
            var heroSection = document.getElementById("hero");
            var blobX = 0, blobY = 0;
            var mouseX = 0, mouseY = 0;
            var isInHero = false;

            if (cursorBlob && heroSection && canHoverFine) {
                document.addEventListener("mousemove", function(e) {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    
                    var heroRect = heroSection.getBoundingClientRect();
                    isInHero = e.clientY >= heroRect.top && e.clientY <= heroRect.bottom;
                    
                    if (isInHero) {
                        cursorBlob.style.opacity = "1";
                    } else {
                        cursorBlob.style.opacity = "0";
                    }
                });

                function animateBlob() {
                    blobX += (mouseX - blobX) * 0.08;
                    blobY += (mouseY - blobY) * 0.08;
                    
                    cursorBlob.style.left = (blobX - 150) + "px";
                    cursorBlob.style.top = (blobY - 150) + "px";
                    
                    requestAnimationFrame(animateBlob);
                }
                animateBlob();

                heroSection.addEventListener("mouseleave", function() {
                    cursorBlob.style.opacity = "0";
                });
            } else if (cursorBlob) {
                cursorBlob.style.display = "none";
            }

            // Parallax for Section 2 (value) image - slight vertical movement on scroll
            var valueImg = document.querySelector("#value-section-img");
            if (valueImg) {
                gsap.to(valueImg, {
                    yPercent: 12,
                    ease: "none",
                    scrollTrigger: {
                        trigger: "#value",
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1.5
                    }
                });
            }

            // Reveal Animations
            gsap.utils.toArray(".reveal-up").forEach(function(element) {
                gsap.from(element, {
                    scrollTrigger: {
                        trigger: element,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    y: 50,
                    opacity: 0,
                    duration: 0.9,
                    ease: "power3.out"
                });
            });

            // Why MAKAAN WALEY reason cards — staggered entrance
            var whyReasonCards = gsap.utils.toArray("#why-makaan-waley .why-reason-card");
            if (whyReasonCards.length) {
                gsap.from(whyReasonCards, {
                    scrollTrigger: {
                        trigger: "#why-makaan-waley",
                        start: "top 78%",
                        toggleActions: "play none none reverse"
                    },
                    y: 36,
                    opacity: 0,
                    duration: 0.65,
                    stagger: 0.07,
                    ease: "power3.out"
                });
            }

            gsap.utils.toArray(".reveal-left").forEach(function(element) {
                gsap.from(element, {
                    scrollTrigger: {
                        trigger: element,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    x: -60,
                    opacity: 0,
                    duration: 0.9,
                    ease: "power3.out"
                });
            });

            gsap.utils.toArray(".reveal-right").forEach(function(element) {
                gsap.from(element, {
                    scrollTrigger: {
                        trigger: element,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    x: 60,
                    opacity: 0,
                    duration: 0.9,
                    ease: "power3.out"
                });
            });

            // Auto slider for testimonials — native swipe on mobile, transform autoplay from md
            (function initTestimonialsAutoSlider() {
                var viewport = document.querySelector("#testimonials-slider");
                var track = document.querySelector("#testimonials-track");
                var slides = document.querySelectorAll(".testimonials-slide");
                if (!viewport || !track || !slides.length) return;

                var currentIndex = 0;
                var timer = null;
                var intervalMs = 2200;
                var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                var desktopMq = window.matchMedia("(min-width: 768px)");

                function isDesktop() {
                    return desktopMq.matches;
                }

                function maxOffset() {
                    return Math.max(0, track.scrollWidth - viewport.clientWidth);
                }

                function slideTo(index) {
                    if (!isDesktop()) return;
                    track.style.paddingLeft = "0";
                    track.style.paddingRight = "0";

                    currentIndex = ((index % slides.length) + slides.length) % slides.length;
                    var slide = slides[currentIndex];
                    var x = -slide.offsetLeft;
                    var minX = -maxOffset();
                    if (x < minX) x = minX;
                    if (x > 0) x = 0;

                    track.style.transform = "translate3d(" + x + "px, 0, 0)";

                    slides.forEach(function(slideEl, i) {
                        var isActive = i === currentIndex;
                        slideEl.classList.toggle("shadow-2xl", isActive);
                        slideEl.classList.toggle("shadow-primary-light/25", isActive);
                        slideEl.classList.toggle("z-10", isActive);
                        slideEl.setAttribute("aria-hidden", isActive ? "false" : "true");
                    });
                }

                function nextSlide() {
                    if (!isDesktop()) return;
                    if (currentIndex >= slides.length - 1 || -slides[currentIndex].offsetLeft <= -maxOffset()) {
                        slideTo(0);
                        return;
                    }
                    slideTo(currentIndex + 1);
                }

                function startAutoplay() {
                    if (prefersReducedMotion || !isDesktop() || timer) return;
                    timer = window.setInterval(nextSlide, intervalMs);
                }

                function stopAutoplay() {
                    if (!timer) return;
                    window.clearInterval(timer);
                    timer = null;
                }

                function enableNativeMobile() {
                    stopAutoplay();
                    track.style.transform = "";
                    track.style.transition = "none";
                    slides.forEach(function(slideEl) {
                        slideEl.classList.remove("shadow-2xl", "shadow-primary-light/25", "z-10");
                        slideEl.setAttribute("aria-hidden", "false");
                    });
                }

                function onBreakpointChange() {
                    if (isDesktop()) {
                        track.style.transition = "";
                        slideTo(currentIndex);
                        startAutoplay();
                    } else {
                        enableNativeMobile();
                    }
                }

                viewport.addEventListener("mouseenter", stopAutoplay);
                viewport.addEventListener("mouseleave", startAutoplay);
                viewport.addEventListener("focusin", stopAutoplay);
                viewport.addEventListener("focusout", startAutoplay);
                viewport.addEventListener("touchstart", stopAutoplay, { passive: true });

                window.addEventListener("resize", function() {
                    if (isDesktop()) slideTo(currentIndex);
                });
                if (desktopMq.addEventListener) {
                    desktopMq.addEventListener("change", onBreakpointChange);
                } else if (desktopMq.addListener) {
                    desktopMq.addListener(onBreakpointChange);
                }

                onBreakpointChange();
                if (isDesktop()) {
                    window.setTimeout(function() {
                        nextSlide();
                        startAutoplay();
                    }, 600);
                }
            })();

            // Counter Animation (Indian number format)
            gsap.utils.toArray(".counter").forEach(function(counter) {
                var target = parseFloat(counter.getAttribute("data-target")) || 0;
                var obj = { val: 0 };
                gsap.to(obj, {
                    val: target,
                    duration: 2.2,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: counter.closest("section") || counter,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    },
                    onUpdate: function() {
                        var n = Math.min(Math.ceil(obj.val), target);
                        counter.innerText = n.toLocaleString("en-IN") + "+";
                    }
                });
            });

            // Achievements panel: count up on viewport
            (function initAchievementsCounters() {
                var counters = gsap.utils.toArray(".achievements-counter");
                if (!counters.length) return;

                var panel = document.getElementById("achievements-panel");
                var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

                function renderCounter(el, value) {
                    var target = parseFloat(el.getAttribute("data-count-to")) || 0;
                    var suffix = el.getAttribute("data-count-suffix") || "";
                    var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
                    var n = Math.min(value, target);
                    var text = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
                    el.textContent = text + suffix;
                }

                if (prefersReducedMotion) {
                    counters.forEach(function(el) {
                        renderCounter(el, parseFloat(el.getAttribute("data-count-to")) || 0);
                    });
                    return;
                }

                ScrollTrigger.create({
                    trigger: panel || counters[0],
                    start: "top 85%",
                    once: true,
                    onEnter: function() {
                        counters.forEach(function(el, index) {
                            var target = parseFloat(el.getAttribute("data-count-to")) || 0;
                            var obj = { val: 0 };
                            gsap.to(obj, {
                                val: target,
                                duration: 2,
                                ease: "power2.out",
                                delay: index * 0.08,
                                onUpdate: function() {
                                    renderCounter(el, obj.val);
                                },
                                onComplete: function() {
                                    renderCounter(el, target);
                                }
                            });
                        });
                    }
                });
            })();

            // Slow down contact section video
            var contactVideo = document.getElementById("contact-video");
            if (contactVideo) {
                contactVideo.playbackRate = 0.5;
            }

            // Interactive map: sync hover between SVG city circles and city names
            var svgObject = document.getElementById("india-map-svg");
            var cityNames = document.querySelectorAll(".city-name");
            var svgDoc = null;
            var cityIds = ["hyderabad", "chennai", "bengaluru", "amaravati", "jaipur", "chandigarh", "ahmedabad", "pune"];
            
            function highlightCity(cityId, isHighlighted) {
                if (svgDoc) {
                    var cityGroup = svgDoc.getElementById(cityId);
                    if (cityGroup) {
                        var circle = cityGroup.querySelector("circle");
                        if (circle) {
                            if (isHighlighted) {
                                circle.style.fill = "#ffffff";
                                circle.style.stroke = "#0D47A1";
                                circle.style.strokeWidth = "3";
                                circle.style.transform = "scale(2.2)";
                                circle.style.filter = "drop-shadow(0 0 16px rgba(245, 158, 11, 0.8))";
                            } else {
                                circle.style.fill = "#0D47A1";
                                circle.style.stroke = "#ffffff";
                                circle.style.strokeWidth = "2";
                                circle.style.transform = "scale(1.5)";
                                circle.style.filter = "";
                            }
                        }
                    }
                }
                cityNames.forEach(function(n) {
                    if (n.getAttribute("data-city") === cityId) {
                        n.classList.toggle("city-highlighted", isHighlighted);
                        n.classList.toggle("!border-primary", isHighlighted);
                        n.classList.toggle("!shadow-lg", isHighlighted);
                        n.classList.toggle("!shadow-primary/30", isHighlighted);
                        n.classList.toggle("!scale-[1.05]", isHighlighted);
                    }
                });
            }
            
            function initSvgInteraction() {
                svgDoc = svgObject.contentDocument;
                if (!svgDoc) return;
                
                cityIds.forEach(function(cityId) {
                    var cityGroup = svgDoc.getElementById(cityId);
                    if (cityGroup) {
                        var circle = cityGroup.querySelector("circle");
                        if (circle) {
                            circle.style.cursor = "pointer";
                            circle.style.transition = "all 0.3s ease";
                            circle.style.fill = "#0D47A1";
                            circle.style.stroke = "#ffffff";
                            circle.style.strokeWidth = "2";
                            circle.style.transformBox = "fill-box";
                            circle.style.transformOrigin = "center center";
                            circle.style.transform = "scale(1.5)";
                            circle.addEventListener("mouseenter", function() { highlightCity(cityId, true); });
                            circle.addEventListener("mouseleave", function() { highlightCity(cityId, false); });
                        }
                    }
                });
            }
            
            svgObject.addEventListener("load", initSvgInteraction);
            if (svgObject.contentDocument) {
                initSvgInteraction();
            }
            
            cityNames.forEach(function(n) {
                n.addEventListener("mouseenter", function() { highlightCity(n.getAttribute("data-city"), true); });
                n.addEventListener("mouseleave", function() { highlightCity(n.getAttribute("data-city"), false); });
            });

            // Refresh ScrollTrigger on load and resize
            window.addEventListener("load", function() { ScrollTrigger.refresh(); });
            var resizeTimer;
            window.addEventListener("resize", function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() { ScrollTrigger.refresh(); }, 250);
            });
        });
    
    