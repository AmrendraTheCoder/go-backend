const mongoose = require("mongoose");
const config = require("../config");

// Import all models
const User = require("../models/User");
const Customer = require("../models/Customer");
const PaperType = require("../models/PaperType");
const Job = require("../models/Job");
const Inventory = require("../models/Inventory");
const Machine = require("../models/Machine");

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // MongoDB connection options
      const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        writeConcern: {
          w: "majority",
          j: true,
          wtimeout: 10000,
        },
      };

      // Connect to MongoDB
      this.connection = await mongoose.connect(config.database.url, options);
      this.isConnected = true;

      console.log("✅ Connected to MongoDB successfully");
      console.log(`📍 Database: ${mongoose.connection.name}`);
      console.log(
        `🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`
      );

      // Set up connection event handlers
      this.setupEventHandlers();

      // Create indexes
      await this.createIndexes();

      return this.connection;
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      throw error;
    }
  }

  setupEventHandlers() {
    const db = mongoose.connection;

    db.on("connected", () => {
      console.log("🔗 MongoDB connected");
      this.isConnected = true;
    });

    db.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      this.isConnected = false;
    });

    db.on("disconnected", () => {
      console.log("🔌 MongoDB disconnected");
      this.isConnected = false;
    });

    db.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
      this.isConnected = true;
    });

    process.on("SIGINT", async () => {
      try {
        await db.close();
        console.log("🛑 MongoDB connection closed through app termination");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error closing MongoDB connection:", error);
        process.exit(1);
      }
    });
  }

  async createIndexes() {
    try {
      console.log("📊 Creating database indexes...");

      // Create indexes for all models
      await User.createIndexes();
      await Customer.createIndexes();
      await PaperType.createIndexes();
      await Job.createIndexes();
      await Inventory.createIndexes();
      await Machine.createIndexes();

      console.log("✅ Database indexes created successfully");
    } catch (error) {
      console.error("❌ Error creating indexes:", error);
      console.log(
        "⚠️  Continuing without indexes (server will still function)"
      );
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log("🔌 MongoDB disconnected successfully");
      }
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: "disconnected", error: "Not connected to database" };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();

      return {
        status: "healthy",
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState,
        collections: Object.keys(mongoose.connection.collections).length,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  async seedDatabase() {
    try {
      console.log("🌱 Starting database seeding...");

      // Check if data already exists
      const userCount = await User.countDocuments();
      const customerCount = await Customer.countDocuments();
      const paperTypeCount = await PaperType.countDocuments();
      const machineCount = await Machine.countDocuments();

      if (
        userCount > 0 ||
        customerCount > 0 ||
        paperTypeCount > 0 ||
        machineCount > 0
      ) {
        console.log("📊 Database already contains data, skipping seeding");
        return;
      }

      // Seed Users
      await this.seedUsers();

      // Seed Customers
      await this.seedCustomers();

      // Seed Paper Types
      await this.seedPaperTypes();

      // Seed Machines
      await this.seedMachines();

      console.log("✅ Database seeding completed successfully");
    } catch (error) {
      console.error("❌ Error seeding database:", error);
      console.log(
        "⚠️  Continuing without seeding (server will still function)"
      );
    }
  }

  async seedUsers() {
    const defaultUsers = [
      {
        username: "admin",
        email: "admin@company.com",
        password: "admin123",
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
        permissions: [
          { module: "users", actions: ["create", "read", "update", "delete"] },
          {
            module: "jobs",
            actions: [
              "create",
              "read",
              "update",
              "delete",
              "approve",
              "reject",
            ],
          },
          {
            module: "inventory",
            actions: ["create", "read", "update", "delete"],
          },
          {
            module: "machines",
            actions: ["create", "read", "update", "delete"],
          },
          {
            module: "reports",
            actions: ["create", "read", "update", "delete"],
          },
          {
            module: "pricing",
            actions: ["create", "read", "update", "delete"],
          },
          {
            module: "quality",
            actions: ["create", "read", "update", "delete"],
          },
          {
            module: "analytics",
            actions: ["create", "read", "update", "delete"],
          },
        ],
        department: "administration",
        assignedArea: "admin_office",
        isActive: true,
        emailVerified: true,
      },
      {
        username: "manager",
        email: "manager@company.com",
        password: "manager123",
        firstName: "Production",
        lastName: "Manager",
        role: "manager",
        permissions: [
          {
            module: "jobs",
            actions: ["create", "read", "update", "approve", "reject"],
          },
          { module: "inventory", actions: ["read", "update"] },
          { module: "machines", actions: ["read", "update"] },
          { module: "reports", actions: ["create", "read"] },
          { module: "quality", actions: ["read", "update"] },
        ],
        department: "production",
        shift: "morning",
        assignedArea: "admin_office",
        isActive: true,
      },
      {
        username: "operator1",
        email: "operator1@company.com",
        password: "operator123",
        firstName: "Machine",
        lastName: "Operator One",
        role: "operator",
        permissions: [
          { module: "jobs", actions: ["read", "update"] },
          { module: "machines", actions: ["read", "update"] },
        ],
        department: "production",
        shift: "morning",
        assignedArea: "machine_1",
        isActive: true,
      },
      {
        username: "operator2",
        email: "operator2@company.com",
        password: "operator123",
        firstName: "Machine",
        lastName: "Operator Two",
        role: "operator",
        permissions: [
          { module: "jobs", actions: ["read", "update"] },
          { module: "machines", actions: ["read", "update"] },
        ],
        department: "production",
        shift: "afternoon",
        assignedArea: "machine_2",
        isActive: true,
      },
      {
        username: "stockmanager",
        email: "stock@company.com",
        password: "stock123",
        firstName: "Stock",
        lastName: "Manager",
        role: "stock_manager",
        permissions: [
          {
            module: "inventory",
            actions: ["create", "read", "update", "delete"],
          },
          { module: "jobs", actions: ["read"] },
        ],
        department: "inventory",
        shift: "morning",
        assignedArea: "stock_area",
        isActive: true,
      },
    ];

    const createdUsers = await User.insertMany(defaultUsers);
    console.log(`👥 Created ${createdUsers.length} default users`);
    return createdUsers;
  }

  async seedCustomers() {
    const defaultCustomers = [
      {
        companyName: "ABC Corporation",
        contactPerson: "John Smith",
        email: "john@abccorp.com",
        phone: "+91-9876543210",
        address: {
          street: "123 Business Street",
          city: "Mumbai",
          state: "Maharashtra",
          zipCode: "400001",
          country: "India",
        },
        businessType: "corporate",
        paymentTerms: "net_30",
        creditLimit: 100000,
        discountPercentage: 5,
        status: "active",
        taxInfo: {
          gstNumber: "GST123456789",
          panNumber: "ABCDE1234F",
        },
      },
      {
        companyName: "XYZ Enterprises",
        contactPerson: "Sarah Johnson",
        email: "sarah@xyzent.com",
        phone: "+91-9876543211",
        address: {
          street: "456 Commerce Road",
          city: "Delhi",
          state: "Delhi",
          zipCode: "110001",
          country: "India",
        },
        businessType: "small_business",
        paymentTerms: "advance",
        creditLimit: 50000,
        discountPercentage: 3,
        status: "active",
      },
      {
        companyName: "Print Solutions Ltd",
        contactPerson: "Raj Patel",
        email: "raj@printsol.com",
        phone: "+91-9876543212",
        address: {
          street: "789 Industrial Area",
          city: "Pune",
          state: "Maharashtra",
          zipCode: "411001",
          country: "India",
        },
        businessType: "corporate",
        paymentTerms: "net_15",
        creditLimit: 75000,
        discountPercentage: 4,
        status: "active",
      },
    ];

    const createdCustomers = await Customer.insertMany(defaultCustomers);
    console.log(`🏢 Created ${createdCustomers.length} default customers`);
    return createdCustomers;
  }

  async seedPaperTypes() {
    const defaultPaperTypes = [
      {
        name: "Bond Paper",
        description: "High-quality bond paper for office use",
        category: "office",
        manufacturer: "JK Paper",
        finish: "smooth",
        opacity: 90,
        brightness: 85,
        specifications: {
          grain: "long",
          formation: "even",
          roughness: "low",
        },
        availableGSM: [70, 80, 90, 100],
        isActive: true,
      },
      {
        name: "Art Paper",
        description: "Glossy art paper for high-quality printing",
        category: "art",
        manufacturer: "ITC Paperboards",
        finish: "glossy",
        opacity: 95,
        brightness: 90,
        specifications: {
          grain: "short",
          formation: "excellent",
          roughness: "very_low",
        },
        availableGSM: [90, 130, 150, 170, 200, 250, 300],
        isActive: true,
      },
      {
        name: "Maplitho Paper",
        description: "Uncoated printing paper for books and magazines",
        category: "book",
        manufacturer: "Ballarpur Industries",
        finish: "matte",
        opacity: 88,
        brightness: 82,
        specifications: {
          grain: "long",
          formation: "good",
          roughness: "medium",
        },
        availableGSM: [60, 70, 80, 90, 100],
        isActive: true,
      },
      {
        name: "Newsprint",
        description: "Economical paper for newspapers and low-cost printing",
        category: "newsprint",
        manufacturer: "Hindustan Newsprint",
        finish: "rough",
        opacity: 85,
        brightness: 70,
        specifications: {
          grain: "long",
          formation: "fair",
          roughness: "high",
        },
        availableGSM: [45, 48.8, 52],
        isActive: true,
      },
      {
        name: "Card Stock",
        description: "Heavy-duty paper for business cards and packaging",
        category: "cardboard",
        manufacturer: "Tamil Nadu Newsprint",
        finish: "smooth",
        opacity: 98,
        brightness: 88,
        specifications: {
          grain: "short",
          formation: "excellent",
          roughness: "low",
        },
        availableGSM: [200, 250, 300, 350, 400],
        isActive: true,
      },
    ];

    const createdPaperTypes = await PaperType.insertMany(defaultPaperTypes);
    console.log(`📄 Created ${createdPaperTypes.length} default paper types`);
    return createdPaperTypes;
  }

  async seedMachines() {
    const defaultMachines = [
      {
        machineId: "MAC001",
        name: "Heidelberg Offset Press",
        model: "SM 102-4P",
        manufacturer: "Heidelberg",
        serialNumber: "HB12345678",
        specifications: {
          type: "offset_printing",
          maxPaperSize: { width: 29.1, height: 40.9 }, // B1 size
          minPaperSize: { width: 8.3, height: 11.7 }, // A4 size
          maxSpeed: 15000, // sheets per hour
          colorCapability: "color",
          maxGSM: 400,
          minGSM: 70,
          powerConsumption: 25, // kW
          dimensions: { length: 850, width: 400, height: 200 }, // cm
          weight: 12000, // kg
        },
        currentStatus: "idle",
        location: {
          area: "production_floor",
          position: "Station A",
        },
        installationDate: new Date("2020-01-15"),
        warrantyExpiry: new Date("2025-01-15"),
        expectedLifespan: 20,
        maintenanceInterval: 30,
        supplies: {
          ink: {
            cyan: { level: 75 },
            magenta: { level: 80 },
            yellow: { level: 70 },
            black: { level: 85 },
          },
          paper: {
            currentLoad: 5000,
            maxCapacity: 10000,
          },
        },
        settings: {
          autoShutdown: { enabled: true, idleTime: 60 },
          qualityChecks: { enabled: true, frequency: 100 },
          notifications: { email: true, sms: false, dashboard: true },
        },
        isActive: true,
        isOnline: true,
      },
      {
        machineId: "MAC002",
        name: "Komori Lithrone",
        model: "GL840P",
        manufacturer: "Komori",
        serialNumber: "KM87654321",
        specifications: {
          type: "offset_printing",
          maxPaperSize: { width: 32.3, height: 46.8 }, // B0 size
          minPaperSize: { width: 8.3, height: 11.7 }, // A4 size
          maxSpeed: 16000,
          colorCapability: "color",
          maxGSM: 400,
          minGSM: 70,
          powerConsumption: 30,
          dimensions: { length: 900, width: 450, height: 220 },
          weight: 15000,
        },
        currentStatus: "idle",
        location: {
          area: "production_floor",
          position: "Station B",
        },
        installationDate: new Date("2021-06-10"),
        warrantyExpiry: new Date("2026-06-10"),
        expectedLifespan: 20,
        maintenanceInterval: 30,
        supplies: {
          ink: {
            cyan: { level: 60 },
            magenta: { level: 65 },
            yellow: { level: 70 },
            black: { level: 75 },
          },
          paper: {
            currentLoad: 3000,
            maxCapacity: 12000,
          },
        },
        settings: {
          autoShutdown: { enabled: true, idleTime: 60 },
          qualityChecks: { enabled: true, frequency: 100 },
          notifications: { email: true, sms: false, dashboard: true },
        },
        isActive: true,
        isOnline: true,
      },
    ];

    const createdMachines = await Machine.insertMany(defaultMachines);
    console.log(`🏭 Created ${createdMachines.length} default machines`);

    // Assign operators to machines
    const operators = await User.find({
      role: { $in: ["operator", "machine_worker"] },
    });
    if (operators.length > 0) {
      await Machine.findByIdAndUpdate(createdMachines[0]._id, {
        $push: { assignedOperators: operators[0]._id },
      });

      if (operators.length > 1) {
        await Machine.findByIdAndUpdate(createdMachines[1]._id, {
          $push: { assignedOperators: operators[1]._id },
        });
      }

      console.log(`🔗 Assigned operators to machines`);
    }

    return createdMachines;
  }

  async clearDatabase() {
    try {
      console.log("🗑️ Clearing database...");

      await User.deleteMany({});
      await Customer.deleteMany({});
      await PaperType.deleteMany({});
      await Job.deleteMany({});
      await Inventory.deleteMany({});
      await Machine.deleteMany({});

      console.log("✅ Database cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing database:", error);
      throw error;
    }
  }

  // Get database statistics
  async getStats() {
    try {
      const stats = {
        users: await User.countDocuments(),
        customers: await Customer.countDocuments(),
        paperTypes: await PaperType.countDocuments(),
        jobs: await Job.countDocuments(),
        inventory: await Inventory.countDocuments(),
        machines: await Machine.countDocuments(),
        activeJobs: await Job.countDocuments({
          "review.status": { $in: ["pending", "approved", "in_progress"] },
        }),
        activeMachines: await Machine.countDocuments({ isActive: true }),
        lowStockItems: await Inventory.countDocuments({
          "alerts.lowStock": true,
        }),
      };

      return stats;
    } catch (error) {
      console.error("❌ Error getting database stats:", error);
      throw error;
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
