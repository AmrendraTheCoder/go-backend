/**
 * Socket Manager for Ganpathi Manufacturing Operations
 * Handles real-time communication with the backend server
 */

export class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.messageQueue = [];
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
  }

  async connect(authToken) {
    if (this.connecting || this.connected) {
      console.log("🔌 Socket already connecting or connected");
      return;
    }

    this.connecting = true;
    console.log("🔌 Connecting to socket server...");

    try {
      const serverURL = this.getServerURL();

      this.socket = io(serverURL, {
        auth: {
          token: authToken,
        },
        timeout: 10000,
        transports: ["websocket", "polling"],
        forceNew: true,
      });

      this.setupEventListeners();

      // Wait for connection with timeout
      await this.waitForConnection();

      console.log("✅ Socket connected successfully");
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;

      // Process queued messages
      this.processMessageQueue();

      // Start heartbeat
      this.startHeartbeat();
    } catch (error) {
      console.error("❌ Socket connection failed:", error);
      this.connecting = false;
      this.handleConnectionError(error);
      throw error;
    }
  }

  getServerURL() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    } else {
      // Production - adjust as needed
      return window.location.origin;
    }
  }

  waitForConnection() {
    return new Promise((resolve, reject) => {
      this.connectionTimeout = setTimeout(() => {
        reject(new Error("Socket connection timeout"));
      }, 10000);

      this.socket.once("connect", () => {
        clearTimeout(this.connectionTimeout);
        resolve();
      });

      this.socket.once("connect_error", (error) => {
        clearTimeout(this.connectionTimeout);
        reject(error);
      });
    });
  }

  setupEventListeners() {
    // Connection events
    this.socket.on("connect", () => {
      console.log("🔌 Socket connected");
      this.connected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners("connected", true);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      this.connected = false;
      this.notifyListeners("disconnected", reason);

      // Attempt reconnection for certain reasons
      if (reason === "io server disconnect") {
        console.log("🔄 Server initiated disconnect, not reconnecting");
      } else {
        this.attemptReconnection();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error);
      this.handleConnectionError(error);
    });

    // Authentication events
    this.socket.on("authenticated", (data) => {
      console.log("🔐 Socket authenticated:", data);
      this.notifyListeners("authenticated", data);
    });

    this.socket.on("authentication_error", (error) => {
      console.error("🔐 Socket authentication error:", error);
      this.notifyListeners("authentication_error", error);
      this.disconnect();
    });

    // Manufacturing-specific events
    this.socket.on("job_status_update", (data) => {
      console.log("📋 Job status update:", data);
      this.notifyListeners("job_status_update", data);
    });

    this.socket.on("inventory_alert", (data) => {
      console.log("📦 Inventory alert:", data);
      this.notifyListeners("inventory_alert", data);
    });

    this.socket.on("machine_update", (data) => {
      console.log("🏭 Machine update:", data);
      this.notifyListeners("machine_update", data);
    });

    this.socket.on("system_notification", (data) => {
      console.log("🔔 System notification:", data);
      this.notifyListeners("system_notification", data);
    });

    this.socket.on("user_notification", (data) => {
      console.log("👤 User notification:", data);
      this.notifyListeners("user_notification", data);
    });

    // Real-time data events
    this.socket.on("dashboard_update", (data) => {
      this.notifyListeners("dashboard_update", data);
    });

    this.socket.on("production_metrics", (data) => {
      this.notifyListeners("production_metrics", data);
    });

    // Error handling
    this.socket.on("error", (error) => {
      console.error("🔌 Socket error:", error);
      this.notifyListeners("error", error);
    });

    // Heartbeat
    this.socket.on("pong", () => {
      // Server responded to ping
    });
  }

  handleConnectionError(error) {
    console.error("Socket connection error:", error);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnection();
    } else {
      console.error("❌ Max reconnection attempts reached");
      this.notifyListeners("max_reconnects_reached", error);
    }
  }

  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("❌ Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`
    );

    setTimeout(() => {
      if (!this.connected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect() {
    console.log("🔌 Disconnecting socket...");

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Socket listener error for event '${event}':`, error);
        }
      });
    }
  }

  // Message sending
  emit(event, data = {}) {
    if (this.connected && this.socket) {
      console.log(`📤 Emitting: ${event}`, data);
      this.socket.emit(event, data);
    } else {
      console.log(`📤 Queueing message: ${event}`, data);
      this.messageQueue.push({ event, data });
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      this.emit(event, data);
    }
  }

  // Manufacturing-specific methods
  updateJobStatus(jobId, status, sectionData = {}) {
    this.emit("update_job_status", {
      jobId,
      status,
      sectionData,
      timestamp: new Date().toISOString(),
    });
  }

  updateMachineStatus(machineId, status, operatorId = null) {
    this.emit("update_machine_status", {
      machineId,
      status,
      operatorId,
      timestamp: new Date().toISOString(),
    });
  }

  reportInventoryUsage(itemId, quantityUsed, jobId = null) {
    this.emit("inventory_usage", {
      itemId,
      quantityUsed,
      jobId,
      timestamp: new Date().toISOString(),
    });
  }

  requestDashboardUpdate() {
    this.emit("request_dashboard_update");
  }

  joinRoom(roomName) {
    this.emit("join_room", { room: roomName });
  }

  leaveRoom(roomName) {
    this.emit("leave_room", { room: roomName });
  }

  // Heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.socket) {
        this.socket.emit("ping");
      }
    }, 30000); // Every 30 seconds
  }

  // Connection status
  isConnected() {
    return this.connected;
  }

  isConnecting() {
    return this.connecting;
  }

  getConnectionStatus() {
    if (this.connected) return "connected";
    if (this.connecting) return "connecting";
    return "disconnected";
  }

  // Utility methods
  getSocket() {
    return this.socket;
  }

  getReconnectAttempts() {
    return this.reconnectAttempts;
  }

  clearMessageQueue() {
    this.messageQueue = [];
  }

  // Debug methods
  debug() {
    console.log("SocketManager Debug Info:");
    console.log("Connected:", this.connected);
    console.log("Connecting:", this.connecting);
    console.log("Reconnect attempts:", this.reconnectAttempts);
    console.log("Message queue length:", this.messageQueue.length);
    console.log("Active listeners:", Array.from(this.listeners.keys()));
    console.log("Socket ID:", this.socket?.id);
  }

  // Factory mode optimizations
  enableFactoryMode() {
    // More frequent heartbeat for shop floor reliability
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.socket) {
        this.socket.emit("ping");
      }
    }, 15000); // Every 15 seconds

    // Faster reconnection
    this.reconnectDelay = 500;
    this.maxReconnectAttempts = 10;
  }

  disableFactoryMode() {
    // Standard heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.startHeartbeat();

    // Standard reconnection
    this.reconnectDelay = 1000;
    this.maxReconnectAttempts = 5;
  }
}
