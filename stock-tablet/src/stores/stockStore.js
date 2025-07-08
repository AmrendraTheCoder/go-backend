import { create } from "zustand";
import { apiClient } from "../services/apiClient";
import socketService from "../services/socketService";

const useStockStore = create((set, get) => ({
  // State
  stockItems: [],
  categories: [
    "Electronics",
    "Tools",
    "Raw Materials",
    "Finished Goods",
    "Spare Parts",
    "Consumables",
    "Chemicals",
    "Safety Equipment",
  ],
  locations: [
    "A1-01",
    "A1-02",
    "A1-03",
    "A2-01",
    "A2-02",
    "B1-01",
    "B1-02",
    "B2-01",
    "B2-02",
    "QC-01",
    "QC-02",
    "REC-01",
    "SHIP-01",
  ],
  suppliers: [
    "Acme Corp",
    "Tech Solutions Inc",
    "Global Parts Ltd",
    "Quality Materials Co",
    "Industrial Supply Pro",
  ],
  units: [
    "pieces",
    "kg",
    "meters",
    "liters",
    "boxes",
    "pallets",
    "rolls",
    "sheets",
  ],
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
  addStockItem: async (itemData) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API call for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newItem = {
        id: Date.now().toString(),
        itemName: itemData.itemName,
        category: itemData.category,
        quantity: parseInt(itemData.quantity) || 0,
        unit: itemData.unit,
        location: itemData.location,
        supplier: itemData.supplier,
        batchNumber: itemData.batchNumber,
        expiryDate: itemData.expiryDate,
        costPrice: parseFloat(itemData.costPrice) || 0,
        sellingPrice: parseFloat(itemData.sellingPrice) || 0,
        minStockLevel: parseInt(itemData.minStockLevel) || 0,
        description: itemData.description,
        barcode: itemData.barcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "current-user", // In real app, get from auth
        photos: itemData.photos || [],
        status: "active",
      };

      // Determine stock status
      if (newItem.quantity === 0) {
        newItem.stockStatus = "out-of-stock";
      } else if (newItem.quantity <= newItem.minStockLevel) {
        newItem.stockStatus = "low-stock";
      } else {
        newItem.stockStatus = "in-stock";
      }

      set((state) => ({
        stockItems: [newItem, ...state.stockItems],
        isLoading: false,
        error: null,
        lastSync: new Date().toISOString(),
      }));

      // Update statistics
      get().calculateStats();

      // Emit socket event for real-time updates
      socketService.emit("stockAdded", newItem);

      return { success: true, item: newItem };
    } catch (error) {
      console.error("Error adding stock item:", error);
      set({
        isLoading: false,
        error: error.message || "Failed to add stock item",
      });
      return { success: false, error: error.message };
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
      categories: [
        "Electronics",
        "Tools",
        "Raw Materials",
        "Finished Goods",
        "Spare Parts",
        "Consumables",
        "Chemicals",
        "Safety Equipment",
      ],
      locations: [
        "A1-01",
        "A1-02",
        "A1-03",
        "A2-01",
        "A2-02",
        "B1-01",
        "B1-02",
        "B2-01",
        "B2-02",
        "QC-01",
        "QC-02",
        "REC-01",
        "SHIP-01",
      ],
      suppliers: [
        "Acme Corp",
        "Tech Solutions Inc",
        "Global Parts Ltd",
        "Quality Materials Co",
        "Industrial Supply Pro",
      ],
      units: [
        "pieces",
        "kg",
        "meters",
        "liters",
        "boxes",
        "pallets",
        "rolls",
        "sheets",
      ],
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
