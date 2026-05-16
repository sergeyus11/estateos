import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'EstateOS' })).toBeVisible();
  await expect(page.getByTestId('cta-login')).toBeVisible();
});

test('login page accepts email + sends magic-link', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Войти/i })).toBeVisible();

  await page.getByTestId('email-input').fill('test@example.com');
  await page.getByTestId('submit').click();

  await expect(
    page.locator('text=/(Ссылка для входа отправлена|ошибка|error)/i')
  ).toBeVisible({ timeout: 15_000 });
});

test('admin route requires login (redirects to /login)', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

test('agent route requires login (redirects to /login)', async ({ page }) => {
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
