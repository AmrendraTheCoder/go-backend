import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.machineId = null;
  }

  connect(machineId = null) {
    // Get auth token from localStorage
    const authData = JSON.parse(
      localStorage.getItem("machine-tablet-auth") || "{}"
    );
    const token = authData.state?.token;

    if (!token) {
      console.warn("No auth token available for socket connection");
      return;
    }

    this.machineId = machineId || authData.state?.machineId;

    // Connect to backend socket server
    this.socket = io("http://localhost:3001", {
      auth: {
        token: token,
        deviceType: "machine_tablet",
        machineId: this.machineId,
      },
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Machine tablet socket connected:", this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Join machine-specific room
      if (this.machineId) {
        this.socket.emit("join_machine_room", this.machineId);
      }

      // Emit machine tablet online status
      this.socket.emit("machine_tablet_online", {
        machineId: this.machineId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Machine tablet socket disconnected:", reason);
      this.isConnected = false;

      // Auto-reconnect for certain disconnect reasons
      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't reconnect
        return;
      }

      this.attemptReconnect();
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔥 Socket connection error:", error);
      this.isConnected = false;
      this.attemptReconnect();
    });

    // Machine-specific events
    this.socket.on("machine_job_assigned", (data) => {
      console.log("📋 New job assigned to machine:", data);
      this.notifyListeners("job:assigned", data);
    });

    this.socket.on("machine_job_updated", (data) => {
      console.log("🔄 Job updated for machine:", data);
      this.notifyListeners("job:updated", data);
    });

    this.socket.on("machine_job_cancelled", (data) => {
      console.log("❌ Job cancelled for machine:", data);
      this.notifyListeners("job:cancelled", data);
    });

    this.socket.on("machine_priority_change", (data) => {
      console.log("⚡ Job priority changed:", data);
      this.notifyListeners("job:priority_changed", data);
    });

    // Machine status events
    this.socket.on("machine_maintenance_scheduled", (data) => {
      console.log("🔧 Maintenance scheduled:", data);
      this.notifyListeners("machine:maintenance_scheduled", data);
    });

    this.socket.on("machine_alert", (data) => {
      console.log("🚨 Machine alert:", data);
      this.notifyListeners("machine:alert", data);
    });

    // Operator communication events
    this.socket.on("operator_message", (data) => {
      console.log("💬 Operator message:", data);
      this.notifyListeners("operator:message", data);
    });

    this.socket.on("shift_update", (data) => {
      console.log("🕐 Shift update:", data);
      this.notifyListeners("operator:shift_update", data);
    });

    // System notifications
    this.socket.on("system_notification", (data) => {
      console.log("📢 System notification:", data);
      this.notifyListeners("system:notification", data);
    });

    // Real-time job queue updates
    this.socket.on("job_queue_updated", (data) => {
      console.log("📝 Job queue updated:", data);
      this.notifyListeners("queue:updated", data);
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.notifyListeners("connection:failed", {
        message: "Unable to connect to server. Please check your connection.",
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      // Emit machine tablet offline status
      this.socket.emit("machine_tablet_offline", {
        machineId: this.machineId,
        timestamp: new Date().toISOString(),
      });

      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.machineId = null;
    this.eventListeners.clear();
  }

  // Subscribe to specific events
  subscribe(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.eventListeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Emit machine-specific events
  emitJobStatusUpdate(jobId, status, notes = "") {
    if (this.socket && this.isConnected) {
      this.socket.emit("machine_job_status_update", {
        jobId,
        status,
        notes,
        machineId: this.machineId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  emitMachineIssue(issue) {
    if (this.socket && this.isConnected) {
      this.socket.emit("machine_issue_report", {
        ...issue,
        machineId: this.machineId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  emitOperatorStatus(status) {
    if (this.socket && this.isConnected) {
      this.socket.emit("operator_status_update", {
        status,
        machineId: this.machineId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  emitJobPhotoUpload(jobId, photoData) {
    if (this.socket && this.isConnected) {
      this.socket.emit("job_photo_uploaded", {
        jobId,
        photoData,
        machineId: this.machineId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      machineId: this.machineId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Force reconnection
  forceReconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }
}

// Create and export singleton instance
const socketService = new SocketService();
export default socketService;
