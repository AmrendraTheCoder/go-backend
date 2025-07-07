const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    status: { type: String, required: true },
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: String,
    photos: [String],
    machineParameters: {
      temperature: Number,
      pressure: Number,
      speed: Number,
      customParams: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const materialSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    itemName: String,
    quantityRequired: { type: Number, required: true },
    quantityUsed: { type: Number, default: 0 },
    unit: { type: String, default: "units" },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "in-progress",
        "completed",
        "rejected",
        "on-hold",
      ],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    createdDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dueDate: Date,
    completedDate: Date,
    specifications: {
      dimensions: String,
      materials: String,
      finishRequirements: String,
      qualityStandards: String,
      specialInstructions: String,
      blueprintFiles: [String],
    },
    assignedMachine: {
      type: String,
      index: true,
    },
    assignedOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pricingStatus: {
      type: String,
      enum: ["pending", "calculated", "approved", "rejected"],
      default: "pending",
    },
    costBreakdown: {
      materialCost: { type: Number, default: 0 },
      laborCost: { type: Number, default: 0 },
      overheadCost: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
    },
    materials: [materialSchema],
    progress: [progressSchema],
    photos: [String],
    aiInsights: [
      {
        type: { type: String },
        insight: String,
        confidence: Number,
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    estimatedDuration: Number, // in hours
    actualDuration: Number, // in hours
    qualityChecks: [
      {
        checkType: String,
        passed: Boolean,
        notes: String,
        checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        checkedAt: { type: Date, default: Date.now },
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
jobSchema.index({ assignedMachine: 1, status: 1 });
jobSchema.index({ createdDate: -1 });
jobSchema.index({ dueDate: 1 });

// Virtual for progress percentage
jobSchema.virtual("progressPercentage").get(function () {
  if (this.status === "completed") return 100;
  if (this.status === "pending" || this.status === "rejected") return 0;

  // Calculate based on progress entries
  const progressSteps = this.progress.length;
  if (progressSteps === 0) return 0;

  // Simple calculation - can be made more sophisticated
  switch (this.status) {
    case "approved":
      return 10;
    case "in-progress":
      return Math.min(50 + progressSteps * 10, 90);
    case "on-hold":
      return Math.min(30 + progressSteps * 5, 80);
    default:
      return 0;
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

// Static method to get jobs summary
jobSchema.statics.getSummary = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgDuration: { $avg: "$actualDuration" },
      },
    },
  ]);
};

// Instance method to update progress
jobSchema.methods.addProgress = function (progressData) {
  this.progress.push(progressData);

  // Auto-update status based on progress
  if (progressData.status === "completed") {
    this.status = "completed";
    this.completedDate = new Date();
  } else if (
    progressData.status === "in-progress" &&
    this.status === "approved"
  ) {
    this.status = "in-progress";
  }

  return this.save();
};

module.exports = mongoose.model("Job", jobSchema);
