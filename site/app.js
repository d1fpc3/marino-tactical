/* Marino Tactical Training | shared site behavior */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;

  // Mobile nav toggle (full-screen overlay + body scroll lock)
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  var setMenu = function (open) {
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      setMenu(!links.classList.contains("open"));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    // close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) setMenu(false);
    });
  }

  // Sticky header gains shadow/opacity after scroll
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // FAQ accordion
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      if (item) item.classList.toggle("open");
    });
  });

  // Kinetic hero reveal (fires on load)
  var kinetics = document.querySelectorAll(".kinetic, .kinetic-fade");
  if (kinetics.length) {
    if (reduceMotion) {
      kinetics.forEach(function (el) { el.classList.add("in"); });
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          kinetics.forEach(function (el) { el.classList.add("in"); });
        });
      });
    }
  }

  // Reveal on scroll (+ stagger groups)
  var reveals = document.querySelectorAll(".reveal, .reveal-stagger");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  // Count-up stats (trust strip numbers like "18+", "100%", "6+")
  if (!reduceMotion && "IntersectionObserver" in window) {
    var counters = document.querySelectorAll("[data-count]");
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          cio.unobserve(el);
          var target = parseFloat(el.getAttribute("data-count"));
          var suffix = el.getAttribute("data-suffix") || "";
          var dur = 1100, start = null;
          var step = function (ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target + suffix;
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  }

  // Magnetic CTA (pattern #1), desktop pointer only
  if (canHover && !reduceMotion) {
    document.querySelectorAll(".btn--magnetic").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { btn.style.transition = "none"; });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.25 + "px," + y * 0.35 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  // Contact form: build a mailto so no third-party backend is required
  var form = document.querySelector("[data-mailto-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = form.getAttribute("data-mailto-form");
      var name = (form.querySelector('[name="name"]') || {}).value || "";
      var email = (form.querySelector('[name="email"]') || {}).value || "";
      var phone = (form.querySelector('[name="phone"]') || {}).value || "";
      var course = (form.querySelector('[name="course"]') || {}).value || "";
      var message = (form.querySelector('[name="message"]') || {}).value || "";
      var subject = "Class inquiry from " + (name || "website");
      var body =
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Phone: " + phone + "\n" +
        "Course of interest: " + course + "\n\n" +
        message;
      // Loading -> success state on the submit button (pattern #12)
      var submit = form.querySelector('button[type="submit"]');
      if (submit && !submit.dataset.label) submit.dataset.label = submit.textContent;
      if (submit) {
        submit.classList.add("is-loading");
        submit.disabled = true;
        setTimeout(function () {
          submit.classList.remove("is-loading");
          submit.classList.add("is-success");
          submit.textContent = "Opening your email...";
          setTimeout(function () {
            submit.classList.remove("is-success");
            submit.disabled = false;
            submit.textContent = submit.dataset.label;
          }, 2600);
        }, 650);
      }
      window.location.href =
        "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      var note = form.querySelector(".form-note");
      if (note) note.textContent = "Opening your email app. If nothing happens, call us at 302-542-3755.";
    });
  }

  // Subtle hero parallax (transform-only, compositor-friendly)
  var heroBg = document.querySelector("[data-parallax]");
  if (heroBg && !reduceMotion) {
    var ticking = false;
    var applyParallax = function () {
      var y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = "translate3d(0," + y * 0.18 + "px,0)";
      }
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
  }

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
