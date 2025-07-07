const mongoose = require("mongoose");

const paperSizeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "A4", "Letter", "Custom"
    dimensions: {
      width: { type: Number, required: true }, // in inches
      height: { type: Number, required: true }, // in inches
    },
    squareInches: { type: Number }, // auto-calculated
    isStandard: { type: Boolean, default: true },
    description: String,
  },
  { _id: false }
);

// Pre-save middleware to calculate square inches
paperSizeSchema.pre("validate", function () {
  this.squareInches = this.dimensions.width * this.dimensions.height;
});

const paperTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["printing", "packaging", "specialty"],
      default: "printing",
    },
    availableGSM: [
      {
        type: Number,
        required: true,
      },
    ],
    availableSizes: [paperSizeSchema],
    defaultGSM: Number,
    characteristics: {
      finish: {
        type: String,
        enum: ["matte", "glossy", "satin", "textured", "plain"],
      },
      opacity: Number, // percentage
      brightness: Number, // percentage
      printability: {
        type: String,
        enum: ["excellent", "good", "fair", "poor"],
      },
    },
    pricing: {
      basePrice: { type: Number, min: 0 }, // per square inch
      gsmMultiplier: { type: Number, default: 1 }, // pricing multiplier based on GSM
      currency: { type: String, default: "INR" },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
      index: true,
    },
    supplier: {
      name: String,
      contact: String,
      leadTime: Number, // in days
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
paperTypeSchema.index({ name: "text", description: "text" });
paperTypeSchema.index({ category: 1, status: 1 });

// Static method to get all available GSM values
paperTypeSchema.statics.getAllGSMValues = function () {
  return [
    70, 80, 90, 100, 110, 115, 120, 125, 130, 150, 170, 200, 210, 220, 230, 250,
    260, 270, 280, 300, 330,
  ];
};

// Static method to get standard paper sizes
paperTypeSchema.statics.getStandardSizes = function () {
  return [
    { name: "A4", dimensions: { width: 8.27, height: 11.69 } },
    { name: "A3", dimensions: { width: 11.69, height: 16.54 } },
    { name: "A5", dimensions: { width: 5.83, height: 8.27 } },
    { name: "Letter", dimensions: { width: 8.5, height: 11 } },
    { name: "Legal", dimensions: { width: 8.5, height: 14 } },
    { name: "Tabloid", dimensions: { width: 11, height: 17 } },
    { name: "12x18", dimensions: { width: 12, height: 18 } },
    { name: "13x19", dimensions: { width: 13, height: 19 } },
    { name: "16x20", dimensions: { width: 16, height: 20 } },
    { name: "18x24", dimensions: { width: 18, height: 24 } },
  ].map((size) => ({
    ...size,
    squareInches: size.dimensions.width * size.dimensions.height,
    isStandard: true,
  }));
};

// Instance method to check if GSM is available
paperTypeSchema.methods.isGSMAvailable = function (gsm) {
  return this.availableGSM.includes(gsm);
};

// Instance method to get price for specific GSM and size
paperTypeSchema.methods.getPrice = function (gsm, squareInches) {
  if (!this.isGSMAvailable(gsm)) {
    throw new Error(`GSM ${gsm} not available for ${this.name}`);
  }

  const basePrice = this.pricing.basePrice || 0;
  const gsmFactor = gsm / 100; // Simple GSM pricing factor
  const multiplier = this.pricing.gsmMultiplier || 1;

  return basePrice * squareInches * gsmFactor * multiplier;
};

module.exports = mongoose.model("PaperType", paperTypeSchema);
