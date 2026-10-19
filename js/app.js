/* Boot + shared behaviour wired once by event delegation. */
(function (S) {
  var device = document.querySelector(".device");
  var screens = device.querySelector(".screens");
  var overlays = device.querySelector(".overlays");

  /* Desktop: scale the 375×812 device down if the window is short */
  function fit() {
    var s = Math.min(1, (window.innerHeight - 48) / (812 + 22), (window.innerWidth - 48) / (375 + 22));
    document.documentElement.style.setProperty("--device-scale", String(Math.max(0.5, s)));
  }
  window.addEventListener("resize", fit); fit();

  S.sheet.mount(overlays, screens);

  device.addEventListener("click", function (e) {
    var t = e.target;

    // Header back arrows and any [data-action="back"]
    if (t.closest('[data-action="back"]')) { S.router.back(); return; }

    // Generic navigation for prototype links: data-go="/route" [data-transition]
    var go = t.closest("[data-go]");
    if (go) { S.router.go(go.dataset.go, { transition: go.dataset.transition || "push" }); return; }

    // Toggle – Switch: per-visit state; fires "toggle" so linked labels can follow
    var tg = t.closest(".toggle");
    if (tg) {
      var on = !tg.classList.contains("is-on");
      tg.classList.toggle("is-on", on);
      tg.setAttribute("aria-checked", String(on));
      tg.dispatchEvent(new CustomEvent("toggle", { bubbles: true, detail: { on: on } }));
      return;
    }

    // Single-select groups (option cards, radio options)
    var opt = t.closest('[role="radio"]');
    if (opt && opt.getAttribute("aria-disabled") === "true") return; // muted options can't be chosen
    var group = opt && opt.closest("[data-radio-group]");
    if (opt && group) {
      group.querySelectorAll('[role="radio"]').forEach(function (r) {
        var sel = r === opt;
        r.setAttribute("aria-checked", String(sel));
        r.classList.toggle("is-selected", sel);
        var dot = r.querySelector(".radio"); if (dot) dot.classList.toggle("is-on", sel);
      });
      group.dispatchEvent(new CustomEvent("select", { bubbles: true, detail: { el: opt } }));
      return;
    }

    // Checkbox
    var cb = t.closest('[role="checkbox"]');
    if (cb) {
      var c = !cb.classList.contains("is-checked");
      cb.classList.toggle("is-checked", c); cb.setAttribute("aria-checked", String(c));
      return;
    }

    // Plan tabs: select (150ms colour transition); screens add the scroll-to
    var tab = t.closest(".plan-tabs__tab");
    if (tab) {
      tab.parentNode.querySelectorAll(".plan-tabs__tab").forEach(function (b) {
        var sel = b === tab; b.classList.toggle("is-selected", sel); b.setAttribute("aria-selected", String(sel));
      });
      tab.dispatchEvent(new CustomEvent("plan-select", { bubbles: true, detail: { plan: tab.dataset.plan } }));
      return;
    }

    if (t.closest('[data-action="dismiss-alert"]')) { t.closest(".alert").remove(); return; }

    if (t.closest('[data-action="demo-sheet"]')) {
      S.sheet.open({
        title: "Account",
        content: '<div style="padding:0 24px 32px">' +
          S.ui.profileRow({ name: "Katie Doe", sub: "Your profile and other details" }) +
          '<div style="margin-top:12px;background:#fff;border-radius:24px">' +
          S.ui.menuRow({ label: "Manage your lines" }) + S.ui.menuRow({ label: "Your activity", icon: "ticket" }) + S.ui.menuRow({ label: "Log out", icon: "logout" }) +
          '</div><div style="margin-top:24px">' + S.ui.button({ label: "Got it", block: true, lexend: true, attrs: { "data-close": "" } }) + "</div></div>"
      });
    }
  });

  /* Drag-to-scroll for horizontal rows ([data-drag-scroll], e.g. plan tabs).
     Fingers already scroll natively; this adds mouse/pen dragging with a little
     momentum, and swallows the click after a drag so a tab isn't selected. */
  device.addEventListener("pointerdown", function (e) {
    var row = e.target.closest("[data-drag-scroll]");
    if (!row || e.pointerType === "touch" || e.button !== 0) return;
    var startX = e.clientX, startLeft = row.scrollLeft, dragged = false;
    var lastX = e.clientX, lastT = performance.now(), v = 0;
    function move(ev) {
      var dx = ev.clientX - startX;
      if (!dragged && Math.abs(dx) < 5) return;
      if (!dragged) { dragged = true; row.classList.add("is-dragging"); }
      row.scrollLeft = startLeft - dx;
      var now = performance.now(); v = (ev.clientX - lastX) / Math.max(1, now - lastT); lastX = ev.clientX; lastT = now;
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!dragged) return;
      row.classList.remove("is-dragging");
      var stop = function (ev) { ev.stopPropagation(); ev.preventDefault(); };
      row.addEventListener("click", stop, true);
      setTimeout(function () { row.removeEventListener("click", stop, true); }, 60);
      (function glide() { // momentum
        if (Math.abs(v) < 0.02) return;
        row.scrollLeft -= v * 16; v *= 0.92; requestAnimationFrame(glide);
      })();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });

  S.router.start({ screensEl: screens, deviceEl: device, home: "/splash" });
  S.themeColor.start(device);   // browser / phone top bar follows the page colour
  S.debug.mount();
})(window.Spark = window.Spark || {});
