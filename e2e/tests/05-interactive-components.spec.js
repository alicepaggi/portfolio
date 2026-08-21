const { test, expect } = require('@playwright/test');

test.describe('Slider interattivo (AKQA case study — 3 slider)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/work/akqa-ux-qa.html');
  });

  test('ogni slider mostra i dot di navigazione', async ({ page }) => {
    const sliders = page.locator('[data-slider]');
    const count = await sliders.count();
    expect(count).toBe(3); // GORE-TEX, Ferrari, Vodafone

    for (let i = 0; i < count; i++) {
      const dots = sliders.nth(i).locator('.slider-dot');
      await expect(dots).toHaveCount(2); // 2 slide per gallery in questo case study
      await expect(dots.first()).toHaveClass(/active/);
    }
  });

  test('il pulsante "next" avanza allo slide successivo', async ({ page }) => {
    const firstSlider = page.locator('[data-slider]').first();
    const dots = firstSlider.locator('.slider-dot');

    await expect(dots.nth(0)).toHaveClass(/active/);
    await firstSlider.locator('[data-next]').click();
    await expect(dots.nth(1)).toHaveClass(/active/);

    // il track deve traslare per mostrare la seconda slide
    const transform = await firstSlider.locator('.slider-track').evaluate(
      (el) => el.style.transform
    );
    expect(transform).toContain('-100%');
  });

  test('cliccare un dot naviga direttamente a quello slide', async ({ page }) => {
    const firstSlider = page.locator('[data-slider]').first();
    const dots = firstSlider.locator('.slider-dot');

    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveClass(/active/);
    await expect(dots.nth(0)).not.toHaveClass(/active/);
  });

  test('il pulsante "prev" torna indietro correttamente', async ({ page }) => {
    const firstSlider = page.locator('[data-slider]').first();
    const dots = firstSlider.locator('.slider-dot');

    await firstSlider.locator('[data-next]').click();
    await firstSlider.locator('[data-prev]').click();
    await expect(dots.nth(0)).toHaveClass(/active/);
  });

  test('tutte le immagini negli slider hanno alt text e sono caricate', async ({ page }) => {
    const images = page.locator('[data-slider] .slide img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();

      const naturalWidth = await img.evaluate((el) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});

test.describe('Mobile nav toggle (componente interattivo homepage)', () => {
  test('il menu si apre e si chiude correttamente', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const toggle = page.locator('.nav-toggle');
    const menu = page.locator('.nav-menu');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(menu).toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Cliccare un link chiude il menu
    await page.locator('.nav-menu a[href="#about"]').click();
    await expect(menu).not.toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
