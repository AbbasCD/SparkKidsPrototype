/* Shared components — handover §10. Each returns an HTML string so screens can
   compose them with template literals. Interactive behaviour (toggles, back,
   radios) is wired once by delegation in app.js. */
(function (S) {
  var I = function (n, c) { return S.icon(n, c); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var attrs = function (a) { if (!a) return ""; return Object.keys(a).map(function (k) { return " " + k + '="' + esc(a[k]) + '"'; }).join(""); };

  var ui = {
    esc: esc,

    /* System/Status bar (17:1233) · Kids/Status bar (36:3422) — static mock */
    statusBar: function (o) {
      o = o || {};
      return '<div class="status-bar' + (o.kids ? " status-bar--kids" : "") + '" aria-hidden="true">' +
        '<span class="status-bar__time">9:41</span>' + (o.timeOnly ? "" : I(o.kids ? "status-indicators-kids" : "status-indicators")) + "</div>";
    },

    /* Navigation/Header (17:1252) */
    navHeader: function (o) {
      o = o || {};
      return '<header class="nav-header">' +
        (o.back === false ? '<span class="nav-header__spacer"></span>' :
          '<button type="button" class="nav-header__back" data-tap="icon" data-action="back" aria-label="Back">' + I("back") + "</button>") +
        '<h1 class="nav-header__title">' + esc(o.title || "") + "</h1>" +
        '<span class="nav-header__spacer"></span></header>';
    },

    /* Navigation/Top bar (21:1459): profile · notifications · help */
    topBar: function (o) {
      o = o || {};
      var b = function (glyph, label, action) {
        // every icon gets press feedback, even with no destination (client request)
        return '<button type="button" class="top-bar__btn" data-tap="icon"' + (action ? ' data-action="' + action + '"' : "") + ' aria-label="' + label + '">' + S.brandIcon(glyph, { size: 32 }) + "</button>";
      };
      return '<div class="top-bar">' + b("profile", "Account", o.profileAction) +
        '<div class="top-bar__actions">' + b("notification", "Notifications") + b("help", "Help") + "</div></div>";
    },

    /* Buttons: variant primary|secondary|tertiary|special · size large|medium|small */
    button: function (o) {
      var cls = ["btn", "btn--" + (o.variant || "primary"), "btn--" + (o.size || "large")];
      if (o.block) cls.push("btn--block");
      if (o.lexend) cls.push("btn--lexend");
      if (o.auth) cls.push("btn--auth");
      if (o.filled) cls.push("btn--filled");
      return '<button type="button" class="' + cls.join(" ") + '"' + attrs(o.attrs) + (o.disabled ? " disabled" : "") + ">" +
        (o.iconL ? I(o.iconL) : "") + "<span>" + esc(o.label) + "</span>" + (o.iconR ? I(o.iconR) : "") + "</button>";
    },

    /* Link (18:1240): text with optional leading/trailing icon */
    link: function (o) {
      return '<button type="button" class="link" data-tap="text"' + attrs(o.attrs) + ">" +
        (o.iconL ? I(o.iconL) : "") + "<span>" + esc(o.label) + "</span>" + (o.iconR ? I(o.iconR) : "") + "</button>";
    },

    radio: function (on) { return '<span class="radio' + (on ? " is-on" : "") + '" aria-hidden="true"></span>'; },

    /* Option card (19:1417) */
    optionCard: function (o) {
      return '<button type="button" role="radio" aria-checked="' + (!!o.selected) + '" class="option-card' + (o.bordered ? " option-card--bordered" : "") + (o.selected ? " is-selected" : "") + '" data-tap="surface"' + attrs(o.attrs) + ">" +
        '<span class="option-card__title">' + esc(o.title) + "</span>" +
        (o.detail ? '<span class="option-card__detail">' + esc(o.detail) + "</span>" : "") +
        ui.radio(o.selected) + "</button>";
    },

    /* Stepper (18:1458): SIM → Number → Verify ID → Payment */
    stepper: function (current) {
      var steps = [["sim", "SIM", "sim"], ["number", "Number", "phone"], ["verify", "Verify ID", "globe"], ["payment", "Payment", "card"]];
      return '<ol class="stepper" aria-label="Progress">' + steps.map(function (s, i) {
        var cur = s[0] === current;
        return (i ? '<li class="stepper__connector" aria-hidden="true"></li>' : "") +
          '<li class="stepper__step' + (cur ? " is-current" : "") + '"' + (cur ? ' aria-current="step"' : "") + ">" +
          S.brandIcon(s[2], { size: 36, fill: cur ? "#F2FF4D" : "#FFFFFF" }) +
          '<span class="stepper__label">' + s[1] + "</span></li>";
      }).join("") + "</ol>";
    },

    /* Note (18:1289) */
    note: function (o) { return '<div class="note">' + I(o.icon || "warning") + '<p class="note__text">' + esc(o.text) + "</p></div>"; },

    chip: function (o) { return '<span class="chip chip--' + (o.tone || "neutral") + '">' + esc(o.label) + "</span>"; },
    statusChip: function (o) { return '<span class="status-chip status-chip--' + (o.tone || "neutral") + '">' + esc(o.label) + "</span>"; },

    /* Kids/Info chip – plain (36:3023) · shield (36:3160) */
    infoChip: function (o) {
      if (o.kind === "shield") {
        return '<button type="button" class="info-chip info-chip--shield" data-tap="surface"' + attrs(o.attrs) + ">" + I("shield-check") + "<span>" + esc(o.label) + "</span>" + I("info") + "</button>";
      }
      return '<button type="button" class="info-chip info-chip--plain" data-tap="surface"' + attrs(o.attrs) + "><span>" + esc(o.label) + "</span>" + I("info") + "</button>";
    },

    /* Toggle – Switch (30:3869) */
    toggle: function (o) {
      o = o || {};
      return '<button type="button" role="switch" aria-checked="' + (!!o.on) + '" class="toggle' + (o.on ? " is-on" : "") + '"' +
        (o.label ? ' aria-label="' + esc(o.label) + '"' : "") + attrs(o.attrs) + ">" +
        '<span class="toggle__on"></span><span class="toggle__off"></span><span class="toggle__knob"></span></button>';
    },

    pager: function (o) {
      var h = '<div class="pager' + (o.thin ? " pager--thin" : "") + '" aria-hidden="true">';
      for (var i = 1; i <= (o.count || 3); i++) h += '<span class="pager__dot' + (i === o.active ? " is-active" : "") + '"></span>';
      return h + "</div>";
    },

    /* Section header (21:1486) */
    sectionHeader: function (o) {
      return '<div class="section-header">' + (o.glyph ? S.brandIcon(o.glyph, { size: 36 }) : "") +
        '<h2 class="section-header__title">' + esc(o.title) + "</h2>" +
        (o.pager ? ui.pager({ active: o.pager }) : "") + (o.chevron !== false ? I("chevron-right") : "") + "</div>";
    },

    /* Tab bar — parent dashboards (21:1395). Only Home is designed. */
    tabBar: function () {
      var t = function (icon, label, active) {
        return '<span class="tab-bar__tab' + (active ? " is-active" : "") + '" data-tap="surface"' + (active ? ' aria-current="page"' : "") + ">" + I(icon) + "<span>" + label + "</span></span>";
      };
      return '<nav class="tab-bar" aria-label="Main"><div class="tab-bar__pill">' +
        t("tab-home", "Home", true) + t("tab-shop", "Shop") + t("tab-rewards", "Rewards") + "</div></nav>";
    },

    /* Kids/Tab bar (45:4303) as used on the Kids dashboard */
    /* variant "default" = the un-overridden component as placed on Intro plans
       (Plans · Home[grey] · Rewards); otherwise the Kids dashboard instance. */
    kidsTabBar: function (variant) {
      var t = function (icon, label, active, cls) {
        return '<span class="kids-tab-bar__tab' + (active ? " is-active" : "") + (cls ? " " + cls : "") + '" data-tap="surface"' + (active ? ' aria-current="page"' : "") + ">" + I(icon) + "<span>" + label + "</span></span>";
      };
      var tabs = variant === "default"
        ? t("tabk-home", "Plans") + t("tabk-shop", "Home", true, "is-grey") + t("tab-rewards", "Rewards")
        : t("tab-home", "Home", true) + t("tab-shop", "Shop") + t("tab-rewards", "Rewards");
      return '<nav class="kids-tab-bar" aria-label="Main"><div class="kids-tab-bar__pill">' + tabs + "</div></nav>";
    },

    /* Header › Page navigation (30:3315 title=on, navigation=back, level=L2) */
    pageNav: function (o) {
      return '<header class="page-nav"><button type="button" class="page-nav__back" data-tap="icon" data-action="back" aria-label="Back">' + I("brand-back") + "</button>" +
        '<h1 class="page-nav__title">' + esc(o.title) + '</h1><span class="page-nav__spacer"></span></header>';
    },

    /* Sheet header = Page navigation with "Brand - Close 2" (a bitmap in Figma;
       drawn here from the Glyph/close geometry at the same 20px size). */
    sheetNavHeader: function (title) {
      return '<div class="sheet__header sheet__header--nav"><h2 class="sheet__title" id="sheet-title">' + esc(title) + "</h2>" +
        '<button type="button" class="sheet__close--brand" data-tap="icon" data-close aria-label="Close">' +
        S.icon("brand-close") + "</button></div>";
    },

    /* Photo slot. Files live in assets/img/; until a file exists the slot shows
       the placeholder grey (--color-surface-placeholder). */
    photo: function (file, cls, alt) {
      return '<img class="photo ' + (cls || "") + '" src="' + ui.img(file) + '" alt="' + esc(alt || "") + '" draggable="false" onerror="Spark.ui.photoMissing(this)">';
    },
    /* Image URL. The single-file preview bundle supplies Spark.IMG (data URIs). */
    img: function (file) { return (S.IMG && S.IMG[file]) || "assets/img/" + file; },
    /* swap a missing image for a plain grey block with the same geometry */
    photoMissing: function (img) {
      var span = document.createElement("span");
      span.className = img.className + " is-missing";
      span.setAttribute("style", img.getAttribute("style") || "");
      span.setAttribute("aria-hidden", "true");
      img.replaceWith(span);
    },

    /* Plan Select/Plan tabs (50:3704) */
    planTabs: function (selected) {
      var names = ["Safe Start", "Guided Freedom", "Independent Explorer"];
      return '<div class="plan-tabs" role="tablist" data-drag-scroll>' + names.map(function (n) {
        var on = n === selected;
        return '<button type="button" role="tab" aria-selected="' + on + '" class="plan-tabs__tab' + (on ? " is-selected" : "") + '" data-tap="surface" data-plan="' + n + '">' + n + "</button>";
      }).join("") + "</div>";
    },
    planTabsHeader: function (selected) { return '<div class="plan-tabs-header">' + ui.planTabs(selected) + "</div>"; },

    /* Card/Action (19:1488) */
    actionCard: function (o) {
      return '<div class="action-card"><div class="action-card__top">' +
        '<span class="action-card__tile">' + '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" style="color:#20202D">' + S.glyphs.sim + "</svg></span>" +
        '<div><p class="action-card__title">' + esc(o.title) + '</p><p class="action-card__sub">' + esc(o.sub) + "</p></div></div>" +
        ui.button({ label: o.cta, block: true, lexend: true, attrs: o.ctaAttrs }) + "</div>";
    },

    /* Lists */
    menuRow: function (o) {
      return '<button type="button" class="menu-row" data-tap="surface"' + attrs(o.attrs) + '><span class="menu-row__content">' +
        I(o.icon || "list") + '<span class="menu-row__label">' + esc(o.label) + "</span>" + I("chevron-right") +
        '</span><span class="menu-row__divider" aria-hidden="true"></span></button>';
    },
    profileRow: function (o) {
      return '<button type="button" class="profile-row" data-tap="surface"' + attrs(o.attrs) + '><span class="profile-row__text">' +
        '<span class="profile-row__name">' + esc(o.name) + '</span><span class="profile-row__sub">' + esc(o.sub) + "</span></span>" + I("chevron-right") + "</button>";
    },
    summaryRow: function (o) {
      return '<div class="summary-row"><div class="summary-row__content"><span class="summary-row__label">' + esc(o.label) +
        '</span><span class="summary-row__value">' + esc(o.value) + '</span></div><div class="summary-row__divider"></div></div>';
    },
    checkRow: function (text) { return '<p class="check-row">' + I("kids-check") + "<span>" + esc(text) + "</span></p>"; },

    /* Inputs */
    field: function (o) {
      var id = o.id || "f" + Math.random().toString(36).slice(2, 8);
      return '<div class="field"><label class="field__label" for="' + id + '">' + esc(o.label) + '</label>' +
        '<input class="field__input" id="' + id + '" value="' + esc(o.value || "") + '"' + attrs(o.attrs) + "></div>";
    },
    authField: function (o) {
      return '<label class="auth-field' + (o.error ? " is-error" : "") + '"><span class="sr-only">' + esc(o.label || o.placeholder) + "</span>" +
        '<input class="auth-field__input" type="' + (o.type || "text") + '" placeholder="' + esc(o.placeholder || "") + '" value="' + esc(o.value || "") + '"' + attrs(o.attrs) + ">" +
        (o.eye ? '<span class="auth-field__trail">' + I("eye") + "</span>" : "") + "</label>";
    },
    code: function (o) {
      var d = (o.value || "").split("");
      var h = '<div class="code' + (o.error ? " is-error" : "") + '" role="group" aria-label="Verification code">';
      for (var i = 0; i < (o.length || 6); i++) h += '<span class="code__digit">' + esc(d[i] || "") + "</span>";
      return h + "</div>";
    },
    pwRule: function (o) { return '<p class="pw-rule' + (o.met ? " is-met" : "") + '">' + I(o.met ? "rule-met" : "rule-unmet") + "<span>" + esc(o.text) + "</span></p>"; },
    strength: function (o) {
      return '<div class="strength' + (o.strong ? " is-strong" : "") + '"><div class="strength__bars"><span class="strength__bar"></span><span class="strength__bar"></span><span class="strength__bar"></span></div>' +
        (o.strong ? '<span class="strength__label">Strong</span>' : "") + "</div>";
    },
    alert: function (o) {
      return '<div class="alert" role="alert">' + I("alert-icon") + '<p class="alert__msg">' + esc(o.text) + "</p>" +
        '<button type="button" data-tap="icon" aria-label="Dismiss" data-action="dismiss-alert">' + I("alert-close") + "</button></div>";
    },
    checkbox: function (o) {
      return '<button type="button" role="checkbox" aria-checked="' + (!!o.checked) + '" class="checkbox' + (o.checked ? " is-checked" : "") + '" data-tap="text">' +
        '<span class="checkbox__box">' + I("checkbox-tick") + "</span><span>" + esc(o.label) + "</span></button>";
    },
    radioOption: function (o) {
      return '<button type="button" role="radio" aria-checked="' + (!!o.selected) + '" class="radio-option' + (o.selected ? " is-selected" : "") + '" data-tap="text"' + attrs(o.attrs) + ">" +
        '<span class="radio-option__dot"></span><span>' + esc(o.label) + "</span></button>";
    },

    /* Facilitator shortcut: press and hold an element (800ms) to run fn.
       Used on "account" (Create account) and "Identity" (Identity check). */
    onHold: function (el, fn, ms) {
      if (!el) return;
      var timer = null;
      var cancel = function () { clearTimeout(timer); timer = null; };
      el.addEventListener("pointerdown", function (e) { if (e.button) return; cancel(); timer = setTimeout(function () { timer = null; fn(); }, ms || 800); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (t) { el.addEventListener(t, cancel); });
      el.addEventListener("contextmenu", function (e) { e.preventDefault(); });   // no long-press menu on phones
    },

    /* Sticky footer wrapper (handover §4) */
    footer: function (inner) { return '<div class="footer">' + inner + "</div>"; },

    /* Helper: turn an HTML string into a DOM node */
    el: function (html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  };

  S.ui = ui;
})(window.Spark = window.Spark || {});
