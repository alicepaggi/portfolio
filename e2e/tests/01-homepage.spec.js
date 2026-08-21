const { test, expect } = require('@playwright/test');

test.describe('Homepage smoke test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('carica con il titolo corretto', async ({ page }) => {
    await expect(page).toHaveTitle(/Alice Paggi/);
  });

  test('hero mostra nome e headline', async ({ page }) => {
    await expect(page.locator('.hero h1 span').first()).toHaveText('Alice Paggi');
    await expect(page.locator('.hero-statement')).toBeVisible();
    await expect(page.locator('.hero-text')).toContainText('quality assurance');
  });

  test('foto profilo nella hero viene caricata correttamente', async ({ page }) => {
    const portrait = page.locator('.portrait-frame img');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute('alt', /Alice Paggi/);

    // Verifica che l'immagine sia effettivamente caricata (naturalWidth > 0)
    const naturalWidth = await portrait.evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('tutte le sezioni principali sono presenti nel DOM', async ({ page }) => {
    const sectionIds = ['about', 'expertise', 'experience', 'work', 'education', 'contact'];
    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test('quick-intro mostra gli anni di esperienza', async ({ page }) => {
    await expect(page.locator('.quick-number')).toHaveText('9+');
  });

  test('footer e signature sono presenti', async ({ page }) => {
    await expect(page.locator('.site-footer')).toContainText('ALICE PAGGI');
    await expect(page.locator('.signature')).toContainText('Quality is not the last step');
  });
});
