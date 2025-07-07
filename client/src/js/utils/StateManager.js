/**
 * State Manager for Ganpathi Manufacturing Operations
 * Handles application state with reactive updates
 */

export class StateManager {
  constructor() {
    this.state = {
      currentUser: null,
      jobs: [],
      customers: [],
      inventory: [],
      paperTypes: [],
      machines: [],
      dashboardStats: null,
      selectedJob: null,
      selectedCustomer: null,
      loading: {},
      errors: {},
      notifications: [],
    };

    this.listeners = new Map();
    this.history = [];
    this.maxHistorySize = 50;
  }

  // Core state methods
  get(key) {
    return this.getNestedValue(this.state, key);
  }

  set(key, value) {
    const oldValue = this.get(key);
    this.setNestedValue(this.state, key, value);

    // Add to history
    this.addToHistory({
      action: "SET",
      key,
      oldValue,
      newValue: value,
      timestamp: new Date(),
    });

    // Notify listeners
    this.notifyListeners(key, value, oldValue);

    return value;
  }

  update(key, updater) {
    const oldValue = this.get(key);
    const newValue =
      typeof updater === "function" ? updater(oldValue) : updater;
    return this.set(key, newValue);
  }

  // Nested object helpers
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  // Reactive listeners
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  notifyListeners(key, newValue, oldValue) {
    // Notify exact key listeners
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((callback) => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error("State listener error:", error);
        }
      });
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get("*");
    if (wildcardListeners) {
      wildcardListeners.forEach((callback) => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error("Wildcard listener error:", error);
        }
      });
    }
  }

  // History management
  addToHistory(entry) {
    this.history.push(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  getHistory() {
    return [...this.history];
  }

  // Loading states
  setLoading(key, isLoading) {
    this.update("loading", (current) => ({
      ...current,
      [key]: isLoading,
    }));
  }

  isLoading(key) {
    return this.get(`loading.${key}`) || false;
  }

  // Error handling
  setError(key, error) {
    this.update("errors", (current) => ({
      ...current,
      [key]: error,
    }));
  }

  getError(key) {
    return this.get(`errors.${key}`);
  }

  clearError(key) {
    this.update("errors", (current) => {
      const updated = { ...current };
      delete updated[key];
      return updated;
    });
  }

  // User management
  setCurrentUser(user) {
    this.set("currentUser", user);
  }

  getCurrentUser() {
    return this.get("currentUser");
  }

  isLoggedIn() {
    return !!this.getCurrentUser();
  }

  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  isAdmin() {
    return this.hasRole("admin");
  }

  isMachineOperator() {
    return this.hasRole("machine_operator");
  }

  // Jobs management
  setJobs(jobs) {
    this.set("jobs", jobs);
  }

  getJobs() {
    return this.get("jobs") || [];
  }

  addJob(job) {
    this.update("jobs", (current) => [...current, job]);
  }

  updateJob(jobId, updates) {
    this.update("jobs", (current) =>
      current.map((job) => (job._id === jobId ? { ...job, ...updates } : job))
    );
  }

  updateJobStatus(jobId, status) {
    this.updateJob(jobId, { status });
  }

  removeJob(jobId) {
    this.update("jobs", (current) =>
      current.filter((job) => job._id !== jobId)
    );
  }

  getJobById(jobId) {
    return this.getJobs().find((job) => job._id === jobId);
  }

  getJobsByStatus(status) {
    return this.getJobs().filter((job) => job.status === status);
  }

  getJobsByCustomer(customerId) {
    return this.getJobs().filter((job) => job.customer._id === customerId);
  }

  // Customers management
  setCustomers(customers) {
    this.set("customers", customers);
  }

  getCustomers() {
    return this.get("customers") || [];
  }

  addCustomer(customer) {
    this.update("customers", (current) => [...current, customer]);
  }

  updateCustomer(customerId, updates) {
    this.update("customers", (current) =>
      current.map((customer) =>
        customer._id === customerId ? { ...customer, ...updates } : customer
      )
    );
  }

  removeCustomer(customerId) {
    this.update("customers", (current) =>
      current.filter((customer) => customer._id !== customerId)
    );
  }

  getCustomerById(customerId) {
    return this.getCustomers().find((customer) => customer._id === customerId);
  }

  // Inventory management
  setInventory(inventory) {
    this.set("inventory", inventory);
  }

  getInventory() {
    return this.get("inventory") || [];
  }

  addInventoryItem(item) {
    this.update("inventory", (current) => [...current, item]);
  }

  updateInventoryItem(itemId, updates) {
    this.update("inventory", (current) =>
      current.map((item) =>
        item._id === itemId ? { ...item, ...updates } : item
      )
    );
  }

  updateInventoryQuantity(itemId, quantity) {
    this.updateInventoryItem(itemId, { currentQuantity: quantity });
  }

  removeInventoryItem(itemId) {
    this.update("inventory", (current) =>
      current.filter((item) => item._id !== itemId)
    );
  }

  getInventoryItem(itemId) {
    return this.getInventory().find((item) => item._id === itemId);
  }

  getLowStockItems(threshold = null) {
    return this.getInventory().filter((item) => {
      const alertThreshold = threshold || item.minimumQuantity || 10;
      return item.currentQuantity <= alertThreshold;
    });
  }

  // Paper types management
  setPaperTypes(paperTypes) {
    this.set("paperTypes", paperTypes);
  }

  getPaperTypes() {
    return this.get("paperTypes") || [];
  }

  addPaperType(paperType) {
    this.update("paperTypes", (current) => [...current, paperType]);
  }

  updatePaperType(paperTypeId, updates) {
    this.update("paperTypes", (current) =>
      current.map((paperType) =>
        paperType._id === paperTypeId ? { ...paperType, ...updates } : paperType
      )
    );
  }

  removePaperType(paperTypeId) {
    this.update("paperTypes", (current) =>
      current.filter((paperType) => paperType._id !== paperTypeId)
    );
  }

  // Machine status management
  setMachines(machines) {
    this.set("machines", machines);
  }

  getMachines() {
    return this.get("machines") || [];
  }

  updateMachineStatus(machineId, status) {
    this.update("machines", (current) =>
      current.map((machine) =>
        machine._id === machineId ? { ...machine, status } : machine
      )
    );
  }

  getMachineById(machineId) {
    return this.getMachines().find((machine) => machine._id === machineId);
  }

  getActiveMachines() {
    return this.getMachines().filter((machine) => machine.status === "active");
  }

  // Dashboard stats
  setDashboardStats(stats) {
    this.set("dashboardStats", stats);
  }

  getDashboardStats() {
    return this.get("dashboardStats");
  }

  // Selection management
  setSelectedJob(job) {
    this.set("selectedJob", job);
  }

  getSelectedJob() {
    return this.get("selectedJob");
  }

  setSelectedCustomer(customer) {
    this.set("selectedCustomer", customer);
  }

  getSelectedCustomer() {
    return this.get("selectedCustomer");
  }

  // Notifications
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    this.update("notifications", (current) => [newNotification, ...current]);
    return newNotification.id;
  }

  markNotificationRead(notificationId) {
    this.update("notifications", (current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  removeNotification(notificationId) {
    this.update("notifications", (current) =>
      current.filter((notification) => notification.id !== notificationId)
    );
  }

  getUnreadNotifications() {
    return this.get("notifications").filter(
      (notification) => !notification.read
    );
  }

  // Utility methods
  reset() {
    this.state = {
      currentUser: null,
      jobs: [],
      customers: [],
      inventory: [],
      paperTypes: [],
      machines: [],
      dashboardStats: null,
      selectedJob: null,
      selectedCustomer: null,
      loading: {},
      errors: {},
      notifications: [],
    };
    this.history = [];
    this.notifyListeners("*", this.state, {});
  }

  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  debug() {
    console.log("Current State:", this.getSnapshot());
    console.log("History:", this.getHistory());
    console.log("Active Listeners:", Array.from(this.listeners.keys()));
  }
}
