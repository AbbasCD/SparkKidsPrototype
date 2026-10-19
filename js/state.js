/* State model — handover §6.
   Three prototype variables, kept in memory and mirrored to sessionStorage so a
   refresh mid-test doesn't reset the journey. Facilitators can reset from the
   debug panel. */
(function (S) {
  var KEY = "spark-kids-state";
  var DEFAULTS = { loggedIn: false, journey: "new", phase: "browse" };
  var PHASES = ["browse", "account", "sim", "plan", "number", "ekyc", "payment", "activation", "complete", "changePlan"];
  var listeners = [];

  function load() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) { /* storage unavailable — fall back to memory */ }
    return Object.assign({}, DEFAULTS);
  }
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  function emit() { listeners.forEach(function (fn) { fn(Object.assign({}, data)); }); }

  /* Client request: a refresh starts a clean test, so nothing is read back
     from storage on load (the splash screen also resets everything). */
  var data = Object.assign({}, DEFAULTS);
  try { sessionStorage.removeItem(KEY); } catch (e) {}

  S.state = {
    PHASES: PHASES,
    get: function () { return Object.assign({}, data); },
    get loggedIn() { return data.loggedIn; },
    get journey() { return data.journey; },
    get phase() { return data.phase; },
    set: function (patch) {
      if (patch.phase && PHASES.indexOf(patch.phase) === -1) throw new Error("Unknown phase: " + patch.phase);
      Object.assign(data, patch);
      save(); emit();
    },
    /* Log out (Account sheet) — §6 resets */
    logout: function () { this.set({ loggedIn: false, journey: "new", phase: "browse" }); },
    reset: function () { data = Object.assign({}, DEFAULTS); save(); emit(); },
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }
  };
})(window.Spark = window.Spark || {});
