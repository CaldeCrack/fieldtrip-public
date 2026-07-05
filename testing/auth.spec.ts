/**
 * auth.spec.ts
 *
 * Tests covering the Login and Signup UI flows.
 * The backend must be running with IS_TESTING=True and pointing at fieldtrip_test.
 */
import { test, expect } from '@playwright/test';
import { resetDb, createUser, injectAuthTokens } from './helpers';

// ─── Shared test data ─────────────────────────────────────────────────────────
const VALID_USER = {
  email: 'student@test.com',
  password: 'Password123!',
  names: 'Juan',
  surnames: 'Pérez',
};

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login page', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('shows the Fieldtrip title', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Fieldtrip')).toBeVisible();
  });

  test('shows the email and password inputs', async ({ page }) => {
    await page.goto('/login');
    // The app renders React Native TextInput – labels become accessible text
    await expect(page.getByLabel('Email *')).toBeVisible();
    await expect(page.getByLabel('Contraseña *')).toBeVisible();
  });

  test('shows an error message when fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    // Snackbar should inform the user that all fields are required
    await expect(page.getByText('Debe completar todos los campos')).toBeVisible();
  });

  test('shows an error message with wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email *').fill('nobody@example.com');
    await page.getByLabel('Contraseña *').fill('WrongPass1!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByText('No se pudo iniciar sesión.')).toBeVisible({ timeout: 8_000 });
  });

  test('redirects to home after a successful login', async ({ request, page }) => {
    // Create the user via API first
    await createUser(request, {
      email: VALID_USER.email,
      password: VALID_USER.password,
      names: VALID_USER.names,
      surnames: VALID_USER.surnames,
    });

    await page.goto('/login');
    await page.getByLabel('Email *').fill(VALID_USER.email);
    await page.getByLabel('Contraseña *').fill(VALID_USER.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    // App should redirect to the home/fieldtrip list page
    await expect(page).toHaveURL('/', { timeout: 10_000 });
  });

  test('navigates to signup page when clicking the register link', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Regístrate aquí' }).click();
    await expect(page).toHaveURL('/signup');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Signup page', () => {
  test('renders the signup form fields for a new user', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByText('Fieldtrip')).toBeVisible();
    await expect(page.getByLabel('Email *')).toBeVisible();
    await expect(page.getByLabel('Contraseña *')).toBeVisible();
    await expect(page.getByLabel('Nombres *')).toBeVisible();
    await expect(page.getByText('Datos personales')).toBeVisible();
  });
});

test.describe('Authenticated user redirect', () => {
  test('already-logged-in user visiting /login is redirected to home', async ({
    request,
    page,
  }) => {
    await resetDb(request);
    const tokens = await createUser(request, {
      email: VALID_USER.email,
      password: VALID_USER.password,
      names: VALID_USER.names,
      surnames: VALID_USER.surnames,
    });

    await injectAuthTokens(page, tokens, {
      names: VALID_USER.names,
      surnames: VALID_USER.surnames,
      email: VALID_USER.email,
    });

    // Now navigate to /login – should redirect away immediately
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page).not.toHaveURL('/login', { timeout: 8_000 });
  });
});
