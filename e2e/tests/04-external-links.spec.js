const { test, expect } = require('@playwright/test');

test.describe('Contact links (homepage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#contact');
  });

  test('email link è corretto', async ({ page }) => {
    const email = page.locator('.contact-links a[href^="mailto:"]');
    await expect(email).toHaveAttribute('href', 'mailto:paggi.alice96@gmail.com');
  });

  test('link LinkedIn è corretto e si apre in nuova scheda', async ({ page }) => {
    const linkedin = page.locator('.contact-links a[href*="linkedin.com"]');
    await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/alicepaggi/');
    await expect(linkedin).toHaveAttribute('target', '_blank');
    await expect(linkedin).toHaveAttribute('rel', /noopener/);
  });

  test('link GitHub è corretto e si apre in nuova scheda', async ({ page }) => {
    const github = page.locator('.contact-links a[href*="github.com"]');
    await expect(github).toHaveAttribute('href', 'https://github.com/alicepaggi');
    await expect(github).toHaveAttribute('target', '_blank');
  });
});

test.describe('Link esterni nei case study', () => {
  // Only case studies that actually contain external project links.
  const externalLinks = [
    { page: '/work/akqa-ux-qa.html', selector: '.project-link', label: 'AKQA' },
    { page: '/work/logol-playwright.html', selector: '.project-link', label: 'Logol' },
  ];

  for (const { page: path, selector, label } of externalLinks) {
    test(`${label}: i link esterni hanno target/rel corretti`, async ({ page }) => {
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

  test('i link esterni principali rispondono correttamente @network', async ({ page, request }) => {
    await page.goto('/work/akqa-ux-qa.html');
    const hrefs = await page.locator('.project-link').evaluateAll((links) =>
      links.map((l) => l.getAttribute('href'))
    );

    for (const href of hrefs) {
      const response = await request.get(href, { failOnStatusCode: false });
      expect(response.status(), `${href} dovrebbe rispondere < 400`).toBeLessThan(400);
    }
  });
});
