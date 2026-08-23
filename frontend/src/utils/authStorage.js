/**
 * Single source of truth for auth persistence.
 *
 * History: the login flow only ever stored the session as a JSON blob under
 * `jobportal_user`, with the JWT nested at `.token`. But six call sites —
 * the navbar's unread-message poll, the candidate/recruiter/admin dashboards
 * and others — read a flat `localStorage.getItem("token")`, which was never
 * written. They all sent `Bearer null` and got 401s, which is why several
 * authenticated features appeared to "not work".
 *
 * Rather than rewrite every consumer, persistence writes BOTH shapes and
 * reading is centralised here. New code should call `getToken()` /
 * `authHeaders()` instead of touching localStorage directly.
 */

export const USER_KEY = "jobportal_user";
export const TOKEN_KEY = "token";

/** Legacy key some older components read. Kept for compatibility. */
const LEGACY_TOKEN_KEY = "authToken";

/** Persist the session, mirroring the JWT to the flat key. */
export function saveSession(userData) {
  if (!userData) return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem(TOKEN_KEY, userData.token);
      localStorage.setItem(LEGACY_TOKEN_KEY, userData.token);
    }
  } catch {
    /* storage can be unavailable (private mode, blocked cookies) */
  }
}

/** Read the JWT, tolerating every shape the app has written historically. */
export function getToken() {
  try {
    const flat = localStorage.getItem(TOKEN_KEY);
    if (flat) return flat;

    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }

    return localStorage.getItem(LEGACY_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/** The stored user object, or null. */
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Authorization header, or an empty object when signed out — so callers can
 * spread it unconditionally without ever emitting `Bearer null`.
 */
export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Clear every auth artefact this app has ever written. */
export function clearSession() {
  [USER_KEY, TOKEN_KEY, LEGACY_TOKEN_KEY, "appliedJobs", "savedJobs"].forEach(
    (k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }
  );
}
