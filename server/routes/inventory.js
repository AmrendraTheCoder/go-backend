const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Inventory = require("../models/Inventory");
const PaperType = require("../models/PaperType");
const Customer = require("../models/Customer");
const config = require("../config");
const {
  authenticate,
  requireRole,
  requirePermission,
  requireAreaAccess,
} = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get inventory items with filtering and pagination
// @access  Private (Stock Manager, Admin, Manager)
router.get(
  "/",
  authenticate,
  requireRole("admin", "manager", "stock_manager"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("paperType").optional().isMongoId(),
    query("gsm").optional().isNumeric(),
    query("unit").optional().isIn(["packet", "gross", "ream", "sheet"]),
    query("status").optional().isIn(["in_stock", "low_stock", "out_of_stock"]),
    query("search").optional().isLength({ min: 1 }),
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
      const filter = { isActive: true };

      if (req.query.paperType) filter.paperType = req.query.paperType;
      if (req.query.gsm) filter.gsm = req.query.gsm;
      if (req.query.unit) filter.unit = req.query.unit;

      // Search across party name, paper type, and size
      if (req.query.search) {
        filter.$or = [
          { partyName: new RegExp(req.query.search, "i") },
          { size: new RegExp(req.query.search, "i") },
        ];
      }

      // Status filtering based on stock levels
      if (req.query.status) {
        switch (req.query.status) {
          case "out_of_stock":
            filter.currentQuantity = 0;
            break;
          case "low_stock":
            filter.$expr = {
              $and: [
                { $gt: ["$currentQuantity", 0] },
                { $lte: ["$currentQuantity", "$reorderLevel"] },
              ],
            };
            break;
          case "in_stock":
            filter.$expr = {
              $gt: ["$currentQuantity", "$reorderLevel"],
            };
            break;
        }
      }

      const inventory = await Inventory.find(filter)
        .populate("paperType", "name category specifications")
        .populate("lastModifiedBy", "firstName lastName username")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Inventory.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Calculate summary statistics
      const stats = {
        totalItems: total,
        inStock: await Inventory.countDocuments({
          ...filter,
          $expr: { $gt: ["$currentQuantity", "$reorderLevel"] },
        }),
        lowStock: await Inventory.countDocuments({
          ...filter,
          $expr: {
            $and: [
              { $gt: ["$currentQuantity", 0] },
              { $lte: ["$currentQuantity", "$reorderLevel"] },
            ],
          },
        }),
        outOfStock: await Inventory.countDocuments({
          ...filter,
          currentQuantity: 0,
        }),
      };

      res.json({
        message: "Inventory retrieved successfully",
        inventory,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats,
        code: "INVENTORY_SUCCESS",
      });
    } catch (error) {
      console.error("Get inventory error:", error);
      res.status(500).json({
        message: "Error retrieving inventory",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "INVENTORY_ERROR",
      });
    }
  }
);

// @route   GET /api/inventory/:id
// @desc    Get inventory item by ID
// @access  Private (Stock Manager, Admin, Manager)
router.get(
  "/:id",
  authenticate,
  requireRole("admin", "manager", "stock_manager"),
  async (req, res) => {
    try {
      const inventory = await Inventory.findById(req.params.id)
        .populate("paperType", "name category specifications")
        .populate("lastModifiedBy", "firstName lastName username")
        .populate("transactions.performedBy", "firstName lastName username");

      if (!inventory) {
        return res.status(404).json({
          message: "Inventory item not found",
          code: "INVENTORY_NOT_FOUND",
        });
      }

      res.json({
        message: "Inventory item retrieved successfully",
        inventory,
        code: "INVENTORY_ITEM_SUCCESS",
      });
    } catch (error) {
      console.error("Get inventory item error:", error);
      res.status(500).json({
        message: "Error retrieving inventory item",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "INVENTORY_ITEM_ERROR",
      });
    }
  }
);

// @route   POST /api/inventory
// @desc    Add new inventory item
// @access  Private (Stock Manager, Admin, Manager)
router.post(
  "/",
  authenticate,
  requireRole("admin", "manager", "stock_manager"),
  [
    body("partyName").notEmpty().withMessage("Party name is required").trim(),
    body("paperType")
      .isMongoId()
      .withMessage("Valid paper type ID is required"),
    body("size").notEmpty().withMessage("Size is required").trim(),
    body("gsm").isNumeric().withMessage("GSM must be a number"),
    body("quantity")
      .isNumeric({ min: 0 })
      .withMessage("Quantity must be a positive number"),
    body("unit")
      .isIn(["packet", "gross", "ream", "sheet"])
      .withMessage("Invalid unit"),
    body("pricePerUnit")
      .optional()
      .isNumeric({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("reorderLevel")
      .optional()
      .isNumeric({ min: 0 })
      .withMessage("Reorder level must be a positive number"),
    body("location")
      .optional()
      .isString()
      .withMessage("Location must be a string")
      .trim(),
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
        partyName,
        paperType,
        size,
        gsm,
        quantity,
        unit,
        pricePerUnit,
        reorderLevel,
        location,
        notes,
      } = req.body;

      // Verify paper type exists
      const paperTypeDoc = await PaperType.findById(paperType);
      if (!paperTypeDoc) {
        return res.status(400).json({
          message: "Paper type not found",
          code: "PAPER_TYPE_NOT_FOUND",
        });
      }

      // Check if inventory item already exists
      const existingItem = await Inventory.findOne({
        partyName,
        paperType,
        size,
        gsm,
        unit,
        isActive: true,
      });

      if (existingItem) {
        return res.status(400).json({
          message: "Inventory item with same specifications already exists",
          existingItem: existingItem._id,
          code: "INVENTORY_EXISTS",
        });
      }

      // Create new inventory item
      const inventory = new Inventory({
        partyName,
        paperType,
        size,
        gsm,
        currentQuantity: quantity,
        unit,
        pricePerUnit: pricePerUnit || 0,
        reorderLevel: reorderLevel || 0,
        location: location || "",
        lastModifiedBy: req.user._id,
      });

      // Add initial receipt transaction
      if (quantity > 0) {
        inventory.transactions.push({
          type: "receipt",
          quantity,
          unit,
          reference: { notes: notes || "Initial stock" },
          performedBy: req.user._id,
          balanceAfter: quantity,
        });
      }

      await inventory.save();

      // Populate and return
      const populatedInventory = await Inventory.findById(inventory._id)
        .populate("paperType", "name category specifications")
        .populate("lastModifiedBy", "firstName lastName username");

      res.status(201).json({
        message: "Inventory item created successfully",
        inventory: populatedInventory,
        code: "INVENTORY_CREATED",
      });

      // Emit real-time update
      req.io.emit("inventory-update", {
        type: "created",
        inventory: populatedInventory,
      });

      console.log(
        `Inventory item created: ${partyName} - ${size} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Create inventory error:", error);
      res.status(500).json({
        message: "Error creating inventory item",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "INVENTORY_CREATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Stock Manager, Admin, Manager)
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "manager", "stock_manager"),
  [
    body("pricePerUnit").optional().isNumeric({ min: 0 }),
    body("reorderLevel").optional().isNumeric({ min: 0 }),
    body("location").optional().trim(),
    body("notes").optional().trim(),
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
      updates.lastModifiedBy = req.user._id;

      const inventory = await Inventory.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )
        .populate("paperType", "name category specifications")
        .populate("lastModifiedBy", "firstName lastName username");

      if (!inventory) {
        return res.status(404).json({
          message: "Inventory item not found",
          code: "INVENTORY_NOT_FOUND",
        });
      }

      res.json({
        message: "Inventory item updated successfully",
        inventory,
        code: "INVENTORY_UPDATED",
      });

      // Emit real-time update
      req.io.emit("inventory-update", {
        type: "updated",
        inventory,
      });
    } catch (error) {
      console.error("Update inventory error:", error);
      res.status(500).json({
        message: "Error updating inventory item",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "INVENTORY_UPDATE_ERROR",
      });
    }
  }
);

// @route   POST /api/inventory/:id/transaction
// @desc    Add inventory transaction (receipt, issue, adjustment)
// @access  Private (Stock Manager, Admin, Manager)
router.post(
  "/:id/transaction",
  authenticate,
  requireRole("admin", "manager", "stock_manager", "operator"),
  [
    body("type")
      .isIn([
        "receipt",
        "issue",
        "transfer",
        "adjustment",
        "waste",
        "customer_provided",
      ])
      .withMessage("Invalid transaction type"),
    body("quantity").isNumeric().withMessage("Quantity must be a number"),
    body("unit")
      .isIn(["packet", "gross", "ream", "sheet"])
      .withMessage("Invalid unit"),
    body("reference.jobId").optional().isMongoId(),
    body("reference.orderId").optional().isString(),
    body("reference.notes").optional().trim(),
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

      const { type, quantity, unit, reference } = req.body;
      const inventory = await Inventory.findById(req.params.id);

      if (!inventory) {
        return res.status(404).json({
          message: "Inventory item not found",
          code: "INVENTORY_NOT_FOUND",
        });
      }

      // Validate quantity for issues and waste
      if (
        ["issue", "waste", "transfer"].includes(type) &&
        quantity > inventory.currentQuantity
      ) {
        return res.status(400).json({
          message: "Insufficient stock quantity",
          available: inventory.currentQuantity,
          requested: quantity,
          code: "INSUFFICIENT_STOCK",
        });
      }

      // Calculate new balance
      let newBalance = inventory.currentQuantity;
      if (["receipt", "adjustment"].includes(type)) {
        newBalance += Math.abs(quantity);
      } else if (["issue", "waste", "transfer"].includes(type)) {
        newBalance -= Math.abs(quantity);
      }

      // Add transaction
      inventory.transactions.push({
        type,
        quantity: Math.abs(quantity),
        unit,
        reference: reference || {},
        performedBy: req.user._id,
        balanceAfter: newBalance,
      });

      // Update current quantity
      inventory.currentQuantity = newBalance;
      inventory.lastModifiedBy = req.user._id;

      await inventory.save();

      // Populate and return
      const updatedInventory = await Inventory.findById(inventory._id)
        .populate("paperType", "name category specifications")
        .populate("transactions.performedBy", "firstName lastName username")
        .populate("lastModifiedBy", "firstName lastName username");

      res.json({
        message: "Transaction recorded successfully",
        inventory: updatedInventory,
        transaction:
          updatedInventory.transactions[
            updatedInventory.transactions.length - 1
          ],
        code: "TRANSACTION_SUCCESS",
      });

      // Emit real-time update
      req.io.emit("inventory-transaction", {
        inventoryId: inventory._id,
        transaction:
          updatedInventory.transactions[
            updatedInventory.transactions.length - 1
          ],
        newBalance: newBalance,
        type,
      });

      // Check for low stock alerts
      if (newBalance <= inventory.reorderLevel && newBalance > 0) {
        req.io.emit("inventory-alert", {
          type: "low_stock",
          inventory: updatedInventory,
          currentQuantity: newBalance,
          reorderLevel: inventory.reorderLevel,
        });
      } else if (newBalance === 0) {
        req.io.emit("inventory-alert", {
          type: "out_of_stock",
          inventory: updatedInventory,
        });
      }

      console.log(
        `Inventory transaction: ${type} ${quantity} ${unit} for ${inventory.partyName} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Inventory transaction error:", error);
      res.status(500).json({
        message: "Error recording transaction",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "TRANSACTION_ERROR",
      });
    }
  }
);

// @route   GET /api/inventory/reports/stock-levels
// @desc    Get stock level report
// @access  Private (Stock Manager, Admin, Manager)
router.get(
  "/reports/stock-levels",
  authenticate,
  requireRole("admin", "manager", "stock_manager"),
  async (req, res) => {
    try {
      const stockLevels = await Inventory.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "papertypes",
            localField: "paperType",
            foreignField: "_id",
            as: "paperTypeInfo",
          },
        },
        { $unwind: "$paperTypeInfo" },
        {
          $addFields: {
            stockStatus: {
              $cond: {
                if: { $eq: ["$currentQuantity", 0] },
                then: "out_of_stock",
                else: {
                  $cond: {
                    if: { $lte: ["$currentQuantity", "$reorderLevel"] },
                    then: "low_stock",
                    else: "in_stock",
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$stockStatus",
            count: { $sum: 1 },
            items: {
              $push: {
                _id: "$_id",
                partyName: "$partyName",
                paperType: "$paperTypeInfo.name",
                size: "$size",
                gsm: "$gsm",
                currentQuantity: "$currentQuantity",
                unit: "$unit",
                reorderLevel: "$reorderLevel",
                location: "$location",
              },
            },
          },
        },
      ]);

      // Format response
      const report = {
        summary: {
          in_stock: 0,
          low_stock: 0,
          out_of_stock: 0,
        },
        details: {
          in_stock: [],
          low_stock: [],
          out_of_stock: [],
        },
      };

      stockLevels.forEach((level) => {
        report.summary[level._id] = level.count;
        report.details[level._id] = level.items;
      });

      res.json({
        message: "Stock level report generated successfully",
        report,
        generatedAt: new Date(),
        code: "STOCK_REPORT_SUCCESS",
      });
    } catch (error) {
      console.error("Stock level report error:", error);
      res.status(500).json({
        message: "Error generating stock level report",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "STOCK_REPORT_ERROR",
      });
    }
  }
);

// @route   GET /api/inventory/reports/transactions
// @desc    Get transaction history report
// @access  Private (Stock Manager, Admin, Manager)
router.get(
  "/reports/transactions",
  authenticate,
  requireRole("admin", "manager", "stock_manager"),
  [
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("type")
      .optional()
      .isIn([
        "receipt",
        "issue",
        "transfer",
        "adjustment",
        "waste",
        "customer_provided",
      ]),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
  ],
  async (req, res) => {
    try {
      const { startDate, endDate, type, limit = 100 } = req.query;

      const matchStage = { isActive: true };
      const transactionMatch = {};

      if (startDate || endDate) {
        transactionMatch.timestamp = {};
        if (startDate) transactionMatch.timestamp.$gte = new Date(startDate);
        if (endDate) transactionMatch.timestamp.$lte = new Date(endDate);
      }

      if (type) {
        transactionMatch.type = type;
      }

      const transactions = await Inventory.aggregate([
        { $match: matchStage },
        { $unwind: "$transactions" },
        { $match: { transactions: transactionMatch } },
        {
          $lookup: {
            from: "users",
            localField: "transactions.performedBy",
            foreignField: "_id",
            as: "performedBy",
          },
        },
        {
          $lookup: {
            from: "papertypes",
            localField: "paperType",
            foreignField: "_id",
            as: "paperTypeInfo",
          },
        },
        { $unwind: "$performedBy" },
        { $unwind: "$paperTypeInfo" },
        {
          $project: {
            partyName: 1,
            paperType: "$paperTypeInfo.name",
            size: 1,
            gsm: 1,
            unit: 1,
            location: 1,
            transaction: "$transactions",
            performedBy: {
              name: {
                $concat: [
                  "$performedBy.firstName",
                  " ",
                  "$performedBy.lastName",
                ],
              },
              username: "$performedBy.username",
            },
          },
        },
        { $sort: { "transaction.timestamp": -1 } },
        { $limit: parseInt(limit) },
      ]);

      res.json({
        message: "Transaction report generated successfully",
        transactions,
        filters: { startDate, endDate, type, limit },
        generatedAt: new Date(),
        code: "TRANSACTION_REPORT_SUCCESS",
      });
    } catch (error) {
      console.error("Transaction report error:", error);
      res.status(500).json({
        message: "Error generating transaction report",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "TRANSACTION_REPORT_ERROR",
      });
    }
  }
);

// @route   DELETE /api/inventory/:id
// @desc    Deactivate inventory item (soft delete)
// @access  Private (Admin only)
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
        lastModifiedBy: req.user._id,
      },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory item not found",
        code: "INVENTORY_NOT_FOUND",
      });
    }

    res.json({
      message: "Inventory item deactivated successfully",
      code: "INVENTORY_DEACTIVATED",
    });

    console.log(
      `Inventory item deactivated: ${inventory.partyName} by ${req.user.username}`
    );
  } catch (error) {
    console.error("Deactivate inventory error:", error);
    res.status(500).json({
      message: "Error deactivating inventory item",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "INVENTORY_DEACTIVATE_ERROR",
    });
  }
});

module.exports = router;
