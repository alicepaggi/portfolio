# Playwright Automation Suite

A lightweight end-to-end test suite built to validate the portfolio's critical user journeys, case studies, interactive elements and responsive behaviour.

Built with Playwright for its auto-waiting model, built-in HTML reporting, trace viewer and straightforward CI integration.

## Coverage

| # | Suite | What it validates |
|---|-------|-------------------|
| 1 | `01-homepage.spec.js` | Homepage smoke: title, hero, portrait image, main sections, experience indicator, footer |
| 2 | `02-navigation.spec.js` | Main navigation, section destinations, brand link, CV and LinkedIn links |
| 3 | `03-case-studies.spec.js` | Opening and essential content of Generali, AKQA and Logol case studies, back link and Playwright content |
| 4 | `04-external-links.spec.js` | Contact links and external project links, including target and security attributes |
| 5 | `05-interactive-components.spec.js` | Sliders, navigation dots, image loading and the mobile navigation toggle |
| 6 | `06-responsive.spec.js` | Mobile and tablet layout, horizontal overflow checks and hero stacking |
| 7 | `07-current-sections.spec.js` | QA Lab, QA ownership, experience, selected work, personal projects, education and QA approach |

## Project structure

Place this `e2e/` folder at the root of the portfolio repository, next to `index.html`, `css/`, `js/`, `work/` and `assets/`.

```text
portfolio/
├── index.html
├── css/
├── js/
├── work/
├── assets/
├── cv/
└── e2e/
    ├── package.json
    ├── playwright.config.js
    └── tests/
        ├── 01-homepage.spec.js
        ├── 02-navigation.spec.js
        ├── 03-case-studies.spec.js
        ├── 04-external-links.spec.js
        ├── 05-interactive-components.spec.js
        ├── 06-responsive.spec.js
        └── 07-current-sections.spec.js
```

The configuration automatically starts a static server from the repository root, so no manual server setup is required.

## Getting started

```bash
cd e2e
npm install
npx playwright install --with-deps chromium webkit
```

## Running the tests

```bash
npm test                 # run the full suite headless
npm run test:headed      # run the suite in a visible browser
npm run test:ui          # use Playwright's interactive UI mode
npm run report           # open the latest HTML report
```

Run a single suite:

```bash
npx playwright test tests/07-current-sections.spec.js
```

Skip the slower network-dependent live link check:

```bash
npx playwright test --grep-invert @network
```

## Maintenance

When the portfolio changes, update or add assertions for the affected user-facing behaviour and keep test descriptions, comments and documentation in English. Avoid stale selectors, obsolete coverage counts and implementation-specific notes that do not help maintain the suite.
