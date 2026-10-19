/* 2 · Create account & sign in (2:5550 … 2:5790). Rules: handover §7.3.
   Fields are real inputs, but the journey matches the prototype: no
   validation blocks a tester. Error designs (wrong code, incorrect password)
   are kept as states but aren't on the happy path, exactly as in Figma. */
(function (S) {
  var ui = S.ui, I = S.icon, esc = ui.esc;
  var DEMO_EMAIL = "janedoe@email.co.uk";
  var DEMO_PASSWORD = "p@Ssw0rd-tr33-doG!";

  function email() { return S.state.get().email || DEMO_EMAIL; }

  /* Shared frame: time-only status bar, back (plain 24 or circle 36), body, footer */
  function frame(ctx, o) {
    ctx.el.classList.add("screen--white"); // auth frames are #ffffff in Figma
    ctx.scroll.innerHTML = ui.statusBar({ timeOnly: true }) +
      '<div class="auth">' +
        '<div class="auth__nav"><button type="button" class="auth__back auth__back--' + o.back + '" data-tap="icon" data-action="back" aria-label="Back">' +
          I(o.back === "plain" ? "auth-back" : "auth-back-circle") + "</button></div>" +
        '<div class="auth__body">' + o.body + "</div>" +
        '<div class="auth__footer' + (o.stack ? " auth__footer--stack" : "") + '">' + o.footer + "</div>" +
      "</div>";
  }
  function primary(label, attrs) { return ui.button({ label: label, block: true, auth: true, attrs: attrs }); }
  function footnote(text, link, go) {
    return '<p class="auth__footnote">' + text + ' <button type="button" data-tap="text" data-go="' + go + '">' + link + "</button></p>";
  }
  function heading(title, sub) { return '<h1 class="auth__title">' + title + "</h1>" + (sub ? '<p class="auth__sub">' + sub + "</p>" : ""); }
  function field(o) {
    return ui.authField({ placeholder: o.placeholder, value: o.value, type: o.type, eye: o.eye, error: o.error, label: o.label,
      attrs: Object.assign({ autocomplete: o.autocomplete || "off", autocapitalize: "off", spellcheck: "false" }, o.attrs || {}) });
  }

  /* Client request: the CTA is unavailable until the screen's step is done.
     Email screens: until something email-shaped is typed (a@b.c). */
  function gateEmail(ctx, sel) {
    var input = ctx.el.querySelector("[data-email]"), btn = ctx.el.querySelector(sel);
    var check = function () { btn.disabled = !/\S+@\S+\.\S+/.test(input.value.trim()); };
    input.addEventListener("input", check); check();
  }

  /* Client request: tapping the empty email box fills in the demo address
     (Create account, Sign in, Forgot password). The email check still applies. */
  function autofillEmail(ctx) {
    var input = ctx.el.querySelector("[data-email]");
    input.addEventListener("focus", function () {
      if (!input.value) { input.value = "youremail@email.com"; input.dispatchEvent(new Event("input")); }
    });
  }

  /* Facilitator shortcut (client request): holding "account" in the Create
     account title skips account creation and verification — the same result
     as Verify (logged in, phase "sim", Choose SIM). */
  function wireSkipAccount(ctx) {
    ui.onHold(ctx.el.querySelector("[data-hold]"), function () {
      if (!S.state.get().email) S.state.set({ email: "youremail@email.com" });
      S.state.set({ loggedIn: true, phase: "sim" });
      S.router.go("/sim");
    });
  }

  /* Eye: show/hide password (eye ↔ eye-off, as in the Figma field states) */
  function wireEye(root) {
    root.querySelectorAll(".auth-field__trail").forEach(function (t) {
      t.setAttribute("role", "button"); t.setAttribute("tabindex", "0"); t.setAttribute("data-tap", "icon");
      t.setAttribute("aria-label", "Show password");
      t.addEventListener("click", function () {
        var input = t.parentNode.querySelector("input");
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        t.innerHTML = I(show ? "eye-off" : "eye");
        t.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  }

  /* ---------------- Create account – email (2:5550) ---------------- */
  S.router.define("/signup", {
    render: function (ctx) {
      frame(ctx, { back: "plain",
        body: heading('Create your <span class="hold-word" data-hold>account</span>', "Get started with Spark in just a few steps") +
          '<p class="auth__label">Enter your email address</p>' +
          field({ placeholder: "youremail@email.com", type: "email", label: "Email address", autocomplete: "email", attrs: { inputmode: "email", "data-email": "" } }),
        footer: primary("Next", { "data-next": "" }) + footnote("Have an account?", "Sign in", "/signin") });
      gateEmail(ctx, "[data-next]");
      wireSkipAccount(ctx);
      autofillEmail(ctx);
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-next]")) return;
        var v = ctx.el.querySelector("[data-email]").value.trim();
        if (v) S.state.set({ email: v });
        S.router.go("/signup/password");
      });
    }
  });

  /* ------- Create account – set password (2:5562) ↔ strong password (2:5598) ------- */
  var RULES = [
    ["Include at least 8 characters", function (v) { return v.length >= 8; }],
    ["Include at least one uppercase letter", function (v) { return /[A-Z]/.test(v); }],
    ["Include at least one number", function (v) { return /\d/.test(v); }],
    ["Include at least one symbol (eg. # @ & !)", function (v) { return /[^A-Za-z0-9]/.test(v); }]
  ];
  S.router.define("/signup/password", {
    render: function (ctx) {
      frame(ctx, { back: "circle",
        body: heading('Create your <span class="hold-word" data-hold>account</span>', "Get started with Spark in just a few steps") +
          '<p class="auth__label">Set your password</p>' +
          field({ placeholder: "eg. paSsw*rd1", type: "password", eye: true, label: "Password", autocomplete: "new-password", attrs: { "data-pw": "" } }) +
          '<div data-strength>' + ui.strength({}) + "</div>" +
          '<p class="auth__rules-title">Your password must include:</p>' +
          '<div class="auth__rules" data-rules></div>',
        footer: primary("Create account", { "data-create": "" }) + footnote("Have an account?", "Sign in", "/signin") });
      var input = ctx.el.querySelector("[data-pw]");
      var strengthWrap = ctx.el.querySelector("[data-strength]");
      var rulesEl = ctx.el.querySelector("[data-rules]");
      function evaluate() {
        var v = input.value, met = RULES.map(function (r) { return r[1](v); });
        var strong = met.every(Boolean);
        strengthWrap.innerHTML = ui.strength({ strong: strong });
        // keep the rules-title spacing rule working (strength element is wrapped)
        strengthWrap.firstChild.style.marginTop = strong ? "8px" : "10px";
        rulesEl.innerHTML = RULES.map(function (r, i) { return ui.pwRule({ text: r[0], met: met[i] }); }).join("");
        ctx.el.querySelector(".auth__rules-title").style.marginTop = strong ? "21px" : "25px";
        return strong;
      }
      evaluate();
      wireEye(ctx.el);
      wireSkipAccount(ctx);
      input.addEventListener("input", evaluate);
      // Prototype behaviour: tapping the empty field fills in a strong password
      input.addEventListener("focus", function () { if (!input.value) { input.value = DEMO_PASSWORD; evaluate(); } });
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-create]")) return;
        if (!evaluate()) { input.value = DEMO_PASSWORD; evaluate(); return; } // first tap → strong state (§7.3)
        S.router.go("/signup/verify");
      });
    }
  });

  /* ---------------- Verify account (2:5635 · 2:5651 · 2:5674) ---------------- */
  S.router.define("/signup/verify", {
    render: function (ctx) {
      frame(ctx, { back: "plain",
        body: heading("Verify your account", "We've sent a 6-digit code to<br><b>" + esc(email()) + "</b>") +
          '<p class="auth__label auth__label--tight">Enter your code below</p>' +
          '<div class="code-entry">' + ui.code({ value: "" }) +
            '<input type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="6-digit code" data-code></div>' +
          '<div data-msg></div>' +
          '<button type="button" class="auth__resend" data-tap="text" data-resend style="margin-top:18px">Resend code</button>',
        footer: primary("Verify", { "data-verify": "" }) });
      var input = ctx.el.querySelector("[data-code]");
      var digits = ctx.el.querySelectorAll(".code__digit");
      var msg = ctx.el.querySelector("[data-msg]");
      var resend = ctx.el.querySelector("[data-resend]");
      function paint() {
        var v = input.value.replace(/\D/g, "").slice(0, 6); input.value = v;
        ctx.el.querySelector("[data-verify]").disabled = v.length < 6;   // Verify needs all 6 digits
        digits.forEach(function (d, i) { d.textContent = v[i] || ""; d.classList.toggle("is-current", document.activeElement === input && i === Math.min(v.length, 5)); });
      }
      ["input", "focus", "blur"].forEach(function (t) { input.addEventListener(t, paint); });
      paint();

      var timer = null;
      ctx.el.addEventListener("click", function (e) {
        if (e.target.closest("[data-resend]")) {
          // "Resend code" → resend-wait state, with a live countdown
          clearInterval(timer);
          var s = 59;
          var draw = function () { msg.innerHTML = '<p class="auth__wait" style="margin-top:14px;text-align:center">Please wait <b>' + s + " seconds</b> to resend code</p>"; };
          resend.style.marginTop = "24px"; draw();
          timer = setInterval(function () { s--; if (s <= 0) { clearInterval(timer); msg.innerHTML = ""; resend.style.marginTop = "18px"; } else draw(); }, 1000);
        }
        if (e.target.closest("[data-verify]")) {
          clearInterval(timer);
          // §7.3: Verify from any state → logged in, phase "sim", Choose SIM
          S.state.set({ loggedIn: true, phase: "sim" });
          S.router.go("/sim");
        }
      });
    }
  });

  /* ---------------- Sign in – email (2:5714) ---------------- */
  S.router.define("/signin", {
    render: function (ctx) {
      frame(ctx, { back: "circle",
        body: heading("Sign in", "Welcome back!") +
          '<p class="auth__label">Email address</p>' +
          field({ placeholder: "youremail@email.com", type: "email", label: "Email address", autocomplete: "email", attrs: { inputmode: "email", "data-email": "" } }),
        footer: primary("Next", { "data-next": "" }) + footnote("Don't have an account?", "Create an account", "/signup") });
      gateEmail(ctx, "[data-next]");
      autofillEmail(ctx);
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-next]")) return;
        var v = ctx.el.querySelector("[data-email]").value.trim();
        if (v) S.state.set({ email: v });
        S.router.go("/signin/password");
      });
    }
  });

  /* ------- Sign in – password (2:5727) · incorrect password state (2:5744) ------- */
  S.router.define("/signin/password", {
    render: function (ctx) {
      frame(ctx, { back: "circle",
        body: heading("Sign in", "Welcome back") +
          '<p class="auth__label">Password</p>' +
          field({ value: "•••••••••••••••••", type: "password", eye: true, label: "Password", autocomplete: "current-password", attrs: { "data-pw": "" } }) +
          '<button type="button" class="auth__center-link" data-tap="text" data-go="/forgot" style="margin-top:34px">Forgot your password?</button>',
        footer: primary("Sign in", { "data-signin": "" }) + footnote("Don't have an account?", "Create an account", "/signup") });
      var pw = ctx.el.querySelector("[data-pw]");
      pw.value = DEMO_PASSWORD; // the design shows a filled field
      wireEye(ctx.el);
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-signin]")) return;
        S.state.set({ loggedIn: true });
        if (S.state.phase === "account") {          // picked a plan first
          S.state.set({ phase: "sim" });
          S.router.go("/sim");
        } else {                                     // existing customer
          S.state.set({ journey: "existing" });
          S.model.ensureExistingLine();   // the existing customer's own line, for Manage lines
          S.router.go("/home", { transition: "dissolve" });
        }
      });
    }
  });

  /* ---------------- Forgot password (2:5768) ---------------- */
  S.router.define("/forgot", {
    render: function (ctx) {
      frame(ctx, { back: "circle",
        body: heading("Forgot your password", "Just enter your email and we'll send you a link to reset your password.") +
          '<p class="auth__label auth__label--loose">Email address</p>' +
          field({ placeholder: "youremail@email.com", type: "email", label: "Email address", autocomplete: "email", attrs: { inputmode: "email", "data-email": "" } }),
        footer: primary("Reset your password", { "data-reset": "" }) });
      gateEmail(ctx, "[data-reset]");
      autofillEmail(ctx);
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-reset]")) return;
        var v = ctx.el.querySelector("[data-email]").value.trim();
        if (v) S.state.set({ email: v });
        S.router.go("/forgot/sent");
      });
    }
  });

  /* ---------------- Check your inbox (2:5780) ---------------- */
  S.router.define("/forgot/sent", {
    render: function (ctx) {
      frame(ctx, { back: "circle",
        body: heading("Check your inbox", "We've send a password recovery link to<br><b>" + esc(email()) + "</b>") +
          '<p class="auth__wait" style="margin-top:20px">Please wait <b>59 seconds</b> before resending another link</p>',
        // "Resend link" / "Try another email address" have no destination in the prototype
        footer: '<button type="button" class="auth__footnote auth__footnote--muted" data-tap="text" data-go="/forgot/error">Didn\'t receive an email?</button>' +
          '<p class="auth__footnote" style="margin-top:-6px"><button type="button" data-tap="text">Resend link</button> or <button type="button" data-tap="text">Try another email address</button></p>' });
    }
  });

  /* ---------------- Couldn't reset password (2:5790) ---------------- */
  S.router.define("/forgot/error", {
    render: function (ctx) {
      frame(ctx, { back: "circle", stack: true,
        body: heading("We couldn't reset your password.", "Please try again in a little while, or use Get Help below if you need further support."),
        footer: primary("Try again", { "data-go": "/forgot" }) +
          ui.button({ label: "Get help", variant: "secondary", block: true, auth: true, attrs: { "data-action": "back" } }) });
    }
  });
})(window.Spark = window.Spark || {});
