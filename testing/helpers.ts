import { APIRequestContext, Page } from '@playwright/test';

export const BASE_URL = 'http://127.0.0.1:8000';

// ─── Seed / Reset ────────────────────────────────────────────────────────────

/**
 * Wipes the test database and re-seeds the minimum lookup data.
 * Call this in `test.beforeEach` for tests that need a clean state.
 */
export async function resetDb(request: APIRequestContext) {
  const res = await request.post(`${BASE_URL}/api/test/reset/`);
  if (!res.ok()) {
    throw new Error(`DB reset failed: ${res.status()} ${await res.text()}`);
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export interface UserPayload {
  email: string;
  password: string;
  names: string;
  surnames: string;
  registration_number: number;
  RUT: string;
  diet_type: number;     // FK id of a Diet row
  diet_info?: string;
  blood_type: number;    // 1=A 2=B 3=AB 4=O
  med_allergies: { _id: number }[];
  substance_allergies: { _id: number }[];
  emergency_number: number;
  emergency_contact: string;
  has_previous_experience: boolean;
  role: 'student' | 'teacher' | 'admin' | 'inventory_manager';
}

/**
 * Registers a new user through the API and returns the access token.
 * `diet_type` and allergy `_id`s are set to the seeded rows (Omnívora = 6,
 * Ninguna-sustancias = 1, Ninguna-medicamentos = 5 after a fresh reset).
 */
export async function createUser(
  request: APIRequestContext,
  overrides: Partial<UserPayload> = {}
): Promise<{ access: string; refresh: string }> {
  const defaults: UserPayload = {
    email: 'test@example.com',
    password: 'Password123!',
    names: 'Test',
    surnames: 'User',
    registration_number: 20000001,
    RUT: '19.345.678-9',
    diet_type: 6,          // Omnívora (6th row inserted after reset)
    diet_info: '',
    blood_type: 1,         // A
    med_allergies: [{ _id: 5 }],        // Ninguna-medicamentos
    substance_allergies: [{ _id: 1 }],  // Ninguna-sustancias
    emergency_number: 987654321,
    emergency_contact: 'Emergency Contact',
    has_previous_experience: false,
    role: 'student',
    ...overrides,
  };

  const res = await request.post(`${BASE_URL}/api/signup/`, { data: defaults });
  if (!res.ok()) {
    throw new Error(`Signup failed: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return data.tokens as { access: string; refresh: string };
}

/**
 * Logs in via the API and returns tokens.
 */
export async function loginApi(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<{ access: string; refresh: string }> {
  const res = await request.post(`${BASE_URL}/api/login/`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return data.tokens as { access: string; refresh: string };
}

// ─── Browser helpers ─────────────────────────────────────────────────────────

/**
 * Injects an access + refresh token into the browser's localStorage so the
 * app considers the user already logged in (skips the login UI flow).
 */
export async function injectAuthTokens(
  page: Page,
  tokens: { access: string; refresh: string },
  meta: { names: string; surnames: string; email: string }
) {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(
    ({ tokens, meta }) => {
      // React-Native-Web AsyncStorage uses localStorage internally
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('names', meta.names);
      localStorage.setItem('surnames', meta.surnames);
      localStorage.setItem('email', meta.email);
    },
    { tokens, meta }
  );
}

/**
 * Navigates to a page and waits until network is idle.
 */
export async function goTo(page: Page, path: string) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
}
