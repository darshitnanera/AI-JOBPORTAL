/**
 * Standardized API Response Service
 * Provides consistent handling for API calls, errors, and loading states
 */

import axios from "axios";

// VITE_API_URL / VITE_API_BASE_URL hold the bare backend ORIGIN (no /api
// suffix) because most call sites build their own `${origin}/api/...` paths.
// This client appends /api itself so both conventions agree.
const API_ORIGIN = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE_URL = `${API_ORIGIN}/api`;

/**
 * Create an axios instance with default config
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Add auth token to requests if available
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Handle response errors globally
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      localStorage.removeItem("jobportal_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/**
 * Response wrapper for consistent API responses
 */
export class APIResponse {
  constructor(success = false, data = null, error = null, message = "") {
    this.success = success;
    this.data = data;
    this.error = error;
    this.message = message;
  }

  isSuccess() {
    return this.success === true;
  }

  isError() {
    return this.success === false;
  }
}

/**
 * GET request helper
 */
export const apiGet = async (endpoint, config = {}) => {
  try {
    const response = await apiClient.get(endpoint, config);
    return new APIResponse(
      true,
      response.data.data || response.data,
      null,
      response.data.message || "Success",
    );
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * POST request helper
 */
export const apiPost = async (endpoint, data = {}, config = {}) => {
  try {
    const response = await apiClient.post(endpoint, data, config);
    return new APIResponse(
      true,
      response.data.data || response.data,
      null,
      response.data.message || "Success",
    );
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * PUT request helper
 */
export const apiPut = async (endpoint, data = {}, config = {}) => {
  try {
    const response = await apiClient.put(endpoint, data, config);
    return new APIResponse(
      true,
      response.data.data || response.data,
      null,
      response.data.message || "Success",
    );
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * PATCH request helper
 */
export const apiPatch = async (endpoint, data = {}, config = {}) => {
  try {
    const response = await apiClient.patch(endpoint, data, config);
    return new APIResponse(
      true,
      response.data.data || response.data,
      null,
      response.data.message || "Success",
    );
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * DELETE request helper
 */
export const apiDelete = async (endpoint, config = {}) => {
  try {
    const response = await apiClient.delete(endpoint, config);
    return new APIResponse(
      true,
      response.data.data || response.data,
      null,
      response.data.message || "Success",
    );
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * Error handler
 */
const handleAPIError = (error) => {
  let errorMessage = "An unexpected error occurred";
  let errorDetails = null;

  if (error.response) {
    // Server responded with error status
    errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
    errorDetails = error.response.data;
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = "No response from server. Please check your connection.";
  } else if (error.message) {
    // Error in request setup
    errorMessage = error.message;
  }

  return new APIResponse(false, null, errorDetails || { message: errorMessage }, errorMessage);
};

/**
 * Upload file helper
 */
export const apiUploadFile = async (endpoint, file, fieldName = "file", additionalData = {}) => {
  try {
    const formData = new FormData();
    formData.append(fieldName, file);

    // Add additional form fields if provided
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await apiClient.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return new APIResponse(
      true,
      response.data.data || response.data,
      null,
      response.data.message || "Upload successful",
    );
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * Batch requests helper
 */
export const apiBatch = async (requests) => {
  try {
    const results = await Promise.all(requests);
    return results;
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * Retry helper for failed requests
 */
export const apiRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  return handleAPIError(lastError);
};

export default apiClient;
