/**
 * Authentication Manager for Ganpathi Manufacturing Operations
 * Handles user authentication, authorization, and session management
 */

export class AuthManager {
  constructor(apiClient, stateManager) {
    this.apiClient = apiClient;
    this.state = stateManager;
    this.currentUser = null;
    this.authToken = null;
    this.refreshTokenTimeout = null;
    this.sessionCheckInterval = null;
  }

  // Check if user is authenticated
  async checkAuthStatus() {
    console.log("🔐 Checking authentication status...");

    const token = this.getStoredToken();
    if (!token) {
      console.log("🔐 No stored token found");
      return false;
    }

    try {
      // Validate token with server
      const user = await this.apiClient.getCurrentUser();
      if (user) {
        this.setCurrentUser(user, token);
        this.startSessionCheck();
        console.log("✅ User authenticated:", user.email);
        return true;
      }
    } catch (error) {
      console.log("❌ Token validation failed:", error.message);
      this.clearAuth();
    }

    return false;
  }

  // Login with credentials
  async login(credentials) {
    try {
      console.log("🔐 Attempting login for:", credentials.email);

      const response = await this.apiClient.login(credentials);

      if (response.success && response.user && response.token) {
        this.setCurrentUser(response.user, response.token);
        this.startSessionCheck();

        console.log("✅ Login successful:", response.user.email);
        return {
          success: true,
          user: response.user,
          message: "Login successful",
        };
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("❌ Login failed:", error.message);
      this.clearAuth();

      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  }

  // Register new user
  async register(userData) {
    try {
      console.log("🔐 Attempting registration for:", userData.email);

      const response = await this.apiClient.register(userData);

      if (response.success) {
        console.log("✅ Registration successful:", userData.email);
        return {
          success: true,
          message: response.message || "Registration successful",
        };
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("❌ Registration failed:", error.message);

      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  }

  // Logout user
  async logout() {
    console.log("🔐 Logging out...");

    try {
      await this.apiClient.logout();
    } catch (error) {
      console.log("Logout API call failed (ignored):", error.message);
    }

    this.clearAuth();
    this.redirectToLogin();

    console.log("✅ Logout complete");
  }

  // Set current user and token
  setCurrentUser(user, token) {
    this.currentUser = user;
    this.authToken = token;

    // Store in API client
    this.apiClient.setToken(token);

    // Store in state manager
    this.state.setCurrentUser(user);

    // Setup token refresh
    this.setupTokenRefresh(token);
  }

  // Clear authentication data
  clearAuth() {
    this.currentUser = null;
    this.authToken = null;

    // Clear from API client
    this.apiClient.setToken(null);

    // Clear from state manager
    this.state.setCurrentUser(null);

    // Clear timers
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }

    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // Get stored token
  getStoredToken() {
    return localStorage.getItem("authToken");
  }

  // Get current token
  getToken() {
    return this.authToken || this.getStoredToken();
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser || this.state.getCurrentUser();
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  // Role-based authorization checks
  isAdmin() {
    return this.hasRole("admin");
  }

  isMachineOperator() {
    return this.hasRole("machine_operator");
  }

  isManager() {
    return this.hasRole("manager");
  }

  // Setup automatic token refresh
  setupTokenRefresh(token) {
    try {
      // Decode JWT token to get expiration
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // Refresh token 5 minutes before expiry
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

      if (refreshTime > 0) {
        this.refreshTokenTimeout = setTimeout(() => {
          this.refreshToken();
        }, refreshTime);

        console.log(
          `🔐 Token refresh scheduled in ${Math.round(
            refreshTime / 1000 / 60
          )} minutes`
        );
      } else {
        console.log("🔐 Token expired or expiring soon, refreshing now");
        this.refreshToken();
      }
    } catch (error) {
      console.warn("🔐 Could not parse token for auto-refresh:", error.message);
    }
  }

  // Refresh authentication token
  async refreshToken() {
    try {
      console.log("🔐 Refreshing authentication token...");

      const response = await this.apiClient.refreshToken();

      if (response.success && response.token) {
        this.authToken = response.token;
        this.apiClient.setToken(response.token);

        // Setup next refresh
        this.setupTokenRefresh(response.token);

        console.log("✅ Token refreshed successfully");
        return true;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("❌ Token refresh failed:", error.message);
      this.logout();
      return false;
    }
  }

  // Start periodic session check
  startSessionCheck() {
    // Check session every 5 minutes
    this.sessionCheckInterval = setInterval(async () => {
      try {
        await this.apiClient.getCurrentUser();
      } catch (error) {
        console.log("🔐 Session check failed, logging out");
        this.logout();
      }
    }, 5 * 60 * 1000);
  }

  // Redirect to login page
  redirectToLogin() {
    if (window.manufacturingApp && window.manufacturingApp.router) {
      window.manufacturingApp.router.navigate("/login", true);
    } else {
      window.location.hash = "#/login";
    }
  }

  // Render login form
  renderLoginForm(container) {
    const loginFormHTML = `
            <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div class="text-center">
                        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                            Ganpathi Manufacturing
                        </h2>
                        <p class="mt-2 text-sm text-gray-600">
                            Operations Management System
                        </p>
                    </div>
                    
                    <div class="bg-white py-8 px-6 shadow-lg rounded-lg">
                        <form id="login-form" class="space-y-6">
                            <div id="login-error" class="hidden bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                            </div>
                            
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input id="email" name="email" type="email" required 
                                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                                              focus:outline-none focus:ring-blue-500 focus:border-blue-500 btn-touch">
                            </div>
                            
                            <div>
                                <label for="password" class="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input id="password" name="password" type="password" required 
                                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                                              focus:outline-none focus:ring-blue-500 focus:border-blue-500 btn-touch">
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <input id="remember-me" name="remember-me" type="checkbox" 
                                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                                        Remember me
                                    </label>
                                </div>
                            </div>
                            
                            <button type="submit" id="login-button"
                                    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md 
                                           shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                           btn-touch transition-colors">
                                <span id="login-button-text">Sign In</span>
                                <span id="login-button-spinner" class="hidden">
                                    <div class="spinner mr-2"></div>
                                    Signing In...
                                </span>
                            </button>
                        </form>
                        
                        <div class="mt-6 text-center">
                            <p class="text-sm text-gray-600">
                                Demo Credentials:
                            </p>
                            <div class="mt-2 space-y-1 text-xs text-gray-500">
                                <div>Admin: admin@ganpathi.com / admin123</div>
                                <div>Operator: operator@ganpathi.com / operator123</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    container.innerHTML = loginFormHTML;

    // Setup form handler
    this.setupLoginFormHandler();
  }

  // Setup login form event handlers
  setupLoginFormHandler() {
    const form = document.getElementById("login-form");
    const errorDiv = document.getElementById("login-error");
    const submitButton = document.getElementById("login-button");
    const buttonText = document.getElementById("login-button-text");
    const buttonSpinner = document.getElementById("login-button-spinner");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const credentials = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      // Show loading state
      submitButton.disabled = true;
      buttonText.classList.add("hidden");
      buttonSpinner.classList.remove("hidden");
      errorDiv.classList.add("hidden");

      try {
        const result = await this.login(credentials);

        if (result.success) {
          // Redirect to dashboard
          if (window.manufacturingApp) {
            window.manufacturingApp.navigate("/dashboard");
          }
        } else {
          // Show error
          errorDiv.textContent = result.message;
          errorDiv.classList.remove("hidden");
        }
      } catch (error) {
        errorDiv.textContent = "Login failed. Please try again.";
        errorDiv.classList.remove("hidden");
      } finally {
        // Reset button state
        submitButton.disabled = false;
        buttonText.classList.remove("hidden");
        buttonSpinner.classList.add("hidden");
      }
    });

    // Auto-fill demo credentials for quick testing
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // Add demo credential buttons
    const demoCredentials = [
      {
        email: "admin@ganpathi.com",
        password: "admin123",
        label: "Admin Demo",
      },
      {
        email: "operator@ganpathi.com",
        password: "operator123",
        label: "Operator Demo",
      },
    ];

    const demoButtonsContainer = document.createElement("div");
    demoButtonsContainer.className = "mt-4 space-y-2";

    demoCredentials.forEach((cred) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "w-full py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 btn-touch";
      button.textContent = `Use ${cred.label}`;
      button.addEventListener("click", () => {
        emailInput.value = cred.email;
        passwordInput.value = cred.password;
      });
      demoButtonsContainer.appendChild(button);
    });

    form.appendChild(demoButtonsContainer);
  }

  // Utility methods
  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  getAuthorizationHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  // Debug methods
  debug() {
    console.log("AuthManager Debug Info:");
    console.log("Current User:", this.getCurrentUser());
    console.log("Has Token:", !!this.getToken());
    console.log("Is Admin:", this.isAdmin());
    console.log("Is Machine Operator:", this.isMachineOperator());
    console.log("Is Manager:", this.isManager());
  }
}
