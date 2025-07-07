const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    contactInfo: {
      primaryContact: String,
      phone: String,
      email: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: "India" },
      },
    },
    businessInfo: {
      businessType: String,
      gstNumber: String,
      panNumber: String,
      registrationNumber: String,
    },
    accountInfo: {
      currentBalance: { type: Number, default: 0 },
      creditLimit: { type: Number, default: 0 },
      paymentTerms: { type: String, default: "Net 30" },
      currency: { type: String, default: "INR" },
    },
    preferences: {
      defaultPaperType: String,
      defaultGSM: String,
      preferredMachine: String,
      specialInstructions: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blacklisted"],
      default: "active",
      index: true,
    },
    totalJobs: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    lastJobDate: Date,
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
customerSchema.index({ partyName: "text", customerCode: "text" });
customerSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to generate customer code
customerSchema.pre("save", async function (next) {
  if (!this.customerCode) {
    const lastCustomer = await this.constructor
      .findOne()
      .sort({ customerCode: -1 });

    let nextNumber = 1;
    if (lastCustomer && lastCustomer.customerCode.startsWith("CUST")) {
      const lastNumber = parseInt(lastCustomer.customerCode.slice(4));
      nextNumber = lastNumber + 1;
    }

    this.customerCode = `CUST${nextNumber.toString().padStart(4, "0")}`;
  }
  next();
});

// Instance method to update balance
customerSchema.methods.updateBalance = function (amount, type = "debit") {
  if (type === "debit") {
    this.accountInfo.currentBalance += amount;
  } else {
    this.accountInfo.currentBalance -= amount;
  }
  return this.save();
};

// Static method to search customers
customerSchema.statics.searchCustomers = function (searchTerm) {
  return this.find({
    $or: [
      { partyName: { $regex: searchTerm, $options: "i" } },
      { customerCode: { $regex: searchTerm, $options: "i" } },
      { "contactInfo.phone": { $regex: searchTerm, $options: "i" } },
    ],
    status: "active",
  }).sort({ partyName: 1 });
};

module.exports = mongoose.model("Customer", customerSchema);
