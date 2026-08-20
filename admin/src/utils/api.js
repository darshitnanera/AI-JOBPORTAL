import axios from "axios";

// ─── Base URL Resolution ────────────────────────────────────────────────────
const rawBaseUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "https://ai-jobportal-backend.onrender.com";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/**
 * Build an absolute URL for use with fetch() or anchor hrefs.
 * @param {string} path - e.g. "/api/company" or "api/company"
 * @returns {string}
 */
export const apiUrl = (path = "") => {
    if (!path) return API_BASE_URL;
    if (/^https?:\/\//i.test(path)) return path;
    // Ensure path starts with exactly one "/"
    const normalizedPath = "/" + path.replace(/^\/+/, "");
    return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * Centralized Axios instance with credentials and token injection.
 */
const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000,
});

// ─── Request Interceptor ────────────────────────────────────────────────────
API.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                const userJson = localStorage.getItem("jobportal_user");
                const user = userJson ? JSON.parse(userJson) : null;
                if (user?.token) {
                    config.headers = config.headers ?? {};
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            }
        } catch {
            // Silently ignore parse errors
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default API;