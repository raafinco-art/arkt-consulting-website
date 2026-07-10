/* ============================================================
   ARKT Consulting — interaction & motion
   GSAP + ScrollTrigger, progressive enhancement.
   Content is fully readable without JS; animation only layers on top.
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Motion availability ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (!hasGSAP || reduceMotion) {
    docEl.classList.add("preloader-done");
  }
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Motion tokens ---------- */
  var EASE = {
    primary: "cubic-bezier(0.16, 1, 0.3, 1)",
    gsapPrimary: "expo.out",
    gsapSoft: "power3.out",
    gsapExit: "power2.in"
  };
  var DUR = { fast: 0.45, standard: 0.7, slow: 0.95, hero: 1.1 };
  var STAG = { fast: 0.05, standard: 0.1, editorial: 0.15 };

  /* ============================================================
     HEADER — scrolled state + active section
     ============================================================ */
  var header = document.getElementById("site-header");

  function setScrolledState() {
    if (window.scrollY > 56) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }

  if (hasGSAP) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: setScrolledState,
      onRefresh: setScrolledState
    });
  } else {
    // one-time passive fallback, throttled by rAF
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { setScrolledState(); ticking = false; });
      }
    }, { passive: true });
  }
  setScrolledState();

  /* active nav link */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var sectionsForNav = [
    { id: "home", link: "#home" },
    { id: "about", link: "#about" },
    { id: "services", link: "#services" },
    { id: "contact", link: "#contact" }
  ];

  function setActiveLink(hash) {
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === hash);
    });
  }

  // Section watcher (IntersectionObserver keeps it cheap)
  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var match = sectionsForNav.filter(function (s) { return s.id === entry.target.id; })[0];
        if (match) setActiveLink(match.link);
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sectionsForNav.forEach(function (s) {
    var el = document.getElementById(s.id);
    if (el) watcher.observe(el);
  });

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var menuOpen = false;
  var lastFocused = null;

  function openMenu() {
    menuOpen = true;
    lastFocused = document.activeElement;
    mobileMenu.hidden = false;
    header.classList.add("menu-open", "is-scrolled");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    document.body.style.overflow = "hidden";

    var items = mobileMenu.querySelectorAll(".mobile-nav-link, .mobile-menu-cta, .mobile-menu-contact a");
    if (hasGSAP && !reduceMotion) {
      gsap.to(mobileMenu, { clipPath: "inset(0% 0 0% 0)", duration: 0.5, ease: EASE.gsapPrimary });
      gsap.fromTo(items,
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.07, delay: 0.12, ease: EASE.gsapSoft, clearProps: "all" });
    } else {
      mobileMenu.style.clipPath = "inset(0 0 0 0)";
    }
    var firstLink = mobileMenu.querySelector(".mobile-nav-link");
    if (firstLink) firstLink.focus();
  }

  function closeMenu(skipAnimation) {
    menuOpen = false;
    header.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
    setScrolledState();

    function done() {
      mobileMenu.hidden = true;
    }
    if (hasGSAP && !reduceMotion && !skipAnimation) {
      gsap.to(mobileMenu, { clipPath: "inset(0% 0 100% 0)", duration: 0.4, ease: EASE.gsapExit, onComplete: done });
    } else {
      mobileMenu.style.clipPath = "inset(0 0 100% 0)";
      done();
    }
    if (lastFocused) lastFocused.focus();
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      if (menuOpen) closeMenu(); else openMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuOpen) closeMenu();
      // basic focus trap
      if (e.key === "Tab" && menuOpen) {
        var focusables = mobileMenu.querySelectorAll("a, button");
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    mobileMenu.addEventListener("click", function (e) {
      var link = e.target.closest("a[href^='#']");
      if (link) closeMenu(true);
    });
  }

  /* ============================================================
     SERVICES — editorial index (desktop) / accordion (mobile)
     ============================================================ */
  var servicesIndex = document.getElementById("services-index");
  var services = servicesIndex ? Array.prototype.slice.call(servicesIndex.querySelectorAll(".service")) : [];
  var desktopMQ = window.matchMedia("(min-width: 1024px)");

  function activateService(service, options) {
    options = options || {};
    var isDesktop = desktopMQ.matches;
    var wasActive = service.classList.contains("is-active");

    if (!isDesktop && wasActive && options.allowToggle) {
      // collapse on mobile
      collapseBody(service);
      service.classList.remove("is-active");
      service.querySelector(".service-toggle").setAttribute("aria-expanded", "false");
      return;
    }
    if (wasActive) return;

    services.forEach(function (s) {
      if (s !== service && s.classList.contains("is-active")) {
        if (!desktopMQ.matches) collapseBody(s);
        s.classList.remove("is-active");
        s.querySelector(".service-toggle").setAttribute("aria-expanded", "false");
      }
    });

    service.classList.add("is-active");
    service.querySelector(".service-toggle").setAttribute("aria-expanded", "true");

    var body = service.querySelector(".service-body");
    var detail = service.querySelector(".service-detail");

    if (isDesktop) {
      if (hasGSAP && !reduceMotion && !options.silent) {
        gsap.fromTo(detail.children,
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: EASE.gsapSoft, clearProps: "all" });
      }
    } else {
      expandBody(service, options.silent);
    }
  }

  function expandBody(service, silent) {
    var body = service.querySelector(".service-body");
    if (hasGSAP && !reduceMotion && !silent) {
      gsap.set(body, { height: 0, visibility: "visible" });
      gsap.to(body, {
        height: "auto", duration: 0.55, ease: EASE.gsapPrimary,
        onComplete: function () { gsap.set(body, { clearProps: "height,visibility" }); }
      });
    }
  }

  function collapseBody(service) {
    var body = service.querySelector(".service-body");
    if (hasGSAP && !reduceMotion) {
      gsap.fromTo(body, { height: body.scrollHeight }, {
        height: 0, duration: 0.4, ease: EASE.gsapExit,
        onComplete: function () { gsap.set(body, { clearProps: "height,visibility" }); }
      });
    }
  }

  services.forEach(function (service) {
    var toggle = service.querySelector(".service-toggle");
    toggle.addEventListener("click", function () {
      activateService(service, { allowToggle: true });
    });
    // desktop: hover moves the index too (click/focus still works for keyboards)
    toggle.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse" && desktopMQ.matches) activateService(service);
    });
  });

  // default active service
  if (services.length) activateService(services[0], { silent: true });

  // when crossing the breakpoint, normalise state (keep exactly one active)
  var mqHandler = function () {
    var active = services.filter(function (s) { return s.classList.contains("is-active"); })[0] || services[0];
    services.forEach(function (s) {
      var body = s.querySelector(".service-body");
      if (hasGSAP) gsap.set(body, { clearProps: "height,visibility" });
      s.classList.toggle("is-active", s === active);
      s.querySelector(".service-toggle").setAttribute("aria-expanded", s === active ? "true" : "false");
    });
  };
  if (desktopMQ.addEventListener) desktopMQ.addEventListener("change", mqHandler);

  /* service deep-link: preselect service in the contact form */
  var serviceSelect = document.getElementById("field-service");
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-preselect]");
    if (!link || !serviceSelect) return;
    var value = link.getAttribute("data-preselect");
    Array.prototype.forEach.call(serviceSelect.options, function (opt) {
      if (opt.text === value) serviceSelect.value = opt.value || opt.text;
    });
  });

  /* ============================================================
     CONTACT FORM — validation + honest submission boundary
     ============================================================ */
  var form = document.getElementById("enquiry-form");
  // Integration boundary: set this to a real endpoint (e.g. Formspree,
  // a serverless function, or the site's own API) to POST enquiries.
  var FORM_ENDPOINT = "";

  if (form) {
    var statusEl = document.getElementById("form-status");
    var submitBtn = document.getElementById("submit-btn");

    var validators = {
      name: function (v) { return v.trim() ? "" : "Please enter your full name."; },
      email: function (v) {
        if (!v.trim()) return "Please enter your email address.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Please enter a valid email address, e.g. name@company.co.za.";
      },
      message: function (v) { return v.trim() ? "" : "Please tell us briefly what you need help with."; }
    };

    function validateField(input) {
      var check = validators[input.name];
      if (!check) return true;
      var msg = check(input.value);
      var errEl = document.getElementById("error-" + input.name);
      if (msg) {
        input.setAttribute("aria-invalid", "true");
        if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
        return false;
      }
      input.removeAttribute("aria-invalid");
      if (errEl) { errEl.textContent = ""; errEl.hidden = true; }
      return true;
    }

    form.addEventListener("blur", function (e) {
      if (e.target.matches("input, textarea") && e.target.value !== "") validateField(e.target);
    }, true);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = ["name", "email", "message"].map(function (n) { return form.elements[n]; });
      var firstInvalid = null;
      fields.forEach(function (input) {
        if (!validateField(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        statusEl.textContent = "Please fix the highlighted fields and try again.";
        statusEl.className = "form-status is-error";
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        company: form.elements.company.value.trim(),
        service: form.elements.service.value,
        message: form.elements.message.value.trim()
      };

      if (FORM_ENDPOINT) {
        submitBtn.disabled = true;
        submitBtn.querySelector(".submit-label").textContent = "Sending...";
        statusEl.textContent = "";
        statusEl.className = "form-status";
        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          statusEl.textContent = "Thank you. Your enquiry has been sent, and we will get back to you shortly.";
          statusEl.className = "form-status is-success";
          form.reset();
        }).catch(function () {
          statusEl.textContent = "Something went wrong sending your enquiry. Please try again, or email info@arktconsulting.co.za directly.";
          statusEl.className = "form-status is-error";
        }).finally(function () {
          submitBtn.disabled = false;
          submitBtn.querySelector(".submit-label").textContent = "Submit Enquiry";
        });
      } else {
        // No backend configured yet: hand off to the visitor's email app
        // with everything pre-filled. No fake "sent" confirmation.
        var subject = "Enquiry: " + (data.service || "General") + " - " + data.name;
        var bodyLines = [
          "Full Name: " + data.name,
          "Email: " + data.email,
          "Phone: " + (data.phone || "-"),
          "Company / Organisation: " + (data.company || "-"),
          "Service Interested In: " + (data.service || "-"),
          "",
          data.message
        ];
        var href = "mailto:info@arktconsulting.co.za?subject=" + encodeURIComponent(subject) +
                   "&body=" + encodeURIComponent(bodyLines.join("\n"));
        statusEl.textContent = "Opening your email app with this enquiry addressed to info@arktconsulting.co.za.";
        statusEl.className = "form-status is-success";
        window.location.href = href;
      }
    });
  }

  /* ============================================================
     MOTION LAYER (GSAP only, skipped for reduced motion)
     ============================================================ */
  if (!hasGSAP) return;

  var mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", function (ctx) {

    /* ---------- Preloader + entrance choreography ---------- */
    var preloader = document.getElementById("preloader");
    var intro = gsap.timeline({
      onComplete: function () {
        docEl.classList.add("preloader-done");
        ScrollTrigger.refresh();
      }
    });

    // safety: never trap the user behind the preloader
    var failsafe = setTimeout(function () { docEl.classList.add("preloader-done"); }, 3200);
    intro.eventCallback("onComplete", function () {
      clearTimeout(failsafe);
      docEl.classList.add("preloader-done");
      ScrollTrigger.refresh();
    });

    intro
      .fromTo(".preloader-mark", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE.gsapSoft })
      .to(".preloader-line-fill", { scaleX: 1, duration: 0.55, ease: "power2.inOut" }, "-=0.15")
      .to(preloader, { yPercent: -100, duration: 0.6, ease: EASE.gsapPrimary }, "+=0.05");

    /* nav entrance */
    intro.from(".brand-logo-light", { y: -12, autoAlpha: 0, duration: DUR.standard, ease: EASE.gsapSoft, clearProps: "all" }, "-=0.35");
    intro.from(".nav-list li", { y: -12, autoAlpha: 0, duration: 0.6, stagger: 0.06, ease: EASE.gsapSoft, clearProps: "all" }, "<0.08");
    intro.from(".btn-nav, .menu-toggle", { y: -12, autoAlpha: 0, duration: 0.6, ease: EASE.gsapSoft, clearProps: "all" }, "<0.12");

    /* hero timeline */
    intro
      .from(".hero-bg", { autoAlpha: 0, duration: 0.7, ease: "power1.out" }, "-=0.75")
      .from("[data-hero='eyebrow']", { y: 16, autoAlpha: 0, duration: 0.6, ease: EASE.gsapSoft }, "-=0.45")
      .from("[data-hero='line']", { yPercent: 105, duration: 0.95, stagger: 0.15, ease: EASE.gsapPrimary }, "-=0.4")
      .from("[data-hero='body']", { y: 18, autoAlpha: 0, duration: 0.7, ease: EASE.gsapSoft }, "-=0.55")
      .from("[data-hero='cta']", { y: 14, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: EASE.gsapSoft, clearProps: "transform" }, "-=0.45")
      .from(".hero-visual", { clipPath: "inset(0 0 0 100%)", duration: 1.05, ease: EASE.gsapPrimary }, "-=0.95")
      .from(".hero-figure img", { scale: 1.06, duration: 1.4, ease: EASE.gsapSoft }, "<")
      .from(".hero-frame", { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, "-=0.5");

    /* ---------- Generic scroll reveals ---------- */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.from(el, {
        y: 24, autoAlpha: 0, duration: 0.8, ease: EASE.gsapSoft,
        scrollTrigger: { trigger: el, start: "top 82%", once: true }
      });
    });

    gsap.utils.toArray("[data-reveal-group]").forEach(function (group) {
      gsap.from(group.children, {
        y: 22, autoAlpha: 0, duration: 0.75, stagger: STAG.standard, ease: EASE.gsapSoft,
        scrollTrigger: { trigger: group, start: "top 82%", once: true }
      });
    });

    /* masked headline reveals */
    gsap.utils.toArray("[data-mask]").forEach(function (headline) {
      gsap.from(headline.querySelectorAll(".mask-inner"), {
        yPercent: 105, duration: 0.9, stagger: 0.13, ease: EASE.gsapPrimary,
        scrollTrigger: { trigger: headline, start: "top 84%", once: true }
      });
    });

    /* image mask reveals */
    gsap.utils.toArray(".image-reveal").forEach(function (fig) {
      var img = fig.querySelector("img");
      var tl = gsap.timeline({
        scrollTrigger: { trigger: fig, start: "top 84%", once: true }
      });
      tl.from(fig, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: EASE.gsapPrimary })
        .from(img, { scale: 1.05, duration: 1.4, ease: EASE.gsapSoft }, "<");
    });

    /* capability strip */
    var capSection = document.querySelector(".capabilities");
    if (capSection) {
      var capTl = gsap.timeline({
        scrollTrigger: { trigger: capSection, start: "top 85%", once: true }
      });
      capTl.from(".cap-rule", { scaleX: 0, duration: 1, ease: EASE.gsapPrimary })
           .from(".cap-item", { y: 20, autoAlpha: 0, duration: 0.65, stagger: 0.09, ease: EASE.gsapSoft, clearProps: "all" }, "-=0.55");
    }

    /* about: converging-lines motif draws in */
    gsap.utils.toArray(".converge-path").forEach(function (path, i) {
      var length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0, duration: 1.4, delay: i * 0.12, ease: "power2.inOut",
        scrollTrigger: { trigger: ".about-visual", start: "top 80%", once: true }
      });
    });

    /* CTA headline */
    var cta = document.getElementById("cta");
    if (cta) {
      gsap.from(cta.querySelectorAll(".cta-headline .mask-inner"), {
        yPercent: 105, duration: 1, stagger: 0.18, ease: EASE.gsapPrimary,
        scrollTrigger: { trigger: cta, start: "top 74%", once: true }
      });
      gsap.fromTo(cta.querySelector(".cta-media img"),
        { yPercent: -5, scale: 1.03 },
        { yPercent: 3, scale: 1, ease: "none",
          scrollTrigger: { trigger: cta, start: "top bottom", end: "bottom top", scrub: 0.8 } });
    }

    /* approach: progress line + step emphasis */
    var steps = gsap.utils.toArray(".approach-step");
    var progressFill = document.getElementById("approach-progress-fill");
    if (steps.length && progressFill) {
      gsap.to(progressFill, {
        scaleY: 1, ease: "none",
        scrollTrigger: {
          trigger: "#approach-steps",
          start: "top 70%",
          end: "bottom 55%",
          scrub: 0.9
        }
      });
      steps.forEach(function (step) {
        gsap.fromTo(step, { opacity: 0.4 }, {
          opacity: 1, duration: 0.5, ease: "power1.out",
          scrollTrigger: {
            trigger: step,
            start: "top 72%",
            end: "bottom 30%",
            toggleActions: "play reverse play reverse"
          }
        });
      });
    }

    /* experience counter (restrained, once) */
    var counter = document.getElementById("experience-counter");
    if (counter) {
      var target = parseInt(counter.getAttribute("data-count-to"), 10) || 18;
      var proxy = { value: 0 };
      gsap.to(proxy, {
        value: target, duration: 1.5, ease: "power2.out",
        scrollTrigger: { trigger: counter, start: "top 85%", once: true },
        onUpdate: function () { counter.textContent = Math.round(proxy.value); },
        onComplete: function () { counter.textContent = target; }
      });
    }

    return function () {
      docEl.classList.add("preloader-done");
    };
  });

  /* ---------- Parallax (fine pointers / desktop only) ---------- */
  mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", function () {
    gsap.utils.toArray("[data-parallax]").forEach(function (img) {
      var amount = parseFloat(img.getAttribute("data-parallax")) || 4;
      // overscan so the frame never shows gaps while the image drifts
      gsap.set(img, { scale: 1 + amount * 0.025 });
      gsap.fromTo(img, { yPercent: -amount }, {
        yPercent: amount, ease: "none",
        scrollTrigger: {
          trigger: img.closest("figure") || img,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8
        }
      });
    });
  });

  /* reduced motion: make sure everything is stable and visible */
  mm.add("(prefers-reduced-motion: reduce)", function () {
    docEl.classList.add("preloader-done");
  });

})();
