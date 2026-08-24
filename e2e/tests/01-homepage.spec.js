const { test, expect } = require('@playwright/test');

test.describe('Homepage smoke test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Alice Paggi/);
  });

  test('hero shows the name and headline', async ({ page }) => {
    await expect(page.locator('.hero h1 span').first()).toHaveText('Alice Paggi');
    await expect(page.locator('.hero-statement')).toBeVisible();
    await expect(page.locator('.hero-text')).toContainText('quality assurance');
  });

  test('profile photo in the hero loads correctly', async ({ page }) => {
    const portrait = page.locator('.portrait-frame img');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute('alt', /Alice Paggi/);

    // Verify that the image is actually loaded (naturalWidth > 0)
    const naturalWidth = await portrait.evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('all main sections are present in the DOM', async ({ page }) => {
    const sectionIds = ['about', 'expertise', 'experience', 'work', 'education', 'contact'];
    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test('quick intro shows the years of experience', async ({ page }) => {
    await expect(page.locator('.quick-number')).toHaveText('9+');
  });

  test('footer and signature are present', async ({ page }) => {
    await expect(page.locator('.site-footer')).toContainText('ALICE PAGGI');
    await expect(page.locator('.signature')).toContainText('Quality is not the last step');
  });
});
