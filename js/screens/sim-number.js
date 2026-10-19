/* 3 · eSIM & Number choice — Choose SIM (23:1227 / 113:5487) and
   Choose your number (23:1378 / 23:1589). Rules: handover §7.4, §8.7, §8.8. */
(function (S) {
  var ui = S.ui, I = S.icon;

  function journeyFrame(ctx, title, step, content, footerBtnAttrs) {
    ctx.scroll.innerHTML = ui.statusBar() + ui.navHeader({ title: title }) +
      '<div class="journey">' + ui.stepper(step) + content + "</div>";
    ctx.pinBottom(ui.el('<div class="journey-footer journey-footer--plain">' +
      ui.button({ label: "Next", block: true, lexend: true, attrs: footerBtnAttrs }) + "</div>"));
  }

  /* ---------------- Choose SIM ---------------- */
  S.router.define("/sim", {
    render: function (ctx) {
      journeyFrame(ctx, "eSIM Compatibility", "sim",
        '<div class="journey__content"><h2 class="journey__title">Choose a SIM</h2>' +
          '<div class="stack gap-16" data-radio-group>' +
            ui.optionCard({ title: "eSIM", detail: "Free delivery" }) +
            // Physical SIM has no designed selected state; selectable for symmetry (§11)
            ui.optionCard({ title: "Physical SIM", detail: "+ 4RM delivery" }) +
          "</div>" +
          // Link has no destination in the prototype — press feedback only
          '<div class="sim__link-row">' + ui.link({ label: "SIM types and compatibility", iconR: "info" }) + "</div>" +
        "</div>" +
        '<div class="journey__note">' + ui.note({ text: "Never activate an incompatible eSIM as you can’t be refunded after use." }) + "</div>",
        { "data-next": "" });
      // Client request: Next is unavailable until a SIM is chosen; with
      // Physical SIM chosen it stays tappable but does nothing.
      var next = ctx.el.querySelector("[data-next]"), choice = null;
      next.disabled = true;
      ctx.el.addEventListener("select", function (e) {
        choice = e.detail.el.querySelector(".option-card__title").textContent;
        next.disabled = false;
      });
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-next]")) return;
        if (choice !== "eSIM") return;
        S.state.set({ sim: "eSIM" });   // Payment summary: Sim Type + free delivery
        // §7.4 Next → phase "plan"; existing customers pick from Intro plans
        S.state.set({ phase: "plan" });
        S.router.go(S.state.journey === "existing" ? "/intro-plans" : "/kids-plans");
      });
    }
  });

  /* ---------------- Choose your number ---------------- */
  var NUMBERS = ["012-123-345", "123-345-133", "123-345-345", "012-687-123", "123-345-909", "012-345-123"];

  /* Highlight the searched digits inside a formatted number (dashes ignored) */
  function highlight(num, q) {
    if (!q) return num;
    var digits = "", map = [];
    for (var i = 0; i < num.length; i++) if (/\d/.test(num[i])) { map.push(i); digits += num[i]; }
    var at = digits.indexOf(q);
    if (at < 0) return null;
    var start = map[at], end = map[at + q.length - 1] + 1;
    return num.slice(0, start) + "<mark>" + num.slice(start, end) + "</mark>" + num.slice(end);
  }

  S.router.define("/number", {
    render: function (ctx) {
      var list = NUMBERS.slice(), query = "", selected = null;
      journeyFrame(ctx, "Choose your number", "number",
        '<div class="journey__content journey__content--tight">' +
          '<h2 class="journey__label">Pick your number</h2>' +
          '<label class="search"><span class="sr-only">Search for digits</span>' + I("search") +
            '<input type="text" inputmode="numeric" autocomplete="off" data-q>' +
            '<button type="button" class="search__clear" data-tap="icon" data-clear aria-label="Clear search">' + I("close") + "</button></label>" +
          '<p class="journey__helper">Select one of the available phone numbers or search for specific digits.</p>' +
          '<div class="shuffle-row">' + ui.button({ label: "Shuffle", variant: "secondary", filled: true, size: "small", iconR: "shuffle", attrs: { "data-shuffle": "" } }) + "</div>" +
          '<div class="numbers" role="radiogroup" aria-label="Available numbers" data-list></div>' +
        "</div>",
        { "data-next": "" });
      var input = ctx.el.querySelector("[data-q]"), box = ctx.el.querySelector(".search"), listEl = ctx.el.querySelector("[data-list]");
      var next = ctx.el.querySelector("[data-next]");
      next.disabled = true;   // client request: unavailable until a number is chosen

      function paint() {
        box.classList.toggle("is-filled", !!query);
        var rows = list.map(function (n) {
          var html = n === selected ? n : highlight(n, query);
          if (html === null) return "";
          var sel = n === selected;
          return '<button type="button" role="radio" aria-checked="' + sel + '" class="option-card number-option' + (sel ? " is-selected" : "") + '" data-tap="surface" data-num="' + n + '">' +
            '<span class="option-card__title">' + html + "</span>" + ui.radio(sel) + "</button>";
        }).join("");
        listEl.innerHTML = rows || '<p class="numbers__empty">No numbers match those digits. Try different ones, or shuffle.</p>';
      }
      // Client request: tapping the search field no longer fills in "123"; it stays blank
      input.addEventListener("input", function () { query = input.value.replace(/\D/g, ""); input.value = query; paint(); });
      ctx.el.addEventListener("click", function (e) {
        var t = e.target;
        if (t.closest("[data-clear]")) { query = ""; input.value = ""; paint(); return; }
        if (t.closest("[data-shuffle]")) { list.sort(function () { return Math.random() - 0.5; }); paint(); return; }
        var row = t.closest("[data-num]");
        if (row) {
          // Client request: tapping a number only selects it (no "123" filled into search)
          selected = row.dataset.num; next.disabled = false; paint(); return;
        }
        if (t.closest("[data-next]") && selected) {
          S.state.set({ phase: "ekyc", number: selected });
          S.router.go("/ekyc");
        }
      });
      paint();
    }
  });
})(window.Spark = window.Spark || {});
