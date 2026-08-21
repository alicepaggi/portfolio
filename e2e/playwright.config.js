// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Questa cartella "e2e" vive DENTRO al repo del portfolio, allo stesso
 * livello di index.html, css/, js/, work/. Il webServer serve la cartella
 * padre (".."), cioè la root del sito.
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      // Usato dalla suite "responsive" ma disponibile per tutti i test
      // se in futuro vuoi far girare l'intera suite anche su mobile.
      use: { ...devices['iPhone 13'] },
      testMatch: /06-responsive\.spec\.js/,
    },
  ],

  webServer: {
    command: 'npx http-server .. -p 8080 -c-1 --silent',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
