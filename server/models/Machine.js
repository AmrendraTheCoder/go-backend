const mongoose = require("mongoose");

// Machine status update schema for real-time tracking
const statusUpdateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["idle", "running", "maintenance", "error", "offline"],
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: String,
    metadata: {
      speed: Number, // sheets per hour
      temperature: Number,
      pressure: Number,
      ink_levels: {
        cyan: Number,
        magenta: Number,
        yellow: Number,
        black: Number,
      },
      paper_loaded: Number, // sheets
      errors: [String],
      warnings: [String],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Maintenance record schema
const maintenanceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["routine", "preventive", "corrective", "emergency"],
      required: true,
    },
    scheduledDate: Date,
    completedDate: Date,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      required: true,
    },
    partsReplaced: [
      {
        partName: String,
        partNumber: String,
        quantity: Number,
        cost: Number,
      },
    ],
    downtime: Number, // in minutes
    cost: {
      labor: Number,
      parts: Number,
      total: Number,
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: String,
    attachments: [String],
  },
  { timestamps: true }
);

// Performance metrics schema
const performanceSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    metrics: {
      totalRuntime: Number, // in minutes
      totalJobs: Number,
      totalSheetsPrinted: Number,
      averageSpeed: Number, // sheets per hour
      efficiency: Number, // percentage
      downtime: Number, // in minutes
      qualityScore: Number, // percentage
      errorCount: Number,
      maintenanceTime: Number, // in minutes
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const machineSchema = new mongoose.Schema(
  {
    // Basic Information
    machineId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Machine Specifications
    specifications: {
      type: {
        type: String,
        enum: [
          "offset_printing",
          "digital_printing",
          "binding",
          "cutting",
          "laminating",
        ],
        default: "offset_printing",
      },
      maxPaperSize: {
        width: Number, // in inches
        height: Number,
      },
      minPaperSize: {
        width: Number,
        height: Number,
      },
      maxSpeed: Number, // sheets per hour
      colorCapability: {
        type: String,
        enum: ["black_white", "color", "spot_color"],
        default: "color",
      },
      maxGSM: Number,
      minGSM: Number,
      powerConsumption: Number, // in kW
      dimensions: {
        length: Number, // in cm
        width: Number,
        height: Number,
      },
      weight: Number, // in kg
    },

    // Current Status
    currentStatus: {
      type: String,
      enum: ["idle", "running", "maintenance", "error", "offline"],
      default: "idle",
      index: true,
    },
    currentJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    currentOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Location and Assignment
    location: {
      area: {
        type: String,
        enum: ["production_floor", "maintenance_bay", "storage"],
        default: "production_floor",
      },
      position: String, // specific location description
      coordinates: {
        x: Number,
        y: Number,
      },
    },
    assignedOperators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Operational Information
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Installation and Lifecycle
    installationDate: {
      type: Date,
      required: true,
    },
    warrantyExpiry: Date,
    expectedLifespan: Number, // in years
    currentAge: Number, // in months

    // Performance and Analytics
    totalRuntime: {
      type: Number,
      default: 0, // in hours
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    totalSheetsPrinted: {
      type: Number,
      default: 0,
    },
    averageEfficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },

    // Status History and Real-time Updates
    statusHistory: [statusUpdateSchema],

    // Maintenance
    maintenanceRecords: [maintenanceSchema],
    nextMaintenanceDue: Date,
    maintenanceInterval: {
      type: Number,
      default: 30, // days
    },

    // Performance Analytics
    performanceMetrics: [performanceSchema],

    // Alerts and Notifications
    alerts: [
      {
        type: {
          type: String,
          enum: [
            "maintenance_due",
            "low_supplies",
            "error",
            "efficiency_drop",
            "overdue_maintenance",
          ],
        },
        message: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
        acknowledgedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Supplies and Consumables
    supplies: {
      ink: {
        cyan: { level: Number, lastRefilled: Date },
        magenta: { level: Number, lastRefilled: Date },
        yellow: { level: Number, lastRefilled: Date },
        black: { level: Number, lastRefilled: Date },
      },
      paper: {
        currentLoad: Number, // sheets
        maxCapacity: Number,
      },
      other: [
        {
          name: String,
          level: Number,
          unit: String,
          lastRefilled: Date,
        },
      ],
    },

    // Settings and Configuration
    settings: {
      autoShutdown: {
        enabled: Boolean,
        idleTime: Number, // minutes
      },
      qualityChecks: {
        enabled: Boolean,
        frequency: Number, // every N sheets
      },
      notifications: {
        email: Boolean,
        sms: Boolean,
        dashboard: Boolean,
      },
    },

    // Audit Trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Additional Information
    notes: String,
    manualUrl: String,
    images: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
machineSchema.index({ currentStatus: 1, isActive: 1 });
machineSchema.index({ "location.area": 1 });
machineSchema.index({ assignedOperators: 1 });
machineSchema.index({ nextMaintenanceDue: 1 });
machineSchema.index({ "alerts.type": 1, "alerts.acknowledged": 1 });
machineSchema.index({ lastStatusUpdate: -1 });

// Virtual for utilization percentage
machineSchema.virtual("utilizationPercentage").get(function () {
  const totalHours = this.totalRuntime;
  const ageInHours = this.currentAge * 30 * 24; // rough calculation
  return ageInHours > 0 ? Math.round((totalHours / ageInHours) * 100) : 0;
});

// Virtual for maintenance status
machineSchema.virtual("maintenanceStatus").get(function () {
  if (!this.nextMaintenanceDue) return "unknown";

  const now = new Date();
  const due = new Date(this.nextMaintenanceDue);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "due_soon";
  if (diffDays <= 7) return "upcoming";
  return "good";
});

// Virtual for current efficiency
machineSchema.virtual("currentEfficiency").get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMetrics = this.performanceMetrics.find(
    (m) => m.period === "daily" && m.date.getTime() === today.getTime()
  );

  return todayMetrics
    ? todayMetrics.metrics.efficiency
    : this.averageEfficiency;
});

// Virtual for display name
machineSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.machineId})`;
});

// Pre-save middleware
machineSchema.pre("save", function (next) {
  // Calculate current age in months
  if (this.installationDate) {
    const now = new Date();
    const diffTime = Math.abs(now - this.installationDate);
    this.currentAge = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  // Update next maintenance due date
  if (this.isModified("maintenanceInterval") || this.isNew) {
    const lastMaintenance = this.maintenanceRecords
      .filter((m) => m.status === "completed")
      .sort((a, b) => b.completedDate - a.completedDate)[0];

    const baseDate = lastMaintenance
      ? lastMaintenance.completedDate
      : this.installationDate;
    this.nextMaintenanceDue = new Date(
      baseDate.getTime() + this.maintenanceInterval * 24 * 60 * 60 * 1000
    );
  }

  // Check for maintenance alerts
  if (this.nextMaintenanceDue) {
    const now = new Date();
    const diffDays = Math.ceil(
      (this.nextMaintenanceDue - now) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) {
      const existingAlert = this.alerts.find(
        (a) => a.type === "overdue_maintenance" && !a.acknowledged
      );

      if (!existingAlert) {
        this.alerts.push({
          type: "overdue_maintenance",
          message: `Maintenance is overdue by ${Math.abs(diffDays)} days`,
          severity: "critical",
        });
      }
    } else if (diffDays <= 3) {
      const existingAlert = this.alerts.find(
        (a) => a.type === "maintenance_due" && !a.acknowledged
      );

      if (!existingAlert) {
        this.alerts.push({
          type: "maintenance_due",
          message: `Maintenance due in ${diffDays} days`,
          severity: "high",
        });
      }
    }
  }

  next();
});

// Instance method to update status
machineSchema.methods.updateStatus = function (
  status,
  operatorId,
  jobId = null,
  notes = "",
  metadata = {}
) {
  this.currentStatus = status;
  this.currentOperator = operatorId;
  this.currentJob = jobId;
  this.lastStatusUpdate = new Date();

  // Add to status history
  this.statusHistory.push({
    status,
    jobId,
    operatorId,
    notes,
    metadata,
    timestamp: new Date(),
  });

  // Keep only last 100 status updates
  if (this.statusHistory.length > 100) {
    this.statusHistory = this.statusHistory.slice(-100);
  }

  return this.save();
};

// Instance method to assign job
machineSchema.methods.assignJob = function (jobId, operatorId) {
  this.currentJob = jobId;
  this.currentOperator = operatorId;
  this.currentStatus = "running";
  this.lastStatusUpdate = new Date();

  return this.updateStatus("running", operatorId, jobId, "Job assigned");
};

// Instance method to complete job
machineSchema.methods.completeJob = function (operatorId, sheetsPrinted = 0) {
  const previousJob = this.currentJob;

  this.currentJob = null;
  this.currentStatus = "idle";
  this.totalJobs += 1;
  this.totalSheetsPrinted += sheetsPrinted;

  return this.updateStatus("idle", operatorId, previousJob, "Job completed", {
    sheetsPrinted,
  });
};

// Instance method to schedule maintenance
machineSchema.methods.scheduleMaintenance = function (maintenanceData) {
  this.maintenanceRecords.push(maintenanceData);

  if (maintenanceData.scheduledDate) {
    this.nextMaintenanceDue = maintenanceData.scheduledDate;
  }

  return this.save();
};

// Instance method to acknowledge alert
machineSchema.methods.acknowledgeAlert = function (alertIndex, userId) {
  if (this.alerts[alertIndex]) {
    this.alerts[alertIndex].acknowledged = true;
    this.alerts[alertIndex].acknowledgedBy = userId;
  }

  return this.save();
};

// Static method to get active machines
machineSchema.statics.getActiveMachines = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to get machines by status
machineSchema.statics.getMachinesByStatus = function (status) {
  return this.find({ currentStatus: status, isActive: true })
    .populate("currentOperator", "firstName lastName")
    .populate("currentJob", "jobName")
    .sort({ name: 1 });
};

// Static method to get machines needing maintenance
machineSchema.statics.getMachinesNeedingMaintenance = function () {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  return this.find({
    isActive: true,
    nextMaintenanceDue: { $lte: threeDaysFromNow },
  }).sort({ nextMaintenanceDue: 1 });
};

// Static method to get machine performance summary
machineSchema.statics.getPerformanceSummary = function (period = "daily") {
  return this.aggregate([
    { $match: { isActive: true } },
    { $unwind: "$performanceMetrics" },
    { $match: { "performanceMetrics.period": period } },
    {
      $group: {
        _id: null,
        totalMachines: { $sum: 1 },
        averageEfficiency: { $avg: "$performanceMetrics.metrics.efficiency" },
        totalRuntime: { $sum: "$performanceMetrics.metrics.totalRuntime" },
        totalJobs: { $sum: "$performanceMetrics.metrics.totalJobs" },
        totalSheetsPrinted: {
          $sum: "$performanceMetrics.metrics.totalSheetsPrinted",
        },
      },
    },
  ]);
};

// Static method to search machines
machineSchema.statics.searchMachines = function (searchTerm) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { machineId: { $regex: searchTerm, $options: "i" } },
          { model: { $regex: searchTerm, $options: "i" } },
          { manufacturer: { $regex: searchTerm, $options: "i" } },
        ],
      },
    ],
  }).populate("currentOperator currentJob");
};

module.exports = mongoose.model("Machine", machineSchema);
