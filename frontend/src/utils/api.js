import axios from "axios";

export const API_BASE_URL =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export const apiUrl = (path) => {
    if (/^https?:\/\//i.test(path)) return path;
    if (!API_BASE_URL) return path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const API = axios.create({
    baseURL: API_BASE_URL,
});

// attach token automatically
API.interceptors.request.use((req) => {
    const userJson = localStorage.getItem("jobportal_user");
    try {
        const user = userJson ? JSON.parse(userJson) : null;
        if (user?.token) {
            req.headers = req.headers || {};
            req.headers.Authorization = `Bearer ${user.token}`;
        }
    } catch (err) {
        // ignore JSON parse errors
    }
    return req;
});

export default API;
