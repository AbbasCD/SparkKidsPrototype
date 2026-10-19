/* Browser / phone top bar colour follows the page (client request).
   After every screen change, scroll, sheet open/close and tap, the colour at
   the top edge of the app is sampled and written to:
   - <meta name="theme-color">  → Chrome on Android, Safari (iOS 15+ / macOS),
     Samsung Internet, Edge: tints the address bar / status bar.
   - html + body background (phone layout only) → Safari on iOS 26+, which tints
     its bars from the page's own top colour instead of theme-color.
   On the desktop device frame only theme-color changes; the grey backdrop stays. */
(function (S) {
  var meta, device, last = "", pending = false;
  var framed = window.matchMedia("(min-width: 600px) and (min-height: 500px)");

  function parse(c) {   // "rgb(r, g, b)" / "rgba(r, g, b, a)" → [r, g, b, a]
    var m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function hex(rgb) { return "#" + rgb.slice(0, 3).map(function (v) { return ("0" + Math.round(v).toString(16)).slice(-2); }).join(""); }

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
      return hex(c);
    }
    return hex(parse(getComputedStyle(device).backgroundColor) || [246, 247, 241]);
  }

  function apply() {
    pending = false;
    var c = sample();
    if (c === last) return;
    last = c;
    meta.setAttribute("content", c);
    var bg = framed.matches ? "" : c;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
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
    sample: function () { return sample(); }
  };
})(window.Spark = window.Spark || {});
