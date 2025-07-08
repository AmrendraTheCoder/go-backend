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
      loading: false,
      error: null,

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.post("/auth/login", credentials);
          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          // Set token in API client for future requests
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          // Connect to socket service
          socketService.connect();

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Login failed";
          set({
            error: errorMessage,
            loading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // Remove token from API client
        delete apiClient.defaults.headers.common["Authorization"];

        // Disconnect socket service
        socketService.disconnect();
      },

      clearError: () => set({ error: null }),

      // Initialize auth state from stored token
      initialize: () => {
        const { token, isAuthenticated } = get();
        if (token && isAuthenticated) {
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          // Connect to socket service for persisted sessions
          socketService.connect();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
