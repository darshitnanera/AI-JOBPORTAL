# Developer bypass & offline fixtures

Lets the whole app be navigated with no database and no backend.
**Development builds only** — see "Why this cannot ship" below.

## 1. Instant sign-in by URL

```
http://localhost:5173/?dev=candidate
http://localhost:5173/?dev=recruiter
http://localhost:5173/?dev=admin
```

Writes a fully populated persona to `localStorage` and strips `?dev=` from the
URL so it does not survive a reload or get shared. Applied before React mounts,
so `AuthContext` picks it up during its normal hydration.

## 2. Test credentials in the real login form

| Role | Email | Password |
|---|---|---|
| Candidate | `candidate@test.com` | `password123` |
| Recruiter | `recruiter@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |

These are answered client-side, so they work with the backend down. **No login
component was modified** — the request is intercepted at the network layer.

They are deliberately *not* implemented in the backend. The Render deployment
is public; a credential check there would be a permanent remote backdoor with
published passwords, and an `NODE_ENV` guard is one misconfigured variable away
from failing open.

## 3. Offline API fixtures

If an API **GET** fails because the backend is unreachable or returns 5xx, a
fixture is served instead so no screen renders blank. Covered: jobs, job
detail, AI match + recommendations, profile, resume, applications, messages,
recruiter and admin dashboards, integrations.

Rules that keep this honest:

- The real backend is **always tried first**; fixtures are a fallback, never a
  substitute. With the backend up you see real data.
- Only `GET` falls back. A write is never silently faked.
- Only network failures and 5xx. A `401`/`403`/`404` is a real answer and is
  passed through unchanged.
- Every fixture payload carries `__mock: true` and the response carries an
  `X-Dev-Mock: 1` header, so mock data cannot be mistaken for live data in the
  UI or in a network log. Each one logs a `[dev-mode] served fixture` line.

## Why this cannot ship

The only caller is `main.jsx`, behind `if (import.meta.env.DEV)`. Vite replaces
that expression with the literal `false` in a production build, so Rollup drops
the branch and never emits this directory — it is removed, not merely skipped
at runtime.

Verify at any time:

```bash
npm run build
grep -r "dev-mock-token\|password123\|@test.com" dist/   # expect no matches
```

## Removing it

Delete `src/dev/` and the `if (import.meta.env.DEV)` block in `src/main.jsx`.
Nothing else references it.
