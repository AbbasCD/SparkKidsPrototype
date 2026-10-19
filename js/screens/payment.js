/* 5 · Payment — Payment summary (24:1680) and Payment method (23:1786).
   Wiring copied from the Figma prototype:
   - Summary › Change plan: phase = "changePlan", push Kids plans (1:1238).
     Kids plans › Select then comes back here with phase = "payment".
   - Summary › Auto renewal toggle: on ↔ off (smart animate 200ms ease-out).
   - Summary › Proceed to Payment: push Payment method.
   - Method › Pay (conditional on journey), dissolve 300ms ease-out:
       existing   → phase "activation", Dashboard – Mobile + activate eSIM (95:5290)
       new        → phase "activation", Kids dashboard – activate SIM (270:5868)
       kidsAddLine→ phase "activation", Kids dashboard – 2 kids – activate SIM (270:5951)
       switchPlan → phase "complete", journey "existing", Kids dashboard (1:3380)
     Pay resets the history so testers can't go back into the purchase. */
(function (S) {
  var ui = S.ui, I = S.icon, esc = ui.esc;

  /* List/Summary row inside a white card; the last row has no divider */
  function card(rows, cls, attr) {
    return '<div class="pay-card' + (cls ? " " + cls : "") + '"' + (attr ? " " + attr : "") + ">" + rows.map(function (r) {
      return '<div class="summary-row"><div class="summary-row__content"><span class="summary-row__label">' + esc(r[0]) +
        '</span><span class="summary-row__value">' + r[1].split("\n").map(esc).join("<br>") + '</span></div><div class="summary-row__divider"></div></div>';
    }).join("") + "</div>";
  }
  function groupTitle(text, link) {
    return '<div class="pay-group"><h2 class="pay-group__title">' + text + "</h2>" + (link || "") + "</div>";
  }

  /* Remembered choices (client request): Your number = number picked on Choose
     your number; Plan information = plan picked on Select plan. Without a
     choice (deep link) the Figma values show. Totals stay as designed. */
  function personalRows() {
    var num = S.model.displayNumber(S.state.get().number) || "+60 115 123 456";
    var sim = S.state.get().sim || "Physical SIM";   // Figma shows "Physical SIM" when nothing was chosen
    return [["Name", "John Smith"], ["NRIC / Passport No", "XXXXXXX-10-1234"], ["Sim No", "1234567891234"], ["Sim Type", sim], ["Your number", num]];
  }
  function planRows() {
    var p = S.model.plan();
    var rows = [["Voice", "100 Mins / RM5"], ["SMS", "Content"], ["Add-ons", "Netflix 20GB / RM7\nFacebook 20GB / RM3"]];
    return p ? [["Plan", p.name], ["Data", p.data + " / " + p.price]].concat(rows) : [["Data", "10 GB / RM18"]].concat(rows);
  }
  /* Totals follow the chosen plan (client decision): plan + voice + add-ons,
     shipping (free for eSIM), 6% tax — see S.model.totals */
  function totalRows() { var t = S.model.totals(); return [["Subtotal", t.subtotal], ["Shipping", t.shipping], ["Tax", t.tax]]; }
  function refreshSummary(ctx) {
    ctx.el.querySelector("[data-personal]").outerHTML = card(personalRows(), "", "data-personal");
    ctx.el.querySelector("[data-plan]").outerHTML = card(planRows(), "", "data-plan");
    ctx.el.querySelector("[data-totals]").outerHTML = card(totalRows(), "", "data-totals");
    ctx.el.querySelector("[data-total]").textContent = S.model.totals().total;
  }

  /* ---------------- Payment summary (24:1680) ---------------- */
  S.router.define("/payment", {
    render: function (ctx) {
      ctx.scroll.innerHTML = ui.statusBar() + ui.navHeader({ title: "Payment summary" }) +
        '<div class="journey">' + ui.stepper("payment") +
          '<div class="pay">' +
            groupTitle("Personal information") +
            card(personalRows(), "", "data-personal") +
            // "Edit address" has no destination in the prototype — press feedback only
            groupTitle("Delivery address", ui.link({ label: "Edit address" })) +
            card([["Apartment, suite, unit, etc.", "The Summit USJ"], ["Address line 1", "Persiaran Kewajiban"], ["Address line 2", "..."], ["City", "Selangor"], ["Post code", "47600"], ["State (optional)", "..."]]) +
            groupTitle("Plan information") +
            card(planRows(), "", "data-plan") +
            '<div class="pay-centered">' + ui.link({ label: "Change plan", iconL: "swap-vertical", attrs: { "data-change-plan": "" } }) + "</div>" +
            card(totalRows(), "", "data-totals") +
            // "Add voucher" has no destination in the prototype — press feedback only
            '<div class="pay-centered">' + ui.link({ label: "Add voucher", iconL: "ticket" }) + "</div>" +
          "</div>" +
        "</div>";

      ctx.pinBottom(ui.el('<div class="pay-footer">' +
        '<div class="pay-footer__row"><span class="pay-footer__label" id="auto-renew">Auto renewal</span>' +
          '<button type="button" role="switch" aria-checked="' + S.model.autoRenew() + '" aria-labelledby="auto-renew" class="toggle toggle--ios' + (S.model.autoRenew() ? " is-on" : "") + '"><span class="toggle__knob"></span></button></div>' +
        '<div class="pay-footer__row"><span class="pay-footer__label">Your new plan / month</span><span class="pay-footer__total" data-total>' + S.model.totals().total + '</span></div>' +
        ui.button({ label: "Proceed to Payment", block: true, lexend: true, attrs: { "data-go": "/payment/method" } }) +
        "</div>"));

      // Auto renewal is remembered: Payment method reads it (card / PayPal only when on)
      ctx.el.addEventListener("toggle", function (e) { S.state.set({ autoRenew: e.detail.on }); });
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-change-plan]")) return;
        S.state.set({ phase: "changePlan" });
        S.router.go("/kids-plans");
      });
    },
    // back from Change plan → show the newly selected plan
    onShow: function (ctx) { refreshSummary(ctx); }
  });

  /* ---------------- Payment method (23:1786) ---------------- */
  var METHODS = [
    ["Credit / Debit card or PayPal", null],
    ["Online Banking", "pay-online-banking.svg"],
    ["Touch ‘n’ Go", "pay-touch-n-go.svg"],
    ["GrabPay", "pay-grabpay.svg"],
    ["Boost", "pay-boost.svg"],
    ["Alipay", "pay-alipay.svg"]
  ];

  /* Auto renewal on → only "Credit / Debit card or PayPal" can be used; the
     other methods are muted and can't be selected (client request). */
  function paintMethods(ctx) {
    var locked = S.model.autoRenew();
    var rows = ctx.el.querySelectorAll(".pay-method");
    rows.forEach(function (r, i) {
      var off = locked && i > 0;
      r.classList.toggle("is-muted", off);
      r.setAttribute("aria-disabled", String(off));
      if (off) { r.removeAttribute("data-tap"); r.tabIndex = -1; } else { r.setAttribute("data-tap", "surface"); r.removeAttribute("tabindex"); }
      if (off && r.classList.contains("is-selected")) rows[0].click();
    });
  }

  S.router.define("/payment/method", {
    onShow: function (ctx) { paintMethods(ctx); },
    render: function (ctx) {
      ctx.scroll.innerHTML = ui.statusBar() + ui.navHeader({ title: "Payment method" }) +
        // Only the card option has a selected design; the others select the same
        // way for symmetry (as on Choose SIM).
        '<div class="pay-methods" role="radiogroup" aria-label="Payment method" data-radio-group>' +
          METHODS.map(function (m, i) {
            var sel = i === 0;
            var lead = m[1]
              ? '<img class="pay-method__logo" src="' + ui.img(m[1]) + '" alt="" draggable="false">'
              : '<span class="pay-method__lead">' + I("card") + "</span>";
            return '<button type="button" role="radio" aria-checked="' + sel + '" class="option-card option-card--bordered pay-method' + (sel ? " is-selected" : "") + '" data-tap="surface">' +
              lead + '<span class="option-card__title">' + esc(m[0]) + "</span>" + ui.radio(sel) + "</button>";
          }).join("") +
        "</div>";
      ctx.pinBottom(ui.el('<div class="journey-footer journey-footer--plain">' +
        ui.button({ label: "Pay", block: true, lexend: true, attrs: { "data-pay": "" } }) + "</div>"));

      paintMethods(ctx);
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-pay]")) return;
        var j = S.state.journey, to;
        var st = S.state.get();
        // A purchase adds the chosen number as a line (not yet activated) and a
        // child with the chosen plan; a plan switch changes the front child's plan.
        if (j === "switchPlan") S.model.updateKid({ plan: st.selectedPlan });
        else { S.model.addLine(st.number); S.model.addChild(st.selectedPlan, st.number); }
        if (j === "existing") { S.state.set({ phase: "activation" }); to = "/home-activate"; }
        else if (j === "switchPlan") { S.state.set({ phase: "complete", journey: "existing" }); to = "/kids-home"; }
        else if (j === "kidsAddLine") { S.state.set({ phase: "activation" }); to = "/kids2-activate"; }   // 270:5951
        else { S.state.set({ phase: "activation" }); to = "/kids-home-activate"; }                       // "new" → 270:5868
        S.router.go(to, { transition: "dissolve", reset: true });
      });
    }
  });
})(window.Spark = window.Spark || {});
