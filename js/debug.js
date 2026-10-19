/* Facilitator panel — handover §12 step 2.
   Shows loggedIn / journey / phase and the current route, jumps to the Figma
   flow starting points, and resets the test.
   Desktop: a collapsible tab on the left edge of the window.
   Phone: long-press the status bar (0.7s) to open it; tap outside to close. */
(function (S) {
  var KEY = "spark-kids-debug-open";
  var panel, body;

  function row(k, v) { return '<div class="dbg__row"><span>' + k + "</span><b>" + v + "</b></div>"; }

  function paint() {
    if (!body) return;
    var st = S.state.get();
    var route = S.router.current() || "—";
    var meta = S.ROUTES.filter(function (r) { return r[0] === route; })[0];
    body.querySelector(".dbg__state").innerHTML =
      row("loggedIn", String(st.loggedIn)) + row("journey", st.journey) + row("phase", st.phase) +
      row("route", "#" + route) + (meta ? row("Figma", meta[2]) : "") + row("history", S.router.stack().length + " deep");
  }

  function build() {
    panel = document.createElement("aside");
    panel.className = "dbg";
    panel.setAttribute("aria-label", "Facilitator panel");
    var open = false;
    try { open = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
    if (open) panel.classList.add("is-open");
    panel.innerHTML =
      '<button type="button" class="dbg__tab" aria-expanded="' + open + '">Facilitator</button>' +
      '<div class="dbg__body">' +
        '<h2 class="dbg__h">Prototype state</h2><div class="dbg__state"></div>' +
        '<h2 class="dbg__h">Start a flow</h2><div class="dbg__flows">' +
          S.FLOWS.map(function (f) { return '<button type="button" data-flow="' + f[1] + '">' + f[0] + "</button>"; }).join("") +
        "</div>" +
        '<h2 class="dbg__h">Jump to screen</h2><select class="dbg__select"><option value="">Choose a screen…</option>' +
          S.ROUTES.map(function (r) { return '<option value="' + r[0] + '">' + r[3].split(" · ")[0] + " · " + r[1] + "</option>"; }).join("") +
          '<option value="/dev/components">Dev · Component gallery</option></select>' +
        '<button type="button" class="dbg__reset">Reset test</button>' +
        '<p class="dbg__hint">Reset clears the state and returns to the splash screen.</p>' +
      "</div>";
    body = panel.querySelector(".dbg__body");
    document.body.appendChild(panel);

    var setOpen = function (v) {
      panel.classList.toggle("is-open", v);
      panel.querySelector(".dbg__tab").setAttribute("aria-expanded", String(v));
      try { sessionStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
    };
    panel.querySelector(".dbg__tab").addEventListener("click", function () { setOpen(!panel.classList.contains("is-open")); });
    panel.addEventListener("click", function (e) {
      var f = e.target.closest("[data-flow]");
      if (f) S.router.go(f.dataset.flow, { transition: "dissolve", reset: true });
      if (e.target.closest(".dbg__reset")) { S.state.reset(); S.router.go("/splash", { transition: "dissolve", reset: true }); }
    });
    panel.querySelector(".dbg__select").addEventListener("change", function (e) {
      if (e.target.value) S.router.go(e.target.value, { transition: "dissolve" });
      e.target.value = "";
    });
    document.addEventListener("pointerdown", function (e) {
      if (window.innerWidth < 600 && panel.classList.contains("is-open") && !panel.contains(e.target)) setOpen(false);
    });

    // Phone: long-press the status bar
    var timer = null;
    document.addEventListener("pointerdown", function (e) {
      if (!e.target.closest(".status-bar")) return;
      timer = setTimeout(function () { setOpen(true); }, 700);
    });
    ["pointerup", "pointercancel", "pointermove"].forEach(function (t) {
      document.addEventListener(t, function (e) { if (t !== "pointermove" || Math.abs(e.movementY) > 2) clearTimeout(timer); });
    });

    S.state.subscribe(paint);
    S.router.onChange(paint);
    paint();
  }

  S.debug = { mount: build };
})(window.Spark = window.Spark || {});
