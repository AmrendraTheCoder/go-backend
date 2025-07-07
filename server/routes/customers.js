const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Customer = require("../models/Customer");
const config = require("../config");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/customers
// @desc    Get customers with filtering and pagination
// @access  Private (All authenticated users)
router.get(
  "/",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isLength({ min: 1 }),
    query("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = {};

      if (req.query.isActive !== undefined)
        filter.status = req.query.isActive === "true" ? "active" : "inactive";

      // Search across party name, contact person, phone, email
      if (req.query.search) {
        filter.$or = [
          { partyName: new RegExp(req.query.search, "i") },
          { "contactInfo.primaryContact": new RegExp(req.query.search, "i") },
          { "contactInfo.phone": new RegExp(req.query.search, "i") },
          { "contactInfo.email": new RegExp(req.query.search, "i") },
          { "businessInfo.gstNumber": new RegExp(req.query.search, "i") },
        ];
      }

      const customers = await Customer.find(filter)
        .populate("createdBy", "firstName lastName username")
        .sort({ partyName: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Customer.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Calculate summary statistics
      const stats = {
        total,
        active: await Customer.countDocuments({ status: "active" }),
        inactive: await Customer.countDocuments({ status: "inactive" }),
        blacklisted: await Customer.countDocuments({ status: "blacklisted" }),
      };

      res.json({
        message: "Customers retrieved successfully",
        customers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCustomers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats,
        code: "CUSTOMERS_SUCCESS",
      });
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({
        message: "Error retrieving customers",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "CUSTOMERS_ERROR",
      });
    }
  }
);

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private (All authenticated users)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName username"
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
        code: "CUSTOMER_NOT_FOUND",
      });
    }

    res.json({
      message: "Customer retrieved successfully",
      customer,
      code: "CUSTOMER_SUCCESS",
    });
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(500).json({
      message: "Error retrieving customer",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "CUSTOMER_ERROR",
    });
  }
});

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private (Operator, Manager, Admin)
router.post(
  "/",
  authenticate,
  requireRole("admin", "manager", "operator"),
  [
    body("companyName")
      .notEmpty()
      .trim()
      .withMessage("Company name is required"),
    body("contactPerson")
      .notEmpty()
      .trim()
      .withMessage("Contact person is required"),
    body("phone").isMobilePhone().withMessage("Valid phone number is required"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("address.street").optional().trim(),
    body("address.city").optional().trim(),
    body("address.state").optional().trim(),
    body("address.pincode")
      .optional()
      .isPostalCode("IN")
      .withMessage("Valid pincode is required"),
    body("gstNumber")
      .optional()
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
      .withMessage("Valid GST number is required"),
    body("customerType")
      .optional()
      .isIn(["regular", "premium", "vip"])
      .withMessage("Invalid customer type"),
    body("creditLimit")
      .optional()
      .isNumeric({ min: 0 })
      .withMessage("Credit limit must be a positive number"),
    body("paymentTerms")
      .optional()
      .isIn(["cash", "credit_15", "credit_30", "credit_45", "advance"])
      .withMessage("Invalid payment terms"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const {
        companyName,
        contactPerson,
        phone,
        email,
        address,
        gstNumber,
        customerType,
        creditLimit,
        paymentTerms,
        notes,
      } = req.body;

      // Check if customer already exists
      const existingCustomer = await Customer.findOne({
        $or: [
          { companyName },
          { phone },
          { email: email || null },
          { gstNumber: gstNumber || null },
        ].filter((condition) => Object.values(condition)[0]), // Filter out null/undefined values
      });

      if (existingCustomer) {
        return res.status(400).json({
          message:
            "Customer already exists with same company name, phone, email, or GST number",
          existingCustomer: {
            id: existingCustomer._id,
            companyName: existingCustomer.companyName,
            phone: existingCustomer.phone,
          },
          code: "CUSTOMER_EXISTS",
        });
      }

      // Create new customer
      const customer = new Customer({
        companyName,
        contactPerson,
        phone,
        email: email || "",
        address: address || {},
        gstNumber: gstNumber || "",
        customerType: customerType || "regular",
        creditLimit: creditLimit || 0,
        paymentTerms: paymentTerms || "cash",
        notes: notes || "",
        createdBy: req.user._id,
      });

      await customer.save();

      // Populate and return
      const populatedCustomer = await Customer.findById(customer._id).populate(
        "createdBy",
        "firstName lastName username"
      );

      res.status(201).json({
        message: "Customer created successfully",
        customer: populatedCustomer,
        code: "CUSTOMER_CREATED",
      });

      console.log(`Customer created: ${companyName} by ${req.user.username}`);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({
        message: "Error creating customer",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "CUSTOMER_CREATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private (Operator, Manager, Admin)
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "manager", "operator"),
  [
    body("companyName").optional().notEmpty().trim(),
    body("contactPerson").optional().notEmpty().trim(),
    body("phone").optional().isMobilePhone(),
    body("email").optional().isEmail().normalizeEmail(),
    body("address.street").optional().trim(),
    body("address.city").optional().trim(),
    body("address.state").optional().trim(),
    body("address.pincode").optional().isPostalCode("IN"),
    body("gstNumber")
      .optional()
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    body("customerType").optional().isIn(["regular", "premium", "vip"]),
    body("creditLimit").optional().isNumeric({ min: 0 }),
    body("paymentTerms")
      .optional()
      .isIn(["cash", "credit_15", "credit_30", "credit_45", "advance"]),
    body("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const updates = { ...req.body };

      // Check if phone/email/GST conflicts with other customers
      if (updates.phone || updates.email || updates.gstNumber) {
        const conflictQuery = {
          _id: { $ne: req.params.id },
          $or: [],
        };

        if (updates.phone) conflictQuery.$or.push({ phone: updates.phone });
        if (updates.email) conflictQuery.$or.push({ email: updates.email });
        if (updates.gstNumber)
          conflictQuery.$or.push({ gstNumber: updates.gstNumber });

        const conflictingCustomer = await Customer.findOne(conflictQuery);
        if (conflictingCustomer) {
          return res.status(400).json({
            message:
              "Another customer already exists with same phone, email, or GST number",
            conflictingCustomer: {
              id: conflictingCustomer._id,
              companyName: conflictingCustomer.companyName,
            },
            code: "CUSTOMER_CONFLICT",
          });
        }
      }

      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).populate("createdBy", "firstName lastName username");

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found",
          code: "CUSTOMER_NOT_FOUND",
        });
      }

      res.json({
        message: "Customer updated successfully",
        customer,
        code: "CUSTOMER_UPDATED",
      });

      console.log(
        `Customer updated: ${customer.companyName} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({
        message: "Error updating customer",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "CUSTOMER_UPDATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/customers/:id/balance
// @desc    Update customer balance
// @access  Private (Manager, Admin)
router.put(
  "/:id/balance",
  authenticate,
  requireRole("admin", "manager"),
  [
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("type")
      .isIn(["debit", "credit", "adjustment"])
      .withMessage("Invalid transaction type"),
    body("description")
      .notEmpty()
      .trim()
      .withMessage("Description is required"),
    body("reference").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const { amount, type, description, reference } = req.body;
      const customer = await Customer.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found",
          code: "CUSTOMER_NOT_FOUND",
        });
      }

      // Calculate new balance
      let balanceChange = 0;
      switch (type) {
        case "debit":
          balanceChange = Math.abs(amount);
          break;
        case "credit":
          balanceChange = -Math.abs(amount);
          break;
        case "adjustment":
          balanceChange = amount; // Can be positive or negative
          break;
      }

      const newBalance = customer.accountBalance + balanceChange;

      // Add transaction to history
      customer.transactionHistory.push({
        type,
        amount: Math.abs(amount),
        balanceAfter: newBalance,
        description,
        reference: reference || "",
        performedBy: req.user._id,
        timestamp: new Date(),
      });

      // Update balance
      customer.accountBalance = newBalance;

      await customer.save();

      // Populate and return
      const updatedCustomer = await Customer.findById(customer._id).populate(
        "transactionHistory.performedBy",
        "firstName lastName username"
      );
      res.json({
        message: "Customer balance updated successfully",
        customer: updatedCustomer,
        transaction:
          updatedCustomer.transactionHistory[
            updatedCustomer.transactionHistory.length - 1
          ],
        code: "BALANCE_UPDATED",
      });

      console.log(
        `Customer balance updated: ${customer.companyName} ${type} ${amount} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Update customer balance error:", error);
      res.status(500).json({
        message: "Error updating customer balance",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "BALANCE_UPDATE_ERROR",
      });
    }
  }
);

// @route   GET /api/customers/:id/transactions
// @desc    Get customer transaction history
// @access  Private (All authenticated users)
router.get(
  "/:id/transactions",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("type").optional().isIn(["debit", "credit", "adjustment"]),
  ],
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const customer = await Customer.findById(req.params.id).populate(
        "transactionHistory.performedBy",
        "firstName lastName username"
      );

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found",
          code: "CUSTOMER_NOT_FOUND",
        });
      }

      // Filter transactions if type specified
      let transactions = customer.transactionHistory;
      if (req.query.type) {
        transactions = transactions.filter((t) => t.type === req.query.type);
      }

      // Sort by timestamp (newest first)
      transactions.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Apply pagination
      const paginatedTransactions = transactions.slice(skip, skip + limit);
      const totalPages = Math.ceil(transactions.length / limit);

      res.json({
        message: "Customer transactions retrieved successfully",
        customer: {
          _id: customer._id,
          companyName: customer.companyName,
          accountBalance: customer.accountBalance,
        },
        transactions: paginatedTransactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions: transactions.length,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        code: "TRANSACTIONS_SUCCESS",
      });
    } catch (error) {
      console.error("Get customer transactions error:", error);
      res.status(500).json({
        message: "Error retrieving customer transactions",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "TRANSACTIONS_ERROR",
      });
    }
  }
);

// @route   GET /api/customers/search
// @desc    Search customers (for dropdown/autocomplete)
// @access  Private (All authenticated users)
router.get(
  "/search/autocomplete",
  authenticate,
  [
    query("q")
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Search query is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const { q, limit = 10 } = req.query;

      const customers = await Customer.find({
        isActive: true,
        $or: [
          { companyName: new RegExp(q, "i") },
          { contactPerson: new RegExp(q, "i") },
        ],
      })
        .select("companyName contactPerson phone email accountBalance")
        .limit(parseInt(limit))
        .sort({ companyName: 1 });

      res.json({
        message: "Customer search completed successfully",
        customers,
        query: q,
        code: "SEARCH_SUCCESS",
      });
    } catch (error) {
      console.error("Customer search error:", error);
      res.status(500).json({
        message: "Error searching customers",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "SEARCH_ERROR",
      });
    }
  }
);

// @route   DELETE /api/customers/:id
// @desc    Deactivate customer (soft delete)
// @access  Private (Admin only)
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
        code: "CUSTOMER_NOT_FOUND",
      });
    }

    res.json({
      message: "Customer deactivated successfully",
      code: "CUSTOMER_DEACTIVATED",
    });

    console.log(
      `Customer deactivated: ${customer.companyName} by ${req.user.username}`
    );
  } catch (error) {
    console.error("Deactivate customer error:", error);
    res.status(500).json({
      message: "Error deactivating customer",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "CUSTOMER_DEACTIVATE_ERROR",
    });
  }
});

module.exports = router;
