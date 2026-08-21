# Playwright Automation Suite

A lightweight end-to-end test suite built to validate the portfolio's
critical user journeys, case studies and responsive behaviour.

Built with [Playwright](https://playwright.dev/), chosen for its
auto-waiting model, built-in HTML reporting, trace viewer and simple
CI integration — the same approach currently being introduced at Logol.

## Coverage

| # | Suite | What it validates |
|---|-------|--------------------|
| 1 | `01-homepage.spec.js` | Homepage smoke: title, hero, portrait image, all main sections, footer |
| 2 | `02-navigation.spec.js` | Main navigation to About / Expertise / Work / CV, brand link, LinkedIn |
| 3 | `03-case-studies.spec.js` | Opening + essential content of Generali, AKQA and Logol case studies, back-link |
| 4 | `04-external-links.spec.js` | Contact links, external project links (target/rel), optional live-status check |
| 5 | `05-interactive-components.spec.js` | Sliders (next/prev/dots), image loading, mobile nav toggle |
| 6 | `06-responsive.spec.js` | Mobile & tablet layout, no horizontal overflow, hero stacking |

## Project structure

Place this `e2e/` folder at the **root of the portfolio repo**, next to
`index.html`, `css/`, `js/`, `work/`:

```
portfolio/
├── index.html
├── css/
├── js/
├── work/
├── assets/
├── cv/
└── e2e/                  ← this suite
    ├── package.json
    ├── playwright.config.js
    └── tests/
        ├── 01-homepage.spec.js
        ├── 02-navigation.spec.js
        ├── 03-case-studies.spec.js
        ├── 04-external-links.spec.js
        ├── 05-interactive-components.spec.js
        └── 06-responsive.spec.js
```

The config automatically starts a static server on the parent folder
(the repo root) — no manual server setup needed.

## Getting started

```bash
cd e2e
npm install
npx playwright install --with-deps chromium webkit
```

## Running the tests

```bash
npm test                 # run the full suite headless
npm run test:headed      # watch it run in a real browser
npm run test:ui          # interactive UI mode (best for debugging)
npm run report           # open the last HTML report
```

Run a single suite:

```bash
npx playwright test tests/05-interactive-components.spec.js
```

Skip the slower, network-dependent live link check:

```bash
npx playwright test --grep-invert @network
```

## What I'd extend next

1. **7th suite for Logol/ELLE X specifics** — once the UI is finalized,
   add assertions on the actual product screenshots and any
   Logol-specific interactive elements.
2. **Visual regression** — `expect(page).toHaveScreenshot()` on the
   hero and each case-study header, to catch unintended design drift.
3. **Accessibility checks** — integrate `@axe-core/playwright` to run
   automated a11y audits per page (this also matches the "UX &
   Accessibility" expertise already highlighted in the portfolio).
4. **CI on every push** — a GitHub Actions workflow that runs this
   suite on PRs to `main` and publishes the HTML report as an artifact.
5. **Cross-browser matrix** — the config already has a `mobile-safari`
   project ready; extend it to run the full suite on Firefox and
   WebKit, not just Chromium.

## Note

This suite intentionally treats the current portfolio design as
**frozen**. It was built to validate the shipped V1.2 UI, not to drive
further design changes — consistent with the "quality as a continuous
process, not a redesign trigger" principle behind this project.
