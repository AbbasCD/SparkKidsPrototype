/* 6 · Activation — Dashboard – activate eSIM (24:2822), Another device –
   email QR (24:1950) / email sent (24:1990), SIM activated (24:2028).
   Wiring copied from the Figma prototype:
   - Dashboard › Activate eSIM → push Another device.
   - Email QR code → "Email sent" state, dissolve 300ms (its back arrow returns
     to the unsent state, as Figma's BACK does).
   - Next (either state) → push SIM activated.
   - Back home: phase = "complete"; journey "existing" → Dashboard – Kids +
     Mobile (24:3096), otherwise → Kids dashboard (1:3380); dissolve 300ms.
     Resets history (finished purchase flow). */
(function (S) {
  var ui = S.ui, I = S.icon, esc = ui.esc;

  /* Email shown on these screens: the one the tester typed, else Figma's text */
  function email(fallback) { return S.state.get().email || fallback; }

  /* Card/What's new on the parent dashboards (also used by section 8) */
  function whatsNew() {
    return '<section class="whats-new" aria-label="What’s new">' +
      // Section header chevron / pager and the banner have no destination — press feedback only
      '<div class="whats-new__header" data-tap="surface">' + ui.sectionHeader({ glyph: "gift", title: "What’s new", pager: 1 }) + "</div>" +
      '<div class="whats-new__banner" data-tap="surface">' + ui.photo("whats-new-banner.png", "whats-new__img", "Welcome to Malaysia’s first eSIM only mobile subscription. Instant set up. Refreshingly simple.") + "</div>" +
      '<p class="whats-new__body">Change the way you connect - quietly, instantly, your way.</p>' +
      ui.button({ label: "View all promotions", variant: "secondary", size: "medium", block: true, lexend: true, filled: true }) +
      "</section>";
  }
  S.parts = S.parts || {};
  S.parts.whatsNew = whatsNew;

  /* ---------------- Dashboard – activate eSIM (24:2822) ---------------- */
  S.router.define("/home-empty", {
    render: function (ctx) {
      ctx.scroll.innerHTML = ui.statusBar() + ui.topBar() +
        '<div class="home">' +
          '<div class="home__action">' +
            ui.actionCard({ title: "Activate new eSIM", sub: "Get your eSIM up and running", cta: "Activate eSIM", ctaAttrs: { "data-go": "/activate/qr" } }) +
          "</div>" +
          whatsNew() +
        "</div>";
      ctx.pinBottom(ui.el(ui.tabBar()), { transparent: true });
    }
  });

  /* ---------------- Another device – email QR / email sent ---------------- */
  function qrScreen(sent) {
    return {
      render: function (ctx) {
        ctx.scroll.innerHTML = ui.statusBar() + ui.navHeader({ title: "Another device" }) +
          '<div class="qr">' +
            '<div class="qr__card"><img class="qr__code" src="' + ui.img("qr-code.svg") + '" alt="eSIM QR code" draggable="false"></div>' +
            '<p class="qr__copy">Send this QR code to your email address<br><b>' + esc(email("janedoe@email.com")) + "</b></p>" +
            (sent
              // "Email sent" has no reaction in Figma — press feedback only
              ? ui.button({ label: "Email sent", variant: "secondary", size: "small", lexend: true, filled: true, iconR: "check" })
                  .replace('class="btn ', 'class="btn qr__btn qr__btn--sent ')
              : ui.button({ label: "Email QR code", variant: "secondary", size: "small", lexend: true, filled: true, iconR: "mail", attrs: { "data-go": "/activate/sent", "data-transition": "dissolve" } })
                  .replace('class="btn ', 'class="btn qr__btn ')) +
          "</div>";
        ctx.pinBottom(ui.el('<div class="journey-footer journey-footer--plain">' +
          ui.button({ label: "Next", block: true, lexend: true, attrs: { "data-go": "/activate/done" } }) + "</div>"));
      }
    };
  }
  S.router.define("/activate/qr", qrScreen(false));
  S.router.define("/activate/sent", qrScreen(true));

  /* ---------------- SIM activated (24:2028) ---------------- */
  S.router.define("/activate/done", {
    render: function (ctx) {
      ctx.el.classList.add("screen--yellow");
      S.model.activateLines();   // the waiting SIM is now active (Manage lines)
      ctx.scroll.innerHTML = ui.statusBar() +
        // Header has no back arrow: title + trailing spacer only
        '<header class="nav-header nav-header--no-back"><h1 class="nav-header__title">SIM Activated</h1><span class="nav-header__spacer"></span></header>' +
        '<div class="done">' +
          '<div class="done__visual" aria-hidden="true">Visual<br>success</div>' +
          '<h2 class="done__title">Congratulations!</h2>' +
          '<p class="done__body">Your SIM has been activated. We have sent a confirmation email to <b>' + esc(email("name@mail.com")) + "</b></p>" +
        "</div>";
      ctx.pinBottom(ui.el('<div class="journey-footer journey-footer--plain journey-footer--clear">' +
        ui.button({ label: "Back home", block: true, lexend: true, attrs: { "data-home": "" } }) + "</div>"));
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-home]")) return;
        S.state.set({ phase: "complete" });
        var j = S.state.journey;   // Figma 24:2055: existing → Kids + Mobile; kidsAddLine → 2 kids; otherwise → Kids dashboard
        S.router.go(j === "existing" ? "/home-family" : j === "kidsAddLine" ? "/kids2-home" : "/kids-home", { transition: "dissolve", reset: true });
      });
    }
  });
})(window.Spark = window.Spark || {});
