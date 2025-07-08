import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../services/apiClient";
import socketService from "../services/socketService";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      loading: false,
      machineId: null, // Specific machine assignment

      // Login action - specialized for machine operators
      login: async (credentials) => {
        set({ loading: true, error: null });

        try {
          const response = await apiClient.post("/auth/login", {
            ...credentials,
            deviceType: "machine_tablet",
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          });

          const { user, token, machineAssignment } = response.data;

          // Verify user is a machine operator
          if (user.role !== "machine_operator") {
            throw new Error(
              "Access denied. Machine operator credentials required."
            );
          }

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
            machineId: machineAssignment?.machineId || null,
          });

          // Set token in API client for future requests
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          // Connect to socket service with machine context
          socketService.connect(machineAssignment?.machineId);

          return { success: true, machineAssignment };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || error.message || "Login failed";
          set({
            loading: false,
            error: errorMessage,
            user: null,
            token: null,
            isAuthenticated: false,
            machineId: null,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          machineId: null,
        });

        // Remove token from API client
        delete apiClient.defaults.headers.common["Authorization"];

        // Disconnect socket service
        socketService.disconnect();

        // Clear any cached data
        localStorage.removeItem("machine-tablet-cache");
      },

      // Update machine assignment
      updateMachineAssignment: (machineId) => {
        set({ machineId });
        // Reconnect socket with new machine context
        if (get().isAuthenticated) {
          socketService.disconnect();
          socketService.connect(machineId);
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Initialize auth state from stored token
      initialize: () => {
        const { token, isAuthenticated, user, machineId } = get();

        if (token && isAuthenticated && user) {
          // Verify token is still valid and user is machine operator
          if (user.role === "machine_operator") {
            apiClient.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${token}`;

            // Connect to socket service for persisted sessions
            socketService.connect(machineId);

            // Optionally verify token validity with server
            get().verifyToken();
          } else {
            // Invalid role, logout
            get().logout();
          }
        }
      },

      // Verify token validity
      verifyToken: async () => {
        try {
          const response = await apiClient.get("/auth/verify");
          const { user, machineAssignment } = response.data;

          // Update user data and machine assignment
          set({
            user,
            machineId: machineAssignment?.machineId || get().machineId,
          });
        } catch (error) {
          console.warn("Token verification failed:", error);
          // Token invalid, logout
          get().logout();
        }
      },

      // Update operator status (available, busy, break, etc.)
      updateOperatorStatus: async (status) => {
        try {
          const response = await apiClient.patch("/auth/operator-status", {
            status,
          });
          set({
            user: {
              ...get().user,
              status: response.data.status,
            },
          });
          return { success: true };
        } catch (error) {
          console.error("Failed to update operator status:", error);
          return { success: false, error: error.message };
        }
      },

      // Clock in/out functionality for shift tracking
      clockInOut: async (action) => {
        try {
          const response = await apiClient.post("/auth/clock", {
            action,
            machineId: get().machineId,
            timestamp: new Date().toISOString(),
          });

          const { user, shift } = response.data;
          set({ user });

          return { success: true, shift };
        } catch (error) {
          console.error("Clock action failed:", error);
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: "machine-tablet-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        machineId: state.machineId,
      }),
    }
  )
);
