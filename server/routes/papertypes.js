const express = require("express");
const { body, validationResult, query } = require("express-validator");
const PaperType = require("../models/PaperType");
const config = require("../config");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/papertypes
// @desc    Get paper types with filtering and pagination
// @access  Private (All authenticated users)
router.get(
  "/",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category")
      .optional()
      .isIn(["standard", "specialty", "recycled", "premium"]),
    query("isActive").optional().isBoolean(),
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
      const filter = {};

      if (req.query.category) filter.category = req.query.category;
      if (req.query.isActive !== undefined)
        filter.isActive = req.query.isActive === "true";

      // Search across name and description
      if (req.query.search) {
        filter.$or = [
          { name: new RegExp(req.query.search, "i") },
          { description: new RegExp(req.query.search, "i") },
        ];
      }

      const paperTypes = await PaperType.find(filter)
        .populate("createdBy", "firstName lastName username")
        .sort({ category: 1, name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await PaperType.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Calculate summary statistics
      const stats = {
        total,
        active: await PaperType.countDocuments({ ...filter, isActive: true }),
        inactive: await PaperType.countDocuments({
          ...filter,
          isActive: false,
        }),
        standard: await PaperType.countDocuments({
          ...filter,
          category: "standard",
        }),
        specialty: await PaperType.countDocuments({
          ...filter,
          category: "specialty",
        }),
        recycled: await PaperType.countDocuments({
          ...filter,
          category: "recycled",
        }),
        premium: await PaperType.countDocuments({
          ...filter,
          category: "premium",
        }),
      };

      res.json({
        message: "Paper types retrieved successfully",
        paperTypes,
        pagination: {
          currentPage: page,
          totalPages,
          totalPaperTypes: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats,
        code: "PAPER_TYPES_SUCCESS",
      });
    } catch (error) {
      console.error("Get paper types error:", error);
      res.status(500).json({
        message: "Error retrieving paper types",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PAPER_TYPES_ERROR",
      });
    }
  }
);

// @route   GET /api/papertypes/:id
// @desc    Get paper type by ID
// @access  Private (All authenticated users)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const paperType = await PaperType.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName username"
    );

    if (!paperType) {
      return res.status(404).json({
        message: "Paper type not found",
        code: "PAPER_TYPE_NOT_FOUND",
      });
    }

    res.json({
      message: "Paper type retrieved successfully",
      paperType,
      code: "PAPER_TYPE_SUCCESS",
    });
  } catch (error) {
    console.error("Get paper type error:", error);
    res.status(500).json({
      message: "Error retrieving paper type",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "PAPER_TYPE_ERROR",
    });
  }
});

// @route   POST /api/papertypes
// @desc    Create new paper type
// @access  Private (Manager, Admin)
router.post(
  "/",
  authenticate,
  requireRole("admin", "manager"),
  [
    body("name").notEmpty().withMessage("Paper type name is required").trim(),
    body("category")
      .isIn(["standard", "specialty", "recycled", "premium"])
      .withMessage("Invalid category"),
    body("description").optional().trim(),
    body("specifications.weight").optional().isNumeric({ min: 0 }),
    body("specifications.thickness").optional().isNumeric({ min: 0 }),
    body("specifications.opacity").optional().isNumeric({ min: 0, max: 100 }),
    body("specifications.brightness")
      .optional()
      .isNumeric({ min: 0, max: 100 }),
    body("sizes")
      .isArray({ min: 1 })
      .withMessage("At least one size is required"),
    body("sizes.*.name").notEmpty().withMessage("Size name is required"),
    body("sizes.*.dimensions.width")
      .isNumeric({ min: 0 })
      .withMessage("Width must be a positive number"),
    body("sizes.*.dimensions.height")
      .isNumeric({ min: 0 })
      .withMessage("Height must be a positive number"),
    body("gsmOptions")
      .isArray({ min: 1 })
      .withMessage("At least one GSM option is required"),
    body("gsmOptions.*.gsm")
      .isNumeric({ min: 1 })
      .withMessage("GSM must be a positive number"),
    body("gsmOptions.*.basePrice")
      .isNumeric({ min: 0 })
      .withMessage("Base price must be a positive number"),
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
        name,
        category,
        description,
        specifications,
        sizes,
        gsmOptions,
        notes,
      } = req.body;

      // Check if paper type already exists
      const existingPaperType = await PaperType.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });

      if (existingPaperType) {
        return res.status(400).json({
          message: "Paper type with this name already exists",
          existingPaperType: {
            id: existingPaperType._id,
            name: existingPaperType.name,
          },
          code: "PAPER_TYPE_EXISTS",
        });
      }

      // Calculate square inches for each size
      const processedSizes = sizes.map((size) => ({
        ...size,
        squareInches: size.dimensions.width * size.dimensions.height,
      }));

      // Create new paper type
      const paperType = new PaperType({
        name,
        category,
        description: description || "",
        specifications: specifications || {},
        sizes: processedSizes,
        gsmOptions,
        notes: notes || "",
        createdBy: req.user._id,
      });

      await paperType.save();

      // Populate and return
      const populatedPaperType = await PaperType.findById(
        paperType._id
      ).populate("createdBy", "firstName lastName username");

      res.status(201).json({
        message: "Paper type created successfully",
        paperType: populatedPaperType,
        code: "PAPER_TYPE_CREATED",
      });

      console.log(`Paper type created: ${name} by ${req.user.username}`);
    } catch (error) {
      console.error("Create paper type error:", error);
      res.status(500).json({
        message: "Error creating paper type",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PAPER_TYPE_CREATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/papertypes/:id
// @desc    Update paper type
// @access  Private (Manager, Admin)
router.put(
  "/:id",
  authenticate,
  requireRole("admin", "manager"),
  [
    body("name").optional().notEmpty().trim(),
    body("category")
      .optional()
      .isIn(["standard", "specialty", "recycled", "premium"]),
    body("description").optional().trim(),
    body("specifications.weight").optional().isNumeric({ min: 0 }),
    body("specifications.thickness").optional().isNumeric({ min: 0 }),
    body("specifications.opacity").optional().isNumeric({ min: 0, max: 100 }),
    body("specifications.brightness")
      .optional()
      .isNumeric({ min: 0, max: 100 }),
    body("sizes").optional().isArray({ min: 1 }),
    body("sizes.*.name").optional().notEmpty(),
    body("sizes.*.dimensions.width").optional().isNumeric({ min: 0 }),
    body("sizes.*.dimensions.height").optional().isNumeric({ min: 0 }),
    body("gsmOptions").optional().isArray({ min: 1 }),
    body("gsmOptions.*.gsm").optional().isNumeric({ min: 1 }),
    body("gsmOptions.*.basePrice").optional().isNumeric({ min: 0 }),
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

      // Check if name conflicts with other paper types
      if (updates.name) {
        const conflictingPaperType = await PaperType.findOne({
          _id: { $ne: req.params.id },
          name: new RegExp(`^${updates.name}$`, "i"),
        });

        if (conflictingPaperType) {
          return res.status(400).json({
            message: "Another paper type already exists with this name",
            conflictingPaperType: {
              id: conflictingPaperType._id,
              name: conflictingPaperType.name,
            },
            code: "PAPER_TYPE_CONFLICT",
          });
        }
      }

      // Process sizes if updated
      if (updates.sizes) {
        updates.sizes = updates.sizes.map((size) => ({
          ...size,
          squareInches: size.dimensions.width * size.dimensions.height,
        }));
      }

      const paperType = await PaperType.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).populate("createdBy", "firstName lastName username");

      if (!paperType) {
        return res.status(404).json({
          message: "Paper type not found",
          code: "PAPER_TYPE_NOT_FOUND",
        });
      }

      res.json({
        message: "Paper type updated successfully",
        paperType,
        code: "PAPER_TYPE_UPDATED",
      });

      console.log(
        `Paper type updated: ${paperType.name} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Update paper type error:", error);
      res.status(500).json({
        message: "Error updating paper type",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PAPER_TYPE_UPDATE_ERROR",
      });
    }
  }
);

// @route   GET /api/papertypes/:id/sizes
// @desc    Get sizes for a specific paper type
// @access  Private (All authenticated users)
router.get("/:id/sizes", authenticate, async (req, res) => {
  try {
    const paperType = await PaperType.findById(req.params.id);

    if (!paperType) {
      return res.status(404).json({
        message: "Paper type not found",
        code: "PAPER_TYPE_NOT_FOUND",
      });
    }

    res.json({
      message: "Paper type sizes retrieved successfully",
      paperType: {
        _id: paperType._id,
        name: paperType.name,
        category: paperType.category,
      },
      sizes: paperType.sizes,
      code: "SIZES_SUCCESS",
    });
  } catch (error) {
    console.error("Get paper type sizes error:", error);
    res.status(500).json({
      message: "Error retrieving paper type sizes",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "SIZES_ERROR",
    });
  }
});

// @route   GET /api/papertypes/:id/gsm
// @desc    Get GSM options for a specific paper type
// @access  Private (All authenticated users)
router.get("/:id/gsm", authenticate, async (req, res) => {
  try {
    const paperType = await PaperType.findById(req.params.id);

    if (!paperType) {
      return res.status(404).json({
        message: "Paper type not found",
        code: "PAPER_TYPE_NOT_FOUND",
      });
    }

    res.json({
      message: "Paper type GSM options retrieved successfully",
      paperType: {
        _id: paperType._id,
        name: paperType.name,
        category: paperType.category,
      },
      gsmOptions: paperType.gsmOptions,
      code: "GSM_SUCCESS",
    });
  } catch (error) {
    console.error("Get paper type GSM error:", error);
    res.status(500).json({
      message: "Error retrieving paper type GSM options",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "GSM_ERROR",
    });
  }
});

// @route   POST /api/papertypes/:id/sizes
// @desc    Add new size to paper type
// @access  Private (Manager, Admin)
router.post(
  "/:id/sizes",
  authenticate,
  requireRole("admin", "manager"),
  [
    body("name").notEmpty().withMessage("Size name is required").trim(),
    body("dimensions.width")
      .isNumeric({ min: 0 })
      .withMessage("Width must be a positive number"),
    body("dimensions.height")
      .isNumeric({ min: 0 })
      .withMessage("Height must be a positive number"),
    body("unit")
      .optional()
      .isIn(["inches", "mm", "cm"])
      .withMessage("Invalid unit"),
    body("isStandard").optional().isBoolean(),
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

      const { name, dimensions, unit, isStandard } = req.body;
      const paperType = await PaperType.findById(req.params.id);

      if (!paperType) {
        return res.status(404).json({
          message: "Paper type not found",
          code: "PAPER_TYPE_NOT_FOUND",
        });
      }

      // Check if size already exists
      const existingSize = paperType.sizes.find(
        (size) => size.name.toLowerCase() === name.toLowerCase()
      );

      if (existingSize) {
        return res.status(400).json({
          message: "Size with this name already exists for this paper type",
          code: "SIZE_EXISTS",
        });
      }

      // Add new size
      const newSize = {
        name,
        dimensions,
        squareInches: dimensions.width * dimensions.height,
        unit: unit || "inches",
        isStandard: isStandard || false,
      };

      paperType.sizes.push(newSize);
      await paperType.save();

      res.json({
        message: "Size added successfully",
        paperType,
        newSize: paperType.sizes[paperType.sizes.length - 1],
        code: "SIZE_ADDED",
      });
    } catch (error) {
      console.error("Add paper type size error:", error);
      res.status(500).json({
        message: "Error adding size to paper type",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "SIZE_ADD_ERROR",
      });
    }
  }
);

// @route   POST /api/papertypes/:id/gsm
// @desc    Add new GSM option to paper type
// @access  Private (Manager, Admin)
router.post(
  "/:id/gsm",
  authenticate,
  requireRole("admin", "manager"),
  [
    body("gsm")
      .isNumeric({ min: 1 })
      .withMessage("GSM must be a positive number"),
    body("basePrice")
      .isNumeric({ min: 0 })
      .withMessage("Base price must be a positive number"),
    body("description").optional().trim(),
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

      const { gsm, basePrice, description } = req.body;
      const paperType = await PaperType.findById(req.params.id);

      if (!paperType) {
        return res.status(404).json({
          message: "Paper type not found",
          code: "PAPER_TYPE_NOT_FOUND",
        });
      }

      // Check if GSM already exists
      const existingGsm = paperType.gsmOptions.find(
        (option) => option.gsm === gsm
      );

      if (existingGsm) {
        return res.status(400).json({
          message: "GSM option already exists for this paper type",
          code: "GSM_EXISTS",
        });
      }

      // Add new GSM option
      const newGsmOption = {
        gsm,
        basePrice,
        description: description || "",
      };

      paperType.gsmOptions.push(newGsmOption);
      paperType.gsmOptions.sort((a, b) => a.gsm - b.gsm); // Sort by GSM ascending
      await paperType.save();

      res.json({
        message: "GSM option added successfully",
        paperType,
        newGsmOption,
        code: "GSM_ADDED",
      });
    } catch (error) {
      console.error("Add paper type GSM error:", error);
      res.status(500).json({
        message: "Error adding GSM option to paper type",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "GSM_ADD_ERROR",
      });
    }
  }
);

// @route   GET /api/papertypes/search/autocomplete
// @desc    Search paper types (for dropdown/autocomplete)
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
    query("category")
      .optional()
      .isIn(["standard", "specialty", "recycled", "premium"]),
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

      const { q, limit = 10, category } = req.query;

      const filter = {
        isActive: true,
        $or: [
          { name: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
        ],
      };

      if (category) {
        filter.category = category;
      }

      const paperTypes = await PaperType.find(filter)
        .select("name category description sizes gsmOptions")
        .limit(parseInt(limit))
        .sort({ name: 1 });

      res.json({
        message: "Paper type search completed successfully",
        paperTypes,
        query: q,
        code: "SEARCH_SUCCESS",
      });
    } catch (error) {
      console.error("Paper type search error:", error);
      res.status(500).json({
        message: "Error searching paper types",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "SEARCH_ERROR",
      });
    }
  }
);

// @route   GET /api/papertypes/calculate-price
// @desc    Calculate price for specific paper type, size, and GSM
// @access  Private (All authenticated users)
router.get(
  "/calculate-price",
  authenticate,
  [
    query("paperTypeId")
      .isMongoId()
      .withMessage("Valid paper type ID is required"),
    query("sizeName").notEmpty().withMessage("Size name is required"),
    query("gsm")
      .isNumeric({ min: 1 })
      .withMessage("GSM must be a positive number"),
    query("quantity")
      .optional()
      .isNumeric({ min: 1 })
      .withMessage("Quantity must be a positive number"),
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

      const { paperTypeId, sizeName, gsm, quantity = 1 } = req.query;

      const paperType = await PaperType.findById(paperTypeId);
      if (!paperType) {
        return res.status(404).json({
          message: "Paper type not found",
          code: "PAPER_TYPE_NOT_FOUND",
        });
      }

      // Find size
      const size = paperType.sizes.find((s) => s.name === sizeName);
      if (!size) {
        return res.status(404).json({
          message: "Size not found for this paper type",
          code: "SIZE_NOT_FOUND",
        });
      }

      // Find GSM option
      const gsmOption = paperType.gsmOptions.find((g) => g.gsm == gsm);
      if (!gsmOption) {
        return res.status(404).json({
          message: "GSM option not found for this paper type",
          code: "GSM_NOT_FOUND",
        });
      }

      // Calculate price
      const pricePerSheet = gsmOption.basePrice;
      const totalPrice = pricePerSheet * parseInt(quantity);

      res.json({
        message: "Price calculated successfully",
        calculation: {
          paperType: {
            id: paperType._id,
            name: paperType.name,
            category: paperType.category,
          },
          size: {
            name: size.name,
            dimensions: size.dimensions,
            squareInches: size.squareInches,
          },
          gsm: {
            value: gsmOption.gsm,
            basePrice: gsmOption.basePrice,
          },
          quantity: parseInt(quantity),
          pricePerSheet,
          totalPrice,
        },
        code: "PRICE_CALCULATED",
      });
    } catch (error) {
      console.error("Calculate price error:", error);
      res.status(500).json({
        message: "Error calculating price",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PRICE_CALCULATION_ERROR",
      });
    }
  }
);

// @route   DELETE /api/papertypes/:id
// @desc    Deactivate paper type (soft delete)
// @access  Private (Admin only)
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const paperType = await PaperType.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      { new: true }
    );

    if (!paperType) {
      return res.status(404).json({
        message: "Paper type not found",
        code: "PAPER_TYPE_NOT_FOUND",
      });
    }

    res.json({
      message: "Paper type deactivated successfully",
      code: "PAPER_TYPE_DEACTIVATED",
    });

    console.log(
      `Paper type deactivated: ${paperType.name} by ${req.user.username}`
    );
  } catch (error) {
    console.error("Deactivate paper type error:", error);
    res.status(500).json({
      message: "Error deactivating paper type",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "PAPER_TYPE_DEACTIVATE_ERROR",
    });
  }
});

module.exports = router;
