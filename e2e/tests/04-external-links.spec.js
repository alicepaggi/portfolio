const { test, expect } = require('@playwright/test');

test.describe('Contact links (homepage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#contact');
  });

  test('personal email is not published and LinkedIn link is correct', async ({ page }) => {
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    const linkedin = page.locator('.contact-links a[href*="linkedin.com"]');
    await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/alicepaggi/');
  });

  test('contact form is available without exposing a personal email address', async ({ page }) => {
    const form = page.locator('.contact-form');
    await expect(form).toHaveAttribute('method', 'POST');
    await expect(form).toHaveAttribute('action', 'https://portfolio-contact-liart.vercel.app/api/contact');
    await expect(form.locator('input[name="name"]')).toBeVisible();
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('LinkedIn link is correct and opens in a new tab', async ({ page }) => {
    const linkedin = page.locator('.contact-links a[href*="linkedin.com"]');
    await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/alicepaggi/');
    await expect(linkedin).toHaveAttribute('target', '_blank');
    await expect(linkedin).toHaveAttribute('rel', /noopener/);
  });

  test('LinkedIn is the only contact link and is clearly identifiable', async ({ page }) => {
    const links = page.locator('.contact-links a');
    await expect(links).toHaveCount(1);
    const linkedin = links.first();
    await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/alicepaggi/');
    await expect(linkedin).toHaveAttribute('target', '_blank');
    await expect(linkedin).toHaveAttribute('aria-label', 'Connect with Alice Paggi on LinkedIn');
    await expect(linkedin.locator('.contact-linkedin-icon')).toBeVisible();
  });
});

test.describe('External links in case studies', () => {
  // Only case studies that actually contain external project links.
  const externalLinks = [
    { page: '/work/akqa-ux-qa.html', selector: '.project-link', label: 'AKQA' },
    { page: '/work/logol-playwright.html', selector: '.project-link', label: 'Logol' },
  ];

  for (const { page: path, selector, label } of externalLinks) {
    test(`${label}: external links have the correct target/rel attributes`, async ({ page }) => {
      await page.goto(path);
      const links = page.locator(selector);
      const count = await links.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        expect(href).toMatch(/^https:\/\//);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
      }
    });
  }

  test('main external links respond correctly @network', async ({ page, request }) => {
    await page.goto('/work/akqa-ux-qa.html');
    const hrefs = await page.locator('.project-link').evaluateAll((links) =>
      links.map((l) => l.getAttribute('href'))
    );

    for (const href of hrefs) {
      const response = await request.get(href, { failOnStatusCode: false });
      expect(response.status(), `${href} should respond with < 400`).toBeLessThan(400);
    }
  });
});
