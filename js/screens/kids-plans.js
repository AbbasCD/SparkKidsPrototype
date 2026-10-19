/* 1 · Plan Select — Kids – full page (1:1238, title "Select plan").
   Sheets: Compare plans (67:5288) · Feature details (65:4698).
   Rules: handover §7.2, §8.2–8.4. */
(function (S) {
  var ui = S.ui, I = S.icon;

  var PLANS = [
    { name: "Safe Start", photo: "plan-safe-start.jpg",
      sub: "Protect your child’s first phone with call safety and only essential, educational apps.",
      rows: [["Internet access toggle"], ["Controlled app access", "Educational apps only"], ["Messaging and video chat", "WhatsApp, FaceTime"],
             ["YouTube set to Strict", "Under-PG13 videos for young children."], ["Trusted contacts", "Add and review selected contacts"]],
      blocked: "Gaming and streaming, social media" },
    { name: "Guided Freedom", photo: "plan-guided-freedom.jpg",
      sub: "Let them enjoy more freedom with limited access to streaming, games and chat.",
      rows: [["Internet access toggle"], ["Controlled app access", "Manage gaming and streaming apps"], ["Messaging and video chat", "WhatsApp, FaceTime"],
             ["YouTube set to Moderate", "A larger library of videos with restrictions,"], ["Trusted contacts", "Add and review selected contacts"]],
      blocked: "Social media" },
    { name: "Independent Explorer", photo: "plan-independent-explorer.jpg",
      sub: "Let mature teens explore social media and hobbies with control when needed.",
      rows: [["Internet access toggle"], ["Controlled app access", "Manage use of specific apps"], ["Messaging and video chat", "WhatsApp, FaceTime"],
             ["YouTube set to Light", "YouTube’s catalogue but safely restricted."]],
      blocked: null }
  ];

  function slug(n) { return n.toLowerCase().replace(/\s+/g, "-"); }

  function planCard(p) {
    return '<article class="plan-card" id="plan-' + slug(p.name) + '" aria-label="' + p.name + '">' +
      ui.photo(p.photo, "", "") +
      '<div class="plan-card__body"><div class="plan-card__main">' +
        '<div><h2 class="plan-card__name t-kids-title">' + p.name + '</h2><p class="plan-card__sub">' + p.sub + "</p></div>" +
        // data and price from S.model.PLANS (client decision: 5/10/20GB, RM5/RM10/RM15)
        '<div class="plan-card__specs"><p class="plan-card__spec">Data <b>' + S.model.planInfo(p.name).gb + 'GB</b></p><p class="plan-card__spec">Validity <b>30 days</b></p><p class="plan-card__price">' + S.model.planInfo(p.name).price + "</p></div>" +
        '<div class="plan-card__features"><div class="plan-card__rows">' +
          p.rows.map(function (r) {
            return '<div class="feature-row' + (r[1] ? "" : " feature-row--single") + '">' + I("kids-check") +
              '<p class="feature-row__text"><b>' + r[0] + "</b>" + (r[1] ? "<span>" + r[1] + "</span>" : "") + "</p></div>";
          }).join("") + "</div>" +
          (p.blocked ? '<p class="blocked-box"><b>Blocked</b><span>' + p.blocked + "</span></p>" : "") +
        "</div>" +
        ui.infoChip({ label: "See feature details", attrs: { "data-sheet": "features" } }) +
      "</div>" +
      ui.button({ label: "Select", variant: "secondary", size: "small", block: true, attrs: { "data-select": p.name } }) +
      "</div></article>";
  }

  function protectCard() {
    return '<section class="protect-card" id="protection" aria-label="Included in all Junior plans">' +
      '<div class="protect-card__top">' + I("brand-shield") + '<span class="protect-card__badge">Included in all Junior plans</span></div>' +
      '<div class="protect-card__list">' + ui.checkRow("Pause internet access anytime") + ui.checkRow("Default browser SafeSearch") + ui.checkRow("Network-level content filtering") + "</div>" +
      '<p class="protect-card__note">Adult content and unsafe websites are always blocked.</p>' +
      ui.infoChip({ label: "Learn more about plans", attrs: { "data-sheet": "features" } }) +
      "</section>";
  }

  /* Smooth scroll inside the screen — 600ms ease-in-out (§7 "scroll") */
  function scrollToEl(scroller, el) {
    var target = Math.max(0, Math.min(el.offsetTop - (136 + sbHeight(scroller)) + offsetWithin(el, scroller), scroller.scrollHeight - scroller.clientHeight));
    var from = scroller.scrollTop, d = target - from, t0 = performance.now(), dur = 600;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { scroller.scrollTop = target; return; }
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      scroller.scrollTop = from + d * e;
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  /* Smooth scroll to the very bottom of the screen (same 600ms ease-in-out) */
  function scrollToBottom(scroller) {
    var target = scroller.scrollHeight - scroller.clientHeight;
    var from = scroller.scrollTop, d = target - from, t0 = performance.now(), dur = 600;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { scroller.scrollTop = target; return; }
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      scroller.scrollTop = from + d * e;
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  /* height of the top gap that replaced the status bar (16px, or the notch) */
  function sbHeight(scroller) { var sb = scroller.querySelector(".status-bar"); return sb ? sb.offsetHeight : 0; }
  function offsetWithin(el, scroller) { // offsetTop is relative to offsetParent; add parents' offsets up to the scroller
    var extra = 0, p = el.offsetParent;
    while (p && p !== scroller && scroller.contains(p)) { extra += p.offsetTop; p = p.offsetParent; }
    return extra;
  }

  /* ---------- Sheets ---------- */
  var Y = function () { return '<span class="is-yes" aria-label="Included">' + I("kids-check") + "</span>"; };
  var N = function () { return '<span class="is-no" aria-label="Not included">' + I("close") + "</span>"; };
  var COMPARE = [
    ["Data", ["5GB", "10GB", "20GB"], true],
    ["App<br>toggle", ["-", "Gaming and<br>streaming", "All apps"], false, true],
    ["Internet<br>access toggle", [Y, Y, Y], true],
    ["SafeSearch", [Y, Y, Y]],
    ["Trusted<br>contacts", [Y, Y, N], true],
    ["YouTube", ["Strict", "Moderate", "-"], false, true],
    ["WhatsApp", [Y, Y, Y], true],
    ["FaceTime", [Y, Y, Y]],
    ["Educational<br>apps", [Y, Y, Y], true],
    ["Gaming", [N, Y, Y], false, true],
    ["Streaming", [N, N, Y], true],
    ["Social media", [N, N, Y], false, true]
  ];
  function openCompare(scroller) {
    var table = '<div class="compare" role="table" aria-label="Compare plans">' +
      '<div class="compare__row compare__row--head" role="row"><span class="compare__label" role="columnheader"></span><div class="compare__cells">' +
        ["Safe <br>Start", "Guided Freedom", "Independent Explorer"].map(function (n) { return '<span class="compare__cell compare__plan" role="columnheader">' + n + "</span>"; }).join("") +
      "</div></div>" +
      COMPARE.map(function (r) {
        return '<div class="compare__row' + (r[2] ? " compare__row--tint" : "") + '" role="row"><span class="compare__label' + (r[3] ? " is-ink" : "") + '" role="rowheader">' + r[0] + '</span><div class="compare__cells">' +
          r[1].map(function (c) { return '<span class="compare__cell" role="cell">' + (typeof c === "function" ? c() : c) + "</span>"; }).join("") + "</div></div>";
      }).join("") + "</div>";
    // "See protection info" (client request): close the sheet, then scroll to the
    // bottom of Select plan, where the "Included in all Junior plans" card sits
    var rec = S.sheet.open({ className: "sheet--compare", header: ui.sheetNavHeader("Compare plans"),
      content: table + ui.infoChip({ label: "See protection info", attrs: { "data-protection": "" } }) });
    rec.root.addEventListener("click", function (e) {
      if (!e.target.closest("[data-protection]")) return;
      rec.close();
      setTimeout(function () { scrollToBottom(scroller); }, 280);
    });
  }
  function openFeatures() {
    var item = function (t, b) { return '<div class="feature-detail"><b>' + t + "</b>" + b + "</div>"; };
    S.sheet.open({ className: "sheet--features", header: ui.sheetNavHeader("Feature details"),
      content: '<p class="features__intro">How our Kids plan features work.</p><div class="features__list">' +
        item("SafeSearch", "Explicit and harmful content is blocked on Google and Bing search engines.") +
        item("Controlled app access", "Toggle the apps you want your child to access.") +
        item("YouTube settings", "Age-appropriate content with banded restrictions.<br><br><em>Strict</em>: Selected content for young children, excluding PG-13+ videos.<br><br><em>Moderate</em>: More educational and entertainment content, with adult material filtered out.") +
        item("Trusted contacts", "Manage and review who your child can contact on their device.") +
        "</div>" });
  }

  /* ---------- Screen ---------- */
  S.router.define("/kids-plans", {
    render: function (ctx) {
      ctx.scroll.innerHTML =
        '<div class="kp"><div class="kp__bg" aria-hidden="true"></div><div class="kp__ext" aria-hidden="true"></div>' +
          '<div class="kp__top">' + ui.statusBar({ kids: true }) + ui.pageNav({ title: "Select plan" }) + "</div>" +
          '<div class="kp__hero"><p>Let your kid kongsi with trusted pals, without worrying.</p>' +
            '<button type="button" class="kp__chip" data-tap="surface" data-anchor="protection">' + I("brand-shield") + "<span>Protection as standard</span>" + I("info") + "</button></div>" +
          ui.planTabsHeader("Safe Start") +
          '<div class="kp__list">' + PLANS.map(planCard).join("") + protectCard() + "</div>" +
        "</div>";
      ctx.pinBottom(ui.el('<div class="kp-footer">' + ui.button({ label: "Compare plans", variant: "secondary", filled: true, attrs: { "data-sheet": "compare" } }) + "</div>"), { transparent: true });

      ctx.el.addEventListener("click", function (e) {
        var t = e.target;
        var a = t.closest("[data-anchor]");
        if (a) { scrollToEl(ctx.scroll, ctx.scroll.querySelector("#" + a.dataset.anchor)); return; }
        var sh = t.closest("[data-sheet]");
        if (sh) { sh.dataset.sheet === "compare" ? openCompare(ctx.scroll) : openFeatures(); return; }
        var sel = t.closest("[data-select]");
        if (sel) { select(sel.dataset.select); }
      });
      // Plan tabs: app.js handles the selected state; we scroll to the card.
      // The tab spy is paused while that scroll runs so tabs don't flicker.
      var spyPause = 0;
      ctx.el.addEventListener("plan-select", function (e) {
        spyPause = performance.now() + 700;
        current = e.detail.plan;
        scrollToEl(ctx.scroll, ctx.scroll.querySelector("#plan-" + slug(e.detail.plan)));
      });

      /* Tab spy (client request): the tab follows the plan whose title the
         user can see — a title counts as seen once it rises above the pinned
         Compare plans button. */
      var row = ctx.el.querySelector(".plan-tabs"), current = "Safe Start", ticking = false;
      function setTab(name) {
        if (name === current) return;
        current = name;
        row.querySelectorAll(".plan-tabs__tab").forEach(function (t) {
          var on = t.dataset.plan === name;
          t.classList.toggle("is-selected", on); t.setAttribute("aria-selected", String(on));
          if (on) { // keep the active tab in view inside the horizontal tab row
            var l = t.offsetLeft - 24, r = t.offsetLeft + t.offsetWidth - row.clientWidth + 24;
            if (row.scrollLeft > l) row.scrollTo({ left: l, behavior: "smooth" });
            else if (row.scrollLeft < r) row.scrollTo({ left: r, behavior: "smooth" });
          }
        });
      }
      function spy() {
        ticking = false;
        if (performance.now() < spyPause) return;
        var footer = ctx.el.querySelector(".screen__fixed-bottom");
        var limit = ctx.scroll.getBoundingClientRect().bottom - (footer ? footer.offsetHeight : 0);
        var active = PLANS[0].name;
        PLANS.forEach(function (p) {
          var t = ctx.scroll.querySelector("#plan-" + slug(p.name) + " .plan-card__name");
          if (t && t.getBoundingClientRect().top < limit) active = p.name;
        });
        setTab(active);
      }
      ctx.scroll.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    },
    // §7.2 back: leaving a Change-plan round trip restores phase "payment"
    beforeBack: function () { if (S.state.phase === "changePlan") S.state.set({ phase: "payment" }); }
  });

  /* §7.2 Select — exactly one of three rules applies */
  function select(planName) {
    S.state.set({ selectedPlan: planName }); // remembered for Payment summary (§11 suggestion)
    var st = S.state;
    if (st.phase === "changePlan") { S.state.set({ phase: "payment" }); S.router.back(); return; }
    // Kids › My plan › Change plan sets journey "switchPlan" (Figma 25:7640)
    if (st.journey === "switchPlan") { S.state.set({ phase: "payment" }); S.router.go("/payment"); return; }
    if (st.loggedIn) { S.state.set({ phase: "number" }); S.router.go("/number"); return; }
    S.state.set({ phase: "account" }); S.router.go("/signup");
  }
})(window.Spark = window.Spark || {});
