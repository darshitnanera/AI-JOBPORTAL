/**
 * DEVELOPMENT ONLY — silent auto-login + offline API fallback.
 *
 * ── Why this file can never ship ────────────────────────────────────────────
 * Its only caller is `main.jsx`, behind `if (import.meta.env.DEV)`. Vite
 * substitutes the literal `false` for that expression when building for
 * production, so Rollup drops the branch and this module is never emitted.
 * Verify with:  npm run build && grep -r "dev-mock-token" dist/   (no hits)
 *
 * ── What it does ────────────────────────────────────────────────────────────
 *  1. `?dev=candidate|recruiter|admin` writes a persona to localStorage and
 *     strips the parameter from the URL.
 *  2. The real login form accepts the documented test credentials by
 *     answering POST /api/auth/login locally — no component is modified.
 *  3. API GETs that fail (backend down / no database) fall back to fixtures
 *     so no screen renders blank.
 *
 * Nothing here modifies UI code. All three behaviours are installed by
 * patching `window.fetch` and adding one axios interceptor.
 */
import {
  DEV_CREDENTIALS,
  personaFor,
  personaForCredentials,
} from "./personas.js";
import { resolveMock } from "./mockData.js";

const USER_KEY = "jobportal_user";
const TOKEN_KEY = "token";
const LEGACY_TOKEN_KEY = "authToken";

let installed = false;

/**
 * Endpoints the dev layer must never answer.
 *
 * These return binary or rendered-document responses, not JSON. Substituting
 * a JSON body for them corrupted the result: a JSON blob saved as resume.pdf
 * produced "Failed to load PDF document", and a JSON body written into a
 * preview tab rendered as raw `{"__mock":true,...}` text.
 *
 * Letting the request through means it fails honestly, and the caller falls
 * back to building the document client-side.
 */
const NEVER_MOCK = new Set([
  "/api/resume/generate-pdf",
  "/api/resume/preview",
  "/api/resume/download",
]);

const banner = (msg, ...rest) =>
  console.info(`%c[dev-mode]%c ${msg}`, "color:#4f46e5;font-weight:bold", "", ...rest);

/**
 * True when the active session is a synthetic dev persona.
 *
 * Matters because a `dev-mock-token.*` can NEVER authenticate against a real
 * backend — it is not a signed JWT. So while a dev persona is active, a 401 or
 * 403 is not a meaningful authorization answer, it is the expected outcome of
 * using a fake token, and the request should fall back to a fixture.
 *
 * For a genuine session this returns false, so real 401s still surface as
 * errors rather than being papered over with mock data.
 */
function usingDevToken() {
  try {
    return String(localStorage.getItem(TOKEN_KEY) || "").startsWith("dev-mock-token.");
  } catch {
    return false;
  }
}

/** Should this failed response fall back to a fixture? */
function shouldFallBack(status, unreachable) {
  if (unreachable) return true;
  if (status >= 500) return true;
  // Only while a fake token is in play — see usingDevToken().
  if ((status === 401 || status === 403) && usingDevToken()) return true;
  return false;
}

/**
 * Synthetic acknowledgement for a write made under a mock session.
 *
 * Writes are NOT faked for real sessions — only when `usingDevToken()` is
 * true, which means the backend was unreachable at sign-in and there is no
 * server to persist to anyway. Without this, every button in the app (save
 * profile, mark read, generate PDF) throws while working offline, which
 * defeats the point of being able to walk the UI without a database.
 *
 * The response is explicitly flagged so it is never mistaken for a real one,
 * and it is not persisted — a reload shows the fixture state again.
 */
function syntheticWriteBody(path) {
  return {
    __mock: true,
    __notPersisted: true,
    success: true,
    message: "Accepted locally — offline dev session, nothing was saved.",
    path,
  };
}

/* ------------------------------------------------------------------ session */

function persist(persona) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(persona));
    localStorage.setItem(TOKEN_KEY, persona.token);
    localStorage.setItem(LEGACY_TOKEN_KEY, persona.token);
  } catch {
    /* storage unavailable (private mode) — dev mode simply won't persist */
  }
}

/**
 * Try to exchange a persona for a REAL JWT from the running backend.
 *
 * `scripts/seed-dev.js` seeds these personas as genuine accounts, so when the
 * backend is up the bypass can hold a real token. That matters because a
 * synthetic token can only ever read (via fixtures) — every write, including
 * saving a profile and generating the resume PDF, would 401. With a real
 * token the app behaves normally end to end.
 *
 * Returns the persona with a real token, or null when the backend cannot be
 * reached or does not know the account (fresh clone, no database).
 */
async function tryRealLogin(persona) {
  const origin =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  const cred = DEV_CREDENTIALS.find((c) => c.email === persona.email);
  if (!cred) return null;

  try {
    // Use the untouched fetch: our patch is not installed yet at this point,
    // and we specifically want to reach the network here.
    const res = await fetch(`${String(origin).replace(/\/+$/, "")}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cred.email, password: cred.password }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.token) return null;

    const u = data.user || {};
    return {
      ...persona,
      id: u.id || u._id || persona.id,
      _id: u._id || u.id || persona._id,
      name: u.name || persona.name,
      role: u.role || persona.role,
      userType: u.userType || persona.userType,
      token: data.token,
    };
  } catch {
    return null; // backend down, timed out, or account not seeded
  }
}

/**
 * Applies `?dev=<role>` if present. Runs before React mounts so AuthContext
 * picks the session up during its normal hydration — no context changes.
 */
async function applyDevQueryParam() {
  let url;
  try {
    url = new URL(window.location.href);
  } catch {
    return false;
  }

  const requested = url.searchParams.get("dev");
  if (!requested) return false;

  const persona = personaFor(requested);
  if (!persona) {
    console.warn(
      `[dev-mode] Unknown ?dev=${requested}. Expected: candidate, recruiter, or admin.`
    );
    return false;
  }

  // Prefer a genuine session so writes work; fall back to the mock token.
  const real = await tryRealLogin(persona);
  persist(real || persona);

  // Remove the parameter so it does not survive reloads, get shared, or end
  // up in the history stack.
  url.searchParams.delete("dev");
  const clean = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "") + url.hash;
  window.history.replaceState({}, "", clean);

  banner(
    real
      ? `signed in as ${persona.role} (${persona.email}) — real session, writes enabled`
      : `signed in as ${persona.role} (${persona.email}) — mock session, backend unreachable`
  );
  return true;
}

/* ---------------------------------------------------------------- responses */

/** Synthesise the exact payload the real /api/auth/login returns. */
function loginPayload(persona) {
  const { token, ...user } = persona;
  return {
    success: true,
    message: `Login successful as ${persona.role}`,
    token,
    user,
    __mock: true,
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "X-Dev-Mock": "1" },
  });
}

/** Extract a pathname from any URL-ish value fetch may be given. */
function pathnameOf(input) {
  try {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input?.url ?? input);
    return new URL(raw, window.location.origin).pathname;
  } catch {
    return "";
  }
}

async function bodyOf(input, init) {
  try {
    if (init?.body) {
      return typeof init.body === "string" ? JSON.parse(init.body) : null;
    }
    if (input instanceof Request) {
      return await input.clone().json();
    }
  } catch {
    /* not JSON */
  }
  return null;
}

/* -------------------------------------------------------------- fetch patch */

function patchFetch() {
  const original = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const path = pathnameOf(input);
    const method = (
      init?.method || (input instanceof Request ? input.method : "GET")
    ).toUpperCase();

    // 1. Dev credentials — answer the login request without a backend.
    if (path === "/api/auth/login" && method === "POST") {
      const body = await bodyOf(input, init);
      const persona = personaForCredentials(body?.email, body?.password);
      if (persona) {
        // Let the real backend answer if it can — these personas are seeded,
        // so a genuine token keeps writes working. Only synthesise when the
        // backend is unreachable or does not know the account.
        try {
          const res = await original(input, init);
          if (res.ok) return res;
        } catch {
          /* unreachable — fall through to the local answer */
        }
        banner(`login shortcut accepted for ${persona.email} (mock session)`);
        return jsonResponse(loginPayload(persona));
      }
    }

    // 2. Under a synthetic dev persona, serve fixtures without touching the
    //    network. A `dev-mock-token.*` is not a signed JWT, so any protected
    //    endpoint is guaranteed to answer 401 — and the browser logs every
    //    such response as a console error even when we recover from it.
    //    Short-circuiting keeps the console clean and the app fast. Real
    //    sessions never take this path and always hit the live backend.
    if (usingDevToken() && path.startsWith("/api/") && !NEVER_MOCK.has(path)) {
      if (method === "GET") {
        const mock = resolveMock(path, method);
        if (mock) {
          banner(`served fixture for ${path} (dev persona)`);
          return jsonResponse(mock.body, mock.status);
        }
      } else {
        // Offline write — acknowledge so the UI stays usable.
        banner(`acknowledged ${method} ${path} locally (offline dev session)`);
        return jsonResponse(syntheticWriteBody(path));
      }
    }

    // 3. Normal path — try the real backend first, always.
    try {
      const res = await original(input, init);

      // Fall back for reads the server could not satisfy: it has no data
      // layer (5xx), or it rejected our synthetic dev token (401/403).
      // A 4xx on a real session is a genuine answer and is left alone.
      if (
        method === "GET" &&
        path.startsWith("/api/") &&
        shouldFallBack(res.status, false)
      ) {
        const mock = resolveMock(path, method);
        if (mock) {
          banner(`served fixture for ${path} (backend returned ${res.status})`);
          return jsonResponse(mock.body, mock.status);
        }
      }
      return res;
    } catch (networkError) {
      // 4. Backend unreachable entirely.
      const mock = resolveMock(path, method);
      if (mock) {
        banner(`served fixture for ${path} (backend unreachable)`);
        return jsonResponse(mock.body, mock.status);
      }
      throw networkError;
    }
  };

  window.fetch.__devPatched = true;
}

/* -------------------------------------------------------------- axios patch */

async function patchAxios() {
  const instances = [];

  // The shared instance used by most of the app.
  try {
    const { default: API } = await import("../utils/api.js");
    if (API?.interceptors) instances.push(API);
  } catch {
    /* module unavailable — fall through to the global instance */
  }

  // The GLOBAL axios default instance. Several components (the navbar's
  // unread-message poll, the messages page, the integrations panel) call
  // `axios.get(...)` directly rather than going through the shared instance,
  // and interceptors registered on a created instance do NOT apply to those.
  // Without this, those callers bypassed dev mode entirely and produced a
  // steady stream of 401s under a dev persona.
  try {
    const { default: axios } = await import("axios");
    if (axios?.interceptors && !instances.includes(axios)) instances.push(axios);
  } catch {
    /* axios not resolvable — nothing further to patch */
  }

  instances.forEach(attachInterceptors);
}

function attachInterceptors(API) {
  // Dev credentials, for components that log in through axios.
  API.interceptors.request.use(async (config) => {
    const path = pathnameOf(`${config.baseURL || ""}${config.url || ""}`);
    const method = (config.method || "get").toLowerCase();

    // Short-circuit fixture-backed reads under a dev persona — same reasoning
    // as the fetch path: a synthetic token can only ever produce a 401, and
    // the browser logs each one. Resolve locally instead of dispatching.
    if (usingDevToken() && path.startsWith("/api/") && !NEVER_MOCK.has(path)) {
      const local = (body) => {
        config.adapter = async () => ({
          data: body,
          status: 200,
          statusText: "OK",
          headers: { "x-dev-mock": "1" },
          config,
        });
        return config;
      };

      if (method === "get") {
        const mock = resolveMock(path, "GET");
        if (mock) {
          banner(`served fixture for ${path} (dev persona)`);
          return local(mock.body);
        }
      } else if (path !== "/api/auth/login") {
        banner(
          `acknowledged ${method.toUpperCase()} ${path} locally (offline dev session)`
        );
        return local(syntheticWriteBody(path));
      }
    }

    if (path === "/api/auth/login" && method === "post") {
      const data =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      const persona = personaForCredentials(data?.email, data?.password);
      if (persona) {
        banner(`login shortcut accepted for ${persona.email}`);
        // Short-circuit: resolve without ever reaching the network.
        config.adapter = async () => ({
          data: loginPayload(persona),
          status: 200,
          statusText: "OK",
          headers: { "x-dev-mock": "1" },
          config,
        });
      }
    }
    return config;
  });

  API.interceptors.response.use(
    (r) => r,
    (error) => {
      const cfg = error?.config || {};
      const method = (cfg.method || "get").toUpperCase();
      const status = error?.response?.status;
      const unreachable = !error.response;

      if (method === "GET" && shouldFallBack(status, unreachable)) {
        const path = pathnameOf(`${cfg.baseURL || ""}${cfg.url || ""}`);
        const mock = resolveMock(path, method);
        if (mock) {
          banner(
            `served fixture for ${path} (${unreachable ? "backend unreachable" : `backend returned ${status}`})`
          );
          return Promise.resolve({
            data: mock.body,
            status: mock.status,
            statusText: "OK",
            headers: { "x-dev-mock": "1" },
            config: cfg,
          });
        }
      }
      return Promise.reject(error);
    }
  );
}

/* ------------------------------------------------------------------ install */

export async function installDevMode() {
  if (installed) return;
  installed = true;

  await applyDevQueryParam();
  patchFetch();
  await patchAxios();

  banner(
    "active. ?dev=candidate|recruiter|admin for instant sign-in; " +
      "candidate@test.com / recruiter@test.com / admin@test.com with password123; " +
      "fixtures serve any API read the backend cannot. Development builds only."
  );
}

export default installDevMode;
