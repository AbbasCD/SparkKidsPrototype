/* 4 · eKYC — Identity check (2:4687) → Photo ID tips (2:4743 / 2:4761) →
   Scan NRIC/Passport (2:4779) → Confirm your details (2:4844) → Selfie tips
   (2:4788 / 2:4808) → Scan your face (2:4828) → Almost there (2:4837).
   Sheet: Why do we need to verify with photo ID? (2:4729 → 2:4701 → 2:4715).

   Wiring is copied from the Figma prototype reactions:
   - Each pair of tip frames is one carousel (Viewport › Track › Slide 1/2):
     Next / Back / drag smart-animate the track (350ms ease-in-out). Here both
     frames are one screen; the URL follows the visible slide.
   - Camera mocks: tap anywhere → next screen, dissolve 200ms ease-out.
   - Almost there › Continue sets phase = "payment" and pushes Payment summary. */
(function (S) {
  var ui = S.ui, I = S.icon, esc = ui.esc;

  /* ---------- shared pieces (eKYC component family) ---------- */

  /* Header / Back + title: time-only status bar + 24px back at (20, 58) */
  function header(back) {
    return ui.statusBar({ timeOnly: true }) +
      '<div class="ekyc-nav">' + (back === false ? "" :
        '<button type="button" class="ekyc-nav__back" data-tap="icon" ' + (back || 'data-action="back"') + ' aria-label="Back">' + I("auth-back") + "</button>") + "</div>";
  }
  /* Button / Primary · Button / Outline (Nunito Sans Bold 14 → body face) */
  function btn(label, o) {
    o = o || {};
    return ui.button({ label: label, variant: o.outline ? "secondary" : "primary", size: o.size || "large", block: o.block !== false, attrs: o.attrs })
      .replace('class="btn ', 'class="btn btn--ekyc' + (o.h ? " btn--h" + o.h : "") + " ");
  }
  /* Link / Text + trailing icon — "Why do we need to verify with photo ID?" */
  function whyLink() {
    return '<button type="button" class="ekyc-link" data-tap="text" data-why><span>Why do we need to verify with photo ID?</span>' + I("help-18") + "</button>";
  }
  /* List / Check item — Tone=Success | Neutral */
  function checkItem(title, sub, tone) {
    return '<div class="ekyc-check ekyc-check--' + (tone || "success") + '">' + I(tone === "neutral" ? "minus-circle" : "check-circle-green") +
      '<p class="ekyc-check__text"><span class="ekyc-check__title">' + title + "</span>" + (sub ? '<span class="ekyc-check__sub">' + sub + "</span>" : "") + "</p></div>";
  }
  /* Camera / Corner marks */
  function corners(cls) {
    return '<div class="cam-corners ' + (cls || "") + '" aria-hidden="true">' +
      ["tl", "tr", "br", "bl"].map(function (c) { return I("camera-corner", "cam-corners__c cam-corners__c--" + c); }).join("") + "</div>";
  }
  function img(file, cls, style) {
    return '<img class="' + cls + '" src="' + ui.img(file) + '" alt="" draggable="false"' + (style ? ' style="' + style + '"' : "") + ">";
  }
  var idCard = function (cls, style) { return img("ekyc-id-card.svg", "ekyc-idcard " + (cls || ""), style); };
  /* 40px ✓ / ✕ verdict icons, positioned like the Figma slide */
  function verdict(name, x, y) { return I(name, "ekyc-verdict").replace('class="icon ekyc-verdict"', 'class="icon ekyc-verdict" style="left:' + x + "px;top:" + y + 'px"'); }
  var person = function (style, faded) { return img("ekyc-person.svg", "ekyc-person" + (faded ? " is-faded" : ""), style); };

  /* ---------- Why verify sheet (2:4701) ---------- */
  function openWhy() {
    S.sheet.open({
      className: "sheet--why", rootClass: "sheet-root--why", closeMs: 300, labelledBy: "why-title",
      header: '<div class="sheet__header sheet__header--why"><h2 class="why__title" id="why-title">Why do we need to verify with photo ID?</h2>' +
        '<button type="button" class="why__close" data-tap="icon" data-close aria-label="Close">' + I("ekyc-close") + "</button></div>",
      content:
        '<p class="why__text">As a mandatory requirement by the Malaysian Communications and Multimedia Commission (MCMC), we need to verify your ID as a part of the activation process.</p>' +
        '<p class="why__text">If information provided by you is judged to be false, your line will be terminated immediately based on regulations set by MCMC.</p>' +
        // the web address has no destination in the prototype — press feedback only
        '<p class="why__more">Learn more at&nbsp; <button type="button" data-tap="text">www.digital-id.my</button></p>' +
        btn("Got it", { outline: true, h: 36, attrs: { "data-close": "" } })
    });
  }
  function wireWhy(ctx) {
    ctx.el.addEventListener("click", function (e) { if (e.target.closest("[data-why]")) openWhy(); });
  }

  /* ---------------- Identity check (2:4687) ---------------- */
  S.router.define("/ekyc", {
    render: function (ctx) {
      ctx.el.classList.add("screen--white"); // eKYC frames are #ffffff in Figma
      ctx.scroll.innerHTML = header() +
        '<div class="ekyc ekyc--intro">' +
          '<div class="ekyc-banner">' + I("shield-badge") + "<p>Information you provide will be treated with strict confidentiality.</p></div>" +
          '<h1 class="ekyc__title ekyc__title--intro"><span class="hold-word" data-hold>Identity</span> check</h1>' +
          '<p class="ekyc__sub">Verify your identity in just a few steps.</p>' +
          '<h2 class="ekyc__need">You’ll need the following:</h2>' +
          '<div class="ekyc__reqs">' +
            checkItem("MyDigital ID app", "Required by the regulator MCMC.") +
            checkItem("Photo ID", "NRIC or Passport for verification.") +
            checkItem("Your details", "Your full name, address and ID number.") +
            checkItem("A live selfie", "Match your ID using facial recognition.") +
          "</div>" +
          '<div class="ekyc__footer">' +
            btn("Get started", { attrs: { "data-go": "/ekyc/id-tip-1" } }) +
            // no destination in the prototype — press feedback only
            btn("Download MyDigital ID app", { outline: true }) +
            whyLink() +
          "</div>" +
        "</div>";
      wireWhy(ctx);
      // Facilitator shortcut (client request): holding "Identity" skips the eKYC section
      ui.onHold(ctx.el.querySelector("[data-hold]"), function () {
        S.state.set({ phase: "payment" });
        S.router.go("/payment");
      });
    }
  });

  /* ---------------- Tip carousels ---------------- */
  var TIPS = {
    id: {
      routes: ["/ekyc/id-tip-1", "/ekyc/id-tip-2"],
      next: "/ekyc/scan-id",
      iconBackOnSecond: "prev",     // 2:4761 back icon → Photo ID tip 1
      slides: [
        '<h1 class="ekyc__title">Place your photo ID inside of the frame</h1>' +
          corners("cam-corners--tip") + idCard("", "left:55px;top:251px"),
        '<h1 class="ekyc__title">Ensure your information is readable</h1>' +
          idCard("is-blurred", "left:40px;top:142px") + verdict("cross-circle-lg", 318, 210) +
          idCard("", "left:40px;top:358px") + verdict("check-circle-lg", 318, 424)
      ]
    },
    selfie: {
      routes: ["/ekyc/selfie-tip-1", "/ekyc/selfie-tip-2"],
      next: "/ekyc/scan-face",
      iconBackOnSecond: "exit",     // 2:4808 back icon → Confirm your details
      slides: [
        '<h1 class="ekyc__title">Place your face within the frame</h1>' +
          '<span class="ekyc-face-guide" aria-hidden="true"></span>' + person("left:45px;top:204px;width:285px"),
        '<h1 class="ekyc__title">Ensure it’s only your face we can detect</h1>' +
          person("left:8px;top:254px;width:100px", true) + person("left:96px;top:244px;width:110px", true) +
          person("left:36px;top:234px;width:130px") + person("left:232px;top:234px;width:130px") +
          verdict("cross-circle-lg", 82, 404) +
          verdict("check-circle-lg", 277, 404)
      ]
    }
  };

  function tipScreen(key, startPage) {
    var cfg = TIPS[key];
    return {
      render: function (ctx) {
      ctx.el.classList.add("screen--white"); // eKYC frames are #ffffff in Figma
        var page = startPage;
        ctx.scroll.innerHTML = header('data-tip-back="icon"') +
          '<div class="ekyc-tips">' +
            '<div class="ekyc-tips__viewport">' +
              '<div class="ekyc-tips__track">' +
                cfg.slides.map(function (s, i) { return '<div class="ekyc-tips__slide" data-slide="' + i + '">' + s + "</div>"; }).join("") +
              "</div>" +
            "</div>" +
            '<div class="ekyc-pager" aria-hidden="true"><span class="ekyc-pager__dot"></span><span class="ekyc-pager__dot"></span></div>' +
            '<div class="ekyc-tips__buttons">' +
              btn("Back", { outline: true, h: 48, block: false, attrs: { "data-tip-back": "button" } }) +
              btn("Next", { h: 48, block: false, attrs: { "data-tip-next": "" } }) +
            "</div>" +
            whyLink() +
          "</div>";

        var viewport = ctx.el.querySelector(".ekyc-tips__viewport");
        var track = ctx.el.querySelector(".ekyc-tips__track");
        var slides = ctx.el.querySelectorAll(".ekyc-tips__slide");
        var dots = ctx.el.querySelectorAll(".ekyc-pager__dot");

        function paint(animate) {
          track.classList.toggle("is-anim", !!animate);
          track.style.transform = "translate3d(" + (-50 * page) + "%,0,0)";
          dots.forEach(function (d, i) { d.classList.toggle("is-active", i === page); });
          slides.forEach(function (s, i) { s.setAttribute("aria-hidden", String(i !== page)); });
        }
        function goPage(p) {
          if (p === page) { paint(true); return; }
          page = p; paint(true);
          S.router.setPath(cfg.routes[page]);
        }
        paint(false);

        ctx.el.addEventListener("click", function (e) {
          var t = e.target;
          if (t.closest("[data-tip-next]")) {
            if (page === 0) goPage(1); else S.router.go(cfg.next);
            return;
          }
          var b = t.closest("[data-tip-back]");
          if (b) {
            var fromIcon = b.dataset.tipBack === "icon";
            if (page === 1 && !(fromIcon && cfg.iconBackOnSecond === "exit")) goPage(0);
            else S.router.back();
          }
        });
        wireWhy(ctx);

        /* Drag / swipe the track (Figma: Track ON_DRAG → other slide) */
        var startX = 0, startY = 0, dx = 0, dragging = false, decided = false, t0 = 0, pid = null;
        viewport.addEventListener("pointerdown", function (e) {
          if (e.button !== 0) return;
          startX = e.clientX; startY = e.clientY; dx = 0; dragging = true; decided = false; t0 = performance.now(); pid = e.pointerId;
        });
        viewport.addEventListener("pointermove", function (e) {
          if (!dragging || e.pointerId !== pid) return;
          var mx = e.clientX - startX, my = e.clientY - startY;
          if (!decided) {
            if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
            decided = true;
            if (Math.abs(my) > Math.abs(mx)) { dragging = false; return; } // vertical: let the page scroll
            viewport.setPointerCapture(pid);
            viewport.classList.add("is-dragging");
          }
          dx = mx;
          var w = viewport.clientWidth;
          var edge = (page === 0 && dx > 0) || (page === 1 && dx < 0);
          var off = edge ? dx / 3 : dx;                       // rubber-band past the ends
          track.classList.remove("is-anim");
          track.style.transform = "translate3d(" + (-page * w + off) + "px,0,0)";
        });
        function end() {
          if (!dragging) return;
          dragging = false;
          viewport.classList.remove("is-dragging");
          if (!decided) return;
          var w = viewport.clientWidth, v = dx / Math.max(1, performance.now() - t0);
          var target = page;
          if ((dx < -w * 0.2 || v < -0.4) && page === 0) target = 1;
          if ((dx > w * 0.2 || v > 0.4) && page === 1) target = 0;
          goPage(target);
        }
        viewport.addEventListener("pointerup", end);
        viewport.addEventListener("pointercancel", end);
        // keep the next slide's text unselectable while dragging with a mouse
        viewport.addEventListener("dragstart", function (e) { e.preventDefault(); });
      }
    };
  }
  S.router.define("/ekyc/id-tip-1", tipScreen("id", 0));
  S.router.define("/ekyc/id-tip-2", tipScreen("id", 1));
  S.router.define("/ekyc/selfie-tip-1", tipScreen("selfie", 0));
  S.router.define("/ekyc/selfie-tip-2", tipScreen("selfie", 1));

  /* ---------------- Camera mocks ---------------- */
  function camera(ctx, o) {
    ctx.scroll.innerHTML = '<div class="ekyc-cam" data-tap="area" role="button" tabindex="0" aria-label="' + esc(o.label) + '">' +
      header(o.back ? undefined : false) + o.guide +
      '<div class="ekyc-cam__sheet ekyc-cam__sheet--' + o.sheet + '"><h1 class="ekyc-cam__title">' + o.title + "</h1>" +
        '<div class="ekyc-cam__tips">' + o.tips.map(function (t) { return checkItem(t, null, o.tone); }).join("") + "</div></div>" +
      "</div>";
    var cam = ctx.el.querySelector(".ekyc-cam");
    var go = function () { S.router.go(o.next, { transition: "dissolve", duration: 200 }); };
    cam.addEventListener("click", function (e) { if (!e.target.closest("[data-action]")) go(); });
    cam.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target === cam) { e.preventDefault(); go(); } });
  }

  /* Scan NRIC / Passport (2:4779) */
  S.router.define("/ekyc/scan-id", {
    render: function (ctx) {
      ctx.el.classList.add("screen--white"); // eKYC frames are #ffffff in Figma
      camera(ctx, { back: true, label: "Scan your ID", next: "/ekyc/confirm", sheet: "page", tone: "neutral",
        guide: corners("cam-corners--scan"), title: "Scan your NRIC/ Passport",
        tips: ["Good lighting", "Keep within the lines", "High contrasting background"] });
    }
  });

  /* Scan your face (2:4828) — no back arrow in Figma */
  S.router.define("/ekyc/scan-face", {
    render: function (ctx) {
      ctx.el.classList.add("screen--white"); // eKYC frames are #ffffff in Figma
      camera(ctx, { back: false, label: "Scan your face", next: "/ekyc/done", sheet: "white", tone: "success",
        guide: '<span class="ekyc-cam__face" aria-hidden="true"></span>', title: "Scan your face",
        tips: ["Good lighting", "Frame your face within the dotted lines", "Neutral background"] });
    }
  });

  /* ---------------- Confirm your details (2:4844) ---------------- */
  S.router.define("/ekyc/confirm", {
    render: function (ctx) {
      ctx.el.classList.add("screen--white"); // eKYC frames are #ffffff in Figma
      var f = function (label, value, cls) { return '<div class="' + (cls || "") + '">' + ui.field({ label: label, value: value }) + "</div>"; };
      ctx.scroll.innerHTML = header() +
        '<form class="ekyc ekyc-form" onsubmit="return false" autocomplete="off">' +
          '<h1 class="ekyc__title">Confirm your details</h1>' +
          '<p class="ekyc-form__intro">We’ve auto-filled most of your details from your ID scan. Please double-check everything before continuing.</p>' +
          '<span class="ekyc-form__gap4" aria-hidden="true"></span>' +
          '<h2 class="ekyc-form__section">Personal details</h2>' +
          '<p class="ekyc-form__label" id="title-label">Title</p>' +
          '<div class="ekyc-form__options" role="radiogroup" aria-labelledby="title-label" data-radio-group>' +
            ui.radioOption({ label: "Male" }) + ui.radioOption({ label: "Female", selected: true }) +
          "</div>" +
          f("Full name", "Jane Doe") +
          '<div class="ekyc-form__row">' + f("Birth date", "02/03/1993", "grow") + f("MYS", "XXX", "grow") + "</div>" +
          '<div class="ekyc-form__row">' + f("NRIC", "XXXX", "nric") + f("ID Number", "XXXXXX-XX-XXXXX", "grow") + "</div>" +
          // "Let us know here" has no destination in the prototype — press feedback only
          '<p class="ekyc-form__hint">ID number incorrect? <button type="button" data-tap="text">Let us know here</button></p>' +
          '<span class="ekyc-form__gap8" aria-hidden="true"></span>' +
          '<h2 class="ekyc-form__section">Address</h2>' +
          // values exactly as drawn in Figma (see handover notes)
          f("1st line of address", "Second line of your address") +
          f("2nd line of address (optional)", "Second line of your address") +
          f("City", "DD/MM/YY") +
          '<div class="ekyc-form__row">' + f("Postal code", "XXXX", "grow") + f("State", "XXXXXX-XX-XXXXX", "grow") + "</div>" +
          ui.checkbox({ label: "Use this address as my billing address.", checked: true }) +
          ui.checkbox({ label: "I hereby confirm that these details are true and correct.", checked: true }) +
          '<span class="ekyc-form__gap8" aria-hidden="true"></span>' +
        "</form>";
      ctx.pinBottom(ui.el('<div class="ekyc-footer">' + btn("Next", { size: "medium", attrs: { "data-go": "/ekyc/selfie-tip-1" } }) + "</div>"));
      // Client request: Next is unavailable unless both confirmation boxes are ticked
      var next = ctx.el.querySelector(".ekyc-footer .btn");
      var check = function () { next.disabled = ctx.el.querySelectorAll('.ekyc-form [role="checkbox"]:not(.is-checked)').length > 0; };
      ctx.el.addEventListener("click", function (e) { if (e.target.closest('[role="checkbox"]')) setTimeout(check, 0); });
    }
  });

  /* ---------------- Almost there (2:4837) ---------------- */
  S.router.define("/ekyc/done", {
    render: function (ctx) {
      ctx.el.classList.add("screen--white"); // eKYC frames are #ffffff in Figma
      ctx.scroll.innerHTML = header() +
        '<div class="ekyc ekyc--done">' +
          '<h1 class="ekyc__title">Almost there...</h1>' +
          '<p class="ekyc__sub">Verify your MyDigital ID</p>' +
          '<p class="ekyc-done__count">You have <b>2:41 minutes</b> to verify via the MyDigital app to confirm this registration.</p>' +
          '<p class="ekyc-done__small">If you haven’t verified within this time, we’ll ask you to start the process of verifying your ID again.</p>' +
          '<div class="ekyc__footer ekyc__footer--done">' + btn("Continue", { attrs: { "data-continue": "" } }) + "</div>" +
        "</div>";
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-continue]")) return;
        S.state.set({ phase: "payment" });   // Figma: SET_VARIABLE phase = "payment"
        S.router.go("/payment");
      });
    }
  });
})(window.Spark = window.Spark || {});
