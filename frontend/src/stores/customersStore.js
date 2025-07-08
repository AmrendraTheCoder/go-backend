import { create } from "zustand";
import { apiClient } from "../services/apiClient";

export const useCustomersStore = create((set, get) => ({
  customers: [],
  selectedCustomer: null,
  customerHistory: [],
  loading: false,
  error: null,
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    totalOutstanding: 0,
    totalReceivable: 0,
  },

  // Fetch all customers
  fetchCustomers: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get("/customers", { params: filters });
      const customers = response.data.customers || [];

      // Calculate stats
      const stats = {
        total: customers.length,
        active: customers.filter((c) => c.status === "active").length,
        inactive: customers.filter((c) => c.status === "inactive").length,
        totalOutstanding: customers.reduce(
          (sum, c) =>
            sum + (c.currentBalance < 0 ? Math.abs(c.currentBalance) : 0),
          0
        ),
        totalReceivable: customers.reduce(
          (sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0),
          0
        ),
      };

      set({ customers, stats, loading: false });
    } catch (error) {
      console.error("Error fetching customers:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch customers",
        loading: false,
      });
    }
  },

  // Get single customer
  fetchCustomer: async (customerId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/customers/${customerId}`);
      set({ selectedCustomer: response.data.customer, loading: false });
      return response.data.customer;
    } catch (error) {
      console.error("Error fetching customer:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch customer",
        loading: false,
      });
    }
  },

  // Create new customer
  createCustomer: async (customerData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post("/customers", customerData);
      const newCustomer = response.data.customer;

      // Add to local state
      const customers = [...get().customers, newCustomer];
      set({ customers, loading: false });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error creating customer:", error);
      set({
        error: error.response?.data?.message || "Failed to create customer",
        loading: false,
      });
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (customerId, customerData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(
        `/customers/${customerId}`,
        customerData
      );
      const updatedCustomer = response.data.customer;

      // Update local state
      const customers = get().customers.map((customer) =>
        customer._id === customerId ? updatedCustomer : customer
      );

      set({ customers, loading: false });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error updating customer:", error);
      set({
        error: error.response?.data?.message || "Failed to update customer",
        loading: false,
      });
      throw error;
    }
  },

  // Delete customer
  deleteCustomer: async (customerId) => {
    try {
      await apiClient.delete(`/customers/${customerId}`);

      // Remove from local state
      const customers = get().customers.filter(
        (customer) => customer._id !== customerId
      );
      set({ customers });

      // Recalculate stats
      get().calculateStats();
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },

  // Get customer job history
  getCustomerHistory: async (customerId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/customers/${customerId}/history`);
      set({ customerHistory: response.data.history || [], loading: false });
      return response.data.history;
    } catch (error) {
      console.error("Error fetching customer history:", error);
      set({
        error:
          error.response?.data?.message || "Failed to fetch customer history",
        loading: false,
      });
    }
  },

  // Update customer balance
  updateCustomerBalance: async (customerId, balanceChange, description) => {
    try {
      const response = await apiClient.put(`/customers/${customerId}/balance`, {
        balanceChange,
        description,
      });

      // Update local state
      const customers = get().customers.map((customer) =>
        customer._id === customerId
          ? { ...customer, currentBalance: response.data.newBalance }
          : customer
      );

      set({ customers });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error updating customer balance:", error);
      throw error;
    }
  },

  // Search customers
  searchCustomers: async (searchTerm) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get("/customers/search", {
        params: { q: searchTerm },
      });

      set({ customers: response.data.customers || [], loading: false });
    } catch (error) {
      console.error("Error searching customers:", error);
      set({
        error: error.response?.data?.message || "Failed to search customers",
        loading: false,
      });
    }
  },

  // Calculate stats from current customers
  calculateStats: () => {
    const customers = get().customers;
    const stats = {
      total: customers.length,
      active: customers.filter((c) => c.status === "active").length,
      inactive: customers.filter((c) => c.status === "inactive").length,
      totalOutstanding: customers.reduce(
        (sum, c) =>
          sum + (c.currentBalance < 0 ? Math.abs(c.currentBalance) : 0),
        0
      ),
      totalReceivable: customers.reduce(
        (sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0),
        0
      ),
    };

    set({ stats });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      customers: [],
      selectedCustomer: null,
      customerHistory: [],
      loading: false,
      error: null,
      stats: {
        total: 0,
        active: 0,
        inactive: 0,
        totalOutstanding: 0,
        totalReceivable: 0,
      },
    }),
}));
