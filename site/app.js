/* Marino Tactical Training | tactical chaos layer + site behavior */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------- Theme toggle (camo <-> usa, persisted) ---------------- */
  function applyTheme(t) {
    if (t === "usa") document.documentElement.setAttribute("data-theme", "usa");
    else document.documentElement.removeAttribute("data-theme");
  }
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "usa" ? "usa" : "camo";
  }
  document.querySelectorAll(".theme-toggle").forEach(function (tt) {
    tt.addEventListener("click", function () {
      var next = currentTheme() === "usa" ? "camo" : "usa";
      applyTheme(next);
      try { localStorage.setItem("mtt-theme", next); } catch (e) {}
      document.querySelectorAll(".theme-toggle").forEach(function (b) {
        b.setAttribute("aria-pressed", next === "usa" ? "true" : "false");
      });
    });
  });

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

  /* ---------------- Reveal on scroll (+ stagger, tracer dividers) ---------------- */
  var reveals = document.querySelectorAll(".reveal, .reveal-stagger, .tracer-divider");
  if (reveals.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------- Ammo count-up stats ---------------- */
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

  /* ---------------- Hero tracer fire (repeating, only while hero visible) ---------------- */
  var tracer = document.querySelector(".tracer");
  var heroEl = document.querySelector(".hero");
  if (tracer && heroEl && fine && !reduce && "IntersectionObserver" in window) {
    var fire = function () {
      tracer.classList.remove("fire"); void tracer.offsetWidth; tracer.classList.add("fire");
    };
    var tInt = null;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!tInt) { fire(); tInt = setInterval(fire, 6000); } }
        else if (tInt) { clearInterval(tInt); tInt = null; }
      });
    }, { threshold: 0.05 }).observe(heroEl);
  }

  /* ---------------- Pause continuous CSS animations when off-screen ---------------- */
  if (!reduce && "IntersectionObserver" in window) {
    var pauseIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.style.animationPlayState = e.isIntersecting ? "running" : "paused"; });
    }, { threshold: 0 });
    document.querySelectorAll(".cta-aura, .radar span").forEach(function (el) { pauseIo.observe(el); });
  }

  /* ---------------- Magnetic CTAs ---------------- */
  if (fine && !reduce) {
    document.querySelectorAll(".btn--magnetic").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { btn.style.transition = "none"; });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.22 + "px," + (e.clientY - r.top - r.height / 2) * 0.3 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------------- PISTOL CURSOR + recoil + bullet holes ---------------- */
  if (fine && !reduce) {
    document.documentElement.classList.add("cursor-on");
    var pistol = document.createElement("div");
    pistol.className = "pistol-cursor";
    pistol.setAttribute("aria-hidden", "true");
    // SVG: a side-profile pistol pointing right, with a muzzle-flash group
    pistol.innerHTML =
      '<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<g class="pistol-body">' +
          // muzzle flash (left of barrel tip... barrel points right so flash at far right)
          '<g class="muzzle" transform="translate(40,17)">' +
            '<path d="M0 0 L14 -5 L7 0 L14 5 Z" fill="#ffd24a"/>' +
            '<path d="M0 0 L10 -2 L6 0 L10 2 Z" fill="#fff"/>' +
          '</g>' +
          // slide / barrel
          '<rect x="10" y="13" width="32" height="8" rx="1.5" fill="#23292e" stroke="#11151800" />' +
          '<rect x="10" y="13" width="32" height="3" rx="1" fill="#39424a"/>' +
          // front sight
          '<rect x="38" y="10" width="2.4" height="4" fill="#23292e"/>' +
          // ejection / detail
          '<rect x="24" y="15" width="5" height="3" rx="0.5" fill="#11151a"/>' +
          // frame + trigger guard
          '<path d="M12 21 L30 21 L28 30 Q27 33 24 33 L20 33 Q17 33 16 30 Z" fill="#2b3238"/>' +
          // grip (angled)
          '<path d="M12 21 L20 21 L17 41 L9 41 Z" fill="#1a1f23" stroke="#39424a" stroke-width="0.6"/>' +
          '<path d="M12 24 L18 24 M11.4 27 L17.4 27 M10.8 30 L16.8 30 M10.2 33 L15.8 33" stroke="#39424a" stroke-width="0.7"/>' +
          // trigger
          '<path d="M22 22 L22 27 L24 27 Z" fill="#6f7d49"/>' +
        '</g>' +
      '</svg>';
    document.body.appendChild(pistol);

    var px = window.innerWidth / 2, py = window.innerHeight / 2, shown = false;
    document.addEventListener("mousemove", function (e) {
      px = e.clientX; py = e.clientY;
      pistol.style.transform = "translate(" + (px - 14) + "px," + (py - 16) + "px)";
      if (!shown) { pistol.classList.add("on"); shown = true; }
      // hot state over interactive targets
      var t = e.target;
      var interactive = t.closest && t.closest("a,button,.btn,.faq-q,input,select,textarea,.card");
      pistol.classList.toggle("hot", !!interactive);
    });
    document.addEventListener("mouseleave", function () { pistol.classList.remove("on"); shown = false; });

    // Fire: recoil + muzzle flash + bullet hole at click point
    document.addEventListener("mousedown", function (e) {
      pistol.classList.remove("kick"); void pistol.offsetWidth; pistol.classList.add("kick");
      // bullet hole slightly ahead of the muzzle (right of cursor)
      var hole = document.createElement("div");
      hole.className = "bullet-hole";
      hole.style.left = (e.clientX + 22) + "px";
      hole.style.top = (e.clientY) + "px";
      document.body.appendChild(hole);
      setTimeout(function () { hole.remove(); }, 3000);
    });
  }

  /* ---------------- Button recoil on any click ---------------- */
  if (!reduce) {
    document.querySelectorAll(".btn").forEach(function (b) {
      b.addEventListener("mousedown", function () {
        b.classList.remove("recoil"); void b.offsetWidth; b.classList.add("recoil");
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
