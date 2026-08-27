const { test, expect } = require('@playwright/test');

test.describe('Current homepage sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('QA Lab section exposes the suite overview and run control', async ({ page }) => {
    const section = page.locator('#qa-lab');
    await expect(section).toBeVisible();
    await expect(section).toContainText('PLAYWRIGHT E2E AUTOMATION');
    await expect(section.locator('.qa-test-row')).toHaveCount(6);
    await expect(section.locator('.qa-lab-metrics strong').first()).toHaveText('52');
    await expect(section.locator('.qa-lab-footer > span')).toHaveText('FULL REGRESSION SUITE · 52 TESTS');
    await expect(section.locator('.qa-run-button')).toBeVisible();
    await expect(section.locator('.qa-run-button')).toHaveText('RUN QA SUITE');
    await expect(section.locator('.qa-run-button span')).toHaveCount(0);
    await expect(section.locator('.qa-lab-actions')).toContainText('Run the full Playwright regression suite');
    await expect(section.locator('.qa-lab-footer a')).toHaveAttribute('href', /github\.com\/alicepaggi\/portfolio\/tree\/main\/e2e/);
  });

  test('QA Lab accordions open and close with accessible state changes', async ({ page }) => {
    const section = page.locator('#qa-lab');
    const toggles = section.locator('.qa-test-toggle');
    const firstToggle = toggles.first();
    const firstPanel = section.locator('#qa-test-details-0');

    await expect(toggles).toHaveCount(6);
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(firstPanel).toBeHidden();

    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(firstPanel).toBeVisible();
    await expect(firstPanel).toContainText('The homepage loads with the correct title and key content.');

    await firstToggle.press('Enter');
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(firstPanel).toBeHidden();

    await firstToggle.press('Space');
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(firstPanel).toBeVisible();
  });

  test('QA Lab run control provides clear loading feedback after click', async ({ page }) => {
    const section = page.locator('#qa-lab');
    const button = section.locator('.qa-run-button');

    await page.route('**/api/run-tests', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 12345 }) });
    });
    await page.route('**/api/test-status*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'queued', id: 12345, jobs: [] }) });
    });

    await button.click();
    await expect(button).toBeDisabled();
    await expect(button).toContainText('RUNNING…');
    await expect(button.locator('.qa-run-spinner')).toBeVisible();
    await expect(button).toHaveCSS('font-size', '11.52px');
    await expect(section.locator('.qa-lab-actions')).toContainText(/Please wait for the logs and final results/);
    await expect(section.locator('.qa-console-screen')).toContainText(/Starting the real Playwright run|Running the real Playwright E2E suite/);
  });

  test('ownership section contains the three QA principles', async ({ page }) => {
    const section = page.locator('#ownership');
    await expect(section).toBeVisible();
    await expect(section.locator('.ownership-grid article')).toHaveCount(3);
    await expect(section).toContainText('Ownership');
    await expect(section).toContainText('Structure');
    await expect(section).toContainText('Evolution');
  });

  test('experience timeline contains six roles and visible QA focus chips', async ({ page }) => {
    const section = page.locator('#experience');
    await expect(section.locator('.timeline-item')).toHaveCount(6);
    await expect(section.locator('.timeline-role span')).toHaveCount(6);
    await expect(section.locator('.timeline-item').first()).toContainText('Logol AG');
  });

  test('selected work contains three case study cards with valid destinations', async ({ page }) => {
    const cards = page.locator('#work .project-card');
    await expect(cards).toHaveCount(3);
    const expectedDestinations = ['work/generali-qa.html', 'work/akqa-ux-qa.html', 'work/logol-playwright.html'];
    for (const href of expectedDestinations) await expect(page.locator(`#work .project-card[href="${href}"]`)).toHaveCount(1);
  });

  test('personal projects section contains two external project links', async ({ page }) => {
    const section = page.locator('#personal-projects');
    await expect(section).toBeVisible();
    await expect(section.locator('.personal-project-card')).toHaveCount(2);
    const links = section.locator('a[target="_blank"]');
    await expect(links).toHaveCount(2);
    for (let i = 0; i < 2; i++) await expect(links.nth(i)).toHaveAttribute('rel', /noopener/);
  });

  test('education section contains three education cards and the learning strip', async ({ page }) => {
    const section = page.locator('#education');
    await expect(section.locator('.education-card')).toHaveCount(3);
    await expect(section.locator('.learning-strip')).toContainText('CONTINUOUS LEARNING');
  });

  test('QA approach contains five process steps in the expected order', async ({ page }) => {
    const steps = page.locator('#qa-approach .approach-grid > div');
    await expect(steps).toHaveCount(5);
    const expectedSteps = ['Discover', 'Plan', 'Test', 'Automate', 'Improve'];
    for (let i = 0; i < expectedSteps.length; i++) await expect(steps.nth(i)).toContainText(expectedSteps[i]);
  });
});
