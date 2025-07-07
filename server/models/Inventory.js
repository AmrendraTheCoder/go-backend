const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["in", "out", "adjustment", "transfer"],
      required: true,
    },
    quantity: { type: Number, required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: String,
    batchNumber: String,
    supplierInfo: {
      name: String,
      invoice: String,
      deliveryDate: Date,
    },
    qualityCheck: {
      passed: { type: Boolean, default: true },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notes: String,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const usagePatternSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ["daily", "weekly", "monthly"] },
    averageUsage: Number,
    peakUsage: Number,
    lastCalculated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inventorySchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "raw-material",
        "component",
        "tool",
        "consumable",
        "finished-good",
      ],
      index: true,
    },
    currentQuantity: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    unit: {
      type: String,
      required: true,
      enum: [
        "pieces",
        "kg",
        "grams",
        "liters",
        "meters",
        "square-meters",
        "cubic-meters",
        "tons",
      ],
      default: "pieces",
    },
    minThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderPoint: {
      type: Number,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      min: 0,
    },
    location: {
      warehouse: { type: String, required: true },
      section: String,
      shelf: String,
      bin: String,
      coordinates: {
        x: Number,
        y: Number,
        z: Number,
      },
    },
    cost: {
      unitCost: { type: Number, min: 0 },
      currency: { type: String, default: "USD" },
      lastUpdated: { type: Date, default: Date.now },
    },
    supplierInfo: {
      primarySupplier: {
        name: String,
        contact: String,
        email: String,
        phone: String,
        leadTime: Number, // in days
      },
      alternativeSuppliers: [
        {
          name: String,
          contact: String,
          email: String,
          phone: String,
          leadTime: Number,
        },
      ],
    },
    specifications: {
      material: String,
      dimensions: String,
      weight: Number,
      color: String,
      grade: String,
      certifications: [String],
      customAttributes: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued", "on-order"],
      default: "active",
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastCountDate: Date,
    transactions: [transactionSchema],
    usagePatterns: [usagePatternSchema],
    aiPredictions: [
      {
        type: {
          type: String,
          enum: ["reorder", "usage-forecast", "cost-trend"],
        },
        prediction: mongoose.Schema.Types.Mixed,
        confidence: { type: Number, min: 0, max: 1 },
        validUntil: Date,
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    alerts: [
      {
        type: {
          type: String,
          enum: ["low-stock", "reorder", "overstock", "expired"],
        },
        message: String,
        severity: { type: String, enum: ["low", "medium", "high", "critical"] },
        acknowledged: { type: Boolean, default: false },
        acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
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
inventorySchema.index({ category: 1, status: 1 });
inventorySchema.index({ currentQuantity: 1, minThreshold: 1 });
inventorySchema.index({ "location.warehouse": 1 });
inventorySchema.index({ itemName: "text", description: "text" });

// Virtual for stock status
inventorySchema.virtual("stockStatus").get(function () {
  if (this.currentQuantity <= 0) return "out-of-stock";
  if (this.currentQuantity <= this.minThreshold) return "low-stock";
  if (this.currentQuantity >= this.maxCapacity * 0.9) return "overstock";
  return "normal";
});

// Virtual for stock percentage
inventorySchema.virtual("stockPercentage").get(function () {
  return Math.round((this.currentQuantity / this.maxCapacity) * 100);
});

// Virtual for days until stockout (simple calculation)
inventorySchema.virtual("daysUntilStockout").get(function () {
  const dailyPattern = this.usagePatterns.find((p) => p.period === "daily");
  if (!dailyPattern || dailyPattern.averageUsage <= 0) return null;

  return Math.floor(this.currentQuantity / dailyPattern.averageUsage);
});

// Pre-save middleware to update lastUpdated
inventorySchema.pre("save", function (next) {
  if (this.isModified("currentQuantity")) {
    this.lastUpdated = new Date();

    // Check for low stock alert
    if (this.currentQuantity <= this.minThreshold) {
      const existingAlert = this.alerts.find(
        (alert) => alert.type === "low-stock" && !alert.acknowledged
      );

      if (!existingAlert) {
        this.alerts.push({
          type: "low-stock",
          message: `Stock level is below minimum threshold (${this.minThreshold} ${this.unit})`,
          severity: this.currentQuantity <= 0 ? "critical" : "high",
        });
      }
    }
  }
  next();
});

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function () {
  return this.find({
    $expr: { $lte: ["$currentQuantity", "$minThreshold"] },
    status: "active",
  }).sort({ currentQuantity: 1 });
};

// Static method to get inventory summary
inventorySchema.statics.getInventorySummary = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalValue: {
          $sum: { $multiply: ["$currentQuantity", "$cost.unitCost"] },
        },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ["$currentQuantity", "$minThreshold"] }, 1, 0],
          },
        },
      },
    },
  ]);
};

// Instance method to add transaction
inventorySchema.methods.addTransaction = function (transactionData) {
  this.transactions.push(transactionData);

  // Update current quantity based on transaction type
  switch (transactionData.type) {
    case "in":
      this.currentQuantity += transactionData.quantity;
      break;
    case "out":
      this.currentQuantity = Math.max(
        0,
        this.currentQuantity - transactionData.quantity
      );
      break;
    case "adjustment":
      this.currentQuantity = transactionData.quantity;
      break;
  }

  return this.save();
};

// Instance method to calculate usage patterns
inventorySchema.methods.updateUsagePatterns = function () {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate daily usage pattern
  const outTransactions = this.transactions.filter(
    (t) => t.type === "out" && t.timestamp >= thirtyDaysAgo
  );

  if (outTransactions.length > 0) {
    const totalUsage = outTransactions.reduce((sum, t) => sum + t.quantity, 0);
    const days = Math.max(
      1,
      Math.ceil((now - thirtyDaysAgo) / (24 * 60 * 60 * 1000))
    );
    const averageDaily = totalUsage / days;
    const maxDaily = Math.max(...outTransactions.map((t) => t.quantity));

    // Update or add daily usage pattern
    const dailyPattern = this.usagePatterns.find((p) => p.period === "daily");
    if (dailyPattern) {
      dailyPattern.averageUsage = averageDaily;
      dailyPattern.peakUsage = maxDaily;
      dailyPattern.lastCalculated = now;
    } else {
      this.usagePatterns.push({
        period: "daily",
        averageUsage: averageDaily,
        peakUsage: maxDaily,
        lastCalculated: now,
      });
    }
  }

  return this.save();
};

module.exports = mongoose.model("Inventory", inventorySchema);
