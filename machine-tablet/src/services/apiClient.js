import axios from "axios";

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 15000, // Longer timeout for tablets
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding machine context
apiClient.interceptors.request.use(
  (config) => {
    // Add device info to requests
    config.headers["X-Device-Type"] = "machine_tablet";
    config.headers["X-User-Agent"] = navigator.userAgent;
    config.headers["X-Timestamp"] = new Date().toISOString();

    // Add machine ID if available
    const machineTabletAuth = localStorage.getItem("machine-tablet-auth");
    if (machineTabletAuth) {
      try {
        const authData = JSON.parse(machineTabletAuth);
        if (authData.state?.machineId) {
          config.headers["X-Machine-ID"] = authData.state.machineId;
        }
      } catch (error) {
        console.warn("Failed to parse machine tablet auth data:", error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and offline support
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful responses for offline use
    if (response.config.method === "get") {
      try {
        const cacheKey = `api_cache_${response.config.url}`;
        const cacheData = {
          data: response.data,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000, // 5 minutes TTL
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        // Ignore cache errors
        console.warn("Failed to cache response:", error);
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors with cached data
    if (!navigator.onLine || error.code === "NETWORK_ERROR") {
      console.warn("Network offline, attempting to serve from cache");

      if (originalRequest.method === "get") {
        try {
          const cacheKey = `api_cache_${originalRequest.url}`;
          const cachedResponse = localStorage.getItem(cacheKey);

          if (cachedResponse) {
            const parsed = JSON.parse(cachedResponse);
            const isExpired = Date.now() - parsed.timestamp > parsed.ttl;

            if (!isExpired) {
              console.log("Serving from cache:", originalRequest.url);
              return {
                data: parsed.data,
                status: 200,
                statusText: "OK (Cached)",
                headers: {},
                config: originalRequest,
                fromCache: true,
              };
            }
          }
        } catch (cacheError) {
          console.warn("Cache retrieval failed:", cacheError);
        }
      }

      // Return a more user-friendly offline error
      return Promise.reject({
        ...error,
        message: "Connection lost. Some features may be limited.",
        isOfflineError: true,
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth data and redirect to login
      localStorage.removeItem("machine-tablet-auth");
      delete apiClient.defaults.headers.common["Authorization"];

      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject({
        ...error,
        message: "Session expired. Please log in again.",
      });
    }

    // Handle 403 Forbidden (machine operator access issues)
    if (error.response?.status === 403) {
      return Promise.reject({
        ...error,
        message: "Access denied. Machine operator credentials required.",
      });
    }

    // Handle 500+ server errors
    if (error.response?.status >= 500) {
      return Promise.reject({
        ...error,
        message: "Server error. Please try again or contact support.",
      });
    }

    // Handle timeout errors
    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        ...error,
        message: "Request timeout. Please check your connection and try again.",
      });
    }

    // Default error handling
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject({
      ...error,
      message: errorMessage,
    });
  }
);

// Utility functions for machine-specific API calls

// Get machine-specific job queue
export const getMachineJobs = async (machineId, filters = {}) => {
  const response = await apiClient.get(`/jobs/machine/${machineId}`, {
    params: filters,
  });
  return response.data;
};

// Update job status from machine
export const updateJobStatus = async (jobId, status, notes = "") => {
  const response = await apiClient.patch(`/jobs/${jobId}/status`, {
    status,
    notes,
    timestamp: new Date().toISOString(),
  });
  return response.data;
};

// Upload job photos
export const uploadJobPhotos = async (jobId, photos) => {
  const formData = new FormData();

  photos.forEach((photo, index) => {
    formData.append(`photo_${index}`, photo.file);
    formData.append(
      `photo_${index}_metadata`,
      JSON.stringify({
        caption: photo.caption,
        timestamp: photo.timestamp,
        location: photo.location,
      })
    );
  });

  const response = await apiClient.post(`/jobs/${jobId}/photos`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Get machine status and metrics
export const getMachineStatus = async (machineId) => {
  const response = await apiClient.get(`/machines/${machineId}/status`);
  return response.data;
};

// Report machine issues
export const reportMachineIssue = async (machineId, issue) => {
  const response = await apiClient.post(`/machines/${machineId}/issues`, {
    ...issue,
    timestamp: new Date().toISOString(),
  });
  return response.data;
};

// Check network connectivity
export const checkConnectivity = async () => {
  try {
    const response = await apiClient.get("/health/ping", { timeout: 5000 });
    return { online: true, latency: response.headers["x-response-time"] };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

// Authentication service for machine operators
export const authService = {
  login: async (email, password, machineId) => {
    const response = await apiClient.post('/auth/machine-login', {
      email,
      password,
      machineId
    });
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  }
};

export default apiClient;
