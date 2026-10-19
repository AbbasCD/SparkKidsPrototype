/* 7 · Kids — Kids dashboard (1:3380), My plan (25:7523), Manage safety
   features (1:3802), Activity (1:3968), Previous bills (1:4009).
   Sheets: Account (65:5161 → 65:5177) · Add trusted contact (65:4778 → 65:4817).
   Wiring copied from the Figma prototype:
   - Dashboard: profile → Account sheet; "Protected by default" chip → scroll
     to the protection card (600ms ease-in-out); "View full plan" → My plan;
     Manage safety features / View activity → their screens.
   - My plan: Auto-renewal toggle; View all bills → Previous bills; Change plan
     → journey "switchPlan", phase "plan", Kids plans.
   - Safety: Gaming / Streaming toggles with linked ON/OFF labels; Add contact
     → sheet; contact rows tap or drag → swiped (delete revealed), again → back.
   - Account sheet: Manage your lines / Activate a SIM → Manage lines; Your
     activity → Activity; Log out → loggedIn false, journey "new", phase
     "browse", Landing carousel (dissolve, history reset). */
(function (S) {
  var ui = S.ui, I = S.icon, esc = ui.esc;

  /* Every Kids screen shows the child whose card is at the front of the
     dashboard stack (S.model.kid): name, plan, number. The full allowance is left. */
  function kid() { return S.model.kid(); }
  function plan(k) { return S.model.kidPlanInfo(k || kid()); }
  function dataLeft(k) { return plan(k).gb; }   // client decision: the full allowance is left

  /* ---------- shared Kids pieces ---------- */

  /* Kids/Plan header card (small pink hero used on Safety, Activity, Bills) */
  function planHeader() {
    return '<div class="k-hero">' +
      '<div class="k-hero__row"><span class="k-hero__kids">KIDS</span><span class="k-hero__name t-kids-title">' + esc(kid().name) + "</span></div>" +
      '<p class="k-hero__plan t-kids-title-lg">' + plan().name + "</p>" +
      phoneRow() + "</div>";
  }
  // copy icon has no reaction in Figma — press feedback only
  function phoneRow() {
    return '<p class="k-phone"><span>' + esc(S.model.kidNumber(kid())) + '</span><button type="button" class="k-phone__copy" data-tap="icon" aria-label="Copy number">' + I("copy-16") + "</button></p>";
  }
  /* Data gauge: e.g. 12GB of 20GB left */
  function gauge(k) {
    return '<div class="k-gauge" role="img" aria-label="Data left: ' + dataLeft(k) + "GB of " + plan(k).gb + 'GB">' +
      '<img class="k-gauge__ring" src="' + ui.img("kids-gauge-full.svg") + '" alt="" draggable="false">' +
      '<span class="k-gauge__icon">' + I("kb-phone-card") + "</span>" +
      '<span class="k-gauge__label">Data left</span>' +
      '<span class="k-gauge__value"><span class="t-kids-title">' + dataLeft(k) + "</span>GB</span>" +
      '<span class="k-gauge__total">/ ' + plan(k).gb + "GB</span></div>";
  }
  /* "menu item": white card, title + subtitle + trailing icon */
  function menuItem(o) {
    return '<button type="button" class="k-menu' + (o.bordered ? " k-menu--bordered" : "") + '" data-tap="surface"' +
      (o.go ? ' data-go="' + o.go + '"' : "") + (o.attr ? " " + o.attr : "") + ">" +
      '<span class="k-menu__text"><span class="k-menu__title">' + o.title + '</span><span class="k-menu__sub">' + o.sub + "</span></span>" +
      I(o.icon || "chevron-right", o.icon === "kids-check" ? "is-green" : "") + "</button>";
  }
  /* Kids/Protection card */
  function protection(id) {
    var rows = [["Pause internet access anytime"], ["Safe Search on by default"], ["Manage safety features", true], ["Adjust access and categories"], ["Extra controls for higher-risk apps"]];
    return '<section class="k-protect"' + (id ? ' id="' + id + '"' : "") + ' aria-label="Protected by default">' +
      '<div class="k-protect__top">' + I("brand-shield", "k-protect__shield") + ui.statusChip({ label: "Protected by default", tone: "success" }) + "</div>" +
      '<div class="k-protect__rows">' + rows.map(function (r) {
        return '<p class="k-protect__row' + (r[1] ? " is-ink" : "") + '">' + I("kids-check") + "<span>" + r[0] + "</span></p>";
      }).join("") + "</div>" +
      '<p class="k-protect__note">Adult content and unsafe websites are always blocked.</p></section>';
  }
  /* Section title with a 32px brand icon (Gaming, Streaming, All bills…) */
  function sectionTitle(icon, text, extra, display) {
    return '<div class="k-section"><span class="k-section__lead">' + I(icon) + '<h2 class="k-section__title' + (display ? " t-kids-title" : "") + '">' + text + "</h2></span>" + (extra || "") + "</div>";
  }
  /* Linked ON/OFF labels (handover §8.5): a toggle updates [data-status] in its card */
  function wireLinkedToggles(root) {
    root.addEventListener("toggle", function (e) {
      var holder = e.target.closest("[data-linked]");
      if (!holder) return;
      var s = holder.querySelector("[data-status]");
      s.textContent = e.detail.on ? "ON" : "OFF";
      s.classList.toggle("is-on", e.detail.on);
      s.classList.toggle("is-off", !e.detail.on);
    });
  }
  function status(on) { return '<span class="k-status ' + (on ? "is-on" : "is-off") + '" data-status>' + (on ? "ON" : "OFF") + "</span>"; }

  /* Smooth in-screen scroll, 600ms ease-in-out (Figma SCROLL_TO) */
  function scrollToEl(scroller, el, offset) {
    var top = 0, n = el; while (n && n !== scroller) { top += n.offsetTop; n = n.offsetParent; }
    var target = Math.max(0, Math.min(top - (offset || 0), scroller.scrollHeight - scroller.clientHeight));
    var from = scroller.scrollTop, d = target - from, t0 = performance.now();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { scroller.scrollTop = target; return; }
    (function step(now) {
      var t = Math.min(1, (now - t0) / 600), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      scroller.scrollTop = from + d * e; if (t < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Account sheet (65:5177) — shared with the parent dashboards ---------- */
  S.openAccount = function () {
    var row = function (icon, label, go) {
      return '<button type="button" class="menu-row" data-tap="surface"' + (go ? ' data-account-go="' + go + '"' : "") + '><span class="menu-row__content">' +
        I(icon) + '<span class="menu-row__label">' + label + "</span>" + I("chevron-right") + '</span><span class="menu-row__divider" aria-hidden="true"></span></button>';
    };
    var rec = S.sheet.open({
      title: "Account", className: "sheet--account", rootClass: "sheet-root--account",
      content: '<div class="account">' +
        ui.profileRow({ name: "Katie Doe", sub: "Your profile and other details" }) +
        '<div class="account__group">' + row("list", "Manage your lines", "/lines") + row("signpost", "Your activity", "/kids-activity") +
          row("card", "Payment details") + row("tag", "Track your orders") + row("sim", "Activate a SIM", "/lines") + "</div>" +
        '<div class="account__group">' + row("settings", "Settings") + row("help-circle", "Help and support") + "</div>" +
        '<div class="account__logout">' + ui.link({ label: "Log out", iconL: "logout", attrs: { "data-logout": "" } }) + "</div>" +
      "</div>"
    });
    rec.body.addEventListener("click", function (e) {
      var go = e.target.closest("[data-account-go]");
      if (go) { S.router.go(go.dataset.accountGo); return; }   // router closes the sheet
      if (e.target.closest("[data-logout]")) {
        S.state.set({ loggedIn: false, journey: "new", phase: "browse" });
        S.router.go("/landing", { transition: "dissolve", reset: true });
      }
    });
  };

  /* ---------------- Kids dashboards ----------------
     1:3380   Kids dashboard               /kids-home
     270:5868 … + Activate SIM widget      /kids-home-activate   (Pay, new customer)
     263:7360 Kids dashboard – 2 kids      /kids2-home           (SIM activated, kidsAddLine)
     270:5951 … 2 kids + Activate SIM      /kids2-activate       (Pay, kidsAddLine)
     The widget also shows whenever a bought SIM is still waiting; the 2-kids
     stack shows whenever there are two children. */
  function dashCard(k) {
    return '<section class="kd-card" aria-label="' + esc(k.name) + "’s " + plan(k).name + ' plan">' +
      '<div class="kd-card__head"><div class="k-hero__row"><span class="k-hero__kids">KIDS</span><span class="k-hero__name t-kids-title">' + esc(k.name) + "</span></div>" +
        '<p class="kd-card__plan t-kids-title-lg">' + plan(k).name + '</p><hr class="kd-card__line"></div>' +
      gauge(k) +
      '<div class="kd-card__chip">' + ui.infoChip({ kind: "shield", label: "Protected by default", attrs: { "data-scroll-protect": "" } }) + "</div>" +
      '<hr class="kd-card__line"><button type="button" class="kd-card__more" data-tap="surface" data-go="/kids-plan"><span>View full plan</span>' + I("brand-chevron-r") + "</button>" +
      "</section>";
  }
  /* Card/Plan tab — the next child's card peeking out behind the front card */
  function backTab(k) {
    return '<button type="button" class="plan-tab kstack__tab" data-tap="surface" data-shuffle aria-label="Show ' + esc(k.name) + '’s plan">' +
      '<span class="plan-tab__type">KIDS</span><span class="plan-tab__name t-kids-title">' + esc(k.name) + "</span></button>";
  }
  function stackHTML() {
    var list = S.model.childList(), front = list[S.model.frontIndex()];
    return list.length > 1 ? backTab(list[S.model.nextIndex()]) + dashCard(front) : dashCard(front);
  }

  /* Card shuffle (client request): the back card grows into a full card, the
     front card lifts up and dissolves, the new card slides into the front, then
     the old front card's tab tucks in behind it. */
  var EASE = "cubic-bezier(0.42, 0, 0.58, 1)";
  function shuffle(stack, done) {
    if (stack.dataset.busy) return;
    var list = S.model.childList(), nextI = S.model.nextIndex(), nextKid = list[nextI];
    var front = stack.querySelector(".kd-card"), tab = stack.querySelector(".kstack__tab");
    var commit = function () {
      S.model.bringToFront(nextI);
      stack.innerHTML = stackHTML();
      delete stack.dataset.busy;
      var t = stack.querySelector(".kstack__tab");
      if (t && t.animate && !reduced()) t.animate([{ transform: "translateY(48px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 260, easing: EASE });
      if (done) done();
    };
    if (reduced() || !front.animate) { commit(); return; }
    stack.dataset.busy = "1";
    var H = front.offsetHeight, TAB = tab.offsetHeight;
    var ghost = ui.el(dashCard(nextKid));
    ghost.classList.add("kstack__ghost");
    stack.appendChild(ghost);
    // 1 · the back card expands into a full card (behind the front card)
    var grow = ghost.animate([
      { clipPath: "inset(0 0 " + (H - TAB) + "px 0 round 24px)", opacity: 0 },
      { clipPath: "inset(0 0 " + (H - TAB) + "px 0 round 24px)", opacity: 1, offset: 0.35 },
      { clipPath: "inset(0 0 0 0 round 24px)", opacity: 1 }], { duration: 260, easing: EASE, fill: "forwards" });
    grow.onfinish = function () {
      grow.cancel(); ghost.style.opacity = "1";
      // 2 · the front card lifts and dissolves (fully gone by halfway)
      if (tab) tab.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
      var lift = front.animate([
        { transform: "none", opacity: 1 },
        { transform: "translateY(-20px)", opacity: 0, offset: 0.55 },
        { transform: "translateY(-36px)", opacity: 0 }], { duration: 240, easing: EASE, fill: "forwards" });
      lift.onfinish = function () {
        // 3 · the new card slides down into the front position
        var move = ghost.animate([{ transform: "none" }, { transform: "translateY(" + TAB / 2 + "px)" }], { duration: 260, easing: EASE, fill: "forwards" });
        // 4 · swap in the real stack; the old front card's tab tucks in behind
        move.onfinish = commit;
      };
    };
  }
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function kidsDashboard(variant) {
    return {
      render: function (ctx) {
        if (variant.two) S.model.ensureChildren(2);
        var activate = variant.activate || S.model.hasInactive();
        ctx.scroll.innerHTML =
          '<div class="kd">' +
            '<div class="kd__top">' +
              '<button type="button" class="kd__icon" data-tap="icon" data-account aria-label="Account">' + I("kb-profile") + "</button>" +
              '<span class="kd__actions"><button type="button" class="kd__icon" data-tap="icon" aria-label="Notifications">' + I("kb-notification") + "</button>" +
              '<button type="button" class="kd__icon" data-tap="icon" aria-label="Help">' + I("kb-help") + "</button></span></div>" +
            '<div class="kd__content">' +
              (activate ? '<div class="kd__activate">' + ui.actionCard({ title: "Activate new eSIM", sub: "Get your eSIM up and running", cta: "Activate eSIM", ctaAttrs: { "data-go": "/activate/qr" } }) + "</div>" : "") +
              '<div class="kstack" data-stack>' + stackHTML() + "</div>" +
              '<div class="k-menus">' +
                menuItem({ title: "Manage safety features", sub: "Adjust access and categories", go: "/kids-safety" }) +
                menuItem({ title: "View activity", sub: "Check history and changes", go: "/kids-activity" }) +
              "</div>" +
              protection("kids-protection") +
            "</div>" +
            // Kids/What's new card — banner, pagination and button have no destination
            '<section class="kd-new" aria-label="What’s new">' +
              '<div class="kd-new__title">' + I("kb-gift") + '<h2 class="kd-new__heading">What’s new</h2>' +
                '<span class="kd-new__dots" aria-hidden="true"><i class="is-active"></i><i></i><i></i></span></div>' +
              '<div class="kd-new__banner" data-tap="surface">' + ui.photo("whats-new-banner.png", "kd-new__img", "Welcome to Malaysia’s first eSIM only mobile subscription") + "</div>" +
              '<p class="kd-new__body">Change the way you connect - quietly, instantly, your way.</p>' +
              ui.button({ label: "View all promotions", variant: "secondary", size: "small", block: true }) +
            "</section>" +
          "</div>";
        ctx.pinBottom(ui.el(ui.kidsTabBar()), { transparent: true });
        var stack = ctx.el.querySelector("[data-stack]");
        ctx.el.addEventListener("click", function (e) {
          if (e.target.closest("[data-account]")) { S.openAccount(); return; }
          if (e.target.closest("[data-shuffle]")) { shuffle(stack); return; }
          if (e.target.closest("[data-scroll-protect]")) scrollToEl(ctx.scroll, ctx.scroll.querySelector("#kids-protection"), 24);
        });
      },
      // coming back (e.g. from My plan): show the current front child
      onShow: function (ctx) { var st = ctx.el.querySelector("[data-stack]"); if (st && !st.dataset.busy) st.innerHTML = stackHTML(); }
    };
  }
  S.router.define("/kids-home", kidsDashboard({}));
  S.router.define("/kids-home-activate", kidsDashboard({ activate: true }));
  S.router.define("/kids2-home", kidsDashboard({ two: true }));
  S.router.define("/kids2-activate", kidsDashboard({ two: true, activate: true }));

  /* ---------------- My plan (25:7523) ---------------- */
  S.router.define("/kids-plan", {
    render: function (ctx) {
      ctx.scroll.innerHTML =
        '<div class="kp2">' +
          '<div class="kp2__pink">' + ui.statusBar({ kids: true }) + ui.pageNav({ title: "Your plan" }) +
            '<div class="kp2__hero">' +
              '<div class="k-hero__row"><span class="k-hero__kids">KIDS</span><span class="k-hero__name t-kids-title">' + esc(kid().name) + "</span></div>" +
              '<p class="k-hero__plan t-kids-title-lg">' + plan().name + "</p>" + phoneRow() + gauge() +
              // chip has no reaction on this screen — press feedback only
              ui.infoChip({ kind: "shield", label: "Protected by default" }) +
            "</div></div>" +
          '<div class="kp2__panel">' +
            '<section class="k-pay" data-linked>' +
              '<div class="k-pay__head"><div class="k-pay__row"><span class="k-pay__amount">' + plan().price + '</span>' + ui.statusChip({ label: "Paid", tone: "success" }) + "</div>" +
                '<div class="k-pay__row k-pay__due"><span>Payment due</span><span>24 August</span></div></div>' +
              '<div class="k-pay__row"><span class="k-pay__renew">Auto-renewal ' + status(false) + "</span>" + ui.toggle({ on: false, label: "Auto-renewal" }) + "</div>" +
              ui.button({ label: "View all bills", variant: "secondary", size: "small", block: true, attrs: { "data-go": "/kids-bills" } }) +
            "</section>" +
            '<section class="k-yourplan">' +
              sectionTitle("kb-sim-card", "Your plan", '<span class="k-yourplan__reset">Resets in <b>5 days</b></span>', true) +
              '<div class="k-data">' + I("kb-sim-card-28") +
                '<div class="k-data__body"><p class="k-data__title">Data</p>' +
                  '<div class="k-data__track" role="progressbar" aria-valuemin="0" aria-valuemax="' + plan().gb + '" aria-valuenow="' + dataLeft() + '" aria-label="Data left"><span></span></div>' +
                  '<p class="k-data__left"><b>' + dataLeft() + "GB</b> of " + plan().gb + 'GB left</p></div></div>' +
            "</section>" +
            '<div class="k-menus">' +
              menuItem({ title: "Manage safety features", sub: "Adjust access and categories", go: "/kids-safety" }) +
              menuItem({ title: "View activity", sub: "Check history and changes", go: "/kids-activity" }) +
              menuItem({ title: "Change plan", sub: "See other plans available", attr: "data-change-plan" }) +
            "</div>" +
            protection() +
          "</div>" +
        "</div>";
      wireLinkedToggles(ctx.el);
      ctx.el.addEventListener("click", function (e) {
        if (!e.target.closest("[data-change-plan]")) return;
        S.state.set({ journey: "switchPlan", phase: "plan" });
        S.router.go("/kids-plans");
      });
    }
  });

  /* ---------------- Manage safety features (1:3802) ---------------- */
  /* Safety settings and contacts are remembered (S.model.kids) and every change
     is written to the activity log that the Activity screen shows (client request). */
  function contactRow(name, number) {
    return '<div class="k-contact">' +
      '<button type="button" class="k-contact__delete" data-tap="icon" data-delete aria-label="Delete ' + esc(name) + '" tabindex="-1">' + I("trash-white") + "</button>" +
      '<button type="button" class="k-contact__row" data-tap="surface" data-contact aria-expanded="false">' +
        '<span class="k-contact__number">' + esc(number || PHONE) + '</span><span class="k-contact__name">' + esc(name) + "</span></button></div>";
  }
  function switchCard(icon, title, on, desc) {
    return '<section class="k-switch" data-linked data-setting="' + title.toLowerCase() + '">' + sectionTitle(icon, title) +
      '<div class="k-switch__card"><p class="k-switch__text">' + status(on) + "<span>" + desc + "</span></p>" + ui.toggle({ on: on, label: title }) + "</div></section>";
  }
  function openAddContact(list) {
    var rec = S.sheet.open({
      className: "sheet--contact", rootClass: "sheet-root--contact",
      header: '<div class="sheet__header sheet__header--contact"><h2 class="sheet__title" id="sheet-title">Add trusted contact</h2>' +
        '<button type="button" class="sheet__close--brand" data-tap="icon" data-close aria-label="Close">' + I("brand-close") + "</button></div>",
      content:
        '<label class="k-field"><span class="k-field__label">Contact number</span><input class="k-field__input" type="tel" inputmode="tel" placeholder="eg. +60-3-1234-5678" data-num></label>' +
        '<label class="k-field"><span class="k-field__label">Name (optional)</span><input class="k-field__input" type="text" placeholder="eg. Mum" data-name></label>' +
        ui.button({ label: "Add", block: true, attrs: { "data-add": "" } })
    });
    // Client request: Add is unavailable until a contact number is typed
    var addBtn = rec.body.querySelector("[data-add]"), numIn = rec.body.querySelector("[data-num]");
    addBtn.disabled = true;
    numIn.addEventListener("input", function () { addBtn.disabled = !numIn.value.trim(); });
    rec.body.addEventListener("click", function (e) {
      if (!e.target.closest("[data-add]")) return;
      // Figma: Add just closes the sheet. A typed number is added to the list so testers see a result.
      var num = rec.body.querySelector("[data-num]").value.trim(), name = rec.body.querySelector("[data-name]").value.trim();
      if (num) {
        list.insertAdjacentHTML("afterbegin", contactRow(name || "Trusted contact", num));
        S.model.setKids({ contacts: [{ name: name || "Trusted contact", number: num }].concat(S.model.kids().contacts) });
        S.model.log("Trusted contact added", "‘" + (name || num) + "’ was added to the trusted contact list.");
      }
      rec.close();
    });
  }
  S.router.define("/kids-safety", {
    render: function (ctx) {
      var k = S.model.kids();
      // Compare plans: Independent Explorer has no trusted contacts (client request)
      var hasContacts = !noContacts();
      ctx.scroll.innerHTML = ui.statusBar({ kids: true }) + ui.pageNav({ title: "Manage safety features" }) +
        '<div class="ks">' + planHeader() +
          '<div class="ks__body">' +
            '<div class="ks__switches"><p class="ks__intro">Toggle your settings to adjust your child’s protection while exploring.</p>' +
              '<div class="ks__list">' +
                switchCard("kb-gaming", "Gaming", k.gaming, "Gaming and entertainment apps.") +
                switchCard("kb-streaming", "Streaming", k.streaming, "Video content, including YouTube and Netflix.") +
              "</div></div>" +
            (hasContacts ? '<section class="k-contacts">' + sectionTitle("kb-phone-call", "Trusted contacts") +
              '<button type="button" class="k-contacts__add" data-tap="text" data-add-contact>' + I("add-24") + "<span>Add contact</span></button>" +
              '<div class="k-contacts__list" data-list>' + k.contacts.map(function (c) { return contactRow(c.name, c.number); }).join("") + "</div>" +
            "</section>" : "") +
          "</div></div>";
      wireLinkedToggles(ctx.el);
      var list = ctx.el.querySelector("[data-list]");
      // Gaming / Streaming: remember and log ("Gaming was switched off.")
      ctx.el.addEventListener("toggle", function (e) {
        var card = e.target.closest("[data-setting]"); if (!card) return;
        var key = card.dataset.setting, patch = {}; patch[key] = e.detail.on;
        S.model.setKids(patch);
        S.model.log("Plan management", key.charAt(0).toUpperCase() + key.slice(1) + " was switched " + (e.detail.on ? "on." : "off."));
      });
      ctx.el.addEventListener("click", function (e) {
        if (e.target.closest("[data-add-contact]")) { openAddContact(list); return; }
        var del = e.target.closest("[data-delete]");
        if (del) { removeContact(list, del.closest(".k-contact")); return; }
        var row = e.target.closest("[data-contact]");
        if (row && !row.dataset.dragged) toggleSwipe(row.parentNode);
        if (row) delete row.dataset.dragged;
      });
      // Drag a row left/right to reveal or hide delete (Figma ON_DRAG)
      if (list) list.addEventListener("pointerdown", function (e) {
        var row = e.target.closest("[data-contact]"); if (!row || e.button) return;
        var x0 = e.clientX, y0 = e.clientY, done = false;
        function move(ev) {
          if (done) return;
          var dx = ev.clientX - x0;
          if (Math.abs(ev.clientY - y0) > 10) { done = true; return; }
          if (Math.abs(dx) > 24) {
            done = true; row.dataset.dragged = "1";
            toggleSwipe(row.parentNode, dx < 0);
          }
        }
        function up() { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); }
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
      });
    }
  });
  /* Red trash: the card collapses away, the list is saved and the removal is logged */
  function removeContact(list, item) {
    if (!item || item.classList.contains("is-removing")) return;
    var idx = Array.prototype.indexOf.call(list.children, item);
    var contacts = S.model.kids().contacts, c = contacts[idx];
    contacts.splice(idx, 1);
    S.model.setKids({ contacts: contacts });
    if (c) S.model.log("Trusted contact removed", "‘" + (c.name || c.number) + "’ was removed from the trusted contact list.");
    item.classList.add("is-removing");
    setTimeout(function () { item.remove(); }, 260);
  }
  function toggleSwipe(item, force) {
    var on = force === undefined ? !item.classList.contains("is-swiped") : force;
    item.classList.toggle("is-swiped", on);
    item.querySelector("[data-contact]").setAttribute("aria-expanded", String(on));
    item.querySelector(".k-contact__delete").tabIndex = on ? 0 : -1;
  }

  /* ---------------- Activity (1:3968) ---------------- */
  var ACTIVITY = [
    ["Today", [["Plan management", "Gaming was switched off.", "20:45"], ["Plan management", "Gaming was switched on.", "18:00"], ["Plan management", "Streaming was switched on.", "15:45"]]],
    ["Yesterday", [["Trusted contact added", "‘Mum’ was added to the trusted contact list.", "23:45"]]],
    ["Mon 13 Jul", [["Trusted contact removed", "‘Mum’ was removed from the trusted contact list.", "23:45"]]]
  ];
  /* Independent Explorer has no trusted contacts (Compare plans ✕) */
  function noContacts() { return plan().name === "Independent Explorer"; }
  /* Logged changes (newest first) sit on top of Figma's "Today" entries */
  function activityGroups() {
    var logged = S.model.activity().map(function (a) { return [a.title, a.desc, a.time]; });
    if (!S.model.hasSampleActivity()) return logged.length ? [["Today", logged]] : [];   // a newly added child starts with no history
    var groups = ACTIVITY.map(function (g, i) { return i === 0 ? [g[0], logged.concat(g[1])] : g; });
    // Independent Explorer: Figma's sample trusted-contact entries are left out
    if (noContacts()) groups = groups.map(function (g) { return [g[0], g[1].filter(function (r) { return r[0].indexOf("Trusted contact") !== 0; })]; })
      .filter(function (g) { return g[1].length; });
    return groups;
  }
  S.router.define("/kids-activity", {
    render: function (ctx) {
      ctx.scroll.innerHTML = ui.statusBar({ kids: true }) + ui.pageNav({ title: "Activity" }) +
        '<div class="ka">' + planHeader() +
          activityGroups().map(function (g) {
            return '<h2 class="ka__day">' + g[0] + '</h2><div class="ka__list">' + g[1].map(function (r) {
              return '<div class="ka__item"><div class="ka__text"><p class="ka__title">' + r[0] + '</p><p class="ka__desc">' + r[1] + '</p></div><span class="ka__time">' + r[2] + "</span></div>";
            }).join("") + "</div>";
          }).join("") +
          // no design for an empty list: a plain line in the day-heading style
          (activityGroups().length ? "" : '<p class="ka__empty">No activity yet. Changes to ' + esc(kid().name) + "’s safety settings will show here.</p>") +
        "</div>";
    }
  });

  /* ---------------- Previous bills (1:4009) ---------------- */
  S.router.define("/kids-bills", {
    render: function (ctx) {
      var bills = [["July", "24th June – 24th July", "mail"], ["June", "24th May – 24th June", "kids-check"], ["May", "24th April – 24th May", "mail"], ["April", "24th March – 24th April", "mail"]];
      ctx.scroll.innerHTML = ui.statusBar({ kids: true }) + ui.pageNav({ title: "Previous bills" }) +
        '<div class="kb">' +
          '<div class="kb__copy"><p class="kb__lead">Bill summaries will be sent by email.</p><p>This bill includes any boosters you’ve added.</p></div>' +
          '<div class="kb__body">' + planHeader() +
            '<section class="kb__list">' + sectionTitle("kb-globe", "All bills", '<span class="status-chip status-chip--success kb__chip">Up to date</span>') +
              '<div class="k-menus">' + bills.map(function (b) {
                // bill rows have no destination — press feedback only
                return menuItem({ title: b[0], sub: b[1], icon: b[2], bordered: true });
              }).join("") + "</div></section>" +
          "</div></div>";
    }
  });
})(window.Spark = window.Spark || {});
