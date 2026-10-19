/* Route inventory — handover §5. Every route is registered now with a
   placeholder, so the router, deep links and the debug panel work end-to-end.
   Real screens (js/screens/*.js) overwrite their placeholder as they're built. */
(function (S) {
  S.ROUTES = [
    // [path, screen name, Figma node, flow group]
    ["/splash", "Splash", "1:9", "0 · Landing"],
    ["/landing", "Landing carousel", "10:1183", "0 · Landing"],
    ["/intro-plans", "Intro plans", "1:1457", "0 · Landing"],
    ["/kids-plans", "Select plan (Kids – full page)", "1:1238", "1 · Plan Select"],
    ["/signup", "Create account – email", "2:5550", "2 · Account"],
    ["/signup/password", "Create account – set password", "2:5562", "2 · Account"],
    ["/signup/verify", "Verify account", "2:5635", "2 · Account"],
    ["/signin", "Sign in – email", "2:5714", "2 · Account"],
    ["/signin/password", "Sign in – password", "2:5727", "2 · Account"],
    ["/forgot", "Forgot password", "2:5768", "2 · Account"],
    ["/forgot/sent", "Check your inbox", "2:5780", "2 · Account"],
    ["/forgot/error", "Couldn't reset password", "2:5790", "2 · Account"],
    ["/sim", "Choose SIM", "23:1227", "3 · eSIM & Number"],
    ["/number", "Choose your number", "23:1378", "3 · eSIM & Number"],
    ["/ekyc", "eKYC – Identity check", "2:4687", "4 · eKYC"],
    ["/ekyc/id-tip-1", "Photo ID tip 1", "2:4743", "4 · eKYC"],
    ["/ekyc/id-tip-2", "Photo ID tip 2", "2:4761", "4 · eKYC"],
    ["/ekyc/scan-id", "Scan NRIC / Passport", "2:4779", "4 · eKYC"],
    ["/ekyc/confirm", "Confirm your details", "2:4844", "4 · eKYC"],
    ["/ekyc/selfie-tip-1", "Selfie tip 1", "2:4788", "4 · eKYC"],
    ["/ekyc/selfie-tip-2", "Selfie tip 2", "2:4808", "4 · eKYC"],
    ["/ekyc/scan-face", "Scan your face", "2:4828", "4 · eKYC"],
    ["/ekyc/done", "Almost there", "2:4837", "4 · eKYC"],
    ["/payment", "Payment summary", "24:1680", "5 · Payment"],
    ["/payment/method", "Payment method", "23:1786", "5 · Payment"],
    ["/home-empty", "Dashboard – activate eSIM", "24:2822", "6 · Activation"],
    ["/activate/qr", "Another device – email QR", "24:1950", "6 · Activation"],
    ["/activate/sent", "Another device – email sent", "24:1990", "6 · Activation"],
    ["/activate/done", "SIM activated", "24:2028", "6 · Activation"],
    ["/kids-home", "Kids dashboard – Safe Start", "1:3380", "7 · Kids"],
    ["/kids-home-activate", "Kids dashboard – activate SIM", "270:5868", "7 · Kids"],
    ["/kids2-home", "Kids dashboard – 2 kids", "263:7360", "7 · Kids"],
    ["/kids2-activate", "Kids dashboard – 2 kids – activate SIM", "270:5951", "7 · Kids"],
    ["/kids-plan", "My plan – Safe start", "25:7523", "7 · Kids"],
    ["/kids-safety", "Manage safety features", "1:3802", "7 · Kids"],
    ["/kids-activity", "Activity", "1:3968", "7 · Kids"],
    ["/kids-bills", "Previous bills", "1:4009", "7 · Kids"],
    ["/home", "Dashboard – Mobile 40GB", "24:2923", "8 · Existing customer"],
    ["/home-activate", "Dashboard – Mobile + activate eSIM", "95:5290", "8 · Existing customer"],
    ["/home-family", "Dashboard – Kids + Mobile", "24:3096", "8 · Existing customer"],
    ["/lines", "Manage lines", "24:2059", "8 · Existing customer"]
  ];

  /* Figma flow starting points — deep links for testers (§5) */
  S.FLOWS = [
    ["Full journey", "/splash"],
    ["Sign in / Create account", "/signin"],
    ["eKYC", "/ekyc"],
    ["Payment", "/payment"],
    ["Empty dashboard", "/home-empty"],
    ["Kids dashboard", "/kids-home"]
  ];

  var ui = S.ui;
  function placeholder(name, node) {
    return {
      render: function (ctx) {
        ctx.scroll.innerHTML = ui.statusBar() + ui.navHeader({ title: name }) +
          '<div class="placeholder"><p class="t-label-md">Not built yet</p>' +
          '<p class="t-body-md c-secondary">Figma node ' + node + " · route #" + ctx.path + "</p></div>";
      }
    };
  }
  S.ROUTES.forEach(function (r) { S.router.define(r[0], placeholder(r[1], r[2])); });
  S.router.define("*", placeholder("Unknown route", "—"));
})(window.Spark = window.Spark || {});
