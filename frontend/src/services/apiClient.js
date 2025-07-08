import axios from "axios";

// Get base URL from environment or default to localhost
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      // This will be handled by the auth store
      console.log("Authentication error - token may be invalid");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
