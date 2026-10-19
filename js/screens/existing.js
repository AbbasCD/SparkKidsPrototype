/* 8 · Existing customer — Dashboard – Mobile 40GB (24:2923), Dashboard –
   Mobile + activate eSIM (95:5290), Dashboard – Kids + Mobile (24:3096),
   Manage lines (24:2059).
   Wiring copied from the Figma prototype:
   - Profile (top bar) on every dashboard → Account sheet (S.openAccount, kids.js).
   - Mobile + activate eSIM › Activate eSIM → push Another device (24:1950).
   - Kids + Mobile › pink Kids tab → Kids dashboard, dissolve 300ms.
   - Manage lines › Activate SIM → journey "existing", loggedIn, phase "sim",
     push Choose SIM. Everything else is press feedback only. */
(function (S) {
  var ui = S.ui, I = S.icon;

  var chevronGlyph = function () { return '<svg class="icon" width="24" height="24" viewBox="0 0 48 48" fill="none" aria-hidden="true" style="color:#20202D">' + S.glyphs["chevron-right"] + "</svg>"; };

  /* Card/Plan usage — yellow Mobile plan card */
  function planUsage() {
    var stat = function (icon, label) {
      return '<div class="pu-stat">' + I(icon) + '<span class="pu-stat__label">' + label + '</span><span class="pu-stat__line"></span>' +
        '<span class="pu-stat__value"><b>0</b> of 0 left</span></div>';
    };
    return '<section class="plan-usage" aria-label="Mobile 40GB Data Plan">' +
      '<div class="plan-usage__top"><span class="plan-usage__type">MOBILE</span><span class="plan-usage__name">40GB Data Plan</span></div>' +
      '<span class="plan-usage__line"></span>' +
      '<div class="plan-usage__usage">' +
        '<div class="k-gauge pu-gauge" role="img" aria-label="Data left: 6GB of 10GB">' +
          '<img class="k-gauge__ring" src="' + ui.img("mobile-gauge.svg") + '" alt="" draggable="false">' +
          '<span class="k-gauge__icon">' + I("sim-yellow-24") + "</span>" +
          '<span class="k-gauge__label">Data left</span>' +
          '<span class="k-gauge__value"><span class="pu-gauge__num">6</span>GB</span>' +
          '<span class="k-gauge__total">/ 10GB</span></div>' +
        '<div class="pu-stats">' + stat("kb-phone-call", "Voice mins") + stat("sms-24", "SMS") + "</div>" +
      "</div>" +
      '<span class="plan-usage__line"></span>' +
      // "View full plan" has no destination on the Mobile card — press feedback only
      '<button type="button" class="plan-usage__more" data-tap="surface"><span>View full plan</span>' + chevronGlyph() + "</button>" +
      "</section>";
  }

  /* Card/Roaming booster — country tiles have no destination (press feedback only) */
  var COUNTRIES = [["Singapore", "au"], ["Thailand", "th"], ["Indonesia", "id"], ["Japan", "jp"], ["China", "cn"], ["Korea", "kr"]];
  function roaming() {
    return '<section class="roam" aria-label="Roaming booster">' +
      ui.sectionHeader({ glyph: "globe", title: "Roaming booster", chevron: false }) +
      '<p class="roam__sub">Stay connected whenever you’re headed</p>' +
      '<div class="roam__grid">' + COUNTRIES.map(function (c) {
        // Figma places the "au" flag on the Singapore tile; kept as drawn
        return '<button type="button" class="roam__tile" data-tap="surface"><img class="roam__flag" src="' + ui.img("flag-" + c[1] + ".svg") + '" alt="" draggable="false"><span>' + c[0] + "</span></button>";
      }).join("") + "</div>" +
      ui.button({ label: "View all roaming passes", variant: "secondary", size: "medium", block: true, lexend: true, filled: true }) +
      "</section>";
  }

  function dashboard(ctx, top) {
    ctx.scroll.innerHTML = ui.statusBar() + ui.topBar({ profileAction: "account" }) +
      '<div class="home home--mobile">' + top + roaming() + S.parts.whatsNew() + "</div>";
    ctx.pinBottom(ui.el(ui.tabBar()), { transparent: true });
    ctx.el.addEventListener("click", function (e) {
      if (e.target.closest('[data-action="account"]')) S.openAccount();
    });
  }

  /* ---------------- Dashboard – Mobile 40GB (24:2923) ---------------- */
  S.router.define("/home", {
    render: function (ctx) { dashboard(ctx, '<div class="home__plan">' + planUsage() + "</div>"); }
  });

  /* ---------------- Dashboard – Mobile + activate eSIM (95:5290) ---------------- */
  S.router.define("/home-activate", {
    render: function (ctx) {
      dashboard(ctx,
        '<div class="home__action">' + ui.actionCard({ title: "Activate new eSIM", sub: "Get your eSIM up and running", cta: "Activate eSIM", ctaAttrs: { "data-go": "/activate/qr" } }) + "</div>" +
        '<div class="home__plan home__plan--after-action">' + planUsage() + "</div>");
    }
  });

  /* ---------------- Dashboard – Kids + Mobile (24:3096) ---------------- */
  S.router.define("/home-family", {
    render: function (ctx) {
      dashboard(ctx,
        '<div class="home__plan home__plan--stack">' +
          '<button type="button" class="plan-tab" data-tap="surface" data-go="/kids-home" data-transition="dissolve" aria-label="Open Annice’s Kids plan">' +
            '<span class="plan-tab__type">KIDS</span><span class="plan-tab__name t-kids-title">Annice</span></button>' +
          planUsage() + "</div>");
    }
  });

  /* ---------------- Manage lines (24:2059) ---------------- */
  /* Lines come from what happened in the test (S.model.lines): one card per
     number. With nothing recorded (deep link) the three Figma lines show. */
  var FIGMA_LINES = ["+60 115 612 3456", "+60 123 123 7890", "+60 123 123 7890"];
  S.router.define("/lines", {
    render: function (ctx) {
      ctx.scroll.innerHTML = ui.statusBar() + ui.navHeader({ title: "Manage lines" }) +
        '<div class="lines">' +
          ui.actionCard({ title: "Activate a SIM", sub: "Get your SIM up and running", cta: "Activate SIM", ctaAttrs: { "data-activate": "" } }) +
          '<h2 class="lines__label">Your lines</h2>' +
          (S.model.lines() ? S.model.lines().map(function (l) { return l.number; }) : FIGMA_LINES).map(function (num, i) {
            // line cards / Options have no destination — press feedback only
            return '<section class="line-card"><div class="line-card__top"><div><h3 class="line-card__name">Line ' + (i + 1) + '</h3><p class="line-card__number">' + ui.esc(num) + "</p></div>" +
              (i === 0 ? ui.chip({ label: "Top priority", tone: "success" }) : "") + "</div>" +
              '<button type="button" class="line-card__options" data-tap="surface"><span>Options</span>' + I("chevron-right") + "</button></section>";
          }).join("") +
        "</div>";
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-activate]")) return;
        // A bought-but-unactivated SIM goes straight to activation (client request)
        if (S.model.hasInactive()) { S.router.go("/activate/qr"); return; }
        // Figma: a parent with their own Mobile line stays "existing"; a Kids-only
        // parent adding another line becomes "kidsAddLine" (→ 2-kids dashboards)
        S.state.set({ journey: S.state.journey === "existing" ? "existing" : "kidsAddLine", loggedIn: true, phase: "sim" });
        S.router.go("/sim");
      });
    }
  });
})(window.Spark = window.Spark || {});
