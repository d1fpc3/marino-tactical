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

  /* ---------------- PISTOL CURSOR + recoil + bullet holes + edge targets ---------------- */
  if (fine && !reduce) {
    document.documentElement.classList.add("cursor-on");

    // Edge shooting targets (decor, desktop only)
    var targetWrap = document.createElement("div");
    targetWrap.className = "edge-targets";
    targetWrap.setAttribute("aria-hidden", "true");
    var targetSVG =
      '<svg viewBox="0 0 120 120" width="120" height="120">' +
        '<circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>' +
        '<circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>' +
        '<circle cx="60" cy="60" r="30" fill="none" stroke="var(--tgt-accent)" stroke-width="2" opacity="0.65"/>' +
        '<circle cx="60" cy="60" r="16" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>' +
        '<circle cx="60" cy="60" r="5" fill="var(--tgt-accent)" opacity="0.8"/>' +
        '<path d="M60 0 V14 M60 106 V120 M0 60 H14 M106 60 H120" stroke="currentColor" stroke-width="1.5" opacity="0.45"/>' +
      '</svg>';
    targetWrap.innerHTML =
      '<div class="edge-target edge-target--l">' + targetSVG + '</div>' +
      '<div class="edge-target edge-target--r">' + targetSVG + '</div>';
    document.body.appendChild(targetWrap);
    var targets = targetWrap.querySelectorAll(".edge-target");

    // Pistol cursor
    var pistol = document.createElement("div");
    pistol.className = "pistol-cursor";
    pistol.setAttribute("aria-hidden", "true");
    // Cleaner side-profile pistol (Glock-ish), barrel pointing right, muzzle = aim point
    pistol.innerHTML =
      '<svg width="58" height="46" viewBox="0 0 58 46" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<g class="pistol-body">' +
          // muzzle flash at barrel tip (right)
          '<g class="muzzle" transform="translate(50,11)">' +
            '<path d="M0 0 L16 -6 L9 -1 L18 0 L9 1 L16 6 Z" fill="#ffce3a"/>' +
            '<path d="M0 0 L11 -2.5 L7 0 L11 2.5 Z" fill="#fff"/>' +
            '<circle cx="2" cy="0" r="3.5" fill="#ffe89a"/>' +
          '</g>' +
          // slide (top block) with subtle bevel
          '<path d="M6 8 H50 a1.5 1.5 0 0 1 1.5 1.5 V14 a1.5 1.5 0 0 1 -1.5 1.5 H6 Z" fill="#222a22"/>' +
          '<rect x="6" y="8" width="45.5" height="2.4" rx="1" fill="#454f3c"/>' +
          // slide serrations (rear grip lines)
          '<path d="M10 9.5 V14 M12.4 9.5 V14 M14.8 9.5 V14" stroke="#11150f" stroke-width="0.9" opacity="0.7"/>' +
          // front + rear sights
          '<rect x="46" y="5.5" width="2.4" height="3" fill="#222a22"/>' +
          '<rect x="8" y="5.5" width="3" height="3" fill="#222a22"/>' +
          // ejection port
          '<rect x="30" y="9.8" width="7" height="3.2" rx="0.6" fill="#0c0f0a"/>' +
          // frame under slide
          '<path d="M8 15.5 H40 L37.5 21 H13 Z" fill="#2c3528"/>' +
          // trigger guard (loop)
          '<path d="M16 21 H30 a3 3 0 0 1 3 3 a3 3 0 0 1 -3 3 H22 a3 3 0 0 0 -3 3 Z" fill="none" stroke="#2c3528" stroke-width="2.4"/>' +
          // trigger
          '<path d="M24 23.5 v4 a2 2 0 0 0 2 2 Z" fill="#9aa67a"/>' +
          // grip (raked back)
          '<path d="M8 15.5 H17 L13 42 a2 2 0 0 1 -2 1.6 H7 a1.5 1.5 0 0 1 -1.5 -2 Z" fill="#1a1f17"/>' +
          // grip texture stippling
          '<path d="M8.5 20 H15 M8 24 H14.4 M7.6 28 H13.8 M7.2 32 H13.2 M6.8 36 H12.6" stroke="#3a4430" stroke-width="0.8" opacity="0.8"/>' +
          // magazine baseplate hint
          '<rect x="6" y="42.5" width="7.5" height="2.5" rx="0.6" fill="#11150f"/>' +
        '</g>' +
      '</svg>';
    document.body.appendChild(pistol);

    // hotspot: the muzzle tip in viewBox coords is ~ (50, 11). At 58x46 render, offset so muzzle sits at the pointer.
    var HX = 50, HY = 11;
    var shown = false;
    document.addEventListener("mousemove", function (e) {
      pistol.style.transform = "translate(" + (e.clientX - HX) + "px," + (e.clientY - HY) + "px)";
      if (!shown) { pistol.classList.add("on"); shown = true; }
      var t = e.target;
      var interactive = t.closest && t.closest("a,button,.btn,.faq-q,input,select,textarea,.card,.theme-toggle");
      pistol.classList.toggle("hot", !!interactive);
    }, { passive: true });
    document.addEventListener("mouseleave", function () { pistol.classList.remove("on"); shown = false; });

    // Fire: recoil + muzzle flash + impact bullet hole + target pulse
    var liveHoles = 0;
    document.addEventListener("mousedown", function (e) {
      pistol.classList.remove("kick"); void pistol.offsetWidth; pistol.classList.add("kick");

      // pulse the edge targets
      targets.forEach(function (tg) { tg.classList.remove("hit"); void tg.offsetWidth; tg.classList.add("hit"); });

      if (liveHoles > 12) return; // bound cost on rapid clicking
      // impact slightly ahead of the muzzle (right of cursor)
      var hx = e.clientX + 20, hy = e.clientY - 4;
      var hole = document.createElement("div");
      hole.className = "bullet-hole";
      hole.style.left = hx + "px";
      hole.style.top = hy + "px";
      // cracks (randomized via index, no Math.random needed for variety here)
      var cracks = "";
      var angles = [12, 68, 128, 192, 240, 305];
      for (var i = 0; i < angles.length; i++) {
        var len = 9 + (i % 3) * 4;
        cracks += '<span class="crack" style="transform:rotate(' + angles[i] + 'deg);width:' + len + 'px"></span>';
      }
      // debris specks
      var debris = "";
      for (var d = 0; d < 5; d++) {
        debris += '<span class="speck" style="--a:' + (d * 72 + 20) + 'deg"></span>';
      }
      hole.innerHTML = '<span class="hole-core"></span>' + cracks + debris;
      document.body.appendChild(hole);
      liveHoles++;
      setTimeout(function () { hole.remove(); liveHoles--; }, 3200);
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
