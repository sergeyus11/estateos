import { test, expect, chromium, type Browser, type Route } from '@playwright/test';

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

function callbackURLFromPostData(postData: string | null): string | undefined {
  if (!postData) return undefined;
  try {
    const body = JSON.parse(postData) as { callbackURL?: string };
    return body.callbackURL;
  } catch {
    return new URLSearchParams(postData).get('callbackURL') || undefined;
  }
}

browserTest('agent login sends magic-link with /agent callbackURL', async ({ page }) => {
  let callbackURL: string | undefined;

  await page.route('**/api/auth/**', async (route: Route) => {
    callbackURL = callbackURLFromPostData(route.request().postData());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.goto('/login?role=agent');
  await expect(page.getByRole('heading', { name: /Войти/i })).toBeVisible();

  // Agent invite links land on /login?role=agent. The magic-link email must
  // embed /agent, otherwise Better-Auth will redirect the agent into /admin.
  await page.getByTestId('email-input').fill('agent@example.com');
  await page.getByTestId('submit').click();

  await expect
    .poll(() => callbackURL, { message: 'magic-link callbackURL' })
    .toBe('/agent');
  await expect(page.getByText(/Ссылка отправлена/i)).toBeVisible();
});

browserTest('plain login sends magic-link with /admin callbackURL', async ({ page }) => {
  let callbackURL: string | undefined;

  await page.route('**/api/auth/**', async (route: Route) => {
    callbackURL = callbackURLFromPostData(route.request().postData());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Войти/i })).toBeVisible();

  await page.getByTestId('email-input').fill('admin@example.com');
  await page.getByTestId('submit').click();

  await expect
    .poll(() => callbackURL, { message: 'magic-link callbackURL' })
    .toBe('/admin');
  await expect(page.getByText(/Ссылка отправлена/i)).toBeVisible();
});
