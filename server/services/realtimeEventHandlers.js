/**
 * Real-time Event Handlers
 * Centralized event emission system for manufacturing operations
 */

class RealtimeEventHandlers {
  constructor(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // Job-related events
  emitJobCreated(jobData) {
    const event = {
      type: "job-created",
      timestamp: new Date(),
      data: {
        id: jobData._id || jobData.id,
        title: jobData.basicInfo?.jobName || jobData.title,
        status: jobData.status || "pending",
        priority: jobData.priority || "medium",
        machine: jobData.jobDetails?.assignedMachine,
        customer: jobData.basicInfo?.partyName,
        estimatedCost: jobData.costCalculation?.totalCost,
        createdBy: jobData.createdBy,
        createdAt: jobData.createdAt || new Date(),
      },
    };

    // Broadcast to relevant rooms
    this.socketHandler.broadcastToRoom("ADMIN", "job-update", event);
    this.socketHandler.broadcastToRoom("JOB_COORDINATORS", "job-update", event);

    // Notify specific machine room if assigned
    if (event.data.machine) {
      const machineRoom =
        event.data.machine === "Machine 1" ? "MACHINE_1" : "MACHINE_2";
      this.socketHandler.broadcastToRoom(machineRoom, "job-assigned", event);
    }

    console.log(`📡 Job Created Event: ${event.data.title} broadcasted`);
  }

  emitJobStatusUpdate(jobData, previousStatus) {
    const event = {
      type: "job-status-updated",
      timestamp: new Date(),
      data: {
        id: jobData._id || jobData.id,
        title: jobData.basicInfo?.jobName || jobData.title,
        status: jobData.status,
        previousStatus,
        machine: jobData.jobDetails?.assignedMachine,
        customer: jobData.basicInfo?.partyName,
        updatedBy: jobData.lastModifiedBy,
        statusMessage: this.getStatusMessage(jobData.status),
      },
    };

    // Broadcast to all relevant rooms
    this.socketHandler.broadcastToRoom("ADMIN", "job-update", event);
    this.socketHandler.broadcastToRoom("JOB_COORDINATORS", "job-update", event);

    // Notify specific machine room
    if (event.data.machine) {
      const machineRoom =
        event.data.machine === "Machine 1" ? "MACHINE_1" : "MACHINE_2";
      this.socketHandler.broadcastToRoom(
        machineRoom,
        "job-status-change",
        event
      );
    }

    console.log(
      `📡 Job Status Update: ${event.data.title} → ${event.data.status}`
    );
  }

  emitJobProgressUpdate(jobData, progressData) {
    const event = {
      type: "job-progress-updated",
      timestamp: new Date(),
      data: {
        id: jobData._id || jobData.id,
        title: jobData.basicInfo?.jobName || jobData.title,
        machine: jobData.jobDetails?.assignedMachine,
        progress: progressData,
        updatedBy: progressData.updatedBy,
      },
    };

    // Broadcast to monitoring rooms
    this.socketHandler.broadcastToRoom("ADMIN", "job-progress", event);
    this.socketHandler.broadcastToRoom(
      "JOB_COORDINATORS",
      "job-progress",
      event
    );

    // Notify specific machine room
    if (event.data.machine) {
      const machineRoom =
        event.data.machine === "Machine 1" ? "MACHINE_1" : "MACHINE_2";
      this.socketHandler.broadcastToRoom(machineRoom, "job-progress", event);
    }

    console.log(`📡 Job Progress: ${event.data.title} progress updated`);
  }

  // Inventory-related events
  emitInventoryUpdate(inventoryData, action = "updated") {
    const event = {
      type: "inventory-updated",
      timestamp: new Date(),
      action, // 'created', 'updated', 'deleted', 'low-stock'
      data: {
        id: inventoryData._id || inventoryData.id,
        partyName: inventoryData.partyName,
        paperType: inventoryData.paperType?.name || inventoryData.paperType,
        size: inventoryData.size,
        gsm: inventoryData.gsm,
        currentQuantity: inventoryData.currentQuantity,
        unit: inventoryData.unit,
        reorderLevel: inventoryData.reorderLevel,
        isLowStock: inventoryData.currentQuantity <= inventoryData.reorderLevel,
        location: inventoryData.location,
        lastModifiedBy: inventoryData.lastModifiedBy,
      },
    };

    // Broadcast to inventory management rooms
    this.socketHandler.broadcastToRoom("ADMIN", "inventory-update", event);
    this.socketHandler.broadcastToRoom(
      "STOCK_MANAGEMENT",
      "inventory-update",
      event
    );
    this.socketHandler.broadcastToRoom(
      "JOB_COORDINATORS",
      "inventory-update",
      event
    );

    console.log(
      `📡 Inventory Update: ${event.data.partyName} - ${event.data.size} (${action})`
    );
  }

  emitStockAlert(inventoryData, alertType = "low-stock") {
    const event = {
      type: "stock-alert",
      timestamp: new Date(),
      alertType, // 'low-stock', 'out-of-stock', 'reorder-needed'
      severity: alertType === "out-of-stock" ? "high" : "medium",
      data: {
        id: inventoryData._id || inventoryData.id,
        partyName: inventoryData.partyName,
        paperType: inventoryData.paperType?.name || inventoryData.paperType,
        size: inventoryData.size,
        gsm: inventoryData.gsm,
        currentQuantity: inventoryData.currentQuantity,
        reorderLevel: inventoryData.reorderLevel,
        unit: inventoryData.unit,
        message: this.getStockAlertMessage(alertType, inventoryData),
      },
    };

    // High priority broadcast for alerts
    this.socketHandler.broadcastToRoom("ADMIN", "stock-alert", event);
    this.socketHandler.broadcastToRoom(
      "STOCK_MANAGEMENT",
      "stock-alert",
      event
    );
    this.socketHandler.broadcastToRoom(
      "JOB_COORDINATORS",
      "stock-alert",
      event
    );

    console.log(`🚨 Stock Alert: ${event.data.message}`);
  }

  // Machine-related events
  emitMachineStatusUpdate(machineData) {
    const event = {
      type: "machine-status-updated",
      timestamp: new Date(),
      data: {
        id: machineData._id || machineData.id,
        name: machineData.name,
        status: machineData.status,
        currentJob: machineData.currentJob,
        operator: machineData.assignedOperator,
        lastUpdate: machineData.lastStatusUpdate,
        maintenanceStatus: machineData.maintenanceStatus,
      },
    };

    // Broadcast to monitoring rooms
    this.socketHandler.broadcastToRoom("ADMIN", "machine-update", event);
    this.socketHandler.broadcastToRoom(
      "JOB_COORDINATORS",
      "machine-update",
      event
    );

    // Notify specific machine room
    const machineRoom =
      machineData.name === "Machine 1" ? "MACHINE_1" : "MACHINE_2";
    this.socketHandler.broadcastToRoom(machineRoom, "machine-status", event);

    console.log(`📡 Machine Update: ${event.data.name} → ${event.data.status}`);
  }

  // User activity events
  emitUserActivity(userData, activity) {
    const event = {
      type: "user-activity",
      timestamp: new Date(),
      data: {
        userId: userData._id || userData.id,
        username: userData.username,
        role: userData.role,
        activity,
        timestamp: new Date(),
      },
    };

    // Broadcast to admin only for user activity monitoring
    this.socketHandler.broadcastToRoom("ADMIN", "user-activity", event);

    console.log(`👤 User Activity: ${event.data.username} - ${activity}`);
  }

  // Quality check events
  emitQualityCheckAdded(jobData, qualityData) {
    const event = {
      type: "quality-check-added",
      timestamp: new Date(),
      data: {
        jobId: jobData._id || jobData.id,
        jobTitle: jobData.basicInfo?.jobName || jobData.title,
        qualityCheck: qualityData,
        machine: jobData.jobDetails?.assignedMachine,
        checkedBy: qualityData.checkedBy,
      },
    };

    // Broadcast to monitoring rooms
    this.socketHandler.broadcastToRoom("ADMIN", "quality-update", event);
    this.socketHandler.broadcastToRoom(
      "JOB_COORDINATORS",
      "quality-update",
      event
    );

    // Notify machine room
    if (event.data.machine) {
      const machineRoom =
        event.data.machine === "Machine 1" ? "MACHINE_1" : "MACHINE_2";
      this.socketHandler.broadcastToRoom(machineRoom, "quality-check", event);
    }

    console.log(
      `🔍 Quality Check: ${event.data.jobTitle} - ${qualityData.status}`
    );
  }

  // System notifications
  emitSystemNotification(message, type = "info", targetRooms = ["ALL_USERS"]) {
    const event = {
      type: "system-notification",
      timestamp: new Date(),
      data: {
        message,
        type, // 'info', 'warning', 'error', 'success'
        severity: this.getNotificationSeverity(type),
        dismissible: true,
      },
    };

    // Broadcast to specified rooms
    targetRooms.forEach((room) => {
      this.socketHandler.broadcastToRoom(room, "notification", event);
    });

    console.log(`📢 System Notification (${type}): ${message}`);
  }

  // Utility methods
  getStatusMessage(status) {
    const statusMessages = {
      pending: "Job awaiting approval",
      approved: "Job approved and ready for production",
      "in-progress": "Job currently being processed",
      "quality-check": "Job undergoing quality inspection",
      completed: "Job completed successfully",
      "on-hold": "Job temporarily paused",
      cancelled: "Job has been cancelled",
      rejected: "Job rejected by admin",
    };
    return statusMessages[status] || "Status updated";
  }

  getStockAlertMessage(alertType, inventoryData) {
    const { partyName, size, currentQuantity, unit, reorderLevel } =
      inventoryData;

    switch (alertType) {
      case "low-stock":
        return `Low stock alert: ${partyName} - ${size} (${currentQuantity} ${unit} remaining, reorder at ${reorderLevel})`;
      case "out-of-stock":
        return `Out of stock: ${partyName} - ${size} (0 ${unit} remaining)`;
      case "reorder-needed":
        return `Reorder needed: ${partyName} - ${size} (${currentQuantity} ${unit} below reorder level of ${reorderLevel})`;
      default:
        return `Stock alert for ${partyName} - ${size}`;
    }
  }

  getNotificationSeverity(type) {
    const severityMap = {
      info: "low",
      warning: "medium",
      error: "high",
      success: "low",
    };
    return severityMap[type] || "low";
  }

  // Batch event emission for multiple updates
  emitBatchUpdate(events) {
    const batchEvent = {
      type: "batch-update",
      timestamp: new Date(),
      count: events.length,
      events,
    };

    // Broadcast batch to all rooms for efficient processing
    this.socketHandler.broadcastToRoom("ALL_USERS", "batch-update", batchEvent);

    console.log(`📦 Batch Update: ${events.length} events broadcasted`);
  }

  // Health check event for monitoring
  emitHealthCheck() {
    const event = {
      type: "health-check",
      timestamp: new Date(),
      data: {
        status: "healthy",
        connectedUsers: this.socketHandler.getConnectedUsersInfo().length,
        roomStats: this.socketHandler.getRoomStats(),
      },
    };

    // Broadcast to admin for monitoring
    this.socketHandler.broadcastToRoom("ADMIN", "health-check", event);
  }
}

module.exports = RealtimeEventHandlers;
