const { test, expect, devices } = require('@playwright/test');

const pagesToCheck = [
  { path: '/', name: 'Homepage' },
  { path: '/work/generali-qa.html', name: 'Generali case study' },
  { path: '/work/akqa-ux-qa.html', name: 'AKQA case study' },
  { path: '/work/logol-playwright.html', name: 'Logol case study' },
];

test.describe('Responsive layout (mobile viewport)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const { path, name } of pagesToCheck) {
    test(`${name}: nessun overflow orizzontale su mobile`, async ({ page }) => {
      await page.goto(path);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      // Tolleranza di 1px per arrotondamenti sub-pixel
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test('la nav desktop è nascosta e il toggle è visibile su mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-toggle')).toBeVisible();
  });

  test('la hero si impila correttamente su mobile', async ({ page }) => {
    await page.goto('/');
    const heroCopyBox = await page.locator('.hero-copy').boundingBox();
    const heroVisualBox = await page.locator('.hero-visual').boundingBox();

    // Su mobile ci si aspetta un layout impilato: hero-visual sotto hero-copy
    expect(heroVisualBox.y).toBeGreaterThan(heroCopyBox.y);
  });
});

test.describe('Responsive layout (tablet viewport)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('Homepage: nessun overflow orizzontale su tablet', async ({ page }) => {
    await page.goto('/');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
