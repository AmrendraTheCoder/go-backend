/**
 * Ganpathi Manufacturing Operations Management System
 * Main Application Entry Point
 */

// Import components and utilities
import { AuthManager } from "./auth/AuthManager.js";
import { NavigationComponent } from "./components/NavigationComponent.js";
import { DashboardComponent } from "./components/DashboardComponent.js";
import { JobsComponent } from "./components/JobsComponent.js";
import { MachineOperatorComponent } from "./components/MachineOperatorComponent.js";
import { InventoryComponent } from "./components/InventoryComponent.js";
import { CustomersComponent } from "./components/CustomersComponent.js";
import { ToastManager } from "./utils/ToastManager.js";
import { SocketManager } from "./utils/SocketManager.js";
import { ApiClient } from "./utils/ApiClient.js";
import { Router } from "./utils/Router.js";
import { StateManager } from "./utils/StateManager.js";

class ManufacturingApp {
  constructor() {
    this.state = new StateManager();
    this.apiClient = new ApiClient();
    this.authManager = new AuthManager(this.apiClient, this.state);
    this.toastManager = new ToastManager();
    this.socketManager = new SocketManager();
    this.router = new Router();

    // Component instances
    this.components = {
      navigation: new NavigationComponent(this.state, this.authManager),
      dashboard: new DashboardComponent(this.state, this.apiClient),
      jobs: new JobsComponent(this.state, this.apiClient),
      machineOperator: new MachineOperatorComponent(
        this.state,
        this.apiClient,
        this.socketManager
      ),
      inventory: new InventoryComponent(this.state, this.apiClient),
      customers: new CustomersComponent(this.state, this.apiClient),
    };

    this.currentComponent = null;
    this.initialized = false;
  }

  async init() {
    try {
      console.log("🚀 Initializing Ganpathi Manufacturing System...");

      // Setup error handling
      this.setupErrorHandling();

      // Setup routing
      this.setupRouting();

      // Initialize API client
      await this.apiClient.init();

      // Check authentication status
      const isAuthenticated = await this.authManager.checkAuthStatus();

      if (isAuthenticated) {
        await this.loadMainApplication();
      } else {
        this.showAuthContainer();
      }

      // Hide loading screen
      this.hideLoadingScreen();

      this.initialized = true;
      console.log("✅ Application initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize application:", error);
      this.toastManager.error(
        "Failed to initialize application. Please refresh the page."
      );
      this.hideLoadingScreen();
    }
  }

  setupErrorHandling() {
    // Global error handlers
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      this.toastManager.error("An unexpected error occurred");
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.toastManager.error("A network error occurred");
    });
  }

  setupRouting() {
    // Setup route handlers
    this.router.addRoute("/", () => this.showDashboard());
    this.router.addRoute("/dashboard", () => this.showDashboard());
    this.router.addRoute("/jobs", () => this.showJobs());
    this.router.addRoute("/jobs/:id", (params) =>
      this.showJobDetail(params.id)
    );
    this.router.addRoute("/machine/:machineId", (params) =>
      this.showMachineOperator(params.machineId)
    );
    this.router.addRoute("/inventory", () => this.showInventory());
    this.router.addRoute("/customers", () => this.showCustomers());
    this.router.addRoute("/customers/:id", (params) =>
      this.showCustomerDetail(params.id)
    );
    this.router.addRoute("/login", () => this.showAuthContainer());

    // Setup route change listener
    this.router.onRouteChange((route, params) => {
      this.handleRouteChange(route, params);
    });

    // Initialize router
    this.router.init();
  }

  async loadMainApplication() {
    try {
      // Get user profile
      const userProfile = await this.authManager.getCurrentUser();
      this.state.set("currentUser", userProfile);

      // Initialize socket connection
      await this.socketManager.connect(this.authManager.getToken());

      // Setup socket event listeners
      this.setupSocketListeners();

      // Load navigation
      this.components.navigation.render(document.getElementById("main-nav"));

      // Show main app container
      this.showAppContainer();

      // Load initial route
      this.router.handleCurrentRoute();
    } catch (error) {
      console.error("Failed to load main application:", error);
      this.toastManager.error("Failed to load application data");
      this.authManager.logout();
    }
  }

  setupSocketListeners() {
    // Job status updates
    this.socketManager.on("job_status_update", (data) => {
      this.state.updateJobStatus(data.jobId, data.status);
      this.toastManager.info(
        `Job ${data.jobId} status updated to ${data.status}`
      );

      // Refresh current component if showing jobs
      if (
        this.currentComponent === "jobs" ||
        this.currentComponent === "dashboard"
      ) {
        this.refreshCurrentComponent();
      }
    });

    // Inventory alerts
    this.socketManager.on("inventory_alert", (data) => {
      this.toastManager.warning(
        `Low stock alert: ${data.itemName} (${data.currentQuantity} remaining)`
      );
    });

    // Machine status updates
    this.socketManager.on("machine_update", (data) => {
      this.state.updateMachineStatus(data.machineId, data.status);

      // Refresh machine operator interface if current machine
      if (this.currentComponent === "machineOperator") {
        this.refreshCurrentComponent();
      }
    });

    // System notifications
    this.socketManager.on("system_notification", (data) => {
      this.toastManager.show(data.message, data.type || "info");
    });
  }

  handleRouteChange(route, params) {
    // Update navigation active state
    if (this.components.navigation) {
      this.components.navigation.updateActiveRoute(route);
    }
  }

  // Route Handlers
  async showDashboard() {
    this.currentComponent = "dashboard";
    await this.components.dashboard.render(
      document.getElementById("main-content")
    );
  }

  async showJobs() {
    this.currentComponent = "jobs";
    await this.components.jobs.render(document.getElementById("main-content"));
  }

  async showJobDetail(jobId) {
    this.currentComponent = "jobs";
    await this.components.jobs.renderJobDetail(
      document.getElementById("main-content"),
      jobId
    );
  }

  async showMachineOperator(machineId) {
    this.currentComponent = "machineOperator";
    await this.components.machineOperator.render(
      document.getElementById("main-content"),
      machineId
    );
  }

  async showInventory() {
    this.currentComponent = "inventory";
    await this.components.inventory.render(
      document.getElementById("main-content")
    );
  }

  async showCustomers() {
    this.currentComponent = "customers";
    await this.components.customers.render(
      document.getElementById("main-content")
    );
  }

  async showCustomerDetail(customerId) {
    this.currentComponent = "customers";
    await this.components.customers.renderCustomerDetail(
      document.getElementById("main-content"),
      customerId
    );
  }

  async refreshCurrentComponent() {
    if (this.currentComponent && this.components[this.currentComponent]) {
      await this.components[this.currentComponent].refresh();
    }
  }

  // UI State Management
  showAuthContainer() {
    document.getElementById("auth-container").classList.remove("hidden");
    document.getElementById("app-container").classList.add("hidden");
    this.authManager.renderLoginForm(document.getElementById("auth-container"));
  }

  showAppContainer() {
    document.getElementById("auth-container").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    setTimeout(() => {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
      }, 300);
    }, 500);
  }

  // Public API for components
  navigate(path) {
    this.router.navigate(path);
  }

  showToast(message, type = "info") {
    this.toastManager.show(message, type);
  }

  getApiClient() {
    return this.apiClient;
  }

  getSocketManager() {
    return this.socketManager;
  }

  getState() {
    return this.state;
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "🏭 Starting Ganpathi Manufacturing Operations Management System"
  );

  // Create global app instance
  window.manufacturingApp = new ManufacturingApp();

  // Initialize the application
  window.manufacturingApp.init().catch((error) => {
    console.error("Failed to start application:", error);
  });
});

// Export for module usage
export { ManufacturingApp };
