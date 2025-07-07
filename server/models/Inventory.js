const mongoose = require("mongoose");

// Transaction tracking for stock movements
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "receipt",
        "issue",
        "transfer",
        "adjustment",
        "waste",
        "customer_provided",
      ],
      required: true,
    },
    quantity: { type: Number, required: true },
    unit: {
      type: String,
      enum: ["packet", "gross", "ream", "sheet"],
      required: true,
    },
    reference: {
      jobId: String,
      orderId: String,
      transferId: String,
      notes: String,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    balanceAfter: { type: Number, required: true },
  },
  { _id: false }
);

// Usage pattern tracking for AI analytics
const usagePatternSchema = new mongoose.Schema(
  {
    period: String, // 'daily', 'weekly', 'monthly'
    averageUsage: Number,
    peakUsage: Number,
    trends: [String],
    lastCalculated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inventorySchema = new mongoose.Schema(
  {
    // Stock Management Form Fields
    partyName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    paperType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaperType",
      required: true,
      index: true,
    },
    paperSize: {
      name: { type: String, required: true }, // e.g., "A4", "Letter", "Custom"
      dimensions: {
        width: { type: Number, required: true }, // in inches
        height: { type: Number, required: true }, // in inches
      },
      squareInches: { type: Number }, // auto-calculated
    },
    gsm: {
      type: Number,
      required: true,
      min: 70,
      max: 330,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["packet", "gross", "ream", "sheet"],
      default: "sheet",
      required: true,
      index: true,
    },

    // Auto-generated system fields
    stockId: {
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
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },

    // Stock classification
    category: {
      type: String,
      default: "paper_stock",
      enum: ["paper_stock", "consumable", "tool", "equipment"],
      index: true,
    },

    // Current stock levels in sheets (normalized)
    currentQuantityInSheets: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      index: true,
    },

    // Original quantity as entered
    originalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // Stock level management (in sheets)
    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 100, // sheets
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: 0,
      default: 500, // sheets
    },

    // Cost tracking
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalValue: {
      type: Number,
      min: 0,
    },

    // Location and organization
    location: {
      warehouse: { type: String, default: "Main Warehouse" },
      zone: String,
      aisle: String,
      shelf: String,
    },

    // Paper provider information
    paperProvidedByParty: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Quality specifications
    specifications: {
      finish: String, // matte, glossy, etc.
      color: { type: String, default: "white" },
      opacity: Number,
      brightness: Number,
      customSpecs: mongoose.Schema.Types.Mixed,
    },

    // Stock status and flags
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    requiresSpecialHandling: {
      type: Boolean,
      default: false,
    },

    // Alerts and notifications
    alerts: {
      lowStock: {
        type: Boolean,
        default: false,
      },
      outOfStock: {
        type: Boolean,
        default: false,
      },
      expiring: {
        type: Boolean,
        default: false,
      },
    },

    // Expiration tracking (for paper quality)
    expirationDate: Date,
    shelfLife: { type: Number, default: 365 }, // in days

    // Transaction history
    transactions: [transactionSchema],

    // Usage analytics
    usagePatterns: [usagePatternSchema],

    // AI predictions and insights
    aiPredictions: {
      forecastedUsage: [
        {
          period: String,
          quantity: Number,
          confidence: Number,
        },
      ],
      optimalStock: Number,
      recommendations: [String],
      lastUpdated: Date,
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notes and attachments
    notes: String,
    attachments: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
inventorySchema.index({ partyName: 1, paperType: 1, gsm: 1 });
inventorySchema.index({ category: 1, isActive: 1 });
inventorySchema.index({ currentQuantityInSheets: 1, minimumStock: 1 });
inventorySchema.index({ "paperSize.name": 1 });
inventorySchema.index({ itemName: "text", description: "text" });
inventorySchema.index({ createdAt: -1 });

// Virtual for stock status
inventorySchema.virtual("stockStatus").get(function () {
  if (this.currentQuantityInSheets <= 0) return "out-of-stock";
  if (this.currentQuantityInSheets <= this.minimumStock) return "low-stock";
  return "normal";
});

// Virtual for formatted quantity display
inventorySchema.virtual("formattedQuantity").get(function () {
  return `${this.quantity} ${this.unit}(s) (${this.currentQuantityInSheets} sheets)`;
});

// Virtual for paper dimensions display
inventorySchema.virtual("paperDimensions").get(function () {
  return `${this.paperSize.dimensions.width}" x ${this.paperSize.dimensions.height}"`;
});

// Pre-save middleware for auto-calculations
inventorySchema.pre("save", function (next) {
  // Auto-calculate square inches
  if (this.isModified("paperSize.dimensions")) {
    this.paperSize.squareInches =
      this.paperSize.dimensions.width * this.paperSize.dimensions.height;
  }

  // Auto-generate stockId if new
  if (this.isNew && !this.stockId) {
    this.stockId = `STK-${Date.now()}`;
  }

  // Auto-generate itemName
  if (
    this.isModified("paperType") ||
    this.isModified("paperSize") ||
    this.isModified("gsm")
  ) {
    this.itemName = `${this.paperSize.name} ${this.gsm}GSM Paper`;
  }

  // Convert quantity to sheets for normalization
  if (this.isModified("quantity") || this.isModified("unit")) {
    const conversionRates = {
      sheet: 1,
      packet: 100, // assuming 100 sheets per packet
      ream: 500, // standard ream size
      gross: 12 * 100, // 12 dozen packets
    };

    this.currentQuantityInSheets =
      this.quantity * (conversionRates[this.unit] || 1);
  }

  // Calculate total value
  if (
    this.isModified("unitCost") ||
    this.isModified("currentQuantityInSheets")
  ) {
    this.totalValue = this.unitCost * this.currentQuantityInSheets;
  }

  // Check for alerts
  if (this.isModified("currentQuantityInSheets")) {
    this.alerts.outOfStock = this.currentQuantityInSheets <= 0;
    this.alerts.lowStock =
      this.currentQuantityInSheets > 0 &&
      this.currentQuantityInSheets <= this.minimumStock;
  }

  next();
});

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function () {
  return this.find({
    currentQuantityInSheets: { $lte: this.minimumStock },
    isActive: true,
  })
    .populate("partyName paperType")
    .sort({ currentQuantityInSheets: 1 });
};

// Static method to get stock by party
inventorySchema.statics.getStockByParty = function (partyId) {
  return this.find({ partyName: partyId, isActive: true })
    .populate("partyName paperType")
    .sort({ createdAt: -1 });
};

// Static method to search stock
inventorySchema.statics.searchStock = function (searchTerm) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { itemName: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { "paperSize.name": { $regex: searchTerm, $options: "i" } },
        ],
      },
    ],
  }).populate("partyName paperType");
};

// Instance method to add transaction
inventorySchema.methods.addTransaction = function (transactionData) {
  // Convert transaction quantity to sheets
  const conversionRates = {
    sheet: 1,
    packet: 100,
    ream: 500,
    gross: 1200,
  };

  const quantityInSheets =
    transactionData.quantity * (conversionRates[transactionData.unit] || 1);

  // Update stock based on transaction type
  switch (transactionData.type) {
    case "receipt":
    case "customer_provided":
      this.currentQuantityInSheets += quantityInSheets;
      break;
    case "issue":
    case "waste":
      this.currentQuantityInSheets = Math.max(
        0,
        this.currentQuantityInSheets - quantityInSheets
      );
      break;
    case "adjustment":
      this.currentQuantityInSheets = quantityInSheets;
      break;
  }

  // Add transaction record
  this.transactions.push({
    ...transactionData,
    balanceAfter: this.currentQuantityInSheets,
  });

  return this.save();
};

// Instance method to issue stock for job
inventorySchema.methods.issueForJob = function (
  jobId,
  quantityNeeded,
  performedBy
) {
  if (this.currentQuantityInSheets < quantityNeeded) {
    throw new Error(
      `Insufficient stock. Available: ${this.currentQuantityInSheets}, Required: ${quantityNeeded}`
    );
  }

  return this.addTransaction({
    type: "issue",
    quantity: quantityNeeded,
    unit: "sheet",
    reference: { jobId: jobId },
    performedBy: performedBy,
  });
};

module.exports = mongoose.model("Inventory", inventorySchema);
