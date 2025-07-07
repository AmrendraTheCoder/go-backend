const express = require("express");
const router = express.Router();

// Test route for job creation event
router.post("/test/job-created", (req, res) => {
  const mockJobData = {
    _id: "test-job-" + Date.now(),
    basicInfo: {
      jobName: "Test Print Job",
      partyName: "Test Customer Co.",
    },
    jobDetails: {
      assignedMachine: req.body.machine || "Machine 1",
    },
    costCalculation: {
      totalCost: 2500,
    },
    status: "pending",
    priority: "high",
    createdBy: "test-user",
    createdAt: new Date(),
  };

  // Emit the event
  req.realtimeEvents.emitJobCreated(mockJobData);

  res.json({
    success: true,
    message: "Job created event emitted",
    data: mockJobData,
  });
});

// Test route for job status update
router.post("/test/job-status", (req, res) => {
  const { jobId, newStatus, machine } = req.body;

  const mockJobData = {
    _id: jobId || "test-job-123",
    basicInfo: {
      jobName: "Test Print Job Update",
      partyName: "Test Customer Co.",
    },
    jobDetails: {
      assignedMachine: machine || "Machine 1",
    },
    status: newStatus || "in-progress",
    lastModifiedBy: "test-operator",
  };

  // Emit the status update event
  req.realtimeEvents.emitJobStatusUpdate(mockJobData, "pending");

  res.json({
    success: true,
    message: "Job status update event emitted",
    data: mockJobData,
  });
});

// Test route for inventory update
router.post("/test/inventory-update", (req, res) => {
  const mockInventoryData = {
    _id: "inv-" + Date.now(),
    partyName: req.body.partyName || "Test Paper Supplier",
    paperType: {
      name: req.body.paperType || "A4 Bond Paper",
    },
    size: req.body.size || "A4",
    gsm: req.body.gsm || 80,
    currentQuantity: req.body.quantity || 500,
    unit: req.body.unit || "sheet",
    reorderLevel: 100,
    location: "Warehouse A",
    lastModifiedBy: "test-stock-manager",
  };

  // Emit the inventory update event
  req.realtimeEvents.emitInventoryUpdate(
    mockInventoryData,
    req.body.action || "updated"
  );

  res.json({
    success: true,
    message: "Inventory update event emitted",
    data: mockInventoryData,
  });
});

// Test route for stock alert
router.post("/test/stock-alert", (req, res) => {
  const mockInventoryData = {
    _id: "inv-low-stock-" + Date.now(),
    partyName: "Critical Paper Supplier",
    paperType: {
      name: "A4 Premium Paper",
    },
    size: "A4",
    gsm: 100,
    currentQuantity: req.body.quantity || 25,
    unit: "ream",
    reorderLevel: 50,
    location: "Warehouse B",
  };

  // Emit the stock alert
  req.realtimeEvents.emitStockAlert(
    mockInventoryData,
    req.body.alertType || "low-stock"
  );

  res.json({
    success: true,
    message: "Stock alert event emitted",
    data: mockInventoryData,
  });
});

// Test route for machine status update
router.post("/test/machine-status", (req, res) => {
  const mockMachineData = {
    _id: "machine-" + (req.body.machineId || "1"),
    name: req.body.machineName || "Machine 1",
    status: req.body.status || "running",
    currentJob: req.body.currentJob || "test-job-123",
    assignedOperator: req.body.operator || "operator-1",
    lastStatusUpdate: new Date(),
    maintenanceStatus: req.body.maintenanceStatus || "good",
  };

  // Emit the machine status update
  req.realtimeEvents.emitMachineStatusUpdate(mockMachineData);

  res.json({
    success: true,
    message: "Machine status update event emitted",
    data: mockMachineData,
  });
});

// Test route for quality check
router.post("/test/quality-check", (req, res) => {
  const mockJobData = {
    _id: req.body.jobId || "test-job-123",
    basicInfo: {
      jobName: "Quality Check Test Job",
      partyName: "Test Customer Co.",
    },
    jobDetails: {
      assignedMachine: req.body.machine || "Machine 1",
    },
  };

  const mockQualityData = {
    status: req.body.status || "passed",
    notes: req.body.notes || "Print quality excellent, no defects found",
    checkedBy: req.body.checkedBy || "quality-inspector-1",
    checkedAt: new Date(),
    score: req.body.score || 95,
  };

  // Emit the quality check event
  req.realtimeEvents.emitQualityCheckAdded(mockJobData, mockQualityData);

  res.json({
    success: true,
    message: "Quality check event emitted",
    data: { job: mockJobData, quality: mockQualityData },
  });
});

// Test route for system notification
router.post("/test/notification", (req, res) => {
  const message = req.body.message || "Test system notification";
  const type = req.body.type || "info";
  const targetRooms = req.body.targetRooms || ["ALL_USERS"];

  // Emit the system notification
  req.realtimeEvents.emitSystemNotification(message, type, targetRooms);

  res.json({
    success: true,
    message: "System notification emitted",
    data: { message, type, targetRooms },
  });
});

// Test route for batch updates
router.post("/test/batch-update", (req, res) => {
  const events = [
    {
      type: "job-created",
      data: { id: "job-1", title: "Batch Job 1", status: "pending" },
    },
    {
      type: "inventory-updated",
      data: { id: "inv-1", partyName: "Batch Supplier", quantity: 200 },
    },
    {
      type: "machine-status-updated",
      data: { id: "machine-1", name: "Machine 1", status: "idle" },
    },
  ];

  // Emit batch update
  req.realtimeEvents.emitBatchUpdate(events);

  res.json({
    success: true,
    message: "Batch update event emitted",
    data: { eventCount: events.length, events },
  });
});

// Test route for health check event
router.post("/test/health-check", (req, res) => {
  // Emit health check
  req.realtimeEvents.emitHealthCheck();

  res.json({
    success: true,
    message: "Health check event emitted",
  });
});

// Get real-time statistics
router.get("/stats", (req, res) => {
  const connectedUsers = req.socketHandler.getConnectedUsersInfo();
  const roomStats = req.socketHandler.getRoomStats();

  res.json({
    success: true,
    data: {
      connectedUsers,
      roomStats,
      totalConnections: connectedUsers.length,
      timestamp: new Date(),
    },
  });
});

// Test all events at once
router.post("/test/all-events", (req, res) => {
  setTimeout(() => {
    // Job events
    req.realtimeEvents.emitJobCreated({
      _id: "demo-job-1",
      basicInfo: { jobName: "Demo Print Job", partyName: "Demo Customer" },
      jobDetails: { assignedMachine: "Machine 1" },
      costCalculation: { totalCost: 1500 },
      status: "pending",
      priority: "medium",
    });
  }, 1000);

  setTimeout(() => {
    // Inventory events
    req.realtimeEvents.emitInventoryUpdate(
      {
        _id: "demo-inv-1",
        partyName: "Demo Supplier",
        paperType: { name: "A4 Bond" },
        size: "A4",
        gsm: 80,
        currentQuantity: 300,
        unit: "sheet",
        reorderLevel: 100,
      },
      "updated"
    );
  }, 2000);

  setTimeout(() => {
    // Stock alert
    req.realtimeEvents.emitStockAlert(
      {
        _id: "demo-inv-2",
        partyName: "Critical Supplier",
        paperType: { name: "A3 Premium" },
        size: "A3",
        gsm: 120,
        currentQuantity: 25,
        unit: "ream",
        reorderLevel: 50,
      },
      "low-stock"
    );
  }, 3000);

  setTimeout(() => {
    // Machine status
    req.realtimeEvents.emitMachineStatusUpdate({
      _id: "demo-machine-1",
      name: "Machine 1",
      status: "running",
      currentJob: "demo-job-1",
      assignedOperator: "demo-operator",
    });
  }, 4000);

  setTimeout(() => {
    // System notification
    req.realtimeEvents.emitSystemNotification(
      "Demo: All real-time events have been triggered successfully!",
      "success",
      ["ALL_USERS"]
    );
  }, 5000);

  res.json({
    success: true,
    message: "All demo events will be emitted over 5 seconds",
    events: [
      "job-created",
      "inventory-update",
      "stock-alert",
      "machine-status",
      "notification",
    ],
  });
});

module.exports = router;
