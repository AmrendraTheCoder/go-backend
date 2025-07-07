const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Job = require("../models/Job");
const Customer = require("../models/Customer");
const PaperType = require("../models/PaperType");
const Machine = require("../models/Machine");
const Inventory = require("../models/Inventory");
const config = require("../config");
const {
  authenticate,
  requireRole,
  requireMachineAccess,
} = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get jobs with filtering and pagination
// @access  Private (All authenticated users)
router.get(
  "/",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status")
      .optional()
      .isIn([
        "pending",
        "approved",
        "in_progress",
        "completed",
        "rejected",
        "cancelled",
      ]),
    query("assignedMachine").optional().isIn(["Machine 1", "Machine 2"]),
    query("partyName").optional().isLength({ min: 1 }),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
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

      if (req.query.status) filter.status = req.query.status;
      if (req.query.assignedMachine)
        filter["costCalculation.assignedMachine"] = req.query.assignedMachine;
      if (req.query.partyName)
        filter["basicInfo.partyName"] = new RegExp(req.query.partyName, "i");

      // Date range filter
      if (req.query.startDate || req.query.endDate) {
        filter["basicInfo.jobDate"] = {};
        if (req.query.startDate)
          filter["basicInfo.jobDate"].$gte = new Date(req.query.startDate);
        if (req.query.endDate)
          filter["basicInfo.jobDate"].$lte = new Date(req.query.endDate);
      }

      // Search across job name and party name
      if (req.query.search) {
        filter.$or = [
          { "basicInfo.jobName": new RegExp(req.query.search, "i") },
          { "basicInfo.partyName": new RegExp(req.query.search, "i") },
          { jobId: new RegExp(req.query.search, "i") },
        ];
      }

      // Role-based filtering
      if (req.user.role === "machine_worker" || req.user.role === "operator") {
        // Filter by assigned machines for machine workers
        if (req.user.assignedMachines && req.user.assignedMachines.length > 0) {
          const machineNames = req.user.assignedMachines.map(
            (m) => m.name || m.machineId
          );
          filter["costCalculation.assignedMachine"] = { $in: machineNames };
        }
      }

      const jobs = await Job.find(filter)
        .populate("assignedTo", "firstName lastName username")
        .populate("reviewedBy", "firstName lastName username")
        .populate("createdBy", "firstName lastName username")
        .sort({ "basicInfo.jobDate": -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Job.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Calculate summary statistics
      const stats = {
        total,
        pending: await Job.countDocuments({ ...filter, status: "pending" }),
        approved: await Job.countDocuments({ ...filter, status: "approved" }),
        inProgress: await Job.countDocuments({
          ...filter,
          status: "in_progress",
        }),
        completed: await Job.countDocuments({ ...filter, status: "completed" }),
        rejected: await Job.countDocuments({ ...filter, status: "rejected" }),
      };

      res.json({
        message: "Jobs retrieved successfully",
        jobs,
        pagination: {
          currentPage: page,
          totalPages,
          totalJobs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats,
        code: "JOBS_SUCCESS",
      });
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({
        message: "Error retrieving jobs",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "JOBS_ERROR",
      });
    }
  }
);

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Private (All authenticated users)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("assignedTo", "firstName lastName username")
      .populate("reviewedBy", "firstName lastName username")
      .populate("createdBy", "firstName lastName username")
      .populate("qualityChecks.performedBy", "firstName lastName username")
      .populate("progress.updates.updatedBy", "firstName lastName username");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        code: "JOB_NOT_FOUND",
      });
    }

    // Check access permissions
    const canAccess =
      req.user.role === "admin" ||
      req.user.role === "manager" ||
      job.assignedTo?.toString() === req.user._id.toString() ||
      job.createdBy?.toString() === req.user._id.toString() ||
      (req.user.role === "machine_worker" &&
        req.user.assignedMachines?.some(
          (m) => (m.name || m.machineId) === job.costCalculation.assignedMachine
        ));

    if (!canAccess) {
      return res.status(403).json({
        message: "Access denied. You cannot view this job.",
        code: "ACCESS_DENIED",
      });
    }

    res.json({
      message: "Job retrieved successfully",
      job,
      code: "JOB_SUCCESS",
    });
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({
      message: "Error retrieving job",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "JOB_ERROR",
    });
  }
});

// @route   POST /api/jobs
// @desc    Create new job
// @access  Private (Operator, Manager, Admin)
router.post(
  "/",
  authenticate,
  requireRole("admin", "manager", "operator"),
  [
    // Section 1: Basic Info validation
    body("basicInfo.jobName")
      .notEmpty()
      .trim()
      .withMessage("Job name is required"),
    body("basicInfo.jobDate")
      .isISO8601()
      .withMessage("Valid job date is required"),
    body("basicInfo.partyName")
      .notEmpty()
      .trim()
      .withMessage("Party name is required"),

    // Section 2: Job Details validation
    body("jobDetails.jobType")
      .isIn(["single-single", "front-back"])
      .withMessage("Invalid job type"),
    body("jobDetails.plates")
      .isInt({ min: 1 })
      .withMessage("Plates must be a positive integer"),
    body("jobDetails.paperSize")
      .notEmpty()
      .trim()
      .withMessage("Paper size is required"),
    body("jobDetails.paperSheets")
      .isInt({ min: 1 })
      .withMessage("Paper sheets must be a positive integer"),
    body("jobDetails.paperType")
      .notEmpty()
      .trim()
      .withMessage("Paper type is required"),
    body("jobDetails.gsm")
      .isNumeric({ min: 1 })
      .withMessage("GSM must be a positive number"),
    body("jobDetails.paperProvidedByParty")
      .isBoolean()
      .withMessage("Paper provided by party must be boolean"),
    body("jobDetails.impressionsOverride").optional().isInt({ min: 1 }),

    // Section 3: Cost Calculation validation
    body("costCalculation.assignedMachine")
      .isIn(["Machine 1", "Machine 2"])
      .withMessage("Invalid machine assignment"),
    body("costCalculation.ratePerUnit")
      .isNumeric({ min: 0 })
      .withMessage("Rate per unit must be a positive number"),
    body("costCalculation.platePricePerPlate")
      .isNumeric({ min: 0 })
      .withMessage("Plate price must be a positive number"),
    body("costCalculation.uvCoatingCost").optional().isNumeric({ min: 0 }),
    body("costCalculation.bakingCost").optional().isNumeric({ min: 0 }),
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

      const { basicInfo, jobDetails, costCalculation, review } = req.body;

      // Verify party/customer exists
      const customer = await Customer.findOne({
        $or: [
          { companyName: basicInfo.partyName },
          { contactPerson: basicInfo.partyName },
        ],
      });

      if (!customer) {
        return res.status(400).json({
          message: "Party/Customer not found. Please add customer first.",
          code: "CUSTOMER_NOT_FOUND",
        });
      }

      // Create job with pre-save calculations
      const job = new Job({
        basicInfo,
        jobDetails,
        costCalculation,
        review: review || {},
        createdBy: req.user._id,
        status: "pending",
      });

      await job.save();

      // Populate and return
      const populatedJob = await Job.findById(job._id).populate(
        "createdBy",
        "firstName lastName username"
      );

      res.status(201).json({
        message: "Job created successfully",
        job: populatedJob,
        code: "JOB_CREATED",
      });

      // Emit real-time update
      req.io.emit("job-created", {
        job: populatedJob,
        creator: req.user.username,
      });

      console.log(`Job created: ${job.jobId} by ${req.user.username}`);
    } catch (error) {
      console.error("Create job error:", error);
      res.status(500).json({
        message: "Error creating job",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "JOB_CREATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/jobs/:id/status
// @desc    Update job status (approve/reject/complete)
// @access  Private (Manager/Admin for approve/reject, assigned user for progress)
router.put(
  "/:id/status",
  authenticate,
  [
    body("status")
      .isIn([
        "pending",
        "approved",
        "rejected",
        "in_progress",
        "completed",
        "cancelled",
      ])
      .withMessage("Invalid status"),
    body("reviewNotes").optional().trim(),
    body("rejectionReason").optional().trim(),
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

      const { status, reviewNotes, rejectionReason } = req.body;
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          message: "Job not found",
          code: "JOB_NOT_FOUND",
        });
      }

      // Check permissions based on status change
      if (["approved", "rejected"].includes(status)) {
        if (!["admin", "manager"].includes(req.user.role)) {
          return res.status(403).json({
            message: "Only admins and managers can approve/reject jobs",
            code: "INSUFFICIENT_PERMISSIONS",
          });
        }
      }

      if (["in_progress", "completed"].includes(status)) {
        const canUpdate =
          req.user.role === "admin" ||
          req.user.role === "manager" ||
          job.assignedTo?.toString() === req.user._id.toString() ||
          (req.user.role === "machine_worker" &&
            req.user.assignedMachines?.some(
              (m) =>
                (m.name || m.machineId) === job.costCalculation.assignedMachine
            ));

        if (!canUpdate) {
          return res.status(403).json({
            message: "You cannot update this job status",
            code: "ACCESS_DENIED",
          });
        }
      }

      // Update job status
      job.status = status;

      if (["approved", "rejected"].includes(status)) {
        job.reviewedBy = req.user._id;
        job.review.reviewedAt = new Date();
        job.review.reviewNotes = reviewNotes || "";

        if (status === "rejected") {
          job.review.rejectionReason = rejectionReason || "";
        }
      }

      if (status === "in_progress") {
        job.progress.startedAt = new Date();
        job.assignedTo = req.user._id;
      }

      if (status === "completed") {
        job.progress.completedAt = new Date();
        if (!job.progress.startedAt) {
          job.progress.startedAt = new Date();
        }
      }

      await job.save();

      // Populate and return
      const updatedJob = await Job.findById(job._id)
        .populate("assignedTo", "firstName lastName username")
        .populate("reviewedBy", "firstName lastName username")
        .populate("createdBy", "firstName lastName username");

      res.json({
        message: `Job ${status} successfully`,
        job: updatedJob,
        code: "JOB_STATUS_UPDATED",
      });

      // Emit real-time update
      req.io.emit("job-status-updated", {
        jobId: job._id,
        jobNumber: job.jobId,
        status: status,
        updatedBy: req.user.username,
        assignedMachine: job.costCalculation.assignedMachine,
      });

      console.log(
        `Job ${job.jobId} status changed to ${status} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Update job status error:", error);
      res.status(500).json({
        message: "Error updating job status",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "JOB_STATUS_ERROR",
      });
    }
  }
);

// @route   PUT /api/jobs/:id/progress
// @desc    Update job progress
// @access  Private (Assigned user, Machine workers, Manager, Admin)
router.put(
  "/:id/progress",
  authenticate,
  [
    body("progressPercentage").optional().isInt({ min: 0, max: 100 }),
    body("currentStage")
      .optional()
      .isIn(["setup", "printing", "quality_check", "finishing", "packaging"]),
    body("notes").optional().trim(),
    body("sheetsCompleted").optional().isInt({ min: 0 }),
    body("wasteSheets").optional().isInt({ min: 0 }),
    body("qualityIssues").optional().isArray(),
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
        progressPercentage,
        currentStage,
        notes,
        sheetsCompleted,
        wasteSheets,
        qualityIssues,
      } = req.body;

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          message: "Job not found",
          code: "JOB_NOT_FOUND",
        });
      }

      // Check access permissions
      const canUpdate =
        req.user.role === "admin" ||
        req.user.role === "manager" ||
        job.assignedTo?.toString() === req.user._id.toString() ||
        (req.user.role === "machine_worker" &&
          req.user.assignedMachines?.some(
            (m) =>
              (m.name || m.machineId) === job.costCalculation.assignedMachine
          ));

      if (!canUpdate) {
        return res.status(403).json({
          message: "You cannot update this job progress",
          code: "ACCESS_DENIED",
        });
      }

      // Update progress fields
      if (progressPercentage !== undefined)
        job.progress.progressPercentage = progressPercentage;
      if (currentStage) job.progress.currentStage = currentStage;
      if (sheetsCompleted !== undefined)
        job.progress.sheetsCompleted = sheetsCompleted;
      if (wasteSheets !== undefined) job.progress.wasteSheets = wasteSheets;

      // Add progress update entry
      const updateEntry = {
        timestamp: new Date(),
        progressPercentage: job.progress.progressPercentage,
        currentStage: job.progress.currentStage,
        notes: notes || "",
        updatedBy: req.user._id,
      };

      job.progress.updates.push(updateEntry);

      // Handle quality issues
      if (qualityIssues && qualityIssues.length > 0) {
        qualityIssues.forEach((issue) => {
          job.qualityChecks.push({
            checkType: "progress_update",
            checkResult: issue.severity || "minor",
            issues: [issue.description || issue],
            actionsTaken: issue.action || "Noted for monitoring",
            performedBy: req.user._id,
            performedAt: new Date(),
          });
        });
      }

      // Auto-update job status based on progress
      if (job.status === "approved" && progressPercentage > 0) {
        job.status = "in_progress";
        if (!job.progress.startedAt) {
          job.progress.startedAt = new Date();
        }
        job.assignedTo = req.user._id;
      }

      if (progressPercentage === 100 && job.status === "in_progress") {
        job.status = "completed";
        job.progress.completedAt = new Date();
      }

      await job.save();

      // Populate and return
      const updatedJob = await Job.findById(job._id)
        .populate("assignedTo", "firstName lastName username")
        .populate("progress.updates.updatedBy", "firstName lastName username");

      res.json({
        message: "Job progress updated successfully",
        job: updatedJob,
        code: "JOB_PROGRESS_UPDATED",
      });

      // Emit real-time update
      req.io.emit("job-progress-updated", {
        jobId: job._id,
        jobNumber: job.jobId,
        progressPercentage: job.progress.progressPercentage,
        currentStage: job.progress.currentStage,
        updatedBy: req.user.username,
        assignedMachine: job.costCalculation.assignedMachine,
      });
    } catch (error) {
      console.error("Update job progress error:", error);
      res.status(500).json({
        message: "Error updating job progress",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "JOB_PROGRESS_ERROR",
      });
    }
  }
);

// @route   POST /api/jobs/:id/quality-check
// @desc    Add quality check to job
// @access  Private (Quality checker, Manager, Admin)
router.post(
  "/:id/quality-check",
  authenticate,
  requireRole("admin", "manager", "quality_checker", "machine_worker"),
  [
    body("checkType")
      .isIn(["pre_print", "mid_print", "post_print", "final"])
      .withMessage("Invalid check type"),
    body("checkResult")
      .isIn(["pass", "fail", "warning"])
      .withMessage("Invalid check result"),
    body("issues").optional().isArray(),
    body("actionsTaken").optional().trim(),
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

      const { checkType, checkResult, issues, actionsTaken, notes } = req.body;
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          message: "Job not found",
          code: "JOB_NOT_FOUND",
        });
      }

      // Add quality check
      const qualityCheck = {
        checkType,
        checkResult,
        issues: issues || [],
        actionsTaken: actionsTaken || "",
        notes: notes || "",
        performedBy: req.user._id,
        performedAt: new Date(),
      };

      job.qualityChecks.push(qualityCheck);

      // Update overall quality status
      const failedChecks = job.qualityChecks.filter(
        (check) => check.checkResult === "fail"
      );
      if (failedChecks.length > 0) {
        job.qualityStatus = "failed";
      } else {
        const warningChecks = job.qualityChecks.filter(
          (check) => check.checkResult === "warning"
        );
        job.qualityStatus = warningChecks.length > 0 ? "warning" : "passed";
      }

      await job.save();

      // Populate and return
      const updatedJob = await Job.findById(job._id).populate(
        "qualityChecks.performedBy",
        "firstName lastName username"
      );

      res.json({
        message: "Quality check added successfully",
        job: updatedJob,
        qualityCheck: qualityCheck,
        code: "QUALITY_CHECK_ADDED",
      });

      // Emit real-time update
      req.io.emit("quality-check-added", {
        jobId: job._id,
        jobNumber: job.jobId,
        checkResult,
        checkType,
        performedBy: req.user.username,
        qualityStatus: job.qualityStatus,
      });
    } catch (error) {
      console.error("Add quality check error:", error);
      res.status(500).json({
        message: "Error adding quality check",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "QUALITY_CHECK_ERROR",
      });
    }
  }
);

// @route   GET /api/jobs/machine/:machineId
// @desc    Get jobs for specific machine
// @access  Private (Machine workers for assigned machines, Manager, Admin)
router.get("/machine/:machineId", authenticate, async (req, res) => {
  try {
    const { machineId } = req.params;

    // Check machine access
    if (!["admin", "manager"].includes(req.user.role)) {
      const hasAccess = req.user.assignedMachines?.some(
        (machine) =>
          machine.machineId === machineId || machine.name === machineId
      );

      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. You are not assigned to this machine.",
          code: "MACHINE_ACCESS_DENIED",
        });
      }
    }

    const jobs = await Job.find({
      "costCalculation.assignedMachine": machineId,
      status: { $in: ["approved", "in_progress"] },
    })
      .populate("assignedTo", "firstName lastName username")
      .populate("createdBy", "firstName lastName username")
      .sort({ "basicInfo.jobDate": 1, priority: -1 });

    res.json({
      message: "Machine jobs retrieved successfully",
      jobs,
      machineId,
      code: "MACHINE_JOBS_SUCCESS",
    });
  } catch (error) {
    console.error("Get machine jobs error:", error);
    res.status(500).json({
      message: "Error retrieving machine jobs",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "MACHINE_JOBS_ERROR",
    });
  }
});

// @route   GET /api/jobs/reports/summary
// @desc    Get job summary report
// @access  Private (Manager, Admin)
router.get(
  "/reports/summary",
  authenticate,
  requireRole("admin", "manager"),
  [
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("machine").optional().isIn(["Machine 1", "Machine 2"]),
  ],
  async (req, res) => {
    try {
      const { startDate, endDate, machine } = req.query;

      const matchFilter = {};

      if (startDate || endDate) {
        matchFilter["basicInfo.jobDate"] = {};
        if (startDate)
          matchFilter["basicInfo.jobDate"].$gte = new Date(startDate);
        if (endDate) matchFilter["basicInfo.jobDate"].$lte = new Date(endDate);
      }

      if (machine) {
        matchFilter["costCalculation.assignedMachine"] = machine;
      }

      const summary = await Job.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            totalRevenue: { $sum: "$costCalculation.totalCost" },
            avgJobValue: { $avg: "$costCalculation.totalCost" },
            totalSheets: { $sum: "$jobDetails.paperSheets" },
            totalImpressions: { $sum: "$jobDetails.impressions" },
            statusBreakdown: {
              $push: "$status",
            },
            machineBreakdown: {
              $push: "$costCalculation.assignedMachine",
            },
          },
        },
      ]);

      // Process status and machine breakdowns
      const result = summary[0] || {
        totalJobs: 0,
        totalRevenue: 0,
        avgJobValue: 0,
        totalSheets: 0,
        totalImpressions: 0,
        statusBreakdown: [],
        machineBreakdown: [],
      };

      // Count status occurrences
      const statusCounts = {};
      result.statusBreakdown.forEach((status) => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Count machine occurrences
      const machineCounts = {};
      result.machineBreakdown.forEach((machine) => {
        machineCounts[machine] = (machineCounts[machine] || 0) + 1;
      });

      delete result.statusBreakdown;
      delete result.machineBreakdown;

      result.statusCounts = statusCounts;
      result.machineCounts = machineCounts;

      res.json({
        message: "Job summary report generated successfully",
        summary: result,
        filters: { startDate, endDate, machine },
        generatedAt: new Date(),
        code: "JOB_SUMMARY_SUCCESS",
      });
    } catch (error) {
      console.error("Job summary report error:", error);
      res.status(500).json({
        message: "Error generating job summary report",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "JOB_SUMMARY_ERROR",
      });
    }
  }
);

module.exports = router;
