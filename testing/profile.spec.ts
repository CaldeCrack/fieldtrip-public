/**
 * profile.spec.ts
 *
 * Tests for the /profile page (authenticated).
 */
import { test, expect } from '@playwright/test';
import { resetDb, createUser, injectAuthTokens, goTo } from './helpers';

const USER = {
  email: 'profile-test@test.com',
  password: 'Password123!',
  names: 'Carlos',
  surnames: 'Ramírez',
};

async function setupAndGoToProfile(request: any, page: any) {
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
  await goTo(page, '/profile');
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Profile page', () => {
  test('displays the user full name', async ({ request, page }) => {
    await setupAndGoToProfile(request, page);
    await expect(
      page.getByText(`${USER.names} ${USER.surnames}`)
    ).toBeVisible({ timeout: 8_000 });
  });

  test('displays the user email', async ({ request, page }) => {
    await setupAndGoToProfile(request, page);
    await expect(page.getByText(USER.email)).toBeVisible({ timeout: 8_000 });
  });

  test('shows the "Editar informacion personal" button', async ({ request, page }) => {
    await setupAndGoToProfile(request, page);
    await expect(
      page.getByRole('button', { name: 'Editar informacion personal' })
    ).toBeVisible({ timeout: 8_000 });
  });

  test('shows the "Ver log de salud" button for students', async ({ request, page }) => {
    await setupAndGoToProfile(request, page);
    // role='student' is the default in createUser
    await expect(
      page.getByRole('button', { name: 'Ver log de salud' })
    ).toBeVisible({ timeout: 8_000 });
  });

  test('navigates to /personal-info when edit button is clicked', async ({
    request,
    page,
  }) => {
    await setupAndGoToProfile(request, page);
    await page.getByRole('button', { name: 'Editar informacion personal' }).click();
    await expect(page).toHaveURL('/personal-info', { timeout: 8_000 });
  });

  test('avatar shows the first letter of the name', async ({ request, page }) => {
    await setupAndGoToProfile(request, page);
    // Avatar.Text renders a text node with the label character
    await expect(page.getByText(USER.names[0].toUpperCase())).toBeVisible({
      timeout: 8_000,
    });
  });
});
