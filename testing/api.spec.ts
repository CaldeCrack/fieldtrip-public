/**
 * api.spec.ts
 *
 * Pure API-level tests using Playwright's `request` fixture.
 * These run without a browser – they are fast and are ideal for
 * verifying backend contracts that the UI depends on.
 */
import { test, expect } from '@playwright/test';
import { resetDb, createUser, loginApi, BASE_URL } from './helpers';

// ─── DB reset endpoint ────────────────────────────────────────────────────────
test.describe('POST /api/test/reset/', () => {
  test('returns 200 and status=reset', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/test/reset/`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'reset' });
  });
});

// ─── Auth: signup ─────────────────────────────────────────────────────────────
test.describe('POST /api/signup/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('creates a new student and returns tokens', async ({ request }) => {
    const tokens = await createUser(request);
    expect(tokens).toHaveProperty('access');
    expect(tokens).toHaveProperty('refresh');
    expect(typeof tokens.access).toBe('string');
    expect(tokens.access.length).toBeGreaterThan(0);
  });

  test('rejects duplicate email', async ({ request }) => {
    await createUser(request, { email: 'dup@test.com' });

    const res = await request.post(`${BASE_URL}/api/signup/`, {
      data: {
        email: 'dup@test.com',
        password: 'Password123!',
        names: 'Another',
        surnames: 'User',
        registration_number: 20000002,
        RUT: '12.345.678-9',
        diet_type: 6,
        blood_type: 1,
        med_allergies: [{ _id: 5 }],
        substance_allergies: [{ _id: 1 }],
        emergency_number: 912345678,
        emergency_contact: 'Contact',
        has_previous_experience: false,
        role: 'student',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects a malformed RUT', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/signup/`, {
      data: {
        email: 'badrut@test.com',
        password: 'Password123!',
        names: 'Bad',
        surnames: 'RUT',
        registration_number: 20000003,
        RUT: 'NOTARUT',         // invalid format
        diet_type: 6,
        blood_type: 1,
        med_allergies: [{ _id: 5 }],
        substance_allergies: [{ _id: 1 }],
        emergency_number: 912345678,
        emergency_contact: 'Contact',
        has_previous_experience: false,
        role: 'student',
      },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Auth: login ──────────────────────────────────────────────────────────────
test.describe('POST /api/login/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('returns tokens for valid credentials', async ({ request }) => {
    await createUser(request, {
      email: 'login-ok@test.com',
      password: 'Password123!',
    });
    const tokens = await loginApi(request, 'login-ok@test.com', 'Password123!');
    expect(tokens.access).toBeTruthy();
    expect(tokens.refresh).toBeTruthy();
  });

  test('returns 400 for wrong password', async ({ request }) => {
    await createUser(request, {
      email: 'login-bad@test.com',
      password: 'Password123!',
    });
    const res = await request.post(`${BASE_URL}/api/login/`, {
      data: { email: 'login-bad@test.com', password: 'WrongPassword!' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for non-existent email', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/login/`, {
      data: { email: 'ghost@test.com', password: 'Password123!' },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Auth: logout ─────────────────────────────────────────────────────────────
test.describe('POST /api/logout/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('blacklists the refresh token', async ({ request }) => {
    await createUser(request, {
      email: 'logout@test.com',
      password: 'Password123!',
    });
    const tokens = await loginApi(request, 'logout@test.com', 'Password123!');

    const res = await request.post(`${BASE_URL}/api/logout/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
      data: { refresh: tokens.refresh },
    });
    expect(res.status()).toBe(200);
  });
});

// ─── User lookup data ─────────────────────────────────────────────────────────
test.describe('GET /api/user/diet/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('returns the seeded diet list (8 entries)', async ({ request }) => {
    await createUser(request, { email: 'diet-check@test.com' });
    const tokens = await loginApi(request, 'diet-check@test.com', 'Password123!');

    const res = await request.get(`${BASE_URL}/api/user/diet/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(8);
  });
});

test.describe('GET /api/user/substance-allergy/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('returns the seeded substance allergy list', async ({ request }) => {
    await createUser(request, { email: 'allergy-check@test.com' });
    const tokens = await loginApi(request, 'allergy-check@test.com', 'Password123!');

    const res = await request.get(`${BASE_URL}/api/user/substance-allergy/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
  });
});

// ─── User profile endpoints ────────────────────────────────────────────────
test.describe('GET /api/personal-info/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('returns the authenticated user personal-info payload', async ({ request }) => {
    await createUser(request, { email: 'profile-api@test.com' });
    const tokens = await loginApi(request, 'profile-api@test.com', 'Password123!');

    const res = await request.get(`${BASE_URL}/api/personal-info/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('emergency_contact');
    expect(data).toHaveProperty('emergency_number');
    expect(data).toHaveProperty('diet_type');
  });
});

test.describe('PATCH /api/personal-info/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('updates the authenticated user personal info', async ({ request }) => {
    await createUser(request, { email: 'profile-update@test.com' });
    const tokens = await loginApi(request, 'profile-update@test.com', 'Password123!');

    const res = await request.patch(`${BASE_URL}/api/personal-info/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
      data: {
        emergency_contact: 'Nuevo contacto',
        emergency_number: 987654321,
        diet_type: 6,
        diet_info: 'Sin detalles',
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.emergency_contact).toBe('Nuevo contacto');
    expect(data.emergency_number).toBe(987654321);
    expect(data.diet_type).toBe(6);
  });
});

test.describe('GET /api/user/med-allergy/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('returns the seeded medication allergy list', async ({ request }) => {
    await createUser(request, { email: 'med-allergy-check@test.com' });
    const tokens = await loginApi(request, 'med-allergy-check@test.com', 'Password123!');

    const res = await request.get(`${BASE_URL}/api/user/med-allergy/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});

// ─── Fieldtrip attendee registration ───────────────────────────────────────
test.describe('POST /api/fieldtrip-attendee/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('registers a student for a fieldtrip with a valid invitation code', async ({ request }) => {
    const teacher = await createUser(request, {
      email: 'attendee-teacher@test.com',
      role: 'teacher',
    });
    const student = await createUser(request, {
      email: 'attendee-student@test.com',
      role: 'student',
    });

    const fieldtripRes = await request.post(`${BASE_URL}/api/fieldtrip/`, {
      headers: { Authorization: `Bearer ${teacher.access}` },
      data: {
        name: 'Salida para asistentes',
        start_date: '2026-08-01',
        end_date: '2026-08-03',
        teacher_id: 1,
        course_id: 1,
        sector: 'Norte',
        equipment: [],
        active: true,
      },
    });

    expect(fieldtripRes.status()).toBe(201);
    const fieldtrip = await fieldtripRes.json();

    const res = await request.post(`${BASE_URL}/api/fieldtrip-attendee/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: {
        user: 2,
        invitation_code: fieldtrip.invitation_code,
      },
    });

    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
  });

  test('rejects duplicate registration for the same fieldtrip', async ({ request }) => {
    const teacher = await createUser(request, {
      email: 'attendee-dup-teacher@test.com',
      role: 'teacher',
    });
    const student = await createUser(request, {
      email: 'attendee-dup-student@test.com',
      role: 'student',
    });

    const fieldtripRes = await request.post(`${BASE_URL}/api/fieldtrip/`, {
      headers: { Authorization: `Bearer ${teacher.access}` },
      data: {
        name: 'Salida duplicada',
        start_date: '2026-08-02',
        end_date: '2026-08-04',
        teacher_id: 1,
        course_id: 1,
        sector: 'Sur',
        equipment: [],
        active: true,
      },
    });
    const fieldtrip = await fieldtripRes.json();

    await request.post(`${BASE_URL}/api/fieldtrip-attendee/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: {
        user: 2,
        invitation_code: fieldtrip.invitation_code,
      },
    });

    const res = await request.post(`${BASE_URL}/api/fieldtrip-attendee/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: {
        user: 2,
        invitation_code: fieldtrip.invitation_code,
      },
    });

    expect(res.status()).toBe(409);
  });

  test('rejects registration without an invitation code', async ({ request }) => {
    const student = await createUser(request, {
      email: 'attendee-no-code@test.com',
      role: 'student',
    });

    const res = await request.post(`${BASE_URL}/api/fieldtrip-attendee/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: {
        user: 2,
      },
    });

    expect(res.status()).toBe(400);
  });
});

// ─── Fieldtrip signup ──────────────────────────────────────────────────────
test.describe('POST /api/fieldtrip/signup/', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('rejects a fieldtrip signup without required identifiers', async ({ request }) => {
    const student = await createUser(request, { email: 'fieldtrip-signup-invalid@test.com' });

    const res = await request.post(`${BASE_URL}/api/fieldtrip/signup/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: {
        checklist_status: [],
        health_general: [],
        health_specific: [],
      },
    });

    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 404 when the user id does not exist', async ({ request }) => {
    const student = await createUser(request, { email: 'fieldtrip-signup-user-missing@test.com' });

    const res = await request.post(`${BASE_URL}/api/fieldtrip/signup/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: {
        user: 999999,
        fieldtrip: 1,
        checklist_status: [],
        health_general: [],
        health_specific: [],
      },
    });

    expect(res.status()).toBe(404);
  });

  test('returns 404 when the fieldtrip id does not exist', async ({ request }) => {
    const student = await createUser(request, { email: 'fieldtrip-signup-fieldtrip-missing@test.com' });

    const res = await request.post(`${BASE_URL}/api/fieldtrip/signup/`, {
      headers: { Authorization: `Bearer ${student.access}` },
      data: {
        user: 1,
        fieldtrip: 999999,
        checklist_status: [],
        health_general: [],
        health_specific: [],
      },
    });

    expect(res.status()).toBe(404);
  });
});
