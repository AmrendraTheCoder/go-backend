const jwt = require("jsonwebtoken");
const config = require("../config");

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Store user sessions
    this.rooms = {
      ADMIN: "admin_room",
      MACHINE_1: "machine_1_room",
      MACHINE_2: "machine_2_room",
      STOCK_MANAGEMENT: "stock_room",
      JOB_COORDINATORS: "job_coordinators_room",
      ALL_USERS: "all_users_room",
    };
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, config.security.jwtSecret);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userName = decoded.name;

        next();
      } catch (error) {
        next(new Error("Invalid authentication token"));
      }
    });

    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    console.log(
      `🔗 User connected: ${socket.userName} (${socket.userRole}) - Socket: ${socket.id}`
    );

    // Store user session
    this.connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userName: socket.userName,
      userRole: socket.userRole,
      connectedAt: new Date(),
      rooms: [],
    });

    // Auto-join user to appropriate rooms based on role
    this.autoJoinRooms(socket);

    // Send connection confirmation
    socket.emit("connection-confirmed", {
      message: "Successfully connected to real-time updates",
      userId: socket.userId,
      role: socket.userRole,
      availableRooms: this.getAvailableRooms(socket.userRole),
      timestamp: new Date(),
    });

    // Broadcast user connection to admins
    this.broadcastToRoom(this.rooms.ADMIN, "user-connected", {
      userId: socket.userId,
      userName: socket.userName,
      role: socket.userRole,
      timestamp: new Date(),
    });

    // Event handlers
    this.setupSocketEvents(socket);
  }

  autoJoinRooms(socket) {
    const userSession = this.connectedUsers.get(socket.userId);

    // All users join the general room
    socket.join(this.rooms.ALL_USERS);
    userSession.rooms.push(this.rooms.ALL_USERS);

    // Role-based room assignments
    switch (socket.userRole) {
      case "admin":
      case "plant_supervisor":
        socket.join(this.rooms.ADMIN);
        socket.join(this.rooms.JOB_COORDINATORS);
        socket.join(this.rooms.STOCK_MANAGEMENT);
        socket.join(this.rooms.MACHINE_1);
        socket.join(this.rooms.MACHINE_2);
        userSession.rooms.push(
          this.rooms.ADMIN,
          this.rooms.JOB_COORDINATORS,
          this.rooms.STOCK_MANAGEMENT,
          this.rooms.MACHINE_1,
          this.rooms.MACHINE_2
        );
        break;

      case "job_coordinator":
        socket.join(this.rooms.JOB_COORDINATORS);
        userSession.rooms.push(this.rooms.JOB_COORDINATORS);
        break;

      case "machine_operator":
        // Join specific machine room based on assignment
        if (socket.machineId === "1" || socket.machineId === 1) {
          socket.join(this.rooms.MACHINE_1);
          userSession.rooms.push(this.rooms.MACHINE_1);
        } else if (socket.machineId === "2" || socket.machineId === 2) {
          socket.join(this.rooms.MACHINE_2);
          userSession.rooms.push(this.rooms.MACHINE_2);
        }
        break;

      case "stock_manager":
        socket.join(this.rooms.STOCK_MANAGEMENT);
        userSession.rooms.push(this.rooms.STOCK_MANAGEMENT);
        break;
    }

    console.log(`👥 User ${socket.userName} joined rooms:`, userSession.rooms);
  }

  setupSocketEvents(socket) {
    const userSession = this.connectedUsers.get(socket.userId);

    // Manual room management
    socket.on("join-room", (roomName) => {
      if (this.canJoinRoom(socket.userRole, roomName)) {
        socket.join(roomName);
        userSession.rooms.push(roomName);
        socket.emit("room-joined", { room: roomName, timestamp: new Date() });
        console.log(`📍 ${socket.userName} joined room: ${roomName}`);
      } else {
        socket.emit("room-join-denied", {
          room: roomName,
          reason: "Insufficient permissions",
        });
      }
    });

    socket.on("leave-room", (roomName) => {
      socket.leave(roomName);
      userSession.rooms = userSession.rooms.filter((room) => room !== roomName);
      socket.emit("room-left", { room: roomName, timestamp: new Date() });
      console.log(`📤 ${socket.userName} left room: ${roomName}`);
    });

    // Job-related events
    socket.on("subscribe-job-updates", (jobId) => {
      const jobRoom = `job_${jobId}`;
      socket.join(jobRoom);
      userSession.rooms.push(jobRoom);
      socket.emit("subscribed-to-job", { jobId, timestamp: new Date() });
    });

    socket.on("unsubscribe-job-updates", (jobId) => {
      const jobRoom = `job_${jobId}`;
      socket.leave(jobRoom);
      userSession.rooms = userSession.rooms.filter((room) => room !== jobRoom);
      socket.emit("unsubscribed-from-job", { jobId, timestamp: new Date() });
    });

    // Machine status events
    socket.on("machine-status-update", (statusData) => {
      if (
        socket.userRole === "machine_operator" ||
        socket.userRole === "admin"
      ) {
        this.broadcastMachineStatus(statusData, socket);
      }
    });

    // Ping/pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      this.handleDisconnection(socket);
    });
  }

  handleDisconnection(socket) {
    console.log(
      `🔌 User disconnected: ${socket.userName} - Socket: ${socket.id}`
    );

    // Remove user session
    this.connectedUsers.delete(socket.userId);

    // Broadcast disconnection to admins
    this.broadcastToRoom(this.rooms.ADMIN, "user-disconnected", {
      userId: socket.userId,
      userName: socket.userName,
      role: socket.userRole,
      timestamp: new Date(),
    });
  }

  // Utility methods for room permissions
  canJoinRoom(userRole, roomName) {
    const rolePermissions = {
      admin: [
        this.rooms.ADMIN,
        this.rooms.MACHINE_1,
        this.rooms.MACHINE_2,
        this.rooms.STOCK_MANAGEMENT,
        this.rooms.JOB_COORDINATORS,
        this.rooms.ALL_USERS,
      ],
      plant_supervisor: [
        this.rooms.ADMIN,
        this.rooms.MACHINE_1,
        this.rooms.MACHINE_2,
        this.rooms.STOCK_MANAGEMENT,
        this.rooms.JOB_COORDINATORS,
        this.rooms.ALL_USERS,
      ],
      job_coordinator: [this.rooms.JOB_COORDINATORS, this.rooms.ALL_USERS],
      machine_operator: [
        this.rooms.MACHINE_1,
        this.rooms.MACHINE_2,
        this.rooms.ALL_USERS,
      ],
      stock_manager: [this.rooms.STOCK_MANAGEMENT, this.rooms.ALL_USERS],
    };

    return rolePermissions[userRole]?.includes(roomName) || false;
  }

  getAvailableRooms(userRole) {
    const rolePermissions = {
      admin: [
        this.rooms.ADMIN,
        this.rooms.MACHINE_1,
        this.rooms.MACHINE_2,
        this.rooms.STOCK_MANAGEMENT,
        this.rooms.JOB_COORDINATORS,
        this.rooms.ALL_USERS,
      ],
      plant_supervisor: [
        this.rooms.ADMIN,
        this.rooms.MACHINE_1,
        this.rooms.MACHINE_2,
        this.rooms.STOCK_MANAGEMENT,
        this.rooms.JOB_COORDINATORS,
        this.rooms.ALL_USERS,
      ],
      job_coordinator: [this.rooms.JOB_COORDINATORS, this.rooms.ALL_USERS],
      machine_operator: [
        this.rooms.MACHINE_1,
        this.rooms.MACHINE_2,
        this.rooms.ALL_USERS,
      ],
      stock_manager: [this.rooms.STOCK_MANAGEMENT, this.rooms.ALL_USERS],
    };

    return rolePermissions[userRole] || [this.rooms.ALL_USERS];
  }

  // Public methods for emitting events from routes
  broadcastJobCreated(jobData) {
    console.log("📢 Broadcasting job created:", jobData.id);
    this.io.to(this.rooms.ALL_USERS).emit("job-created", {
      ...jobData,
      timestamp: new Date(),
    });
  }

  broadcastJobStatusUpdate(jobData) {
    console.log(
      "📢 Broadcasting job status update:",
      jobData.id,
      jobData.status
    );
    this.io.to(this.rooms.ALL_USERS).emit("job-status-updated", {
      ...jobData,
      timestamp: new Date(),
    });

    // Also broadcast to specific job room
    this.io.to(`job_${jobData.id}`).emit("job-status-updated", {
      ...jobData,
      timestamp: new Date(),
    });
  }

  broadcastJobProgress(jobData) {
    console.log("📢 Broadcasting job progress:", jobData.id, jobData.progress);

    // Determine target rooms based on job assignment
    const targetRooms = [this.rooms.ALL_USERS, `job_${jobData.id}`];

    if (jobData.assignedMachine === 1 || jobData.assignedMachine === "1") {
      targetRooms.push(this.rooms.MACHINE_1);
    } else if (
      jobData.assignedMachine === 2 ||
      jobData.assignedMachine === "2"
    ) {
      targetRooms.push(this.rooms.MACHINE_2);
    }

    targetRooms.forEach((room) => {
      this.io.to(room).emit("job-progress-updated", {
        ...jobData,
        timestamp: new Date(),
      });
    });
  }

  broadcastInventoryUpdate(inventoryData) {
    console.log("📢 Broadcasting inventory update:", inventoryData.id);
    this.io.to(this.rooms.STOCK_MANAGEMENT).emit("inventory-update", {
      ...inventoryData,
      timestamp: new Date(),
    });

    // Also notify admins
    this.io.to(this.rooms.ADMIN).emit("inventory-update", {
      ...inventoryData,
      timestamp: new Date(),
    });
  }

  broadcastStockAlert(alertData) {
    console.log("🚨 Broadcasting stock alert:", alertData.type);
    this.io.to(this.rooms.STOCK_MANAGEMENT).emit("stock-alert", {
      ...alertData,
      timestamp: new Date(),
    });

    this.io.to(this.rooms.ADMIN).emit("stock-alert", {
      ...alertData,
      timestamp: new Date(),
    });
  }

  broadcastMachineStatus(statusData, originSocket) {
    console.log("🏭 Broadcasting machine status:", statusData.machineId);

    const machineRoom =
      statusData.machineId === 1 || statusData.machineId === "1"
        ? this.rooms.MACHINE_1
        : this.rooms.MACHINE_2;

    // Broadcast to machine room (excluding sender)
    originSocket.to(machineRoom).emit("machine-status-updated", {
      ...statusData,
      timestamp: new Date(),
    });

    // Also notify admins
    this.io.to(this.rooms.ADMIN).emit("machine-status-updated", {
      ...statusData,
      timestamp: new Date(),
    });
  }

  broadcastQualityCheck(qualityData) {
    console.log("✅ Broadcasting quality check:", qualityData.jobId);
    this.io.to(this.rooms.ALL_USERS).emit("quality-check-added", {
      ...qualityData,
      timestamp: new Date(),
    });

    this.io.to(`job_${qualityData.jobId}`).emit("quality-check-added", {
      ...qualityData,
      timestamp: new Date(),
    });
  }

  broadcastNotification(notificationData, targetRoom = null) {
    console.log("🔔 Broadcasting notification:", notificationData.type);

    const room = targetRoom || this.rooms.ALL_USERS;
    this.io.to(room).emit("notification", {
      ...notificationData,
      timestamp: new Date(),
    });
  }

  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  // Get connected users info for admin dashboard
  getConnectedUsersInfo() {
    const users = [];
    this.connectedUsers.forEach((session, userId) => {
      users.push({
        userId,
        userName: session.userName,
        role: session.userRole,
        connectedAt: session.connectedAt,
        rooms: session.rooms,
        socketId: session.socketId,
      });
    });
    return users;
  }

  // Get room statistics
  getRoomStats() {
    const stats = {};
    Object.entries(this.rooms).forEach(([key, roomName]) => {
      const room = this.io.sockets.adapter.rooms.get(roomName);
      stats[key] = {
        roomName,
        connectedCount: room ? room.size : 0,
      };
    });
    return stats;
  }
}

module.exports = SocketHandler;
