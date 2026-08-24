const { test, expect } = require('@playwright/test');

test.describe('Interactive slider (AKQA case study — 3 sliders)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/work/akqa-ux-qa.html');
  });

  test('each slider shows navigation dots', async ({ page }) => {
    const sliders = page.locator('[data-slider]');
    const count = await sliders.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const dots = sliders.nth(i).locator('.slider-dot');
      await expect(dots).toHaveCount(2);
      await expect(dots.first()).toHaveClass(/active/);
    }
  });

  test('the "next" button advances to the next slide', async ({ page }) => {
    const firstSlider = page.locator('[data-slider]').first();
    const dots = firstSlider.locator('.slider-dot');

    await expect(dots.nth(0)).toHaveClass(/active/);
    await firstSlider.locator('[data-next]').click();
    await expect(dots.nth(1)).toHaveClass(/active/);

    const transform = await firstSlider.locator('.slider-track').evaluate(
      (el) => el.style.transform
    );
    expect(transform).toContain('-100%');
  });

  test('clicking a dot navigates directly to that slide', async ({ page }) => {
    const firstSlider = page.locator('[data-slider]').first();
    const dots = firstSlider.locator('.slider-dot');

    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveClass(/active/);
    await expect(dots.nth(0)).not.toHaveClass(/active/);
  });

  test('the "prev" button correctly goes back', async ({ page }) => {
    const firstSlider = page.locator('[data-slider]').first();
    const dots = firstSlider.locator('.slider-dot');

    await firstSlider.locator('[data-next]').click();
    await firstSlider.locator('[data-prev]').click();
    await expect(dots.nth(0)).toHaveClass(/active/);
  });

  test('slider images have alt text and are loaded', async ({ page }) => {
    const sliders = page.locator('[data-slider]');
    const sliderCount = await sliders.count();
    expect(sliderCount).toBe(3);

    for (let i = 0; i < sliderCount; i++) {
      const images = sliders.nth(i).locator('.slide img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);

      for (let j = 0; j < count; j++) {
        const img = images.nth(j);
        await expect(img).toHaveAttribute('alt', /.+/);

        // Lazy-loaded slides are checked by bringing each one into view first.
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
      }
    }
  });
});

test.describe('Mobile navigation toggle (interactive homepage component)', () => {
  test('the menu opens and closes correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const toggle = page.locator('.nav-toggle');
    const menu = page.locator('.nav-menu');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(menu).toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.locator('.nav-menu a[href="#about"]').click();
    await expect(menu).not.toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
