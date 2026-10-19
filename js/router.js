/* Hash router — handover §2 and §9.
   - Keeps its own history stack; "back" pops it.
   - Transitions: push (slide from right, 300ms ease-out; back reverses),
     dissolve (cross-fade 300ms), none.
   - replace: swap the top entry (Splash → Landing).
   - reset: the new screen becomes the only entry (Pay, Back home, Log out),
     so testers can't go "back" into a finished purchase flow.
   - Screens below the top stay in the DOM (hidden), so popping back restores
     them exactly as they were, including scroll position.
   - Sheets live in a separate overlay layer and never change the route. */
(function (S) {
  var routes = {};
  var stack = [];          // { path, el, def, pushed }
  var screensEl, deviceEl, busy = false, queued = null;
  var listeners = [];
  var ignorePop = 0;

  function now() { return performance.now(); }
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function hashPath() { var h = location.hash.replace(/^#/, ""); return h || null; }
  function emit() { var top = stack[stack.length - 1]; listeners.forEach(function (fn) { fn(top ? top.path : null, stack.map(function (e) { return e.path; })); }); }

  function render(path) {
    var def = routes[path] || routes["*"];
    var el = document.createElement("section");
    el.className = "screen";
    el.setAttribute("data-route", path);
    var scroll = document.createElement("div");
    scroll.className = "screen__scroll";
    el.appendChild(scroll);
    var ctx = {
      path: path, el: el, scroll: scroll, router: S.router, state: S.state,
      /* Pin a footer / tab bar to the bottom of the viewport; the scroll
         content gets matching bottom padding so nothing is hidden. */
      pinBottom: function (node, opts) {
        var wrap = document.createElement("div");
        wrap.className = "screen__fixed-bottom" + (opts && opts.transparent ? " screen__fixed-bottom--transparent" : "");
        wrap.appendChild(node);
        el.appendChild(wrap);
        var apply = function () { scroll.style.paddingBottom = wrap.offsetHeight + "px"; };
        if (window.ResizeObserver) new ResizeObserver(apply).observe(wrap);
        requestAnimationFrame(apply);
        return wrap;
      }
    };
    def.render(ctx);
    el._ctx = ctx;
    return { path: path, el: el, def: def, pushed: false };
  }

  function animate(incoming, outgoing, kind, dir, done, dur) {
    var t = reduced() ? "dissolve" : kind;
    if (!outgoing || t === "none") { done(); return; }
    deviceEl.classList.add("is-transitioning");
    var inEl = incoming.el, outEl = outgoing.el;
    // optional per-link duration (e.g. eKYC camera screens dissolve in 200ms)
    if (dur && !reduced()) { inEl.style.transitionDuration = dur + "ms"; outEl.style.transitionDuration = dur + "ms"; }
    inEl.removeAttribute("aria-hidden");
    if (t === "push") {
      inEl.classList.add(dir === "back" ? "pos-left" : "pos-right");
      outEl.classList.add("pos-center");
      inEl.getBoundingClientRect(); // flush
      [inEl, outEl].forEach(function (e) { e.classList.add("is-anim", "anim-push"); });
      inEl.classList.remove("pos-left", "pos-right"); inEl.classList.add("pos-center");
      outEl.classList.remove("pos-center"); outEl.classList.add(dir === "back" ? "pos-right" : "pos-left");
      if (dir === "back") { screensEl.appendChild(outEl); } // keep the leaving screen on top while it slides out
    } else { // dissolve
      inEl.classList.add("is-faded");
      screensEl.appendChild(inEl);
      inEl.getBoundingClientRect();
      inEl.classList.add("is-anim", "anim-dissolve");
      inEl.classList.remove("is-faded");
    }
    var finished = false;
    var finish = function () {
      if (finished) return; finished = true;
      [inEl, outEl].forEach(function (e) { e.classList.remove("is-anim", "anim-push", "anim-dissolve", "pos-left", "pos-right", "pos-center", "is-faded"); e.style.transitionDuration = ""; });
      deviceEl.classList.remove("is-transitioning");
      done();
    };
    inEl.addEventListener("transitionend", function h(ev) { if (ev.target === inEl) { inEl.removeEventListener("transitionend", h); finish(); } });
    setTimeout(finish, 450); // safety net
  }

  function hideBelowTop() {
    stack.forEach(function (e, i) {
      var top = i === stack.length - 1;
      if (top) { e.el.removeAttribute("aria-hidden"); e.el.inert = false; }
      else { e.el.setAttribute("aria-hidden", "true"); e.el.inert = true; }
    });
  }

  function syncHash(path, mode) {
    var url = "#" + path;
    if (mode === "push") history.pushState({ spark: true }, "", url);
    else history.replaceState({ spark: true }, "", url);
  }

  S.router = {
    define: function (path, def) { routes[path] = def; return this; },
    has: function (path) { return !!routes[path]; },
    routes: function () { return Object.keys(routes).filter(function (p) { return p !== "*"; }); },
    current: function () { var t = stack[stack.length - 1]; return t ? t.path : null; },
    stack: function () { return stack.map(function (e) { return e.path; }); },
    onChange: function (fn) { listeners.push(fn); },

    /* go(path, { transition: "push"|"dissolve"|"none", replace, reset }) */
    go: function (path, opts) {
      opts = opts || {};
      if (busy) { queued = ["go", path, opts]; return; }
      if (S.sheet) S.sheet.closeAll(true);
      var transition = opts.transition || "push";
      var outgoing = stack[stack.length - 1];
      var incoming = render(path);
      incoming.el.dataset.enteredBy = transition; // so "back" reverses the same motion
      if (opts.duration) incoming.el.dataset.dur = opts.duration;
      screensEl.appendChild(incoming.el);
      incoming.el.setAttribute("aria-hidden", "true");
      busy = true;
      var mode = opts.reset || opts.replace ? "replace" : "push";
      animate(incoming, outgoing, transition, "forward", function () {
        if (opts.reset) {
          stack.forEach(function (e) { if (e.el.parentNode) e.el.remove(); });
          incoming.pushed = false;
          stack = [incoming];
        } else if (opts.replace && outgoing) {
          incoming.pushed = outgoing.pushed;
          outgoing.el.remove();
          stack[stack.length - 1] = incoming;
        } else {
          incoming.pushed = !!outgoing;
          stack.push(incoming);
        }
        syncHash(path, outgoing && mode === "push" ? "push" : "replace");
        hideBelowTop();
        if (incoming.def.onEnter) incoming.def.onEnter(incoming.el._ctx);
        busy = false; emit();
        if (queued) { var q = queued; queued = null; S.router[q[0]].apply(S.router, q.slice(1)); }
      }, opts.duration);
    },

    /* Rename the top entry without re-rendering it — used by in-screen
       carousels (eKYC tips) whose two Figma frames share one screen. */
    setPath: function (path) {
      var top = stack[stack.length - 1];
      if (!top || top.path === path) return;
      top.path = path; top.el.setAttribute("data-route", path);
      syncHash(path, "replace");
      emit();
    },

    /* Pop one step. fromBrowser = triggered by the browser's own back button. */
    back: function (fromBrowser) {
      if (busy) { queued = ["back", fromBrowser]; return; }
      if (stack.length < 2) return false;
      if (S.sheet) S.sheet.closeAll(true);
      var outgoing = stack[stack.length - 1];
      var incoming = stack[stack.length - 2];
      if (outgoing.def.beforeBack) outgoing.def.beforeBack(outgoing.el._ctx);
      busy = true;
      // reverse of whatever brought us here: push back for push, fade for dissolve
      var kind = outgoing.el.dataset.enteredBy === "dissolve" ? "dissolve-back" : "push";
      var dur = +outgoing.el.dataset.dur || 0;
      var run = function (done) {
        if (kind === "push") return animate(incoming, outgoing, "push", "back", done);
        // dissolve back: fade the top screen out
        deviceEl.classList.add("is-transitioning");
        incoming.el.removeAttribute("aria-hidden");
        outgoing.el.classList.add("is-anim", "anim-dissolve");
        if (dur && !reduced()) outgoing.el.style.transitionDuration = dur + "ms";
        outgoing.el.getBoundingClientRect();
        outgoing.el.classList.add("is-faded");
        setTimeout(function () { deviceEl.classList.remove("is-transitioning"); done(); }, reduced() ? 10 : (dur || 300) + 20);
      };
      run(function () {
        stack.pop();
        outgoing.el.remove();
        hideBelowTop();
        if (!fromBrowser && outgoing.pushed) { ignorePop++; history.back(); }
        else if (!fromBrowser) syncHash(incoming.path, "replace");
        if (incoming.def.onShow) incoming.def.onShow(incoming.el._ctx);
        busy = false; emit();
        if (queued) { var q = queued; queued = null; S.router[q[0]].apply(S.router, q.slice(1)); }
      });
      return true;
    },

    start: function (opts) {
      screensEl = opts.screensEl; deviceEl = opts.deviceEl;
      var initial = hashPath();
      if (!initial || !routes[initial]) initial = opts.home;
      var entry = render(initial);
      screensEl.appendChild(entry.el);
      stack = [entry];
      syncHash(initial, "replace");
      hideBelowTop();
      if (entry.def.onEnter) entry.def.onEnter(entry.el._ctx);
      emit();
    }
  };

  /* Browser back/forward */
  window.addEventListener("popstate", function () {
    if (ignorePop > 0) { ignorePop--; return; }
    var target = hashPath();
    if (stack.length > 1 && stack[stack.length - 1].pushed && target === stack[stack.length - 2].path) {
      S.router.back(true);
    } else if (target && target !== S.router.current()) {
      // At the root of a flow (after a reset) — don't leave into stale history.
      history.pushState({ spark: true }, "", "#" + S.router.current());
    }
  });
})(window.Spark = window.Spark || {});
