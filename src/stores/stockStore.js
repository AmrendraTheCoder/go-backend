import { create } from "zustand";
import { apiClient } from "../services/apiClient";
import { socketService } from "../services/socketService";

const useStockStore = create((set, get) => ({
  // State
  stockItems: [],
  categories: [],
  locations: [],
  isLoading: false,
  error: null,
  connectionStatus: "disconnected",
  lastSync: null,

  // Stock statistics
  stats: {
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    categoryCounts: {},
  },

  // Filters and pagination
  filters: {
    category: "",
    location: "",
    searchTerm: "",
    status: "", // 'in-stock', 'low-stock', 'out-of-stock'
    sortBy: "itemName", // 'itemName', 'quantity', 'lastUpdated'
    sortOrder: "asc",
  },

  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 0,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Initialize socket connection
  initializeSocket: () => {
    const { setConnectionStatus, handleStockUpdate, handleStockDelete } = get();

    socketService.on("connect", () => {
      setConnectionStatus("connected");
      console.log("Stock tablet connected to socket");
    });

    socketService.on("disconnect", () => {
      setConnectionStatus("disconnected");
      console.log("Stock tablet disconnected from socket");
    });

    socketService.on("stockUpdated", handleStockUpdate);
    socketService.on("stockDeleted", handleStockDelete);
    socketService.on("inventoryAlert", (alert) => {
      console.log("Inventory alert:", alert);
      // Handle low stock alerts, etc.
    });
  },

  // Real-time update handlers
  handleStockUpdate: (updatedItem) => {
    set((state) => ({
      stockItems: state.stockItems.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      ),
    }));
    get().calculateStats();
  },

  handleStockDelete: (deletedItemId) => {
    set((state) => ({
      stockItems: state.stockItems.filter((item) => item.id !== deletedItemId),
    }));
    get().calculateStats();
  },

  // Fetch stock items with filters
  fetchStockItems: async (page = 1) => {
    const { filters, itemsPerPage, setLoading, setError } = get();

    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: itemsPerPage,
        ...filters,
      };

      const response = await apiClient.get("/api/inventory", { params });

      set({
        stockItems: response.data.items,
        totalItems: response.data.total,
        currentPage: page,
        lastSync: new Date().toISOString(),
      });

      get().calculateStats();
    } catch (error) {
      console.error("Error fetching stock items:", error);
      setError(error.response?.data?.message || "Failed to fetch stock items");
    } finally {
      setLoading(false);
    }
  },

  // Add new stock item
  addStockItem: async (stockItem) => {
    const { setLoading, setError, fetchStockItems } = get();

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post("/api/inventory", stockItem);

      // Add to local state immediately for better UX
      set((state) => ({
        stockItems: [response.data, ...state.stockItems],
      }));

      get().calculateStats();

      // Emit socket event for real-time updates
      socketService.emit("stockAdded", response.data);

      return response.data;
    } catch (error) {
      console.error("Error adding stock item:", error);
      setError(error.response?.data?.message || "Failed to add stock item");
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Update stock item
  updateStockItem: async (itemId, updates) => {
    const { setLoading, setError } = get();

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.put(`/api/inventory/${itemId}`, updates);

      // Update local state
      set((state) => ({
        stockItems: state.stockItems.map((item) =>
          item.id === itemId ? { ...item, ...response.data } : item
        ),
      }));

      get().calculateStats();

      // Emit socket event
      socketService.emit("stockUpdated", response.data);

      return response.data;
    } catch (error) {
      console.error("Error updating stock item:", error);
      setError(error.response?.data?.message || "Failed to update stock item");
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Adjust stock quantity (for stock movements)
  adjustStockQuantity: async (itemId, adjustment, reason, notes = "") => {
    const { setLoading, setError } = get();

    try {
      setLoading(true);
      setError(null);

      const adjustmentData = {
        adjustment, // positive for stock in, negative for stock out
        reason, // 'received', 'damaged', 'sold', 'returned', 'adjustment'
        notes,
        adjustedBy: "current-user-id", // Will be set by backend
        adjustedAt: new Date().toISOString(),
      };

      const response = await apiClient.post(
        `/api/inventory/${itemId}/adjust`,
        adjustmentData
      );

      // Update local state
      set((state) => ({
        stockItems: state.stockItems.map((item) =>
          item.id === itemId ? { ...item, ...response.data } : item
        ),
      }));

      get().calculateStats();

      // Emit socket event
      socketService.emit("stockAdjusted", {
        itemId,
        newQuantity: response.data.quantity,
        adjustment: adjustmentData,
      });

      return response.data;
    } catch (error) {
      console.error("Error adjusting stock:", error);
      setError(error.response?.data?.message || "Failed to adjust stock");
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Upload photos for stock item
  uploadStockPhotos: async (itemId, photos) => {
    const { setLoading, setError } = get();

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });

      const response = await apiClient.post(
        `/api/inventory/${itemId}/photos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update local state with new photo URLs
      set((state) => ({
        stockItems: state.stockItems.map((item) =>
          item.id === itemId ? { ...item, photos: response.data.photos } : item
        ),
      }));

      return response.data.photos;
    } catch (error) {
      console.error("Error uploading photos:", error);
      setError(error.response?.data?.message || "Failed to upload photos");
      throw error;
    } finally {
      setLoading(false);
    }
  },

  // Search stock items
  searchStockItems: async (searchTerm) => {
    set((state) => ({
      filters: { ...state.filters, searchTerm },
      currentPage: 1,
    }));

    await get().fetchStockItems(1);
  },

  // Set filters
  setFilters: async (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1,
    }));

    await get().fetchStockItems(1);
  },

  // Calculate statistics
  calculateStats: () => {
    const { stockItems } = get();

    const stats = stockItems.reduce(
      (acc, item) => {
        acc.totalItems += item.quantity || 0;
        acc.totalValue += (item.quantity || 0) * (item.costPrice || 0);

        // Check stock levels
        if (item.quantity === 0) {
          acc.outOfStockItems++;
        } else if (item.quantity <= (item.minStockLevel || 0)) {
          acc.lowStockItems++;
        }

        // Category counts
        if (item.category) {
          acc.categoryCounts[item.category] =
            (acc.categoryCounts[item.category] || 0) + 1;
        }

        return acc;
      },
      {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        categoryCounts: {},
      }
    );

    set({ stats });
  },

  // Fetch reference data
  fetchCategories: async () => {
    try {
      const response = await apiClient.get("/api/inventory/categories");
      set({ categories: response.data });
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  },

  fetchLocations: async () => {
    try {
      const response = await apiClient.get("/api/inventory/locations");
      set({ locations: response.data });
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  },

  // Stock alerts and notifications
  getStockAlerts: () => {
    const { stockItems } = get();

    const alerts = [];

    stockItems.forEach((item) => {
      if (item.quantity === 0) {
        alerts.push({
          type: "out-of-stock",
          item,
          message: `${item.itemName} is out of stock`,
          severity: "high",
        });
      } else if (item.quantity <= (item.minStockLevel || 0)) {
        alerts.push({
          type: "low-stock",
          item,
          message: `${item.itemName} is running low (${item.quantity} remaining)`,
          severity: "medium",
        });
      }

      // Check expiry dates
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysToExpiry = Math.ceil(
          (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysToExpiry <= 0) {
          alerts.push({
            type: "expired",
            item,
            message: `${item.itemName} has expired`,
            severity: "high",
          });
        } else if (daysToExpiry <= 7) {
          alerts.push({
            type: "expiring-soon",
            item,
            message: `${item.itemName} expires in ${daysToExpiry} days`,
            severity: "medium",
          });
        }
      }
    });

    return alerts;
  },

  // Offline support
  syncOfflineData: async () => {
    // Implement offline sync logic when connection is restored
    const { connectionStatus, fetchStockItems } = get();

    if (connectionStatus === "connected") {
      try {
        await fetchStockItems(1);
        console.log("Offline data synced successfully");
      } catch (error) {
        console.error("Error syncing offline data:", error);
      }
    }
  },

  // Reset store
  reset: () => {
    set({
      stockItems: [],
      categories: [],
      locations: [],
      isLoading: false,
      error: null,
      connectionStatus: "disconnected",
      lastSync: null,
      stats: {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        categoryCounts: {},
      },
      filters: {
        category: "",
        location: "",
        searchTerm: "",
        status: "",
        sortBy: "itemName",
        sortOrder: "asc",
      },
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
    });
  },
}));

export { useStockStore };
