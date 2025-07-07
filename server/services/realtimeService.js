/**
 * Real-time Service
 * Provides easy-to-use methods for emitting real-time events from API routes
 */
class RealtimeService {
  constructor(socketHandler) {
    this.socketHandler = socketHandler;
  }

  // Job-related events
  jobCreated(jobData) {
    this.socketHandler.broadcastJobCreated({
      id: jobData._id || jobData.id,
      title: jobData.basicInfo?.jobName || jobData.title,
      status: jobData.status,
      priority: jobData.priority,
      assignedMachine: jobData.jobDetails?.assignedMachine,
      customerName: jobData.basicInfo?.partyName,
      createdBy: jobData.createdBy,
      estimatedCost: jobData.costCalculation?.totalCost,
      type: "job_created",
    });
  }

  jobStatusUpdated(jobData, previousStatus = null) {
    this.socketHandler.broadcastJobStatusUpdate({
      id: jobData._id || jobData.id,
      status: jobData.status,
      previousStatus,
      title: jobData.basicInfo?.jobName || jobData.title,
      assignedMachine: jobData.jobDetails?.assignedMachine,
      updatedBy: jobData.lastUpdatedBy,
      progress: jobData.progress,
      type: "job_status_updated",
    });
  }

  jobProgressUpdated(jobData) {
    this.socketHandler.broadcastJobProgress({
      id: jobData._id || jobData.id,
      progress: jobData.progress,
      status: jobData.status,
      assignedMachine: jobData.jobDetails?.assignedMachine,
      title: jobData.basicInfo?.jobName || jobData.title,
      currentStep: jobData.currentStep,
      completedSteps: jobData.completedSteps,
      estimatedCompletion: jobData.estimatedCompletion,
      type: "job_progress_updated",
    });
  }

  // Inventory-related events
  inventoryUpdated(inventoryData, changeType = "updated") {
    this.socketHandler.broadcastInventoryUpdate({
      id: inventoryData._id || inventoryData.id,
      paperType: inventoryData.paperType,
      paperSize: inventoryData.paperSize,
      gsm: inventoryData.gsm,
      quantity: inventoryData.quantity,
      units: inventoryData.units,
      partyName: inventoryData.partyName,
      changeType, // 'added', 'updated', 'removed'
      updatedBy: inventoryData.lastUpdatedBy,
      type: "inventory_updated",
    });
  }

  stockAlert(alertData) {
    this.socketHandler.broadcastStockAlert({
      type: alertData.type, // 'low_stock', 'out_of_stock', 'reorder_needed'
      paperType: alertData.paperType,
      paperSize: alertData.paperSize,
      gsm: alertData.gsm,
      currentQuantity: alertData.currentQuantity,
      minimumQuantity: alertData.minimumQuantity,
      severity: alertData.severity, // 'low', 'medium', 'high', 'critical'
      message: alertData.message,
      partyName: alertData.partyName,
    });
  }

  // Machine-related events
  machineStatusUpdated(machineData) {
    this.socketHandler.broadcastMachineStatus({
      machineId: machineData.machineId,
      status: machineData.status,
      currentJob: machineData.currentJobId,
      operator: machineData.operatorName,
      efficiency: machineData.efficiency,
      lastMaintenance: machineData.lastMaintenance,
      type: "machine_status_updated",
    });
  }

  // Quality control events
  qualityCheckAdded(qualityData) {
    this.socketHandler.broadcastQualityCheck({
      jobId: qualityData.jobId,
      checkType: qualityData.checkType,
      result: qualityData.result, // 'passed', 'failed', 'needs_review'
      inspector: qualityData.inspector,
      notes: qualityData.notes,
      images: qualityData.images,
      timestamp: qualityData.timestamp,
      type: "quality_check_added",
    });
  }

  // User management events
  userConnected(userData) {
    this.socketHandler.broadcastNotification(
      {
        type: "user_connected",
        message: `${userData.name} (${userData.role}) has joined`,
        userId: userData.userId,
        role: userData.role,
        severity: "info",
      },
      "admin_room"
    );
  }

  userDisconnected(userData) {
    this.socketHandler.broadcastNotification(
      {
        type: "user_disconnected",
        message: `${userData.name} (${userData.role}) has left`,
        userId: userData.userId,
        role: userData.role,
        severity: "info",
      },
      "admin_room"
    );
  }

  // General notifications
  systemNotification(notificationData, targetRoom = null) {
    this.socketHandler.broadcastNotification(
      {
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        severity: notificationData.severity, // 'info', 'warning', 'error', 'success'
        action: notificationData.action, // Optional action button
        data: notificationData.data,
      },
      targetRoom
    );
  }

  // Admin notifications
  adminAlert(alertData) {
    this.socketHandler.broadcastNotification(
      {
        type: "admin_alert",
        title: alertData.title,
        message: alertData.message,
        severity: alertData.severity,
        source: alertData.source,
        data: alertData.data,
      },
      "admin_room"
    );
  }

  // Production metrics update
  productionMetricsUpdated(metricsData) {
    this.socketHandler.broadcastToRoom(
      "admin_room",
      "production-metrics-updated",
      {
        dailyProduction: metricsData.dailyProduction,
        machineEfficiency: metricsData.machineEfficiency,
        activeJobs: metricsData.activeJobs,
        completedJobs: metricsData.completedJobs,
        pendingJobs: metricsData.pendingJobs,
        inventoryStatus: metricsData.inventoryStatus,
        type: "production_metrics_updated",
      }
    );
  }

  // Cost calculation updates
  costCalculationUpdated(jobId, costData) {
    this.socketHandler.broadcastToRoom(
      `job_${jobId}`,
      "cost-calculation-updated",
      {
        jobId,
        materialCost: costData.materialCost,
        laborCost: costData.laborCost,
        overheadCost: costData.overheadCost,
        totalCost: costData.totalCost,
        profitMargin: costData.profitMargin,
        customerPrice: costData.customerPrice,
        type: "cost_calculation_updated",
      }
    );
  }

  // Emergency alerts
  emergencyAlert(alertData) {
    // Broadcast to all users for emergency situations
    this.socketHandler.broadcastNotification({
      type: "emergency_alert",
      title: alertData.title,
      message: alertData.message,
      severity: "critical",
      requiresAcknowledgment: true,
      data: alertData.data,
    });
  }

  // Maintenance alerts
  maintenanceAlert(machineId, alertData) {
    this.socketHandler.broadcastNotification(
      {
        type: "maintenance_alert",
        title: `Machine ${machineId} Maintenance Required`,
        message: alertData.message,
        severity: alertData.severity,
        machineId,
        maintenanceType: alertData.maintenanceType,
        dueDate: alertData.dueDate,
      },
      "admin_room"
    );
  }

  // Custom event emission for specific needs
  emitToRoom(roomName, eventName, data) {
    this.socketHandler.broadcastToRoom(roomName, eventName, data);
  }

  emitToUser(userId, eventName, data) {
    const userSession = this.socketHandler.connectedUsers.get(userId);
    if (userSession) {
      this.socketHandler.io.to(userSession.socketId).emit(eventName, {
        ...data,
        timestamp: new Date(),
      });
    }
  }

  // Get real-time system status
  getSystemStatus() {
    return {
      connectedUsers: this.socketHandler.getConnectedUsersInfo(),
      roomStats: this.socketHandler.getRoomStats(),
      totalConnections: this.socketHandler.connectedUsers.size,
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }
}

module.exports = RealtimeService;
