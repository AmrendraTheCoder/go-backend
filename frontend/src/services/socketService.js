import { io } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect() {
    const { token } = useAuthStore.getState();

    if (!token) {
      console.warn("No auth token available for socket connection");
      return;
    }

    // Connect to backend socket server
    this.socket = io("http://localhost:3001", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      this.isConnected = true;
      this.joinUserRooms();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error);
    });

    // Job-related events
    this.socket.on("job:created", (data) => {
      this.emitToListeners("job:created", data);
    });

    this.socket.on("job:updated", (data) => {
      this.emitToListeners("job:updated", data);
    });

    this.socket.on("job:deleted", (data) => {
      this.emitToListeners("job:deleted", data);
    });

    this.socket.on("job:approved", (data) => {
      this.emitToListeners("job:approved", data);
    });

    this.socket.on("job:rejected", (data) => {
      this.emitToListeners("job:rejected", data);
    });

    // Customer-related events
    this.socket.on("customer:created", (data) => {
      this.emitToListeners("customer:created", data);
    });

    this.socket.on("customer:updated", (data) => {
      this.emitToListeners("customer:updated", data);
    });

    this.socket.on("customer:deleted", (data) => {
      this.emitToListeners("customer:deleted", data);
    });

    // Inventory-related events
    this.socket.on("inventory:updated", (data) => {
      this.emitToListeners("inventory:updated", data);
    });

    this.socket.on("inventory:low_stock", (data) => {
      this.emitToListeners("inventory:low_stock", data);
    });

    this.socket.on("inventory:stock_added", (data) => {
      this.emitToListeners("inventory:stock_added", data);
    });

    // Notification events
    this.socket.on("notification", (data) => {
      this.emitToListeners("notification", data);
    });
  }

  joinUserRooms() {
    if (!this.socket || !this.isConnected) return;

    const { user } = useAuthStore.getState();
    if (user?.role) {
      // Join role-based room (admin, operator, etc.)
      this.socket.emit("join_room", `role:${user.role}`);

      // Join user-specific room
      this.socket.emit("join_room", `user:${user.id}`);

      console.log(`📡 Joined rooms: role:${user.role}, user:${user.id}`);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log("🔌 Socket disconnected");
    }
  }

  // Event listener management
  subscribe(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  emitToListeners(eventName, data) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  // Emit events to server
  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn("Socket not connected, cannot emit:", eventName);
    }
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
