/* 0 · Landing — Splash (1:9), Landing carousel (10:1183/10:1259/10:1329),
   Intro plans (1:1457). Navigation per handover §7.1. */
(function (S) {
  var ui = S.ui, I = S.icon;

  /* ---------- Splash: after 3s dissolve to Landing (replace history) ---------- */
  S.router.define("/splash", {
    render: function (ctx) {
      S.state.reset();   // client request: seeing the splash starts a clean test
      ctx.el.innerHTML = '<div class="splash" role="img" aria-label="Spark">' + I("spark-wordmark") + "</div>";
    },
    onEnter: function (ctx) {
      clearTimeout(ctx.timer);
      ctx.timer = setTimeout(function () {
        if (S.router.current() === "/splash") S.router.go("/landing", { transition: "dissolve", replace: true });
      }, 3000);
    }
  });

  /* ---------- Landing carousel ---------- */
  var SLIDES = [
    { key: "refresh", photo: "landing-refresh.jpg", img: [-138, -44, 747, 656], glow: [73, 276],
      headline: "Refresh on the go.<br>Easy lah.", cta: "Explore Spark", go: "/intro-plans" },
    { key: "power", photo: "landing-power-up.jpg", img: [-138, -60, 765, 672], glow: [33, 356],
      headline: "Never run dry.<br>Power up.", cta: "Explore plans", go: "/intro-plans" },
    { key: "kids", photo: "landing-kids.jpg", img: [-257, 0, 943, 612, 12], glow: [39, 289],
      headline: "Protected.<br>By default.", cta: "Explore Kids plans", go: "/kids-plans" }
  ];
  var AUTO_MS = 5000;

  function slideHTML(s, i) {
    var im = s.img;
    return '<div class="landing__slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of 3">' +
      ui.photo(s.photo, "landing__photo", "") +
      '<div class="landing__glow" style="left:' + s.glow[0] + "px;top:" + s.glow[1] + 'px"></div>' +
      '<div class="landing__content">' +
        '<h2 class="landing__headline t-carousel">' + s.headline + "</h2>" +
        '<div class="landing__ctas">' +
          '<button type="button" class="btn btn--special btn--large" data-go="' + s.go + '"><span>' + s.cta + "</span>" + I("brand-chevron-r") + "</button>" +
          '<div class="landing__row">' +
            ui.button({ label: "Sign in", variant: "secondary", filled: true, attrs: { "data-go": "/signin" } }) +
            ui.button({ label: "Create account", variant: "secondary", filled: true, attrs: { "data-go": "/signup" } }) +
          "</div></div></div></div>";
  }

  S.router.define("/landing", {
    render: function (ctx) {
      ctx.el.innerHTML =
        '<div class="landing" aria-roledescription="carousel" aria-label="Welcome to Spark">' +
          '<div class="landing__top">' +
            '<button type="button" class="landing__pill landing__pill--lang" data-tap="surface" aria-label="Language: English">' + I("language") + "<span>EN</span></button>" +
            '<button type="button" class="landing__pill landing__pill--skip" data-tap="surface" data-go="/intro-plans" data-transition="dissolve">Skip</button>' +
          "</div>" +
          '<div class="landing__brand">' +
            '<div class="landing__brand-item landing__brand-item--wordmark is-active" aria-hidden="true">' + I("spark-wordmark") + "</div>" +
            '<div class="landing__brand-item" aria-hidden="true">' + I("spark-logo", "icon-logo") + '<p class="landing__tagline t-tagline">A SIM for you. Not someone like you.</p></div>' +
            '<div class="landing__brand-item" aria-hidden="true"><div class="landing__kids-logo">' + I("spark-logo-short") + '<span>KIDS</span></div><p class="landing__tagline t-tagline">The SIM with peace of mind built-in.</p></div>' +
          "</div>" +
          '<div class="landing__dots" aria-hidden="true"><span class="landing__dot is-active"></span><span class="landing__dot"></span><span class="landing__dot"></span></div>' +
          '<div class="landing__viewport"><div class="landing__track">' + SLIDES.map(slideHTML).join("") + "</div></div>" +
          '<p class="sr-only" aria-live="polite" data-live></p>' +
        "</div>";
      setupCarousel(ctx);
    },
    onEnter: function (ctx) { ctx.carousel.play(); },
    onShow: function (ctx) { ctx.carousel.play(); }
  });

  function setupCarousel(ctx) {
    var root = ctx.el.querySelector(".landing");
    var vp = root.querySelector(".landing__viewport");
    var track = root.querySelector(".landing__track");
    var brands = root.querySelectorAll(".landing__brand-item");
    var dots = root.querySelectorAll(".landing__dot");
    var slides = root.querySelectorAll(".landing__slide");
    var live = root.querySelector("[data-live]");
    var index = 0, timer = null;

    function show(i, announce) {
      index = (i + SLIDES.length) % SLIDES.length;
      track.style.transform = "translate3d(" + (-index * 100 / 3) + "%,0,0)";
      root.classList.toggle("is-kids", SLIDES[index].key === "kids");
      // phone / browser bar: final colour now, not after the 600ms background fade
      if (S.themeColor && S.router.current() === "/landing")
        S.themeColor.set(getComputedStyle(document.documentElement).getPropertyValue(SLIDES[index].key === "kids" ? "--color-brand-pink" : "--color-brand-yellow").trim().toLowerCase(), 600);
      brands.forEach(function (b, n) { b.classList.toggle("is-active", n === index); });
      dots.forEach(function (d, n) { d.classList.toggle("is-active", n === index); });
      slides.forEach(function (s, n) { s.inert = n !== index; s.setAttribute("aria-hidden", String(n !== index)); });
      if (announce) live.textContent = "Slide " + (index + 1) + " of 3";
    }
    function isVisible() { return S.router.current() === "/landing" && !document.hidden; }
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(function () { if (isVisible()) show(index + 1); schedule(); }, AUTO_MS);
    }

    /* Swipe / drag either way; wraps like the auto-advance */
    var startX = 0, startY = 0, dx = 0, dragging = false, decided = false, t0 = 0;
    vp.addEventListener("pointerdown", function (e) {
      if (e.button && e.button !== 0) return;
      dragging = true; decided = false; dx = 0; startX = e.clientX; startY = e.clientY; t0 = performance.now();
    });
    vp.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var mx = e.clientX - startX, my = e.clientY - startY;
      if (!decided) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        decided = true;
        if (Math.abs(my) > Math.abs(mx)) { dragging = false; return; }
        vp.setPointerCapture(e.pointerId);
        track.classList.add("is-dragging"); vp.classList.add("is-dragging");
        clearTimeout(timer);
      }
      dx = mx;
      var w = vp.offsetWidth;
      track.style.transform = "translate3d(" + (-index * w + dx) + "px,0,0)";
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      if (!decided) return;
      track.classList.remove("is-dragging"); vp.classList.remove("is-dragging");
      var v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      var w = vp.offsetWidth;
      if (Math.abs(dx) > w * 0.2 || v > 0.5) show(index + (dx < 0 ? 1 : -1), true); else show(index);
      // swallow the click that follows a drag so buttons under the finger don't fire
      var stop = function (ev) { ev.stopPropagation(); ev.preventDefault(); };
      vp.addEventListener("click", stop, true);
      setTimeout(function () { vp.removeEventListener("click", stop, true); }, 60);
      schedule();
    }
    vp.addEventListener("pointerup", end);
    vp.addEventListener("pointercancel", end);
    vp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { show(index + 1, true); schedule(); }
      if (e.key === "ArrowLeft") { show(index - 1, true); schedule(); }
    });

    show(0);
    ctx.carousel = { play: schedule, show: show };
  }

  /* ---------- Intro plans ---------- */
  S.router.define("/intro-plans", {
    render: function (ctx) {
      ctx.scroll.innerHTML =
        ui.statusBar({ kids: true }) +
        ui.pageNav({ title: "Plans" }) +
        '<div class="intro__cards">' +
          // Spark (adult) card: no destination in the prototype — press feedback only (§11)
          '<button type="button" class="product-card product-card--mobile" data-tap="surface" aria-label="Spark Mobile plans">' +
            ui.photo("intro-mobile.jpg", "", "") +
            '<span class="product-card__row"><span class="product-card__text">' +
              '<span class="product-card__logo">' + I("spark-logo-card") + "<span>MOBILE</span></span>" +
              '<span class="product-card__desc">An eSIM for you. Not someone like you.<br>Plans starting from RM0* / month.</span>' +
            "</span>" + I("card-chevron", "icon-chev") + "</span></button>" +
          '<button type="button" class="product-card product-card--kids" data-tap="surface" data-go="/kids-plans" aria-label="Spark Kids plans">' +
            ui.photo("intro-kids.jpg", "", "") +
            '<span class="product-card__row"><span class="product-card__text">' +
              '<span class="product-card__logo">' + I("spark-logo-card") + "<span>KIDS</span></span>" +
              '<span class="product-card__desc">An eSIM with peace of mind settings.<br>Plans starting from RM5 / month.</span>' +
            "</span>" + I("card-chevron", "icon-chev") + "</span></button>" +
        "</div>";
      ctx.pinBottom(ui.el(ui.kidsTabBar("default")), { transparent: true });
    }
  });
})(window.Spark = window.Spark || {});
