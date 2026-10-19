/* Tap feedback.
   Anything marked [data-tap] (and every .btn) gets an .is-pressed class while a
   finger/mouse is down on it, styled per the design system's Pressed variants.
   - Quick taps still show the pressed state for at least MIN_MS.
   - If the finger moves (a scroll or swipe), the press is cancelled.
   - Enter/Space on a focused element flashes the same state. */
(function (S) {
  var MIN_MS = 140, MOVE_CANCEL = 10;
  var active = null, startX = 0, startY = 0, startT = 0, releaseTimer = null;

  function target(el) { return el && el.closest ? el.closest("[data-tap], .btn, .toggle") : null; }
  function release(el, immediate) {
    if (!el) return;
    var wait = immediate ? 0 : Math.max(0, MIN_MS - (performance.now() - startT));
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(function () { el.classList.remove("is-pressed"); }, wait);
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.button && e.button !== 0) return;
    var el = target(e.target);
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    if (active && active !== el) active.classList.remove("is-pressed");
    active = el; startX = e.clientX; startY = e.clientY; startT = performance.now();
    clearTimeout(releaseTimer);
    el.classList.add("is-pressed");
  }, { passive: true });

  document.addEventListener("pointermove", function (e) {
    if (!active) return;
    if (Math.abs(e.clientX - startX) > MOVE_CANCEL || Math.abs(e.clientY - startY) > MOVE_CANCEL) {
      release(active, true); active = null;
    }
  }, { passive: true });

  ["pointerup", "pointercancel"].forEach(function (type) {
    document.addEventListener(type, function () { if (active) { release(active, type === "pointercancel"); active = null; } }, { passive: true });
  });
  document.addEventListener("scroll", function () { if (active) { release(active, true); active = null; } }, { capture: true, passive: true });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = target(document.activeElement);
    if (!el) return;
    el.classList.add("is-pressed"); startT = performance.now();
    release(el);
    // non-button elements acting as buttons
    if (e.key === " " && el.tagName !== "BUTTON" && el.tagName !== "INPUT") { e.preventDefault(); el.click(); }
    if (e.key === "Enter" && el.tagName !== "BUTTON" && el.tagName !== "A" && el.tagName !== "INPUT") el.click();
  });

  S.tap = { MIN_MS: MIN_MS };
})(window.Spark = window.Spark || {});
