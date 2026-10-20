/* Browser / phone top bar colour follows the page (client request).
   After every screen change, scroll, sheet open/close and tap, the colour at
   the top edge of the app is sampled and written to:
   - <meta name="theme-color">  → Chrome on Android, Safari (iOS 15+ / macOS),
     Samsung Internet, Edge: tints the address bar / status bar.
   - html + body background (phone layout only) → Safari on iOS 26+, which tints
     its bars from the page's own top colour instead of theme-color.
   - Two 4px position:fixed strips at the top and bottom edges → Safari on
     iOS 26+, which ignores theme-color and tints its status bar / toolbar from
     fixed elements touching those edges (re-created on every change).
   On the desktop device frame only theme-color changes; the grey backdrop stays. */
(function (S) {
  var meta, device, topStrip, bottomStrip, last = "", pending = false;
  var framed = window.matchMedia("(min-width: 600px) and (min-height: 500px)");

  function parse(c) {   // "rgb(r, g, b)" / "rgba(r, g, b, a)" → [r, g, b, a]
    var m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function hex(rgb) { return "#" + rgb.slice(0, 3).map(function (v) { return ("0" + Math.round(v).toString(16)).slice(-2); }).join(""); }

  /* The first solid background under the top-centre of the app.
     See-through layers (the sheet scrim) are blended over what is under them. */
  function sample(edge) {
    var r = device.getBoundingClientRect();
    var x = r.left + r.width / 2, y = edge === "bottom" ? r.bottom - 2 : r.top + 2;
    var els = document.elementsFromPoint(x, y), tint = null;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!device.contains(el) || el.closest('[aria-hidden="true"].screen')) continue;
      var c = parse(getComputedStyle(el).backgroundColor);
      if (!c || c[3] === 0) continue;
      if (c[3] < 1) { if (!tint) tint = c; continue; }   // remember the first see-through layer
      if (tint) c = [0, 1, 2].map(function (k) { return tint[k] * tint[3] + c[k] * (1 - tint[3]); });
      return hex(c);
    }
    return hex(parse(getComputedStyle(device).backgroundColor) || [246, 247, 241]);
  }

  /* Safari 26 reads the bar colour when a fixed element appears, not when an
     existing one changes colour. So each change swaps in brand-new strips
     (added hidden, shown on the next frame) and removes the old ones. */
  function strip(edge, colour) {
    var el = document.createElement("div");
    el.className = "tint-strip tint-strip--" + edge;
    el.setAttribute("aria-hidden", "true");
    el.style.backgroundColor = colour;
    el.style.display = "none";
    document.body.appendChild(el);
    return el;
  }
  function apply() {
    pending = false;
    var c = sample("top"), b = sample("bottom");
    if (c + b === last) return;
    last = c + b;
    // theme-color: replace the tag (some browsers only re-read a new one)
    var m = document.createElement("meta"); m.name = "theme-color"; m.content = c;
    meta.parentNode.replaceChild(m, meta); meta = m;
    var phone = !framed.matches;
    document.documentElement.style.backgroundColor = phone ? c : "";
    document.body.style.backgroundColor = phone ? c : "";
    if (!phone) return;
    var oldTop = topStrip, oldBottom = bottomStrip;
    topStrip = strip("top", c); bottomStrip = strip("bottom", b);
    requestAnimationFrame(function () {
      topStrip.style.display = ""; bottomStrip.style.display = "";
      [oldTop, oldBottom].forEach(function (el) { if (el) el.remove(); });
    });
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(apply); } }
  function later() { schedule(); setTimeout(schedule, 120); setTimeout(schedule, 360); }   // after transitions settle

  S.themeColor = {
    start: function (deviceEl) {
      device = deviceEl;
      meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
      S.router.onChange(later);
      device.addEventListener("scroll", schedule, true);   // any screen scrolling
      device.addEventListener("click", later, true);       // toggles, swipes, shuffles
      new MutationObserver(later).observe(device.querySelector(".overlays"), { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      window.addEventListener("resize", later);
      if (framed.addEventListener) framed.addEventListener("change", function () { last = ""; later(); });
      later();
    },
    sample: function (edge) { return sample(edge); }
  };
})(window.Spark = window.Spark || {});
