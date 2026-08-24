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
      test(`opens from the homepage and shows the essential content`, async ({ page }) => {
        await page.goto('/#work');
        await page.locator(`.project-card[href="${cs.cardHref}"]`).click();

        await expect(page).toHaveURL(new RegExp(cs.cardHref));
        await expect(page.locator('.case-title')).toContainText(cs.titleContains);
        await expect(page.locator('.case-subtitle')).toBeVisible();
        await expect(page.locator('.case-copy').first()).not.toBeEmpty();

        // Verify that all meta information (Role, Platforms, etc.) is present
        for (const label of cs.metaLabels) {
          await expect(page.locator('.case-meta')).toContainText(label);
        }

        // Every case study must have at least one content card
        const cardCount = await page.locator('.case-card').count();
        expect(cardCount).toBeGreaterThan(0);
      });

      test(`the back link returns to the Work section of the homepage`, async ({ page }) => {
        await page.goto(`/${cs.cardHref}`);
        await page.locator('.case-back').click();
        await expect(page).toHaveURL(/index\.html#work$|\/#work$/);
        await expect(page.locator('#work')).toBeInViewport();
      });
    });
  }

  test('the Logol case study explicitly mentions Playwright', async ({ page }) => {
    await page.goto('/work/logol-playwright.html');
    await expect(page.locator('.automation-banner')).toContainText('Playwright');
    await expect(page.locator('.automation-banner img')).toHaveAttribute('alt', 'Playwright');
  });
});
