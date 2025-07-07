/**
 * API Client for Ganpathi Manufacturing Operations
 * Handles all HTTP requests to the backend server
 */

export class ApiClient {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.token = this.getStoredToken();
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  getBaseURL() {
    // Auto-detect backend URL based on environment
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//localhost:5000/api`;
    } else {
      // Production - adjust as needed
      return `/api`;
    }
  }

  getStoredToken() {
    return localStorage.getItem("authToken");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  async init() {
    console.log("🔗 Initializing API Client...");
    console.log(`📍 Backend URL: ${this.baseURL}`);

    // Test connection
    try {
      await this.get("/health");
      console.log("✅ Backend connection successful");
    } catch (error) {
      console.warn("⚠️ Backend connection failed:", error.message);
    }
  }

  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async makeRequest(url, options = {}) {
    const fullURL = `${this.baseURL}${url}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.includeAuth !== false),
        ...options.headers,
      },
    };

    console.log(`🌐 ${config.method || "GET"} ${fullURL}`);

    try {
      const response = await fetch(fullURL, config);

      // Handle different response types
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return { success: true };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${error.message}`);

      // Handle specific error types
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        this.handleUnauthorized();
      }

      throw error;
    }
  }

  async parseErrorResponse(response) {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText || "Unknown error" };
    }
  }

  handleUnauthorized() {
    console.log("🔒 Unauthorized access - clearing token");
    this.setToken(null);
    // Redirect to login if not already there
    if (!window.location.hash.includes("login")) {
      window.location.hash = "#/login";
    }
  }

  // HTTP Methods
  async get(url, options = {}) {
    return this.makeRequest(url, { ...options, method: "GET" });
  }

  async post(url, data = {}, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(url, data = {}, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch(url, data = {}, options = {}) {
    return this.makeRequest(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete(url, options = {}) {
    return this.makeRequest(url, { ...options, method: "DELETE" });
  }

  // File upload with progress
  async uploadFile(url, file, onProgress = null) {
    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve({ success: true });
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("POST", `${this.baseURL}${url}`);

      // Set headers
      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.send(formData);
    });
  }

  // Authentication API
  async login(credentials) {
    const response = await this.post("/auth/login", credentials, {
      includeAuth: false,
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData) {
    return this.post("/auth/register", userData, { includeAuth: false });
  }

  async logout() {
    try {
      await this.post("/auth/logout");
    } catch (error) {
      console.log("Logout error (ignored):", error.message);
    } finally {
      this.setToken(null);
    }
  }

  async refreshToken() {
    const response = await this.post("/auth/refresh");
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.get("/auth/me");
  }

  // Jobs API
  async getJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `/jobs?${queryParams}` : "/jobs";
    return this.get(url);
  }

  async getJob(jobId) {
    return this.get(`/jobs/${jobId}`);
  }

  async createJob(jobData) {
    return this.post("/jobs", jobData);
  }

  async updateJob(jobId, updates) {
    return this.put(`/jobs/${jobId}`, updates);
  }

  async updateJobStatus(jobId, status, sectionData = {}) {
    return this.patch(`/jobs/${jobId}/status`, { status, ...sectionData });
  }

  async deleteJob(jobId) {
    return this.delete(`/jobs/${jobId}`);
  }

  async uploadJobPhoto(jobId, section, file, onProgress) {
    return this.uploadFile(
      `/jobs/${jobId}/photos/${section}`,
      file,
      onProgress
    );
  }

  // Customers API
  async getCustomers() {
    return this.get("/customers");
  }

  async getCustomer(customerId) {
    return this.get(`/customers/${customerId}`);
  }

  async createCustomer(customerData) {
    return this.post("/customers", customerData);
  }

  async updateCustomer(customerId, updates) {
    return this.put(`/customers/${customerId}`, updates);
  }

  async deleteCustomer(customerId) {
    return this.delete(`/customers/${customerId}`);
  }

  // Inventory API
  async getInventoryItems() {
    return this.get("/inventory");
  }

  async getInventoryItem(itemId) {
    return this.get(`/inventory/${itemId}`);
  }

  async createInventoryItem(itemData) {
    return this.post("/inventory", itemData);
  }

  async updateInventoryItem(itemId, updates) {
    return this.put(`/inventory/${itemId}`, updates);
  }

  async updateInventoryQuantity(itemId, quantity, type = "set") {
    return this.patch(`/inventory/${itemId}/quantity`, { quantity, type });
  }

  async deleteInventoryItem(itemId) {
    return this.delete(`/inventory/${itemId}`);
  }

  // Paper Types API
  async getPaperTypes() {
    return this.get("/papertypes");
  }

  async createPaperType(paperTypeData) {
    return this.post("/papertypes", paperTypeData);
  }

  async updatePaperType(id, updates) {
    return this.put(`/papertypes/${id}`, updates);
  }

  async deletePaperType(id) {
    return this.delete(`/papertypes/${id}`);
  }

  // Users API (Admin only)
  async getUsers() {
    return this.get("/users");
  }

  async createUser(userData) {
    return this.post("/users", userData);
  }

  async updateUser(userId, updates) {
    return this.put(`/users/${userId}`, updates);
  }

  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }

  // Dashboard/Reports API
  async getDashboardStats() {
    return this.get("/dashboard/stats");
  }

  async getJobsReport(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `/reports/jobs?${queryParams}` : "/reports/jobs";
    return this.get(url);
  }

  async getInventoryReport() {
    return this.get("/reports/inventory");
  }

  // Health check
  async healthCheck() {
    return this.get("/health", { includeAuth: false });
  }
}
