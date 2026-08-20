import axios from "axios";

// ─── Base URL Resolution ────────────────────────────────────────────────────
// Priority: VITE_API_BASE_URL env var → VITE_API_URL → hardcoded Render URL
// The hardcoded fallback guarantees the app works even if the Vercel env var
// is not set yet, so requests never resolve relative to the Vercel domain.
const rawBaseUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "https://ai-jobportal-backend.onrender.com";

// Strip trailing slashes so baseURL is always clean
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/**
 * Build an absolute URL for use with fetch() or anchor hrefs.
 * Always returns a full https://... URL — never a relative path.
 *
 * @param {string} path - API path, e.g. "/api/job" or "api/job"
 * @returns {string}
 */
export const apiUrl = (path = "") => {
    if (!path) return API_BASE_URL;
    // Already absolute — return as-is
    if (/^https?:\/\//i.test(path)) return path;
    // Ensure path starts with exactly one "/"
    const normalizedPath = "/" + path.replace(/^\/+/, "");
    return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * Centralized Axios instance.
 *
 * baseURL is always the full Render URL so that relative path strings like
 * "/api/auth/login" resolve to "https://ai-jobportal-backend.onrender.com/api/auth/login"
 * and never relative to the Vercel domain.
 */
const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    // Timeout to avoid hanging requests on Render cold starts
    timeout: 30000,
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Automatically attach Bearer token from localStorage to every request.
API.interceptors.request.use(
    (config) => {
        try {
            const userJson = localStorage.getItem("jobportal_user");
            const user = userJson ? JSON.parse(userJson) : null;
            const token = user?.token || localStorage.getItem("token");

            if (token) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch {
            // Silently ignore JSON parse errors
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default API;
