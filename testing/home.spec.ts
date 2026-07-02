/**
 * home.spec.ts
 *
 * Tests for the authenticated home page (Fieldtrip list).
 */
import { test, expect } from '@playwright/test';
import { resetDb, createUser, injectAuthTokens, goTo } from './helpers';

const USER = {
  email: 'home-test@test.com',
  password: 'Password123!',
  names: 'María',
  surnames: 'González',
};

// Helper: log in and navigate to the home page
async function loginAndGoHome(request: any, page: any) {
  await resetDb(request);
  const tokens = await createUser(request, {
    email: USER.email,
    password: USER.password,
    names: USER.names,
    surnames: USER.surnames,
  });
  await injectAuthTokens(page, tokens, {
    names: USER.names,
    surnames: USER.surnames,
    email: USER.email,
  });
  await goTo(page, '/');
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Home page (unauthenticated)', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    // Clear any tokens from previous tests
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/login', { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Home page (authenticated student)', () => {
  test('shows the empty state message when no fieldtrips exist', async ({
    request,
    page,
  }) => {
    await loginAndGoHome(request, page);
    // A freshly-reset database has no fieldtrips
    await expect(
      page.getByText('No hay salidas a campo para mostrar.')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders the tab bar at the bottom', async ({ request, page }) => {
    await loginAndGoHome(request, page);
    // The tab bar is rendered when showTabs=true.
    // Tabs use accessible roles so we can query by link/tab role.
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible({ timeout: 8_000 });
  });
});
