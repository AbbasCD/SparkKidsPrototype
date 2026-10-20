/* Browser / phone top bar colour follows the page (client request).
   After every screen change, scroll, sheet open/close and tap, the colour at
   the top edge of the app is sampled and written to:
   - html + body background (phone layout only) → Safari on iOS 26+ tints its
     top and bottom bars from the page background. Client test (tint-test.html)
     confirmed this updates live, as long as no full-screen fixed layer covers
     the edges (hence .stage is position: absolute, see base.css).
   - <meta name="theme-color"> → Chrome on Android, older Safari, Samsung, Edge.
   On the desktop device frame only theme-color changes; the grey backdrop stays.

   TEMPORARY: a pop-up in the middle of the screen says which colour the bars
   should be and which element it came from. Turn it off with DEBUG = false. */
(function (S) {
  var DEBUG = true;
  var meta, device, toast, toastTimer, last = "", pending = false, checks = 0, routeChanged = false;
  var framed = window.matchMedia("(min-width: 600px) and (min-height: 500px)");
  var NAMES = { "#f2ff4d": "YELLOW", "#ff79e8": "PINK", "#ffffff": "WHITE", "#f6f7f1": "OFF-WHITE" };

  function parse(c) {   // "rgb(r, g, b)" / "rgba(r, g, b, a)" → [r, g, b, a]
    var m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function hex(rgb) { return "#" + rgb.slice(0, 3).map(function (v) { return ("0" + Math.round(v).toString(16)).slice(-2); }).join(""); }
  function describe(el) {
    if (!el) return "phone background";
    var cls = (el.className && el.className.baseVal === undefined ? String(el.className) : "").trim().split(/\s+/)[0];
    return cls ? "." + cls : el.tagName.toLowerCase();
  }

  /* The first solid background under the top-centre of the app.
     See-through layers (the sheet scrim) are blended over what is under them. */
  function sample() {
    var r = device.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + 2;
    var els = document.elementsFromPoint(x, y), tint = null;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!device.contains(el) || el.closest('[aria-hidden="true"].screen')) continue;
      var c = parse(getComputedStyle(el).backgroundColor);
      if (!c || c[3] === 0) continue;
      if (c[3] < 1) { if (!tint) tint = c; continue; }   // remember the first see-through layer
      if (tint) c = [0, 1, 2].map(function (k) { return tint[k] * tint[3] + c[k] * (1 - tint[3]); });
      return { hex: hex(c), from: describe(el) + (tint ? " under the dim overlay" : "") };
    }
    return { hex: hex(parse(getComputedStyle(device).backgroundColor) || [246, 247, 241]), from: "phone background" };
  }

  /* Top colour of a screen that is about to show (it may still be off to the
     side or hidden): the last solid-background element, in paint order, that
     covers the top-centre point of that screen. Used at the start of a
     transition so the bar changes together with the screen. */
  function sampleScreen(screen) {
    var sr = screen.getBoundingClientRect(), x = sr.left + sr.width / 2, y = sr.top + 2, found = null;
    var els = [screen].concat(Array.prototype.slice.call(screen.querySelectorAll("*")));
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (!r.width || r.left > x || r.right < x || r.top > y || r.bottom < y) continue;
      var c = parse(getComputedStyle(els[i]).backgroundColor);
      if (c && c[3] === 1) found = { hex: hex(c), from: describe(els[i]) };
    }
    return found || { hex: hex(parse(getComputedStyle(device).backgroundColor) || [246, 247, 241]), from: "phone background" };
  }
  function setBars(hexColour) {
    meta.setAttribute("content", hexColour);
    var phone = !framed.matches;
    document.documentElement.style.backgroundColor = phone ? hexColour : "";
    document.body.style.backgroundColor = phone ? hexColour : "";
  }
  var predicted = false, known = {};   // route → top colour seen before
  function willShow(screen) {
    var c = sampleScreen(screen);
    known[screen.getAttribute("data-route")] = c.hex;
    predicted = true;
    if (c.hex === last) return;
    last = c.hex; checks++;
    setBars(c.hex);
    showToast(c, "instant, at transition start", screen.getAttribute("data-route"));
  }

  function showToast(c, why, route) {
    if (!DEBUG) return;
    if (!toast) { toast = document.createElement("div"); toast.className = "tint-debug"; toast.setAttribute("aria-hidden", "true"); device.appendChild(toast); }
    var name = NAMES[c.hex] || "OTHER";
    toast.innerHTML = "<b>Bar check #" + checks + "</b> · build " + (window.SPARK_BUILD || "?") + " · " + why + " · " + (route || S.router.current() || "") + "\n" +
      'Top + bottom bars should be: <i style="background:' + c.hex + '"></i><b>' + name + "</b> " + c.hex + "\n" +
      "Colour taken from: " + c.from + " (top edge)";
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 2500);
  }

  function apply() {
    pending = false;
    var c = sample(), route = routeChanged, wasPredicted = predicted; routeChanged = false;
    if (route && S.router.current()) known[S.router.current()] = c.hex;
    if (route) predicted = false;
    if (c.hex === last && (!route || wasPredicted)) return;   // nothing new (or already set at transition start)
    var changed = c.hex !== last;
    last = c.hex; checks++;
    setBars(c.hex);
    showToast(c, route ? (wasPredicted ? "corrected after transition" : changed ? "screen change" : "screen change, same colour") : "colour changed");
  }
  /* Finger down on a link or the back arrow: if we already know the colour of
     the screen it leads to, switch the bars now (gains the time the finger is
     on the glass). If nothing navigates after all, the normal check puts it back. */
  function onPress(e) {
    var go = e.target.closest("[data-go]"), back = e.target.closest('[data-action="back"]'), target = null;
    if (go && !go.disabled && go.getAttribute("aria-disabled") !== "true") target = go.getAttribute("data-go");
    else if (back) { var st = S.router.stack(); target = st[st.length - 2]; }
    var hexColour = target && known[target];
    if (!hexColour || hexColour === last) return;
    last = hexColour; setBars(hexColour);
    setTimeout(function () { if (S.router.current() !== target) { routeChanged = false; later(); } }, 700);
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(apply); } }
  function later() { schedule(); setTimeout(schedule, 120); setTimeout(schedule, 360); }   // after transitions settle

  S.themeColor = {
    start: function (deviceEl) {
      device = deviceEl;
      meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
      S.router.willShow = willShow;   // bar changes as the transition starts
      S.router.onChange(function () { routeChanged = true; later(); });
      device.addEventListener("scroll", schedule, true);   // any screen scrolling
      device.addEventListener("click", later, true);       // toggles, swipes, shuffles
      device.addEventListener("pointerdown", onPress, true);
      new MutationObserver(later).observe(device.querySelector(".overlays"), { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      window.addEventListener("resize", later);
      if (framed.addEventListener) framed.addEventListener("change", function () { last = ""; later(); });
      routeChanged = true; later();
    },
    sample: function () { return sample(); }
  };
})(window.Spark = window.Spark || {});
