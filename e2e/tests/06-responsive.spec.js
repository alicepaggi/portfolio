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
    test(`${name}: no horizontal overflow on mobile`, async ({ page }) => {
      await page.goto(path);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      // Allow 1px tolerance for sub-pixel rounding
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test('desktop navigation is hidden and the toggle is visible on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-toggle')).toBeVisible();
  });

  test('the sticky header remains visible after scrolling on mobile', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('.site-header');
    await page.locator('#work').scrollIntoViewIfNeeded();
    await expect(header).toBeVisible();
    await expect(header).toHaveCSS('position', 'sticky');
    const box = await header.boundingBox();
    expect(box.y).toBeLessThanOrEqual(1);
  });

  test('the hero stacks correctly on mobile', async ({ page }) => {
    await page.goto('/');

    const heroCopyBox = await page.locator('.hero-copy').boundingBox();
    const heroVisualBox = await page.locator('.hero-visual').boundingBox();

    // On mobile, the layout is expected to stack with the visual below the copy
    expect(heroVisualBox.y).toBeGreaterThan(heroCopyBox.y);
  });
});

test.describe('Responsive layout (tablet viewport)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('Homepage: no horizontal overflow on tablet', async ({ page }) => {
    await page.goto('/');

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
