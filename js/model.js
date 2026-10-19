/* Remembered choices that several screens read (stored in S.state, so they
   survive a refresh mid-test; "Reset test" in the facilitator panel clears them):
   - number / selectedPlan  → Payment summary, Manage lines
   - lines                  → Manage lines (added at Pay, activated on SIM activated)
   - autoRenew              → Payment method (on = card / PayPal only)
   - kids                   → Manage safety features (toggles + trusted contacts)
   - activity               → Activity (newest first, shown under "Today") */
(function (S) {
  var get = function () { return S.state.get(); };

  /* Data and price per plan (client decision): data from the Compare plans
     sheet; prices RM5 / RM10 / RM15. Every screen that shows a plan reads this. */
  var PLANS = {
    "Safe Start": { gb: 5, price: 5 },
    "Guided Freedom": { gb: 10, price: 10 },
    "Independent Explorer": { gb: 20, price: 15 }
  };
  /* Payment summary extras, as drawn in Figma: Voice 100 mins RM5, add-ons RM7 + RM3 */
  var EXTRAS = { voice: 5, addons: 7 + 3 };
  var TAX_RATE = 0.06;   // 6% tax on the subtotal
  var KIDS_DEFAULT = "Independent Explorer";   // the plan the Kids screens show in Figma
  /* "RM36" for whole ringgit, "RM36.48" otherwise */
  function rm(n) { n = Math.round(n * 100) / 100; return "RM" + (n % 1 ? n.toFixed(2) : String(n)); }
  var DEFAULT_CONTACTS = [["Mum"], ["Dad"], ["Friend - Jack"], ["Uncle Steve"], ["Uncle Steve"]].map(function (c) { return { name: c[0], number: "+60-3-1234-5678" }; });
  var EXISTING_LINE = "+60 115 612 3456";   // the existing customer's own line (Figma Manage lines, Line 1)

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  /* Child names follow Figma: Annice (first card), Aiman (second card) */
  var CHILD_NAMES = ["Annice", "Aiman", "Alya", "Adam"];
  function makeChild(i, plan, number) {
    return { name: CHILD_NAMES[i] || "Child " + (i + 1), plan: plan, number: number, gaming: true, streaming: false,
      contacts: i === 0 ? DEFAULT_CONTACTS.slice() : [], activity: [], sample: i === 0 };
  }

  S.model = {
    PLANS: PLANS,
    EXISTING_LINE: EXISTING_LINE,

    /* "012-123-345" → "+60 12 123 345" (Payment summary style) */
    displayNumber: function (raw) {
      if (!raw) return null;
      if (raw.charAt(0) === "+") return raw;
      return "+60 " + raw.replace(/^0/, "").replace(/-/g, " ");
    },
    rm: rm,
    planInfo: function (name) { var p = PLANS[name]; return p ? { name: name, gb: p.gb, data: p.gb + " GB", price: rm(p.price), amount: p.price } : null; },
    plan: function () { return S.model.planInfo(get().selectedPlan); },
    /* The Kids screens show the front child's plan */
    kidsPlan: function () { return S.model.kidPlanInfo(S.model.kid()); },
    /* Payment totals: plan + voice + add-ons, shipping by SIM type, 6% tax */
    totals: function () {
      var p = S.model.plan();
      if (!p) return { subtotal: "RM36", shipping: "RM4", tax: "RM0.48", total: "RM36.48" };   // nothing chosen: Figma's figures
      var subtotal = p.amount + EXTRAS.voice + EXTRAS.addons;
      var shipping = get().sim === "eSIM" ? 0 : 4;
      var tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      return { subtotal: rm(subtotal), shipping: shipping ? rm(shipping) : "Free", tax: rm(tax), total: rm(subtotal + shipping + tax) };
    },

    /* Lines: undefined until something happened, so deep links keep Figma's content */
    lines: function () { return get().lines; },
    addLine: function (raw) {
      var lines = (get().lines || []).slice();
      var number = S.model.displayNumber(raw) || "+60 115 123 456";
      lines.push({ number: number, active: false });
      S.state.set({ lines: lines });
    },
    ensureExistingLine: function () {
      if (!get().lines) S.state.set({ lines: [{ number: EXISTING_LINE, active: true }] });
    },
    hasInactive: function () { return (get().lines || []).some(function (l) { return !l.active; }); },
    activateLines: function () {
      var lines = get().lines; if (!lines) return;
      S.state.set({ lines: lines.map(function (l) { return { number: l.number, active: true }; }) });
    },

    /* Payment: auto renewal (Figma default On) */
    autoRenew: function () { return get().autoRenew !== false; },

    /* ---------- Children (client request: each Kids card has its own plan,
       number, safety settings, trusted contacts and activity) ----------
       state.children = [{ name, plan, number, gaming, streaming, contacts, activity, sample }]
       state.front    = index of the card at the front of the dashboard stack.
       Until a purchase creates them, one default child (Figma's Annice) is used. */
    childList: function () {
      var list = get().children;
      return list && list.length ? list : [makeChild(0, get().selectedPlan || KIDS_DEFAULT, null)];
    },
    ensureChildren: function (n) {   // deep links to the 2-kids dashboards
      var list = S.model.childList().slice();
      while (list.length < n) list.push(makeChild(list.length, "Safe Start", null));
      S.state.set({ children: list });
    },
    addChild: function (plan, number) {
      var list = (get().children || []).slice();
      list.push(makeChild(list.length, plan || KIDS_DEFAULT, number || null));
      S.state.set({ children: list });
    },
    frontIndex: function () { var n = S.model.childList().length; return Math.min(get().front || 0, n - 1); },
    kid: function () { return S.model.childList()[S.model.frontIndex()]; },
    nextIndex: function () { return (S.model.frontIndex() + 1) % S.model.childList().length; },
    bringToFront: function (i) { S.state.set({ front: i }); },
    updateKid: function (patch) {
      var list = S.model.childList().slice(), i = S.model.frontIndex();
      list[i] = Object.assign({}, list[i], patch);
      S.state.set({ children: list });
    },
    kidPlanInfo: function (k) { return S.model.planInfo(k.plan) || S.model.planInfo(KIDS_DEFAULT); },
    kidNumber: function (k) { return S.model.displayNumber(k.number) || "+60-3-1234-5678"; },

    /* Front child's safety settings (Figma defaults: Gaming on, Streaming off) */
    kids: function () { var k = S.model.kid(); return { gaming: k.gaming, streaming: k.streaming, contacts: k.contacts.slice() }; },
    setKids: function (patch) { S.model.updateKid(patch); },

    /* Front child's activity log; Figma's sample history belongs to the first child */
    activity: function () { return S.model.kid().activity || []; },
    hasSampleActivity: function () { return !!S.model.kid().sample; },
    log: function (title, desc) {
      var d = new Date();
      S.model.updateKid({ activity: [{ title: title, desc: desc, time: pad(d.getHours()) + ":" + pad(d.getMinutes()) }].concat(S.model.activity()) });
    }
  };
})(window.Spark = window.Spark || {});
