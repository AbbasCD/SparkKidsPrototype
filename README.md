# Spark Kids — Usability Test Mk. I (web build)

Static HTML/CSS/JS rebuild of the Figma prototype (file key `z9XkGTqMHbxf2lMh5B4xzU`).
No framework, no build step.

## Status
Build steps 1–3 from the handover are done: tokens, fonts, device frame, router,
state, facilitator panel and shared components. Every route exists as a
"Not built yet" placeholder until its screen is built.

Review the components at `#/dev/components`.

## Facilitator panel
- Desktop: the dark "Facilitator" tab on the left edge of the window.
- Phone: press and hold the status bar ("9:41") for about a second.

## Deploy to Netlify
The zip has index.html at its top level (no wrapping folder).
- Easiest: go to https://app.netlify.com/drop and drop the .zip file itself.
- Or unzip it and drop the unzipped folder — the folder that directly contains
  index.html, css/, js/ and assets/.
- Git: publish directory "." with no build command (see netlify.toml).

## Structure
css/tokens.css      design tokens (Figma variables)
css/base.css        reset, type styles, device frame, transitions, tap feedback
css/components.css  shared components
css/dev.css         placeholder screens, gallery, facilitator panel
js/icons.js         SVG icons exported from Figma
js/state.js         loggedIn / journey / phase
js/router.js        hash router + history stack
js/tap.js           pressed-state feedback
js/components/      ui.js (components), sheet.js (bottom sheets)
js/screens/         _routes.js (route list), one file per screen
js/debug.js         facilitator panel
js/app.js           boot + shared interactions

## Images (assets/img/)
| File | Source |
|---|---|
| landing-*.jpg, intro-*.jpg, plan-*.jpg | Supplied photos, already cropped to their Figma slots at 2x |
| whats-new-banner.png | Supplied banner — Kids "What's new" and the parent dashboards' promo |
| qr-code.svg | Generated placeholder QR (points at a dummy spark.example URL) |
| flag-*.svg | National flags drawn as simple circular SVGs (public-domain designs) |
| pay-*.svg | Generic coloured badges with the brand name — not the brands' official logos |

To swap in official logos later, drop files with the same names into assets/img/.
