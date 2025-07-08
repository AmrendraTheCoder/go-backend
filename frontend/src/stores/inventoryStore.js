import { create } from "zustand";
import { apiClient } from "../services/apiClient";
import socketService from "../services/socketService";

export const useInventoryStore = create((set, get) => ({
  inventory: [],
  selectedItem: null,
  loading: false,
  error: null,
  lowStockAlert: [],
  stats: {
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  },

  // Fetch all inventory items
  fetchInventory: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get("/inventory", { params: filters });
      const inventory = response.data.inventory || [];

      // Calculate stats
      const stats = {
        totalItems: inventory.length,
        lowStock: inventory.filter((item) => item.quantity <= item.minThreshold)
          .length,
        outOfStock: inventory.filter((item) => item.quantity === 0).length,
        totalValue: inventory.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        ),
      };

      // Get low stock items
      const lowStockAlert = inventory.filter(
        (item) => item.quantity <= item.minThreshold
      );

      set({ inventory, stats, lowStockAlert, loading: false });
    } catch (error) {
      console.error("Error fetching inventory:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch inventory",
        loading: false,
      });
    }
  },

  // Get single inventory item
  fetchInventoryItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/inventory/${itemId}`);
      set({ selectedItem: response.data.item, loading: false });
      return response.data.item;
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      set({
        error:
          error.response?.data?.message || "Failed to fetch inventory item",
        loading: false,
      });
    }
  },

  // Create new inventory item
  createInventoryItem: async (itemData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post("/inventory", itemData);
      const newItem = response.data.item;

      // Add to local state
      const inventory = [...get().inventory, newItem];
      set({ inventory, loading: false });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error creating inventory item:", error);
      set({
        error:
          error.response?.data?.message || "Failed to create inventory item",
        loading: false,
      });
      throw error;
    }
  },

  // Update inventory item
  updateInventoryItem: async (itemId, itemData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(`/inventory/${itemId}`, itemData);
      const updatedItem = response.data.item;

      // Update local state
      const inventory = get().inventory.map((item) =>
        item._id === itemId ? updatedItem : item
      );

      set({ inventory, loading: false });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error updating inventory item:", error);
      set({
        error:
          error.response?.data?.message || "Failed to update inventory item",
        loading: false,
      });
      throw error;
    }
  },

  // Update stock quantity
  updateStock: async (itemId, quantityChange, reason = "Manual adjustment") => {
    try {
      const response = await apiClient.put(`/inventory/${itemId}/stock`, {
        quantityChange,
        reason,
      });

      // Update local state
      const inventory = get().inventory.map((item) =>
        item._id === itemId
          ? { ...item, quantity: response.data.newQuantity }
          : item
      );

      set({ inventory });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error updating stock:", error);
      throw error;
    }
  },

  // Delete inventory item
  deleteInventoryItem: async (itemId) => {
    try {
      await apiClient.delete(`/inventory/${itemId}`);

      // Remove from local state
      const inventory = get().inventory.filter((item) => item._id !== itemId);
      set({ inventory });

      // Recalculate stats
      get().calculateStats();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      throw error;
    }
  },

  // Search inventory
  searchInventory: async (searchTerm) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get("/inventory/search", {
        params: { q: searchTerm },
      });

      set({ inventory: response.data.inventory || [], loading: false });
    } catch (error) {
      console.error("Error searching inventory:", error);
      set({
        error: error.response?.data?.message || "Failed to search inventory",
        loading: false,
      });
    }
  },

  // Get low stock items
  getLowStockItems: async () => {
    try {
      const response = await apiClient.get("/inventory/low-stock");
      set({ lowStockAlert: response.data.items || [] });
      return response.data.items;
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      throw error;
    }
  },

  // Calculate stats from current inventory
  calculateStats: () => {
    const inventory = get().inventory;
    const stats = {
      totalItems: inventory.length,
      lowStock: inventory.filter((item) => item.quantity <= item.minThreshold)
        .length,
      outOfStock: inventory.filter((item) => item.quantity === 0).length,
      totalValue: inventory.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
    };

    // Update low stock alert
    const lowStockAlert = inventory.filter(
      (item) => item.quantity <= item.minThreshold
    );

    set({ stats, lowStockAlert });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      inventory: [],
      selectedItem: null,
      loading: false,
      error: null,
      lowStockAlert: [],
      stats: {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
      },
    }),

  // Real-time socket event handlers
  initializeSocketListeners: () => {
    // Inventory updated event
    socketService.subscribe("inventory:updated", (updatedItem) => {
      const inventory = get().inventory.map((item) =>
        item._id === updatedItem._id ? { ...item, ...updatedItem } : item
      );
      set({ inventory });
      get().calculateStats();

      // Update selected item if it's the one being updated
      if (get().selectedItem?._id === updatedItem._id) {
        set({ selectedItem: { ...get().selectedItem, ...updatedItem } });
      }
    });

    // Low stock alert event
    socketService.subscribe("inventory:low_stock", (alertData) => {
      const lowStockAlert = [...get().lowStockAlert];
      const existingIndex = lowStockAlert.findIndex(
        (item) => item._id === alertData.item._id
      );

      if (existingIndex >= 0) {
        lowStockAlert[existingIndex] = alertData.item;
      } else {
        lowStockAlert.push(alertData.item);
      }

      set({ lowStockAlert });
    });

    // Stock added event
    socketService.subscribe("inventory:stock_added", (stockData) => {
      const inventory = get().inventory.map((item) =>
        item._id === stockData.itemId
          ? { ...item, quantity: stockData.newQuantity }
          : item
      );
      set({ inventory });
      get().calculateStats();
    });
  },

  // Clean up socket listeners
  cleanupSocketListeners: () => {
    // This will be handled by the socketService when it disconnects
  },
}));
