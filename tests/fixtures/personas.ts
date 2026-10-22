/**
 * Test personas (docs/07-conventions.md § Testing), shared by integration and e2e tests.
 * All are created/reset by tests/e2e/global-setup.ts. Tests NEVER use the seeded Super Admin
 * (SEED_SUPERADMIN_*): that's a real account people sign in with.
 */
export const PERSONA_PASSWORD = "E2e-Only-Pa55word-Mcsu-2026!";

export const PERSONAS = {
  /** Super Admin linked to an employee → 2FA required (R15). Its 2FA is reset every run. */
  admin: {
    name: "E2E Admin",
    email: "e2e.admin@questronix.com.ph",
    password: PERSONA_PASSWORD,
    group: "Super Admin",
    employee: { firstName: "E2E", lastName: "Admin" },
  },
  /** Administrator with NO employee data (like a service account) → never asked for 2FA. */
  service: {
    name: "E2E Service Account",
    email: "e2e.service@questronix.com.ph",
    password: PERSONA_PASSWORD,
    group: "Administrator",
    employee: null,
  },
  /** Active user in the Employee group (rank 40, OWN scope, no audit.view). */
  employee: {
    name: "E2E Employee",
    email: "e2e.employee@questronix.com.ph",
    password: PERSONA_PASSWORD,
    group: "Employee",
    employee: null,
  },
} as const;

/** Prefix for users created by registration tests (cleaned up by global setup). */
export const REGISTRATION_PREFIX = "e2e.reg.";
