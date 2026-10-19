/* Component gallery (#/dev/components) — review screen for build steps 1–3.
   Everything here is the real shared component, wired with the real tap
   feedback, toggles, sheet and router transitions. Not part of the journey. */
(function (S) {
  var ui = S.ui;

  function section(title, body, pad) {
    return '<section class="gallery__section"><h2 class="gallery__h">' + title + "</h2>" +
      '<div class="gallery__body' + (pad === false ? " gallery__body--flush" : "") + '">' + body + "</div></section>";
  }

  S.router.define("/dev/components", {
    render: function (ctx) {
      var html =
        ui.statusBar() +
        ui.navHeader({ title: "Components" }) +
        '<div class="gallery">' +
        section("Type styles",
          '<p class="t-display">Display 32</p><p class="t-h1">Heading H1 28</p><p class="t-h2">Heading H2 24</p><p class="t-h3">Heading H3 20</p>' +
          '<p class="t-label-lg">Label large 16</p><p class="t-label-md">Label medium 14</p><p class="t-label-sm">Label small 12</p>' +
          '<p class="t-body-lg">Body large 16 — Bw Nista Geometric</p><p class="t-body-md">Body medium 14</p><p class="t-body-sm">Body small 12</p>' +
          '<p class="t-tab">System tab label 11 — Roboto</p>') +
        section("Body face weights — Bw Nista Geometric",
          '<p class="t-body-md">Regular 400 — Your child’s plan, RM18/month</p>' +
          '<p class="t-body-md" style="font-weight:500">Medium 500 — Page navigation titles</p>' +
          '<p class="t-body-md" style="font-weight:600">SemiBold 600 → Medium — form labels, 9:41</p>' +
          '<p class="t-body-md-b">Bold 700 — Summary values, tab labels</p>') +
        section("Display face — Faktum (carousel + Kids hero moments)",
          '<p class="t-carousel">Refresh on the go. Easy lah.</p>' +
          '<p class="t-tagline">Where convenience meets refreshingly simple.</p>' +
          '<p class="t-kids-hero">Safe Start</p>' +
          '<p class="t-kids-title-lg">Independent Explorer</p>' +
          '<p class="t-kids-title">Annice · 16.8GB · Your plan</p>' +
          '<div class="row gap-16" style="margin-top:4px">' + ui.button({ label: "Add booster", size: "small" }).replace('btn btn--primary', 'btn btn--faktum btn--primary') +
          ui.link({ label: "Change plan", iconL: "swap-vertical" }).replace('class="link"', 'class="link link--faktum"') + "</div>") +
        section("Colour tokens",
          '<div class="swatches">' + [
            ["brand-yellow", "#f2ff4d"], ["brand-yellow-soft", "#f7ff95"], ["brand-pink", "#ff79e8"], ["brand-pink-light", "#fea7ef"], ["accent-blue", "#5cb5ff"],
            ["ink-primary", "#20202d"], ["ink-secondary", "#383a53"], ["ink-tertiary", "#5c5e73"], ["surface-card", "#ffffff"], ["surface-muted", "#f2f2ee"],
            ["border-default", "#cbccc7"], ["status-success", "#166534"], ["success-bg", "#bbf7d0"], ["status-danger", "#b91c1c"], ["toggle-on", "#34c759"]
          ].map(function (c) { return '<span class="swatch"><i style="background:' + c[1] + '"></i><b>' + c[0] + "</b><em>" + c[1] + "</em></span>"; }).join("") + "</div>") +
        section("Buttons — press and hold to see the Pressed state",
          '<div class="stack gap-12">' +
          ui.button({ label: "Primary large", block: true }) +
          ui.button({ label: "Secondary large", variant: "secondary", block: true }) +
          ui.button({ label: "Special large", variant: "special", block: true }) +
          '<div class="row gap-8">' + ui.button({ label: "Primary", size: "medium" }) + ui.button({ label: "Secondary", variant: "secondary", size: "medium" }) + "</div>" +
          '<div class="row gap-8">' + ui.button({ label: "Small", size: "small" }) + ui.button({ label: "Small", variant: "secondary", size: "small" }) + ui.button({ label: "Tertiary", variant: "tertiary", size: "small" }) + "</div>" +
          ui.button({ label: "Next (journey button, Lexend label)", block: true, lexend: true }) +
          ui.button({ label: "Next (Auth button)", block: true, auth: true }) +
          ui.button({ label: "Disabled", block: true, disabled: true }) +
          "</div>") +
        section("Links",
          '<div class="row gap-24">' + ui.link({ label: "Link label" }) + ui.link({ label: "Change plan", iconL: "swap-vertical" }) + "</div>" +
          '<div style="margin-top:16px">' + ui.link({ label: "SIM types and compatibility", iconR: "info" }) + "</div>") +
        section("Stepper",
          '<div class="stack gap-24">' + ["sim", "number", "verify", "payment"].map(ui.stepper).join("") + "</div>") +
        section("Option card — tap to select",
          '<div class="stack gap-12" data-radio-group>' +
          ui.optionCard({ title: "eSIM", detail: "Free delivery", selected: true }) +
          ui.optionCard({ title: "Physical SIM", detail: "+ 4RM delivery" }) +
          ui.optionCard({ title: "Bordered option", detail: "Detail", bordered: true }) + "</div>") +
        section("Radio · checkbox · radio option",
          '<div class="row gap-24">' + ui.radio(false) + ui.radio(true) + "</div>" +
          '<div class="stack gap-12" style="margin-top:16px">' + ui.checkbox({ label: "Use this address as my billing address." }) +
          '<div class="row gap-24" data-radio-group>' + ui.radioOption({ label: "Female", selected: true }) + ui.radioOption({ label: "Male" }) + "</div></div>") +
        section("Toggles",
          '<div class="row gap-24">' + ui.toggle({ on: true, label: "On example" }) + ui.toggle({ on: false, label: "Off example" }) + "</div>") +
        section("Chips",
          '<div class="row gap-8" style="flex-wrap:wrap">' + ui.chip({ label: "Top priority", tone: "success" }) + ui.chip({ label: "Top priority", tone: "brand" }) + ui.chip({ label: "Top priority", tone: "neutral" }) + "</div>" +
          '<div class="row gap-8" style="flex-wrap:wrap;margin-top:12px">' + ui.statusChip({ label: "Delivered", tone: "success" }) + ui.statusChip({ label: "Shipped", tone: "neutral" }) + ui.statusChip({ label: "Cancelled", tone: "error" }) + "</div>" +
          '<div class="row gap-8" style="flex-wrap:wrap;margin-top:12px">' + ui.infoChip({ label: "See feature details" }) + ui.infoChip({ label: "Protected by default", kind: "shield" }) + "</div>") +
        section("Note", ui.note({ text: "Never activate an incompatible eSIM as you can’t be refunded after use." })) +
        section("Pager dots", '<div class="stack gap-12">' + ui.pager({ active: 1 }) + ui.pager({ active: 2 }) + ui.pager({ active: 3, thin: true }) + "</div>") +
        section("Inputs",
          '<div class="stack gap-16">' + ui.field({ label: "Full name", value: "Jane Doe" }) +
          ui.authField({ placeholder: "eg. paSsw*rd1", type: "password", eye: true, label: "Password" }) +
          ui.authField({ placeholder: "Email", value: "john@spark.my", error: true, label: "Email" }) +
          ui.code({ value: "12" }) + ui.code({ value: "123456", error: true }) +
          ui.pwRule({ text: "Include at least 8 characters" }) + ui.pwRule({ text: "Include at least 8 characters", met: true }) +
          ui.strength({}) + ui.strength({ strong: true }) +
          ui.alert({ text: "Your account will be locked after 5 incorrect attempts." }) + "</div>") +
        section("Lists", ui.profileRow({ name: "Katie Doe", sub: "Your profile and other details" }) +
          '<div style="margin-top:12px;background:#fff;border-radius:24px">' + ui.menuRow({ label: "Manage your lines" }) + ui.menuRow({ label: "Your activity" }) + "</div>" +
          '<div style="margin-top:12px;background:#fff;border-radius:24px">' + ui.summaryRow({ label: "Plan", value: "Safe Start" }) + ui.summaryRow({ label: "Price", value: "RM18" }) + "</div>" +
          '<div class="stack gap-8" style="margin-top:12px">' + ui.checkRow("Pause internet access anytime") + "</div>") +
        section("Card/Action", ui.actionCard({ title: "Activate new eSIM", sub: "Get your eSIM up and running", cta: "Activate eSIM" })) +
        section("Top bar", ui.topBar({ profileAction: "demo-sheet" }), false) +
        section("Plan tabs header (sticky on Kids plans)", ui.planTabsHeader("Safe Start"), false) +
        section("Tab bar — parent", ui.tabBar(), false) +
        section("Tab bar — Kids (glass)", '<div class="glass-demo">' + ui.kidsTabBar() + "</div>", false) +
        section("Bottom sheet",
          '<div class="stack gap-12">' + ui.button({ label: "Open sample sheet", variant: "secondary", block: true, attrs: { "data-action": "demo-sheet" } }) + "</div>") +
        section("Router transitions",
          '<div class="stack gap-12">' +
          ui.button({ label: "Push a screen", block: true, attrs: { "data-go": "/dev/demo", "data-transition": "push" } }) +
          ui.button({ label: "Dissolve to a screen", variant: "secondary", block: true, attrs: { "data-go": "/dev/demo", "data-transition": "dissolve" } }) + "</div>") +
        "</div>";
      ctx.scroll.innerHTML = html;
      ctx.pinBottom(ui.el(ui.footer(ui.button({ label: "Pinned footer CTA", block: true, lexend: true }))));
    }
  });

  S.router.define("/dev/demo", {
    render: function (ctx) {
      ctx.scroll.innerHTML = ui.statusBar() + ui.navHeader({ title: "Demo screen" }) +
        '<div class="px-24 stack gap-16" style="padding-top:24px">' +
        '<p class="t-h2">Back reverses the motion</p>' +
        '<p class="t-body-md c-secondary">Use the back arrow or your browser’s back button. This screen is ' + (2000) + 'px tall to test per-screen scrolling with a pinned footer.</p>' +
        '<div style="height:1600px;border-radius:24px;background:repeating-linear-gradient(180deg,#fff 0 80px,#f2f2ee 80px 160px)"></div></div>';
      ctx.pinBottom(ui.el(ui.footer(ui.button({ label: "Go back", block: true, lexend: true, attrs: { "data-action": "back" } }))));
    }
  });
})(window.Spark = window.Spark || {});
