/**
 * Inventory Management Component
 * Handles paper stock management, alerts, material tracking, and supplier management
 */
export class InventoryComponent {
  constructor(stateManager, apiClient) {
    this.state = stateManager;
    this.api = apiClient;
    this.inventory = [];
    this.paperTypes = [];
    this.paperSizes = [];
    this.filters = {
      type: "all",
      supplier: "all",
      status: "all",
    };
    this.sortBy = "name";
    this.sortOrder = "asc";
  }

  async render(container) {
    try {
      // Load inventory data
      await this.loadInventoryData();

      container.innerHTML = `
        <div class="p-4 lg:p-6 max-w-7xl mx-auto">
          <!-- Page Header -->
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
              <p class="text-gray-600">Manage paper stock, track usage, and monitor inventory levels</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
              <button 
                id="refresh-inventory" 
                class="btn-touch px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fas fa-sync-alt"></i>
                <span>Refresh</span>
              </button>
              <button 
                id="add-stock-btn" 
                class="btn-touch px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fas fa-plus"></i>
                <span>Add Stock</span>
              </button>
            </div>
          </div>

          <!-- Alerts Section -->
          <div id="inventory-alerts" class="mb-6">
            <!-- Alerts will be populated here -->
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-blue-100 rounded-lg">
                  <i class="fas fa-boxes text-blue-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Total Items</p>
                  <p id="total-items" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-green-100 rounded-lg">
                  <i class="fas fa-check-circle text-green-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">In Stock</p>
                  <p id="in-stock-items" class="text-2xl font-bold text-green-600">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-yellow-100 rounded-lg">
                  <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Low Stock</p>
                  <p id="low-stock-items" class="text-2xl font-bold text-yellow-600">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-red-100 rounded-lg">
                  <i class="fas fa-times-circle text-red-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Out of Stock</p>
                  <p id="out-of-stock-items" class="text-2xl font-bold text-red-600">0</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters and Controls -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div class="p-4 border-b border-gray-200">
              <div class="flex flex-col lg:flex-row gap-4">
                <!-- Filters -->
                <div class="flex flex-wrap gap-3">
                  <select id="type-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Paper Types</option>
                    <!-- Options will be populated dynamically -->
                  </select>
                  
                  <select id="supplier-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Suppliers</option>
                    <option value="company">Company Stock</option>
                    <option value="customer">Customer Provided</option>
                  </select>
                  
                  <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Status</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>

                  <select id="sort-by" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="name">Sort by Name</option>
                    <option value="quantity">Sort by Quantity</option>
                    <option value="type">Sort by Type</option>
                    <option value="gsm">Sort by GSM</option>
                    <option value="updated">Sort by Last Updated</option>
                  </select>
                </div>
                
                <!-- Search -->
                <div class="flex-1 max-w-md">
                  <input 
                    type="text" 
                    id="inventory-search" 
                    placeholder="Search by paper type, size, GSM..." 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory List -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Paper Stock Inventory</h3>
            </div>
            
            <!-- Table Header -->
            <div class="hidden lg:grid lg:grid-cols-8 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-200">
              <div>Paper Type</div>
              <div>Size</div>
              <div>GSM</div>
              <div>Quantity</div>
              <div>Unit</div>
              <div>Supplier</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            <!-- Inventory Items -->
            <div id="inventory-list" class="divide-y divide-gray-200">
              <!-- Items will be populated here -->
            </div>

            <!-- Empty State -->
            <div id="inventory-empty-state" class="hidden text-center py-12">
              <i class="fas fa-boxes text-gray-400 text-6xl mb-4"></i>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
              <p class="text-gray-600 mb-6">Add your first paper stock item to get started</p>
              <button 
                id="add-first-stock" 
                class="btn-touch px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
              >
                Add First Stock Item
              </button>
            </div>
          </div>
        </div>

        <!-- Add/Edit Stock Modal -->
        <div id="stock-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="stock-modal-title" class="text-xl font-semibold text-gray-900">Add Stock</h2>
              <button id="close-stock-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="stock-modal-content" class="p-6">
              <!-- Stock form will be loaded here -->
            </div>
          </div>
        </div>

        <!-- Stock Adjustment Modal -->
        <div id="adjustment-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Adjust Stock</h2>
              <button id="close-adjustment-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="adjustment-modal-content" class="p-6">
              <!-- Adjustment form will be loaded here -->
            </div>
          </div>
        </div>
      `;

      this.attachEventListeners();
      this.populateFilters();
      this.renderInventory();
      this.updateStats();
      this.renderAlerts();
    } catch (error) {
      console.error("Error rendering inventory component:", error);
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Inventory</h3>
          <p class="text-gray-600">Please try refreshing the page</p>
        </div>
      `;
    }
  }

  async loadInventoryData() {
    try {
      const [inventoryResponse, paperTypesResponse, paperSizesResponse] =
        await Promise.all([
          this.api.get("/inventory"),
          this.api.get("/paper-types"),
          this.api.get("/paper-sizes"),
        ]);

      this.inventory = inventoryResponse.data || [];
      this.paperTypes = paperTypesResponse.data || [];
      this.paperSizes = paperSizesResponse.data || [];

      this.state.set("inventory", this.inventory);
      this.state.set("paperTypes", this.paperTypes);
      this.state.set("paperSizes", this.paperSizes);
    } catch (error) {
      console.error("Error loading inventory data:", error);
      this.inventory = [];
      this.paperTypes = [];
      this.paperSizes = [];
    }
  }

  populateFilters() {
    const typeFilter = document.getElementById("type-filter");
    if (typeFilter) {
      typeFilter.innerHTML =
        '<option value="all">All Paper Types</option>' +
        this.paperTypes
          .map((type) => `<option value="${type._id}">${type.name}</option>`)
          .join("");
    }
  }

  renderInventory() {
    const listContainer = document.getElementById("inventory-list");
    const emptyState = document.getElementById("inventory-empty-state");

    const filteredInventory = this.filterInventory();

    if (filteredInventory.length === 0) {
      listContainer.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    listContainer.innerHTML = filteredInventory
      .map((item) => this.createInventoryItemRow(item))
      .join("");
  }

  createInventoryItemRow(item) {
    const status = this.getStockStatus(item);
    const statusColors = {
      "in-stock": "bg-green-100 text-green-800",
      "low-stock": "bg-yellow-100 text-yellow-800",
      "out-of-stock": "bg-red-100 text-red-800",
    };

    return `
      <div class="p-4 hover:bg-gray-50 transition-colors">
        <!-- Mobile Layout -->
        <div class="lg:hidden space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-gray-900">${
                item.paperType?.name || "Unknown Type"
              }</h4>
              <p class="text-sm text-gray-600">${
                item.size?.name || item.size
              } - ${item.gsm}gsm</p>
            </div>
            <span class="px-2 py-1 text-xs font-medium rounded-full ${
              statusColors[status]
            }">
              ${status.replace("-", " ").toUpperCase()}
            </span>
          </div>
          
          <div class="flex items-center justify-between text-sm">
            <div>
              <span class="text-gray-600">Qty:</span> 
              <span class="font-medium">${item.quantity} ${item.unit}</span>
            </div>
            <div>
              <span class="text-gray-600">Supplier:</span> 
              <span class="font-medium">${
                item.supplier === "customer" ? "Customer" : "Company"
              }</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="adjust-stock-btn flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium" data-item-id="${
              item._id
            }">
              <i class="fas fa-edit mr-1"></i> Adjust
            </button>
            <button class="view-history-btn flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg font-medium" data-item-id="${
              item._id
            }">
              <i class="fas fa-history mr-1"></i> History
            </button>
          </div>
        </div>

        <!-- Desktop Layout -->
        <div class="hidden lg:grid lg:grid-cols-8 gap-4 items-center">
          <div class="font-medium text-gray-900">${
            item.paperType?.name || "Unknown Type"
          }</div>
          <div class="text-gray-600">${item.size?.name || item.size}</div>
          <div class="text-gray-600">${item.gsm}gsm</div>
          <div class="font-medium text-gray-900">${item.quantity}</div>
          <div class="text-gray-600">${item.unit}</div>
          <div class="text-gray-600">${
            item.supplier === "customer" ? "Customer" : "Company"
          }</div>
          <div>
            <span class="px-2 py-1 text-xs font-medium rounded-full ${
              statusColors[status]
            }">
              ${status.replace("-", " ").toUpperCase()}
            </span>
          </div>
          <div class="flex gap-2">
            <button class="adjust-stock-btn btn-touch px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg" data-item-id="${
              item._id
            }">
              <i class="fas fa-edit"></i>
            </button>
            <button class="view-history-btn btn-touch px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg" data-item-id="${
              item._id
            }">
              <i class="fas fa-history"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  filterInventory() {
    return this.inventory
      .filter((item) => {
        const matchesType =
          this.filters.type === "all" ||
          item.paperType?._id === this.filters.type;
        const matchesSupplier =
          this.filters.supplier === "all" ||
          item.supplier === this.filters.supplier;

        const status = this.getStockStatus(item);
        const matchesStatus =
          this.filters.status === "all" || status === this.filters.status;

        const searchTerm =
          document.getElementById("inventory-search")?.value.toLowerCase() ||
          "";
        const matchesSearch =
          !searchTerm ||
          item.paperType?.name?.toLowerCase().includes(searchTerm) ||
          item.size?.name?.toLowerCase().includes(searchTerm) ||
          item.size?.toLowerCase().includes(searchTerm) ||
          item.gsm?.toString().includes(searchTerm);

        return matchesType && matchesSupplier && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const getValue = (item, field) => {
          switch (field) {
            case "name":
              return item.paperType?.name || "";
            case "quantity":
              return item.quantity || 0;
            case "type":
              return item.paperType?.name || "";
            case "gsm":
              return item.gsm || 0;
            case "updated":
              return new Date(item.updatedAt || item.createdAt || 0);
            default:
              return "";
          }
        };

        const aVal = getValue(a, this.sortBy);
        const bVal = getValue(b, this.sortBy);

        if (this.sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
  }

  getStockStatus(item) {
    const quantity = item.quantity || 0;
    const minStock = item.minStock || 50; // Default minimum stock level

    if (quantity === 0) return "out-of-stock";
    if (quantity <= minStock) return "low-stock";
    return "in-stock";
  }

  updateStats() {
    const totalItems = this.inventory.length;
    const inStock = this.inventory.filter(
      (item) => this.getStockStatus(item) === "in-stock"
    ).length;
    const lowStock = this.inventory.filter(
      (item) => this.getStockStatus(item) === "low-stock"
    ).length;
    const outOfStock = this.inventory.filter(
      (item) => this.getStockStatus(item) === "out-of-stock"
    ).length;

    document.getElementById("total-items").textContent = totalItems;
    document.getElementById("in-stock-items").textContent = inStock;
    document.getElementById("low-stock-items").textContent = lowStock;
    document.getElementById("out-of-stock-items").textContent = outOfStock;
  }

  renderAlerts() {
    const alertsContainer = document.getElementById("inventory-alerts");
    const lowStockItems = this.inventory.filter(
      (item) => this.getStockStatus(item) === "low-stock"
    );
    const outOfStockItems = this.inventory.filter(
      (item) => this.getStockStatus(item) === "out-of-stock"
    );

    if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
      alertsContainer.innerHTML = "";
      return;
    }

    const alerts = [];

    if (outOfStockItems.length > 0) {
      alerts.push(`
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-600 text-xl mr-3"></i>
            <div>
              <h3 class="text-red-800 font-medium">Out of Stock Alert</h3>
              <p class="text-red-700 text-sm">${outOfStockItems.length} items are out of stock and need immediate restocking</p>
            </div>
          </div>
        </div>
      `);
    }

    if (lowStockItems.length > 0) {
      alerts.push(`
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-yellow-600 text-xl mr-3"></i>
            <div>
              <h3 class="text-yellow-800 font-medium">Low Stock Alert</h3>
              <p class="text-yellow-700 text-sm">${lowStockItems.length} items are running low and should be reordered soon</p>
            </div>
          </div>
        </div>
      `);
    }

    alertsContainer.innerHTML = `<div class="space-y-4">${alerts.join(
      ""
    )}</div>`;
  }

  attachEventListeners() {
    // Filter change handlers
    document.getElementById("type-filter")?.addEventListener("change", (e) => {
      this.filters.type = e.target.value;
      this.renderInventory();
    });

    document
      .getElementById("supplier-filter")
      ?.addEventListener("change", (e) => {
        this.filters.supplier = e.target.value;
        this.renderInventory();
      });

    document
      .getElementById("status-filter")
      ?.addEventListener("change", (e) => {
        this.filters.status = e.target.value;
        this.renderInventory();
      });

    document.getElementById("sort-by")?.addEventListener("change", (e) => {
      this.sortBy = e.target.value;
      this.renderInventory();
    });

    // Search handler
    document
      .getElementById("inventory-search")
      ?.addEventListener("input", () => {
        this.renderInventory();
      });

    // Refresh button
    document
      .getElementById("refresh-inventory")
      ?.addEventListener("click", async () => {
        await this.loadInventoryData();
        this.renderInventory();
        this.updateStats();
        this.renderAlerts();
      });

    // Add stock buttons
    document.getElementById("add-stock-btn")?.addEventListener("click", () => {
      this.showStockModal();
    });

    document
      .getElementById("add-first-stock")
      ?.addEventListener("click", () => {
        this.showStockModal();
      });

    // Modal close buttons
    document
      .getElementById("close-stock-modal")
      ?.addEventListener("click", () => {
        this.hideStockModal();
      });

    document
      .getElementById("close-adjustment-modal")
      ?.addEventListener("click", () => {
        this.hideAdjustmentModal();
      });

    // Item action buttons (delegated events)
    document.addEventListener("click", (e) => {
      if (e.target.closest(".adjust-stock-btn")) {
        const itemId = e.target.closest(".adjust-stock-btn").dataset.itemId;
        this.showAdjustmentModal(itemId);
      } else if (e.target.closest(".view-history-btn")) {
        const itemId = e.target.closest(".view-history-btn").dataset.itemId;
        this.showStockHistory(itemId);
      }
    });
  }

  showStockModal(item = null) {
    const modal = document.getElementById("stock-modal");
    const title = document.getElementById("stock-modal-title");
    const content = document.getElementById("stock-modal-content");

    title.textContent = item ? "Edit Stock Item" : "Add Stock Item";
    content.innerHTML = this.createStockForm(item);
    modal.classList.remove("hidden");
  }

  createStockForm(item = null) {
    return `
      <form id="stock-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Paper Type *</label>
          <select id="paper-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required>
            <option value="">Select paper type</option>
            ${this.paperTypes
              .map(
                (type) => `
              <option value="${type._id}" ${
                  item?.paperType?._id === type._id ? "selected" : ""
                }>${type.name}</option>
            `
              )
              .join("")}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Size *</label>
            <input type="text" id="paper-size" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${
                     item?.size?.name || item?.size || ""
                   }" placeholder="A4, A3, etc." required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">GSM *</label>
            <input type="number" id="gsm" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${
                     item?.gsm || ""
                   }" placeholder="80, 100, etc." required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input type="number" id="quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${
                     item?.quantity || ""
                   }" placeholder="1000" required min="0">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
            <select id="unit" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required>
              <option value="sheets" ${
                item?.unit === "sheets" ? "selected" : ""
              }>Sheets</option>
              <option value="reams" ${
                item?.unit === "reams" ? "selected" : ""
              }>Reams</option>
              <option value="kg" ${
                item?.unit === "kg" ? "selected" : ""
              }>Kilograms</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
          <select id="supplier" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="company" ${
              item?.supplier === "company" ? "selected" : ""
            }>Company Stock</option>
            <option value="customer" ${
              item?.supplier === "customer" ? "selected" : ""
            }>Customer Provided</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Stock Level</label>
          <input type="number" id="min-stock" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                 value="${item?.minStock || 50}" placeholder="50" min="0">
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" id="cancel-stock-form" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
            Cancel
          </button>
          <button type="submit" class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
            ${item ? "Update Stock" : "Add Stock"}
          </button>
        </div>
      </form>
    `;
  }

  showAdjustmentModal(itemId) {
    const item = this.inventory.find((i) => i._id === itemId);
    if (!item) return;

    const modal = document.getElementById("adjustment-modal");
    const content = document.getElementById("adjustment-modal-content");

    content.innerHTML = this.createAdjustmentForm(item);
    modal.classList.remove("hidden");
  }

  createAdjustmentForm(item) {
    return `
      <form id="adjustment-form" class="space-y-4">
        <input type="hidden" id="item-id" value="${item._id}">
        
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 class="font-medium text-gray-900 mb-2">${
            item.paperType?.name || "Unknown Type"
          }</h4>
          <p class="text-sm text-gray-600">${item.size?.name || item.size} - ${
      item.gsm
    }gsm</p>
          <p class="text-sm text-gray-600">Current Stock: <span class="font-medium">${
            item.quantity
          } ${item.unit}</span></p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
          <select id="adjustment-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="add">Add Stock</option>
            <option value="remove">Remove Stock</option>
            <option value="set">Set Exact Amount</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <input type="number" id="adjustment-quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                 placeholder="Enter quantity" required min="0">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Reason</label>
          <textarea id="adjustment-reason" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                    placeholder="Reason for adjustment (optional)"></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" id="cancel-adjustment-form" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
            Cancel
          </button>
          <button type="submit" class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
            Apply Adjustment
          </button>
        </div>
      </form>
    `;
  }

  hideStockModal() {
    document.getElementById("stock-modal")?.classList.add("hidden");
  }

  hideAdjustmentModal() {
    document.getElementById("adjustment-modal")?.classList.add("hidden");
  }

  async refresh() {
    await this.loadInventoryData();
    this.renderInventory();
    this.updateStats();
    this.renderAlerts();
  }
}
