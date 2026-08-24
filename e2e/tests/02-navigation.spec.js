const { test, expect } = require('@playwright/test');

test.describe('Main navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const navTargets = [
    { label: 'About', href: '#about' },
    { label: 'Expertise', href: '#expertise' },
    { label: 'Experience', href: '#experience' },
    { label: 'Work', href: '#work' },
    { label: 'Education', href: '#education' },
    { label: 'Contact', href: '#contact' },
  ];

  for (const { label, href } of navTargets) {
    test(`the "${label}" link navigates to the correct section`, async ({ page }) => {
      await page.locator(`.nav-menu a[href="${href}"]`).click();
      await expect(page).toHaveURL(new RegExp(`\\${href}$`));
      await expect(page.locator(href)).toBeInViewport();
    });
  }

  test('the brand link returns to the top of the page', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.locator('.brand').click();
    await expect(page).toHaveURL(/#top$/);
  });

  test('the "Download CV" link has the correct attributes', async ({ page }) => {
    const cvLink = page.locator('.nav-cv');
    await expect(cvLink).toHaveAttribute('href', /Alice_Paggi_CV_2026\.pdf/);
    await expect(cvLink).toHaveAttribute('target', '_blank');
    await expect(cvLink).toHaveAttribute('rel', /noopener/);
  });

  test('the LinkedIn link in the hero is correct', async ({ page }) => {
    const linkedin = page.locator('.hero-actions a.button-secondary');
    await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/alicepaggi/');
    await expect(linkedin).toHaveAttribute('target', '_blank');
  });
});
