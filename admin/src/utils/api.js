import axios from "axios";

// Environment variable resolution with fallback to deployed Render backend
const rawBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "https://ai-jobportal-backend.onrender.com";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/**
 * Builds an absolute API URL for fetch or anchor links
 * @param {string} path - The relative endpoint path (e.g. "/api/job")
 * @returns {string} Fully qualified URL
 */
export const apiUrl = (path = "") => {
    if (!path) return API_BASE_URL;
    if (/^https?:\/\//i.test(path)) return path;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Centralized Axios client configured with credentials and auth interceptor
 */
const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Automatically attach Bearer token to all outgoing requests
API.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                const userJson = localStorage.getItem("jobportal_user");
                const user = userJson ? JSON.parse(userJson) : null;
                if (user?.token) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            }
        } catch (err) {
            // Ignore parse errors
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default API;