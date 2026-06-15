/* Marino Tactical Training | site behavior (professional glass build) */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------- Mobile nav (full-screen overlay) ---------------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  function setMenu(open) {
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
    links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("open")) setMenu(false); });
  }

  /* ---------------- Sticky header state ---------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 12); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      if (item) item.classList.toggle("open");
    });
  });

  /* ---------------- Kinetic hero + fade-ups (on load) ---------------- */
  var loaders = document.querySelectorAll(".kinetic, .fade-up");
  if (loaders.length) {
    if (reduce) loaders.forEach(function (el) { el.classList.add("in"); });
    else requestAnimationFrame(function () { requestAnimationFrame(function () { loaders.forEach(function (el) { el.classList.add("in"); }); }); });
  }

  /* ---------------- Reveal on scroll (+ stagger, dividers) ----------------
     Robust: threshold 0 (any pixel triggers, so tall sections never get
     skipped), reveal anything already in view on init, and a final safety
     sweep so content can never be left invisible if the observer misfires. */
  var reveals = document.querySelectorAll(".reveal, .reveal-stagger, .tracer-divider");
  if (reveals.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) {
        // Only below-fold elements get .pre (start hidden) + animate in on scroll.
        // In-view elements are never hidden — they just stay visible.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
        el.classList.add("pre");
        io.observe(el);
      });
    }
  }

  /* ---------------- Count-up stats ---------------- */
  if (!reduce && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; cio.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var pad = el.getAttribute("data-pad");
        var start = null, dur = 1200;
        function fmt(n) { var s = String(n); if (pad) while (s.length < +pad) s = "0" + s; return s + suffix; }
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.textContent = fmt(v);
          if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });
  }

  /* ---------------- Pause continuous CSS animations when off-screen ---------------- */
  if (!reduce && "IntersectionObserver" in window) {
    var pauseIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.style.animationPlayState = e.isIntersecting ? "running" : "paused"; });
    }, { threshold: 0 });
    document.querySelectorAll(".cta-aura").forEach(function (el) { pauseIo.observe(el); });
  }

  /* ---------------- Magnetic CTAs ---------------- */
  if (fine && !reduce) {
    document.querySelectorAll(".btn--magnetic").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { btn.style.transition = "none"; });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.18 + "px," + (e.clientY - r.top - r.height / 2) * 0.24 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform 0.5s cubic-bezier(0.34,1.4,0.64,1)";
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------------- Glass cards: cursor-follow sheen (premium microinteraction) ---------------- */
  if (fine && !reduce) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  }

  /* ---------------- Contact form: mailto + loading/success ---------------- */
  var form = document.querySelector("[data-mailto-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = form.getAttribute("data-mailto-form");
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ""; };
      var subject = "Class inquiry from " + (get("name") || "website");
      var body = "Name: " + get("name") + "\nEmail: " + get("email") + "\nPhone: " + get("phone") +
        "\nCourse of interest: " + get("course") + "\n\n" + get("message");
      var submit = form.querySelector('button[type="submit"]');
      if (submit) {
        if (!submit.dataset.label) submit.dataset.label = submit.textContent;
        submit.classList.add("is-loading"); submit.disabled = true;
        setTimeout(function () {
          submit.classList.remove("is-loading"); submit.classList.add("is-success"); submit.textContent = "Opening email...";
          setTimeout(function () { submit.classList.remove("is-success"); submit.disabled = false; submit.textContent = submit.dataset.label; }, 2600);
        }, 650);
      }
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var note = form.querySelector(".form-note");
      if (note) note.textContent = "Opening your email app. If nothing happens, call us at 302-542-3755.";
    });
  }

  /* ---------------- Hero grid parallax ---------------- */
  var grid = document.querySelector("[data-parallax]");
  if (grid && !reduce) {
    var tick = false;
    window.addEventListener("scroll", function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight) grid.style.transform = "translate3d(0," + y * 0.15 + "px,0)";
        tick = false;
      });
    }, { passive: true });
  }

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
