/* Bottom-sheet modal — handover §8.1.
   open({ title, content, height, primary, onClose, handle })
   - Scrim fades 0→1 while the sheet slides up (300ms ease-out); close reverses (250ms ease-in).
   - Dismiss: tap scrim, ✕, drag header/handle down, Esc, or the primary button.
   - role="dialog", aria-modal, focus moved into the sheet, background inert.
   - Lives in the overlay layer; never changes the route. */
(function (S) {
  var open = [];
  var overlaysEl, screensEl;

  function closeSheet(rec, instant) {
    if (!rec || rec.closing) return;
    rec.closing = true;
    var done = function () {
      rec.root.remove();
      open = open.filter(function (r) { return r !== rec; });
      if (!open.length && screensEl) screensEl.inert = false;
      if (rec.returnFocus && rec.returnFocus.focus) try { rec.returnFocus.focus({ preventScroll: true }); } catch (e) {}
      if (rec.onClose) rec.onClose();
    };
    if (instant) return done();
    rec.root.classList.remove("is-open");
    rec.root.classList.add("is-closing");
    setTimeout(done, rec.closeMs || 260);
  }

  function enableDrag(rec, handleEls) {
    var sheet = rec.sheet, startY = 0, dy = 0, dragging = false, t0 = 0;
    handleEls.forEach(function (h) {
      h.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button")) return; // let the ✕ work normally
        dragging = true; startY = e.clientY; dy = 0; t0 = performance.now();
        sheet.classList.add("is-dragging");
        h.setPointerCapture(e.pointerId);
      });
      h.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        dy = Math.max(0, e.clientY - startY);
        sheet.style.transform = "translate3d(0," + dy + "px,0)";
        rec.scrim.style.opacity = String(Math.max(0, 1 - dy / sheet.offsetHeight));
      });
      var end = function () {
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove("is-dragging");
        var velocity = dy / Math.max(1, performance.now() - t0);
        sheet.style.transform = ""; rec.scrim.style.opacity = "";
        if (dy > sheet.offsetHeight * 0.25 || velocity > 0.6) closeSheet(rec);
      };
      h.addEventListener("pointerup", end);
      h.addEventListener("pointercancel", end);
    });
  }

  S.sheet = {
    mount: function (overlays, screens) { overlaysEl = overlays; screensEl = screens; },
    open: function (opts) {
      opts = opts || {};
      var root = document.createElement("div");
      root.className = "sheet-root";
      root.innerHTML =
        '<div class="sheet-scrim" data-close></div>' +
        '<div class="sheet" role="dialog" aria-modal="true" tabindex="-1"' + (opts.title ? ' aria-labelledby="sheet-title"' : "") + ">" +
          (opts.handle ? '<div class="sheet__grab"><div class="sheet__handle"></div></div>' : "") +
          (opts.header ? opts.header : opts.title !== undefined ?
            '<div class="sheet__header"><h2 class="sheet__title" id="sheet-title">' + opts.title + "</h2>" +
            '<button class="sheet__close" type="button" data-tap="icon" data-close aria-label="Close">' + S.icon("sheet-close") + "</button></div>" : "") +
          '<div class="sheet__body"></div>' +
        "</div>";
      var sheet = root.querySelector(".sheet");
      if (opts.className) sheet.className += " " + opts.className;
      if (opts.rootClass) root.className += " " + opts.rootClass; // per-sheet scrim / timing
      if (opts.labelledBy) sheet.setAttribute("aria-labelledby", opts.labelledBy);
      var body = root.querySelector(".sheet__body");
      if (opts.height) sheet.style.height = opts.height + "px";
      if (typeof opts.content === "string") body.innerHTML = opts.content;
      else if (opts.content) body.appendChild(opts.content);

      var rec = { root: root, sheet: sheet, scrim: root.querySelector(".sheet-scrim"), onClose: opts.onClose, returnFocus: document.activeElement, closeMs: opts.closeMs };
      root.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) closeSheet(rec);
      });
      root.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(rec); });
      enableDrag(rec, Array.prototype.slice.call(root.querySelectorAll(".sheet__grab, .sheet__header")));

      overlaysEl.appendChild(root);
      open.push(rec);
      if (screensEl) screensEl.inert = true;
      root.getBoundingClientRect();
      root.classList.add("is-open");
      setTimeout(function () { try { sheet.focus({ preventScroll: true }); } catch (e) {} }, 30);
      rec.close = function () { closeSheet(rec); };
      rec.body = body;
      return rec;
    },
    closeAll: function (instant) { open.slice().forEach(function (r) { closeSheet(r, instant); }); },
    isOpen: function () { return open.length > 0; }
  };
})(window.Spark = window.Spark || {});
