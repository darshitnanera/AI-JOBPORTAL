import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
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
