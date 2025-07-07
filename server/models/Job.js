const mongoose = require("mongoose");

// Progress tracking schema for machine operators
const progressUpdateSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: [
        "preparation",
        "printing",
        "finishing",
        "quality_check",
        "packaging",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "on_hold"],
      default: "pending",
    },
    startTime: Date,
    endTime: Date,
    notes: String,
    photos: [String], // URLs to uploaded photos
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    machineId: String,
    qualityMetrics: {
      defectCount: { type: Number, default: 0 },
      qualityScore: { type: Number, min: 0, max: 100 },
      notes: String,
    },
  },
  { timestamps: true }
);

// Material usage tracking
const materialUsageSchema = new mongoose.Schema(
  {
    materialType: { type: String, required: true },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    quantityUsed: { type: Number, required: true },
    quantityWasted: { type: Number, default: 0 },
    unit: { type: String, required: true },
    cost: { type: Number, required: true },
    usageDate: { type: Date, default: Date.now },
    notes: String,
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    // Auto-generated job ID
    jobId: {
      type: String,
      unique: true,
      index: true,
    },

    // SECTION 1: BASIC INFO
    basicInfo: {
      jobName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      jobDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
      partyName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },
    },

    // SECTION 2: JOB DETAILS
    jobDetails: {
      jobType: {
        type: String,
        enum: ["single-single", "front-back"],
        required: true,
      },
      plates: {
        type: Number,
        required: true,
        min: 1,
      },
      paperSize: {
        name: { type: String, required: true }, // e.g., "A4", "Letter"
        dimensions: {
          width: { type: Number, required: true }, // in inches
          height: { type: Number, required: true }, // in inches
        },
        squareInches: { type: Number, required: true }, // auto-calculated
      },
      paperSheets: {
        type: Number,
        required: true,
        min: 1,
      },
      impressions: {
        type: Number,
        required: true,
        min: 1,
        // Auto-calculated: Single-single = 1 × Paper Sheets, Front-back = 2 × Paper Sheets
        // But can be manually overridden
      },
      paperType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaperType",
        required: true,
      },
      gsm: {
        type: Number,
        required: true,
        min: 70,
        max: 330,
      },
      paperProvidedByParty: {
        type: Boolean,
        default: false,
      },
    },

    // SECTION 3: COST CALCULATION AND MACHINE ASSIGNMENT
    costCalculation: {
      assignedMachine: {
        type: String,
        enum: ["machine_1", "machine_2"],
        required: true,
        index: true,
      },
      ratePerUnit: {
        type: Number,
        required: true,
        min: 0,
      },
      platePricePerPlate: {
        type: Number,
        required: true,
        min: 0,
      },
      printingCost: {
        type: Number,
        min: 0,
        // Calculated: Rate × Impressions + Plate Price × Plates
      },
      platePriceCost: {
        type: Number,
        min: 0,
        // Calculated: Plate Price × Plates
      },
      uvCoatingCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      bakingCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCost: {
        type: Number,
        min: 0,
        // Sum of all costs
      },
    },

    // SECTION 4: JOB SHEET REVIEW (Meta information)
    review: {
      reviewed: {
        type: Boolean,
        default: false,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewDate: Date,
      reviewNotes: String,
    },

    // Current status and workflow
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "draft",
      index: true,
    },

    // Priority and scheduling
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    // Time tracking
    estimatedDuration: { type: Number }, // in hours
    actualDuration: { type: Number }, // in hours
    dueDate: Date,
    startDate: Date,
    completionDate: Date,

    // Material and resource requirements
    materialRequirements: [materialUsageSchema],
    toolsRequired: [String],
    skillsRequired: [String],

    // Assigned operators
    assignedOperators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Progress tracking
    progressUpdates: [progressUpdateSchema],
    currentProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Quality and completion
    qualityChecks: [
      {
        checkType: String,
        result: { type: String, enum: ["pass", "fail", "rework"] },
        notes: String,
        checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        checkDate: { type: Date, default: Date.now },
      },
    ],

    // AI insights and analytics
    aiInsights: {
      estimatedCompletionTime: Date,
      riskFactors: [String],
      optimizationSuggestions: [String],
      bottleneckPredictions: [String],
      efficiencyScore: { type: Number, min: 0, max: 100 },
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: String,

    // Notes and attachments
    notes: String,
    attachments: [String], // URLs to uploaded files

    // Dependencies
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
jobSchema.index({ status: 1, priority: 1, createdDate: -1 });
jobSchema.index({ "costCalculation.assignedMachine": 1, status: 1 });
jobSchema.index({ "basicInfo.partyName": 1 });
jobSchema.index({ "basicInfo.jobDate": -1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ dueDate: 1 });

// Virtual for progress percentage
jobSchema.virtual("progressPercentage").get(function () {
  if (this.status === "completed") return 100;
  if (this.status === "draft" || this.status === "rejected") return 0;

  // Calculate based on progress entries
  const progressSteps = this.progressUpdates.length;
  if (progressSteps === 0) return 0;

  // Simple calculation based on status
  switch (this.status) {
    case "pending_approval":
      return 5;
    case "approved":
      return 10;
    case "in_progress":
      return Math.min(20 + progressSteps * 15, 90);
    case "on_hold":
      return Math.min(30 + progressSteps * 10, 80);
    default:
      return this.currentProgress || 0;
  }
});

// Pre-save middleware to auto-generate jobId
jobSchema.pre("save", async function (next) {
  if (!this.jobId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Find the highest job number for today
    const datePrefix = `JOB${year}${month}${day}`;
    const lastJob = await this.constructor
      .findOne({
        jobId: { $regex: `^${datePrefix}` },
      })
      .sort({ jobId: -1 });

    let nextNumber = 1;
    if (lastJob) {
      const lastNumber = parseInt(lastJob.jobId.slice(-3));
      nextNumber = lastNumber + 1;
    }

    this.jobId = `${datePrefix}${nextNumber.toString().padStart(3, "0")}`;
  }
  next();
});

// Pre-save middleware to auto-calculate costs and impressions
jobSchema.pre("save", function (next) {
  // Auto-calculate square inches
  if (this.jobDetails.paperSize.dimensions) {
    this.jobDetails.paperSize.squareInches =
      this.jobDetails.paperSize.dimensions.width *
      this.jobDetails.paperSize.dimensions.height;
  }

  // Auto-calculate impressions if not manually set
  if (this.jobDetails.paperSheets && this.jobDetails.jobType) {
    const baseImpressions =
      this.jobDetails.jobType === "single-single"
        ? this.jobDetails.paperSheets
        : this.jobDetails.paperSheets * 2;

    // Only auto-calculate if impressions is not already set or is 0
    if (!this.jobDetails.impressions || this.jobDetails.impressions === 0) {
      this.jobDetails.impressions = baseImpressions;
    }
  }

  // Auto-calculate costs
  if (this.costCalculation) {
    // Calculate plate price cost
    if (this.jobDetails.plates && this.costCalculation.platePricePerPlate) {
      this.costCalculation.platePriceCost =
        this.jobDetails.plates * this.costCalculation.platePricePerPlate;
    }

    // Calculate printing cost
    if (
      this.jobDetails.impressions &&
      this.costCalculation.ratePerUnit &&
      this.costCalculation.platePriceCost
    ) {
      this.costCalculation.printingCost =
        this.jobDetails.impressions * this.costCalculation.ratePerUnit +
        this.costCalculation.platePriceCost;
    }

    // Calculate total cost
    this.costCalculation.totalCost =
      (this.costCalculation.printingCost || 0) +
      (this.costCalculation.uvCoatingCost || 0) +
      (this.costCalculation.bakingCost || 0);
  }

  next();
});

// Static method to get jobs summary
jobSchema.statics.getSummary = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgDuration: { $avg: "$actualDuration" },
        totalCost: { $sum: "$costCalculation.totalCost" },
      },
    },
  ]);
};

// Instance method to update progress
jobSchema.methods.addProgress = function (progressData) {
  this.progressUpdates.push(progressData);

  // Auto-update status based on progress
  if (progressData.status === "completed") {
    this.status = "completed";
    this.completionDate = new Date();
    this.currentProgress = 100;
  } else if (
    progressData.status === "in_progress" &&
    this.status === "approved"
  ) {
    this.status = "in_progress";
  }

  return this.save();
};

// Instance method to calculate customer balance impact
jobSchema.methods.updateCustomerBalance = function () {
  // This will be implemented when Customer model is integrated
  // Will automatically update customer balance when job is completed
  if (this.status === "completed" && this.costCalculation.totalCost) {
    // Update customer balance logic here
    console.log(
      `Job ${this.jobId} completed. Customer balance should be updated by ${this.costCalculation.totalCost}`
    );
  }
};

module.exports = mongoose.model("Job", jobSchema);
