import { create } from "zustand";
import { apiClient } from "../services/apiClient";
import socketService from "../services/socketService";

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isConnected: false,
  connectionAttempts: 0,
  lastConnectionAttempt: null,

  // Available warehouses/locations
  warehouses: [
    { id: "warehouse-a", name: "Warehouse A", location: "Building A" },
    { id: "warehouse-b", name: "Warehouse B", location: "Building B" },
    { id: "quality-control", name: "Quality Control", location: "QC Lab" },
    { id: "receiving", name: "Receiving Area", location: "Loading Dock" },
    { id: "shipping", name: "Shipping Area", location: "Dispatch" },
  ],

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setConnected: (connected) => set({ isConnected: connected }),

  // Initialize connection monitoring
  initializeConnection: () => {
    const { setConnected, incrementConnectionAttempts } = get();

    // Monitor socket connection
    socketService.on("connect", () => {
      setConnected(true);
      set({ connectionAttempts: 0 });
      console.log("Stock tablet connected to server");
    });

    socketService.on("disconnect", () => {
      setConnected(false);
      incrementConnectionAttempts();
      console.log("Stock tablet disconnected from server");
    });

    socketService.on("connect_error", (error) => {
      setConnected(false);
      incrementConnectionAttempts();
      console.error("Stock tablet connection error:", error);
    });

    // Initial connection attempt
    socketService.connect();
  },

  incrementConnectionAttempts: () => {
    set((state) => ({
      connectionAttempts: state.connectionAttempts + 1,
      lastConnectionAttempt: new Date().toISOString(),
    }));
  },

  // Login for stock managers
  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API call for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, accept any credentials
      const user = {
        id: Date.now().toString(),
        email: credentials.email,
        name: credentials.email.split("@")[0],
        warehouse: credentials.warehouse,
        warehouseName:
          get().warehouses.find((w) => w.id === credentials.warehouse)?.name ||
          "Unknown",
        userType: "stock-manager",
        permissions: ["stock:read", "stock:write", "stock:adjust"],
        loginTime: new Date().toISOString(),
      };

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isConnected: true,
      });

      // Store in localStorage for persistence
      localStorage.setItem("stockAuth", JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || "Login failed",
      });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      // Clear stored auth
      localStorage.removeItem("stockAuth");

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isConnected: false,
      });

      return { success: true };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      // Check localStorage for existing auth
      const storedAuth = localStorage.getItem("stockAuth");
      if (storedAuth) {
        const user = JSON.parse(storedAuth);
        set({
          user,
          isAuthenticated: true,
          isConnected: true,
          isLoading: false,
          error: null,
        });
        return { success: true, user };
      }

      set({ isLoading: false });
      return { success: false, error: "No stored authentication" };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || "Authentication check failed",
      });
      return { success: false, error: error.message };
    }
  },

  // Connection management
  setConnectionStatus: (status) => {
    set({ isConnected: status });
  },

  resetConnectionAttempts: () => {
    set({ connectionAttempts: 0, lastConnectionAttempt: null });
  },

  getConnectionStatus: () => {
    const state = get();
    if (state.isConnected) {
      return {
        status: "connected",
        message: "Connected to server",
        color: "text-green-600",
      };
    }

    if (state.connectionAttempts > 0) {
      return {
        status: "reconnecting",
        message: `Reconnecting... (attempt ${state.connectionAttempts})`,
        color: "text-yellow-600",
      };
    }

    return {
      status: "disconnected",
      message: "Disconnected from server",
      color: "text-red-600",
    };
  },

  // Manual reconnection attempt
  reconnect: async () => {
    const { isAuthenticated } = get();

    if (!isAuthenticated) {
      set({ error: "Please login first" });
      return false;
    }

    try {
      set({ error: null });
      socketService.disconnect();

      // Wait a moment before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      socketService.connect();
      return true;
    } catch (error) {
      console.error("Reconnection error:", error);
      set({ error: "Failed to reconnect to server" });
      return false;
    }
  },

  // Test connection
  testConnection: async () => {
    try {
      set({ error: null });
      const response = await apiClient.get("/api/health");
      return {
        success: true,
        message: "Connection test successful",
        data: response.data,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Connection test failed";
      set({ error: message });
      return {
        success: false,
        message,
        error,
      };
    }
  },

  // Update user profile
  updateProfile: async (updates) => {
    const { setLoading, setError, user } = get();

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.put("/api/auth/profile", updates);

      const updatedUser = { ...user, ...response.data };

      // Update stored user data
      localStorage.setItem("stock_user", JSON.stringify(updatedUser));

      set({ user: updatedUser });

      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const { setLoading, setError } = get();

    try {
      setLoading(true);
      setError(null);

      await apiClient.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  },

  // Reset store
  reset: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isConnected: false,
      connectionAttempts: 0,
      lastConnectionAttempt: null,
    });
  },
}));

export { useAuthStore };
