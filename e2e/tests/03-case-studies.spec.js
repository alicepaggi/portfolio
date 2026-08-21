const { test, expect } = require('@playwright/test');

const caseStudies = [
  {
    name: 'Generali',
    cardHref: 'work/generali-qa.html',
    titleContains: 'Building QA',
    metaLabels: ['Role', 'Platforms', 'Markets', 'Ownership'],
  },
  {
    name: 'AKQA',
    cardHref: 'work/akqa-ux-qa.html',
    titleContains: 'Where QA',
    metaLabels: ['Role', 'Position', 'Focus', 'Ownership'],
  },
  {
    name: 'Logol',
    cardHref: 'work/logol-playwright.html',
    titleContains: "Owning quality",
    metaLabels: ['Role', 'Product', 'Testing', 'Automation'],
  },
];

test.describe('Case studies', () => {
  for (const cs of caseStudies) {
    test.describe(cs.name, () => {
      test(`si apre dalla homepage e mostra i contenuti essenziali`, async ({ page }) => {
        await page.goto('/#work');
        await page.locator(`.project-card[href="${cs.cardHref}"]`).click();

        await expect(page).toHaveURL(new RegExp(cs.cardHref));
        await expect(page.locator('.case-title')).toContainText(cs.titleContains);
        await expect(page.locator('.case-subtitle')).toBeVisible();
        await expect(page.locator('.case-copy').first()).not.toBeEmpty();

        // Verifica che tutte le meta-info (Role, Platforms, ecc.) siano presenti
        for (const label of cs.metaLabels) {
          await expect(page.locator('.case-meta')).toContainText(label);
        }

        // Ogni case study deve avere almeno una case card con contenuto
        const cardCount = await page.locator('.case-card').count();
        expect(cardCount).toBeGreaterThan(0);
      });

      test(`il back-link riporta alla sezione Work della homepage`, async ({ page }) => {
        await page.goto(`/${cs.cardHref}`);
        await page.locator('.case-back').click();
        await expect(page).toHaveURL(/index\.html#work$|\/#work$/);
        await expect(page.locator('#work')).toBeInViewport();
      });
    });
  }

  test('il case study Logol menziona esplicitamente Playwright', async ({ page }) => {
    await page.goto('/work/logol-playwright.html');
    await expect(page.locator('.automation-banner')).toContainText('Playwright');
    await expect(page.locator('.automation-banner img')).toHaveAttribute('alt', 'Playwright');
  });
});
