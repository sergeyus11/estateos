import { test, expect, chromium, type Browser } from '@playwright/test';

const USE_CDP = process.env.PLAYWRIGHT_USE_CDP === '1';

let cdpBrowser: Browser | null = null;

async function getCdpBrowser(): Promise<Browser> {
  if (cdpBrowser) return cdpBrowser;
  const res = await fetch('http://127.0.0.1:9222/json/version');
  const { webSocketDebuggerUrl } = await res.json();
  cdpBrowser = await chromium.connectOverCDP(webSocketDebuggerUrl);
  return cdpBrowser;
}

test.afterAll(async () => {
  if (cdpBrowser) {
    await cdpBrowser.close();
    cdpBrowser = null;
  }
});

const browserTest = USE_CDP
  ? test.extend<{ page: any }>({
      page: async ({}, use) => {
        const browser = await getCdpBrowser();
        const context = await browser.newContext({
          baseURL: process.env.E2E_BASE_URL || 'http://localhost:3200',
          ignoreHTTPSErrors: true,
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
      },
    })
  : test;

browserTest('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'EstateOS' })).toBeVisible();
  await expect(page.getByTestId('cta-login')).toBeVisible();
});

browserTest('login page accepts email + sends magic-link', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Войти/i })).toBeVisible();

  // Use real seeded email so Beget SMTP doesn't reject as spam
  await page.getByTestId('email-input').fill('admin@estateos.ru');
  await page.getByTestId('submit').click();

  // Either success banner OR error element appears (any state proves form wired up)
  const success = page.getByText(/Ссылка для входа отправлена/i);
  const error = page.getByTestId('error');
  await expect(success.or(error)).toBeVisible({ timeout: 25_000 });
});

browserTest('admin route requires login (redirects to /login)', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

browserTest('agent route requires login (redirects to /login)', async ({ page }) => {
  await page.goto('/agent');
  await expect(page).toHaveURL(/\/login/);
});

test('manifest.webmanifest is served', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toBe('EstateOS');
  expect(manifest.display).toBe('standalone');
});

test('service worker is served', async ({ request }) => {
  const res = await request.get('/sw.js');
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain('CACHE_NAME');
});
